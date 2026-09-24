import { createServer } from "node:http";
import { expect, test } from "@/e2e/fixtures";
import {
  clearExtensionStorage,
  createWindowWithTabs,
  setExtensionSettings,
  simulateServiceWorkerRestart,
} from "@/e2e/utils/helpers";
import { DEFAULT_SETTINGS, type LoadingPageUrlRule, type Settings } from "@/src/types";

const navigationServer = createServer((request, response) => {
  if (request.url === "/redirect") {
    response.writeHead(302, { location: "/destination" });
  } else {
    response.writeHead(200, { "content-type": "text/html" });
  }
  response.end("<title>Loaded</title>");
});
let navigationOrigin = "";
test.beforeAll(async () => {
  await new Promise<void>(resolve => navigationServer.listen(0, "127.0.0.1", resolve));
  const address = navigationServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Missing server address");
  }
  navigationOrigin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    navigationServer.close(error => (error ? reject(error) : resolve())),
  );
});

for (const position of ["first", "middle", "last"] as const) {
  test(`Loading Page moves an existing tab to ${position} in its own window after restart`, async ({
    context,
    serviceWorker,
  }) => {
    await clearExtensionStorage(serviceWorker);
    const { windowId } = await createWindowWithTabs(serviceWorker, 5);
    const tabs = await serviceWorker.evaluate(id => chrome.tabs.query({ windowId: id }), windowId);
    await createWindowWithTabs(serviceWorker, 2);
    await setExtensionSettings(context, {
      ...DEFAULT_SETTINGS,
      loadingPage: { urlRules: [{ url: "loading.test", position }] },
    });
    await simulateServiceWorkerRestart(serviceWorker);
    await serviceWorker.evaluate(({ id, url }) => chrome.tabs.update(id, { url }), {
      id: tabs[1].id!,
      url: `${navigationOrigin}/loading.test/page`,
    });
    await expect(async () => {
      const tab = await serviceWorker.evaluate(id => chrome.tabs.get(id), tabs[1].id!);
      expect(tab.index).toBe(position === "first" ? 0 : position === "middle" ? 2 : 4);
      expect(tab.windowId).toBe(windowId);
      expect(tab.active).toBe(false);
    }).toPass();
  });
}

for (const scenario of [
  "first-match",
  "destination",
  "redirect-source",
  "no-match",
  "invalid",
] as const) {
  test(`Loading Page URL matching: ${scenario}`, async ({ context, serviceWorker }) => {
    await clearExtensionStorage(serviceWorker);
    const { windowId } = await createWindowWithTabs(serviceWorker, 4);
    const tabs = await serviceWorker.evaluate(id => chrome.tabs.query({ windowId: id }), windowId);

    const rules: LoadingPageUrlRule[] =
      scenario === "first-match"
        ? [
            { url: "127.0.0.1", position: "first" },
            { url: "destination", position: "last" },
          ]
        : scenario === "destination"
          ? [
              { url: "redirect", position: "first" },
              { url: "destination", position: "last" },
            ]
          : [
              {
                url:
                  scenario === "invalid"
                    ? "["
                    : scenario === "no-match"
                      ? "unmatched.test"
                      : "redirect",
                position: "last",
              },
            ];
    await setExtensionSettings(context, { ...DEFAULT_SETTINGS, loadingPage: { urlRules: rules } });
    await serviceWorker.evaluate(({ id, url }) => chrome.tabs.update(id, { url }), {
      id: tabs[1].id!,
      url: `${navigationOrigin}/redirect`,
    });
    await expect(async () => {
      const tab = await serviceWorker.evaluate(id => chrome.tabs.get(id), tabs[1].id!);
      expect(tab.url).toBe(`${navigationOrigin}/destination`);
      expect(tab.status).toBe("complete");
      expect(tab.index).toBe(
        scenario === "first-match" ? 0 : scenario === "no-match" || scenario === "invalid" ? 1 : 3,
      );
    }).toPass();
    await expect(async () => {
      const pending = await serviceWorker.evaluate(
        async () =>
          (
            await chrome.storage.session.get<{
              loadingPageState: { pending: Record<string, unknown> };
            }>("loadingPageState")
          ).loadingPageState.pending,
      );
      expect(pending).toEqual({});
    }).toPass();
  });
}

