import { expect, test } from "@/e2e/fixtures";
import {
  clearExtensionStorage,
  createWindowWithTabs,
  setExtensionSettings,
  simulateServiceWorkerRestart,
} from "@/e2e/utils/helpers";
import { DEFAULT_SETTINGS, type NewTabUrlRule, type Settings, type TabPosition } from "@/src/types";

const cases: {
  name: string;
  position: TabPosition;
  index: number;
  expected: number;
  active?: "foreground" | "background";
  activation?: "first" | "last";
}[] = [
  { name: "first", position: "first", index: 4, expected: 0 },
  { name: "last from middle", position: "last", index: 1, expected: 4 },
  { name: "right", position: "right", index: 4, expected: 3 },
  { name: "right from left", position: "right", index: 0, expected: 3 },
  { name: "left", position: "left", index: 4, expected: 2 },
  { name: "left from left", position: "left", index: 0, expected: 2 },
  { name: "default overrides global first", position: "default", index: 1, expected: 1 },
  {
    name: "background overrides global foreground",
    position: "last",
    index: 1,
    expected: 4,
    active: "background",
  },
  { name: "activation wins", position: "first", index: 1, expected: 4, activation: "last" },
  {
    name: "background keeps rule with activation enabled",
    position: "last",
    index: 1,
    expected: 4,
    active: "background",
    activation: "first",
  },
];

for (const scenario of cases) {
  test(`URL rules: ${scenario.name}`, async ({ context, serviceWorker }) => {
    await clearExtensionStorage(serviceWorker);
    const { windowId } = await createWindowWithTabs(serviceWorker, 4);
    const sourceId = await serviceWorker.evaluate(async windowId => {
      const tabs = await chrome.tabs.query({ windowId });
      await chrome.tabs.update(tabs[2].id!, { active: true });
      return tabs[2].id!;
    }, windowId);
    const active = scenario.active ?? "foreground";
    await setExtensionSettings(context, {
      ...DEFAULT_SETTINGS,
      newTab: {
        position: "first",
        openInBackground: active === "foreground",
        urlRules: [{ url: "rules.test", position: scenario.position, active }],
      },
      tabOnActivate: { behavior: scenario.activation ?? "default" },
    });
    await simulateServiceWorkerRestart(serviceWorker);
    await context.route("https://rules.test/**", route =>
      route.fulfill({ body: "<title>Rule target</title>" }),
    );
    const created = await serviceWorker.evaluate(
      ({ windowId, index, active }) =>
        chrome.tabs.create({
          windowId,
          index,
          active: active === "background",
          url: "https://rules.test/target",
        }),
      { windowId, index: scenario.index, active },
    );
    await expect(async () => {
      const tab = await serviceWorker.evaluate(id => chrome.tabs.get(id), created.id!);
      expect(tab.index).toBe(scenario.expected);
      expect(tab.active).toBe(active === "foreground");
      if (active === "background") {
        expect((await serviceWorker.evaluate(id => chrome.tabs.get(id), sourceId)).active).toBe(
          true,
        );
      }
    }).toPass();
  });
}

for (const scenario of ["first-match", "no-match", "opener-not-target"] as const) {
  test(`URL matching: ${scenario}`, async ({ context, serviceWorker }) => {
    await clearExtensionStorage(serviceWorker);
    const { windowId } = await createWindowWithTabs(serviceWorker, 4);
    const rules: NewTabUrlRule[] =
      scenario === "first-match"
        ? [
            { url: "about:", position: "first", active: "foreground" },
            { url: "^about:blank#target$", position: "last", active: "foreground" },
          ]
        : [
            {
              url: "^https://source.test",
              position: "last",
              active: "foreground",
            },
          ];
    await setExtensionSettings(context, {
      ...DEFAULT_SETTINGS,
      newTab: { position: "first", openInBackground: false, urlRules: rules },
    });
    await context.route("https://**/*", route => route.fulfill({ body: "Test" }));
    const tab = await serviceWorker.evaluate(
      async ({ windowId, scenario }) => {
        const source = (await chrome.tabs.query({ windowId })).find(tab => tab.active)!;
        if (scenario === "opener-not-target") {
          await chrome.tabs.update(source.id!, { url: "https://source.test/" });
        }
        return chrome.tabs.create({
          windowId,
          index: 2,
          openerTabId: source.id,
          active: true,
          url: "about:blank#target",
        });
      },
      { windowId, scenario },
    );
    await expect(async () => {
      expect((await serviceWorker.evaluate(id => chrome.tabs.get(id), tab.id!)).index).toBe(0);
    }).toPass();
  });
}

test("URL rules can be added, validated, saved, reloaded, and removed", async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  await clearExtensionStorage(serviceWorker);
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  const savedBeforeEdit = await serviceWorker.evaluate(() => chrome.storage.local.get("settings"));
  await page.getByRole("button", { name: "Add rule", exact: true }).click();
  await page.getByLabel("URL pattern 1", { exact: true }).fill("[");
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Enter a valid URL pattern for each rule.");
  await expect(page.getByRole("status")).toBeVisible();
  await expect(page.getByLabel("URL pattern 1", { exact: true })).toBeFocused();
  expect(await serviceWorker.evaluate(() => chrome.storage.local.get("settings"))).toEqual(
    savedBeforeEdit,
  );
  await page.getByLabel("URL pattern 1", { exact: true }).fill("example.com");
  await page.getByLabel("Position 1", { exact: true }).selectOption("right");
  await page.getByLabel("Activation 1", { exact: true }).selectOption("background");
  await page.getByRole("button", { name: "Add rule", exact: true }).click();
  await page.getByLabel("URL pattern 2", { exact: true }).fill("^https://");
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  await expect(async () => {
    const stored = await serviceWorker.evaluate(
      async () => (await chrome.storage.local.get<{ settings: Settings }>("settings")).settings,
    );
    expect(stored.newTab.urlRules).toEqual([
      { url: "example.com", position: "right", active: "background" },
      { url: "^https://", position: "default", active: "foreground" },
    ]);
  }).toPass();
  await page.reload();
  await expect(page.getByLabel("URL pattern 1", { exact: true })).toHaveValue("example.com");
  await expect(page.getByLabel("Position 1", { exact: true })).toHaveValue("right");
  await expect(page.getByLabel("Activation 1", { exact: true })).toHaveValue("background");
  await page.getByRole("button", { name: "Remove rule 1", exact: true }).click();
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  await expect(async () => {
    const stored = await serviceWorker.evaluate(
      async () => (await chrome.storage.local.get<{ settings: Settings }>("settings")).settings,
    );
    expect(stored.newTab.urlRules).toEqual([
      { url: "^https://", position: "default", active: "foreground" },
    ]);
  }).toPass();
});

