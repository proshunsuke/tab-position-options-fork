import { expect, test } from "@/e2e/fixtures";
import {
  clearExtensionStorage,
  createWindowWithTabs,
  setExtensionSettings,
  simulateServiceWorkerRestart,
} from "@/e2e/utils/helpers";
import { DEFAULT_SETTINGS, type Settings } from "@/src/types";

for (const behavior of ["default", "first", "last"] as const) {
  test(`activation moves tabs according to ${behavior}`, async ({ context, serviceWorker }) => {
    await clearExtensionStorage(serviceWorker);
    const { windowId } = await createWindowWithTabs(serviceWorker, 4);
    const tabs = await serviceWorker.evaluate(
      windowId => chrome.tabs.query({ windowId }),
      windowId,
    );
    const targetId = tabs[2].id!;
    await setExtensionSettings(context, { ...DEFAULT_SETTINGS, tabOnActivate: { behavior } });
    await simulateServiceWorkerRestart(serviceWorker);
    await serviceWorker.evaluate(tabId => chrome.tabs.update(tabId, { active: true }), targetId);

    // defaultも遅延処理の実行後に位置が変わらないことを確認する。
    await serviceWorker.evaluate(() => new Promise(resolve => setTimeout(resolve, 600)));
    await expect(async () => {
      const tab = await serviceWorker.evaluate(tabId => chrome.tabs.get(tabId), targetId);
      expect(tab.active).toBe(true);
      expect(tab.index).toBe(behavior === "first" ? 0 : behavior === "last" ? 3 : 2);
    }).toPass();
  });
}

test("activation preserves pinned tabs and moves normal tabs after them", async ({
  context,
  serviceWorker,
}) => {
  await clearExtensionStorage(serviceWorker);
  const { windowId } = await createWindowWithTabs(serviceWorker, 4);
  const tabs = await serviceWorker.evaluate(windowId => chrome.tabs.query({ windowId }), windowId);
  const pinnedId = tabs[0].id!;
  const targetId = tabs[3].id!;
  await serviceWorker.evaluate(tabId => chrome.tabs.update(tabId, { pinned: true }), pinnedId);
  await setExtensionSettings(context, {
    ...DEFAULT_SETTINGS,
    tabOnActivate: { behavior: "first" },
  });
  await serviceWorker.evaluate(tabId => chrome.tabs.update(tabId, { active: true }), targetId);
  await expect(async () => {
    const tab = await serviceWorker.evaluate(tabId => chrome.tabs.get(tabId), targetId);
    expect(tab.index).toBe(1);
  }).toPass();

  await setExtensionSettings(context, { ...DEFAULT_SETTINGS, tabOnActivate: { behavior: "last" } });
  await serviceWorker.evaluate(tabId => chrome.tabs.update(tabId, { active: true }), pinnedId);
  await serviceWorker.evaluate(() => new Promise(resolve => setTimeout(resolve, 600)));
  const pinned = await serviceWorker.evaluate(tabId => chrome.tabs.get(tabId), pinnedId);
  expect(pinned.pinned).toBe(true);
  expect(pinned.index).toBe(0);
});

test("each active tab moves immediately during rapid switching", async ({
  context,
  serviceWorker,
}) => {
  await clearExtensionStorage(serviceWorker);
  const { windowId } = await createWindowWithTabs(serviceWorker, 4);
  const tabs = await serviceWorker.evaluate(windowId => chrome.tabs.query({ windowId }), windowId);
  const ids = tabs.map(tab => tab.id!);
  await setExtensionSettings(context, {
    ...DEFAULT_SETTINGS,
    tabOnActivate: { behavior: "first" },
  });
  await serviceWorker.evaluate(async ids => {
    await chrome.tabs.update(ids[2], { active: true });
    await chrome.tabs.update(ids[3], { active: true });
  }, ids);
  await serviceWorker.evaluate(() => new Promise(resolve => setTimeout(resolve, 600)));
  const order = await serviceWorker.evaluate(
    async windowId => (await chrome.tabs.query({ windowId })).map(tab => tab.id),
    windowId,
  );
  expect(order).toEqual([ids[3], ids[2], ids[0], ids[1]]);
});

