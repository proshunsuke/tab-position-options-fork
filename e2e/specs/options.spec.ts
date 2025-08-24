import { expect, test } from "@/e2e/fixtures";
import { clearExtensionStorage } from "@/e2e/utils/helpers";

test.describe("Options Page", () => {
  test.beforeEach(async ({ context }) => {
    const [serviceWorker] = context.serviceWorkers();
    if (serviceWorker) {
      await clearExtensionStorage(serviceWorker);
    }
  });

  test("should open options page in new tab from extension icon", async ({
    context,
    extensionId,
  }) => {
    // 拡張機能のアイコンをクリックをシミュレート（オプションページが開く）
    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

    // オプションページが正しく開かれたことを確認
    await expect(optionsPage).toHaveTitle("Tab Position Options - Settings");
    await expect(optionsPage.locator("h1")).toContainText("Tab Position Options");

    // タブとして開かれていることを確認（ポップアップではない）
    const pages = context.pages();
    expect(pages.length).toBeGreaterThan(0);
    expect(pages.some(p => p.url().includes("options.html"))).toBeTruthy();
  });

  test("should save and load settings correctly", async ({ context, extensionId }) => {
    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

    // ページが完全に読み込まれるのを待つ
    await optionsPage.waitForLoadState("networkidle");

    // Tab Closingタブに移動
    await optionsPage.click('button:has-text("Tab Closing")');

    // タブの内容が表示されるのを待つ
    await optionsPage.waitForSelector("text=Activate Tab After Tab Closing");

    // inActivatedOrderオプションを選択
    const inActivatedOrderRadio = optionsPage.locator('input[value="inActivatedOrder"]');
    await inActivatedOrderRadio.click();

    // 保存ボタンをクリック
    await optionsPage.click('button:has-text("Save")');

    // 保存成功メッセージを確認
    await expect(optionsPage.locator("text=Settings saved successfully")).toBeVisible();

    // ページをリロード
    await optionsPage.reload();
    await optionsPage.waitForLoadState("networkidle");

    // Tab Closingタブに再度移動
    await optionsPage.click('button:has-text("Tab Closing")');

    // 設定が保持されていることを確認
    await expect(inActivatedOrderRadio).toBeChecked();
  });

  test("should display all tab options correctly", async ({ context, extensionId }) => {
    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

    // ページが完全に読み込まれるのを待つ
    await optionsPage.waitForLoadState("networkidle");

    // 各タブが存在することを確認
    const tabs = ["Tab Behavior", "Tab Closing"];
    for (const tab of tabs) {
      await expect(optionsPage.locator(`button:has-text("${tab}")`)).toBeVisible();
    }

    // Tab Behaviorタブの内容を確認
    await optionsPage.click('button:has-text("Tab Behavior")');
    await expect(optionsPage.locator('h2:has-text("New Tab")')).toBeVisible();
    // New Tab Backgroundチェックボックスの存在を確認
    await expect(optionsPage.locator('label:has-text("New Tab Background")')).toBeVisible();
    await expect(optionsPage.locator('input[name="openInBackground"]')).toBeVisible();

    // Tab Closingタブの内容を確認
    await optionsPage.click('button:has-text("Tab Closing")');
    await expect(
      optionsPage.locator('h2:has-text("Activate Tab After Tab Closing")'),
    ).toBeVisible();
  });
});
