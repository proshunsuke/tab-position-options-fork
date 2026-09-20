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
  context: async ({ channel, headless }, use, testInfo) => {
    // 各テスト・分割の出力先に置き、別プロセスの後片付けから分離する。
    const userDataDir = fs.mkdtempSync(testInfo.outputPath("chrome-user-data-"));
    const extensionSource = path.join(process.cwd(), "dist", "chrome-mv3");
    const pathToExtension = path.join(userDataDir, "test-extension");
    const localesDir = path.join(extensionSource, "_locales");
    let context: BrowserContext | undefined;
    try {
      // macOSでは--langで拡張機能の表示言語を固定できない。
      // テスト用コピーだけ英語を残し、default_localeへのフォールバックで表示を固定する。
      fs.cpSync(extensionSource, pathToExtension, {
        recursive: true,
        filter: source => path.dirname(source) !== localesDir || path.basename(source) === "en",
      });
      context = await chromium.launchPersistentContext(userDataDir, {
        channel,
        headless,
        args: [
          `--disable-extensions-except=${pathToExtension}`,
          `--load-extension=${pathToExtension}`,
        ],
      });
      await use(context);
    } finally {
      try {
        await context?.close();
      } finally {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      }
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
