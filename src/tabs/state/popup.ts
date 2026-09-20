type WindowSnapshot = { type?: chrome.windows.Window["type"]; incognito: boolean };
type PopupState = {
  lastNormalWindowId: number | null;
  pending: Record<string, { targetWindowId: number | null }>;
};

let state: PopupState = { lastNormalWindowId: null, pending: {} };
let windows = new Map<number, WindowSnapshot>();
let initialPopups = new Set<number>();
let focusedWindowId: number | null = null;
let pendingStorageWrite = Promise.resolve();
const popupTabs = new Map<number, chrome.tabs.Tab>();
const navigationUrls = new Map<number, string>();
const movingTabs = new Set<number>();
const committedNavigations = new Map<
  number,
  chrome.webNavigation.WebNavigationTransitionCallbackDetails
>();

export const initializePopupState = async () => {
  const [stored, liveWindows] = await Promise.all([
    chrome.storage.session.get<{ popupState?: PopupState }>("popupState"),
    chrome.windows.getAll({ populate: true }),
  ]);
  windows = new Map();
  initialPopups = new Set();
  popupTabs.clear();
  for (const window of liveWindows) {
    if (window.id === undefined) {
      continue;
    }
    windows.set(window.id, { type: window.type, incognito: window.incognito });
    if (window.type === "popup") {
      if (!stored.popupState) {
        initialPopups.add(window.id);
      }
      for (const tab of window.tabs ?? []) {
        if (tab.id !== undefined) {
          popupTabs.set(tab.id, tab);
        }
      }
    }
  }
  const focusedNormal = liveWindows.find(window => window.type === "normal" && window.focused);
  const savedId = stored.popupState?.lastNormalWindowId;
  state = {
    lastNormalWindowId:
      focusedNormal?.id ??
      (savedId !== undefined && savedId !== null && windows.get(savedId)?.type === "normal"
        ? savedId
        : null),
    pending: Object.fromEntries(
      Object.entries(stored.popupState?.pending ?? {}).filter(
        ([id]) => windows.get(Number(id))?.type === "popup",
      ),
    ),
  };
  persistState();
};

export const getWindowSnapshot = (windowId: number) => windows.get(windowId);
export const getPendingPopup = (windowId: number) => state.pending[windowId];
export const getPopupTab = (tabId: number) => popupTabs.get(tabId);
export const getPopupTabs = (windowId: number) =>
  [...popupTabs.values()].filter(tab => tab.windowId === windowId);
export const getPopupNavigationUrl = (tabId: number) => navigationUrls.get(tabId);
export const isPopupMoving = (tabId: number) => movingTabs.has(tabId);

export const recordPopupWindow = (window: chrome.windows.Window, eligible: boolean) => {
  if (window.id === undefined) {
    return;
  }
  windows.set(window.id, { type: window.type, incognito: window.incognito });
  if (window.type === "normal" && (window.focused || focusedWindowId === window.id)) {
    recordWindowFocus(window.id);
  }
  if (window.type === "popup" && eligible && !initialPopups.has(window.id)) {
    state.pending[window.id] ??= { targetWindowId: state.lastNormalWindowId };
    persistState();
  }
  for (const tab of window.tabs ?? []) {
    recordPopupTab(tab);
  }
};

export const recordWindowFocus = (windowId: number) => {
  if (windowId < 0) {
    return;
  }
  focusedWindowId = windowId;
  if (windows.get(windowId)?.type === "normal") {
    state.lastNormalWindowId = windowId;
    persistState();
  }
};

export const recordPopupTab = (tab: chrome.tabs.Tab) => {
  if (tab.id !== undefined) {
    popupTabs.set(tab.id, tab);
  }
};

export const recordPopupUrl = (tabId: number, url: string) => {
  navigationUrls.set(tabId, url);
};

export const beginPopupMove = (tabId: number) => movingTabs.add(tabId);
export const finishPopupMove = (tabId: number) => movingTabs.delete(tabId);

export const deferPopupNavigation = (
  details: chrome.webNavigation.WebNavigationTransitionCallbackDetails,
) => {
  if (!movingTabs.has(details.tabId)) {
    return false;
  }
  committedNavigations.set(details.tabId, details);
  return true;
};

export const consumePopupNavigation = (tabId: number) => {
  const details = committedNavigations.get(tabId);
  committedNavigations.delete(tabId);
  return details;
};

export const clearPendingPopup = (windowId: number) => {
  if (state.pending[windowId]) {
    delete state.pending[windowId];
    persistState();
  }
};

export const clearPopupTab = (tabId: number) => {
  popupTabs.delete(tabId);
  navigationUrls.delete(tabId);
};

export const removePopupWindow = (windowId: number) => {
  windows.delete(windowId);
  initialPopups.delete(windowId);
  if (state.lastNormalWindowId === windowId) {
    state.lastNormalWindowId = null;
  }
  delete state.pending[windowId];
  // 移動途中のタブはAPI完了時に後片付けする。
  for (const tab of getPopupTabs(windowId)) {
    if (tab.id !== undefined && !movingTabs.has(tab.id)) {
      clearPopupTab(tab.id);
    }
  }
  persistState();
};

export const resetPopupState = () => {
  state = { lastNormalWindowId: null, pending: {} };
  windows.clear();
  initialPopups.clear();
  focusedWindowId = null;
  popupTabs.clear();
  navigationUrls.clear();
  movingTabs.clear();
  committedNavigations.clear();
  pendingStorageWrite = Promise.resolve();
};

const persistState = () => {
  pendingStorageWrite = pendingStorageWrite.finally(() =>
    chrome.storage.session.set({ popupState: state }).catch(() => {}),
  );
};
