import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { moveTabInSnapshot, refreshWindowTabSnapshot } from "@/src/tabs/state/tabSnapshot";

export const handleTabMoved = async (
  tabId: number,
  moveInfo: { windowId: number; fromIndex: number; toIndex: number },
) => {
  if (needsInitialization()) {
    await initializeAllStates();
  }

  moveTabInSnapshot(moveInfo.windowId, tabId, moveInfo.toIndex);
  void refreshWindowTabSnapshot(moveInfo.windowId);
};
