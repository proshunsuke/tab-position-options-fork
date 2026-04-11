type PendingCloseTarget = {
  targetTabId: number;
  expiresAt: number;
};

// close 補正の一時状態をどれだけ保持するかを表す寿命。
// この時間だけ待ってから処理するのではなく、この window 内だけ pending target を有効とみなす。
const PENDING_CLOSE_TARGET_WINDOW_MS = 100;

// active tab close 後に本来到達すべき tab を短時間だけ保持する one-shot state。
// 永続的な active state ではなく、close 直後の標準 activation との競合を吸収するために使う。
let pendingCloseTargetState: Record<string, PendingCloseTarget> = {};

const getWindowKey = (windowId: number) => {
  return String(windowId);
};

export const recordPendingCloseTarget = (
  windowId: number,
  targetTabId: number,
  windowMs = PENDING_CLOSE_TARGET_WINDOW_MS,
) => {
  clearPendingCloseTarget(windowId);

  pendingCloseTargetState = {
    ...pendingCloseTargetState,
    [getWindowKey(windowId)]: {
      targetTabId,
      expiresAt: Date.now() + windowMs,
    },
  };
};

export const getPendingCloseTarget = (windowId: number) => {
  const pendingCloseTarget = pendingCloseTargetState[getWindowKey(windowId)];
  if (!pendingCloseTarget) {
    return null;
  }

  if (Date.now() > pendingCloseTarget.expiresAt) {
    clearPendingCloseTarget(windowId);
    return null;
  }

  return pendingCloseTarget.targetTabId;
};

export const clearPendingCloseTarget = (windowId: number) => {
  const windowKey = getWindowKey(windowId);
  const nextState = {
    ...pendingCloseTargetState,
  };
  delete nextState[windowKey];
  pendingCloseTargetState = nextState;
};

export const resetPendingCloseTarget = () => {
  pendingCloseTargetState = {};
};
