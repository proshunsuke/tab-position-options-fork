import { createMapState } from "@/src/utils/simpleStorage";

/**
 * タブソースマップの状態管理
 */
const tabSourceMapState = createMapState<number, number>("tabSourceMap");

/**
 * タブのソースを記録
 */
export const recordTabSource = async (newTabId: number, sourceTabId: number) => {
  const sourceMap = await tabSourceMapState.get();
  sourceMap.set(newTabId, sourceTabId);
  await tabSourceMapState.set(sourceMap);
};

/**
 * タブのソースを取得
 */
export const getTabSource = async (tabId: number, availableTabs: chrome.tabs.Tab[]) => {
  const sourceMap = await tabSourceMapState.get();
  const sourceTabId = sourceMap.get(tabId);
  if (sourceTabId && availableTabs.some(tab => tab.id === sourceTabId)) {
    return sourceTabId;
  }
  return null;
};

/**
 * タブのソース情報をクリーンアップ
 */
export const cleanupTabSource = async (tabId: number) => {
  const sourceMap = await tabSourceMapState.get();

  // このタブ自身のソース情報を削除
  sourceMap.delete(tabId);

  // このタブをソースとしている他のタブの情報も削除
  for (const [key, value] of sourceMap.entries()) {
    if (value === tabId) {
      sourceMap.delete(key);
    }
  }

  await tabSourceMapState.set(sourceMap);
};
