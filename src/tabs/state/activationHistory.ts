import type { TabSnapshot } from "@/src/tabs/state/tabSnapshot";

type ActivationHistoryStorage = {
  tabActivationHistory?: number[];
};

const MAX_HISTORY_SIZE = 50;

/**
 * タブのアクティベーション履歴の状態管理
 * グローバルメモリ状態として管理
 */
let tabActivationHistoryState: number[] = [];

/**
 * ストレージから状態を初期化
 * Service Worker起動時に一度だけ呼び出される
 */
export const initializeActivationHistory = async () => {
  const [result, tabs] = await Promise.all([
    chrome.storage.session.get<ActivationHistoryStorage>("tabActivationHistory"),
    chrome.tabs.query({ currentWindow: true }),
  ]);

  const availableTabIds = new Set(
    tabs.map(tab => tab.id).filter((tabId): tabId is number => !!tabId),
  );
  const savedHistory = result.tabActivationHistory ?? [];
  const restoredHistory = savedHistory.filter(tabId => availableTabIds.has(tabId));

  if (restoredHistory.length > 0) {
    setState(restoredHistory);
    return;
  }

  const activeTab = tabs.find(tab => tab.active);
  if (activeTab?.id) {
    setState([activeTab.id]);
    return;
  }

  setState([]);
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
const setState = (value: number[]) => {
  tabActivationHistoryState = value;

  Promise.resolve().then(() => {
    chrome.storage.session.set({ tabActivationHistory: value }).catch(() => {});
  });
};

/**
 * タブのアクティベーションを記録
 */
export const recordTabActivation = (tabId: number) => {
  const history = getState().filter(entry => entry !== tabId);
  history.push(tabId);

  if (history.length > MAX_HISTORY_SIZE) {
    history.shift();
  }

  setState(history);
};

/**
 * 新規タブを元に前回アクティブだったタブIDを取得
 */
export const getLastActiveTabIdByNewTabId = (newTabId: number) => {
  const history = getState();
  const lastActiveTabId = history.at(-1) ?? null;

  if (lastActiveTabId === newTabId) {
    return history.at(-2) ?? null;
  }

  return lastActiveTabId;
};

/**
 * 現在の履歴を取得
 */
export const getActivationHistory = () => {
  return [...getState()];
};

/**
 * アクティベーション履歴から利用可能なタブを検索
 */
export const getTabFromActivationHistory = (
  availableTabs: TabSnapshot[],
  excludedTabIds: number[] = [],
  history: number[] = getState(),
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
export const cleanupActivationHistory = (tabId: number) => {
  setState(getState().filter(entry => entry !== tabId));
};

/**
 * メモリをリセット（テスト用）
 * @internal
 */
export const resetActivationHistory = () => {
  tabActivationHistoryState = [];
};
