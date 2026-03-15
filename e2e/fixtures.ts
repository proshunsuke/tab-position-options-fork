import fs from "node:fs";
import path from "node:path";
import { type BrowserContext, test as base, chromium, type Worker } from "@playwright/test";
import { waitForServiceWorker } from "@/e2e/utils/helpers";

export type TestFixtures = {
  context: BrowserContext;
  extensionId: string;
  serviceWorker: Worker;
};

export const test = base.extend<TestFixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture pattern requires empty object
  context: async ({}, use) => {
    // 拡張機能のパス（WXTのビルド出力）
    const pathToExtension = path.join(process.cwd(), "dist", "chrome-mv3");

    // テストごとに分離したプロフィールを使用して、状態リークを防ぐ
    const userDataRootDir = path.join(process.cwd(), "test-results");
    if (!fs.existsSync(userDataRootDir)) {
      fs.mkdirSync(userDataRootDir, { recursive: true });
    }

    const userDataDir = fs.mkdtempSync(path.join(userDataRootDir, "chrome-user-data-"));

    // 永続的なコンテキストでブラウザを起動
    const context = await chromium.launchPersistentContext(userDataDir, {
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    try {
      await use(context);
    } finally {
      await context.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  },

  extensionId: async ({ context }, use) => {
    const background = await waitForServiceWorker(context);
    const extensionId = background.url().split("/")[2];
    await use(extensionId);
  },

  serviceWorker: async ({ context }, use) => {
    const serviceWorker = await waitForServiceWorker(context);
    await use(serviceWorker);
  },
});

export const expect = test.expect;
