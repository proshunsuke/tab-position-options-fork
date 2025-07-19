import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: false, // 拡張機能テストは並列実行しない
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 拡張機能テストは1ワーカーのみ
  reporter: [
    // CI環境では、JUnit XMLレポートを出力
    process.env.CI ? ["junit", { outputFile: "test-results/junit.xml" }] : ["list"],
    // HTMLレポートは生成するが、サーバーは起動しない
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  timeout: 60000, // 60秒のタイムアウト
  use: {
    trace: "on-first-retry",
    video: "retain-on-failure",
    // デバッグ用の設定
    screenshot: "only-on-failure",
    actionTimeout: 10000,
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // 拡張機能テストではヘッドレスモードは使用できない
        headless: false,
      },
    },
  ],

  // テスト実行前にビルドを確認
  webServer: undefined, // 拡張機能テストではWebサーバーは不要
});
