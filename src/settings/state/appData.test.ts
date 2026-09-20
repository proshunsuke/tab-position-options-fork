import { beforeEach, expect, test, vi } from "vitest";
import { DEFAULT_SETTINGS } from "@/src/types";

let storageChanged: (changes: Record<string, chrome.storage.StorageChange>, area: string) => void;
const settings = {
  ...DEFAULT_SETTINGS,
  newTab: { position: "first", openInBackground: false },
} as const;

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("chrome", {
    storage: {
      onChanged: {
        addListener: (listener: typeof storageChanged) => {
          storageChanged = listener;
        },
      },
      local: {
        get: vi.fn(async () => ({ settings: DEFAULT_SETTINGS })),
        set: vi.fn(async () => {}),
      },
    },
  });
});

test("updates memory synchronously and marks local edits pending without waiting for storage", async () => {
  const { saveSettingsWithVersion, getSettings } = await import("@/src/settings/state/appData");
  vi.mocked(chrome.storage.local.set).mockImplementation(() => new Promise<void>(() => {}));
  saveSettingsWithVersion(settings);
  expect(getSettings()).toEqual(settings);
  expect(chrome.storage.local.get).not.toHaveBeenCalled();
  expect(chrome.storage.local.set).not.toHaveBeenCalled();
  await Promise.resolve();
  expect(chrome.storage.local.set).toHaveBeenCalledWith({ settings, settingsSyncPending: true });
  expect(getSettings()).toEqual(settings);
});

test("a late initialization read cannot overwrite a newer sync mirror event", async () => {
  const { initializeAppData, setupStorageHandlers, getSettings } = await import(
    "@/src/settings/state/appData"
  );
  const read = Promise.withResolvers<{ settings: typeof DEFAULT_SETTINGS }>();
  vi.mocked(chrome.storage.local.get).mockImplementation(() => read.promise);
  setupStorageHandlers();
  const initialized = initializeAppData();
  storageChanged({ settings: { newValue: settings } }, "local");
  expect(getSettings()).toEqual(settings);
  read.resolve({ settings: DEFAULT_SETTINGS });
  await initialized;
  expect(getSettings()).toEqual(settings);
});
