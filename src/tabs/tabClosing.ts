import {
  cleanupActivationHistory,
  getTabFromActivationHistory,
} from "@/src/tabs/state/activationHistory";
import type { TabSnapshot } from "@/src/tabs/state/tabSnapshot";
import type { TabActivation } from "@/src/types";

/**
 * タブクロージング時の全データクリーンアップ
 */
export const cleanupTabData = (windowId: number, tabId: number) => {
  cleanupActivationHistory(windowId, tabId);
};

/**
 * 次にアクティブにするタブを決定
 */
export const determineNextActiveTab = (
  closedTab: TabSnapshot,
  activateTabSetting: TabActivation,
  tabs: TabSnapshot[],
  activationHistory: number[],
) => {
  const remainingTabs = tabs.filter(tab => tab.id !== closedTab.id);
  const closedTabIndex = closedTab.index;

  switch (activateTabSetting) {
    case "first":
      return remainingTabs[0]?.id ?? null;

    case "last": {
      return remainingTabs.at(-1)?.id ?? null;
    }

    case "left": {
      return remainingTabs.at(Math.max(0, closedTabIndex - 1))?.id ?? null;
    }

    case "right": {
      return remainingTabs.at(Math.min(closedTabIndex, remainingTabs.length - 1))?.id ?? null;
    }

    case "inActivatedOrder": {
      return getTabFromActivationHistory(remainingTabs, [closedTab.id], activationHistory);
    }

    case "sourceTab": {
      if (!closedTab.openerTabId) {
        return null;
      }

      return remainingTabs.some(tab => tab.id === closedTab.openerTabId)
        ? closedTab.openerTabId
        : null;
    }

    case "sourceTabAndOrder": {
      const sourceTab =
        closedTab.openerTabId && remainingTabs.some(tab => tab.id === closedTab.openerTabId)
          ? closedTab.openerTabId
          : null;
      if (sourceTab !== null) {
        return sourceTab;
      }
      return getTabFromActivationHistory(remainingTabs, [closedTab.id], activationHistory);
    }

    default:
      return null;
  }
};

export const determineNextActiveTabWithoutClosedTab = (
  closedTabId: number,
  activateTabSetting: TabActivation,
  remainingTabs: TabSnapshot[],
  activationHistory: number[],
) => {
  switch (activateTabSetting) {
    case "first":
      return remainingTabs[0]?.id ?? null;

    case "last":
      return remainingTabs.at(-1)?.id ?? null;

    case "inActivatedOrder":
      return getTabFromActivationHistory(remainingTabs, [closedTabId], activationHistory);

    default:
      return null;
  }
};
