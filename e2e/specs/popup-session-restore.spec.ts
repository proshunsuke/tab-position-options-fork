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
import { DEFAULT_SETTINGS } from "@/src/types";

test("browser session restoration matches native behavior with popup conversion enabled", async ({
  channel,
  headless,
}) => {
  const root = fs.mkdtempSync(test.info().outputPath("popup-restore-"));
  const extensionPath = path.join(root, "test-extension");
  const server = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "text/html" });
    response.end("<title>Restored popup</title>");
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Missing server address");
  }
  const origin = `http://127.0.0.1:${address.port}`;
  const url = `${origin}/restored-popup`;
  let nativeRestoration: { type?: string; urls: string[] }[] = [];
  try {
    for (const enabled of [false, true]) {
      const profile = path.join(root, String(enabled));
      prepareSessionRestoreProfile(profile, extensionPath);
      const launch = () => launchSessionRestoreContext(profile, { channel, headless });
      let context = await launch();
      try {
        await installSessionRestoreExtension(context, extensionPath);
        let worker = await waitForServiceWorker(context);
        await setExtensionSettings(context, DEFAULT_SETTINGS);
        await worker.evaluate(async url => {
          const [tab] = await chrome.tabs.query({});
          await chrome.tabs.update(tab.id!, { url: `${url}?normal` });
          await chrome.windows.create({ type: "popup", url });
        }, url);
        await expect(async () => {
          const ready = await worker.evaluate(
            async origin =>
              (await chrome.tabs.query({})).filter(
                tab => tab.url?.startsWith(origin) && tab.status === "complete",
              ).length,
            origin,
          );
          expect(ready).toBe(2);
        }).toPass();
        await setExtensionSettings(context, {
          ...DEFAULT_SETTINGS,
          popup: { openAsNewTab: enabled, exceptions: [] },
        });
        await context.close();
        context = await launch();
        worker = await waitForServiceWorker(context);
        await expect(async () => {
          const events = await worker.evaluate(
            () =>
              (globalThis as typeof globalThis & { __restoreEvents: RestoreEvents })
                .__restoreEvents,
          );
          expect(events.startups).toBe(1);
          expect(events.installs).toBe(0);
          expect(events.created.length).toBeGreaterThan(0);
        }).toPass();
        await expect(async () => {
          expect(
            await worker.evaluate(
              async url => (await chrome.tabs.query({})).find(tab => tab.url === url)?.status,
              `${url}?normal`,
            ),
          ).toBe("complete");
        }).toPass({ timeout: 10000 });
        // Chromiumが復元するウィンドウ種別は環境に依存する。遅れて届くイベントも含め標準動作と比較する。
        await new Promise(resolve => setTimeout(resolve, 1500));
        const restored = await worker.evaluate(
          async origin =>
            (await chrome.windows.getAll({ populate: true }))
              .map(window => ({
                type: window.type,
                urls: (window.tabs ?? [])
                  .map(tab => tab.url ?? "")
                  .filter(url => url.startsWith(origin)),
              }))
              .filter(window => window.urls.length > 0)
              .sort((a, b) => (a.type ?? "").localeCompare(b.type ?? "")),
          origin,
        );
        if (!enabled) {
          nativeRestoration = restored;
          continue;
        }
        expect(restored).toEqual(nativeRestoration);
        const normalId = await worker.evaluate(
          async () => (await chrome.windows.getAll()).find(window => window.type === "normal")!.id!,
        );
        await worker.evaluate(id => chrome.windows.update(id, { focused: true }), normalId);
        await expect(async () => {
          const state = await worker.evaluate(
            async () =>
              (await chrome.storage.session.get("popupState")).popupState as {
                lastNormalWindowId: number;
              },
          );
          expect(state.lastNormalWindowId).toBe(normalId);
        }).toPass();
        await worker.evaluate(url => chrome.windows.create({ type: "popup", url }), `${url}?new`);
        await expect(async () => {
          expect(
            await worker.evaluate(
              async url => (await chrome.tabs.query({})).find(tab => tab.url === url)?.windowId,
              `${url}?new`,
            ),
          ).toBe(normalId);
        }).toPass();
      } finally {
        await context.close();
      }
    }
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve())),
    );
    fs.rmSync(root, { recursive: true, force: true });
  }
});
