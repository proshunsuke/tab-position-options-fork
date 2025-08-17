import { createMapState } from "@/src/utils/simpleStorage";

/**
 * タブインデックスキャッシュの状態管理
 */
export const tabIndexCacheState = createMapState<number, number>("tabIndexCache");

/**
 * タブのインデックスを更新
 */
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

/**
 * タブのインデックスを削除
 */
export const deleteFromTabIndexCache = async (tabId: number) => {
  const cache = await tabIndexCacheState.get();
  cache.delete(tabId);
  await tabIndexCacheState.set(cache);
};

/**
 * 全タブのインデックスキャッシュを更新
 */
export const updateAllTabIndexCache = async (windowId?: number) => {
  const query = windowId ? { windowId } : {};
  const tabs = await chrome.tabs.query(query);
  const cache = await tabIndexCacheState.get();

  for (const tab of tabs) {
    if (tab.id) {
      cache.set(tab.id, tab.index);
    }
  }

  await tabIndexCacheState.set(cache);
};

/**
 * タブのインデックスを取得
 */
export const getTabIndex = async (tabId: number) => {
  const cache = await tabIndexCacheState.get();
  return cache.get(tabId) ?? null;
};
