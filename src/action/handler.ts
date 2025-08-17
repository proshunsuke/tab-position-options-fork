/**
 * 拡張機能のアクションハンドラー
 * アイコンクリック時の動作を管理
 */

/**
 * 拡張機能のアクションイベントを設定
 * アイコンクリック時にオプションページを開く
 */
export const setupActionHandlers = () => {
  if (typeof chrome !== "undefined" && chrome.action) {
    chrome.action.onClicked.addListener(() => {
      chrome.tabs.create({
        url: chrome.runtime.getURL("options.html"),
      });
    });
  }
};
