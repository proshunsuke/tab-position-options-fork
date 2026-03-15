import { getSettings } from "@/src/settings/state/appData";
import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { calculateNewTabIndex } from "@/src/tabs/position";
import { isSessionRestoreTab } from "@/src/tabs/sessionRestoreDetector";
import { getLastActiveTabIdByNewTabId } from "@/src/tabs/state/activationHistory";
import { addTabToSnapshot, getTabSnapshot, moveTabInSnapshot } from "@/src/tabs/state/tabSnapshot";
import type { TabPosition } from "@/src/types";

export const handleNewTab = async (tab: chrome.tabs.Tab) => {
  if (needsInitialization()) {
    await initializeAllStates();
  }

  const tabId = tab.id;
  const tabIndex = tab.index;
  const windowId = tab.windowId;

  if (!tabId) {
    return;
  }

  const settings = getSettings();
  const lastActiveTabId = getLastActiveTabIdByNewTabId(windowId, tabId);
  addTabToSnapshot(tab);

  if (settings.newTab.openInBackground && lastActiveTabId) {
    void chrome.tabs.update(lastActiveTabId, { active: true });
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
    void chrome.tabs.move(tabId, { index: newIndex });
  }
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
