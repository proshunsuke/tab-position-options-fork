export type TabSnapshot = {
  id: number;
  index: number;
  active: boolean;
  openerTabId?: number;
};

type TabSnapshotStorage = {
  tabSnapshot?: TabSnapshot[];
};

/**
 * タブスナップショットの状態管理
 * グローバルメモリ状態として管理
 */
let tabSnapshotState: TabSnapshot[] = [];

const normalizeIndexes = (tabs: TabSnapshot[]) => {
  return [...tabs]
    .sort((left, right) => left.index - right.index)
    .map((tab, index) => ({
      ...tab,
      index,
    }));
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

/**
 * 同期的に状態を設定
 * メモリは即座に更新し、ストレージへは遅延保存
 */
const setState = (value: TabSnapshot[]) => {
  tabSnapshotState = normalizeIndexes(value);

  Promise.resolve().then(() => {
    chrome.storage.session.set({ tabSnapshot: tabSnapshotState }).catch(() => {});
  });
};

/**
 * ストレージから状態を初期化
 * Service Worker起動時に一度だけ呼び出される
 */
export const initializeTabSnapshot = async () => {
  const result = await chrome.storage.session.get<TabSnapshotStorage>("tabSnapshot");
  if (result.tabSnapshot && result.tabSnapshot.length > 0) {
    setState(result.tabSnapshot);
    return;
  }

  const tabs = await chrome.tabs.query({ currentWindow: true });
  setState(tabs.map(toTabSnapshot).filter((tab): tab is TabSnapshot => tab !== null));
};

/**
 * 同期的に状態を取得
 */
export const getTabSnapshot = () => {
  return tabSnapshotState;
};

export const getTabSnapshotById = (tabId: number) => {
  return getTabSnapshot().find(tab => tab.id === tabId) ?? null;
};

export const getActiveTabSnapshot = () => {
  return getTabSnapshot().find(tab => tab.active) ?? null;
};

export const addTabToSnapshot = (tab: chrome.tabs.Tab) => {
  const nextTab = toTabSnapshot(tab);
  if (!nextTab) {
    return;
  }

  const tabs = getTabSnapshot().filter(entry => entry.id !== nextTab.id);
  const insertIndex = Math.max(0, Math.min(nextTab.index, tabs.length));

  tabs.splice(insertIndex, 0, nextTab);
  setState(setActiveTabId(normalizeIndexes(tabs), nextTab.active ? nextTab.id : undefined));
};

export const setActiveTabInSnapshot = (tabId: number) => {
  const tabs = getTabSnapshot();
  if (!tabs.some(tab => tab.id === tabId)) {
    return;
  }

  setState(
    tabs.map(tab => ({
      ...tab,
      active: tab.id === tabId,
    })),
  );
};

export const moveTabInSnapshot = (tabId: number, toIndex: number) => {
  const tabs = [...getTabSnapshot()];
  const currentIndex = tabs.findIndex(tab => tab.id === tabId);
  if (currentIndex === -1) {
    return;
  }

  const [tab] = tabs.splice(currentIndex, 1);
  const insertIndex = Math.max(0, Math.min(toIndex, tabs.length));
  tabs.splice(insertIndex, 0, tab);

  setState(normalizeIndexes(tabs));
};

export const removeTabFromSnapshot = (tabId: number) => {
  const tabs = getTabSnapshot();
  const removedTab = tabs.find(tab => tab.id === tabId) ?? null;
  if (!removedTab) {
    return null;
  }

  setState(tabs.filter(tab => tab.id !== tabId));
  return removedTab;
};

/**
 * メモリをリセット（テスト用）
 * @internal
 */
export const resetTabSnapshotState = () => {
  tabSnapshotState = [];
};
