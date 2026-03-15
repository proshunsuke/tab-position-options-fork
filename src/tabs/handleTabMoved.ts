import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { moveTabInSnapshot } from "@/src/tabs/state/tabSnapshot";

export const handleTabMoved = async (
  tabId: number,
  moveInfo: { windowId: number; fromIndex: number; toIndex: number },
) => {
  if (needsInitialization()) {
    await initializeAllStates();
  }

  moveTabInSnapshot(tabId, moveInfo.toIndex);
};
