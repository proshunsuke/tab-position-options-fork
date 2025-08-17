import { settingsState } from "@/src/storage";
import { calculateNewTabIndex } from "@/src/tabs/position";
import {
  handleBrowserStartup,
  initSessionRestoreDetector,
  isSessionRestoreTab,
} from "@/src/tabs/sessionRestoreDetector";
import { getPreviousActiveTabId, recordTabActivation } from "@/src/tabs/state/activationHistory";
import {
  tabIndexCacheState,
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
    try {
      // 更新されたタブ情報を使用
      tab = await chrome.tabs.get(tab.id);
    } catch (_err) {}
  }

  if (tab.id) {
    await updateTabIndexCache(tab.id);
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
      if (tab.active && tab.id) {
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
  } catch (_error) {}
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
    let cache = await tabIndexCacheState.get();

    // キャッシュが空の場合は現在のタブ状態から構築
    if (cache.size === 0) {
      await updateAllTabIndexCache(removeInfo.windowId);
      cache = await tabIndexCacheState.get();
    }

    const closedTabIndex = cache.get(tabId) ?? 0;

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
    await cleanupTabData(tabId);
  }
};

const handleTabMoved = async (
  tabId: number,
  moveInfo: { windowId: number; fromIndex: number; toIndex: number },
) => {
  await updateTabIndexCache(tabId);
  const tabs = await chrome.tabs.query({ windowId: moveInfo.windowId });
  const cache = await tabIndexCacheState.get();
  for (const tab of tabs) {
    if (tab.id) {
      cache.set(tab.id, tab.index);
    }
  }
  await tabIndexCacheState.set(cache);
};

export const setupTabHandlers = () => {
  if (typeof chrome !== "undefined" && chrome.tabs && chrome.runtime) {
    initSessionRestoreDetector();

    chrome.tabs.onCreated.addListener(handleNewTab);
    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    chrome.tabs.onMoved.addListener(handleTabMoved);
    chrome.runtime.onStartup.addListener(handleBrowserStartup);

    // 初期化処理は削除（Service Worker対応）
    // キャッシュは各イベントハンドラー内で必要に応じて更新
  }
};
