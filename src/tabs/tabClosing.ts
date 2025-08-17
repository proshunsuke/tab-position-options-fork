import {
  cleanupActivationHistory,
  getTabFromActivationHistory,
} from "@/src/tabs/state/activationHistory";
import { deleteFromTabIndexCache } from "@/src/tabs/state/indexCache";
import { cleanupTabSource, getTabSource } from "@/src/tabs/state/sourceMap";
import type { TabActivation } from "@/src/types";

/**
 * タブクロージング時の全データクリーンアップ
 */
export const cleanupTabData = async (tabId: number) => {
  // 各ステートからタブデータを削除
  await cleanupActivationHistory(tabId);
  await cleanupTabSource(tabId);
  await deleteFromTabIndexCache(tabId);
};

/**
 * 次にアクティブにするタブを決定
 */
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
      return await getTabSource(closedTabId, tabs);

    case "sourceTabAndOrder": {
      const sourceTab = await getTabSource(closedTabId, tabs);
      if (sourceTab !== null) {
        return sourceTab;
      }
      return await getTabFromActivationHistory(closedTabId, tabs);
    }

    default:
      return null;
  }
};
