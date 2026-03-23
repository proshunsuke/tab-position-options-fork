import { getSettings } from "@/src/settings/state/appData";
import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { getActivationHistory } from "@/src/tabs/state/activationHistory";
import { consumePendingCloseTransition } from "@/src/tabs/state/pendingCloseTransition";
import type { TabSnapshot } from "@/src/tabs/state/tabSnapshot";
import {
  getActiveTabSnapshot,
  getRestoredTabSnapshot,
  getTabSnapshot,
  getTabSnapshotById,
  refreshWindowTabSnapshot,
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
  const storedTabsCandidate =
    shouldInitialize && closedTab === null ? getRestoredTabSnapshot(windowId) : [];
  const storedTabs = canUseStoredSnapshotForRemovedTab(tabs, storedTabsCandidate, tabId)
    ? storedTabsCandidate
    : [];
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
        void chrome.tabs
          .update(nextActiveTabId, { active: true })
          .catch(() => {})
          .finally(() => {
            void refreshWindowTabSnapshot(windowId);
          });
      }, 0);
    } else {
      setActiveTabInSnapshot(windowId, nextActiveTabId);
      void chrome.tabs
        .update(nextActiveTabId, { active: true })
        .catch(() => {})
        .finally(() => {
          void refreshWindowTabSnapshot(windowId);
        });
    }

    return;
  }

  void refreshWindowTabSnapshot(windowId);
};

const canUseStoredSnapshotForRemovedTab = (
  liveTabs: TabSnapshot[],
  storedTabs: TabSnapshot[],
  removedTabId: number,
) => {
  if (storedTabs.length === 0) {
    return false;
  }

  const liveTabIds = liveTabs.map(tab => tab.id);
  const liveTabIdSet = new Set(liveTabIds);
  const storedTabIdSet = new Set(storedTabs.map(tab => tab.id));
  const extraStoredTabs = storedTabs.filter(tab => !liveTabIdSet.has(tab.id));
  const missingStoredTabs = liveTabs.filter(tab => !storedTabIdSet.has(tab.id));
  if (missingStoredTabs.length > 0) {
    return false;
  }

  if (extraStoredTabs.length !== 1 || extraStoredTabs[0].id !== removedTabId) {
    return false;
  }

  const sharedStoredIds = storedTabs.filter(tab => liveTabIdSet.has(tab.id)).map(tab => tab.id);
  return sharedStoredIds.every((tabId, index) => tabId === liveTabIds[index]);
};
