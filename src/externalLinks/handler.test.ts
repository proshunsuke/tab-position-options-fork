import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { handleExternalLink } from "@/src/externalLinks/handler";
import { consumeExternalLinkTab } from "@/src/externalLinks/state";
import { DEFAULT_SETTINGS } from "@/src/types";

const state = vi.hoisted(() => ({
  settings: {} as typeof DEFAULT_SETTINGS,
  cold: false,
  popup: false,
  normalWindow: 20 as number | null,
  initialize: vi.fn(async () => {}),
}));
vi.mock("@/src/settings/state/appData", () => ({ getSettings: () => state.settings }));
vi.mock("@/src/state/initializer", () => ({
  needsInitialization: () => state.cold,
  initializeAllStates: state.initialize,
}));
vi.mock("@/src/tabs/sessionRestoreDetector", () => ({ isSessionRestoreInProgress: () => false }));
vi.mock("@/src/tabs/state/popup", () => ({
  getWindowSnapshot: () => ({ type: state.popup ? "popup" : "normal" }),
  getNormalWindowId: () => state.normalWindow,
}));
vi.mock("@/src/tabs/state/tabSnapshot", () => ({
  getActiveTabSnapshot: () => ({ id: 2 }),
  getTabSnapshot: () => [
    { id: 1, index: 0, pinned: true },
    { id: 2, index: 1, pinned: false },
    { id: 3, index: 2, pinned: false },
  ],
}));
const message = {
  type: "external-link",
  pageUrl: "https://page.test/",
  url: "https://link.test/Case?Token=A",
} as const;
const sender = {
  id: "extension",
  url: message.pageUrl,
  tab: { id: 2, windowId: 10 } as chrome.tabs.Tab,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  state.cold = false;
  state.popup = false;
  state.normalWindow = 20;
  state.settings = { ...DEFAULT_SETTINGS, externalLinks: { enabled: true, urlRules: [] } };
  vi.stubGlobal("chrome", {
    runtime: { id: "extension" },
    storage: { local: { get: vi.fn() } },
    windows: { update: vi.fn(async () => ({})) },
    tabs: {
      create: vi.fn(async () => ({ id: 90, windowId: 10 })),
      query: vi.fn(),
      update: vi.fn(),
      move: vi.fn(),
    },
  });
});
afterEach(() => {
  vi.runAllTimers();
  vi.useRealTimers();
});

test("warm creation calls the API synchronously with final placement and activation", async () => {
  state.settings.newTab = { position: "left", openInBackground: true };
  const pending = handleExternalLink(message, sender);
  expect(chrome.tabs.create).toHaveBeenCalledWith({
    windowId: 10,
    openerTabId: 2,
    url: message.url,
    active: false,
    index: 1,
  });
  expect(chrome.tabs.query).not.toHaveBeenCalled();
  expect(chrome.storage.local.get).not.toHaveBeenCalled();
  expect(state.initialize).not.toHaveBeenCalled();
  await pending;
  expect(chrome.tabs.update).not.toHaveBeenCalled();
  expect(chrome.tabs.move).not.toHaveBeenCalled();
});

test.each(["foreground", "background"] as const)(
  "explicit %s overrides the opposite New Tab rule",
  async active => {
    state.settings.externalLinks.urlRules = [
      { url: "link.test", action: active === "foreground" ? "new-link" : "background-link" },
    ];
    state.settings.newTab = {
      position: "default",
      openInBackground: false,
      urlRules: [
        {
          url: "link.test",
          position: "first",
          active: active === "foreground" ? "background" : "foreground",
        },
      ],
    };
    await handleExternalLink(message, sender);
    expect(chrome.tabs.create).toHaveBeenCalledWith(
      expect.objectContaining({ active: active === "foreground", index: 1 }),
    );
  },
);

test("Tab on Activate is folded into initial placement and cold starts wait only for initialization", async () => {
  state.cold = true;
  state.settings.tabOnActivate = { behavior: "last" };
  state.settings.newTab = { position: "first", openInBackground: false };
  const pending = handleExternalLink(message, sender);
  expect(chrome.tabs.create).not.toHaveBeenCalled();
  await pending;
  expect(chrome.tabs.create).toHaveBeenCalledWith(
    expect.objectContaining({ active: true, index: 3 }),
  );
});

test.each(["before", "after"])(
  "creation markers survive onCreated %s create completion",
  async order => {
    const pending = handleExternalLink(message, sender);
    if (order === "after") {
      await pending;
    }
    const tab = {
      id: 90,
      windowId: 10,
      // Chrome can report the opener only after onCreated.
      pendingUrl: message.url,
    } as chrome.tabs.Tab;
    expect(consumeExternalLinkTab({ ...tab, windowId: 20, id: 91 })).toBe(false);
    expect(consumeExternalLinkTab(tab)).toBe(true);
    expect(consumeExternalLinkTab(tab)).toBe(false);
    await pending;
  },
);

test("failed creation cleans up its marker; invalid senders never create tabs", async () => {
  vi.mocked(chrome.tabs.create).mockRejectedValueOnce(new Error("Window closed"));
  await expect(handleExternalLink(message, sender)).rejects.toThrow("Window closed");
  expect(
    consumeExternalLinkTab({
      id: 90,
      windowId: 10,
      openerTabId: 2,
      url: message.url,
    } as chrome.tabs.Tab),
  ).toBe(false);
  vi.mocked(chrome.tabs.create).mockClear();
  await handleExternalLink(message, { ...sender, url: "https://wrong.test" });
  await handleExternalLink(message, { ...sender, id: "other-extension" });
  await handleExternalLink({ ...message, url: "javascript:alert(1)" }, sender);
  expect(chrome.tabs.create).not.toHaveBeenCalled();
});

test.each([20, null])(
  "popup links choose a normal destination (%s) without querying",
  async windowId => {
    state.popup = true;
    state.normalWindow = windowId;
    state.settings.newTab = { position: "last", openInBackground: false };
    vi.mocked(chrome.tabs.create).mockImplementationOnce(() =>
      Promise.resolve({
        id: 90,
        windowId: 20,
      } as chrome.tabs.Tab),
    );
    const pending = handleExternalLink(message, sender);
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      windowId: windowId ?? 10,
      url: message.url,
      active: true,
      index: windowId === null ? 0 : 3,
    });
    expect(chrome.tabs.query).not.toHaveBeenCalled();
    expect(chrome.windows.update).not.toHaveBeenCalled();
    expect(
      consumeExternalLinkTab({ id: 90, windowId: 20, pendingUrl: message.url } as chrome.tabs.Tab),
    ).toBe(true);
    await pending;
    expect(chrome.windows.update).toHaveBeenCalledWith(20, { focused: true });
  },
);
