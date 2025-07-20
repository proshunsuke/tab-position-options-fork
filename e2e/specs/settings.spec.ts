import { expect, test } from "@/e2e/fixtures";

test.describe("Settings Storage", () => {
  test("should persist all settings correctly", async ({ context, extensionId }) => {
    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

    // ページが完全に読み込まれるのを待つ
    await optionsPage.waitForLoadState("networkidle");

    // 各設定を変更
    // Tab Behaviorタブ
    await optionsPage.click('button:has-text("Tab Behavior")');
    await optionsPage.locator('input[value="first"]').click();

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

    expect(savedSettings).toEqual({
      newTab: { position: "first" },
      afterTabClosing: { activateTab: "inActivatedOrder" },
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
});
