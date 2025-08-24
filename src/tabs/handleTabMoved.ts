import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { setAllTabIndexes } from "@/src/tabs/state/indexCache";
import { updateTabSnapshot } from "@/src/tabs/state/tabSnapshot";

export const handleTabMoved = async (
  _tabId: number,
  _moveInfo: { windowId: number; fromIndex: number; toIndex: number },
) => {
  // Service Worker初期化チェック
  if (needsInitialization()) {
    await initializeAllStates();
  }

  setAllTabIndexes();
  updateTabSnapshot();
};
