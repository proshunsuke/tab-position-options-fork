import { setupStorageListener } from "@/src/storage";
import { setupTabHandlers } from "@/src/tabs/handler";

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
});
