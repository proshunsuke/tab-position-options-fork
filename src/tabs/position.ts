import type { TabPosition } from "@/src/types";

export const calculateNewTabIndex = (
  position: TabPosition,
  allTabs: chrome.tabs.Tab[],
  activeTab?: chrome.tabs.Tab,
) => {
  switch (position) {
    case "first":
      return 0;

    case "last":
      return allTabs.length - 1;

    case "left": {
      if (activeTab && activeTab.index > 0) {
        return activeTab.index;
      }
      break;
    }

    case "right": {
      if (activeTab) {
        return activeTab.index + 1;
      }
      break;
    }
    default:
      return undefined;
  }

  return undefined;
};
