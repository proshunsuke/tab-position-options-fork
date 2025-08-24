import { getSettings } from "@/src/settings/state/appData";
import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { calculateNewTabIndex } from "@/src/tabs/position";
import { isSessionRestoreTab } from "@/src/tabs/sessionRestoreDetector";
import { getLastActiveTabIdByNewTabId } from "@/src/tabs/state/activationHistory";
import { setTabIndex } from "@/src/tabs/state/indexCache";
import { recordTabSource } from "@/src/tabs/state/sourceMap";
import { getTabSnapshot, updateTabSnapshot } from "@/src/tabs/state/tabSnapshot";
import type { TabPosition } from "@/src/types";

export const handleNewTab = async (tab: chrome.tabs.Tab) => {
  // Service Worker初期化チェック
  if (needsInitialization()) {
    await initializeAllStates();
  }

  const tabId = tab.id;
  const tabIndex = tab.index;
  const tabOpenerTabId = tab.openerTabId;

  if (!tabId) {
    return;
  }

  const settings = getSettings();
  const lastActiveTabId = getLastActiveTabIdByNewTabId(tabId);

  // バックグラウンドで開く場合は先にフォーカスを戻す
  if (settings.newTab.openInBackground && lastActiveTabId) {
    chrome.tabs.update(lastActiveTabId, { active: true }).finally(() => {
      positionTabAndUpdateStates(
        settings.newTab.position,
        tabId,
        tabIndex,
        lastActiveTabId,
        tabOpenerTabId,
      );
    });
  } else {
    positionTabAndUpdateStates(
      settings.newTab.position,
      tabId,
      tabIndex,
      lastActiveTabId,
      tabOpenerTabId,
    );
  }
};

/**
 * タブ位置を移動するのと、合わせて適切なタイミングでステートの更新を行う責務を担う
 */
const positionTabAndUpdateStates = (
  position: TabPosition,
  tabId: number,
  tabIndex: number,
  lastActiveTabId: number | null,
  tabOpenerTabId?: number,
) => {
  const newIndex = getNewIndex(position, lastActiveTabId, tabIndex);
  if (newIndex !== tabIndex) {
    chrome.tabs.move(tabId, { index: newIndex }).finally(() => {
      updateStates(tabId, newIndex, tabOpenerTabId);
    });
  } else {
    updateStates(tabId, newIndex, tabOpenerTabId);
  }
};

/**
 * 設定を元に新規タブのあるべき位置を計算して返す
 */
const getNewIndex = (position: TabPosition, lastActiveTabId: number | null, index: number) => {
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
  const tabs = getTabSnapshot();
  return calculateNewTabIndex(position, tabs, lastActiveTabId) ?? index;
};

/**
 * ステートの更新処理をまとめる
 * ステート更新はハンドラーの最後に一度だけ行う
 */
const updateStates = (tabId: number, newIndex: number, tabOpenerTabId?: number) => {
  setTabIndex(tabId, newIndex);
  if (tabOpenerTabId) {
    recordTabSource(tabId, tabOpenerTabId);
  }
  updateTabSnapshot();
};
