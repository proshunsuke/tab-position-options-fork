import type { Settings } from "@/src/types";
import { DEFAULT_SETTINGS } from "@/src/types";
import { createState } from "@/src/utils/simpleStorage";

/**
 * 設定の状態管理
 * chrome.storage.localを使用（永続的な設定保存）
 */
export const settingsState = createState<Settings>("settings", DEFAULT_SETTINGS, false);

/**
 * ストレージの変更を監視
 */
export const setupStorageHandlers = () => {
  chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === "local" && changes.settings) {
      const newSettings = changes.settings.newValue as Settings;
      await settingsState.set(newSettings);
    }
  });
};
