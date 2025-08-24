import { expect, test } from "@/e2e/fixtures";
import { clearExtensionStorage } from "@/e2e/utils/helpers";

test.describe("Settings Storage", () => {
  test.beforeEach(async ({ serviceWorker }) => {
    await clearExtensionStorage(serviceWorker);
  });
  test("should persist all settings correctly", async ({ context, extensionId }) => {
    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

    // ページが完全に読み込まれるのを待つ
    await optionsPage.waitForLoadState("networkidle");

    // 各設定を変更
    // Tab Behaviorタブ
    await optionsPage.click('button:has-text("Tab Behavior")');
    await optionsPage.locator('input[value="first"]').click();
    // New Tab Backgroundチェックボックスを有効にする
    const backgroundCheckbox = optionsPage.locator('input[name="openInBackground"]');
    await backgroundCheckbox.check();

    // Tab Closingタブ
    await optionsPage.click('button:has-text("Tab Closing")');
    await optionsPage.locator('input[value="inActivatedOrder"]').click();

    // 保存
    await optionsPage.click('button:has-text("Save")');
    await expect(optionsPage.locator("text=Settings saved successfully")).toBeVisible();

    // chrome.storage.localから直接設定を確認
    const savedSettings = await optionsPage.evaluate(async () => {
      const result = await chrome.storage.local.get(["settings"]);
      return result.settings;
    });

    // デフォルト設定とマージされた状態を期待
    expect(savedSettings).toEqual({
      newTab: { position: "first", openInBackground: true },
      afterTabClosing: { activateTab: "inActivatedOrder" },
      loadingPage: { position: "default" },
      tabOnActivate: { behavior: "default" },
      popup: { openAsNewTab: false },
    });
  });

  test("should handle all tab position options", async ({ context, extensionId }) => {
    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
    await optionsPage.waitForLoadState("networkidle");

    const positions = ["first", "last", "right", "left", "default"];

    for (const position of positions) {
      await optionsPage.click('button:has-text("Tab Behavior")');
      await optionsPage.locator(`input[value="${position}"]`).click();
      await optionsPage.click('button:has-text("Save")');
      await expect(optionsPage.locator("text=Settings saved successfully")).toBeVisible();

      // 設定が保存されたことを確認
      const savedSettings = await optionsPage.evaluate(async () => {
        const result = await chrome.storage.local.get(["settings"]);
        return result.settings;
      });

      expect(savedSettings.newTab.position).toBe(position);
    }
  });

  test("should handle all tab closing options", async ({ context, extensionId }) => {
    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
    await optionsPage.waitForLoadState("networkidle");

    const activateOptions = [
      "first",
      "last",
      "right",
      "left",
      "inActivatedOrder",
      "sourceTab",
      "sourceTabAndOrder",
      "default",
    ];

    for (const option of activateOptions) {
      await optionsPage.click('button:has-text("Tab Closing")');
      await optionsPage.locator(`input[value="${option}"]`).click();
      await optionsPage.click('button:has-text("Save")');
      await expect(optionsPage.locator("text=Settings saved successfully")).toBeVisible();

      // 設定が保存されたことを確認
      const savedSettings = await optionsPage.evaluate(async () => {
        const result = await chrome.storage.local.get(["settings"]);
        return result.settings;
      });

      expect(savedSettings.afterTabClosing.activateTab).toBe(option);
    }
  });

  test("should handle New Tab Background checkbox correctly", async ({ context, extensionId }) => {
    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
    await optionsPage.waitForLoadState("networkidle");

    // Tab Behaviorタブに移動
    await optionsPage.click('button:has-text("Tab Behavior")');

    const backgroundCheckbox = optionsPage.locator('input[name="openInBackground"]');

    // デフォルトでは無効になっているはず
    await expect(backgroundCheckbox).not.toBeChecked();

    // チェックボックスを有効にする
    await backgroundCheckbox.check();

    // 保存
    await optionsPage.click('button:has-text("Save")');
    await expect(optionsPage.locator("text=Settings saved successfully")).toBeVisible();

    // 設定が保存されたことを確認
    let savedSettings = await optionsPage.evaluate(async () => {
      const result = await chrome.storage.local.get(["settings"]);
      return result.settings;
    });
    expect(savedSettings.newTab.openInBackground).toBe(true);

    // ページをリロードして設定が永続化されていることを確認
    await optionsPage.reload();
    await optionsPage.waitForLoadState("networkidle");
    await optionsPage.click('button:has-text("Tab Behavior")');
    await expect(backgroundCheckbox).toBeChecked();

    // チェックボックスを無効にする
    await backgroundCheckbox.uncheck();
    await optionsPage.click('button:has-text("Save")');
    await expect(optionsPage.locator("text=Settings saved successfully")).toBeVisible();

    // 設定が更新されたことを確認
    savedSettings = await optionsPage.evaluate(async () => {
      const result = await chrome.storage.local.get(["settings"]);
      return result.settings;
    });
    expect(savedSettings.newTab.openInBackground).toBe(false);

    // 再度リロードして設定が永続化されていることを確認
    await optionsPage.reload();
    await optionsPage.waitForLoadState("networkidle");
    await optionsPage.click('button:has-text("Tab Behavior")');
    await expect(backgroundCheckbox).not.toBeChecked();
  });
});
