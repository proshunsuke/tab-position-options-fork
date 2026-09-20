import { createServer } from "node:http";
import { expect, test } from "@/e2e/fixtures";
import {
  activatePage,
  setExtensionSettings,
  simulateServiceWorkerRestart,
} from "@/e2e/utils/helpers";
import { DEFAULT_SETTINGS, type Settings } from "@/src/types";

const server = createServer((_request, response) => {
  response.writeHead(200, { "content-type": "text/html" });
  response.end(`<title>Popup test</title><button id="open">Open popup</button><script>
    document.querySelector('button').onclick = () => {
      const args = new URL(location.href).searchParams;
      window.child = window.open(args.get('blank') ? 'about:blank' : args.get('target'), '_blank', 'popup,width=400,height=300');
    };
    </script>`);
});
let origin = "";
test.beforeAll(async () => {
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Missing server address");
  }
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve())),
  );
});

for (const mode of ["enabled", "disabled", "exception", "restart"] as const) {
  test(`real window.open: ${mode}`, async ({ context, serviceWorker }) => {
    const page = await context.newPage();
    const target = `${origin}/target-${mode}`;
    await page.goto(`${origin}/source?target=${encodeURIComponent(target)}`);
    await activatePage(serviceWorker, page);
    const sourceWindowId = await serviceWorker.evaluate(
      async url => (await chrome.tabs.query({})).find(tab => tab.url === url)!.windowId,
      page.url(),
    );
    await setExtensionSettings(context, {
      ...DEFAULT_SETTINGS,
      newTab: { position: "first", openInBackground: true },
      tabOnActivate: { behavior: "first" },
      popup: {
        openAsNewTab: mode !== "disabled",
        exceptions: mode === "exception" ? [{ url: "target-exception" }] : [],
      },
    });
    if (mode === "restart") {
      await simulateServiceWorkerRestart(serviceWorker);
    }
    await page.getByRole("button", { name: "Open popup" }).click();
    const converted = mode === "enabled" || mode === "restart";
    await expect(async () => {
      const state = await serviceWorker.evaluate(async url => {
        const windows = await chrome.windows.getAll({ populate: true });
        const window = windows.find(window => window.tabs?.some(tab => tab.url === url));
        const tab = window?.tabs?.find(tab => tab.url === url);
        return {
          type: window?.type,
          windowId: window?.id,
          index: tab?.index,
          length: window?.tabs?.length,
          status: tab?.status,
        };
      }, target);
      expect(state.type).toBe(converted ? "normal" : "popup");
      expect(state.status).toBe("complete");
      if (converted) {
        expect(state.windowId).toBe(sourceWindowId);
        expect(state.index).toBe(state.length! - 1);
      }
    }).toPass();
    // The moved browsing context must remain the same window.open result.
    expect(
      await page.evaluate(() => {
        const child = (window as Window & { child?: Window }).child!;
        return { closed: child.closed, opener: child.opener === window };
      }),
    ).toEqual({ closed: false, opener: true });
  });
}

for (const matches of [false, true]) {
  test(`delayed navigation from about:blank respects exceptions: ${matches}`, async ({
    context,
    serviceWorker,
  }) => {
    const page = await context.newPage();
    await page.goto(`${origin}/source?blank=1`);
    await activatePage(serviceWorker, page);
    await setExtensionSettings(context, {
      ...DEFAULT_SETTINGS,
      popup: { openAsNewTab: true, exceptions: [{ url: "keep-popup" }] },
    });
    await page.getByRole("button", { name: "Open popup" }).click();
    await expect(async () => {
      expect(
        await serviceWorker.evaluate(
          async () =>
            (await chrome.windows.getAll()).filter(window => window.type === "popup").length,
        ),
      ).toBe(1);
    }).toPass();
    // Pending eligibility and the destination survive a simulated Worker restart.
    await expect(async () => {
      const state = await serviceWorker.evaluate(
        async () =>
          (await chrome.storage.session.get("popupState")).popupState as {
            pending: Record<string, unknown>;
          },
      );
      expect(Object.keys(state.pending)).toHaveLength(1);
    }).toPass();
    await simulateServiceWorkerRestart(serviceWorker);
    const target = `${origin}/${matches ? "keep-popup" : "convert-popup"}`;
    await page.evaluate(url => {
      (window as Window & { child?: Window }).child!.location.href = url;
    }, target);
    await expect(async () => {
      const type = await serviceWorker.evaluate(async url => {
        const windows = await chrome.windows.getAll({ populate: true });
        return windows.find(window => window.tabs?.some(tab => tab.url === url))?.type;
      }, target);
      expect(type).toBe(matches ? "popup" : "normal");
    }).toPass();
  });
}

