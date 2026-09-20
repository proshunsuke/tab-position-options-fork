import { getSettings } from "@/src/settings/state/appData";
import {
  getTabSnapshot,
  moveTabInSnapshot,
  refreshWindowTabSnapshot,
} from "@/src/tabs/state/tabSnapshot";

type ActivationMove = { timer?: ReturnType<typeof setTimeout> };

const ACTIVATION_MOVE_RETRY_MS = 50;
const MAX_ACTIVATION_MOVE_RETRIES = 20;
const TAB_EDIT_BLOCKED_ERROR = "Tabs cannot be edited right now (user may be dragging a tab).";
const pendingActivationMoves = new Map<number, ActivationMove>();

export const getActivationIndex = (windowId: number, tabId: number) => {
  const behavior = getSettings().tabOnActivate?.behavior;
  if (!behavior || behavior === "default") {
    return null;
  }
  const tabs = getTabSnapshot(windowId);
  const tab = tabs.find(candidate => candidate.id === tabId);
  if (!tab || tab.pinned) {
    return null;
  }

  return behavior === "first" ? tabs.filter(candidate => candidate.pinned).length : tabs.length - 1;
};

export const moveActivatedTab = (windowId: number, tabId: number) => {
  cancelActivationMove(windowId);
  const index = getActivationIndex(windowId, tabId);
  if (index === null || getTabSnapshot(windowId).find(tab => tab.id === tabId)?.index === index) {
    return false;
  }

  const move: ActivationMove = {};
  pendingActivationMoves.set(windowId, move);
  attemptActivationMove(windowId, tabId, index, move, MAX_ACTIVATION_MOVE_RETRIES);
  return true;
};

export const cancelActivationMove = (windowId: number) => {
  const move = pendingActivationMoves.get(windowId);
  if (move?.timer !== undefined) {
    clearTimeout(move.timer);
  }
  pendingActivationMoves.delete(windowId);
};

const attemptActivationMove = (
  windowId: number,
  tabId: number,
  index: number,
  move: ActivationMove,
  retriesLeft: number,
) => {
  moveTabInSnapshot(windowId, tabId, index);
  void chrome.tabs
    .move(tabId, { index })
    .then(() => {
      if (pendingActivationMoves.get(windowId) === move) {
        cancelActivationMove(windowId);
      }
    })
    .catch(error => {
      if (pendingActivationMoves.get(windowId) !== move) {
        return;
      }
      if (
        !(error instanceof Error) ||
        error.message !== TAB_EDIT_BLOCKED_ERROR ||
        retriesLeft === 0
      ) {
        cancelActivationMove(windowId);
        return;
      }
      // マウス押下中はChromeが移動を拒否する。初回は待たず、この拒否時だけ再試行する。
      move.timer = setTimeout(() => {
        if (pendingActivationMoves.get(windowId) !== move) {
          return;
        }
        const tab = getTabSnapshot(windowId).find(candidate => candidate.id === tabId);
        const nextIndex = getActivationIndex(windowId, tabId);
        if (!tab?.active || nextIndex === null) {
          cancelActivationMove(windowId);
          return;
        }
        // snapshotの位置は成功前の予測値なので、同じ位置でも失敗した操作は省略しない。
        attemptActivationMove(windowId, tabId, nextIndex, move, retriesLeft - 1);
      }, ACTIVATION_MOVE_RETRY_MS);
    })
    .finally(() => {
      void refreshWindowTabSnapshot(windowId);
    });
};
