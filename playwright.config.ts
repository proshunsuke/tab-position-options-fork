import { defineConfig, devices } from "@playwright/test";

const localShard = process.env.E2E_SHARD_INDEX;
const outputDir = localShard ? `test-results/sharded/shard-${localShard}` : "test-results";

export default defineConfig({
  outputDir,
  testDir: "./e2e/specs",
  fullyParallel: false, // CIと同じくファイル単位で分割する
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 拡張機能テストは1ワーカーのみ
  reporter: localShard
    ? [["list"], ["blob", { outputDir: `${outputDir}/blob` }]]
    : [
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
        // 分割実行は画面のフォーカスを奪い合わないよう、拡張機能対応のChromiumでheadlessにする。
        channel: localShard ? "chromium" : undefined,
        headless: !!localShard,
      },
    },
  ],

  // テスト実行前にビルドを確認
  webServer: undefined, // 拡張機能テストではWebサーバーは不要
});
