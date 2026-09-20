import fs from "node:fs";
import { expect, test } from "@/e2e/fixtures";
import { setExtensionSettings } from "@/e2e/utils/helpers";
import { DEFAULT_SETTINGS, type Settings } from "@/src/types";

const settings: Settings = {
  externalLinks: { enabled: true, urlRules: [{ url: "example", action: "background-link" }] },
  newTab: {
    position: "left",
    openInBackground: true,
    urlRules: [
      { url: "^https://例子\\.test/", position: "right", active: "background" },
      { url: "second", position: "default", active: "foreground" },
    ],
  },
  loadingPage: { urlRules: [{ url: "loading", position: "middle" }] },
  afterTabClosing: { activateTab: "sourceTabAndOrder" },
  tabOnActivate: { behavior: "last" },
  popup: { openAsNewTab: true, exceptions: [{ url: "popup" }] },
};
const file = { format: "tab-position-options-fork", version: 1, settings };
const importedMessage = "Settings loaded into the form. Click Save Settings to apply them.";
const importError =
  "Could not import this file. Choose a valid settings file exported by Tab Position Options Fork.";

test.beforeEach(async ({ context }) => {
  await setExtensionSettings(context, DEFAULT_SETTINGS);
});

test("imports into the form, exports drafts, and persists only on Save Settings", async ({
  context,
  extensionId,
  serviceWorker,
}, testInfo) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import Settings", exact: true }).click();
  await (await chooser).setFiles({
    name: "settings.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(file)),
  });
  await expect(page.getByRole("status")).toHaveText(importedMessage);
  await expect(page.locator('input[name="newTabPosition"][value="left"]')).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "New Tab Background", exact: true }),
  ).toBeChecked();
  await expect(page.getByRole("textbox", { name: "URL pattern 1", exact: true })).toHaveValue(
    settings.newTab.urlRules![0].url,
  );
  await expect(page.getByRole("combobox", { name: "Position 1", exact: true })).toHaveValue(
    "right",
  );
  await expect(page.getByRole("combobox", { name: "Activation 1", exact: true })).toHaveValue(
    "background",
  );
  await expect(page.getByRole("textbox", { name: "URL pattern 2", exact: true })).toHaveValue(
    "second",
  );
  await expect(
    page.getByRole("textbox", { name: "Loading URL pattern 1", exact: true }),
  ).toHaveValue("loading");
  await expect(page.getByRole("combobox", { name: "Loading position 1", exact: true })).toHaveValue(
    "middle",
  );
  await expect(
    page.getByRole("checkbox", { name: "Open pop-up window as new tab", exact: true }),
  ).toBeChecked();
  await expect(page.getByRole("textbox", { name: "Pop-up exception 1", exact: true })).toHaveValue(
    "popup",
  );
  await page.getByRole("button", { name: "Tab Closing", exact: true }).click();
  await expect(page.locator('input[value="sourceTabAndOrder"]')).toBeChecked();
  await page.getByRole("button", { name: "Tab on Activate", exact: true }).click();
  await expect(page.locator('input[name="tabOnActivate"][value="last"]')).toBeChecked();
  await page.getByRole("button", { name: "External Links", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Open external links in new tabs", exact: true }),
  ).toBeChecked();
  await expect(page.getByRole("textbox", { name: "URL pattern 1", exact: true })).toHaveValue(
    "example",
  );
  await expect(page.getByRole("combobox", { name: "Link action 1", exact: true })).toHaveValue(
    "background-link",
  );
  await page.screenshot({ path: testInfo.outputPath("settings-transfer.png"), fullPage: true });

  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Settings", exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("tab-position-options-fork-settings.json");
  const exportedPath = testInfo.outputPath(download.suggestedFilename());
  await download.saveAs(exportedPath);
  expect(JSON.parse(fs.readFileSync(exportedPath, "utf8"))).toEqual(file);
  expect(
    await serviceWorker.evaluate(async () => (await chrome.storage.local.get("settings")).settings),
  ).toEqual(DEFAULT_SETTINGS);

  // 未保存の読み込みはリロードで破棄され、書き出したファイルから復元できる。
  await page.reload();
  await expect(page.locator('input[name="newTabPosition"][value="default"]')).toBeChecked();
  await page.locator('input[type="file"]').setInputFiles(exportedPath);
  await expect(page.getByRole("status")).toHaveText(importedMessage);
  // 同じファイルを選び直してもchangeが発生することを確認する。
  await page.locator('input[name="newTabPosition"][value="first"]').check();
  await page.locator('input[type="file"]').setInputFiles(exportedPath);
  await expect(page.locator('input[name="newTabPosition"][value="left"]')).toBeChecked();
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  await expect
    .poll(() =>
      serviceWorker.evaluate(async () => (await chrome.storage.local.get("settings")).settings),
    )
    .toEqual(settings);
  await page.reload();
  await expect(page.locator('input[name="newTabPosition"][value="left"]')).toBeChecked();
  await expect(page.getByRole("textbox", { name: "URL pattern 2", exact: true })).toHaveValue(
    "second",
  );
});

test("invalid files preserve both draft and saved settings, then allow retry", async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.locator('input[name="newTabPosition"][value="first"]').check();
  for (const content of [
    "{invalid",
    JSON.stringify({ osel: "openbutton1" }),
    JSON.stringify({
      ...file,
      settings: { ...settings, popup: { openAsNewTab: true, exceptions: [{ url: "[" }] } },
    }),
  ]) {
    await page.locator('input[type="file"]').setInputFiles({
      name: "settings.json",
      mimeType: "application/json",
      buffer: Buffer.from(content),
    });
    await expect(page.getByRole("status")).toHaveText(importError);
    await expect(page.locator('input[name="newTabPosition"][value="first"]')).toBeChecked();
    await expect(page.getByRole("textbox", { name: "URL pattern 1", exact: true })).toHaveCount(0);
    expect(
      await serviceWorker.evaluate(
        async () => (await chrome.storage.local.get("settings")).settings,
      ),
    ).toEqual(DEFAULT_SETTINGS);
  }
  await page.locator('input[type="file"]').setInputFiles({
    name: "settings.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(file)),
  });
  await expect(page.getByRole("status")).toHaveText(importedMessage);
  await expect(page.locator('input[name="newTabPosition"][value="left"]')).toBeChecked();
});

test("invalid draft rules cannot be exported", async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.getByRole("button", { name: "Add rule", exact: true }).click();
  await page.getByRole("textbox", { name: "URL pattern 1", exact: true }).fill("[");
  let downloaded = false;
  page.on("download", () => {
    downloaded = true;
  });
  await page.getByRole("button", { name: "Export Settings", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Could not export settings. Check the URL patterns and try again.",
  );
  expect(downloaded).toBe(false);
  await page.getByRole("textbox", { name: "URL pattern 1", exact: true }).fill("valid");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Settings", exact: true }).click();
  await download;
  await expect(page.getByRole("status")).not.toBeVisible();
});

test("file read failures leave settings editable and unchanged", async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.locator('input[name="newTabPosition"][value="first"]').check();
  await page.evaluate(() => {
    const original = File.prototype.text;
    File.prototype.text = () => {
      File.prototype.text = original;
      return Promise.reject(new Error("File read failed"));
    };
  });
  await page.locator('input[type="file"]').setInputFiles({
    name: "settings.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(file)),
  });
  await expect(page.getByRole("status")).toHaveText(importError);
  await expect(page.locator('input[name="newTabPosition"][value="first"]')).toBeChecked();
  await expect(page.getByRole("button", { name: "Save Settings", exact: true })).toBeEnabled();
});
