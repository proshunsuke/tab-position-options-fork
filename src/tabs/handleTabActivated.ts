import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { recordTabActivation } from "@/src/tabs/state/activationHistory";
import { setTabIndexFromChrome } from "@/src/tabs/state/indexCache";
import { updateTabSnapshot } from "@/src/tabs/state/tabSnapshot";

export const handleTabActivated = async (activeInfo: { tabId: number; windowId: number }) => {
  // Service Worker初期化チェック
  if (needsInitialization()) {
    await initializeAllStates();
  }

  recordTabActivation(activeInfo.tabId);
  setTabIndexFromChrome(activeInfo.tabId);
  updateTabSnapshot();
};
