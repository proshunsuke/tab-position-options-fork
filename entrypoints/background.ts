import { setupStorageListener } from "@/src/storage";
import { setupTabHandlers } from "@/src/tabs/handler";
import { setupTestEnvironment } from "@/src/test/setup";

export default defineBackground(() => {
  if (typeof chrome !== "undefined" && chrome.action) {
    chrome.action.onClicked.addListener(() => {
      chrome.tabs.create({
        url: chrome.runtime.getURL("options.html"),
      });
    });
  }

  setupStorageListener();
  setupTabHandlers();

  // テスト環境のセットアップ
  setupTestEnvironment();
});
