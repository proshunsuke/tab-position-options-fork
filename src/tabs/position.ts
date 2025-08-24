import type { TabPosition } from "@/src/types";

export const calculateNewTabIndex = (
  position: TabPosition,
  tabs: chrome.tabs.Tab[],
  currentTabId: number,
) => {
  switch (position) {
    case "first":
      return 0;

    case "left": {
      return tabs.find(tab => tab.id === currentTabId)?.index;
    }

    case "right": {
      const currentTab = tabs.find(tab => tab.id === currentTabId);
      return currentTab ? currentTab.index + 1 : undefined;
    }
    default:
      return undefined;
  }
};
