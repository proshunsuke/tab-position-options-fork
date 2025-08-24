import {
  cleanupActivationHistory,
  getTabFromActivationHistory,
} from "@/src/tabs/state/activationHistory";
import { deleteTabIndex } from "@/src/tabs/state/indexCache";
import { cleanupTabSource, getTabSource } from "@/src/tabs/state/sourceMap";
import type { TabActivation } from "@/src/types";

/**
 * タブクロージング時の全データクリーンアップ
 */
export const cleanupTabData = (tabId: number) => {
  // 各ステートからタブデータを削除
  cleanupActivationHistory(tabId);
  cleanupTabSource(tabId);
  deleteTabIndex(tabId);
};

/**
 * 次にアクティブにするタブを決定
 */
export const determineNextActiveTab = (
  closedTabId: number,
  closedTabIndex: number,
  activateTabSetting: TabActivation,
  tabs: chrome.tabs.Tab[],
) => {
  switch (activateTabSetting) {
    case "first":
      return tabs[0].id;

    case "last": {
      const lastTab = tabs[tabs.length - 1];
      return lastTab.id === closedTabId ? null : lastTab.id;
    }

    case "left": {
      if (closedTabIndex === 0) {
        return null;
      }
      const leftTab = tabs.find(tab => tab.index === closedTabIndex - 1);
      return leftTab?.id ?? null;
    }

    case "right": {
      const rightTab = tabs.find(tab => tab.index === closedTabIndex + 1);
      return rightTab?.id ?? null;
    }

    case "inActivatedOrder": {
      return getTabFromActivationHistory(closedTabId, tabs);
    }

    case "sourceTab":
      return getTabSource(closedTabId, tabs);

    case "sourceTabAndOrder": {
      const sourceTab = getTabSource(closedTabId, tabs);
      if (sourceTab !== null) {
        return sourceTab;
      }
      return getTabFromActivationHistory(closedTabId, tabs);
    }

    default:
      return null;
  }
};
