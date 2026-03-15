import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { getActivationHistory, recordTabActivation } from "@/src/tabs/state/activationHistory";
import { recordActiveTransition } from "@/src/tabs/state/activeTransition";
import { getActiveTabSnapshot, setActiveTabInSnapshot } from "@/src/tabs/state/tabSnapshot";

export const handleTabActivated = async (activeInfo: { tabId: number; windowId: number }) => {
  if (needsInitialization()) {
    await initializeAllStates();
  }

  const previousActiveTabId = getActiveTabSnapshot()?.id ?? null;
  recordActiveTransition(previousActiveTabId, activeInfo.tabId, getActivationHistory());
  setActiveTabInSnapshot(activeInfo.tabId);
  recordTabActivation(activeInfo.tabId);
};
