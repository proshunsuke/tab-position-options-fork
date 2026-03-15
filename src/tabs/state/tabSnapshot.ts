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

const getWindowKey = (windowId: number) => {
  return String(windowId);
};

const normalizeIndexes = (tabs: TabSnapshot[]) => {
  return [...tabs]
    .sort((left, right) => left.index - right.index)
    .map((tab, index) => ({
      ...tab,
      index,
    }));
};

const normalizeState = (state: WindowScopedTabSnapshot) => {
  return Object.fromEntries(
    Object.entries(state)
      .map(([windowId, tabs]) => [windowId, normalizeIndexes(tabs)])
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

  return normalizeState(groupedTabs);
};

const getWindowIds = (tabs: chrome.tabs.Tab[]) => {
  return new Set(tabs.map(tab => tab.windowId));
};

/**
 * 同期的に状態を設定
 * メモリは即座に更新し、ストレージへは遅延保存
 */
const setState = (value: WindowScopedTabSnapshot) => {
  tabSnapshotState = normalizeState(value);

  Promise.resolve().then(() => {
    chrome.storage.session.set({ tabSnapshot: tabSnapshotState }).catch(() => {});
  });
};

/**
 * ストレージから状態を初期化
 * Service Worker起動時に一度だけ呼び出される
 */
export const initializeTabSnapshot = async () => {
  const [result, tabs] = await Promise.all([
    chrome.storage.session.get<TabSnapshotStorage>("tabSnapshot"),
    chrome.tabs.query({}),
  ]);
  const currentState = groupTabsByWindow(tabs);
  const savedState = normalizeState(result.tabSnapshot ?? {});
  const openWindowIds = getWindowIds(tabs);
  const restoredState = Object.fromEntries(
    Object.entries(savedState).filter(([windowId]) => openWindowIds.has(Number(windowId))),
  );

  // Service Worker 再起動直後の最初のイベントでは、保存済みスナップショットのほうが
  // イベント発火前の並び順を保持しているため、同一 window ではそれを優先する。
  setState({
    ...currentState,
    ...restoredState,
  });
};

/**
 * 同期的に状態を取得
 */
export const getTabSnapshot = (windowId: number) => {
  return tabSnapshotState[getWindowKey(windowId)] ?? [];
};

export const getStoredTabSnapshot = async (windowId: number) => {
  const result = await chrome.storage.session.get<TabSnapshotStorage>("tabSnapshot");
  const savedState = normalizeState(result.tabSnapshot ?? {});
  return savedState[getWindowKey(windowId)] ?? [];
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
    [windowKey]: setActiveTabId(normalizeIndexes(tabs), nextTab.active ? nextTab.id : undefined),
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
    [windowKey]: normalizeIndexes(tabs),
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
};
