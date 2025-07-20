import { loadSettings, setupStorageListener } from "@/src/storage";
import { setupTabHandlers } from "@/src/tabs/handler";

export default defineBackground(() => {
  // 初期設定を読み込む
  const initializeExtension = async () => {
    try {
      await loadSettings();
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  initializeExtension();

  // 拡張機能アイコンクリック時の動作
  if (typeof chrome !== "undefined" && chrome.action) {
    chrome.action.onClicked.addListener(() => {
      chrome.tabs.create({
        url: chrome.runtime.getURL("options.html"),
      });
    });
  }

  // ストレージの変更を監視
  setupStorageListener();

  // タブ操作のハンドラーを設定
  setupTabHandlers();
});
