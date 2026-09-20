import { beforeEach, expect, test, vi } from "vitest";
import { DEFAULT_SETTINGS, type Settings } from "@/src/types";

type StorageListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  area: string,
) => unknown;

let local: Record<string, unknown>;
let remote: Record<string, unknown>;
let listeners: StorageListener[];
let tasks: unknown[];
const settings: Settings = {
  ...DEFAULT_SETTINGS,
  newTab: { position: "left", openInBackground: true, urlRules: [] },
};

beforeEach(() => {
  vi.resetModules();
  local = {};
  remote = {};
  listeners = [];
  tasks = [];
  vi.stubGlobal("chrome", {
    storage: {
      onChanged: { addListener: (listener: StorageListener) => listeners.push(listener) },
      local: {
        get: vi.fn(async () => structuredClone(local)),
        set: vi.fn(async (values: Record<string, unknown>) => update("local", values)),
      },
      sync: {
        get: vi.fn(async () => structuredClone(remote)),
        set: vi.fn(async (values: Record<string, unknown>) => update("sync", values)),
        remove: vi.fn(async (keys: string[]) => {
          const changes: Record<string, chrome.storage.StorageChange> = {};
          for (const key of keys) {
            changes[key] = { oldValue: remote[key] };
            delete remote[key];
          }
          emit(changes, "sync");
        }),
      },
    },
  });
});

test("migrates local settings without syncing session state or version", async () => {
  const { setupSettingsSync, encodeSyncedSettings } = await import("@/src/settings/sync");
  local = { settings, version: "test", tabSnapshots: { 1: [] } };
  await setupSettingsSync();
  expect(remote).toEqual((await encodeSyncedSettings(settings)).values);
  expect(local.settingsSyncPending).toBe(false);
  expect(chrome.storage.sync.set).toHaveBeenCalledTimes(1);
});

test("prefers existing sync settings at migration without echoing them", async () => {
  const { setupSettingsSync, encodeSyncedSettings } = await import("@/src/settings/sync");
  local = { settings: DEFAULT_SETTINGS };
  remote = (await encodeSyncedSettings(settings)).values;
  await setupSettingsSync();
  expect(local.settings).toEqual(settings);
  expect(chrome.storage.sync.set).not.toHaveBeenCalled();
});

test("does not publish defaults from an empty profile before cloud data arrives", async () => {
  const { setupSettingsSync, encodeSyncedSettings } = await import("@/src/settings/sync");
  await setupSettingsSync();
  expect(chrome.storage.sync.set).not.toHaveBeenCalled();
  update("sync", (await encodeSyncedSettings(settings)).values);
  await flush();
  expect(local.settings).toEqual(settings);
  expect(chrome.storage.sync.set).not.toHaveBeenCalled();
});

test("retains unsent local changes after worker restart and retries a failed upload", async () => {
  let sync = await import("@/src/settings/sync");
  const previous = await sync.encodeSyncedSettings(DEFAULT_SETTINGS);
  local = { settings, settingsSyncHash: previous.hash, settingsSyncPending: true };
  remote = previous.values;
  vi.mocked(chrome.storage.sync.set).mockRejectedValueOnce(new Error("quota"));
  await sync.setupSettingsSync();
  expect(local.settings).toEqual(settings);
  expect(local.settingsSyncPending).toBe(true);
  expect(local.settingsSyncError).toBe("unavailable");
  listeners = [];
  vi.resetModules();
  sync = await import("@/src/settings/sync");
  await sync.setupSettingsSync();
  expect(remote).toEqual((await sync.encodeSyncedSettings(settings)).values);
  expect(local.settings).toEqual(settings);
  expect(local.settingsSyncPending).toBe(false);
  expect(local.settingsSyncError).toBeNull();
});

test("detects a local change even if a previous completion overwrote its pending flag", async () => {
  const { setupSettingsSync, encodeSyncedSettings } = await import("@/src/settings/sync");
  const previous = await encodeSyncedSettings(DEFAULT_SETTINGS);
  local = { settings, settingsSyncHash: previous.hash, settingsSyncPending: false };
  remote = previous.values;
  await setupSettingsSync();
  expect(remote).toEqual((await encodeSyncedSettings(settings)).values);
  expect(local.settings).toEqual(settings);
});

test("splits Unicode and escaped patterns below the per-item quota and removes obsolete chunks", async () => {
  const { setupSettingsSync, encodeSyncedSettings } = await import("@/src/settings/sync");
  const large = {
    ...settings,
    popup: { openAsNewTab: true, exceptions: [{ url: "日本😀\\d".repeat(1800) }] },
  };
  const encoded = await encodeSyncedSettings(large);
  expect(Object.keys(encoded.values).length).toBeGreaterThan(2);
  for (const [key, value] of Object.entries(encoded.values)) {
    expect(Buffer.byteLength(key + JSON.stringify(value))).toBeLessThan(8192);
  }
  remote = { ...encoded.values, unrelated: "keep" };
  await setupSettingsSync();
  expect(local.settings).toEqual(large);
  update("local", { settings, settingsSyncPending: true });
  await flush();
  expect(remote).toEqual({ ...(await encodeSyncedSettings(settings)).values, unrelated: "keep" });
  expect(chrome.storage.sync.remove).toHaveBeenCalled();
});

