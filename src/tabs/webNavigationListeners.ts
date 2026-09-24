import {
  handleBeforeNavigate,
  handleNavigationCommitted,
  handleNavigationError,
} from "@/src/tabs/loadingPage";
import { handlePopupNavigationTarget } from "@/src/tabs/popup";

export const setupWebNavigationListeners = () => {
  if (!chrome.webNavigation) {
    return;
  }

  try {
    if (!chrome.webNavigation.onCreatedNavigationTarget.hasListener(handlePopupNavigationTarget)) {
      chrome.webNavigation.onCreatedNavigationTarget.addListener(handlePopupNavigationTarget);
    }
    if (!chrome.webNavigation.onBeforeNavigate.hasListener(handleBeforeNavigate)) {
      chrome.webNavigation.onBeforeNavigate.addListener(handleBeforeNavigate);
    }
    if (!chrome.webNavigation.onCommitted.hasListener(handleNavigationCommitted)) {
      chrome.webNavigation.onCommitted.addListener(handleNavigationCommitted);
    }
    if (!chrome.webNavigation.onErrorOccurred.hasListener(handleNavigationError)) {
      chrome.webNavigation.onErrorOccurred.addListener(handleNavigationError);
    }
  } catch {
    // Optional APIs can be unavailable before webNavigation is granted; onAdded retries registration.
  }
};
