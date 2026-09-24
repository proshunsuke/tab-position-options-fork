import { handleNewTab } from "@/src/tabs/handleNewTab";
import { handleTabActivated } from "@/src/tabs/handleTabActivated";
import { handleTabMoved } from "@/src/tabs/handleTabMoved";
import { handleTabRemoved } from "@/src/tabs/handleTabRemoved";
import { handleTabUpdated } from "@/src/tabs/handleTabUpdated";
import { handleLoadingPageStartup } from "@/src/tabs/loadingPage";
import {
  handleTabAttached,
  handleTabDetached,
  handleWindowCreated,
  handleWindowFocusChanged,
  handleWindowRemoved,
} from "@/src/tabs/popup";
import { setupWebNavigationListeners } from "@/src/tabs/webNavigationListeners";

export const setupTabHandlers = () => {
  if (typeof chrome !== "undefined" && chrome.tabs && chrome.runtime) {
    chrome.windows.onCreated.addListener(handleWindowCreated);
    chrome.windows.onFocusChanged.addListener(handleWindowFocusChanged);
    chrome.windows.onRemoved.addListener(handleWindowRemoved);
    chrome.tabs.onDetached.addListener(handleTabDetached);
    chrome.tabs.onAttached.addListener(handleTabAttached);
    setupWebNavigationListeners();
    chrome.permissions.onAdded.addListener(permissions => {
      if (permissions.permissions?.includes("webNavigation")) {
        setupWebNavigationListeners();
      }
    });
    chrome.tabs.onCreated.addListener(handleNewTab);
    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    chrome.tabs.onMoved.addListener(handleTabMoved);
    chrome.tabs.onUpdated.addListener(handleTabUpdated);
    chrome.runtime.onStartup.addListener(handleLoadingPageStartup);
  }
};
