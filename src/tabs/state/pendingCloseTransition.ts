type PendingCloseTransition = {
  fromTabId: number;
  toTabId: number;
  historyBefore: number[];
  createdAt: number;
};

let pendingCloseTransitionState: Record<string, PendingCloseTransition> = {};
const MAX_PENDING_CLOSE_TRANSITION_AGE_MS = 25;

const getWindowKey = (windowId: number) => {
  return String(windowId);
};

export const recordPendingCloseTransition = (
  windowId: number,
  fromTabId: number | null,
  toTabId: number,
  historyBefore: number[],
) => {
  clearPendingCloseTransition(windowId);

  if (fromTabId === null || fromTabId === toTabId) {
    return;
  }

  const windowKey = getWindowKey(windowId);

  pendingCloseTransitionState = {
    ...pendingCloseTransitionState,
    [windowKey]: {
      fromTabId,
      toTabId,
      historyBefore,
      createdAt: Date.now(),
    },
  };
};

// Chrome 146+ では active tab close 時に onActivated が先行するため、
// その直後の onRemoved とだけ結び付ける短命な one-shot state として扱う。
export const consumePendingCloseTransition = (
  windowId: number,
  removedTabId: number,
  activeTabId: number | null,
) => {
  const windowKey = getWindowKey(windowId);
  const transition = pendingCloseTransitionState[windowKey];
  clearPendingCloseTransition(windowId);

  if (!transition) {
    return null;
  }

  if (transition.fromTabId !== removedTabId || transition.toTabId !== activeTabId) {
    return null;
  }

  if (Date.now() - transition.createdAt > MAX_PENDING_CLOSE_TRANSITION_AGE_MS) {
    return null;
  }

  return transition;
};

export const clearPendingCloseTransition = (windowId: number) => {
  const windowKey = getWindowKey(windowId);
  const nextState = {
    ...pendingCloseTransitionState,
  };
  delete nextState[windowKey];
  pendingCloseTransitionState = nextState;
};

export const resetPendingCloseTransition = () => {
  pendingCloseTransitionState = {};
};