test("activation position takes precedence for foreground new tabs", async ({
  context,
  serviceWorker,
}) => {
  await clearExtensionStorage(serviceWorker);
  const { windowId } = await createWindowWithTabs(serviceWorker, 4);
  await setExtensionSettings(context, {
    ...DEFAULT_SETTINGS,
    newTab: { position: "first", openInBackground: false },
    tabOnActivate: { behavior: "last" },
  });
  const created = await serviceWorker.evaluate(
    windowId => chrome.tabs.create({ windowId, url: "about:blank", active: true }),
    windowId,
  );
  await expect(async () => {
    const tab = await serviceWorker.evaluate(tabId => chrome.tabs.get(tabId), created.id!);
    expect(tab.active).toBe(true);
    expect(tab.index).toBe(4);
  }).toPass();
  await serviceWorker.evaluate(() => new Promise(resolve => setTimeout(resolve, 600)));
  expect((await serviceWorker.evaluate(tabId => chrome.tabs.get(tabId), created.id!)).index).toBe(
    4,
  );
});

test("background new tabs are not moved by activation settings", async ({
  context,
  serviceWorker,
}) => {
  await clearExtensionStorage(serviceWorker);
  const { windowId } = await createWindowWithTabs(serviceWorker, 4);
  await setExtensionSettings(context, {
    ...DEFAULT_SETTINGS,
    newTab: { position: "first", openInBackground: true },
    tabOnActivate: { behavior: "last" },
  });
  const created = await serviceWorker.evaluate(
    windowId => chrome.tabs.create({ windowId, url: "about:blank", active: true }),
    windowId,
  );
  await serviceWorker.evaluate(() => new Promise(resolve => setTimeout(resolve, 600)));
  await expect(async () => {
    const tab = await serviceWorker.evaluate(tabId => chrome.tabs.get(tabId), created.id!);
    expect(tab.active).toBe(false);
    expect(tab.index).toBe(0);
  }).toPass();
});

test("closing a tab activates the configured neighbor before moving it", async ({
  context,
  serviceWorker,
}) => {
  await clearExtensionStorage(serviceWorker);
  const { windowId } = await createWindowWithTabs(serviceWorker, 4);
  const tabs = await serviceWorker.evaluate(windowId => chrome.tabs.query({ windowId }), windowId);
  const ids = tabs.map(tab => tab.id!);
  await serviceWorker.evaluate(tabId => chrome.tabs.update(tabId, { active: true }), ids[2]);
  await setExtensionSettings(context, {
    ...DEFAULT_SETTINGS,
    afterTabClosing: { activateTab: "left" },
    tabOnActivate: { behavior: "last" },
  });
  await serviceWorker.evaluate(tabId => chrome.tabs.remove(tabId), ids[2]);
  await expect(async () => {
    const tab = await serviceWorker.evaluate(tabId => chrome.tabs.get(tabId), ids[1]);
    expect(tab.active).toBe(true);
    expect(tab.index).toBe(2);
  }).toPass();
});

test("activation settings persist and reload in the options page", async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  await clearExtensionStorage(serviceWorker);
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  for (const behavior of ["first", "last", "default"]) {
    await page.getByRole("button", { name: "Tab on Activate", exact: true }).click();
    await page.locator(`input[name="tabOnActivate"][value="${behavior}"]`).check();
    await page.getByRole("button", { name: "Save Settings", exact: true }).click();
    await expect(async () => {
      const saved = await page.evaluate(
        async () => (await chrome.storage.local.get<{ settings: Settings }>("settings")).settings,
      );
      expect(saved.tabOnActivate.behavior).toBe(behavior);
      expect(saved.newTab).toEqual(DEFAULT_SETTINGS.newTab);
    }).toPass();
    await page.reload();
    await page.getByRole("button", { name: "Tab on Activate", exact: true }).click();
    await expect(page.locator(`input[name="tabOnActivate"][value="${behavior}"]`)).toBeChecked();
  }
});

