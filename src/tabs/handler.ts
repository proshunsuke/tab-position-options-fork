import { getCachedSettings } from "@/src/storage";
import {
  cleanupTabData,
  determineNextActiveTab,
  recordTabActivation,
  recordTabSource,
} from "@/src/tabs/closeHandler";
import { calculateNewTabIndex } from "@/src/tabs/position";

export const handleNewTab = async (tab: chrome.tabs.Tab) => {
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
    const settings = getCachedSettings();

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
  recordTabActivation(activeInfo.tabId);
  await updateTabIndexCache(activeInfo.tabId);

  // 最後にアクティブだったタブを記録
  lastActiveTabId = activeInfo.tabId;
};

// タブインデックスのキャッシュ（タブIDとインデックスのマッピング）
const tabIndexCache = new Map<number, number>();

// 最後にアクティブだったタブを記録
let lastActiveTabId: number | null = null;

// タブが作成・移動・アクティブになった時にインデックスをキャッシュ
export const updateTabIndexCache = async (tabId: number) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab) {
      tabIndexCache.set(tabId, tab.index);
    }
  } catch (_error) {
    // タブが既に存在しない場合は無視
  }
};

// タブが閉じられた時の処理
export const handleTabRemoved = async (
  tabId: number,
  removeInfo: { windowId: number; isWindowClosing: boolean },
) => {
  // ウィンドウが閉じられた場合は何もしない
  if (removeInfo.isWindowClosing) {
    cleanupTabData(tabId);
    tabIndexCache.delete(tabId);
    return;
  }

  try {
    const settings = getCachedSettings();
    const activateTabSetting = settings.afterTabClosing.activateTab;

    // デフォルト設定の場合は、ブラウザのデフォルト動作に任せる
    if (activateTabSetting === "default") {
      cleanupTabData(tabId);
      tabIndexCache.delete(tabId);
      return;
    }

    // 閉じたタブが最後にアクティブだったタブかチェック
    const wasLastActive = lastActiveTabId === tabId;

    if (!wasLastActive) {
      cleanupTabData(tabId);
      tabIndexCache.delete(tabId);
      return;
    }

    // キャッシュからタブのインデックスを取得
    const closedTabIndex = tabIndexCache.get(tabId) ?? 0;

    // 次にアクティブにするタブを決定
    const nextTabId = await determineNextActiveTab(
      tabId,
      closedTabIndex,
      activateTabSetting,
      removeInfo.windowId,
    );

    // クリーンアップ
    cleanupTabData(tabId);
    tabIndexCache.delete(tabId);

    // 次のタブをアクティブにする
    if (nextTabId !== null) {
      // 一時的にlastActiveTabIdをクリアして、自動的なタブアクティブ化を履歴に記録しないようにする
      const tempLastActiveTabId = lastActiveTabId;
      lastActiveTabId = null;

      await chrome.tabs.update(nextTabId, { active: true });

      // 復元
      lastActiveTabId = tempLastActiveTabId;
    }
  } catch (error) {
    console.error("Error handling tab removal:", error);
    cleanupTabData(tabId);
    tabIndexCache.delete(tabId);
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
  for (const tab of tabs) {
    if (tab.id) {
      tabIndexCache.set(tab.id, tab.index);
    }
  }
};

// 初期化時に既存のタブのインデックスをキャッシュ
const initializeTabIndexCache = async () => {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
      tabIndexCache.set(tab.id, tab.index);
    }
  }
};

export const setupTabHandlers = () => {
  if (typeof chrome !== "undefined" && chrome.tabs) {
    chrome.tabs.onCreated.addListener(handleNewTab);
    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    chrome.tabs.onMoved.addListener(handleTabMoved);

    // 初期化時に既存タブのインデックスをキャッシュ
    initializeTabIndexCache();
  }
};
