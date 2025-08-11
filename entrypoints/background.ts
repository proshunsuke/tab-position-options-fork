import { initializeSettingsState, setupStorageListener } from "@/src/storage";
import { setupTabHandlers } from "@/src/tabs/handler";
import { initializeAllStates } from "@/src/tabs/tabState";

export default defineBackground(() => {
  // 初期設定を読み込む
  const initializeExtension = async () => {
    try {
      // すべてのStateManagerを初期化（ストレージから復元）
      await Promise.all([
        initializeAllStates(), // タブ関連の状態（sessionStorage）
        initializeSettingsState(), // 設定（localStorage）
      ]);
    } catch (error) {
      console.error("Failed to initialize extension:", error);
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
