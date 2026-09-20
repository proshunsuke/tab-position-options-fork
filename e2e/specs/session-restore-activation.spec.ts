import fs from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { expect, test } from "@/e2e/fixtures";
import { setExtensionSettings, waitForServiceWorker } from "@/e2e/utils/helpers";
import {
  installSessionRestoreExtension,
  launchSessionRestoreContext,
  prepareSessionRestoreProfile,
  type RestoreEvents,
} from "@/e2e/utils/sessionRestore";
import { DEFAULT_SETTINGS, type Settings } from "@/src/types";

for (const scenario of ["right", "left", "first", "last", "multiple-windows"] as const) {
  const activation = scenario === "first" || scenario === "last";
  const behavior = activation ? scenario : "default";
  const position = scenario === "multiple-windows" ? "right" : scenario;
  test(`browser restart preserves session order with ${scenario}`, async ({
    channel,
    headless,
  }) => {
    const profile = fs.mkdtempSync(test.info().outputPath("restore-profile-"));
    const extensionPath = path.join(profile, "test-extension");
    prepareSessionRestoreProfile(profile, extensionPath);
    // HTTPの実ナビゲーションでLoading Pageの復元ガードも検証する。
    const server = createServer((_request, response) => {
      response.writeHead(200, { "content-type": "text/html" });
      response.end("<title>Restored page</title>");
    });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Missing server address");
    }
    const origin = `http://127.0.0.1:${address.port}`;
    const launch = () => launchSessionRestoreContext(profile, { channel, headless });
    let context = await launch();
    try {
      await installSessionRestoreExtension(context, extensionPath);
      let worker = await waitForServiceWorker(context);
      await setExtensionSettings(context, DEFAULT_SETTINGS);
      const urls = Array.from(
        { length: scenario === "multiple-windows" ? 80 : 4 },
        (_, index) => `${origin}/page#restore-${index}`,
      );
      await worker.evaluate(async urls => {
        const tabs = [];
        let windowId: number | undefined;
        for (const url of urls) {
          if (urls.length === 80 && tabs.length % 40 === 0) {
            windowId = (await chrome.windows.create({ url, focused: true }))!.id;
            tabs.push((await chrome.tabs.query({ windowId }))[0]);
          } else {
            tabs.push(await chrome.tabs.create({ url, windowId, active: false }));
          }
        }
        await chrome.tabs.update(tabs[0].id!, { pinned: true });
        await chrome.tabs.update(tabs[2].id!, { active: true });
      }, urls);
      // 設定変更前に初回読み込みを終え、復元前の配置を確定させる。
      await expect(async () => {
        const tabs = await worker.evaluate(() => chrome.tabs.query({}));
        expect(
          tabs.filter(tab => urls.includes(tab.url ?? "") && tab.status === "complete"),
        ).toHaveLength(urls.length);
      }).toPass();
      await setExtensionSettings(context, {
        ...DEFAULT_SETTINGS,
        newTab: {
          ...DEFAULT_SETTINGS.newTab,
          position: activation ? "default" : position,
          urlRules: activation
            ? [
                {
                  url: "#restore-",
                  position: behavior,
                  active: behavior === "first" ? "foreground" : "background",
                },
              ]
            : [],
        },
        loadingPage: { urlRules: activation ? [{ url: "#restore-", position: scenario }] : [] },
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
        const events = await worker.evaluate(
          () =>
            (globalThis as typeof globalThis & { __restoreEvents: RestoreEvents }).__restoreEvents,
        );
        expect(events.startups).toBe(1);
        expect(events.installs).toBe(0);
        expect(events.created.length).toBeGreaterThan(0);
      }).toPass();
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
      const events = await worker.evaluate(
        () =>
          (globalThis as typeof globalThis & { __restoreEvents: RestoreEvents }).__restoreEvents,
      );
      expect(events.moves).toEqual([]);
      if (!activation) {
        const created = await worker.evaluate(async () => {
          const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
          const tab = await chrome.tabs.create({
            windowId: active.windowId,
            url: "about:blank",
            active: false,
          });
          return { id: tab.id!, sourceIndex: active.index };
        });
        await expect(async () => {
          expect(
            await worker.evaluate(async id => (await chrome.tabs.get(id)).index, created.id),
          ).toBe(created.sourceIndex + (position === "right" ? 1 : 0));
        }).toPass();
        return;
      }
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
      await new Promise<void>((resolve, reject) =>
        server.close(error => (error ? reject(error) : resolve())),
      );
      fs.rmSync(profile, { recursive: true, force: true });
    }
  });
}
