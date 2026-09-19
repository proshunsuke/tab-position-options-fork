import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { expect, test } from "@/e2e/fixtures";
import { setExtensionSettings, waitForServiceWorker } from "@/e2e/utils/helpers";
import { DEFAULT_SETTINGS, type Settings } from "@/src/types";

for (const behavior of ["first", "last"] as const) {
  test(`browser restart preserves session order with activation=${behavior}`, async () => {
    const profile = fs.mkdtempSync(path.join(process.cwd(), "test-results", "restore-profile-"));
    const extensionPath = path.join(profile, "test-extension");
    fs.cpSync(path.join(process.cwd(), "dist/chrome-mv3"), extensionPath, { recursive: true });
    fs.mkdirSync(path.join(profile, "Default"));
    fs.writeFileSync(
      path.join(profile, "Default", "Preferences"),
      JSON.stringify({ session: { restore_on_startup: 1 } }),
    );
    const launch = () =>
      chromium.launchPersistentContext(profile, {
        headless: false,
        ignoreDefaultArgs: ["about:blank"],
        args: [
          `--disable-extensions-except=${extensionPath}`,
          `--load-extension=${extensionPath}`,
          "--restore-last-session",
        ],
      });
    let context = await launch();
    try {
      let worker = await waitForServiceWorker(context);
      const extensionId = worker.url().split("/")[2];
      await setExtensionSettings(context, DEFAULT_SETTINGS);
      const urls = ["a", "b", "c", "d"].map(
        name => `chrome-extension://${extensionId}/options.html#restore-${name}`,
      );
      await worker.evaluate(async urls => {
        const tabs = [];
        for (const url of urls) {
          tabs.push(await chrome.tabs.create({ url, active: false }));
        }
        await chrome.tabs.update(tabs[0].id!, { pinned: true });
        await chrome.tabs.update(tabs[2].id!, { active: true });
      }, urls);
      await setExtensionSettings(context, {
        ...DEFAULT_SETTINGS,
        newTab: {
          ...DEFAULT_SETTINGS.newTab,
          urlRules: [
            {
              url: "#restore-",
              position: behavior,
              active: behavior === "first" ? "foreground" : "background",
            },
          ],
        },
        tabOnActivate: { behavior },
      });
      const before = await worker.evaluate(async () =>
        (await chrome.tabs.query({}))
          .filter(tab => tab.url?.includes("#restore-"))
          .map(tab => ({ url: tab.url, pinned: tab.pinned, active: tab.active })),
      );
      expect(before.map(tab => tab.url)).toEqual(urls);
      await context.close();
      context = await launch();
      worker = await waitForServiceWorker(context);
      await expect(async () => {
        const after = await worker.evaluate(async () =>
          (await chrome.tabs.query({}))
            .filter(tab => tab.url?.includes("#restore-"))
            .map(tab => ({ url: tab.url, pinned: tab.pinned, active: tab.active })),
        );
        expect(after).toEqual(before);
      }).toPass({ timeout: 10000 });
      // 遅れて届く復元イベントや再試行でも配置が変わらないことを確認する。
      await new Promise(resolve => setTimeout(resolve, 1500));
      const after = await worker.evaluate(async () =>
        (await chrome.tabs.query({}))
          .filter(tab => tab.url?.includes("#restore-"))
          .map(tab => ({ url: tab.url, pinned: tab.pinned, active: tab.active })),
      );
      expect(after).toEqual(before);
      expect(
        await worker.evaluate(
          async () =>
            (await chrome.storage.local.get<{ settings: Settings }>("settings")).settings
              .tabOnActivate.behavior,
        ),
      ).toBe(behavior);
      // 復元後は、新規タブを開かなくても通常のactivation移動が有効になる。
      const targetUrl = behavior === "first" ? urls[3] : urls[1];
      const targetId = await worker.evaluate(async url => {
        const tab = (await chrome.tabs.query({})).find(tab => tab.url === url)!;
        await chrome.tabs.update(tab.id!, { active: true });
        return tab.id!;
      }, targetUrl);
      await expect(async () => {
        const tabs = await worker.evaluate(async () => chrome.tabs.query({}));
        const target = tabs.find(tab => tab.id === targetId)!;
        expect(target.index).toBe(
          behavior === "first" ? tabs.filter(tab => tab.pinned).length : tabs.length - 1,
        );
      }).toPass();
    } finally {
      await context.close();
      fs.rmSync(profile, { recursive: true, force: true });
    }
  });
}
