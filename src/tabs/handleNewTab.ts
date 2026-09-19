import { getSettings } from "@/src/settings/state/appData";
import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { calculateNewTabIndex } from "@/src/tabs/position";
import { isSessionRestoreTab } from "@/src/tabs/sessionRestoreDetector";
import {
  getActivationHistory,
  getLastActiveTabIdByNewTabId,
} from "@/src/tabs/state/activationHistory";
import { getLoadingPositionRevision, markRestoredLoadingTab } from "@/src/tabs/state/loadingPage";
import { recordNewTabActivation } from "@/src/tabs/state/newTabActivation";
import { consumeRecentNewTabSourceTransition } from "@/src/tabs/state/newTabSourceTransition";
import {
  addTabToSnapshot,
  getRestoredTabSnapshot,
  getTabSnapshot,
  moveTabInSnapshot,
  refreshWindowTabSnapshot,
} from "@/src/tabs/state/tabSnapshot";
import { getActivationIndex } from "@/src/tabs/tabOnActivate";
import { findUrlRule } from "@/src/tabs/urlRules";
import type { TabPosition } from "@/src/types";

export const handleNewTab = async (tab: chrome.tabs.Tab) => {
  const shouldInitialize = needsInitialization();
  // 初期化がliveのactive tabを履歴に取り込む前に、後続activationの処理済み印を付ける。
  if (
    tab.id !== undefined &&
    tab.active &&
    (shouldInitialize || getActivationHistory(tab.windowId).at(-1) !== tab.id)
  ) {
    recordNewTabActivation(tab.windowId, tab.id);
  }
  if (shouldInitialize) {
    await initializeAllStates();
  }

  const tabId = tab.id;
  const tabIndex = tab.index;
  const windowId = tab.windowId;

  if (!tabId) {
    return;
  }

  const settings = getSettings();
  const rule = findUrlRule(tab.pendingUrl || tab.url || "", settings.newTab.urlRules);
  const position = rule?.position ?? settings.newTab.position;
  const openInBackground = rule ? rule.active === "background" : settings.newTab.openInBackground;
  const lastActiveTabId = getSourceTabId(windowId, tab, shouldInitialize, rule !== undefined);
  addTabToSnapshot(tab);

  // 復元時はURLルールによる前面化・背景化も行わない。
  if (isSessionRestoreTab()) {
    markRestoredLoadingTab(tabId);
    void refreshWindowTabSnapshot(windowId);
    return;
  }

  if (rule?.active === "foreground" && !tab.active) {
    recordNewTabActivation(windowId, tabId);
    void chrome.tabs.update(tabId, { active: true }).catch(() => {});
  }

  const loadingRevision = getLoadingPositionRevision(tabId);
  if (openInBackground && lastActiveTabId) {
    // 既存の背景化経路では、元タブの再選択が完了してから配置する必要がある。
    void chrome.tabs
      .update(lastActiveTabId, { active: true })
      .catch(() => {})
      .finally(() => {
        // 背景化の完了前にLoading Pageが配置した場合、古い新規タブルールで戻さない。
        if (getLoadingPositionRevision(tabId) !== loadingRevision) {
          return;
        }
        positionTabAndUpdateStates(
          position,
          windowId,
          tabId,
          tabIndex,
          lastActiveTabId,
          false,
          rule !== undefined,
        );
      });

    return;
  }

  positionTabAndUpdateStates(
    position,
    windowId,
    tabId,
    tabIndex,
    lastActiveTabId,
    (tab.active || rule?.active === "foreground") && !openInBackground,
    rule !== undefined,
  );
};

/**
 * タブ位置を移動するのと、合わせて適切なタイミングでステートの更新を行う責務を担う
 */
const positionTabAndUpdateStates = (
  position: TabPosition,
  windowId: number,
  tabId: number,
  tabIndex: number,
  lastActiveTabId: number | null,
  applyActivation = false,
  hasUrlRule = false,
) => {
  // 新規配置とactivationの最終位置を先に決め、途中の位置への移動を避ける。
  const activationIndex = applyActivation ? getActivationIndex(windowId, tabId) : null;
  const newIndex =
    activationIndex ??
    (hasUrlRule
      ? getRuleIndex(position, windowId, lastActiveTabId, tabIndex)
      : getNewIndex(position, windowId, lastActiveTabId, tabIndex));
  if (newIndex !== tabIndex) {
    moveTabInSnapshot(windowId, tabId, newIndex);
    void chrome.tabs
      .move(tabId, { index: newIndex })
      .catch(() => {})
      .finally(() => {
        void refreshWindowTabSnapshot(windowId);
      });

    return;
  }

  void refreshWindowTabSnapshot(windowId);
};

const getSourceTabId = (
  windowId: number,
  tab: chrome.tabs.Tab,
  shouldInitialize: boolean,
  useCurrentTab = false,
) => {
  const openerTabId = tab.openerTabId;
  if (
    !useCurrentTab &&
    openerTabId &&
    getTabSnapshot(windowId).some(snapshot => snapshot.id === openerTabId)
  ) {
    return openerTabId;
  }

  if (!tab.id) {
    return null;
  }

  const sourceTabId = consumeRecentNewTabSourceTransition(windowId, tab.id);
  if (sourceTabId !== null) {
    return sourceTabId;
  }

  const lastActiveTabId = getLastActiveTabIdByNewTabId(windowId, tab.id);
  if (lastActiveTabId !== null) {
    return lastActiveTabId;
  }

  if (shouldInitialize) {
    const liveTabIds = new Set(getTabSnapshot(windowId).map(snapshot => snapshot.id));
    const restoredActiveTabId = getRestoredTabSnapshot(windowId).find(
      snapshot => snapshot.active && liveTabIds.has(snapshot.id),
    )?.id;
    if (restoredActiveTabId !== undefined && restoredActiveTabId !== tab.id) {
      return restoredActiveTabId;
    }
  }

  return null;
};

/**
 * 設定を元に新規タブのあるべき位置を計算して返す
 */
const getNewIndex = (
  position: TabPosition,
  windowId: number,
  lastActiveTabId: number | null,
  index: number,
) => {
  // デフォルト・lastの場合は何もしない
  if (["default", "last"].includes(position)) {
    return index;
  }

  if (lastActiveTabId === null) {
    return index;
  }
  const tabs = getTabSnapshot(windowId);
  return calculateNewTabIndex(position, tabs, lastActiveTabId) ?? index;
};

const getRuleIndex = (
  position: TabPosition,
  windowId: number,
  sourceTabId: number | null,
  index: number,
) => {
  const tabs = getTabSnapshot(windowId);
  if (position === "default") {
    return index;
  }
  if (position === "first") {
    return tabs.filter(tab => tab.pinned).length;
  }
  if (position === "last") {
    return tabs.length - 1;
  }
  const source = tabs.find(tab => tab.id === sourceTabId);
  if (!source) {
    return index;
  }
  // 対象タブを取り除いた後のインデックスに合わせる。
  const sourceIndex = source.index - (index < source.index ? 1 : 0);
  return Math.max(
    tabs.filter(tab => tab.pinned).length,
    sourceIndex + (position === "right" ? 1 : 0),
  );
};
