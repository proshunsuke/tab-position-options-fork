import { StateManager } from "@/src/utils/stateManager";

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
export const lastActiveTabState = new StateManager<number | null>("lastActiveTabId", null);

/**
 * タブインデックスキャッシュの状態管理
 * MapをArrayにシリアライズして保存
 */
export const tabIndexCacheState = new StateManager<[number, number][]>("tabIndexCache", [], {
  serialize: value => value,
  deserialize: value => (value as [number, number][]) || [],
});

/**
 * タブアクティベーション履歴の状態管理
 */
export const tabActivationHistoryState = new StateManager<TabActivationInfo[]>(
  "tabActivationHistory",
  [],
  {
    serialize: value => value,
    deserialize: value => (value as TabActivationInfo[]) || [],
  },
);

/**
 * タブソースマップの状態管理
 * MapをArrayにシリアライズして保存
 */
export const tabSourceMapState = new StateManager<[number, number][]>("tabSourceMap", [], {
  serialize: value => value,
  deserialize: value => (value as [number, number][]) || [],
});

/**
 * タブインデックスキャッシュをMapとして取得
 */
export const getTabIndexCache = async (): Promise<Map<number, number>> => {
  const entries = await tabIndexCacheState.get();
  return new Map(entries);
};

/**
 * タブインデックスキャッシュをMapから設定
 */
export const setTabIndexCache = async (cache: Map<number, number>): Promise<void> => {
  await tabIndexCacheState.set(Array.from(cache.entries()));
};

/**
 * タブインデックスキャッシュを更新
 */
export const updateTabIndexCache = async (tabId: number): Promise<void> => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab) {
      const cache = await getTabIndexCache();
      cache.set(tabId, tab.index);
      await setTabIndexCache(cache);
    }
  } catch (_error) {
    // タブが既に存在しない場合は無視
  }
};

/**
 * タブインデックスキャッシュから削除
 */
export const deleteFromTabIndexCache = async (tabId: number): Promise<void> => {
  const cache = await getTabIndexCache();
  cache.delete(tabId);
  await setTabIndexCache(cache);
};

/**
 * タブソースマップをMapとして取得
 */
export const getTabSourceMap = async (): Promise<Map<number, number>> => {
  const entries = await tabSourceMapState.get();
  return new Map(entries);
};

/**
 * タブソースマップをMapから設定
 */
export const setTabSourceMap = async (sourceMap: Map<number, number>): Promise<void> => {
  await tabSourceMapState.set(Array.from(sourceMap.entries()));
};

/**
 * すべてのStateManagerを初期化
 */
export const initializeAllStates = async (): Promise<void> => {
  await Promise.all([
    lastActiveTabState.initialize(),
    tabIndexCacheState.initialize(),
    tabActivationHistoryState.initialize(),
    tabSourceMapState.initialize(),
  ]);
};
