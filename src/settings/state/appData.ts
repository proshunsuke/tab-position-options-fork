import type { Settings } from "@/src/types";
import { DEFAULT_SETTINGS } from "@/src/types";
import { createState } from "@/src/utils/simpleStorage";
import { APP_VERSION } from "@/src/version";

/**
 * 設定の状態管理（chrome.storage.localの"settings"キー）
 */
export const settingsState = createState<Settings>("settings", DEFAULT_SETTINGS, false);

/**
 * バージョンの状態管理（chrome.storage.localの"version"キー）
 */
const versionState = createState<string>("version", APP_VERSION, false);

/**
 * 設定を取得
 */
export const getSettings = async () => {
  return await settingsState.get();
};

/**
 * 設定とバージョンを保存
 */
export const saveSettingsWithVersion = async (settings: Settings) => {
  await Promise.all([settingsState.set(settings), versionState.set(APP_VERSION)]);
};

/**
 * ストレージの変更を監視（バックグラウンド用）
 */
export const setupStorageHandlers = () => {
  chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === "local" && changes.settings) {
      const newSettings = changes.settings.newValue as Settings;
      await settingsState.set(newSettings);
    }
  });
};
