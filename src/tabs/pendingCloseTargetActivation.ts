import { getPendingCloseTarget } from "@/src/tabs/state/pendingCloseTarget";
import { refreshWindowTabSnapshot } from "@/src/tabs/state/tabSnapshot";

// close 補正の 2 回目をどれだけ遅らせるかを表す再主張タイミング。
// 最初の補正は即時に走り、この値は close 直後の標準 activation が被さった場合だけを拾うために使う。
const CLOSE_TARGET_REASSERT_DELAY_MS = 50;

export const applyPendingCloseTargetActivation = (windowId: number, targetTabId: number) => {
  // 本体補正はイベント処理中に即時で打ち、遅延側は標準 activation があとから被さった場合の
  // 最小限の再主張だけに限定する。
  void chrome.tabs
    .update(targetTabId, { active: true })
    .catch(() => {})
    .finally(() => {
      void refreshWindowTabSnapshot(windowId);
    });

  schedulePendingCloseTargetReassertion(windowId, targetTabId);
};

const schedulePendingCloseTargetReassertion = (windowId: number, targetTabId: number) => {
  setTimeout(() => {
    reassertPendingCloseTargetActivation(windowId, targetTabId);
  }, CLOSE_TARGET_REASSERT_DELAY_MS);
};

const reassertPendingCloseTargetActivation = (windowId: number, targetTabId: number) => {
  if (getPendingCloseTarget(windowId) !== targetTabId) {
    return;
  }

  void chrome.tabs
    .update(targetTabId, { active: true })
    .catch(() => {})
    .finally(() => {
      void refreshWindowTabSnapshot(windowId);
    });
};
