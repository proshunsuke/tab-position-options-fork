/**
 * タブのアクティベーション情報の型定義
 */
type TabActivationInfo = {
  tabId: number;
  timestamp: number;
};

const MAX_HISTORY_SIZE = 50;

// デバウンス閾値（システムの自動処理では可能だが、人間の手動操作では困難）
const DEBOUNCE_THRESHOLD_MS = 100;

/**
 * タブアクティベーション履歴の状態管理
 * グローバルメモリ状態として管理
 */
let tabActivationHistoryState: TabActivationInfo[] = [];

/**
 * ストレージから状態を初期化
 * Service Worker起動時に一度だけ呼び出される
 */
export const initializeActivationHistory = async () => {
  const result = await chrome.storage.session.get("tabActivationHistory");
  if (result.tabActivationHistory) {
    tabActivationHistoryState = result.tabActivationHistory;
  } else {
    // 取れなかった場合はqueryからアクティブなタブを探して初期化
    const activeTab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
    if (activeTab.id) {
      setState([{ tabId: activeTab.id, timestamp: Date.now() }]);
    }
  }
};

/**
 * 同期的に状態を取得
 */
const getState = () => {
  return tabActivationHistoryState;
};

/**
 * 同期的に状態を設定
 * メモリは即座に更新し、ストレージへは遅延保存
 */
const setState = (value: TabActivationInfo[]) => {
  tabActivationHistoryState = value;

  // ストレージへの遅延保存
  Promise.resolve().then(() => {
    chrome.storage.session.set({ tabActivationHistory: value }).catch(() => {});
  });
};

/**
 * タブのアクティベーションを記録
 */
export const recordTabActivation = (tabId: number) => {
  const timestamp = Date.now();
  const history = getState();

  // 最後のエントリをチェック
  const lastEntry = history.length > 0 ? history[history.length - 1] : null;

  // 短時間内の連続アクティベーションの場合、それはChromeデフォルトの動作でアクティブにしたタブであるので、そのエントリを削除
  let updatedHistory = history;
  if (lastEntry && timestamp - lastEntry.timestamp < DEBOUNCE_THRESHOLD_MS) {
    updatedHistory = history.slice(0, -1);
  }

  // 新しいエントリを追加
  updatedHistory.push({ tabId, timestamp });

  // 履歴サイズの制限
  if (updatedHistory.length > MAX_HISTORY_SIZE) {
    updatedHistory.shift();
  }

  setState(updatedHistory);
};

/**
 * 新規タブを元に前回アクティブだったタブIDを取得
 */
export const getLastActiveTabIdByNewTabId = (newTabId: number) => {
  const lastActiveTabId = getLastActiveTabId();

  // newTabIdが渡されて、それが履歴の最後と一致する場合
  // → レースコンディション（onActivatedが先に発火）と判断
  // → その前のタブを返す
  if (lastActiveTabId === newTabId) {
    const history = getState();
    return history.length >= 2 ? history[history.length - 2].tabId : null;
  }

  // 通常ケース：履歴の最後を返す
  return lastActiveTabId;
};

/**
 * 前回アクティブだったタブIDを取得
 */
export const getLastActiveTabId = () => {
  const history = getState();

  if (history.length === 0) {
    return null;
  }

  const lastEntry = history[history.length - 1];
  return lastEntry.tabId;
};

/**
 * 特定のタブをアクティベーション履歴から削除
 */
export const cleanupActivationHistory = (tabId: number) => {
  const history = getState();
  const updatedHistory = history.filter(entry => entry.tabId !== tabId);
  setState(updatedHistory);
};

/**
 * アクティベーション履歴から利用可能なタブを検索
 */
export const getTabFromActivationHistory = (
  excludeTabId: number,
  availableTabs: chrome.tabs.Tab[],
) => {
  const history = getState();
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    if (entry.tabId !== excludeTabId && availableTabs.some(tab => tab.id === entry.tabId)) {
      return entry.tabId;
    }
  }
  return null;
};

/**
 * メモリをリセット（テスト用）
 * @internal
 */
export const resetActivationHistory = () => {
  tabActivationHistoryState = [];
};
