import { getSettings } from "@/src/settings/state/appData";
import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { getLastActiveTabId } from "@/src/tabs/state/activationHistory";
import { getTabIndex } from "@/src/tabs/state/indexCache";
import { getTabSnapshot, updateTabSnapshot } from "@/src/tabs/state/tabSnapshot";
import { cleanupTabData, determineNextActiveTab } from "@/src/tabs/tabClosing";

export const handleTabRemoved = async (
  tabId: number,
  _removeInfo: { windowId: number; isWindowClosing: boolean },
) => {
  // Service Worker初期化チェック
  if (needsInitialization()) {
    await initializeAllStates();
  }

  const nextActiveTabId = getNextActiveTabId(tabId);
  if (nextActiveTabId) {
    chrome.tabs.update(nextActiveTabId, { active: true }).finally(() => {
      cleanupTabData(tabId);
      updateTabSnapshot();
    });
  } else {
    cleanupTabData(tabId);
    updateTabSnapshot();
  }
};

const getNextActiveTabId = (tabId: number) => {
  const settings = getSettings();
  const activateTabSetting = settings.afterTabClosing.activateTab;

  // デフォルト設定の場合は、ブラウザのデフォルト動作に任せる
  if (activateTabSetting === "default") {
    return undefined;
  }

  // 閉じたタブがアクティブでない場合は何もしない
  const lastActiveTabId = getLastActiveTabId();
  if (lastActiveTabId !== tabId) {
    return undefined;
  }

  const tabs = getTabSnapshot();
  const closedTabIndex = getTabIndex(tabId) ?? 0;

  return determineNextActiveTab(tabId, closedTabIndex, activateTabSetting, tabs);
};
