import { createMapState } from "@/src/utils/simpleStorage";

/**
 * タブインデックスキャッシュの状態管理
 */
const tabIndexCacheState = createMapState<number, number>("tabIndexCache");

/**
 * タブのインデックスを更新
 * 単一タブの変更時に使用（タブ作成、アクティベート等）
 * タブ移動のような複数タブに影響する操作では updateAllTabIndexCache を使用すること
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
 * 複数タブに影響する変更時に使用（タブ移動、初期化、Service Worker再起動後の復元等）
 * 単一タブのみの変更では updateTabIndexCache を使用すること
 */
export const updateAllTabIndexCache = async (windowId?: number, tabs?: chrome.tabs.Tab[]) => {
  const tabList = tabs || (await chrome.tabs.query(windowId ? { windowId } : {}));
  const cache = await tabIndexCacheState.get();

  for (const tab of tabList) {
    if (tab.id) {
      cache.set(tab.id, tab.index);
    }
  }

  await tabIndexCacheState.set(cache);
};

/**
 * タブのインデックスを取得
 */
export const getTabIndex = async (tabId: number, windowId?: number) => {
  let cache = await tabIndexCacheState.get();

  // キャッシュが空の場合は構築
  if (cache.size === 0 && windowId) {
    await updateAllTabIndexCache(windowId);
    cache = await tabIndexCacheState.get();
  }

  return cache.get(tabId) ?? null;
};
