import type { Settings } from "@/src/types";
import { defaultSettings } from "@/src/types";

let cachedSettings: Settings | undefined;

export const loadSettings = async () => {
  const result = await chrome.storage.local.get(["settings"]);
  cachedSettings = (result.settings as Settings) || defaultSettings;
  return cachedSettings;
};

export const setupStorageListener = () => {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.settings) {
      cachedSettings = changes.settings.newValue as Settings;
    }
  });
};

export const getCachedSettings = () => {
  return cachedSettings || defaultSettings;
};
