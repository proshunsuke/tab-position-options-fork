import { getCachedSettings } from "@/src/storage";
import { calculateNewTabIndex } from "@/src/tabs/position";

export const handleNewTab = async (tab: chrome.tabs.Tab) => {
  console.log("New tab created:", tab);

  try {
    // キャッシュされた設定を取得（非同期処理なし）
    const settings = getCachedSettings();

    // 現在はnewTabの設定をすべてのタブに適用（ブックマークからのタブも含む）
    const position = settings.newTab.position;

    console.log("Current newTab position setting:", position);

    // デフォルトの場合は何もしない
    if (position === "default" || !tab.id) {
      return;
    }

    // 現在のウィンドウのすべてのタブを取得
    const tabs = await chrome.tabs.query({ currentWindow: true });
    console.log(
      "All tabs:",
      tabs.map(t => ({ id: t.id, index: t.index, active: t.active, url: t.url?.substring(0, 30) })),
    );

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

    console.log(
      "Previous active tab:",
      previousActiveTab ? { id: previousActiveTab.id, index: previousActiveTab.index } : "none",
    );

    // 新しいタブの位置を計算
    const newIndex = calculateNewTabIndex(position, tabs, previousActiveTab);
    console.log(`Calculated new index: ${newIndex}, current index: ${tab.index}`);

    // タブを移動
    if (newIndex !== undefined && newIndex !== tab.index) {
      console.log(`Moving tab from index ${tab.index} to ${newIndex}`);
      await chrome.tabs.move(tab.id, { index: newIndex });
    } else {
      console.log("No move needed");
    }
  } catch (error) {
    console.error("Error handling new tab:", error);
  }
};

export const setupTabHandlers = () => {
  if (typeof chrome !== "undefined" && chrome.tabs) {
    chrome.tabs.onCreated.addListener(handleNewTab);
  }
};
