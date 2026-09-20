import { getSettings } from "@/src/settings/state/appData";
import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { applyPendingCloseTargetActivation } from "@/src/tabs/pendingCloseTargetActivation";
import { isSessionRestoreInProgress } from "@/src/tabs/sessionRestoreDetector";
import {
  getActivationHistory,
  getRestoredActivationHistory,
  recordTabActivation,
} from "@/src/tabs/state/activationHistory";
import { consumeNewTabActivation } from "@/src/tabs/state/newTabActivation";
import { recordNewTabSourceTransition } from "@/src/tabs/state/newTabSourceTransition";
import {
  clearPendingCloseTarget,
  getPendingCloseTarget,
} from "@/src/tabs/state/pendingCloseTarget";
import { recordPendingCloseTransition } from "@/src/tabs/state/pendingCloseTransition";
import { getWindowSnapshot, isPopupMoving } from "@/src/tabs/state/popup";
import {
  getActiveTabSnapshot,
  getRestoredTabSnapshot,
  getTabSnapshot,
  getTabSnapshotById,
  refreshWindowTabSnapshot,
  setActiveTabInSnapshot,
} from "@/src/tabs/state/tabSnapshot";
import { cancelActivationMove, moveActivatedTab } from "@/src/tabs/tabOnActivate";

const INITIALIZATION_NEW_TAB_SOURCE_TRANSITION_WINDOW_MS = 1000;

export const handleTabActivated = async (activeInfo: { tabId: number; windowId: number }) => {
  cancelActivationMove(activeInfo.windowId);
  // 初期化中に復元期間が終わっても、復元時に届いたactivationを通常操作に変えない。
  const isRestoreActivation = isSessionRestoreInProgress();
  const shouldInitialize = needsInitialization();
  if (shouldInitialize) {
    await initializeAllStates();
  }

  if (
    isPopupMoving(activeInfo.tabId) ||
    (getSettings().popup?.openAsNewTab && getWindowSnapshot(activeInfo.windowId)?.type === "popup")
  ) {
    return;
  }

  const isNewTabActivation = consumeNewTabActivation(activeInfo.windowId, activeInfo.tabId);

  // close 補正の着地先が残っている間は、Chrome 標準の一時的な activation より
  // pending target を優先して最終着地を維持する。
  // この短い window 内の activation は、標準の後続切り替えか素早い user 操作かを
  // 拡張側から確実には見分けられない。ここでは完璧な識別よりも、
  // close 直後のちらつきを最小化しつつ設定どおりの着地先を守ることを優先する。
  const pendingCloseTargetTabId = getPendingCloseTarget(activeInfo.windowId);
  if (pendingCloseTargetTabId !== null) {
    if (pendingCloseTargetTabId !== activeInfo.tabId) {
      const pendingCloseTargetTab = getTabSnapshotById(
        activeInfo.windowId,
        pendingCloseTargetTabId,
      );
      if (pendingCloseTargetTab === null) {
        clearPendingCloseTarget(activeInfo.windowId);
      } else {
        setActiveTabInSnapshot(activeInfo.windowId, pendingCloseTargetTabId);
        applyPendingCloseTargetActivation(activeInfo.windowId, pendingCloseTargetTabId);
        return;
      }
    }
  }

  const activationHistory = getActivationHistory(activeInfo.windowId);
  const storedActivationHistory = shouldInitialize
    ? getRestoredActivationHistory(activeInfo.windowId)
    : [];
  const previousActiveTabId = shouldInitialize
    ? getPreviousActiveTabIdOnInitialization(
        activeInfo.windowId,
        activeInfo.tabId,
        activationHistory,
        storedActivationHistory,
      )
    : (getActiveTabSnapshot(activeInfo.windowId)?.id ?? activationHistory.at(-1) ?? null);
  const availableTabIds = new Set(getTabSnapshot(activeInfo.windowId).map(tab => tab.id));
  const relevantStoredActivationHistory = getRelevantHistory(
    storedActivationHistory,
    availableTabIds,
  );
  const transitionHistory =
    shouldInitialize && relevantStoredActivationHistory.length > 0
      ? relevantStoredActivationHistory
      : activationHistory;

  recordNewTabSourceTransition(
    activeInfo.windowId,
    previousActiveTabId,
    activeInfo.tabId,
    shouldInitialize ? INITIALIZATION_NEW_TAB_SOURCE_TRANSITION_WINDOW_MS : undefined,
  );
  recordPendingCloseTransition(
    activeInfo.windowId,
    previousActiveTabId,
    activeInfo.tabId,
    transitionHistory,
    getTabSnapshot(activeInfo.windowId),
  );
  setActiveTabInSnapshot(activeInfo.windowId, activeInfo.tabId);
  recordTabActivation(activeInfo.windowId, activeInfo.tabId);
  if (
    isRestoreActivation ||
    isNewTabActivation ||
    !moveActivatedTab(activeInfo.windowId, activeInfo.tabId)
  ) {
    void refreshWindowTabSnapshot(activeInfo.windowId);
  }
};

const getPreviousActiveTabIdOnInitialization = (
  windowId: number,
  activatedTabId: number,
  activationHistory: number[],
  storedActivationHistory: number[],
) => {
  const availableTabIds = new Set(getTabSnapshot(windowId).map(tab => tab.id));
  const storedHistoryLastTabId = getPreviousTabIdFromHistory(
    storedActivationHistory,
    activatedTabId,
    availableTabIds,
  );
  if (storedHistoryLastTabId !== null) {
    return storedHistoryLastTabId;
  }

  const storedTabs = getRestoredTabSnapshot(windowId);
  const storedActiveTabId =
    storedTabs.find(tab => tab.active && availableTabIds.has(tab.id))?.id ?? null;
  if (storedActiveTabId !== null && storedActiveTabId !== activatedTabId) {
    return storedActiveTabId;
  }

  const historyLastTabId = getPreviousTabIdFromHistory(
    activationHistory,
    activatedTabId,
    availableTabIds,
  );
  if (historyLastTabId !== null) {
    return historyLastTabId;
  }

  const liveActiveTabId = getActiveTabSnapshot(windowId)?.id ?? null;
  if (liveActiveTabId !== null && liveActiveTabId !== activatedTabId) {
    return liveActiveTabId;
  }

  return storedActiveTabId ?? historyLastTabId ?? liveActiveTabId;
};

const getRelevantHistory = (history: number[], availableTabIds: Set<number>) => {
  return history.filter(tabId => availableTabIds.has(tabId));
};

const getPreviousTabIdFromHistory = (
  history: number[],
  activatedTabId: number,
  availableTabIds: Set<number>,
) => {
  for (let index = history.length - 1; index >= 0; index--) {
    const tabId = history[index];
    if (tabId !== activatedTabId && availableTabIds.has(tabId)) {
      return tabId;
    }
  }

  return null;
};