test("Loading Page wins initial placement; subsequent activation wins later", async ({
  context,
  serviceWorker,
}) => {
  await clearExtensionStorage(serviceWorker);
  const { windowId } = await createWindowWithTabs(serviceWorker, 4);
  await setExtensionSettings(context, {
    ...DEFAULT_SETTINGS,
    newTab: { position: "last", openInBackground: false },
    tabOnActivate: { behavior: "last" },
    loadingPage: { urlRules: [{ url: "loading.test", position: "first" }] },
  });
  const target = await serviceWorker.evaluate(
    ({ windowId, url }) => chrome.tabs.create({ windowId, active: true, url }),
    { windowId, url: `${navigationOrigin}/loading.test/page` },
  );
  await expect(async () => {
    const tab = await serviceWorker.evaluate(id => chrome.tabs.get(id), target.id!);
    expect(tab.status).toBe("complete");
    expect(tab.index).toBe(0);
  }).toPass();
  await serviceWorker.evaluate(
    async ({ windowId, id }) => {
      const other = (await chrome.tabs.query({ windowId })).find(tab => tab.id !== id)!;
      await chrome.tabs.update(other.id!, { active: true });
      await chrome.tabs.update(id, { active: true });
    },
    { windowId, id: target.id! },
  );
  await expect(async () => {
    expect((await serviceWorker.evaluate(id => chrome.tabs.get(id), target.id!)).index).toBe(4);
  }).toPass();
});

test("Loading Page preserves pinned tabs and clamps the middle after pinned tabs", async ({
  context,
  serviceWorker,
}) => {
  await clearExtensionStorage(serviceWorker);
  const { windowId } = await createWindowWithTabs(serviceWorker, 5);
  const tabs = await serviceWorker.evaluate(async windowId => {
    const tabs = await chrome.tabs.query({ windowId });
    for (const tab of tabs.slice(0, 3)) {
      await chrome.tabs.update(tab.id!, { pinned: true });
    }
    return tabs;
  }, windowId);
  await setExtensionSettings(context, {
    ...DEFAULT_SETTINGS,
    loadingPage: { urlRules: [{ url: "loading.test", position: "middle" }] },
  });
  for (const id of [tabs[1].id!, tabs[4].id!]) {
    await serviceWorker.evaluate(({ id, url }) => chrome.tabs.update(id, { url }), {
      id,
      url: `${navigationOrigin}/loading.test/page`,
    });
    await expect(async () => {
      const tab = await serviceWorker.evaluate(id => chrome.tabs.get(id), id);
      expect(tab.status).toBe("complete");
      expect(tab.index).toBe(id === tabs[1].id ? 1 : 3);
    }).toPass();
  }
});

test("Loading Page rules can be validated, saved, reloaded and removed", async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  await clearExtensionStorage(serviceWorker);
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.getByRole("button", { name: "Loading Page", exact: true }).click();
  await page.getByRole("button", { name: "Add loading rule", exact: true }).click();
  await page.getByLabel("Loading URL pattern 1", { exact: true }).fill("[");
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Enter a valid URL pattern.");
  await page.getByLabel("Loading URL pattern 1", { exact: true }).fill(" loading.test ");
  await page.getByLabel("Loading position 1", { exact: true }).selectOption("middle");
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  await expect(async () => {
    const settings = await serviceWorker.evaluate(
      async () => (await chrome.storage.local.get<{ settings: Settings }>("settings")).settings,
    );
    expect(settings.loadingPage.urlRules).toEqual([{ url: "loading.test", position: "middle" }]);
  }).toPass();
  await page.reload();
  await page.getByRole("button", { name: "Loading Page", exact: true }).click();
  await expect(page.getByLabel("Loading position 1", { exact: true })).toHaveValue("middle");
  await expect(page.getByLabel("Loading URL pattern 1", { exact: true })).toHaveValue(
    "loading.test",
  );
  await page.getByRole("button", { name: "Remove loading rule 1" }).click();
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  await expect(async () => {
    expect(
      await serviceWorker.evaluate(
        async () =>
          (await chrome.storage.local.get<{ settings: Settings }>("settings")).settings.loadingPage
            .urlRules,
      ),
    ).toEqual([]);
  }).toPass();
});

