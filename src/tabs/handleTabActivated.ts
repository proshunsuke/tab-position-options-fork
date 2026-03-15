import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { getActivationHistory, recordTabActivation } from "@/src/tabs/state/activationHistory";
import { recordActiveTransition } from "@/src/tabs/state/activeTransition";
import { getActiveTabSnapshot, setActiveTabInSnapshot } from "@/src/tabs/state/tabSnapshot";

const INITIALIZATION_TRANSITION_WINDOW_MS = 1000;

export const handleTabActivated = async (activeInfo: { tabId: number; windowId: number }) => {
  const shouldInitialize = needsInitialization();
  if (shouldInitialize) {
    await initializeAllStates();
  }

  const activationHistory = getActivationHistory(activeInfo.windowId);
  const previousActiveTabId =
    getActiveTabSnapshot(activeInfo.windowId)?.id ?? activationHistory.at(-1) ?? null;
  recordActiveTransition(
    activeInfo.windowId,
    previousActiveTabId,
    activeInfo.tabId,
    activationHistory,
    shouldInitialize ? INITIALIZATION_TRANSITION_WINDOW_MS : undefined,
  );
  setActiveTabInSnapshot(activeInfo.windowId, activeInfo.tabId);
  recordTabActivation(activeInfo.windowId, activeInfo.tabId);
};
