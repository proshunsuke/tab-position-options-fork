import { getSettings } from "@/src/settings/state/appData";
import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { getActivationHistory } from "@/src/tabs/state/activationHistory";
import {
  clearActiveTransition,
  getRecentActiveTransition,
} from "@/src/tabs/state/activeTransition";
import {
  getActiveTabSnapshot,
  getTabSnapshot,
  getTabSnapshotById,
  removeTabFromSnapshot,
  setActiveTabInSnapshot,
} from "@/src/tabs/state/tabSnapshot";
import { cleanupTabData, determineNextActiveTab } from "@/src/tabs/tabClosing";

export const handleTabRemoved = async (
  tabId: number,
  _removeInfo: { windowId: number; isWindowClosing: boolean },
) => {
  if (needsInitialization()) {
    await initializeAllStates();
  }

  const settings = getSettings();
  const tabs = getTabSnapshot();
  const closedTab = getTabSnapshotById(tabId);
  const activeTransition = getRecentActiveTransition();
  const currentActiveTab = getActiveTabSnapshot();
  const isClosedActiveTab =
    closedTab?.active === true ||
    (activeTransition?.fromTabId === tabId && currentActiveTab?.id === activeTransition.toTabId);
  const activationHistory =
    activeTransition?.fromTabId === tabId ? activeTransition.historyBefore : getActivationHistory();

  const nextActiveTabId =
    closedTab && isClosedActiveTab && settings.afterTabClosing.activateTab !== "default"
      ? determineNextActiveTab(
          closedTab,
          settings.afterTabClosing.activateTab,
          tabs,
          activationHistory,
        )
      : null;

  cleanupTabData(tabId);
  removeTabFromSnapshot(tabId);

  if (nextActiveTabId !== null) {
    setActiveTabInSnapshot(nextActiveTabId);
    void chrome.tabs.update(nextActiveTabId, { active: true });
  }

  if (activeTransition?.fromTabId === tabId || activeTransition?.toTabId === tabId) {
    clearActiveTransition();
  }
};
