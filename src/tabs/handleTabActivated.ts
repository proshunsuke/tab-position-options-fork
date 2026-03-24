import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import {
  getActivationHistory,
  getRestoredActivationHistory,
  recordTabActivation,
} from "@/src/tabs/state/activationHistory";
import { recordNewTabSourceTransition } from "@/src/tabs/state/newTabSourceTransition";
import { recordPendingCloseTransition } from "@/src/tabs/state/pendingCloseTransition";
import {
  getActiveTabSnapshot,
  getRestoredTabSnapshot,
  refreshWindowTabSnapshot,
  setActiveTabInSnapshot,
} from "@/src/tabs/state/tabSnapshot";

const INITIALIZATION_NEW_TAB_SOURCE_TRANSITION_WINDOW_MS = 1000;

export const handleTabActivated = async (activeInfo: { tabId: number; windowId: number }) => {
  const shouldInitialize = needsInitialization();
  if (shouldInitialize) {
    await initializeAllStates();
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
  const transitionHistory =
    shouldInitialize && storedActivationHistory.length > 0
      ? storedActivationHistory
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
  );
  setActiveTabInSnapshot(activeInfo.windowId, activeInfo.tabId);
  recordTabActivation(activeInfo.windowId, activeInfo.tabId);
  void refreshWindowTabSnapshot(activeInfo.windowId);
};

const getPreviousActiveTabIdOnInitialization = (
  windowId: number,
  activatedTabId: number,
  activationHistory: number[],
  storedActivationHistory: number[],
) => {
  const storedHistoryLastTabId = getPreviousTabIdFromHistory(
    storedActivationHistory,
    activatedTabId,
  );
  if (storedHistoryLastTabId !== null) {
    return storedHistoryLastTabId;
  }

  const storedTabs = getRestoredTabSnapshot(windowId);
  const storedActiveTabId = storedTabs.find(tab => tab.active)?.id ?? null;
  if (storedActiveTabId !== null && storedActiveTabId !== activatedTabId) {
    return storedActiveTabId;
  }

  const historyLastTabId = getPreviousTabIdFromHistory(activationHistory, activatedTabId);
  if (historyLastTabId !== null) {
    return historyLastTabId;
  }

  const liveActiveTabId = getActiveTabSnapshot(windowId)?.id ?? null;
  if (liveActiveTabId !== null && liveActiveTabId !== activatedTabId) {
    return liveActiveTabId;
  }

  return storedActiveTabId ?? historyLastTabId ?? liveActiveTabId;
};

const getPreviousTabIdFromHistory = (history: number[], activatedTabId: number) => {
  for (let index = history.length - 1; index >= 0; index--) {
    const tabId = history[index];
    if (tabId !== activatedTabId) {
      return tabId;
    }
  }

  return null;
};
