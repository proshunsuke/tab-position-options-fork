import { getSettings } from "@/src/storage";
import {
  cleanupTabData,
  determineNextActiveTab,
  recordTabActivation,
  recordTabSource,
} from "@/src/tabs/closeHandler";
import { calculateNewTabIndex } from "@/src/tabs/position";
import {
  handleBrowserStartup,
  initSessionRestoreDetector,
  isSessionRestoreTab,
} from "@/src/tabs/sessionRestoreDetector";
import {
  deleteFromTabIndexCache,
  getTabIndexCache,
  lastActiveTabState,
  setTabIndexCache,
  updateTabIndexCache,
} from "@/src/tabs/tabState";

export const handleNewTab = async (tab: chrome.tabs.Tab) => {
  // セッション復元によるタブかチェック
  const isSessionRestore = isSessionRestoreTab();

  if (isSessionRestore) {
    // タブの追跡は記録するが、位置調整はスキップ
    if (tab.id) {
      await updateTabIndexCache(tab.id);
      if (tab.openerTabId) {
        recordTabSource(tab.id, tab.openerTabId);
      }
    }
    return;
  }
  // chrome.tabs.getで最新のタブ情報を取得（openerTabIdを含む）
  if (tab.id) {
    try {
      // 更新されたタブ情報を使用
      tab = await chrome.tabs.get(tab.id);
    } catch (err) {
      console.error("Failed to get full tab info:", err);
    }
  }

  // インデックスをキャッシュ
  if (tab.id) {
    await updateTabIndexCache(tab.id);
  }

  // openerTabIdがある場合、ソース情報を記録
  if (tab.id && tab.openerTabId) {
    recordTabSource(tab.id, tab.openerTabId);
  }

  try {
    // キャッシュされた設定を取得（非同期処理なし）
    const settings = await getSettings();

    // 現在はnewTabの設定をすべてのタブに適用（ブックマークからのタブも含む）
    const position = settings.newTab.position;

    // デフォルトの場合は何もしない
    if (position === "default" || !tab.id) {
      return;
    }

    // 現在のウィンドウのすべてのタブを取得
    const tabs = await chrome.tabs.query({ currentWindow: true });

    // タブ作成前のアクティブタブを特定
    // 新規タブがすでにアクティブになっている場合、openerTabIdを使用
    let previousActiveTab: chrome.tabs.Tab | undefined;

    if (tab.openerTabId) {
      previousActiveTab = tabs.find(t => t.id === tab.openerTabId);
    } else {
      // openerTabIdがない場合、新規タブ以外でアクティブなタブを探す
      previousActiveTab = tabs.find(t => t.id !== tab.id && t.active);

      // それでも見つからない場合、新規タブの左隣のタブを前のアクティブタブとみなす
      if (!previousActiveTab && tab.index > 0) {
        previousActiveTab = tabs.find(t => t.index === tab.index - 1);
      }
    }

    // 新しいタブの位置を計算
    const newIndex = calculateNewTabIndex(position, tabs, previousActiveTab);

    // タブを移動
    if (newIndex !== undefined && newIndex !== tab.index) {
      await chrome.tabs.move(tab.id, { index: newIndex });
      // 移動後もインデックスを更新
      await updateTabIndexCache(tab.id);
    }
  } catch (error) {
    console.error("Error handling new tab:", error);
  }
};

// タブがアクティブになった時の処理
export const handleTabActivated = async (activeInfo: { tabId: number; windowId: number }) => {
  await recordTabActivation(activeInfo.tabId);
  await updateTabIndexCache(activeInfo.tabId);

  // 最後にアクティブだったタブを記録
  await lastActiveTabState.set(activeInfo.tabId);
};

// タブが閉じられた時の処理
export const handleTabRemoved = async (
  tabId: number,
  removeInfo: { windowId: number; isWindowClosing: boolean },
) => {
  // ウィンドウが閉じられた場合は何もしない
  if (removeInfo.isWindowClosing) {
    await cleanupTabData(tabId);
    await deleteFromTabIndexCache(tabId);
    return;
  }

  try {
    const settings = await getSettings();
    const activateTabSetting = settings.afterTabClosing.activateTab;

    // デフォルト設定の場合は、ブラウザのデフォルト動作に任せる
    if (activateTabSetting === "default") {
      await cleanupTabData(tabId);
      await deleteFromTabIndexCache(tabId);
      return;
    }

    // 閉じたタブが最後にアクティブだったタブかチェック
    // 重要: タブが閉じられた直後にChromeが自動的に別のタブをアクティブにすることがある
    // そのため、lastActiveTabIdがnullまたは閉じたタブでない場合でも、
    // 直前まで閉じたタブがアクティブだった可能性がある

    const lastActiveTabId = await lastActiveTabState.get();
    let wasLastActive = lastActiveTabId === tabId;

    // lastActiveTabIdがnullの場合、タブがアクティブだった可能性を考慮
    // タブを閉じた直後に他のタブがアクティブになっている場合も考慮
    if (!wasLastActive && lastActiveTabId === null) {
      // タブが閉じられた直後の状況を確認
      wasLastActive = true;
    }

    if (!wasLastActive) {
      await cleanupTabData(tabId);
      await deleteFromTabIndexCache(tabId);
      return;
    }

    // キャッシュからタブのインデックスを取得
    const cache = await getTabIndexCache();
    const closedTabIndex = cache.get(tabId) ?? 0;

    // 次にアクティブにするタブを決定
    const nextTabId = await determineNextActiveTab(
      tabId,
      closedTabIndex,
      activateTabSetting,
      removeInfo.windowId,
    );

    // クリーンアップ
    await cleanupTabData(tabId);
    await deleteFromTabIndexCache(tabId);

    // 次のタブをアクティブにする
    if (nextTabId !== null) {
      // 一時的にlastActiveTabIdをクリアして、自動的なタブアクティブ化を履歴に記録しないようにする
      await lastActiveTabState.set(null);

      await chrome.tabs.update(nextTabId, { active: true });

      // 復元しない - handleTabActivatedが新しい値を設定する
    }
  } catch (error) {
    console.error("Error handling tab removal:", error);
    await cleanupTabData(tabId);
    await deleteFromTabIndexCache(tabId);
  }
};

// タブが移動した時の処理
const handleTabMoved = async (
  tabId: number,
  moveInfo: { windowId: number; fromIndex: number; toIndex: number },
) => {
  await updateTabIndexCache(tabId);
  // 他のタブのインデックスも更新
  const tabs = await chrome.tabs.query({ windowId: moveInfo.windowId });
  const cache = await getTabIndexCache();
  for (const tab of tabs) {
    if (tab.id) {
      cache.set(tab.id, tab.index);
    }
  }
  await setTabIndexCache(cache);
};

// 初期化時に既存のタブのインデックスをキャッシュ
const initializeTabIndexCache = async () => {
  const tabs = await chrome.tabs.query({});
  const cache = new Map<number, number>();
  for (const tab of tabs) {
    if (tab.id) {
      cache.set(tab.id, tab.index);
    }
  }
  await setTabIndexCache(cache);
};

export const setupTabHandlers = () => {
  if (typeof chrome !== "undefined" && chrome.tabs && chrome.runtime) {
    // セッション復元検出器を初期化
    initSessionRestoreDetector();

    chrome.tabs.onCreated.addListener(handleNewTab);
    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    chrome.tabs.onMoved.addListener(handleTabMoved);
    chrome.runtime.onStartup.addListener(handleBrowserStartup);

    // 初期化時に既存タブのインデックスをキャッシュ
    initializeTabIndexCache();
  }
};
