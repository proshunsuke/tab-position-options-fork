import type { Settings } from "@/src/types";
import { defaultSettings } from "@/src/types";
import { StateManager } from "@/src/utils/stateManager";

/**
 * 設定の状態管理
 * chrome.storage.localを使用（永続的な設定保存）
 */
const settingsState = new StateManager<Settings>("settings", defaultSettings, {
  storageSource: "local",
  serialize: value => value,
  deserialize: value => (value as Settings) || defaultSettings,
});

/**
 * ストレージの変更を監視
 */
export const setupStorageListener = () => {
  chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === "local" && changes.settings) {
      // ストレージが変更されたら、StateManagerの値も更新
      const newSettings = changes.settings.newValue as Settings;
      await settingsState.set(newSettings);
    }
  });
};

/**
 * 設定を取得（非同期）
 * メモリキャッシュ → chrome.storage.local → デフォルト値の順でフォールバック
 */
export const getSettings = async () => {
  return await settingsState.get();
};

/**
 * 設定を保存
 */
export const saveSettings = async (settings: Settings) => {
  await settingsState.set(settings);
};

/**
 * すべての設定StateManagerを初期化
 */
export const initializeSettingsState = async () => {
  await settingsState.initialize();
};