for (const scenario of [
  "immediate",
  "restored",
  "restored-reload",
  "restored-new-navigation",
  "subframe",
  "restart-redirect",
] as const) {
  test(`Loading Page event dispatch: ${scenario}`, async ({ context, serviceWorker }) => {
    await clearExtensionStorage(serviceWorker);
    const { windowId } = await createWindowWithTabs(serviceWorker, 4);
    await setExtensionSettings(context, {
      ...DEFAULT_SETTINGS,
      loadingPage: { urlRules: [{ url: "loading.test", position: "last" }] },
    });
    const result = await serviceWorker.evaluate(
      async ({ windowId, scenario }) => {
        const exports = globalThis.__testExports!;
        const handlers = exports.tabHandlers;
        const target = (await chrome.tabs.query({ windowId }))[1];
        const before: chrome.webNavigation.WebNavigationBaseCallbackDetails = {
          documentLifecycle: "active",
          frameType: "outermost_frame",
          parentFrameId: -1,
          tabId: target.id!,
          frameId: 0,
          processId: -1,
          timeStamp: 1,
          url: "https://loading.test/start",
        };
        if (scenario === "restored-reload" || scenario === "restored-new-navigation") {
          await chrome.storage.session.set({
            loadingPageState: { pending: {}, restoredTabs: { [target.id!]: true } },
          });
          exports.states.resetLoadingPageState();
          exports.states.resetInitializationState();
        }
        if (scenario === "restored") {
          await handlers.handleLoadingPageStartup();
        }
        await handlers.handleBeforeNavigate(before);
        // 保存完了を確認してからWorker停止を再現する。
        await chrome.storage.session.get("loadingPageState");
        if (scenario === "restart-redirect") {
          exports.states.resetLoadingPageState();
          exports.states.resetInitializationState();
        }
        exports.sessionRestore.resetSessionRestoreState();
        const originalMove = chrome.tabs.move;
        const originalQuery = chrome.tabs.query;
        const calls: string[] = [];
        chrome.tabs.move = ((_id: number, _properties: chrome.tabs.MoveProperties) => {
          calls.push("move");
          return new Promise<chrome.tabs.Tab>(() => {});
        }) as typeof chrome.tabs.move;
        chrome.tabs.query = ((query: chrome.tabs.QueryInfo) => {
          calls.push("query");
          return originalQuery(query);
        }) as typeof chrome.tabs.query;
        try {
          const completion = handlers.handleNavigationCommitted({
            ...before,
            documentId: "test-navigation",
            timeStamp: 2,
            frameId: scenario === "subframe" ? 1 : 0,
            url: scenario === "restart-redirect" ? "https://elsewhere.test/" : before.url,
            transitionType:
              scenario === "restored-reload" || scenario === "restored" ? "reload" : "link",
            transitionQualifiers: scenario === "restart-redirect" ? ["server_redirect"] : [],
          });
          const immediate = [...calls];
          await completion;
          return { immediate, calls };
        } finally {
          chrome.tabs.move = originalMove;
          chrome.tabs.query = originalQuery;
        }
      },
      { windowId, scenario },
    );
    if (scenario === "restart-redirect") {
      expect(result.calls.at(-1)).toBe("move");
    } else {
      expect(result.immediate).toEqual(
        scenario === "immediate" || scenario === "restored-new-navigation" ? ["move"] : [],
      );
      expect(result.calls).toEqual(result.immediate);
    }
  });
}

