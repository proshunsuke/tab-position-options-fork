export type TabSnapshot = {
  id: number;
  index: number;
  active: boolean;
  openerTabId?: number;
};

type TabSnapshotStorage = {
  tabSnapshot?: WindowScopedTabSnapshot;
};

type WindowScopedTabSnapshot = Record<string, TabSnapshot[]>;

/**
 * タブスナップショットの状態管理
 * グローバルメモリ状態として管理
 */
let tabSnapshotState: WindowScopedTabSnapshot = {};
let restoredTabSnapshotState: WindowScopedTabSnapshot = {};
let pendingStorageWrite = Promise.resolve();

const getWindowKey = (windowId: number) => {
  return String(windowId);
};

const reindexTabs = (tabs: TabSnapshot[]) => {
  return [...tabs].map((tab, index) => ({
    ...tab,
    index,
  }));
};

const sortAndReindexTabs = (tabs: TabSnapshot[]) => {
  return [...tabs]
    .sort((left, right) => left.index - right.index)
    .map((tab, index) => ({
      ...tab,
      index,
    }));
};

const reindexState = (state: WindowScopedTabSnapshot) => {
  return Object.fromEntries(
    Object.entries(state)
      .map(([windowId, tabs]) => [windowId, reindexTabs(tabs)])
      .filter((entry): entry is [string, TabSnapshot[]] => entry[1].length > 0),
  );
};

const sortAndReindexState = (state: WindowScopedTabSnapshot) => {
  return Object.fromEntries(
    Object.entries(state)
      .map(([windowId, tabs]) => [windowId, sortAndReindexTabs(tabs)])
      .filter((entry): entry is [string, TabSnapshot[]] => entry[1].length > 0),
  );
};

const setActiveTabId = (tabs: TabSnapshot[], activeTabId?: number) => {
  if (activeTabId === undefined) {
    return tabs;
  }

  return tabs.map(tab => ({
    ...tab,
    active: tab.id === activeTabId,
  }));
};

const toTabSnapshot = (tab: chrome.tabs.Tab) => {
  if (!tab.id) {
    return null;
  }

  return {
    id: tab.id,
    index: tab.index,
    active: tab.active,
    openerTabId: tab.openerTabId,
  } as TabSnapshot;
};

const groupTabsByWindow = (tabs: chrome.tabs.Tab[]) => {
  const groupedTabs: WindowScopedTabSnapshot = {};

  for (const tab of tabs) {
    const snapshot = toTabSnapshot(tab);
    if (!snapshot) {
      continue;
    }

    const windowKey = getWindowKey(tab.windowId);
    groupedTabs[windowKey] ??= [];
    groupedTabs[windowKey].push(snapshot);
  }

  return sortAndReindexState(groupedTabs);
};

/**
 * 同期的に状態を設定
 * メモリは即座に更新し、ストレージへは遅延保存
 */
const setState = (value: WindowScopedTabSnapshot) => {
  tabSnapshotState = reindexState(value);

  pendingStorageWrite = pendingStorageWrite.finally(() => {
    return chrome.storage.session.set({ tabSnapshot: tabSnapshotState }).catch(() => {});
  });
};

/**
 * すべてのウィンドウの live state からスナップショットを再構築
 */
export const refreshAllTabSnapshots = async () => {
  const tabs = await chrome.tabs.query({});
  setState(groupTabsByWindow(tabs));
};

/**
 * 特定ウィンドウの live state からスナップショットを再構築
 */
export const refreshWindowTabSnapshot = async (windowId: number) => {
  const windowKey = getWindowKey(windowId);
  const tabs = await chrome.tabs.query({ windowId });
  const nextWindowTabs = tabs.map(toTabSnapshot).filter((tab): tab is TabSnapshot => tab !== null);
  const nextState = {
    ...tabSnapshotState,
  };

  if (nextWindowTabs.length === 0) {
    delete nextState[windowKey];
  } else {
    nextState[windowKey] = sortAndReindexTabs(nextWindowTabs);
  }

  setState(nextState);
};

/**
 * live state を優先してスナップショットを初期化
 * Service Worker起動時に一度だけ呼び出される
 */
export const initializeTabSnapshot = async () => {
  const result = await chrome.storage.session.get<TabSnapshotStorage>("tabSnapshot");
  restoredTabSnapshotState = sortAndReindexState(result.tabSnapshot ?? {});
  await refreshAllTabSnapshots();
};

/**
 * 同期的に状態を取得
 */
export const getTabSnapshot = (windowId: number) => {
  return tabSnapshotState[getWindowKey(windowId)] ?? [];
};

export const getRestoredTabSnapshot = (windowId: number) => {
  return restoredTabSnapshotState[getWindowKey(windowId)] ?? [];
};

export const getTabSnapshotById = (windowId: number, tabId: number) => {
  return getTabSnapshot(windowId).find(tab => tab.id === tabId) ?? null;
};

export const getActiveTabSnapshot = (windowId: number) => {
  return getTabSnapshot(windowId).find(tab => tab.active) ?? null;
};

export const addTabToSnapshot = (tab: chrome.tabs.Tab) => {
  const nextTab = toTabSnapshot(tab);
  if (!nextTab) {
    return;
  }

  const windowId = tab.windowId;
  const windowKey = getWindowKey(windowId);
  const tabs = getTabSnapshot(windowId).filter(entry => entry.id !== nextTab.id);
  const insertIndex = Math.max(0, Math.min(nextTab.index, tabs.length));

  tabs.splice(insertIndex, 0, nextTab);
  setState({
    ...tabSnapshotState,
    [windowKey]: setActiveTabId(reindexTabs(tabs), nextTab.active ? nextTab.id : undefined),
  });
};

export const setActiveTabInSnapshot = (windowId: number, tabId: number) => {
  const windowKey = getWindowKey(windowId);
  const tabs = getTabSnapshot(windowId);
  if (!tabs.some(tab => tab.id === tabId)) {
    return;
  }

  setState({
    ...tabSnapshotState,
    [windowKey]: tabs.map(tab => ({
      ...tab,
      active: tab.id === tabId,
    })),
  });
};

export const moveTabInSnapshot = (windowId: number, tabId: number, toIndex: number) => {
  const windowKey = getWindowKey(windowId);
  const tabs = [...getTabSnapshot(windowId)];
  const currentIndex = tabs.findIndex(tab => tab.id === tabId);
  if (currentIndex === -1) {
    return;
  }

  const [tab] = tabs.splice(currentIndex, 1);
  const insertIndex = Math.max(0, Math.min(toIndex, tabs.length));
  tabs.splice(insertIndex, 0, tab);

  setState({
    ...tabSnapshotState,
    [windowKey]: reindexTabs(tabs),
  });
};

export const removeTabFromSnapshot = (windowId: number, tabId: number) => {
  const windowKey = getWindowKey(windowId);
  const tabs = getTabSnapshot(windowId);
  const removedTab = tabs.find(tab => tab.id === tabId) ?? null;
  if (!removedTab) {
    return null;
  }

  const remainingTabs = tabs.filter(tab => tab.id !== tabId);
  const nextState = {
    ...tabSnapshotState,
  };

  if (remainingTabs.length === 0) {
    delete nextState[windowKey];
  } else {
    nextState[windowKey] = remainingTabs;
  }

  setState(nextState);
  return removedTab;
};

/**
 * メモリをリセット（テスト用）
 * @internal
 */
export const resetTabSnapshotState = () => {
  tabSnapshotState = {};
  restoredTabSnapshotState = {};
  pendingStorageWrite = Promise.resolve();
};
