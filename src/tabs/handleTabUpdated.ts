import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { setPinnedTabInSnapshot } from "@/src/tabs/state/tabSnapshot";

export const handleTabUpdated = async (
  tabId: number,
  changeInfo: chrome.tabs.OnUpdatedInfo,
  tab: chrome.tabs.Tab,
) => {
  if (changeInfo.pinned === undefined) {
    return;
  }
  if (needsInitialization()) {
    // 再起動直後は、更新先のスナップショットを復元する必要がある。
    await initializeAllStates();
  }
  setPinnedTabInSnapshot(tab.windowId, tabId, changeInfo.pinned);
};
