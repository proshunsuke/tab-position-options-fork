/**
 * タブソースマップの状態管理
 * グローバルメモリ状態として管理
 */
let tabSourceMapState: Map<number, number> = new Map();

/**
 * ストレージから状態を初期化
 * Service Worker起動時に一度だけ呼び出される
 */
export const initializeSourceMap = async () => {
  const result = await chrome.storage.session.get("tabSourceMap");
  const entries = result.tabSourceMap || [];
  tabSourceMapState = new Map(entries);
};

/**
 * 同期的に状態を取得
 */
const getState = () => {
  return tabSourceMapState;
};

/**
 * 同期的に状態を設定
 * メモリは即座に更新し、ストレージへは遅延保存
 */
const setState = (value: Map<number, number>) => {
  tabSourceMapState = value;

  // ストレージへの遅延保存（MapをArrayに変換）
  Promise.resolve().then(() => {
    chrome.storage.session.set({ tabSourceMap: Array.from(value.entries()) }).catch(() => {});
  });
};

/**
 * タブのソースを記録
 */
export const recordTabSource = (newTabId: number, sourceTabId: number) => {
  const sourceMap = getState();
  sourceMap.set(newTabId, sourceTabId);
  setState(sourceMap);
};

/**
 * タブのソースを取得
 */
export const getTabSource = (tabId: number, availableTabs: chrome.tabs.Tab[]) => {
  const sourceMap = getState();
  const sourceTabId = sourceMap.get(tabId);
  if (sourceTabId && availableTabs.some(tab => tab.id === sourceTabId)) {
    return sourceTabId;
  }
  return null;
};

/**
 * タブのソース情報をクリーンアップ
 */
export const cleanupTabSource = (tabId: number) => {
  const sourceMap = getState();

  // このタブ自身のソース情報を削除
  sourceMap.delete(tabId);

  // このタブをソースとしている他のタブの情報も削除
  for (const [key, value] of sourceMap.entries()) {
    if (value === tabId) {
      sourceMap.delete(key);
    }
  }

  setState(sourceMap);
};

/**
 * メモリをリセット（テスト用）
 * @internal
 */
export const resetSourceMap = () => {
  tabSourceMapState = new Map();
};
