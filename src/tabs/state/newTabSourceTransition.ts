type NewTabSourceTransition = {
  sourceTabId: number;
  newTabId: number;
  expiresAt: number;
};

const NEW_TAB_SOURCE_TRANSITION_WINDOW_MS = 100;

let newTabSourceTransitionState: Record<string, NewTabSourceTransition> = {};

const getWindowKey = (windowId: number) => {
  return String(windowId);
};

export const recordNewTabSourceTransition = (
  windowId: number,
  sourceTabId: number | null,
  newTabId: number,
  windowMs = NEW_TAB_SOURCE_TRANSITION_WINDOW_MS,
) => {
  clearNewTabSourceTransition(windowId);

  if (sourceTabId === null || sourceTabId === newTabId) {
    return;
  }

  newTabSourceTransitionState = {
    ...newTabSourceTransitionState,
    [getWindowKey(windowId)]: {
      sourceTabId,
      newTabId,
      expiresAt: Date.now() + windowMs,
    },
  };
};

// 外部アプリ起点では onActivated -> onCreated の順になることがあるため、
// 直前の activation を短時間だけ保持して新規タブの source を補完する。
export const consumeRecentNewTabSourceTransition = (windowId: number, newTabId: number) => {
  const windowKey = getWindowKey(windowId);
  const transition = newTabSourceTransitionState[windowKey];
  clearNewTabSourceTransition(windowId);

  if (!transition) {
    return null;
  }

  if (Date.now() > transition.expiresAt) {
    return null;
  }

  if (transition.newTabId !== newTabId) {
    return null;
  }

  return transition.sourceTabId;
};

export const clearNewTabSourceTransition = (windowId: number) => {
  const windowKey = getWindowKey(windowId);
  const nextState = {
    ...newTabSourceTransitionState,
  };
  delete nextState[windowKey];
  newTabSourceTransitionState = nextState;
};

export const resetNewTabSourceTransition = () => {
  newTabSourceTransitionState = {};
};
