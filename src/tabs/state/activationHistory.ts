import type { TabSnapshot } from "@/src/tabs/state/tabSnapshot";

type ActivationHistoryStorage = {
  tabActivationHistory?: Record<string, number[]>;
};

const MAX_HISTORY_SIZE = 50;

/**
 * タブのアクティベーション履歴の状態管理
 * グローバルメモリ状態として管理
 */
let tabActivationHistoryState: Record<string, number[]> = {};
let restoredActivationHistoryState: Record<string, number[]> = {};
let pendingStorageWrite = Promise.resolve();

const getWindowKey = (windowId: number) => {
  return String(windowId);
};

const setWindowState = (windowId: number, history: number[]) => {
  const windowKey = getWindowKey(windowId);
  const nextState = {
    ...tabActivationHistoryState,
  };

  if (history.length === 0) {
    delete nextState[windowKey];
  } else {
    nextState[windowKey] = history;
  }

  setState(nextState);
};

/**
 * ストレージから状態を初期化
 * Service Worker起動時に一度だけ呼び出される
 */
export const initializeActivationHistory = async () => {
  const [result, tabs] = await Promise.all([
    chrome.storage.session.get<ActivationHistoryStorage>("tabActivationHistory"),
    chrome.tabs.query({}),
  ]);

  const savedHistory = result.tabActivationHistory ?? {};
  restoredActivationHistoryState = savedHistory;
  const availableTabIdsByWindow = new Map<number, Set<number>>();
  const activeTabIdsByWindow = new Map<number, number>();

  for (const tab of tabs) {
    if (!tab.id) {
      continue;
    }

    const availableTabIds = availableTabIdsByWindow.get(tab.windowId) ?? new Set<number>();
    availableTabIds.add(tab.id);
    availableTabIdsByWindow.set(tab.windowId, availableTabIds);

    if (tab.active) {
      activeTabIdsByWindow.set(tab.windowId, tab.id);
    }
  }

  const nextState = Object.fromEntries(
    [...availableTabIdsByWindow.entries()]
      .map(([windowId, availableTabIds]) => {
        const windowKey = getWindowKey(windowId);
        const filteredHistory = (savedHistory[windowKey] ?? []).filter(tabId =>
          availableTabIds.has(tabId),
        );
        const activeTabId = activeTabIdsByWindow.get(windowId);

        const normalizedHistory =
          activeTabId === undefined
            ? filteredHistory
            : [...filteredHistory.filter(tabId => tabId !== activeTabId), activeTabId];

        if (normalizedHistory.length > 0) {
          return [windowKey, normalizedHistory];
        }

        return null;
      })
      .filter((entry): entry is [string, number[]] => entry !== null),
  );

  setState(nextState);
};

/**
 * 同期的に状態を取得
 */
const getState = () => {
  return tabActivationHistoryState;
};

/**
 * 同期的に状態を設定
 * メモリは即座に更新し、ストレージへは遅延保存
 */
const setState = (value: Record<string, number[]>) => {
  tabActivationHistoryState = value;

  pendingStorageWrite = pendingStorageWrite.finally(() => {
    return chrome.storage.session.set({ tabActivationHistory: value }).catch(() => {});
  });
};

/**
 * タブのアクティベーションを記録
 */
export const recordTabActivation = (windowId: number, tabId: number) => {
  const history = (getState()[getWindowKey(windowId)] ?? []).filter(entry => entry !== tabId);
  history.push(tabId);

  if (history.length > MAX_HISTORY_SIZE) {
    history.shift();
  }

  setWindowState(windowId, history);
};

/**
 * 新規タブを元に前回アクティブだったタブIDを取得
 */
export const getLastActiveTabIdByNewTabId = (windowId: number, newTabId: number) => {
  const history = getState()[getWindowKey(windowId)] ?? [];
  const lastActiveTabId = history.at(-1) ?? null;

  if (lastActiveTabId === newTabId) {
    return history.at(-2) ?? null;
  }

  return lastActiveTabId;
};

/**
 * 現在の履歴を取得
 */
export const getActivationHistory = (windowId: number) => {
  return [...(getState()[getWindowKey(windowId)] ?? [])];
};

export const getRestoredActivationHistory = (windowId: number) => {
  return [...(restoredActivationHistoryState[getWindowKey(windowId)] ?? [])];
};

/**
 * アクティベーション履歴から利用可能なタブを検索
 */
export const getTabFromActivationHistory = (
  availableTabs: TabSnapshot[],
  excludedTabIds: number[] = [],
  history: number[] = [],
) => {
  const availableTabIds = new Set(availableTabs.map(tab => tab.id));
  const excludedTabIdSet = new Set(excludedTabIds);

  for (let i = history.length - 1; i >= 0; i--) {
    const tabId = history[i];
    if (!excludedTabIdSet.has(tabId) && availableTabIds.has(tabId)) {
      return tabId;
    }
  }

  return null;
};

/**
 * 特定のタブをアクティベーション履歴から削除
 */
export const cleanupActivationHistory = (windowId: number, tabId: number) => {
  const history = (getState()[getWindowKey(windowId)] ?? []).filter(entry => entry !== tabId);
  setWindowState(windowId, history);
};

/**
 * メモリをリセット（テスト用）
 * @internal
 */
export const resetActivationHistory = () => {
  tabActivationHistoryState = {};
  restoredActivationHistoryState = {};
  pendingStorageWrite = Promise.resolve();
};
