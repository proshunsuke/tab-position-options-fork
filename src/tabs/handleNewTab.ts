import { getSettings } from "@/src/settings/state/appData";
import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { calculateNewTabIndex } from "@/src/tabs/position";
import { isSessionRestoreTab } from "@/src/tabs/sessionRestoreDetector";
import { getLastActiveTabIdByNewTabId } from "@/src/tabs/state/activationHistory";
import { consumeRecentNewTabSourceTransition } from "@/src/tabs/state/newTabSourceTransition";
import {
  addTabToSnapshot,
  getRestoredTabSnapshot,
  getTabSnapshot,
  moveTabInSnapshot,
  refreshWindowTabSnapshot,
} from "@/src/tabs/state/tabSnapshot";
import type { TabPosition } from "@/src/types";

export const handleNewTab = async (tab: chrome.tabs.Tab) => {
  const shouldInitialize = needsInitialization();
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
  const lastActiveTabId = getSourceTabId(windowId, tab, shouldInitialize);
  addTabToSnapshot(tab);

  if (settings.newTab.openInBackground && lastActiveTabId) {
    void chrome.tabs
      .update(lastActiveTabId, { active: true })
      .catch(() => {})
      .finally(() => {
        positionTabAndUpdateStates(
          settings.newTab.position,
          windowId,
          tabId,
          tabIndex,
          lastActiveTabId,
        );
      });

    return;
  }

  positionTabAndUpdateStates(settings.newTab.position, windowId, tabId, tabIndex, lastActiveTabId);
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
) => {
  const newIndex = getNewIndex(position, windowId, lastActiveTabId, tabIndex);
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

const getSourceTabId = (windowId: number, tab: chrome.tabs.Tab, shouldInitialize: boolean) => {
  const openerTabId = tab.openerTabId;
  if (openerTabId && getTabSnapshot(windowId).some(snapshot => snapshot.id === openerTabId)) {
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
  // セッション復元によるタブかチェック
  const isSessionRestore = isSessionRestoreTab();
  if (isSessionRestore) {
    // タブの追跡は記録するが、位置調整はスキップ
    return index;
  }

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
