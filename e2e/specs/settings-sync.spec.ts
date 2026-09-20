import { expect, test } from "@/e2e/fixtures";
import { createWindowWithTabs, setExtensionSettings } from "@/e2e/utils/helpers";
import { encodeSyncedSettings } from "@/src/settings/sync";
import { DEFAULT_SETTINGS, type Settings } from "@/src/types";

const settings: Settings = {
  ...DEFAULT_SETTINGS,
  newTab: { position: "first", openInBackground: false, urlRules: [] },
  popup: {
    openAsNewTab: false,
    exceptions: Array.from({ length: 50 }, (_, index) => ({ url: `https://例子.test/${index}` })),
  },
};

test.beforeEach(async ({ context, serviceWorker }) => {
  await setExtensionSettings(context, DEFAULT_SETTINGS);
  const encoded = await encodeSyncedSettings(DEFAULT_SETTINGS);
  await expect(async () => {
    const stored = await serviceWorker.evaluate(() => chrome.storage.local.get("settingsSyncHash"));
    expect(stored.settingsSyncHash).toBe(encoded.hash);
  }).toPass();
});

test("saving options automatically publishes settings without session or browsing data", async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.locator('input[name="newTabPosition"][value="left"]').check();
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  const expected = await encodeSyncedSettings({
    ...DEFAULT_SETTINGS,
    newTab: { ...DEFAULT_SETTINGS.newTab, position: "left" },
  });
  await expect(async () => {
    expect(await serviceWorker.evaluate(() => chrome.storage.sync.get(null))).toEqual(
      expected.values,
    );
  }).toPass();
});

test("a complete remote snapshot updates the open form and subsequent tab operations", async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  const { windowId } = await createWindowWithTabs(serviceWorker, 3);
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(page.locator('input[name="newTabPosition"][value="default"]')).toBeChecked();
  const encoded = await encodeSyncedSettings(settings);
  expect(Object.keys(encoded.values).length).toBeGreaterThan(2);
  // Chromeから受信する同期ストレージ変更を再現。実アカウントのクラウド転送は使わない。
  await serviceWorker.evaluate(values => chrome.storage.sync.set(values), encoded.values);
  await expect(page.locator('input[name="newTabPosition"][value="first"]')).toBeChecked();
  await page.getByRole("button", { name: "Pop-up", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Pop-up exception 50", exact: true })).toHaveValue(
    settings.popup.exceptions![49].url,
  );
  const tab = await serviceWorker.evaluate(
    windowId => chrome.tabs.create({ windowId, url: "about:blank" }),
    windowId,
  );
  await expect(async () => {
    expect(
      await serviceWorker.evaluate(async id => (await chrome.tabs.get(id)).index, tab.id!),
    ).toBe(0);
  }).toPass();
  expect(
    await serviceWorker.evaluate(async () => (await chrome.storage.local.get("settings")).settings),
  ).toEqual(settings);
});

test("remote updates preserve an unsaved rule addition and Save publishes that draft", async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.getByRole("button", { name: "Add rule", exact: true }).click();
  await page.getByRole("textbox", { name: "URL pattern 1", exact: true }).fill("draft.test");
  const encoded = await encodeSyncedSettings(settings);
  await serviceWorker.evaluate(values => chrome.storage.sync.set(values), encoded.values);
  await expect(async () => {
    expect(
      await serviceWorker.evaluate(
        async () => (await chrome.storage.local.get("settings")).settings,
      ),
    ).toEqual(settings);
  }).toPass();
  await expect(page.locator('input[name="newTabPosition"][value="default"]')).toBeChecked();
  await expect(page.getByRole("textbox", { name: "URL pattern 1", exact: true })).toHaveValue(
    "draft.test",
  );
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  await expect(async () => {
    const local = await serviceWorker.evaluate(() =>
      chrome.storage.local.get<{
        settings: Settings;
        settingsSyncHash: string;
        settingsSyncPending: boolean;
      }>(["settings", "settingsSyncHash", "settingsSyncPending"]),
    );
    expect(local.settings.newTab.position).toBe("default");
    expect(local.settings.newTab.urlRules![0].url).toBe("draft.test");
    expect(local.settingsSyncPending).toBe(false);
    expect(local.settingsSyncHash).toBe((await encodeSyncedSettings(local.settings)).hash);
  }).toPass();
});

test("partial delivery retains the current configuration until all chunks arrive", async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(page.locator('input[name="newTabPosition"][value="default"]')).toBeChecked();
  const encoded = await encodeSyncedSettings(settings);
  await serviceWorker.evaluate(
    header => chrome.storage.sync.set({ settingsSync: header }),
    encoded.values.settingsSync,
  );
  // 間に別の同期イベントも挟み、断片が揃うまで既存設定を保持することを確認する。
  await serviceWorker.evaluate(() =>
    chrome.storage.sync.set({ "settingsSyncChunk:0": { hash: "incomplete", text: "{}" } }),
  );
  expect(
    await serviceWorker.evaluate(async () => (await chrome.storage.local.get("settings")).settings),
  ).toEqual(DEFAULT_SETTINGS);
  await expect(page.locator('input[name="newTabPosition"][value="default"]')).toBeChecked();
  await serviceWorker.evaluate(values => chrome.storage.sync.set(values), encoded.values);
  await expect(page.locator('input[name="newTabPosition"][value="first"]')).toBeChecked();
});

test("shows a failed upload across page reloads and clears the warning after retry", async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await serviceWorker.evaluate(() => {
    const original = chrome.storage.sync.set;
    chrome.storage.sync.set = (() => {
      chrome.storage.sync.set = original;
      return Promise.reject(new Error("Sync service unavailable"));
    }) as typeof chrome.storage.sync.set;
  });
  await page.locator('input[name="newTabPosition"][value="left"]').check();
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Settings could not be synchronized.");
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("Saved settings remain on this device.");
  await expect(page.locator('input[name="newTabPosition"][value="left"]')).toBeChecked();
  await page.locator('input[name="newTabPosition"][value="right"]').check();
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(
    await serviceWorker.evaluate(
      async () => (await chrome.storage.local.get("settingsSyncPending")).settingsSyncPending,
    ),
  ).toBe(false);
});

test("shows capacity fallback and clears the warning after reducing rules", async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  const large = {
    ...DEFAULT_SETTINGS,
    popup: { openAsNewTab: false, exceptions: [{ url: "x".repeat(110000) }] },
  };
  await setExtensionSettings(context, large);
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(page.getByRole("alert")).toContainText("Settings exceed the sync storage limit");
  expect(
    await serviceWorker.evaluate(async () => (await chrome.storage.local.get("settings")).settings),
  ).toEqual(large);
  await page.getByRole("button", { name: "Pop-up", exact: true }).click();
  await page.getByRole("button", { name: "Remove pop-up exception 1", exact: true }).click();
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
