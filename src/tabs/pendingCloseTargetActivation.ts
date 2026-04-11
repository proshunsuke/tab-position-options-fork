import { getPendingCloseTarget } from "@/src/tabs/state/pendingCloseTarget";
import { refreshWindowTabSnapshot } from "@/src/tabs/state/tabSnapshot";

// close 補正の 2 回目をどれだけ遅らせるかを表す再主張タイミング。
// 最初の補正は即時に走り、この値は close 直後の標準 activation が被さった場合だけを拾うために使う。
const CLOSE_TARGET_REASSERT_DELAY_MS = 50;

export const schedulePendingCloseTargetActivation = (windowId: number, targetTabId: number) => {
  // まず即時に補正し、さらに close 後の標準 activation があとから被さるケースだけを
  // 短い再実行で吸収する。
  schedulePendingCloseTargetActivationAttempt(windowId, targetTabId, 0);
  schedulePendingCloseTargetActivationAttempt(
    windowId,
    targetTabId,
    CLOSE_TARGET_REASSERT_DELAY_MS,
  );
};

const schedulePendingCloseTargetActivationAttempt = (
  windowId: number,
  targetTabId: number,
  delayMs: number,
) => {
  setTimeout(() => {
    if (getPendingCloseTarget(windowId) !== targetTabId) {
      return;
    }

    void chrome.tabs
      .update(targetTabId, { active: true })
      .catch(() => {})
      .finally(() => {
        void refreshWindowTabSnapshot(windowId);
      });
  }, delayMs);
};
