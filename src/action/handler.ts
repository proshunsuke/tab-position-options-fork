/**
 * 拡張機能のアクションハンドラー
 * アイコンクリック時の動作を管理
 */

let opening: Promise<void> | undefined;

/**
 * 拡張機能のアクションイベントを設定
 * アイコンクリック時にオプションページを開く
 */
export const setupActionHandlers = () => {
  if (typeof chrome !== "undefined" && chrome.action) {
    chrome.action.onClicked.addListener(openOptionsPage);
    chrome.runtime.onInstalled.addListener(details => {
      if (details.reason === "install") {
        return openOptionsPage();
      }
    });
  }
};

export const openOptionsPage = () => {
  // 連打による同時検索・重複作成を防ぐ。通常のタブ配置処理とは独立した操作。
  opening ??= focusOptionsPage()
    .catch(error => {
      console.error("Failed to open options page:", error);
    })
    .finally(() => {
      opening = undefined;
    });
  return opening;
};

const focusOptionsPage = async () => {
  // 標準APIは別ウィンドウの設定タブを再利用しない場合があるため、先に確認する。
  const [tab] = await chrome.tabs.query({ url: chrome.runtime.getURL("options.html") });
  if (tab?.id !== undefined) {
    await Promise.all([
      chrome.tabs.update(tab.id, { active: true }),
      chrome.windows.update(tab.windowId, { focused: true }),
    ]);
  } else {
    await chrome.runtime.openOptionsPage();
  }
};
