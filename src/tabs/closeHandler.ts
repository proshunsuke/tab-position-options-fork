import { tabActivationHistoryState, tabSourceMapState } from "@/src/tabs/tabState";
import type { TabActivation } from "@/src/types";

const MAX_HISTORY_SIZE = 50;

export const recordTabActivation = async (tabId: number) => {
  const timestamp = Date.now();
  const history = await tabActivationHistoryState.get();

  const updatedHistory = history.filter(entry => entry.tabId !== tabId);

  updatedHistory.push({ tabId, timestamp });

  if (updatedHistory.length > MAX_HISTORY_SIZE) {
    updatedHistory.shift();
  }

  await tabActivationHistoryState.set(updatedHistory);
};

export const recordTabSource = async (newTabId: number, sourceTabId: number) => {
  const sourceMap = await tabSourceMapState.get();
  sourceMap.set(newTabId, sourceTabId);
  await tabSourceMapState.set(sourceMap);
};

export const cleanupTabData = async (tabId: number) => {
  const history = await tabActivationHistoryState.get();
  const updatedHistory = history.filter(entry => entry.tabId !== tabId);
  await tabActivationHistoryState.set(updatedHistory);

  const sourceMap = await tabSourceMapState.get();
  sourceMap.delete(tabId);

  // このタブをソースとしている他のタブの情報も削除
  for (const [key, value] of sourceMap.entries()) {
    if (value === tabId) {
      sourceMap.delete(key);
    }
  }
  await tabSourceMapState.set(sourceMap);
};

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
      if (closedTabIndex > 0) {
        const leftTab = tabs.find(tab => tab.index === closedTabIndex - 1);
        return leftTab?.id ?? null;
      }
      return tabs[0]?.id ?? null;

    case "right": {
      // タブが閉じられた後、右側のタブは同じインデックスを持つ
      const rightTab = tabs.find(tab => tab.index === closedTabIndex);
      if (rightTab) {
        return rightTab.id ?? null;
      }
      return tabs[tabs.length - 1]?.id ?? null;
    }

    case "inActivatedOrder": {
      const historyTab = await getTabFromActivationHistory(closedTabId, tabs);
      return historyTab;
    }

    case "sourceTab":
      return await getSourceTab(closedTabId, tabs);

    case "sourceTabAndOrder": {
      const sourceTab = await getSourceTab(closedTabId, tabs);
      if (sourceTab !== null) {
        return sourceTab;
      }
      return await getTabFromActivationHistory(closedTabId, tabs);
    }
    default:
      return null;
  }
};

const getSourceTab = async (tabId: number, availableTabs: chrome.tabs.Tab[]) => {
  const sourceMap = await tabSourceMapState.get();
  const sourceTabId = sourceMap.get(tabId);
  if (sourceTabId && availableTabs.some(tab => tab.id === sourceTabId)) {
    return sourceTabId;
  }
  return null;
};

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
