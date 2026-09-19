import { getSettings } from "@/src/settings/state/appData";
import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { applyPendingCloseTargetActivation } from "@/src/tabs/pendingCloseTargetActivation";
import {
  getActivationHistory,
  getRestoredActivationHistory,
} from "@/src/tabs/state/activationHistory";
import { recordPendingCloseTarget } from "@/src/tabs/state/pendingCloseTarget";
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
import { moveActivatedTab } from "@/src/tabs/tabOnActivate";

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
  const snapshotBeforeRemoval = closedTab === null && storedTabs.length > 0 ? storedTabs : tabs;
  const currentActiveTab = getActiveTabSnapshot(windowId);
  const liveActivationHistory = getActivationHistory(windowId);
  const storedActivationHistory = shouldInitialize ? getRestoredActivationHistory(windowId) : [];
  const storedHistoryBeforeRemoval = getRelevantHistory(
    storedActivationHistory,
    snapshotBeforeRemoval,
  );
  const pendingCloseTransition = consumePendingCloseTransition(
    windowId,
    tabId,
    currentActiveTab?.id ?? null,
  );
  // activation先行時も、即時移動前の隣接関係からclose後の選択先を決める。
  const tabsBeforeRemoval = pendingCloseTransition?.tabsBefore ?? snapshotBeforeRemoval;
  const closedTabBeforeRemoval = tabsBeforeRemoval.find(tab => tab.id === tabId) ?? null;
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
    // 同一 window の後続 remove で無条件に消すと、先行する active-close 補正の保険まで
    // 失われるので、pending target は新しい active-close を確定したときだけ上書きする。
    setActiveTabInSnapshot(windowId, nextActiveTabId);
    if (shouldArmPendingCloseTarget(currentActiveTab, nextActiveTabId)) {
      recordPendingCloseTarget(windowId, nextActiveTabId);
      applyPendingCloseTargetActivation(windowId, nextActiveTabId);
    }
    moveActivatedTab(windowId, nextActiveTabId);

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
