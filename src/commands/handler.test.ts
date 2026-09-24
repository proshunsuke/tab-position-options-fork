import { beforeEach, expect, test, vi } from "vitest";
import { handleCommand, setupCommandHandlers } from "@/src/commands/handler";
import { tabsPermissionRequest } from "@/src/permissions/optional";
import { clearPendingCloseTarget } from "@/src/tabs/state/pendingCloseTarget";
import { cancelActivationMove } from "@/src/tabs/tabOnActivate";

const state = vi.hoisted(() => ({
  active: 2,
  history: [1, 2],
  initialize: false,
  initializeAllStates: vi.fn(async () => {}),
}));
const permissionsRequest = vi.fn(async () => true);
vi.mock("@/src/state/initializer", () => ({
  needsInitialization: () => state.initialize,
  initializeAllStates: state.initializeAllStates,
}));
vi.mock("@/src/tabs/state/activationHistory", () => ({
  getActivationHistory: () => state.history,
  getTabFromActivationHistory: (_tabs: unknown, excluded: number[], history: number[]) =>
    history.findLast(id => !excluded.includes(id)) ?? null,
  recordTabActivation: (_window: number, id: number) => {
    state.history = [...state.history.filter(item => item !== id), id];
  },
}));
vi.mock("@/src/tabs/state/tabSnapshot", () => ({
  getActiveTabSnapshot: () => ({ id: state.active }),
  getTabSnapshot: () => [],
  setActiveTabInSnapshot: (_window: number, id: number) => {
    state.active = id;
  },
  moveTabInSnapshot: vi.fn(),
  refreshWindowTabSnapshot: vi.fn(async () => {}),
}));
vi.mock("@/src/tabs/state/pendingCloseTarget", () => ({ clearPendingCloseTarget: vi.fn() }));
vi.mock("@/src/tabs/tabOnActivate", () => ({ cancelActivationMove: vi.fn() }));
const tab = { id: 2, windowId: 10 } as chrome.tabs.Tab;

beforeEach(() => {
  vi.clearAllMocks();
  permissionsRequest.mockResolvedValue(true);
  state.active = 2;
  state.history = [1, 2];
  state.initialize = false;
  vi.stubGlobal("chrome", {
    commands: { onCommand: { addListener: vi.fn() } },
    permissions: { request: permissionsRequest },
    windows: { getLastFocused: vi.fn(async () => ({ id: 10 })) },
    tabs: {
      query: vi.fn(async () => []),
      update: vi.fn(async () => ({})),
      move: vi.fn(async () => ({})),
    },
  });
});

test("warm toggles call update immediately without queries or waiting, including rapid commands", async () => {
  const first = handleCommand("toggle-last-active", tab);
  expect(chrome.tabs.update).toHaveBeenNthCalledWith(1, 1, { active: true });
  const second = handleCommand("toggle-last-active", tab);
  expect(chrome.tabs.update).toHaveBeenNthCalledWith(2, 2, { active: true });
  expect(chrome.tabs.query).not.toHaveBeenCalled();
  expect(chrome.windows.getLastFocused).not.toHaveBeenCalled();
  expect(clearPendingCloseTarget).toHaveBeenCalledWith(10);
  expect(cancelActivationMove).toHaveBeenCalledWith(10);
  await Promise.all([first, second]);
});

test("unavailable history and unknown commands do nothing", async () => {
  state.history = [2];
  await handleCommand("toggle-last-active", tab);
  await handleCommand("unknown", tab);
  expect(chrome.tabs.update).not.toHaveBeenCalled();
  expect(chrome.tabs.query).not.toHaveBeenCalled();
});

test("cold commands initialize before using history and missing event tabs use focused window", async () => {
  state.initialize = true;
  const pending = handleCommand("toggle-last-active");
  expect(chrome.tabs.update).not.toHaveBeenCalled();
  await pending;
  expect(state.initializeAllStates).toHaveBeenCalledOnce();
  expect(chrome.windows.getLastFocused).toHaveBeenCalledOnce();
  expect(chrome.tabs.update).toHaveBeenCalledWith(1, { active: true });
});

test("command listener forwards Chrome events to the handler", async () => {
  setupCommandHandlers();
  const listener = vi.mocked(chrome.commands.onCommand.addListener).mock.calls[0][0];
  listener("toggle-last-active", tab);
  expect(chrome.tabs.update).toHaveBeenCalledWith(1, { active: true });
  expect(chrome.permissions.request).not.toHaveBeenCalled();
});

test.each(["sort-title", "sort-url"] as const)(
  "%s requests tab access before sorting",
  async command => {
    setupCommandHandlers();
    const listener = vi.mocked(chrome.commands.onCommand.addListener).mock.calls[0][0];

    listener(command, tab);

    expect(chrome.permissions.request).toHaveBeenCalledWith(tabsPermissionRequest);
    await vi.waitFor(() => expect(chrome.tabs.query).toHaveBeenCalledWith({ windowId: 10 }));
  },
);

test("declining tab access cancels a sorting shortcut", async () => {
  permissionsRequest.mockResolvedValueOnce(false);
  setupCommandHandlers();
  const listener = vi.mocked(chrome.commands.onCommand.addListener).mock.calls[0][0];

  listener("sort-title", tab);

  expect(chrome.permissions.request).toHaveBeenCalledWith(tabsPermissionRequest);
  expect(chrome.tabs.query).not.toHaveBeenCalled();
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(chrome.tabs.query).not.toHaveBeenCalled();
});

test("sort failure releases the window for retry", async () => {
  vi.mocked(chrome.tabs.query).mockRejectedValueOnce(new Error("Window closed"));
  await expect(handleCommand("sort-title", tab)).rejects.toThrow("Window closed");
  await handleCommand("sort-title", tab);
  expect(chrome.tabs.query).toHaveBeenCalledTimes(2);
});

test("sorting skips unchanged positions and overlapping sorts, and waits only for dependent moves", async () => {
  const tabs = ["c", "a", "b"].map((title, index) => ({
    id: index + 1,
    index,
    title,
    pinned: false,
    groupId: -1,
  })) as chrome.tabs.Tab[];
  chrome.tabs.query = vi.fn(async () => tabs) as typeof chrome.tabs.query;
  let finishMove = () => {};
  vi.mocked(chrome.tabs.move).mockImplementationOnce(
    () =>
      new Promise<chrome.tabs.Tab>(resolve => {
        finishMove = () => resolve(tabs[1]);
      }),
  );
  const sorting = handleCommand("sort-title", tab);
  await Promise.resolve();
  expect(chrome.tabs.move).toHaveBeenCalledTimes(1);
  expect(chrome.tabs.move).toHaveBeenNthCalledWith(1, 2, { index: 0 });
  await handleCommand("sort-url", tab);
  expect(chrome.tabs.query).toHaveBeenCalledTimes(1);
  finishMove();
  await sorting;
  expect(chrome.tabs.move).toHaveBeenCalledTimes(2);
  expect(chrome.tabs.move).toHaveBeenNthCalledWith(2, 3, { index: 1 });
  expect(cancelActivationMove).toHaveBeenCalledWith(10);
});
