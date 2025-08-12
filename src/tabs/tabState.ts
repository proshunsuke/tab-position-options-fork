import { createMapState, createState } from "@/src/utils/simpleStorage";

/**
 * タブのアクティベーション情報
 */
type TabActivationInfo = {
  tabId: number;
  timestamp: number;
};

/**
 * 最後にアクティブだったタブIDの状態管理
 */
export const lastActiveTabState = createState<number | null>("lastActiveTabId", null);

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

export const updateTabIndexCache = async (tabId: number): Promise<void> => {
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

export const deleteFromTabIndexCache = async (tabId: number): Promise<void> => {
  const cache = await tabIndexCacheState.get();
  cache.delete(tabId);
  await tabIndexCacheState.set(cache);
};