for (const event of ["activation", "creation"] as const) {
  test(`${event} issues one final move synchronously before querying tabs`, async ({
    context,
    serviceWorker,
  }) => {
    await clearExtensionStorage(serviceWorker);
    const { windowId } = await createWindowWithTabs(serviceWorker, 4);
    await setExtensionSettings(context, {
      ...DEFAULT_SETTINGS,
      newTab: { position: "first", openInBackground: false },
      tabOnActivate: { behavior: "last" },
    });
    const result = await serviceWorker.evaluate(
      async ({ windowId, event }) => {
        const handlers = globalThis.__testExports!.tabHandlers;
        const tabs = await chrome.tabs.query({ windowId });
        const target = tabs[1];
        const originalMove = chrome.tabs.move;
        const originalQuery = chrome.tabs.query;
        const calls: string[] = [];
        const moves: number[] = [];
        // Chrome APIの完了時刻に依存せず、ハンドラーが戻るまでに操作を発行するかを検証する。
        chrome.tabs.move = ((tabId: number, properties: chrome.tabs.MoveProperties) => {
          calls.push("move");
          moves.push(properties.index);
          return Promise.resolve({ ...target, id: tabId, index: properties.index });
        }) as typeof chrome.tabs.move;
        chrome.tabs.query = (() => {
          calls.push("query");
          return Promise.resolve(tabs);
        }) as typeof chrome.tabs.query;
        try {
          const completion =
            event === "activation"
              ? handlers.handleTabActivated({ windowId, tabId: target.id! })
              : handlers.handleNewTab({ ...target, active: true });
          const immediateCalls = [...calls];
          await completion;
          // move後のfinallyによる状態再取得までテスト用APIを維持する。
          await Promise.resolve();
          await Promise.resolve();
          return { immediateCalls, moves };
        } finally {
          chrome.tabs.move = originalMove;
          chrome.tabs.query = originalQuery;
        }
      },
      { windowId, event },
    );
    expect(result.immediateCalls[0]).toBe("move");
    expect(result.moves).toEqual([3]);
  });
}

for (const order of ["activated-first", "removed-first"] as const) {
  test(`closing preserves the original left neighbor with ${order} and immediate movement`, async ({
    context,
    serviceWorker,
  }) => {
    await clearExtensionStorage(serviceWorker);
    const { windowId } = await createWindowWithTabs(serviceWorker, 4);
    const tabs = await serviceWorker.evaluate(
      windowId => chrome.tabs.query({ windowId }),
      windowId,
    );
    await serviceWorker.evaluate(tabId => chrome.tabs.update(tabId, { active: true }), tabs[2].id!);
    await setExtensionSettings(context, {
      ...DEFAULT_SETTINGS,
      afterTabClosing: { activateTab: "left" },
      tabOnActivate: { behavior: "first" },
    });
    await serviceWorker.evaluate(
      async ({ windowId, ids, order }) => {
        const { handleTabActivated, handleTabRemoved, onActivated, onRemoved } =
          globalThis.__testExports!.tabHandlers;
        onActivated.removeListener(handleTabActivated);
        onRemoved.removeListener(handleTabRemoved);
        try {
          if (order === "activated-first") {
            await chrome.tabs.update(ids[3], { active: true });
            await chrome.tabs.remove(ids[2]);
            // 実ブラウザの操作を先に完了させ、同じcloseに属するイベントを連続再生する。
            // 間に削除APIの完了待ちを挟むと、負荷次第で25msの遷移期限を超えてしまう。
            await handleTabActivated({ windowId, tabId: ids[3] });
            await handleTabRemoved(ids[2], { windowId, isWindowClosing: false });
          } else {
            await chrome.tabs.remove(ids[2]);
            await handleTabRemoved(ids[2], { windowId, isWindowClosing: false });
            await handleTabActivated({ windowId, tabId: ids[3] });
          }
        } finally {
          onActivated.addListener(handleTabActivated);
          onRemoved.addListener(handleTabRemoved);
        }
      },
      { windowId, ids: tabs.map(tab => tab.id!), order },
    );
    await expect(async () => {
      const left = await serviceWorker.evaluate(tabId => chrome.tabs.get(tabId), tabs[1].id!);
      expect(left.active).toBe(true);
      expect(left.index).toBe(0);
    }).toPass();
  });
}

