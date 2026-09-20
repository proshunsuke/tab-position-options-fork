import { beforeEach, expect, test, vi } from "vitest";
import { handleNewTab } from "@/src/tabs/handleNewTab";
import { handleNavigationCommitted } from "@/src/tabs/loadingPage";
import {
  handlePopupNavigationTarget,
  handlePopupTabCreated,
  handlePopupUrl,
  handleWindowCreated,
  handleWindowFocusChanged,
  handleWindowRemoved,
} from "@/src/tabs/popup";
import {
  deferPopupNavigation,
  initializePopupState,
  isPopupMoving,
  resetPopupState,
} from "@/src/tabs/state/popup";

const fixture = vi.hoisted(() => ({
  settings: { popup: { openAsNewTab: true, exceptions: [] as { url: string }[] } },
  restoring: false,
}));
vi.mock("@/src/settings/state/appData", () => ({ getSettings: () => fixture.settings }));
vi.mock("@/src/state/initializer", () => ({ needsInitialization: () => false }));
vi.mock("@/src/tabs/handleNewTab", () => ({ handleNewTab: vi.fn() }));
vi.mock("@/src/tabs/loadingPage", () => ({ handleNavigationCommitted: vi.fn() }));
vi.mock("@/src/tabs/sessionRestoreDetector", () => ({
  isSessionRestoreInProgress: () => fixture.restoring,
}));
vi.mock("@/src/tabs/state/activationHistory", () => ({ cleanupActivationHistory: vi.fn() }));
vi.mock("@/src/tabs/tabOnActivate", () => ({ cancelActivationMove: vi.fn() }));
vi.mock("@/src/tabs/state/tabSnapshot", () => ({
  addTabToSnapshot: vi.fn(),
  findTabWindowId: () => null,
  refreshWindowTabSnapshot: vi.fn(),
  removeTabFromSnapshot: vi.fn(),
}));

let stored: Record<string, unknown>;
let liveWindows: chrome.windows.Window[];
const source = { id: 1, type: "normal", focused: true, incognito: false } as chrome.windows.Window;
const popup = { id: 3, type: "popup", focused: false, incognito: false } as chrome.windows.Window;
const tab = {
  id: 10,
  windowId: 3,
  index: 0,
  incognito: false,
  active: true,
  url: "",
} as chrome.tabs.Tab;

beforeEach(async () => {
  resetPopupState();
  vi.clearAllMocks();
  fixture.settings = { popup: { openAsNewTab: true, exceptions: [] } };
  fixture.restoring = false;
  stored = { popupState: { lastNormalWindowId: 1, pending: {} } };
  liveWindows = [source];
  vi.stubGlobal("chrome", {
    storage: {
      session: {
        get: vi.fn(async () => structuredClone(stored)),
        set: vi.fn(async (value: Record<string, unknown>) => {
          Object.assign(stored, structuredClone(value));
        }),
      },
    },
    windows: { getAll: vi.fn(async () => liveWindows), remove: vi.fn() },
    tabs: { move: vi.fn(() => new Promise<chrome.tabs.Tab>(() => {})), query: vi.fn() },
  });
  await initializePopupState();
  await Promise.resolve();
  vi.mocked(chrome.storage.session.get).mockClear();
  vi.mocked(chrome.windows.getAll).mockClear();
});

for (const order of ["window-tab-url", "tab-window-url", "url-tab-window"] as const) {
  test(`dispatches one move immediately once required events arrive: ${order}`, async () => {
    for (const event of order.split("-")) {
      if (event === "window") {
        void handleWindowCreated(popup);
      }
      if (event === "tab") {
        handlePopupTabCreated(tab);
      }
      if (event === "url") {
        handlePopupUrl(tab.id!, "https://site.test/page");
      }
    }
    // No await between event dispatch and this assertion.
    expect(chrome.tabs.move).toHaveBeenCalledExactlyOnceWith(10, { windowId: 1, index: -1 });
    expect(chrome.tabs.query).not.toHaveBeenCalled();
    expect(chrome.windows.getAll).not.toHaveBeenCalled();
    expect(chrome.storage.session.get).not.toHaveBeenCalled();
    handlePopupUrl(10, "https://site.test/page");
    expect(chrome.tabs.move).toHaveBeenCalledTimes(1);
  });
}

test("uses pendingUrl immediately without waiting for navigation or storage", () => {
  void handleWindowCreated(popup);
  handlePopupTabCreated({ ...tab, pendingUrl: "https://site.test/page" });
  expect(chrome.tabs.move).toHaveBeenCalledTimes(1);
});

