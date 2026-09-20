import fs from "node:fs";
import path from "node:path";
import { type BrowserContext, chromium, expect } from "@playwright/test";
import { waitForServiceWorker } from "@/e2e/utils/helpers";

type DeveloperPrivate = {
  updateProfileConfiguration: (options: { inDeveloperMode: boolean }) => Promise<void>;
  reload: (
    id: string,
    options: { failQuietly: boolean; populateErrorForUnpacked: boolean },
  ) => Promise<{ retryGuid: string }>;
  loadUnpacked: (options: { retryGuid: string; failQuietly: boolean }) => Promise<void>;
};

export type RestoreEvents = {
  startups: number;
  installs: number;
  created: number[];
  moves: number[];
};

export const prepareSessionRestoreProfile = (profile: string, extensionPath: string) => {
  fs.cpSync(path.join(process.cwd(), "dist/chrome-mv3"), extensionPath, { recursive: true });
  fs.mkdirSync(path.join(profile, "Default"), { recursive: true });
  fs.writeFileSync(
    path.join(profile, "Default", "Preferences"),
    JSON.stringify({ session: { restore_on_startup: 1 } }),
  );
  // テスト用コピーだけでイベント到達と移動を記録する。再インストールでの偽陽性を防ぐ。
  const background = path.join(extensionPath, "background.js");
  fs.writeFileSync(
    background,
    `globalThis.__restoreEvents = { startups: 0, installs: 0, created: [], moves: [] };
chrome.runtime.onStartup.addListener(() => globalThis.__restoreEvents.startups++);
chrome.runtime.onInstalled.addListener(() => globalThis.__restoreEvents.installs++);
chrome.tabs.onCreated.addListener(tab => globalThis.__restoreEvents.created.push(tab.id));
const originalMove = chrome.tabs.move.bind(chrome.tabs);
chrome.tabs.move = (...args) => {
  globalThis.__restoreEvents.moves.push(...[args[0]].flat());
  return originalMove(...args);
};
${fs.readFileSync(background, "utf8")}`,
  );
};

export const launchSessionRestoreContext = (
  profile: string,
  options: { channel?: string; headless: boolean },
) =>
  chromium.launchPersistentContext(profile, {
    ...options,
    ignoreDefaultArgs: ["--disable-extensions", "about:blank"],
    args: ["--enable-unsafe-extension-debugging", "--restore-last-session"],
  });

export const installSessionRestoreExtension = async (
  context: BrowserContext,
  extensionPath: string,
) => {
  const client = await context.browser()!.newBrowserCDPSession();
  const page = await context.newPage();
  const manifestPath = path.join(extensionPath, "manifest.json");
  const manifest = fs.readFileSync(manifestPath, "utf8");
  try {
    const { id } = await client.send("Extensions.loadUnpacked", { path: extensionPath });
    const initialWorker = await waitForServiceWorker(context);
    await page.goto("chrome://extensions");
    await page.evaluate(() => {
      const api = (chrome as typeof chrome & { developerPrivate: DeveloperPrivate })
        .developerPrivate;
      return api.updateProfileConfiguration({ inDeveloperMode: true });
    });
    // CLI/CDPで読み込んだ拡張は次回起動時に削除される。テスト用manifestの読み込みを
    // 一度失敗させ、拡張管理画面の「再試行」で通常のunpackedインストールに切り替える。
    // プロファイルの保護された設定ファイルは直接書き換えない。
    fs.writeFileSync(manifestPath, "{}");
    let retryGuid: string;
    try {
      ({ retryGuid } = await page.evaluate(id => {
        const api = (chrome as typeof chrome & { developerPrivate: DeveloperPrivate })
          .developerPrivate;
        return api.reload(id, { failQuietly: true, populateErrorForUnpacked: true });
      }, id));
      await expect.poll(() => context.serviceWorkers().includes(initialWorker)).toBe(false);
    } finally {
      fs.writeFileSync(manifestPath, manifest);
    }
    const installedWorker = context.waitForEvent("serviceworker");
    await page.evaluate(retryGuid => {
      const api = (chrome as typeof chrome & { developerPrivate: DeveloperPrivate })
        .developerPrivate;
      return api.loadUnpacked({ retryGuid, failQuietly: true });
    }, retryGuid);
    await installedWorker;
    await waitForServiceWorker(context);
  } finally {
    await page.close();
    await client.detach();
  }
};
