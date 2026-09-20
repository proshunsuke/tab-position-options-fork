import type { Settings } from "@/src/types";
import { DEFAULT_SETTINGS } from "@/src/types";
import { APP_VERSION } from "@/src/version";

type AppDataStorage = {
  settings?: Settings;
  version?: string;
};

/**
 * 設定の状態管理（chrome.storage.localの"settings"キー）
 * グローバルメモリ状態として管理
 */
let settingsState: Settings = DEFAULT_SETTINGS;
let settingsRevision = 0;

/**
 * バージョンの状態管理（chrome.storage.localの"version"キー）
 * グローバルメモリ状態として管理
 */
let versionState: string = APP_VERSION;

/**
 * ストレージから状態を初期化
 * Service Worker起動時に一度だけ呼び出される
 */
export const initializeAppData = async () => {
  const revision = settingsRevision;
  try {
    const result = await chrome.storage.local.get<AppDataStorage>(["settings", "version"]);
    if (revision === settingsRevision) {
      settingsState = result.settings ?? DEFAULT_SETTINGS;
    }
    versionState = result.version ?? APP_VERSION;
  } catch {
    if (revision === settingsRevision) {
      settingsState = DEFAULT_SETTINGS;
    }
    versionState = APP_VERSION;
  }
};

/**
 * 同期的に設定を取得
 */
const getSettingsState = () => {
  return settingsState;
};

/**
 * 同期的に設定を設定
 * メモリは即座に更新し、ストレージへは遅延保存
 */
const setSettingsState = (value: Settings) => {
  settingsRevision++;
  settingsState = value;

  // ストレージへの遅延保存
  Promise.resolve().then(() => {
    chrome.storage.local.set({ settings: value, settingsSyncPending: true }).catch(() => {});
  });
};

/**
 * 同期的にバージョンを設定
 * メモリは即座に更新し、ストレージへは遅延保存
 */
const setVersionState = (value: string) => {
  versionState = value;

  // ストレージへの遅延保存
  Promise.resolve().then(() => {
    chrome.storage.local.set({ version: value }).catch(() => {});
  });
};

/**
 * 設定を取得
 */
export const getSettings = () => {
  return getSettingsState();
};

/**
 * バージョンを取得
 * 将来のマイグレーションやデバッグ用に公開API として提供
 * @internal 現時点では未使用だが、意図的に保持
 */
export const getVersion = () => {
  return versionState;
};

/**
 * 設定とバージョンを保存
 */
export const saveSettingsWithVersion = (settings: Settings) => {
  setSettingsState(settings);
  setVersionState(APP_VERSION);
};

/**
 * ストレージの変更を監視（バックグラウンド用）
 */
export const setupStorageHandlers = () => {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.settings) {
      settingsRevision++;
      settingsState = (changes.settings.newValue as Settings | undefined) ?? DEFAULT_SETTINGS;
    }
  });
};

/**
 * メモリをリセット（テスト用）
 * @internal
 */
export const resetAppDataState = () => {
  settingsState = DEFAULT_SETTINGS;
  versionState = APP_VERSION;
};