for (const restore of [false, true]) {
  test(`URL rule dispatch is immediate and restoration does not move or activate: restore=${restore}`, async ({
    context,
    serviceWorker,
  }) => {
    await clearExtensionStorage(serviceWorker);
    const { windowId } = await createWindowWithTabs(serviceWorker, 4);
    await setExtensionSettings(context, {
      ...DEFAULT_SETTINGS,
      newTab: {
        ...DEFAULT_SETTINGS.newTab,
        urlRules: [{ url: "rules.test", position: "last", active: "foreground" }],
      },
    });
    const result = await serviceWorker.evaluate(
      async ({ windowId, restore }) => {
        const { handleNewTab } = globalThis.__testExports!.tabHandlers;
        const detector = globalThis.__testExports!.sessionRestore;
        const tabs = await chrome.tabs.query({ windowId });
        const target = tabs[1];
        const originalMove = chrome.tabs.move;
        const originalUpdate = chrome.tabs.update;
        const originalQuery = chrome.tabs.query;
        const calls: string[] = [];
        chrome.tabs.move = ((id: number, _properties: chrome.tabs.MoveProperties) => {
          calls.push("move");
          return Promise.resolve({ ...target, id });
        }) as typeof chrome.tabs.move;
        // 未完了のupdateを待たずmoveを発行することを確認する。
        chrome.tabs.update = (() => {
          calls.push("update");
          return new Promise(() => {});
        }) as typeof chrome.tabs.update;
        chrome.tabs.query = (() => {
          calls.push("query");
          return Promise.resolve(tabs);
        }) as typeof chrome.tabs.query;
        try {
          if (restore) {
            detector.resetSessionRestoreState();
            detector.markSessionRestoreTabs(tabs);
          }
          const completion = handleNewTab({
            ...target,
            active: false,
            url: "",
            pendingUrl: "https://rules.test/target",
          });
          const immediate = [...calls];
          await completion;
          await Promise.resolve();
          await Promise.resolve();
          return immediate;
        } finally {
          detector.resetSessionRestoreState();
          chrome.tabs.move = originalMove;
          chrome.tabs.update = originalUpdate;
          chrome.tabs.query = originalQuery;
        }
      },
      { windowId, restore },
    );
    expect(result).toEqual(restore ? ["query"] : ["update", "move"]);
  });
}

test("URL first leaves pinned tabs ahead of the new tab", async ({ context, serviceWorker }) => {
  await clearExtensionStorage(serviceWorker);
  const { windowId } = await createWindowWithTabs(serviceWorker, 4);
  await serviceWorker.evaluate(async windowId => {
    const tabs = await chrome.tabs.query({ windowId });
    await chrome.tabs.update(tabs[0].id!, { pinned: true });
  }, windowId);
  await setExtensionSettings(context, {
    ...DEFAULT_SETTINGS,
    newTab: {
      ...DEFAULT_SETTINGS.newTab,
      urlRules: [{ url: "target", position: "first", active: "foreground" }],
    },
  });
  const created = await serviceWorker.evaluate(
    windowId => chrome.tabs.create({ windowId, url: "about:blank#target", active: true }),
    windowId,
  );
  await expect(async () => {
    expect((await serviceWorker.evaluate(id => chrome.tabs.get(id), created.id!)).index).toBe(1);
  }).toPass();
});

test("changed URL rules apply immediately and relative positions use the current tab", async ({
  context,
  serviceWorker,
}) => {
  await clearExtensionStorage(serviceWorker);
  const { windowId } = await createWindowWithTabs(serviceWorker, 4);
  const tabs = await serviceWorker.evaluate(windowId => chrome.tabs.query({ windowId }), windowId);
  for (const position of ["right", "last", "default"] as const) {
    await serviceWorker.evaluate(id => chrome.tabs.update(id, { active: true }), tabs[2].id!);
    await setExtensionSettings(context, {
      ...DEFAULT_SETTINGS,
      newTab: {
        position: "first",
        openInBackground: false,
        urlRules: position === "default" ? [] : [{ url: "target", position, active: "foreground" }],
      },
    });
    const created = await serviceWorker.evaluate(
      ({ windowId, openerTabId }) =>
        chrome.tabs.create({ windowId, openerTabId, url: "about:blank#target", active: true }),
      { windowId, openerTabId: tabs[0].id! },
    );
    await expect(async () => {
      expect((await serviceWorker.evaluate(id => chrome.tabs.get(id), created.id!)).index).toBe(
        position === "right" ? 3 : position === "last" ? 4 : 0,
      );
    }).toPass();
    await serviceWorker.evaluate(id => chrome.tabs.remove(id), created.id!);
  }
});
