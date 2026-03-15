type ActiveTransition = {
  fromTabId: number | null;
  toTabId: number;
  historyBefore: number[];
  expiresAt: number;
};

const CLOSE_TRANSITION_WINDOW_MS = 100;

let activeTransitionState: Record<string, ActiveTransition> = {};

const getWindowKey = (windowId: number) => {
  return String(windowId);
};

export const recordActiveTransition = (
  windowId: number,
  fromTabId: number | null,
  toTabId: number,
  historyBefore: number[],
  windowMs = CLOSE_TRANSITION_WINDOW_MS,
) => {
  activeTransitionState = {
    ...activeTransitionState,
    [getWindowKey(windowId)]: {
      fromTabId,
      toTabId,
      historyBefore,
      expiresAt: Date.now() + windowMs,
    },
  };
};

export const getRecentActiveTransition = (windowId: number) => {
  const windowKey = getWindowKey(windowId);
  const transition = activeTransitionState[windowKey];
  if (!transition) {
    return null;
  }

  if (Date.now() > transition.expiresAt) {
    const nextState = {
      ...activeTransitionState,
    };
    delete nextState[windowKey];
    activeTransitionState = nextState;
    return null;
  }

  return transition;
};

export const clearActiveTransition = (windowId: number) => {
  const windowKey = getWindowKey(windowId);
  const nextState = {
    ...activeTransitionState,
  };
  delete nextState[windowKey];
  activeTransitionState = nextState;
};

export const resetActiveTransition = () => {
  activeTransitionState = {};
};
