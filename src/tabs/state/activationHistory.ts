import { createState } from "@/src/utils/simpleStorage";

/**
 * タブのアクティベーション情報の型定義
 */
type TabActivationInfo = {
  tabId: number;
  timestamp: number;
};

const MAX_HISTORY_SIZE = 50;

/**
 * タブアクティベーション履歴の状態管理
 */
export const tabActivationHistoryState = createState<TabActivationInfo[]>(
  "tabActivationHistory",
  [],
);

/**
 * タブのアクティベーションを記録
 */
export const recordTabActivation = async (tabId: number) => {
  const timestamp = Date.now();
  const history = await tabActivationHistoryState.get();

  // 既存のエントリを削除（重複を防ぐ）
  const updatedHistory = history.filter(entry => entry.tabId !== tabId);

  // 新しいエントリを追加
  updatedHistory.push({ tabId, timestamp });

  // 履歴サイズの制限
  if (updatedHistory.length > MAX_HISTORY_SIZE) {
    updatedHistory.shift();
  }

  await tabActivationHistoryState.set(updatedHistory);
};

/**
 * 前回アクティブだったタブIDを取得
 */
export const getPreviousActiveTabId = async (currentTabId?: number) => {
  const history = await tabActivationHistoryState.get();

  if (history.length === 0) {
    return null;
  }

  const lastEntry = history[history.length - 1];

  // currentTabIdが渡されて、それが履歴の最後と一致する場合
  // → レースコンディション（onActivatedが先に発火）と判断
  // → その前のタブを返す
  if (currentTabId && lastEntry.tabId === currentTabId) {
    return history.length >= 2 ? history[history.length - 2].tabId : null;
  }

  // 通常ケース：履歴の最後を返す
  return lastEntry.tabId;
};

/**
 * 特定のタブをアクティベーション履歴から削除
 */
export const cleanupActivationHistory = async (tabId: number) => {
  const history = await tabActivationHistoryState.get();
  const updatedHistory = history.filter(entry => entry.tabId !== tabId);
  await tabActivationHistoryState.set(updatedHistory);
};

/**
 * アクティベーション履歴から利用可能なタブを検索
 */
export const getTabFromActivationHistory = async (
  excludeTabId: number,
  availableTabs: chrome.tabs.Tab[],
) => {
  const history = await tabActivationHistoryState.get();

  // 閉じたタブより前の履歴を逆順で検索
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];

    // 閉じたタブに到達したら、それより前の履歴を探す
    if (entry.tabId === excludeTabId) {
      // 閉じたタブより前の履歴を探す
      for (let j = i - 1; j >= 0; j--) {
        const previousEntry = history[j];
        if (availableTabs.some(tab => tab.id === previousEntry.tabId)) {
          return previousEntry.tabId;
        }
      }
      break;
    }
  }

  // 閉じたタブが履歴にない、または前の履歴がない場合
  return null;
};
