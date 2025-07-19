import fs from "node:fs";
import path from "node:path";
import { expect, test } from "../fixtures";

test.describe("Basic Extension Loading", () => {
  test.beforeAll(() => {
    // ビルド出力が存在することを確認
    const extensionPath = path.join(process.cwd(), "dist", "chrome-mv3");
    const manifestPath = path.join(extensionPath, "manifest.json");

    if (!fs.existsSync(extensionPath)) {
      throw new Error(`Extension not built. Path not found: ${extensionPath}`);
    }

    if (!fs.existsSync(manifestPath)) {
      throw new Error(`manifest.json not found at: ${manifestPath}`);
    }
  });

  test("should load extension successfully", async ({ context, extensionId }) => {
    // 拡張機能が読み込まれていることを確認
    expect(extensionId).toBeTruthy();
    expect(extensionId).toMatch(/^[a-z]{32}$/); // Chrome拡張機能IDの形式

    // Service Workerが動作していることを確認
    const [worker] = context.serviceWorkers();
    expect(worker).toBeTruthy();
    expect(worker.url()).toContain(extensionId);
  });

  test("should access options page", async ({ context, extensionId }) => {
    // オプションページを開く
    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

    // ページが正しく読み込まれたことを確認
    await expect(optionsPage).toHaveTitle("Tab Position Options - Settings");

    // 基本的な要素が存在することを確認
    await expect(optionsPage.locator("body")).toBeVisible();
    await expect(optionsPage.locator("#root")).toBeVisible();
  });
});
