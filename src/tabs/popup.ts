import { getSettings } from "@/src/settings/state/appData";
import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { handleNewTab } from "@/src/tabs/handleNewTab";
import { handleNavigationCommitted } from "@/src/tabs/loadingPage";
import { isSessionRestoreWindow } from "@/src/tabs/sessionRestoreDetector";
import { cleanupActivationHistory } from "@/src/tabs/state/activationHistory";
import {
  beginPopupMove,
  clearPendingPopup,
  clearPopupTab,
  consumePopupNavigation,
  finishPopupMove,
  getPendingPopup,
  getPopupNavigationUrl,
  getPopupTab,
  getPopupTabs,
  getWindowSnapshot,
  isPopupMoving,
  recordPopupTab,
  recordPopupUrl,
  recordPopupWindow,
  recordWindowFocus,
  removePopupWindow,
} from "@/src/tabs/state/popup";
import {
  addTabToSnapshot,
  findTabWindowId,
  refreshWindowTabSnapshot,
  removeTabFromSnapshot,
} from "@/src/tabs/state/tabSnapshot";
import { cancelActivationMove } from "@/src/tabs/tabOnActivate";
import { findUrlRule } from "@/src/tabs/urlRules";

export const handleWindowCreated = async (window: chrome.windows.Window) => {
  if (needsInitialization()) {
    // 初回イベントでは移動先ウィンドウと保存済みの変換待ち状態を復元する。
    await initializeAllStates();
  }
  const restoring = window.id !== undefined && isSessionRestoreWindow(window.id);
  recordPopupWindow(window, !restoring && !!getSettings().popup?.openAsNewTab);
  if (window.id === undefined) {
    return;
  }
  for (const tab of getPopupTabs(window.id)) {
    if (window.type === "normal") {
      clearPopupTab(tab.id!);
      void handleNewTab(tab);
    } else {
      tryMovePopup(tab.id!);
    }
  }
};

export const handleWindowFocusChanged = async (windowId: number) => {
  if (needsInitialization()) {
    // Worker再起動時のみ、ウィンドウ種別を復元してからフォーカス履歴を更新する。
    await initializeAllStates();
  }
  recordWindowFocus(windowId);
};

export const handleWindowRemoved = async (windowId: number) => {
  if (needsInitialization()) {
    // 保存した移動先・候補を復元してから削除する。
    await initializeAllStates();
  }
  removePopupWindow(windowId);
};

// 呼び出し元で初期化済み。通常タブの処理にAPI待ちを追加しない。
export const handlePopupTabCreated = (tab: chrome.tabs.Tab) => {
  const window = getWindowSnapshot(tab.windowId);
  if (!getSettings().popup?.openAsNewTab || window?.type === "normal") {
    clearPopupTab(tab.id!);
    return false;
  }
  recordPopupTab(tab);
  tryMovePopup(tab.id!);
  // ウィンドウ通知が後着する場合も、二重の初回配置を防ぐ。
  return true;
};

export const handlePopupNavigationTarget = async (
  details: chrome.webNavigation.WebNavigationSourceCallbackDetails,
) => {
  if (needsInitialization()) {
    // URL通知がWorkerを起こした場合だけ、対応するウィンドウとタブを復元する。
    await initializeAllStates();
  }
  handlePopupUrl(details.tabId, details.url);
};

export const handlePopupUrl = (tabId: number, url: string) => {
  if (!getSettings().popup?.openAsNewTab) {
    return;
  }
  const windowId = getPopupTab(tabId)?.windowId ?? findTabWindowId(tabId);
  if (
    windowId !== null &&
    windowId !== undefined &&
    getWindowSnapshot(windowId)?.type === "normal"
  ) {
    return;
  }
  recordPopupUrl(tabId, url);
  tryMovePopup(tabId);
};

export const handleTabDetached = async (
  tabId: number,
  details: { oldWindowId: number; oldPosition: number },
) => {
  if (needsInitialization()) {
    // 移動前ウィンドウの履歴を正しく削除するため、初回のみ初期化する。
    await initializeAllStates();
  }
  cancelActivationMove(details.oldWindowId);
  removeTabFromSnapshot(details.oldWindowId, tabId);
  cleanupActivationHistory(details.oldWindowId, tabId);
};

export const handleTabAttached = async (
  tabId: number,
  details: { newWindowId: number; newPosition: number },
) => {
  if (needsInitialization()) {
    // Worker再起動時は移動後のウィンドウを復元する。
    await initializeAllStates();
  }
  if (!isPopupMoving(tabId)) {
    clearPopupTab(tabId);
    void refreshWindowTabSnapshot(details.newWindowId);
  }
};

const tryMovePopup = (tabId: number) => {
  if (isPopupMoving(tabId)) {
    return;
  }
  const tab = getPopupTab(tabId);
  if (!tab) {
    return;
  }
  const pending = getPendingPopup(tab.windowId);
  if (!pending) {
    return;
  }
  const settings = getSettings().popup;
  const target =
    pending.targetWindowId === null ? undefined : getWindowSnapshot(pending.targetWindowId);
  if (!settings?.openAsNewTab || target?.type !== "normal" || target.incognito !== tab.incognito) {
    clearPendingPopup(tab.windowId);
    return;
  }
  const url = getPopupNavigationUrl(tabId) || tab.pendingUrl || tab.url;
  // URLのない初期通知では内部ページか判別できない。次のURLイベントで即時に再判定する。
  if (!url) {
    return;
  }
  if (
    /^(chrome|edge|opera|brave|vivaldi)(-|:)|^moz-extension:|^devtools:/i.test(url) ||
    findUrlRule(url, settings.exceptions)
  ) {
    clearPendingPopup(tab.windowId);
    return;
  }
  // 空ページを作ってから遷移するサイトでは、例外があれば実際のURLまで保留する。
  if (url === "about:blank" && settings.exceptions?.length) {
    return;
  }
  const windowId = pending.targetWindowId!;
  beginPopupMove(tabId);
  cancelActivationMove(tab.windowId);
  // キャッシュの判定直後に移動を開始する。保存・再取得・前面化の完了は待たない。
  void chrome.tabs
    .move(tabId, { windowId, index: -1 })
    .then(moved => {
      addTabToSnapshot(moved);
    })
    .catch(() => {
      // 移動先の終了などで失敗しても、元のポップアップを閉じない。
    })
    .finally(() => {
      finishPopupMove(tabId);
      clearPendingPopup(tab.windowId);
      clearPopupTab(tabId);
      // ナビゲーション確定が移動完了より先の場合のみ、配置後にLoading Pageを適用する。
      const navigation = consumePopupNavigation(tabId);
      if (navigation) {
        void handleNavigationCommitted(navigation);
      }
      void refreshWindowTabSnapshot(windowId);
    });
};
