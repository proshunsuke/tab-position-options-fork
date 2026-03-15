import { getSettings } from "@/src/settings/state/appData";
import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { getActivationHistory } from "@/src/tabs/state/activationHistory";
import { consumePendingCloseTransition } from "@/src/tabs/state/pendingCloseTransition";
import {
  getActiveTabSnapshot,
  getStoredTabSnapshot,
  getTabSnapshot,
  getTabSnapshotById,
  removeTabFromSnapshot,
  setActiveTabInSnapshot,
} from "@/src/tabs/state/tabSnapshot";
import {
  cleanupTabData,
  determineNextActiveTab,
  determineNextActiveTabWithoutClosedTab,
} from "@/src/tabs/tabClosing";

export const handleTabRemoved = async (
  tabId: number,
  removeInfo: { windowId: number; isWindowClosing: boolean },
) => {
  const shouldInitialize = needsInitialization();
  if (shouldInitialize) {
    await initializeAllStates();
  }

  const windowId = removeInfo.windowId;
  const settings = getSettings();
  const tabs = getTabSnapshot(windowId);
  const closedTab = getTabSnapshotById(windowId, tabId);
  const storedTabs =
    shouldInitialize && closedTab === null ? await getStoredTabSnapshot(windowId) : [];
  const tabsBeforeRemoval = closedTab === null && storedTabs.length > 0 ? storedTabs : tabs;
  const closedTabBeforeRemoval = closedTab ?? storedTabs.find(tab => tab.id === tabId) ?? null;
  const currentActiveTab = getActiveTabSnapshot(windowId);
  const pendingCloseTransition = consumePendingCloseTransition(
    windowId,
    tabId,
    currentActiveTab?.id ?? null,
  );
  // Service Worker 再起動直後だけは pendingCloseTransition が空でも、
  // 保存済み snapshot の active フラグを補助情報として扱う。
  const isClosedActiveTab =
    pendingCloseTransition !== null ||
    (shouldInitialize && closedTabBeforeRemoval?.active === true);
  const activationHistory = pendingCloseTransition?.historyBefore ?? getActivationHistory(windowId);
  const shouldHandleMissingClosedTab =
    closedTabBeforeRemoval === null &&
    activationHistory.at(-1) === tabId &&
    settings.afterTabClosing.activateTab !== "default";

  const nextActiveTabId =
    closedTabBeforeRemoval &&
    isClosedActiveTab &&
    settings.afterTabClosing.activateTab !== "default"
      ? determineNextActiveTab(
          closedTabBeforeRemoval,
          settings.afterTabClosing.activateTab,
          tabsBeforeRemoval,
          activationHistory,
        )
      : shouldHandleMissingClosedTab
        ? determineNextActiveTabWithoutClosedTab(
            tabId,
            settings.afterTabClosing.activateTab,
            tabsBeforeRemoval,
            activationHistory,
          )
        : null;

  cleanupTabData(windowId, tabId);
  removeTabFromSnapshot(windowId, tabId);

  if (nextActiveTabId !== null) {
    if (shouldInitialize) {
      setTimeout(() => {
        setActiveTabInSnapshot(windowId, nextActiveTabId);
        void chrome.tabs.update(nextActiveTabId, { active: true });
      }, 0);
    } else {
      setActiveTabInSnapshot(windowId, nextActiveTabId);
      void chrome.tabs.update(nextActiveTabId, { active: true });
    }
  }
};