test("ignores missing, mismatched, and corrupt chunks until a complete snapshot arrives", async () => {
  const { setupSettingsSync, encodeSyncedSettings } = await import("@/src/settings/sync");
  const encoded = await encodeSyncedSettings(settings);
  local = { settings: DEFAULT_SETTINGS };
  remote = { settingsSync: encoded.values.settingsSync };
  await setupSettingsSync();
  expect(local.settings).toEqual(DEFAULT_SETTINGS);
  expect(chrome.storage.sync.set).not.toHaveBeenCalled();
  update("sync", { "settingsSyncChunk:0": { hash: "other", text: "{}" } });
  await flush();
  expect(local.settings).toEqual(DEFAULT_SETTINGS);
  update("sync", { "settingsSyncChunk:0": { hash: encoded.hash, text: "corrupt" } });
  await flush();
  expect(local.settings).toEqual(DEFAULT_SETTINGS);
  update("sync", encoded.values);
  await flush();
  expect(local.settings).toEqual(settings);
  expect(chrome.storage.sync.set).not.toHaveBeenCalled();
});

test("keeps oversized settings locally and retries when the user reduces their size", async () => {
  const { setupSettingsSync, encodeSyncedSettings } = await import("@/src/settings/sync");
  const previous = await encodeSyncedSettings(DEFAULT_SETTINGS);
  const large = {
    ...settings,
    popup: { openAsNewTab: true, exceptions: [{ url: "x".repeat(110000) }] },
  };
  local = { settings: large, settingsSyncPending: true };
  remote = previous.values;
  await setupSettingsSync();
  expect(local.settings).toEqual(large);
  expect(local.settingsSyncPending).toBe(true);
  expect(local.settingsSyncError).toBe("capacity");
  expect(chrome.storage.sync.set).not.toHaveBeenCalled();
  expect(remote).toEqual(previous.values);
  update("local", { settings, settingsSyncPending: true });
  await flush();
  expect(remote).toEqual((await encodeSyncedSettings(settings)).values);
  expect(local.settingsSyncError).toBeNull();
});

for (const [message, expected] of [
  ["QUOTA_BYTES quota exceeded", "capacity"],
  ["MAX_WRITE_OPERATIONS_PER_MINUTE exceeded", "unavailable"],
  ["service unavailable", "unavailable"],
] as const) {
  test(`reports a Chrome API failure: ${message}`, async () => {
    const { setupSettingsSync } = await import("@/src/settings/sync");
    local = { settings, settingsSyncPending: true };
    vi.mocked(chrome.storage.sync.set).mockRejectedValueOnce(new Error(message));
    await setupSettingsSync();
    expect(local.settingsSyncError).toBe(expected);
    expect(local.settings).toEqual(settings);
    expect(local.settingsSyncPending).toBe(true);
  });
}

test("does not let an in-flight remote read replace a newer local edit", async () => {
  const { setupSettingsSync, encodeSyncedSettings } = await import("@/src/settings/sync");
  remote = (await encodeSyncedSettings(DEFAULT_SETTINGS)).values;
  const read = Promise.withResolvers<Record<string, unknown>>();
  vi.mocked(chrome.storage.sync.get).mockImplementationOnce(() => read.promise);
  const initialized = setupSettingsSync();
  await vi.waitFor(() => expect(chrome.storage.sync.get).toHaveBeenCalled());
  update("local", { settings, settingsSyncPending: true });
  read.resolve(structuredClone(remote));
  await initialized;
  await flush();
  expect(local.settings).toEqual(settings);
  expect(remote).toEqual((await encodeSyncedSettings(settings)).values);
});

test("publishes a newer edit after an older upload completes", async () => {
  const { setupSettingsSync, encodeSyncedSettings } = await import("@/src/settings/sync");
  local = { settings: DEFAULT_SETTINGS, settingsSyncPending: true };
  const write = Promise.withResolvers<void>();
  vi.mocked(chrome.storage.sync.set).mockImplementationOnce(async values => {
    await write.promise;
    update("sync", values);
  });
  const initialized = setupSettingsSync();
  await vi.waitFor(() => expect(chrome.storage.sync.set).toHaveBeenCalled());
  update("local", { settings, settingsSyncPending: true });
  write.resolve();
  await initialized;
  await flush();
  expect(remote).toEqual((await encodeSyncedSettings(settings)).values);
  expect(local.settingsSyncPending).toBe(false);
});

const update = (area: "local" | "sync", values: Record<string, unknown>) => {
  const storage = area === "local" ? local : remote;
  const changes: Record<string, chrome.storage.StorageChange> = {};
  for (const [key, value] of Object.entries(values)) {
    if (JSON.stringify(storage[key]) !== JSON.stringify(value)) {
      changes[key] = { oldValue: storage[key], newValue: structuredClone(value) };
      storage[key] = structuredClone(value);
    }
  }
  if (Object.keys(changes).length) {
    emit(changes, area);
  }
};

const emit = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
  for (const listener of listeners) {
    tasks.push(listener(changes, area));
  }
};

const flush = async () => {
  while (tasks.length) {
    await Promise.all(tasks.splice(0));
  }
};
