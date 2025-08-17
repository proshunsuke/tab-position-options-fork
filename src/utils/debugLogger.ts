/**
 * デバッグ用のログをChrome Storage Localに保存するユーティリティ
 * Service Workerの再起動を跨いでログを保持するため
 */

type LogEntry = {
  timestamp: string;
  level: "log" | "warn" | "error";
  tag: string;
  message: string;
  data?: unknown;
  tabs?: chrome.tabs.Tab | chrome.tabs.Tab[];
};

const MAX_LOG_ENTRIES = 1000; // 最大ログエントリ数
const LOG_STORAGE_KEY = "debug_logs";

/**
 * ログをStorage Localに保存
 */
export const saveLog = async (
  level: LogEntry["level"],
  tag: string,
  message: string,
  tabs?: chrome.tabs.Tab | chrome.tabs.Tab[],
  data?: unknown,
) => {
  try {
    // 現在のログを取得
    const result = await chrome.storage.local.get(LOG_STORAGE_KEY);
    const logs: LogEntry[] = result[LOG_STORAGE_KEY] || [];

    // 新しいログエントリを作成
    const newEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      tag,
      message,
      data: data !== undefined ? JSON.parse(JSON.stringify(data)) : undefined, // シリアライズ可能にする
      tabs: tabs !== undefined ? JSON.parse(JSON.stringify(tabs)) : undefined, // タブ情報を追加
    };

    // ログを追加（最新を先頭に）
    logs.unshift(newEntry);

    // 最大エントリ数を超えたら古いものを削除
    if (logs.length > MAX_LOG_ENTRIES) {
      logs.splice(MAX_LOG_ENTRIES);
    }

    // ストレージに保存
    await chrome.storage.local.set({ [LOG_STORAGE_KEY]: logs });

    // コンソールにも出力（開発時の確認用）
    const consoleMessage = `[${tag}] ${message}`;
    if (data !== undefined) {
      console[level](consoleMessage, data);
    } else {
      console[level](consoleMessage);
    }
  } catch (error) {
    // ログ保存のエラーはコンソールに出力のみ
    console.error("Failed to save log to storage:", error);
  }
};

/**
 * デバッグログのショートカット関数
 */
export const debugLog = (
  tag: string,
  message: string,
  tabs?: chrome.tabs.Tab | chrome.tabs.Tab[],
  data?: unknown,
) => {
  return saveLog("log", tag, message, tabs, data);
};

export const debugWarn = (
  tag: string,
  message: string,
  tabs?: chrome.tabs.Tab | chrome.tabs.Tab[],
  data?: unknown,
) => {
  return saveLog("warn", tag, message, tabs, data);
};

export const debugError = (
  tag: string,
  message: string,
  tabs?: chrome.tabs.Tab | chrome.tabs.Tab[],
  data?: unknown,
) => {
  return saveLog("error", tag, message, tabs, data);
};

/**
 * すべてのログを取得
 */
export const getLogs = async () => {
  try {
    const result = await chrome.storage.local.get(LOG_STORAGE_KEY);
    const logs: LogEntry[] = result[LOG_STORAGE_KEY] || [];
    return logs;
  } catch (error) {
    console.error("Failed to get logs from storage:", error);
    const emptyLogs: LogEntry[] = [];
    return emptyLogs;
  }
};

/**
 * ログをクリア
 */
export const clearLogs = async () => {
  try {
    await chrome.storage.local.remove(LOG_STORAGE_KEY);
    console.log("Debug logs cleared");
  } catch (error) {
    console.error("Failed to clear logs:", error);
  }
};

/**
 * ログをフォーマットして出力（コンソール用）
 */
export const printLogs = async () => {
  const logs = await getLogs();
  console.group("Stored Debug Logs");
  for (const log of logs) {
    const prefix = `[${log.timestamp}] [${log.tag}]`;
    if (log.data !== undefined) {
      console[log.level](prefix, log.message, log.data);
    } else {
      console[log.level](prefix, log.message);
    }
  }
  console.groupEnd();
};
