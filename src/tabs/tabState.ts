import { createMapState, createState } from "@/src/utils/simpleStorage";

/**
 * タブのアクティベーション情報
 */
type TabActivationInfo = {
  tabId: number;
  timestamp: number;
};

/**
 * タブインデックスキャッシュの状態管理
 */
export const tabIndexCacheState = createMapState<number, number>("tabIndexCache");

/**
 * タブアクティベーション履歴の状態管理
 */
export const tabActivationHistoryState = createState<TabActivationInfo[]>(
  "tabActivationHistory",
  [],
);

/**
 * タブソースマップの状態管理
 */
export const tabSourceMapState = createMapState<number, number>("tabSourceMap");

/**
 * 前回アクティブだったタブIDを取得
 * @param currentTabId - 現在処理中のタブID（あれば渡す）
 * @returns 前回アクティブだったタブID
 */
export const getPreviousActiveTabId = async (currentTabId?: number) => {
  const history = await tabActivationHistoryState.get();

  if (history.length === 0) {
    return null;
  }

  const lastEntry = history[history.length - 1];

  // currentTabIdが渡されて、それが履歴の最後と一致する場合
  // → レースコンディション（onActivatedが先に発火）と判断
  // → その前のタブを返す
  if (currentTabId && lastEntry.tabId === currentTabId) {
    return history.length >= 2 ? history[history.length - 2].tabId : null;
  }

  // 通常ケース：履歴の最後を返す
  return lastEntry.tabId;
};

export const updateTabIndexCache = async (tabId: number) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab) {
      const cache = await tabIndexCacheState.get();
      cache.set(tabId, tab.index);
      await tabIndexCacheState.set(cache);
    }
  } catch (_error) {
    // タブが既に存在しない場合は無視
  }
};

export const deleteFromTabIndexCache = async (tabId: number) => {
  const cache = await tabIndexCacheState.get();
  cache.delete(tabId);
  await tabIndexCacheState.set(cache);
};
