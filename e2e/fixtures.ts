import fs from "node:fs";
import path from "node:path";
import { type BrowserContext, test as base, chromium, type Worker } from "@playwright/test";
import { waitForServiceWorker } from "./utils/helpers";

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

    // ユーザーデータディレクトリの作成
    const userDataDir = path.join(process.cwd(), "test-results", "chrome-user-data");
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }

    // 永続的なコンテキストでブラウザを起動
    const context = await chromium.launchPersistentContext(userDataDir, {
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent("serviceworker");
    }

    const extensionId = background.url().split("/")[2];
    await use(extensionId);
  },

  serviceWorker: async ({ context }, use) => {
    const serviceWorker = await waitForServiceWorker(context);
    await use(serviceWorker);
  },
});

export const expect = test.expect;