for (const order of ["created-first", "activated-first"] as const) {
  for (const openInBackground of [false, true]) {
    test(`new tab has one final move with ${order}, background=${openInBackground}`, async ({
      context,
      serviceWorker,
    }) => {
      await clearExtensionStorage(serviceWorker);
      const { windowId } = await createWindowWithTabs(serviceWorker, 4);
      await setExtensionSettings(context, {
        ...DEFAULT_SETTINGS,
        newTab: { position: "first", openInBackground },
        tabOnActivate: { behavior: "last" },
      });
      const moves = await serviceWorker.evaluate(
        async ({ windowId, order, openInBackground }) => {
          const { handleNewTab, handleTabActivated, onCreated, onActivated } =
            globalThis.__testExports!.tabHandlers;
          onCreated.removeListener(handleNewTab);
          onActivated.removeListener(handleTabActivated);
          const originalMove = chrome.tabs.move;
          const moves: number[] = [];
          try {
            const tab = await chrome.tabs.create({
              windowId,
              index: 1,
              active: false,
              url: "about:blank",
            });
            chrome.tabs.move = ((tabId: number, properties: chrome.tabs.MoveProperties) => {
              if (tabId === tab.id) {
                moves.push(properties.index);
              }
              return originalMove(tabId, properties);
            }) as typeof chrome.tabs.move;
            const activeInfo = { windowId, tabId: tab.id! };
            // awaitを挟まず両イベントを届け、イベントの順序だけを変える。
            const completions =
              order === "created-first"
                ? [handleNewTab({ ...tab, active: true }), handleTabActivated(activeInfo)]
                : [handleTabActivated(activeInfo), handleNewTab({ ...tab, active: true })];
            await Promise.all(completions);
            // バックグラウンド化は既存のtabs.update完了後に配置するため、実際の完了を待つ。
            const expectedIndex = openInBackground ? 0 : 4;
            for (let attempt = 0; attempt < 50; attempt++) {
              if ((await chrome.tabs.get(tab.id!)).index === expectedIndex) {
                break;
              }
              await new Promise(resolve => setTimeout(resolve, 10));
            }
            return moves;
          } finally {
            chrome.tabs.move = originalMove;
            onCreated.addListener(handleNewTab);
            onActivated.addListener(handleTabActivated);
          }
        },
        { windowId, order, openInBackground },
      );
      expect(moves).toEqual([openInBackground ? 0 : 4]);
    });
  }
}

for (const openInBackground of [false, true]) {
  test(`new tab moves once after state reinitialization, background=${openInBackground}`, async ({
    context,
    serviceWorker,
  }) => {
    await clearExtensionStorage(serviceWorker);
    const { windowId } = await createWindowWithTabs(serviceWorker, 4);
    await setExtensionSettings(context, {
      ...DEFAULT_SETTINGS,
      newTab: { position: "first", openInBackground },
      tabOnActivate: { behavior: "last" },
    });
    await simulateServiceWorkerRestart(serviceWorker);
    const result = await serviceWorker.evaluate(async windowId => {
      const originalMove = chrome.tabs.move;
      const moves: { tabId: number; index: number }[] = [];
      chrome.tabs.move = ((tabId: number, properties: chrome.tabs.MoveProperties) => {
        moves.push({ tabId, index: properties.index });
        return originalMove(tabId, properties);
      }) as typeof chrome.tabs.move;
      try {
        const tab = await chrome.tabs.create({
          windowId,
          index: 1,
          active: true,
          url: "about:blank",
        });
        // 初期化と後続イベントが完了した後にも追加の移動がないことを確認する。
        await new Promise(resolve => setTimeout(resolve, 600));
        return {
          tab: await chrome.tabs.get(tab.id!),
          moves: moves.filter(move => move.tabId === tab.id).map(move => move.index),
        };
      } finally {
        chrome.tabs.move = originalMove;
      }
    }, windowId);
    expect(result.tab.active).toBe(!openInBackground);
    expect(result.moves).toEqual([openInBackground ? 0 : 4]);
  });
}

