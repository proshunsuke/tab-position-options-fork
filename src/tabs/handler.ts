import { settingsState } from "@/src/storage";
import { calculateNewTabIndex } from "@/src/tabs/position";
import {
  handleBrowserStartup,
  initSessionRestoreDetector,
  isSessionRestoreTab,
} from "@/src/tabs/sessionRestoreDetector";
import { getPreviousActiveTabId, recordTabActivation } from "@/src/tabs/state/activationHistory";
import {
  getTabIndex,
  updateAllTabIndexCache,
  updateTabIndexCache,
} from "@/src/tabs/state/indexCache";
import { recordTabSource } from "@/src/tabs/state/sourceMap";
import { cleanupTabData, determineNextActiveTab } from "@/src/tabs/tabClosing";

export const handleNewTab = async (tab: chrome.tabs.Tab) => {
  // セッション復元によるタブかチェック
  const isSessionRestore = isSessionRestoreTab();

  if (isSessionRestore) {
    // タブの追跡は記録するが、位置調整はスキップ
    if (tab.id) {
      await updateTabIndexCache(tab.id);
      if (tab.openerTabId) {
        await recordTabSource(tab.id, tab.openerTabId);
      }
    }
    return;
  }
  // chrome.tabs.getで最新のタブ情報を取得（openerTabIdを含む）
  if (tab.id) {
    const tabId = tab.id; // TypeScript用に一時変数に保存
    try {
      // 更新されたタブ情報を使用
      const updatedTab = await chrome.tabs.get(tabId);
      tab = updatedTab;
    } catch (_error) {
      // タブが既に閉じられている場合は元のタブ情報を使用
    }
    await updateTabIndexCache(tabId);
  }

  // openerTabIdがある場合、ソース情報を記録
  if (tab.id && tab.openerTabId) {
    await recordTabSource(tab.id, tab.openerTabId);
  }

  try {
    const settings = await settingsState.get();

    // 現在はnewTabの設定をすべてのタブに適用（ブックマークからのタブも含む）
    const position = settings.newTab.position;

    // デフォルトの場合は何もしない
    if (position === "default" || !tab.id) {
      return;
    }

    const tabs = await chrome.tabs.query({ currentWindow: true });

    let previousActiveTab: chrome.tabs.Tab | undefined;

    if (tab.openerTabId) {
      previousActiveTab = tabs.find(t => t.id === tab.openerTabId);
    } else {
      // 外部アプリケーションからのタブ（openerTabIdがなく、作成時にアクティブ）の場合
      if (tab.active) {
        // getPreviousActiveTabIdに現在のタブIDを渡すだけ
        // メソッドがレースコンディションを自動判定して適切な前のタブを返す
        const previousTabId = await getPreviousActiveTabId(tab.id);
        if (previousTabId) {
          previousActiveTab = tabs.find(t => t.id === previousTabId);
        }
      }

      // それでも見つからない場合のフォールバック
      if (!previousActiveTab) {
        // 新規タブ以外でアクティブなタブを探す
        previousActiveTab = tabs.find(t => t.id !== tab.id && t.active);

        // それでも見つからない場合、新規タブの左隣のタブを前のアクティブタブとみなす
        if (!previousActiveTab && tab.index > 0) {
          previousActiveTab = tabs.find(t => t.index === tab.index - 1);
        }
      }
    }

    const newIndex = calculateNewTabIndex(position, tabs, previousActiveTab);

    if (newIndex !== undefined && newIndex !== tab.index) {
      await chrome.tabs.move(tab.id, { index: newIndex });
      await updateTabIndexCache(tab.id);
    }
  } catch (_error) {
    // 設定の読み込みや移動に失敗した場合は無視
  }
};

export const handleTabActivated = async (activeInfo: { tabId: number; windowId: number }) => {
  await recordTabActivation(activeInfo.tabId);
  await updateTabIndexCache(activeInfo.tabId);
};

export const handleTabRemoved = async (
  tabId: number,
  removeInfo: { windowId: number; isWindowClosing: boolean },
) => {
  // ウィンドウが閉じられた場合は何もしない
  if (removeInfo.isWindowClosing) {
    await cleanupTabData(tabId);
    return;
  }

  try {
    const settings = await settingsState.get();
    const activateTabSetting = settings.afterTabClosing.activateTab;

    // デフォルト設定の場合は、ブラウザのデフォルト動作に任せる
    if (activateTabSetting === "default") {
      await cleanupTabData(tabId);
      return;
    }

    // 閉じたタブが最後にアクティブだったタブかチェック
    // 重要: タブが閉じられた直後にChromeが自動的に別のタブをアクティブにすることがある
    // そのため、履歴の最後が閉じたタブでない場合でも、
    // 直前まで閉じたタブがアクティブだった可能性がある

    const lastActiveTabId = await getPreviousActiveTabId();
    let wasLastActive = lastActiveTabId === tabId;

    // lastActiveTabIdがnullの場合、タブがアクティブだった可能性を考慮
    // タブを閉じた直後に他のタブがアクティブになっている場合も考慮
    if (!wasLastActive && lastActiveTabId === null) {
      // タブが閉じられた直後の状況を確認
      wasLastActive = true;
    }

    if (!wasLastActive) {
      await cleanupTabData(tabId);
      return;
    }

    // キャッシュからタブのインデックスを取得
    const closedTabIndex = (await getTabIndex(tabId, removeInfo.windowId)) ?? 0;

    const nextTabId = await determineNextActiveTab(
      tabId,
      closedTabIndex,
      activateTabSetting,
      removeInfo.windowId,
    );

    await cleanupTabData(tabId);

    if (nextTabId !== null) {
      await chrome.tabs.update(nextTabId, { active: true });
    }
  } catch (_error) {
    // エラーが発生してもクリーンアップは実行
    await cleanupTabData(tabId);
  }
};

const handleTabMoved = async (
  _tabId: number,
  moveInfo: { windowId: number; fromIndex: number; toIndex: number },
) => {
  const tabs = await chrome.tabs.query({ windowId: moveInfo.windowId });
  await updateAllTabIndexCache(moveInfo.windowId, tabs);
};

export const setupTabHandlers = () => {
  if (typeof chrome !== "undefined" && chrome.tabs && chrome.runtime) {
    initSessionRestoreDetector();

    chrome.tabs.onCreated.addListener(handleNewTab);
    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    chrome.tabs.onMoved.addListener(handleTabMoved);
    chrome.runtime.onStartup.addListener(handleBrowserStartup);
  }
};
