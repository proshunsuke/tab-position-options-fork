import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { handlePopupUrl } from "@/src/tabs/popup";
import { setPinnedTabInSnapshot } from "@/src/tabs/state/tabSnapshot";

export const handleTabUpdated = async (
  tabId: number,
  changeInfo: chrome.tabs.OnUpdatedInfo,
  tab: chrome.tabs.Tab,
) => {
  if (changeInfo.pinned === undefined && changeInfo.url === undefined) {
    return;
  }
  if (needsInitialization()) {
    // 再起動直後は、更新先のスナップショットを復元する必要がある。
    await initializeAllStates();
  }
  if (changeInfo.url !== undefined) {
    handlePopupUrl(tabId, changeInfo.url);
  }
  if (changeInfo.pinned !== undefined) {
    setPinnedTabInSnapshot(tab.windowId, tabId, changeInfo.pinned);
  }
};
