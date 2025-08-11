import { getTabSourceMap, setTabSourceMap, tabActivationHistoryState } from "@/src/tabs/tabState";
import type { TabActivation } from "@/src/types";

const MAX_HISTORY_SIZE = 50;

// タブがアクティブになった時に履歴を更新
export const recordTabActivation = async (tabId: number) => {
  const timestamp = Date.now();
  const history = await tabActivationHistoryState.get();

  // 既存のエントリーを削除（最新を最後に追加するため）
  const updatedHistory = history.filter(entry => entry.tabId !== tabId);

  // 新しいエントリーを追加
  updatedHistory.push({ tabId, timestamp });

  // 履歴のサイズを制限
  if (updatedHistory.length > MAX_HISTORY_SIZE) {
    updatedHistory.shift();
  }

  await tabActivationHistoryState.set(updatedHistory);
};

// タブのソース情報を記録
export const recordTabSource = async (newTabId: number, sourceTabId: number) => {
  const sourceMap = await getTabSourceMap();
  sourceMap.set(newTabId, sourceTabId);
  await setTabSourceMap(sourceMap);
};

// タブが閉じられた時にクリーンアップ
export const cleanupTabData = async (tabId: number) => {
  // アクティブ化履歴から削除
  const history = await tabActivationHistoryState.get();
  const updatedHistory = history.filter(entry => entry.tabId !== tabId);
  await tabActivationHistoryState.set(updatedHistory);

  // ソースマップから削除
  const sourceMap = await getTabSourceMap();
  sourceMap.delete(tabId);

  // このタブをソースとしている他のタブの情報も削除
  for (const [key, value] of sourceMap.entries()) {
    if (value === tabId) {
      sourceMap.delete(key);
    }
  }
  await setTabSourceMap(sourceMap);
};

// 次にアクティブにするタブを決定
export const determineNextActiveTab = async (
  closedTabId: number,
  closedTabIndex: number,
  activateTabSetting: TabActivation,
  windowId: number,
) => {
  const tabs = await chrome.tabs.query({ windowId });

  if (tabs.length === 0) {
    return null;
  }

  switch (activateTabSetting) {
    case "first":
      return tabs[0]?.id ?? null;

    case "last":
      return tabs[tabs.length - 1]?.id ?? null;

    case "left":
      // 閉じたタブより左側のタブ
      if (closedTabIndex > 0) {
        const leftTab = tabs.find(tab => tab.index === closedTabIndex - 1);
        return leftTab?.id ?? null;
      }
      // 左側にタブがない場合は右側
      return tabs[0]?.id ?? null;

    case "right": {
      // 閉じたタブの右側のタブ

      // タブが閉じられた後、右側のタブは同じインデックスを持つ
      const rightTab = tabs.find(tab => tab.index === closedTabIndex);
      if (rightTab) {
        return rightTab.id ?? null;
      }
      // 右側にタブがない場合は左側
      return tabs[tabs.length - 1]?.id ?? null;
    }

    case "inActivatedOrder": {
      // アクティブ化履歴から最も最近のタブを選択
      const historyTab = await getTabFromActivationHistory(closedTabId, tabs);
      return historyTab;
    }

    case "sourceTab":
      // リンク元のタブ
      return await getSourceTab(closedTabId, tabs);

    case "sourceTabAndOrder": {
      // まずリンク元のタブを試す
      const sourceTab = await getSourceTab(closedTabId, tabs);
      if (sourceTab !== null) {
        return sourceTab;
      }
      // 次にアクティブ化履歴から選択
      return await getTabFromActivationHistory(closedTabId, tabs);
    }
    default:
      // ブラウザのデフォルト動作に任せる
      return null;
  }
};

// ソースタブを取得
const getSourceTab = async (tabId: number, availableTabs: chrome.tabs.Tab[]) => {
  const sourceMap = await getTabSourceMap();
  const sourceTabId = sourceMap.get(tabId);
  if (sourceTabId && availableTabs.some(tab => tab.id === sourceTabId)) {
    return sourceTabId;
  }
  return null;
};

// アクティブ化履歴から次のタブを取得
const getTabFromActivationHistory = async (
  excludeTabId: number,
  availableTabs: chrome.tabs.Tab[],
) => {
  const history = await tabActivationHistoryState.get();

  // 閉じたタブより前の履歴を逆順で検索
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];

    // 閉じたタブに到達したら、それより前の履歴を探す
    if (entry.tabId === excludeTabId) {
      // 閉じたタブより前の履歴を探す
      for (let j = i - 1; j >= 0; j--) {
        const previousEntry = history[j];
        if (availableTabs.some(tab => tab.id === previousEntry.tabId)) {
          return previousEntry.tabId;
        }
      }
      break;
    }
  }

  // 閉じたタブが履歴にない、または前の履歴がない場合
  return null;
};
