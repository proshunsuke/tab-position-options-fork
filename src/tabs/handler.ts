import { handleNewTab } from "@/src/tabs/handleNewTab";
import { handleTabActivated } from "@/src/tabs/handleTabActivated";
import { handleTabMoved } from "@/src/tabs/handleTabMoved";
import { handleTabRemoved } from "@/src/tabs/handleTabRemoved";
import {
  handleBrowserStartup,
  initSessionRestoreDetector,
} from "@/src/tabs/sessionRestoreDetector";

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
