import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { getActivationHistory, recordTabActivation } from "@/src/tabs/state/activationHistory";
import { recordNewTabSourceTransition } from "@/src/tabs/state/newTabSourceTransition";
import { recordPendingCloseTransition } from "@/src/tabs/state/pendingCloseTransition";
import { getActiveTabSnapshot, setActiveTabInSnapshot } from "@/src/tabs/state/tabSnapshot";

const INITIALIZATION_NEW_TAB_SOURCE_TRANSITION_WINDOW_MS = 1000;

export const handleTabActivated = async (activeInfo: { tabId: number; windowId: number }) => {
  const shouldInitialize = needsInitialization();
  if (shouldInitialize) {
    await initializeAllStates();
  }

  const activationHistory = getActivationHistory(activeInfo.windowId);
  const previousActiveTabId =
    getActiveTabSnapshot(activeInfo.windowId)?.id ?? activationHistory.at(-1) ?? null;
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
    activationHistory,
  );
  setActiveTabInSnapshot(activeInfo.windowId, activeInfo.tabId);
  recordTabActivation(activeInfo.windowId, activeInfo.tabId);
};
