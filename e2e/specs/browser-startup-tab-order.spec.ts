import { expect, test } from "@/e2e/fixtures";
import {
  clearExtensionStorage,
  createWindowWithTabs,
  setExtensionSettings,
  simulateServiceWorkerRestart,
} from "@/e2e/utils/helpers";
import { DEFAULT_SETTINGS } from "@/src/types";

for (const scenario of ["delayed-created", "before-startup", "worker-restart"] as const) {
  test(`restored tabs retain order and selection with right positioning: ${scenario}`, async ({
    context,
    serviceWorker,
  }) => {
    await clearExtensionStorage(serviceWorker);
    const { windowId } = await createWindowWithTabs(serviceWorker, 5);
    await serviceWorker.evaluate(async windowId => {
      const tabs = await chrome.tabs.query({ windowId });
      await chrome.tabs.update(tabs[0].id!, { pinned: true });
      await chrome.tabs.update(tabs[1].id!, { active: true });
    }, windowId);
    await setExtensionSettings(context, {
      ...DEFAULT_SETTINGS,
      newTab: { ...DEFAULT_SETTINGS.newTab, position: "right" },
    });
    const before = await serviceWorker.evaluate(
      async windowId =>
        (await chrome.tabs.query({ windowId })).map(tab => ({
          id: tab.id,
          active: tab.active,
          pinned: tab.pinned,
        })),
      windowId,
    );
    // ブラウザ起動時はsession storageが空。Workerだけの再起動とは区別する。
    await serviceWorker.evaluate(() => chrome.storage.session.remove("sessionRestoreState"));
    await simulateServiceWorkerRestart(serviceWorker);
    if (scenario !== "before-startup") {
      await serviceWorker.evaluate(() =>
        globalThis.__testExports!.tabHandlers.handleLoadingPageStartup(),
      );
    }
    const ids = before.map(tab => tab.id!);
    for (const [index, id] of ids.entries()) {
      if (index === 1) {
        // 復元対象のイベントが200msより遅れて届いても、通常作成に変わってはいけない。
        await new Promise(resolve => setTimeout(resolve, 250));
        if (scenario === "worker-restart") {
          await simulateServiceWorkerRestart(serviceWorker);
        }
      }
      await serviceWorker.evaluate(async id => {
        await globalThis.__testExports!.tabHandlers.handleNewTab(await chrome.tabs.get(id));
      }, id);
    }
    if (scenario === "before-startup") {
      await serviceWorker.evaluate(() =>
        globalThis.__testExports!.tabHandlers.handleLoadingPageStartup(),
      );
    }
    await expect(async () => {
      const after = await serviceWorker.evaluate(
        async windowId =>
          (await chrome.tabs.query({ windowId })).map(tab => ({
            id: tab.id,
            active: tab.active,
            pinned: tab.pinned,
          })),
        windowId,
      );
      expect(after).toEqual(before);
    }).toPass();
    // 最初の通常タブもスキップせず、アクティブタブの直後へ移動する。
    const newId = await serviceWorker.evaluate(
      async windowId =>
        (await chrome.tabs.create({ windowId, url: "about:blank", active: false })).id!,
      windowId,
    );
    await expect(async () => {
      expect(
        await serviceWorker.evaluate(async id => (await chrome.tabs.get(id)).index, newId),
      ).toBe(2);
    }).toPass();
  });
}

for (const behavior of ["first", "last"] as const) {
  test(`startup activation is preserved but subsequent selection applies ${behavior}`, async ({
    context,
    serviceWorker,
  }) => {
    await clearExtensionStorage(serviceWorker);
    const { windowId } = await createWindowWithTabs(serviceWorker, 4);
    const tabs = await serviceWorker.evaluate(
      windowId => chrome.tabs.query({ windowId }),
      windowId,
    );
    await serviceWorker.evaluate(id => chrome.tabs.update(id, { active: true }), tabs[1].id!);
    await setExtensionSettings(context, { ...DEFAULT_SETTINGS, tabOnActivate: { behavior } });
    await serviceWorker.evaluate(async windowId => {
      const tabs = await chrome.tabs.query({ windowId });
      globalThis.__testExports!.sessionRestore.resetSessionRestoreState();
      globalThis.__testExports!.sessionRestore.markSessionRestoreTabs(tabs);
    }, windowId);
    await new Promise(resolve => setTimeout(resolve, 250));
    const moves = await serviceWorker.evaluate(
      async ({ windowId, id }) => {
        const originalMove = chrome.tabs.move;
        const calls: number[] = [];
        chrome.tabs.move = ((id: number, properties: chrome.tabs.MoveProperties) => {
          calls.push(id);
          return originalMove(id, properties);
        }) as typeof chrome.tabs.move;
        try {
          await globalThis.__testExports!.tabHandlers.handleTabActivated({ windowId, tabId: id });
          return calls;
        } finally {
          chrome.tabs.move = originalMove;
        }
      },
      { windowId, id: tabs[1].id! },
    );
    expect(moves).toEqual([]);
    await serviceWorker.evaluate(id => chrome.tabs.update(id, { active: true }), tabs[2].id!);
    await expect(async () => {
      expect(
        await serviceWorker.evaluate(async id => (await chrome.tabs.get(id)).index, tabs[2].id!),
      ).toBe(behavior === "first" ? 0 : 3);
    }).toPass();
  });
}
