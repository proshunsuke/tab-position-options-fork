import { getSettings } from "@/src/settings/state/appData";
import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { schedulePendingCloseTargetActivation } from "@/src/tabs/pendingCloseTargetActivation";
import {
  getActivationHistory,
  getRestoredActivationHistory,
} from "@/src/tabs/state/activationHistory";
import {
  clearPendingCloseTarget,
  recordPendingCloseTarget,
} from "@/src/tabs/state/pendingCloseTarget";
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
  clearPendingCloseTarget(windowId);
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
  const liveActivationHistory = getActivationHistory(windowId);
  const storedActivationHistory = shouldInitialize ? getRestoredActivationHistory(windowId) : [];
  const storedHistoryBeforeRemoval = getRelevantHistory(storedActivationHistory, tabsBeforeRemoval);
  const pendingCloseTransition = consumePendingCloseTransition(
    windowId,
    tabId,
    currentActiveTab?.id ?? null,
  );
  // active tab close は onActivated / onRemoved の順序が固定ではないため、
  // activation 先行・removal 先行・復元直後のどの経路でも同じ close として扱えるようにする。
  const isClosedActiveTab =
    pendingCloseTransition !== null ||
    isClosedActiveTabInLiveSnapshot(tabId, closedTabBeforeRemoval, currentActiveTab) ||
    isClosedActiveTabOnInitialization(
      shouldInitialize,
      tabId,
      closedTabBeforeRemoval,
      storedHistoryBeforeRemoval,
      tabsBeforeRemoval,
    );
  const activationHistory =
    pendingCloseTransition?.historyBefore ??
    (storedHistoryBeforeRemoval.length > 0 ? storedHistoryBeforeRemoval : liveActivationHistory);
  const shouldHandleMissingClosedTab =
    closedTabBeforeRemoval === null &&
    activationHistory.at(-1) === tabId &&
    settings.afterTabClosing.activateTab !== "default";

  // 通常は close 前 snapshot に残っている removed tab から遷移先を決める。
  // ただし復元直後などで removed tab 自体を取りこぼしていても、履歴だけで補正できる設定は拾う。
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

  if (removeInfo.isWindowClosing) {
    return;
  }

  if (nextActiveTabId !== null) {
    // Chrome 標準の successor activation が直後に割り込むことがあるため、
    // close 後に本来到達すべき tab を短時間だけ保持して再主張できるようにする。
    setActiveTabInSnapshot(windowId, nextActiveTabId);
    if (shouldArmPendingCloseTarget(currentActiveTab, nextActiveTabId)) {
      recordPendingCloseTarget(windowId, nextActiveTabId);
      schedulePendingCloseTargetActivation(windowId, nextActiveTabId);
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

const isClosedActiveTabOnInitialization = (
  shouldInitialize: boolean,
  removedTabId: number,
  closedTabBeforeRemoval: TabSnapshot | null,
  storedHistoryBeforeRemoval: number[],
  tabsBeforeRemoval: TabSnapshot[],
) => {
  if (!shouldInitialize || closedTabBeforeRemoval === null) {
    return false;
  }

  const storedHistoryLastTabId = storedHistoryBeforeRemoval.at(-1) ?? null;
  if (storedHistoryLastTabId === removedTabId) {
    return true;
  }

  return getStoredActiveTabId(tabsBeforeRemoval) === removedTabId;
};

const isClosedActiveTabInLiveSnapshot = (
  removedTabId: number,
  closedTabBeforeRemoval: TabSnapshot | null,
  currentActiveTab: TabSnapshot | null,
) => {
  if (closedTabBeforeRemoval?.active) {
    return true;
  }

  return currentActiveTab?.id === removedTabId;
};

const getRelevantHistory = (history: number[], tabs: TabSnapshot[]) => {
  const availableTabIds = new Set(tabs.map(tab => tab.id));
  return history.filter(tabId => availableTabIds.has(tabId));
};

const getStoredActiveTabId = (tabs: TabSnapshot[]) => {
  const activeTabs = tabs.filter(tab => tab.active);
  return activeTabs.length === 1 ? activeTabs[0].id : null;
};

const shouldArmPendingCloseTarget = (
  currentActiveTab: TabSnapshot | null,
  nextActiveTabId: number,
) => {
  // すでに期待する tab が active なら close 競合は解消済みなので、
  // pending target を残して後続の user activation を巻き戻さないようにする。
  return currentActiveTab?.id !== nextActiveTabId;
};
