import { parseSettingsFile, serializeSettings } from "@/src/settings/transfer";
import type { Settings } from "@/src/types";

type LocalSettings = {
  settings?: Settings;
  settingsSyncHash?: string;
  settingsSyncPending?: boolean;
};
type SyncHeader = { hash: string; count: number };
type SyncChunk = { hash: string; text: string };

const headerKey = "settingsSync";
const chunkPrefix = "settingsSyncChunk:";
const encoder = new TextEncoder();
let generation = 0;
let localChanged = false;
let requested = false;
let running = false;
let syncTask: Promise<void> | undefined;

/** タブ処理の初期化とは独立して開始する。同期を待たずローカル設定で操作できる。 */
export const setupSettingsSync = () => {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.settings || changes.settingsSyncPending?.newValue === true)) {
      // 同期からの反映は設定とハッシュを同時に保存する。再送しない。
      if (changes.settingsSyncHash?.newValue && !changes.settingsSyncPending?.newValue) {
        return;
      }
      generation++;
      localChanged = true;
      return requestSync();
    } else if (area === "sync" && Object.keys(changes).some(isSettingsKey)) {
      return requestSync();
    }
  });
  return requestSync();
};

/** 分割片にもハッシュを付け、別端末の更新や配信途中の断片を混ぜて適用しない。 */
export const encodeSyncedSettings = async (settings: Settings) => {
  const text = JSON.stringify(JSON.parse(serializeSettings(settings)));
  const hash = await hashText(text);
  const chunks: Record<string, SyncChunk | SyncHeader> = {};
  // JSONエスケープやUnicodeを含めても、1項目8KBを十分下回る単位に分割する。
  for (let index = 0; index < text.length; index += 1000) {
    chunks[`${chunkPrefix}${index / 1000}`] = { hash, text: text.slice(index, index + 1000) };
  }
  chunks[headerKey] = { hash, count: Object.keys(chunks).length };
  return { hash, values: chunks };
};

const requestSync = () => {
  requested = true;
  if (!running) {
    syncTask = synchronize();
  }
  return syncTask;
};

const synchronize = async () => {
  running = true;
  try {
    while (requested) {
      requested = false;
      try {
        await synchronizeOnce();
      } catch {
        // ローカル設定を保持し、次の変更・同期イベント・Worker起動で再試行する。
        // 失敗した処理自体は再要求しないが、処理中に届いた新しい変更は処理する。
      }
    }
  } finally {
    running = false;
  }
};

const synchronizeOnce = async () => {
  const currentGeneration = generation;
  const changed = localChanged;
  const local = await chrome.storage.local.get<LocalSettings>([
    "settings",
    "settingsSyncHash",
    "settingsSyncPending",
  ]);
  if (currentGeneration !== generation) {
    return;
  }
  const encoded = local.settings ? await encodeSyncedSettings(local.settings) : undefined;
  if (currentGeneration !== generation) {
    return;
  }
  const pending =
    changed ||
    local.settingsSyncPending ||
    (local.settingsSyncHash !== undefined && encoded?.hash !== local.settingsSyncHash);
  if (pending && !local.settingsSyncPending) {
    // 同期APIが失敗してWorkerが停止しても、未送信の変更を次回起動で優先する。
    await chrome.storage.local.set({ settingsSyncPending: true });
  }
  const remote = await chrome.storage.sync.get<Record<string, unknown>>(null);
  const synced = await decodeSyncedSettings(remote);
  if (currentGeneration !== generation) {
    return;
  }
  if (!pending && synced) {
    if (encoded?.hash !== synced.hash || local.settingsSyncHash !== synced.hash) {
      await chrome.storage.local.set({
        settings: synced.settings,
        settingsSyncHash: synced.hash,
        settingsSyncPending: false,
      });
    }
    return;
  }
  // 不完全な同期データで既存設定を上書きしない。未設定の端末からデフォルトも送らない。
  if (!encoded || (!pending && synced === null)) {
    return;
  }
  if (!local.settingsSyncPending) {
    await chrome.storage.local.set({ settingsSyncPending: true });
  }
  if (currentGeneration !== generation) {
    return;
  }
  if (synced?.hash !== encoded.hash) {
    const obsoleteKeys = Object.keys(remote).filter(
      key => isSettingsKey(key) && !(key in encoded.values),
    );
    const updates: Record<string, unknown> = { ...encoded.values };
    for (const key of obsoleteKeys) {
      updates[key] = null;
    }
    assertSyncQuota({ ...remote, ...updates });
    // ヘッダーと全断片を一度に保存。古い断片は同時に無効化してから削除する。
    await chrome.storage.sync.set(updates);
    if (obsoleteKeys.length) {
      await chrome.storage.sync.remove(obsoleteKeys);
    }
  }
  if (currentGeneration !== generation) {
    return;
  }
  await chrome.storage.local.set({ settingsSyncHash: encoded.hash, settingsSyncPending: false });
  localChanged = false;
};

const decodeSyncedSettings = async (values: Record<string, unknown>) => {
  if (!Object.keys(values).some(isSettingsKey)) {
    return undefined;
  }
  const header = values[headerKey] as SyncHeader | undefined;
  if (
    !header ||
    typeof header.hash !== "string" ||
    !Number.isInteger(header.count) ||
    header.count < 1 ||
    header.count >= 512
  ) {
    return null;
  }
  let text = "";
  for (let index = 0; index < header.count; index++) {
    const chunk = values[`${chunkPrefix}${index}`] as SyncChunk | undefined;
    if (!chunk || chunk.hash !== header.hash || typeof chunk.text !== "string") {
      return null;
    }
    text += chunk.text;
  }
  if ((await hashText(text)) !== header.hash) {
    return null;
  }
  try {
    return { hash: header.hash, settings: parseSettingsFile(text) };
  } catch {
    return null;
  }
};

const hashText = async (text: string) => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
};

const isSettingsKey = (key: string) => key === headerKey || key.startsWith(chunkPrefix);

const assertSyncQuota = (values: Record<string, unknown>) => {
  const sizes = Object.entries(values).map(
    ([key, value]) => encoder.encode(key).length + encoder.encode(JSON.stringify(value)).length,
  );
  if (
    sizes.length > 512 ||
    sizes.some(size => size > 8192) ||
    sizes.reduce((a, b) => a + b, 0) > 102400
  ) {
    throw new Error("Settings exceed Chrome sync storage capacity");
  }
};