for (const scenario of [
  "recover",
  "switch",
  "disable",
  "pin",
  "close",
  "other-error",
  "limit",
  "change-position",
] as const) {
  test(`activation move handles temporary rejection: ${scenario}`, async ({
    context,
    serviceWorker,
  }) => {
    await clearExtensionStorage(serviceWorker);
    const { windowId } = await createWindowWithTabs(serviceWorker, 4);
    await setExtensionSettings(context, {
      ...DEFAULT_SETTINGS,
      tabOnActivate: { behavior: "last" },
    });
    const result = await serviceWorker.evaluate(
      async ({ windowId, scenario }) => {
        const tabs = await chrome.tabs.query({ windowId });
        const targetId = tabs[1].id!;
        const originalMove = chrome.tabs.move;
        let count = 0;
        const destinations: number[] = [];
        let notifyAttempt = () => {};
        let rejectAttempt = () => {};
        const attempted = new Promise<void>(resolve => {
          notifyAttempt = resolve;
        });
        chrome.tabs.move = ((tabId: number, properties: chrome.tabs.MoveProperties) => {
          if (tabId !== targetId) {
            return originalMove(tabId, properties);
          }
          count++;
          destinations.push(properties.index);
          notifyAttempt();
          if (count === 1 || scenario === "limit") {
            const error = new Error(
              scenario === "other-error"
                ? "No tab with id"
                : "Tabs cannot be edited right now (user may be dragging a tab).",
            );
            if (scenario === "disable" || scenario === "change-position") {
              // 設定変更が届いてから失敗を返し、ストレージ処理と50msの再試行を競争させない。
              return new Promise((_, reject) => {
                rejectAttempt = () => reject(error);
              });
            }
            return Promise.reject(error);
          }
          return originalMove(tabId, properties);
        }) as typeof chrome.tabs.move;
        try {
          await chrome.tabs.update(targetId, { active: true });
          await attempted;
          if (scenario === "switch") {
            await chrome.tabs.update(tabs[0].id!, { active: true });
          }
          if (scenario === "pin") {
            await chrome.tabs.update(targetId, { pinned: true });
          }
          if (scenario === "close") {
            await chrome.tabs.remove(targetId);
          }
          if (scenario === "disable" || scenario === "change-position") {
            const { settings } = await chrome.storage.local.get<{ settings: Settings }>("settings");
            const changed = new Promise<void>(resolve => {
              const listener = (
                changes: Record<string, chrome.storage.StorageChange>,
                area: string,
              ) => {
                if (area === "local" && changes.settings) {
                  chrome.storage.onChanged.removeListener(listener);
                  resolve();
                }
              };
              chrome.storage.onChanged.addListener(listener);
            });
            await chrome.storage.local.set({
              settings: {
                ...settings,
                tabOnActivate: { behavior: scenario === "disable" ? "default" : "first" },
              },
            });
            await changed;
            rejectAttempt();
          }
          if (scenario === "limit") {
            const deadline = Date.now() + 10000;
            while (count < 21 && Date.now() < deadline) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
          // 上限到達後にも余分な再試行が発生しないことを確認する。
          await new Promise(resolve => setTimeout(resolve, 400));
          return {
            count,
            destinations,
            index: scenario === "close" ? null : (await chrome.tabs.get(targetId)).index,
          };
        } finally {
          chrome.tabs.move = originalMove;
        }
      },
      { windowId, scenario },
    );
    expect(result.count).toBe(
      scenario === "limit" ? 21 : scenario === "recover" || scenario === "change-position" ? 2 : 1,
    );
    if (scenario === "recover") {
      expect(result.index).toBe(3);
    }
    if (scenario === "change-position") {
      expect(result.destinations).toEqual([3, 0]);
      expect(result.index).toBe(0);
    }
  });
}
