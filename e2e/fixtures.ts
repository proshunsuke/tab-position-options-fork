import fs from "node:fs";
import path from "node:path";
import { type BrowserContext, test as base, chromium, type Worker } from "@playwright/test";
import { waitForServiceWorker } from "@/e2e/utils/helpers";

export type TestFixtures = {
  context: BrowserContext;
  extensionId: string;
  serviceWorker: Worker;
  keepInstallOptions: boolean;
  grantOptionalPermissions: boolean;
};

export const test = base.extend<TestFixtures>({
  keepInstallOptions: [false, { option: true }],
  grantOptionalPermissions: [true, { option: true }],
  context: async (
    { channel, headless, keepInstallOptions, grantOptionalPermissions },
    use,
    testInfo,
  ) => {
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
      // Feature behavior specs need deterministic optional access without opening browser prompts.
      if (grantOptionalPermissions) {
        const manifestPath = path.join(pathToExtension, "manifest.json");
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Record<
          string,
          unknown
        >;
        const optionalPermissionsKey = "optional_permissions";
        const hostPermissionsKey = "host_permissions";
        const optionalHostPermissionsKey = "optional_host_permissions";
        const requiredPermissions = Array.isArray(manifest.permissions)
          ? (manifest.permissions as string[])
          : [];
        const optionalPermissions = Array.isArray(manifest[optionalPermissionsKey])
          ? (manifest[optionalPermissionsKey] as string[])
          : [];
        const requiredHostPermissions = Array.isArray(manifest[hostPermissionsKey])
          ? (manifest[hostPermissionsKey] as string[])
          : [];
        const optionalHostPermissions = Array.isArray(manifest[optionalHostPermissionsKey])
          ? (manifest[optionalHostPermissionsKey] as string[])
          : [];
        manifest.permissions = [...new Set([...requiredPermissions, ...optionalPermissions])];
        manifest[hostPermissionsKey] = [
          ...new Set([...requiredHostPermissions, ...optionalHostPermissions]),
        ];
        delete manifest[optionalPermissionsKey];
        delete manifest[optionalHostPermissionsKey];
        fs.writeFileSync(manifestPath, JSON.stringify(manifest));
      }
      context = await chromium.launchPersistentContext(userDataDir, {
        channel,
        headless,
        args: [
          `--disable-extensions-except=${pathToExtension}`,
          `--load-extension=${pathToExtension}`,
        ],
      });
      const worker = await waitForServiceWorker(context);
      const optionsUrl = `chrome-extension://${worker.url().split("/")[2]}/options.html`;
      // 初回表示の完了を待つ。通常のテストでは閉じ、タブ数や選択へ影響させない。
      const installedContext = context;
      await base.expect
        .poll(() => installedContext.pages().some(page => page.url() === optionsUrl))
        .toBe(true);
      const installPage = context.pages().find(page => page.url() === optionsUrl)!;
      // 翻訳と初期設定の読み込みまで待ってから閉じる。
      await base
        .expect(installPage.getByRole("button", { name: "Save Settings", exact: true }))
        .toBeEnabled();
      // Chromeが起動時の空白タブを設定画面に置き換える場合も、テスト開始時の1枚を確保する。
      if (context.pages().every(page => page.url() === optionsUrl)) {
        await context.newPage();
        if (keepInstallOptions) {
          await installPage.bringToFront();
        }
      }
      if (!keepInstallOptions) {
        await Promise.all(
          context
            .pages()
            .filter(page => page.url() === optionsUrl)
            .map(page => page.close()),
        );
      }
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
