import { getExternalLinkAction } from "@/src/externalLinks/rules";
import { recordExternalLinkTab, removeExternalLinkTab } from "@/src/externalLinks/state";
import { getSettings } from "@/src/settings/state/appData";
import { initializeAllStates, needsInitialization } from "@/src/state/initializer";
import { calculateNewTabIndex } from "@/src/tabs/position";
import { getNormalWindowId, getWindowSnapshot } from "@/src/tabs/state/popup";
import { getActiveTabSnapshot, getTabSnapshot } from "@/src/tabs/state/tabSnapshot";
import { findUrlRule } from "@/src/tabs/urlRules";

type LinkMessage = { type: "external-link"; pageUrl: string; url: string };

export const setupExternalLinkHandlers = () => {
  chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
    if (!isLinkMessage(message)) {
      return;
    }
    void handleExternalLink(message, sender)
      .then(sendResponse)
      .catch(error => {
        console.error("Could not open external link:", error);
        sendResponse(false);
      });
    return true;
  });
};

export const handleExternalLink = async (
  message: LinkMessage,
  sender: chrome.runtime.MessageSender,
) => {
  const tab = sender.tab;
  if (sender.id !== chrome.runtime.id || tab?.id === undefined || !sender.url) {
    return false;
  }
  try {
    // SPAのパス変更は許可するが、別originのページを装ったメッセージは受け付けない。
    if (new URL(sender.url).origin !== new URL(message.pageUrl).origin) {
      return false;
    }
  } catch {
    return false;
  }
  if (needsInitialization()) {
    // Worker再起動時だけ、設定とタブ位置の復元が必要。
    await initializeAllStates();
  }
  const settings = getSettings();
  const action = getExternalLinkAction(message.pageUrl, message.url, settings.externalLinks);
  if (action === null || action === "current") {
    return false;
  }
  const rule = findUrlRule(message.url, settings.newTab.urlRules);
  const active =
    action === "foreground" ||
    (action === "new" && (rule ? rule.active === "foreground" : !settings.newTab.openInBackground));
  const sourceWindow = getWindowSnapshot(tab.windowId);
  // ポップアップを指定してもChromeは通常ウィンドウに作成するため、作成先を先に決める。
  const windowId =
    sourceWindow && sourceWindow.type !== "normal"
      ? getNormalWindowId(tab.incognito)
      : tab.windowId;
  const tabs = windowId === null ? [] : getTabSnapshot(windowId);
  const openerTabId = windowId === tab.windowId ? tab.id : undefined;
  const sourceTabId =
    openerTabId ?? (windowId === null ? undefined : getActiveTabSnapshot(windowId)?.id);
  const activation = active ? settings.tabOnActivate.behavior : "default";
  const position =
    activation !== "default" ? activation : (rule?.position ?? settings.newTab.position);
  const desiredIndex =
    position === "last" ? tabs.length : calculateNewTabIndex(position, tabs, sourceTabId ?? -1);
  const index =
    desiredIndex === undefined
      ? undefined
      : Math.max(tabs.filter(item => item.pinned).length, desiredIndex);
  const url = new URL(message.url).href;
  const pending = recordExternalLinkTab(windowId, openerTabId, url);
  // onCreatedはcreateのPromiseより先にも後にも届くため、API呼び出し前に印を付ける。
  return chrome.tabs
    .create({
      // 通常ウィンドウがなければChromeが同じプロファイルに新規作成する。
      windowId: windowId ?? tab.windowId,
      ...(openerTabId === undefined ? {} : { openerTabId }),
      url,
      active,
      ...(index === undefined ? {} : { index }),
    })
    .then(created => {
      pending.tabId = created.id;
      if (active && created.windowId !== tab.windowId) {
        // 前面指定では作成済みのタブを表示する。作成前のフォーカス移動によるちらつきを防ぐ。
        void chrome.windows.update(created.windowId, { focused: true }).catch(() => {});
      }
      if (!pending.consumed) {
        // イベント未達時のメモリ解放のみ。タブ操作を待たせるタイマーではない。
        setTimeout(() => removeExternalLinkTab(pending), 10000);
      }
      return true;
    })
    .catch(error => {
      removeExternalLinkTab(pending);
      throw error;
    });
};

const isLinkMessage = (value: unknown): value is LinkMessage =>
  typeof value === "object" &&
  value !== null &&
  "type" in value &&
  value.type === "external-link" &&
  "pageUrl" in value &&
  typeof value.pageUrl === "string" &&
  "url" in value &&
  typeof value.url === "string";
