/**
 * タブスナップショットの状態管理
 * グローバルメモリ状態として管理
 */
let tabSnapshotState: chrome.tabs.Tab[] = [];

/**
 * ストレージから状態を初期化
 * Service Worker起動時に一度だけ呼び出される
 */
export const initializeTabSnapshot = async () => {
  const result = await chrome.storage.session.get("tabSnapshot");
  if (result.tabSnapshot) {
    tabSnapshotState = result.tabSnapshot;
  } else {
    updateTabSnapshot();
  }
};

/**
 * 同期的に状態を取得
 */
export const getTabSnapshot = () => {
  return tabSnapshotState;
};

/**
 * 同期的に状態を設定
 * メモリは即座に更新し、ストレージへは遅延保存
 */
const setState = (value: chrome.tabs.Tab[]) => {
  tabSnapshotState = value;

  // ストレージへの遅延保存
  Promise.resolve().then(() => {
    chrome.storage.session.set({ tabSnapshot: value }).catch(() => {});
  });
};

/**
 * chrome.tabs.queryを使用してタブ情報を更新
 */
export const updateTabSnapshot = () => {
  chrome.tabs.query({ currentWindow: true }).then(tabs => {
    setState(tabs);
  });
};

/**
 * メモリをリセット（テスト用）
 * @internal
 */
export const resetTabSnapshotState = () => {
  tabSnapshotState = [];
};
