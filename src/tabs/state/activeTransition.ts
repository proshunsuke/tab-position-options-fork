type ActiveTransition = {
  fromTabId: number | null;
  toTabId: number;
  historyBefore: number[];
  timestamp: number;
};

const CLOSE_TRANSITION_WINDOW_MS = 100;

let activeTransitionState: ActiveTransition | null = null;

export const recordActiveTransition = (
  fromTabId: number | null,
  toTabId: number,
  historyBefore: number[],
) => {
  activeTransitionState = {
    fromTabId,
    toTabId,
    historyBefore,
    timestamp: Date.now(),
  };
};

export const getRecentActiveTransition = () => {
  if (!activeTransitionState) {
    return null;
  }

  if (Date.now() - activeTransitionState.timestamp > CLOSE_TRANSITION_WINDOW_MS) {
    activeTransitionState = null;
    return null;
  }

  return activeTransitionState;
};

export const clearActiveTransition = () => {
  activeTransitionState = null;
};

export const resetActiveTransition = () => {
  activeTransitionState = null;
};
