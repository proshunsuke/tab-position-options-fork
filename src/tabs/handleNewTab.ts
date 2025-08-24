import { getSettings } from "@/src/settings/state/appData";
import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { calculateNewTabIndex } from "@/src/tabs/position";
import { isSessionRestoreTab } from "@/src/tabs/sessionRestoreDetector";
import { getLastActiveTabIdByNewTabId } from "@/src/tabs/state/activationHistory";
import { setTabIndex } from "@/src/tabs/state/indexCache";
import { recordTabSource } from "@/src/tabs/state/sourceMap";
import { getTabSnapshot, updateTabSnapshot } from "@/src/tabs/state/tabSnapshot";

export const handleNewTab = async (tab: chrome.tabs.Tab) => {
  // Service Worker初期化チェック
  if (needsInitialization()) {
    await initializeAllStates();
  }

  if (!tab.id) {
    return;
  }

  // 新規タブの位置を計算
  const newIndex = getNewIndex(tab.id, tab.index);

  // それぞれのステートを更新
  setTabIndex(tab.id, newIndex);
  if (tab.openerTabId) {
    recordTabSource(tab.id, tab.openerTabId);
  }

  // 新規タブの位置が変更される場合は移動
  if (newIndex !== tab.index) {
    chrome.tabs.move(tab.id, { index: newIndex }).finally(() => {
      updateTabSnapshot();
    });
  } else {
    updateTabSnapshot();
  }
};

const getNewIndex = (id: number, index: number) => {
  // セッション復元によるタブかチェック
  const isSessionRestore = isSessionRestoreTab();
  if (isSessionRestore) {
    // タブの追跡は記録するが、位置調整はスキップ
    return index;
  }
  const settings = getSettings();

  // 現在はnewTabの設定をすべてのタブに適用（ブックマークからのタブも含む）
  const position = settings.newTab.position;
  // デフォルト・lastの場合は何もしない
  if (["default", "last"].includes(position)) {
    return index;
  }

  const lastActiveTabId = getLastActiveTabIdByNewTabId(id);
  if (lastActiveTabId === null) {
    return index;
  }
  const tabs = getTabSnapshot();
  return calculateNewTabIndex(position, tabs, lastActiveTabId) ?? index;
};