test("Loading Page applies after conversion and subsequent activation applies normally", async ({
  context,
  serviceWorker,
}) => {
  const page = await context.newPage();
  const target = `${origin}/loading-popup`;
  await page.goto(`${origin}/source?target=${encodeURIComponent(target)}`);
  await activatePage(serviceWorker, page);
  await setExtensionSettings(context, {
    ...DEFAULT_SETTINGS,
    popup: { openAsNewTab: true, exceptions: [] },
    loadingPage: { urlRules: [{ url: "loading-popup", position: "first" }] },
    tabOnActivate: { behavior: "last" },
  });
  await page.getByRole("button", { name: "Open popup" }).click();
  await expect(async () => {
    const tab = await serviceWorker.evaluate(
      async url => (await chrome.tabs.query({})).find(tab => tab.url === url),
      target,
    );
    expect(tab?.status).toBe("complete");
    expect(tab?.index).toBe(0);
    expect(
      await serviceWorker.evaluate(async id => (await chrome.windows.get(id)).type, tab!.windowId),
    ).toBe("normal");
  }).toPass();
  await serviceWorker.evaluate(async url => {
    const tab = (await chrome.tabs.query({})).find(tab => tab.url === url)!;
    await chrome.tabs.update(tab.id!, { active: true });
  }, target);
  await expect(async () => {
    const tabs = await serviceWorker.evaluate(() => chrome.tabs.query({}));
    expect(tabs.find(tab => tab.url === target)?.index).toBe(tabs.length - 1);
  }).toPass();
});

test("popup settings and validated exceptions persist across options reloads", async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.getByLabel("Open pop-up window as new tab", { exact: true }).check();
  await page.getByRole("button", { name: "Add pop-up exception" }).click();
  await page.getByLabel("Pop-up exception 1", { exact: true }).fill("[");
  await page.getByRole("button", { name: "Save Settings" }).click();
  await expect(page.getByRole("status")).toHaveText("Enter a valid URL pattern for each rule.");
  await page.getByLabel("Pop-up exception 1", { exact: true }).fill("  login.test  ");
  await page.getByRole("button", { name: "Save Settings" }).click();
  await expect(async () => {
    const settings = await serviceWorker.evaluate(
      async () => (await chrome.storage.local.get<{ settings: Settings }>("settings")).settings,
    );
    expect(settings.popup).toEqual({ openAsNewTab: true, exceptions: [{ url: "login.test" }] });
  }).toPass();
  await page.reload();
  await expect(page.getByLabel("Open pop-up window as new tab", { exact: true })).toBeChecked();
  await expect(page.getByLabel("Pop-up exception 1", { exact: true })).toHaveValue("login.test");
  await page.getByRole("button", { name: "Remove pop-up exception 1", exact: true }).click();
  await page.getByLabel("Open pop-up window as new tab", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Save Settings" }).click();
  await expect(async () => {
    const settings = await serviceWorker.evaluate(
      async () => (await chrome.storage.local.get<{ settings: Settings }>("settings")).settings,
    );
    expect(settings.popup).toEqual({ openAsNewTab: false, exceptions: [] });
  }).toPass();
});
