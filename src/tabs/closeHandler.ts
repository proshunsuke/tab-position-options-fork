import type { TabActivation } from "@/src/types";

type TabActivationInfo = {
  tabId: number;
  timestamp: number;
};

const MAX_HISTORY_SIZE = 50;

// タブのアクティブ化履歴を保持
const tabActivationHistory: TabActivationInfo[] = [];

// タブのソース情報を保持（リンク元タブの追跡用）
const tabSourceMap = new Map<number, number>();

// タブがアクティブになった時に履歴を更新
export const recordTabActivation = (tabId: number) => {
  const timestamp = Date.now();

  // 既存のエントリーを削除（最新を最後に追加するため）
  removeTabFromHistory(tabId);

  // 新しいエントリーを追加
  tabActivationHistory.push({ tabId, timestamp });

  // 履歴のサイズを制限
  if (tabActivationHistory.length > MAX_HISTORY_SIZE) {
    tabActivationHistory.shift();
  }

  console.log(
    `[Tab Activation] Recorded tab ${tabId}, history:`,
    tabActivationHistory.map(h => h.tabId),
  );
};

// タブのソース情報を記録
export const recordTabSource = (newTabId: number, sourceTabId: number) => {
  tabSourceMap.set(newTabId, sourceTabId);
};

// タブが閉じられた時にクリーンアップ
export const cleanupTabData = (tabId: number) => {
  // アクティブ化履歴から削除
  removeTabFromHistory(tabId);

  // ソースマップから削除
  tabSourceMap.delete(tabId);

  // このタブをソースとしている他のタブの情報も削除
  for (const [key, value] of tabSourceMap.entries()) {
    if (value === tabId) {
      tabSourceMap.delete(key);
    }
  }
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
      console.log(
        `[Tab Closing] Right - closedTabIndex: ${closedTabIndex}, tabs:`,
        tabs.map(t => ({ id: t.id, index: t.index })),
      );

      // タブが閉じられた後、右側のタブは同じインデックスを持つ
      const rightTab = tabs.find(tab => tab.index === closedTabIndex);
      if (rightTab) {
        console.log(
          `[Tab Closing] Right - Found right tab: id=${rightTab.id}, index=${rightTab.index}`,
        );
        return rightTab.id ?? null;
      }
      // 右側にタブがない場合は左側
      console.log(`[Tab Closing] Right - No right tab, returning last tab`);
      return tabs[tabs.length - 1]?.id ?? null;
    }

    case "inActivatedOrder": {
      // アクティブ化履歴から最も最近のタブを選択
      console.log(
        `[Tab Closing] inActivatedOrder - searching in history:`,
        tabActivationHistory.map(h => h.tabId),
      );
      const historyTab = getTabFromActivationHistory(closedTabId, tabs);
      console.log(`[Tab Closing] inActivatedOrder - found tab: ${historyTab}`);
      return historyTab;
    }

    case "sourceTab":
      // リンク元のタブ
      return getSourceTab(closedTabId, tabs);

    case "sourceTabAndOrder": {
      // まずリンク元のタブを試す
      const sourceTab = getSourceTab(closedTabId, tabs);
      if (sourceTab !== null) {
        return sourceTab;
      }
      // 次にアクティブ化履歴から選択
      return getTabFromActivationHistory(closedTabId, tabs);
    }
    default:
      // ブラウザのデフォルト動作に任せる
      return null;
  }
};

// タブ履歴から既存のエントリーを削除
const removeTabFromHistory = (tabId: number) => {
  const existingIndex = tabActivationHistory.findIndex(entry => entry.tabId === tabId);
  if (existingIndex !== -1) {
    tabActivationHistory.splice(existingIndex, 1);
  }
};

// ソースタブを取得
const getSourceTab = (tabId: number, availableTabs: chrome.tabs.Tab[]) => {
  const sourceTabId = tabSourceMap.get(tabId);
  if (sourceTabId && availableTabs.some(tab => tab.id === sourceTabId)) {
    return sourceTabId;
  }
  return null;
};

// アクティブ化履歴から次のタブを取得
const getTabFromActivationHistory = (excludeTabId: number, availableTabs: chrome.tabs.Tab[]) => {
  // デバッグ: 利用可能なタブIDを表示
  console.log(
    `[Tab Closing] Available tabs:`,
    availableTabs.map(t => t.id),
  );

  // 閉じたタブより前の履歴を逆順で検索
  for (let i = tabActivationHistory.length - 1; i >= 0; i--) {
    const entry = tabActivationHistory[i];

    // 閉じたタブに到達したら、それより前の履歴を探す
    if (entry.tabId === excludeTabId) {
      console.log(`[Tab Closing] Found closed tab at index ${i}, searching before this`);

      // 閉じたタブより前の履歴を探す
      for (let j = i - 1; j >= 0; j--) {
        const previousEntry = tabActivationHistory[j];
        if (availableTabs.some(tab => tab.id === previousEntry.tabId)) {
          console.log(
            `[Tab Closing] Found previous active tab: ${previousEntry.tabId} at index ${j}`,
          );
          return previousEntry.tabId;
        }
      }
      break;
    }
  }

  // 閉じたタブが履歴にない、または前の履歴がない場合
  console.log(`[Tab Closing] No previous active tab found in history`);
  return null;
};