test("late background placement cannot overwrite a committed Loading Page rule", async ({
  context,
  serviceWorker,
}) => {
  await clearExtensionStorage(serviceWorker);
  const { windowId } = await createWindowWithTabs(serviceWorker, 4);
  await setExtensionSettings(context, {
    ...DEFAULT_SETTINGS,
    newTab: { position: "first", openInBackground: true },
    loadingPage: { urlRules: [{ url: "loading.test", position: "last" }] },
  });
  const moves = await serviceWorker.evaluate(async windowId => {
    const handlers = globalThis.__testExports!.tabHandlers;
    const tabs = await chrome.tabs.query({ windowId });
    const target = tabs[1];
    const originalMove = chrome.tabs.move;
    const originalUpdate = chrome.tabs.update;
    let finishBackground = () => {};
    const background = new Promise<chrome.tabs.Tab>(resolve => {
      finishBackground = () => resolve(tabs[0]);
    });
    const moves: number[] = [];
    chrome.tabs.update = (() => background) as typeof chrome.tabs.update;
    chrome.tabs.move = ((_id: number, properties: chrome.tabs.MoveProperties) => {
      moves.push(properties.index);
      return new Promise<chrome.tabs.Tab>(() => {});
    }) as typeof chrome.tabs.move;
    try {
      await handlers.handleNewTab({ ...target, active: true, openerTabId: tabs[0].id });
      await handlers.handleNavigationCommitted({
        tabId: target.id!,
        frameId: 0,
        frameType: "outermost_frame",
        parentFrameId: -1,
        processId: -1,
        documentId: "test",
        documentLifecycle: "active",
        timeStamp: Date.now(),
        url: "https://loading.test/",
        transitionType: "link",
        transitionQualifiers: [],
      });
      finishBackground();
      await background;
      await Promise.resolve();
      await Promise.resolve();
      return moves;
    } finally {
      chrome.tabs.move = originalMove;
      chrome.tabs.update = originalUpdate;
    }
  }, windowId);
  expect(moves).toEqual([3]);
});

test("navigation errors and tab closure remove pending URL data", async ({
  context,
  serviceWorker,
}) => {
  await clearExtensionStorage(serviceWorker);
  const { windowId } = await createWindowWithTabs(serviceWorker, 4);
  await setExtensionSettings(context, {
    ...DEFAULT_SETTINGS,
    loadingPage: { urlRules: [{ url: "loading.test", position: "last" }] },
  });
  const tabId = await serviceWorker.evaluate(async windowId => {
    const tab = (await chrome.tabs.query({ windowId }))[1];
    const before = {
      tabId: tab.id!,
      frameId: 0,
      frameType: "outermost_frame" as const,
      parentFrameId: -1,
      processId: -1,
      documentLifecycle: "active" as const,
      timeStamp: 1,
      url: "https://loading.test/pending",
    };
    const handlers = globalThis.__testExports!.tabHandlers;
    await handlers.handleBeforeNavigate(before);
    await handlers.handleNavigationError({
      ...before,
      timeStamp: 2,
      error: "net::ERR_ABORTED",
      documentId: "test",
    });
    return tab.id!;
  }, windowId);
  const readPending = () =>
    serviceWorker.evaluate(
      async () =>
        (
          await chrome.storage.session.get<{
            loadingPageState: { pending: Record<string, unknown> };
          }>("loadingPageState")
        ).loadingPageState.pending,
    );
  await expect(async () => expect(await readPending()).toEqual({})).toPass();
  await serviceWorker.evaluate(async tabId => {
    await globalThis.__testExports!.tabHandlers.handleBeforeNavigate({
      tabId,
      frameId: 0,
      frameType: "outermost_frame",
      parentFrameId: -1,
      processId: -1,
      documentLifecycle: "active",
      timeStamp: 3,
      url: "https://loading.test/pending-again",
    });
    await chrome.tabs.remove(tabId);
  }, tabId);
  await expect(async () => expect(await readPending()).toEqual({})).toPass();
});
