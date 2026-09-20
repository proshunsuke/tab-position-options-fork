import { getSettings } from "@/src/settings/state/appData";
import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { handlePopupUrl } from "@/src/tabs/popup";
import { markSessionRestoreTabs } from "@/src/tabs/sessionRestoreDetector";
import {
  consumeLoadingNavigation,
  markRestoredLoadingTab,
  recordLoadingNavigation,
  recordLoadingPosition,
} from "@/src/tabs/state/loadingPage";
import { deferPopupNavigation } from "@/src/tabs/state/popup";
import {
  findTabWindowId,
  getTabSnapshot,
  moveTabInSnapshot,
  refreshWindowTabSnapshot,
} from "@/src/tabs/state/tabSnapshot";
import { cancelActivationMove } from "@/src/tabs/tabOnActivate";
import { findUrlRule } from "@/src/tabs/urlRules";

let startupCommittedTabs: Set<number> | undefined;

export const handleBeforeNavigate = async (
  details: chrome.webNavigation.WebNavigationBaseCallbackDetails,
) => {
  if (details.frameId !== 0) {
    return;
  }
  const restoring = startupCommittedTabs !== undefined;
  if (needsInitialization()) {
    // Worker再起動時のみ、保存したnavigationと設定の復元が必要。
    await initializeAllStates();
  }
  handlePopupUrl(details.tabId, details.url);
  if (!getSettings().loadingPage?.urlRules?.length) {
    return;
  }
  recordLoadingNavigation(details.tabId, details.url, details.timeStamp, restoring);
};

export const handleNavigationCommitted = async (
  details: chrome.webNavigation.WebNavigationTransitionCallbackDetails,
) => {
  if (details.frameId !== 0) {
    return;
  }
  startupCommittedTabs?.add(details.tabId);
  const restoring = startupCommittedTabs !== undefined;
  if (needsInitialization()) {
    // Worker再起動時のみ、URLルール・遷移元・タブ配置の復元を待つ。
    await initializeAllStates();
  }
  if (deferPopupNavigation(details)) {
    return;
  }
  const navigation = consumeLoadingNavigation(details.tabId, details.timeStamp);
  // 初期化時点で読み込み済みのタブからの新しい遷移は、復元のreloadと区別する。
  if (
    !navigation ||
    restoring ||
    navigation.restoring ||
    (navigation.restored && details.transitionType === "reload")
  ) {
    return;
  }
  const rules = getSettings().loadingPage?.urlRules;
  const rule =
    findUrlRule(details.url, rules) ??
    (details.transitionQualifiers.includes("server_redirect")
      ? findUrlRule(navigation.url ?? "", rules)
      : undefined);
  if (!rule) {
    return;
  }
  const windowId = findTabWindowId(details.tabId);
  if (windowId === null) {
    return;
  }
  const tabs = getTabSnapshot(windowId);
  const tab = tabs.find(candidate => candidate.id === details.tabId);
  // ピン留めの領域は変更せず、通常タブはその後ろに配置する。
  if (!tab || tab.pinned) {
    return;
  }
  const pinnedCount = tabs.filter(candidate => candidate.pinned).length;
  const index =
    rule.position === "first"
      ? pinnedCount
      : rule.position === "middle"
        ? Math.max(pinnedCount, Math.floor(tabs.length / 2))
        : tabs.length - 1;
  recordLoadingPosition(details.tabId);
  // 同じタブの古いactivation再試行がnavigationの配置を上書きしないようにする。
  if (tab.active) {
    cancelActivationMove(windowId);
  }
  if (tab.index === index) {
    return;
  }
  moveTabInSnapshot(windowId, details.tabId, index);
  void chrome.tabs
    .move(details.tabId, { index })
    .catch(() => {})
    .finally(() => {
      void refreshWindowTabSnapshot(windowId);
    });
};

export const handleNavigationError = async (
  details: chrome.webNavigation.WebNavigationFramedErrorCallbackDetails,
) => {
  if (details.frameId !== 0) {
    return;
  }
  if (needsInitialization()) {
    // 保存済みの遷移状態を復元してから破棄する。
    await initializeAllStates();
  }
  consumeLoadingNavigation(details.tabId, details.timeStamp);
};

export const handleLoadingPageStartup = async () => {
  const committedTabs = new Set<number>();
  startupCommittedTabs = committedTabs;
  // 復元タブは一時的にcompleteと報告されることもあるため、起動時の全タブを記録する。
  // 固定時間を待たず、各タブの最初のnavigationが終わるまで除外する。
  const tabsPromise = chrome.tabs.query({}).catch(() => []);
  await initializeAllStates();
  const tabs = await tabsPromise;
  markSessionRestoreTabs(tabs);
  for (const tab of tabs) {
    if (tab.id !== undefined && !committedTabs.has(tab.id)) {
      markRestoredLoadingTab(tab.id);
    }
  }
  startupCommittedTabs = undefined;
};