test("uses the last focused normal window, not the opener or the popup", async () => {
  await handleWindowCreated({ ...source, id: 2, focused: false });
  await handleWindowFocusChanged(2);
  await handleWindowCreated(popup);
  await handleWindowFocusChanged(3);
  handlePopupTabCreated({ ...tab, openerTabId: 100, url: "https://site.test/" });
  expect(chrome.tabs.move).toHaveBeenCalledWith(10, { windowId: 2, index: -1 });
});

for (const scenario of [
  "disabled",
  "exception",
  "internal",
  "incognito",
  "no-target",
  "restoring",
] as const) {
  test(`preserves the popup: ${scenario}`, async () => {
    if (scenario === "disabled") {
      fixture.settings.popup.openAsNewTab = false;
    }
    if (scenario === "exception") {
      fixture.settings.popup.exceptions = [{ url: "site\\.test" }];
    }
    if (scenario === "no-target") {
      await handleWindowRemoved(1);
    }
    fixture.restoring = scenario === "restoring";
    await handleWindowCreated(popup);
    handlePopupTabCreated({
      ...tab,
      incognito: scenario === "incognito",
      url: scenario === "internal" ? "chrome-extension://other/page" : "https://site.test/",
    });
    expect(chrome.tabs.move).not.toHaveBeenCalled();
    expect(chrome.windows.remove).not.toHaveBeenCalled();
  });
}

test("waits for an actual URL only when blank-page exceptions need it", async () => {
  fixture.settings.popup.exceptions = [{ url: "keep.test" }];
  await handleWindowCreated(popup);
  handlePopupTabCreated({ ...tab, url: "about:blank" });
  expect(chrome.tabs.move).not.toHaveBeenCalled();
  handlePopupUrl(10, "https://keep.test/login");
  handlePopupUrl(10, "https://elsewhere.test/");
  expect(chrome.tabs.move).not.toHaveBeenCalled();
});

test("retains a pending blank popup and its destination across a worker restart", async () => {
  fixture.settings.popup.exceptions = [{ url: "keep.test" }];
  await handleWindowCreated(popup);
  handlePopupTabCreated({ ...tab, url: "about:blank" });
  await Promise.resolve();
  await Promise.resolve();
  liveWindows = [
    { ...source, focused: false },
    { ...popup, focused: true, tabs: [{ ...tab, url: "about:blank" }] },
  ];
  resetPopupState();
  await initializePopupState();
  handlePopupUrl(10, "https://move.test/");
  expect(chrome.tabs.move).toHaveBeenCalledWith(10, { windowId: 1, index: -1 });
});

test("does not convert existing popups on a fresh browser session", async () => {
  stored = {};
  liveWindows = [source, { ...popup, tabs: [tab] }];
  resetPopupState();
  await initializePopupState();
  await handleWindowCreated(popup);
  handlePopupTabCreated({ ...tab, url: "https://site.test/" });
  expect(chrome.tabs.move).not.toHaveBeenCalled();
});

test("replays an early normal-window tab without converting it", async () => {
  handlePopupTabCreated({ ...tab, windowId: 4 });
  await handleWindowCreated({ ...source, id: 4 });
  expect(handleNewTab).toHaveBeenCalledWith({ ...tab, windowId: 4 });
  expect(chrome.tabs.move).not.toHaveBeenCalled();
});

test("a failed move leaves the popup intact and does not repeatedly retry", async () => {
  vi.mocked(chrome.tabs.move).mockRejectedValue(new Error("No window with id: 1"));
  await handleWindowCreated(popup);
  handlePopupTabCreated({ ...tab, url: "https://site.test/" });
  await vi.waitFor(() => expect(isPopupMoving(10)).toBe(false));
  handlePopupUrl(10, "https://site.test/again");
  expect(chrome.tabs.move).toHaveBeenCalledTimes(1);
  expect(chrome.windows.remove).not.toHaveBeenCalled();
});

test("defers Loading Page until the tab has reached the normal window", async () => {
  let complete!: (tab: chrome.tabs.Tab) => void;
  vi.mocked(chrome.tabs.move).mockImplementation(
    () =>
      new Promise(resolve => {
        complete = resolve;
      }),
  );
  await handleWindowCreated(popup);
  handlePopupTabCreated(tab);
  await handlePopupNavigationTarget({
    tabId: 10,
    sourceTabId: 100,
    sourceFrameId: 0,
    sourceProcessId: 1,
    timeStamp: 1,
    url: "https://site.test/",
  });
  const navigation = {
    tabId: 10,
    url: "https://site.test/",
  } as chrome.webNavigation.WebNavigationTransitionCallbackDetails;
  expect(deferPopupNavigation(navigation)).toBe(true);
  expect(handleNavigationCommitted).not.toHaveBeenCalled();
  complete({ ...tab, windowId: 1 });
  await vi.waitFor(() => expect(handleNavigationCommitted).toHaveBeenCalledWith(navigation));
});
