/**
 * タブインデックスの状態管理
 * グローバルメモリ状態として管理
 */
let tabIndexCacheState: Map<number, number> = new Map();

/**
 * ストレージから状態を初期化
 * Service Worker起動時に一度だけ呼び出される
 */
export const initializeIndexCache = async () => {
  const result = await chrome.storage.session.get("tabIndexCache");
  if (result.tabIndexCache) {
    const entries = result.tabIndexCache;
    tabIndexCacheState = new Map(entries);
  } else {
    setAllTabIndexes();
  }
};

/**
 * 同期的に状態を取得
 */
const getState = () => {
  return tabIndexCacheState;
};

/**
 * 同期的に状態を設定
 * メモリは即座に更新し、ストレージへは遅延保存
 */
const setState = (value: Map<number, number>) => {
  tabIndexCacheState = value;

  // ストレージへの遅延保存（MapをArrayに変換）
  Promise.resolve().then(() => {
    chrome.storage.session.set({ tabIndexCache: Array.from(value.entries()) }).catch(() => {});
  });
};

/**
 * タブのインデックスを設定
 * メモリ即座更新＋ストレージへ遅延保存
 */
export const setTabIndex = (tabId: number, index: number) => {
  const cache = getState();
  cache.set(tabId, index);
  setState(cache);
};

/**
 * Chrome APIでタブ情報を取得してインデックスを設定
 * Promiseを返すがawaitせずに使用可能
 */
export const setTabIndexFromChrome = (tabId: number) => {
  chrome.tabs.get(tabId).then(tab => {
    const cache = getState();
    cache.set(tabId, tab.index);
    setState(cache);
  });
};

/**
 * タブのインデックスを削除
 */
export const deleteTabIndex = (tabId: number) => {
  const cache = getState();
  cache.delete(tabId);
  setState(cache);
};

/**
 * 全タブのインデックスを一括設定
 * 複数タブに影響する変更時に使用（タブ移動、初期化、Service Worker再起動後の復元等）
 */
export const setAllTabIndexes = () => {
  chrome.tabs.query({ currentWindow: true }).then(tabs => {
    const cache = getState();
    for (const tab of tabs) {
      if (tab.id) {
        cache.set(tab.id, tab.index);
      }
    }
    setState(cache);
  });
};

/**
 * タブのインデックスを取得
 */
export const getTabIndex = (tabId: number) => {
  const indexes = getState();
  return indexes.get(tabId);
};

/**
 * メモリをリセット（テスト用）
 * @internal
 */
export const resetIndexCache = () => {
  tabIndexCacheState = new Map();
};
