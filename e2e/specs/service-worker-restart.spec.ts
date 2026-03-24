import { expect, test } from "@/e2e/fixtures";
import {
  activateTabByIndexInWindow,
  clearExtensionStorage,
  closeActiveTabViaServiceWorker,
  closeActiveTabWithoutActivatedHandler,
  createExternalTabWithRaceCondition,
  createTabInWindow,
  createTabsInWindow,
  getCurrentWindowId,
  getCurrentWindowTabs,
  getMemoryCacheState,
  getServiceWorkerUnhandledRejections,
  getTabState,
  resetServiceWorkerTabQueryCalls,
  resetServiceWorkerUnhandledRejections,
  setExtensionSettings,
  setServiceWorkerTabQueryFailure,
  simulateServiceWorkerRestart,
} from "@/e2e/utils/helpers";

test.describe("Service Worker Restart Handling", () => {
  test.beforeEach(async ({ serviceWorker }) => {
    await clearExtensionStorage(serviceWorker);
  });

  test("should maintain 'left tab' behavior after Service Worker restart", async ({
    context,
    serviceWorker,
  }) => {
    // 3つのタブを作成
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    const tab1 = await context.newPage();
    await tab1.goto("data:text/html,<h1>Tab 1</h1>");

    const tab2 = await context.newPage();
    await tab2.goto("data:text/html,<h1>Tab 2</h1>");

    const tab3 = await context.newPage();
    await tab3.goto("data:text/html,<h1>Tab 3</h1>");

    // 右端のタブ（tab3）をアクティブに
    await tab3.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 200));

    // 左タブアクティベーション設定
    await setExtensionSettings(context, {
      afterTabClosing: { activateTab: "left" },
    });

    // 初期状態を確認
    const beforeRestartState = await getTabState(serviceWorker);
    expect(beforeRestartState.totalTabs).toBe(initialTabCount + 3);
    expect(beforeRestartState.activeTabIndex).toBe(initialTabCount + 2); // tab3

    // メモリキャッシュが存在することを確認
    const cacheBeforeRestart = await getMemoryCacheState(serviceWorker);
    expect(cacheBeforeRestart).not.toBeNull();
    expect(cacheBeforeRestart!.initializationState).toBe(true);

    // Step 4: Service Worker再起動をシミュレート（30秒経過を想定）
    await simulateServiceWorkerRestart(serviceWorker);

    // メモリキャッシュがクリアされたことを確認
    const cacheAfterRestart = await getMemoryCacheState(serviceWorker);
    expect(cacheAfterRestart).not.toBeNull();
    expect(cacheAfterRestart!.initializationState).toBe(false);

    // 再起動後も状態が維持されていることを確認
    const afterRestartState = await getTabState(serviceWorker);
    expect(afterRestartState.totalTabs).toBe(beforeRestartState.totalTabs);
    expect(afterRestartState.activeTabIndex).toBe(beforeRestartState.activeTabIndex);

    // Step 5: アクティブタブを閉じる
    await closeActiveTabViaServiceWorker(serviceWorker);

    // Step 6: 左側のタブ（tab2）がアクティブになることを確認
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeRestartState.totalTabs - 1);
      expect(state.activeTabIndex).toBe(initialTabCount + 1); // tab2のインデックス
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });

    // 操作後、メモリキャッシュが再構築されていることを確認
    const cacheAfterOperation = await getMemoryCacheState(serviceWorker);
    expect(cacheAfterOperation!.initializationState).toBe(true);
  });

  test("should preserve activation history after Service Worker restart", async ({
    context,
    serviceWorker,
  }) => {
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // タブを作成
    const pages = [];
    for (let i = 0; i < 4; i++) {
      const page = await context.newPage();
      await page.goto(`data:text/html,<h1>Tab ${i + 1}</h1>`);
      pages.push(page);
    }

    // 特定の順序でタブをアクティブ化: Tab1 -> Tab3 -> Tab2 -> Tab4
    await pages[0].bringToFront();
    await new Promise(resolve => setTimeout(resolve, 100));
    await pages[2].bringToFront();
    await new Promise(resolve => setTimeout(resolve, 100));
    await pages[1].bringToFront();
    await new Promise(resolve => setTimeout(resolve, 100));
    await pages[3].bringToFront();
    await new Promise(resolve => setTimeout(resolve, 100));

    // アクティベーション履歴を使用する設定
    await setExtensionSettings(context, {
      afterTabClosing: { activateTab: "inActivatedOrder" },
    });

    // メモリキャッシュが存在することを確認
    const cacheBeforeRestart = await getMemoryCacheState(serviceWorker);
    expect(cacheBeforeRestart!.initializationState).toBe(true);

    // Service Worker再起動をシミュレート
    await simulateServiceWorkerRestart(serviceWorker);

    // メモリキャッシュがクリアされたことを確認
    const cacheAfterRestart = await getMemoryCacheState(serviceWorker);
    expect(cacheAfterRestart!.initializationState).toBe(false);

    // Tab4（現在アクティブ）を閉じる
    await closeActiveTabViaServiceWorker(serviceWorker);

    // Tab2（履歴で前にアクティブだった）がアクティブになるべき
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(initialTabCount + 3);
      expect(state.activeTabIndex).toBe(initialTabCount + 1); // Tab2のインデックス
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should handle source tab relationship after Service Worker restart", async ({
    context,
    serviceWorker,
  }) => {
    // 親タブを作成
    const parentTab = await context.newPage();
    await parentTab.goto("data:text/html,<h1>Parent Tab</h1>");

    // Service Worker経由でリンクから新しいタブを開く
    const childTabInfo = await serviceWorker.evaluate(async () => {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const newTab = await chrome.tabs.create({
        active: true,
        openerTabId: activeTab?.id,
        url: "data:text/html,<h1>Child Tab</h1>",
      });
      return {
        childId: newTab.id,
        parentId: newTab.openerTabId,
      };
    });

    // ソースタブ設定を使用
    await setExtensionSettings(context, {
      afterTabClosing: { activateTab: "sourceTab" },
    });

    // メモリキャッシュが存在することを確認
    const cacheBeforeRestart = await getMemoryCacheState(serviceWorker);
    expect(cacheBeforeRestart).not.toBeNull();
    expect(cacheBeforeRestart!.initializationState).toBe(true);

    // Service Worker再起動をシミュレート
    await simulateServiceWorkerRestart(serviceWorker);

    // メモリキャッシュがクリアされたことを確認
    const cacheAfterRestart = await getMemoryCacheState(serviceWorker);
    expect(cacheAfterRestart).not.toBeNull();
    expect(cacheAfterRestart!.initializationState).toBe(false);

    // 子タブを閉じる
    await closeActiveTabViaServiceWorker(serviceWorker);

    // 親タブがアクティブになるべき
    await expect(async () => {
      const state = await serviceWorker.evaluate(async () => {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        const activeTab = tabs.find(t => t.active);
        return {
          activeTabId: activeTab?.id,
        };
      });
      expect(state.activeTabId).toBe(childTabInfo.parentId);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should handle multiple Service Worker restarts", async ({ context, serviceWorker }) => {
    await setExtensionSettings(context, {
      afterTabClosing: { activateTab: "right" },
    });

    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 5つのタブを作成
    for (let i = 0; i < 5; i++) {
      const page = await context.newPage();
      await page.goto(`data:text/html,<h1>Tab ${i + 1}</h1>`);
    }

    // Tab3をアクティブに
    const tabs = await context.pages();
    await tabs[initialTabCount + 2].bringToFront();
    await new Promise(resolve => setTimeout(resolve, 200));

    // 1回目の再起動
    const cache1Before = await getMemoryCacheState(serviceWorker);
    expect(cache1Before!.initializationState).toBe(true);

    await simulateServiceWorkerRestart(serviceWorker);

    const cache1After = await getMemoryCacheState(serviceWorker);
    expect(cache1After!.initializationState).toBe(false);

    // Tab3を閉じる -> Tab4がアクティブになるはず
    await closeActiveTabViaServiceWorker(serviceWorker);

    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.activeTabIndex).toBe(initialTabCount + 2); // Tab4の新しいインデックス
    }).toPass({ timeout: 5000 });

    // 操作後、メモリが再構築されるのを待つ
    await new Promise(resolve => setTimeout(resolve, 200));

    // 2回目の再起動
    const cache2Before = await getMemoryCacheState(serviceWorker);
    expect(cache2Before!.initializationState).toBe(true);

    await simulateServiceWorkerRestart(serviceWorker);

    const cache2After = await getMemoryCacheState(serviceWorker);
    expect(cache2After!.initializationState).toBe(false);

    // Tab4を閉じる -> Tab5がアクティブになるはず
    await closeActiveTabViaServiceWorker(serviceWorker);

    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.activeTabIndex).toBe(initialTabCount + 2); // Tab5の新しいインデックス
    }).toPass({ timeout: 5000 });
  });

  test("should restore live tab order instead of stale session snapshot after Service Worker restart", async ({
    context,
    serviceWorker,
  }) => {
    const windowId = await getCurrentWindowId(serviceWorker);
    if (windowId === null) {
      throw new Error("Current window not found");
    }

    await createTabsInWindow(serviceWorker, windowId, 3);
    await activateTabByIndexInWindow(serviceWorker, windowId, 1);
    await new Promise(resolve => setTimeout(resolve, 200));

    await setExtensionSettings(context, {
      newTab: { position: "right", openInBackground: false },
    });

    const beforeTabs = await getCurrentWindowTabs(serviceWorker);
    expect(beforeTabs).toHaveLength(4);

    const activeTabIndex = beforeTabs.findIndex(tab => tab.active);
    expect(activeTabIndex).toBe(1);

    const activeTab = beforeTabs[activeTabIndex];
    const staleSnapshot = [
      beforeTabs[0],
      {
        id: 999_999_001,
        index: 1,
        active: false,
      },
      ...beforeTabs.slice(1).map(tab => ({
        ...tab,
        index: tab.index + 1,
      })),
    ];

    await serviceWorker.evaluate(
      async ({ windowId, staleSnapshot, activeTabId }) => {
        await chrome.storage.session.set({
          tabSnapshot: {
            [String(windowId)]: staleSnapshot,
          },
          tabActivationHistory: {
            [String(windowId)]: [activeTabId],
          },
        });
      },
      {
        windowId,
        staleSnapshot,
        activeTabId: activeTab.id,
      },
    );

    await simulateServiceWorkerRestart(serviceWorker);

    const createdTab = await createTabInWindow(serviceWorker, windowId, {
      active: true,
      useActiveTabAsOpener: true,
    });

    const expectedTabIds = [
      ...beforeTabs.slice(0, activeTabIndex + 1).map(tab => tab.id),
      createdTab.newTabId!,
      ...beforeTabs.slice(activeTabIndex + 1).map(tab => tab.id),
    ];

    await expect(async () => {
      const tabs = await getCurrentWindowTabs(serviceWorker);
      expect(tabs.map(tab => tab.id)).toEqual(expectedTabIds);
      expect(tabs.findIndex(tab => tab.active)).toBe(activeTabIndex + 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should prefer live activation history over restored snapshot for source tab resolution after Service Worker restart", async ({
    context,
    serviceWorker,
  }) => {
    const windowId = await getCurrentWindowId(serviceWorker);
    if (windowId === null) {
      throw new Error("Current window not found");
    }

    await createTabsInWindow(serviceWorker, windowId, 3);
    await activateTabByIndexInWindow(serviceWorker, windowId, 1);
    await new Promise(resolve => setTimeout(resolve, 200));

    await setExtensionSettings(context, {
      newTab: { position: "right", openInBackground: false },
    });

    const beforeTabs = await getCurrentWindowTabs(serviceWorker);
    expect(beforeTabs).toHaveLength(4);

    const activeTabIndex = beforeTabs.findIndex(tab => tab.active);
    expect(activeTabIndex).toBe(1);

    const activeTab = beforeTabs[activeTabIndex];
    const staleSnapshot = beforeTabs.map((tab, index) => ({
      ...tab,
      active: index === beforeTabs.length - 1,
    }));

    await serviceWorker.evaluate(
      async ({ windowId, staleSnapshot, activeTabId }) => {
        await chrome.storage.session.set({
          tabSnapshot: {
            [String(windowId)]: staleSnapshot,
          },
          tabActivationHistory: {
            [String(windowId)]: [activeTabId],
          },
        });
      },
      {
        windowId,
        staleSnapshot,
        activeTabId: activeTab.id,
      },
    );

    await simulateServiceWorkerRestart(serviceWorker);

    const createdTab = await createTabInWindow(serviceWorker, windowId, {
      active: true,
    });

    const expectedTabIds = [
      ...beforeTabs.slice(0, activeTabIndex + 1).map(tab => tab.id),
      createdTab.newTabId!,
      ...beforeTabs.slice(activeTabIndex + 1).map(tab => tab.id),
    ];

    await expect(async () => {
      const tabs = await getCurrentWindowTabs(serviceWorker);
      expect(tabs.map(tab => tab.id)).toEqual(expectedTabIds);
      expect(tabs.findIndex(tab => tab.active)).toBe(activeTabIndex + 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should fall back to restored snapshot active tab when activation history cannot resolve source tab after Service Worker restart", async ({
    context,
    serviceWorker,
  }) => {
    const windowId = await getCurrentWindowId(serviceWorker);
    if (windowId === null) {
      throw new Error("Current window not found");
    }

    await createTabsInWindow(serviceWorker, windowId, 3);
    await activateTabByIndexInWindow(serviceWorker, windowId, 1);
    await new Promise(resolve => setTimeout(resolve, 200));

    await setExtensionSettings(context, {
      newTab: { position: "right", openInBackground: false },
    });

    const beforeTabs = await getCurrentWindowTabs(serviceWorker);
    expect(beforeTabs).toHaveLength(4);

    const activeTabIndex = beforeTabs.findIndex(tab => tab.active);
    expect(activeTabIndex).toBe(1);

    const activeTab = beforeTabs[activeTabIndex];
    await serviceWorker.evaluate(
      async ({ windowId, tabs }) => {
        await chrome.storage.session.set({
          tabSnapshot: {
            [String(windowId)]: tabs,
          },
          tabActivationHistory: {
            [String(windowId)]: [],
          },
        });
      },
      {
        windowId,
        tabs: beforeTabs,
      },
    );

    await simulateServiceWorkerRestart(serviceWorker);

    const createdTab = await createTabInWindow(serviceWorker, windowId, {
      active: true,
    });

    const expectedTabIds = [
      ...beforeTabs.slice(0, activeTabIndex + 1).map(tab => tab.id),
      createdTab.newTabId!,
      ...beforeTabs.slice(activeTabIndex + 1).map(tab => tab.id),
    ];

    await expect(async () => {
      const tabs = await getCurrentWindowTabs(serviceWorker);
      expect(tabs.map(tab => tab.id)).toEqual(expectedTabIds);
      expect(tabs.findIndex(tab => tab.active)).toBe(activeTabIndex + 1);
      expect(tabs[activeTabIndex]?.id).toBe(activeTab.id);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should use restored activation history before restored snapshot when the first post-restart activation creates a source transition", async ({
    context,
    serviceWorker,
  }) => {
    const windowId = await getCurrentWindowId(serviceWorker);
    expect(windowId).not.toBeNull();

    await createTabsInWindow(serviceWorker, windowId!, 3);
    await activateTabByIndexInWindow(serviceWorker, windowId!, 1);
    await new Promise(resolve => setTimeout(resolve, 200));

    await setExtensionSettings(context, {
      newTab: { position: "right", openInBackground: false },
    });

    const beforeState = await getTabState(serviceWorker);
    const beforeTabs = await getCurrentWindowTabs(serviceWorker);
    const activeTabIndex = beforeTabs.findIndex(tab => tab.active);
    const activeTabId = beforeTabs[activeTabIndex]!.id;
    const staleSnapshot = beforeTabs.map((tab, index) => ({
      ...tab,
      active: index === beforeTabs.length - 1,
    }));

    await serviceWorker.evaluate(
      async ({ windowId, staleSnapshot, activeTabId }) => {
        await chrome.storage.session.set({
          tabSnapshot: {
            [String(windowId)]: staleSnapshot,
          },
          tabActivationHistory: {
            [String(windowId)]: [activeTabId],
          },
        });
      },
      {
        windowId: windowId!,
        staleSnapshot,
        activeTabId,
      },
    );

    await simulateServiceWorkerRestart(serviceWorker);

    await createExternalTabWithRaceCondition(serviceWorker);

    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      expect(state.activeTabIndex).toBe(activeTabIndex + 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should not leak unhandled rejection when refreshWindowTabSnapshot fails after tab activation", async ({
    context,
    serviceWorker,
  }) => {
    const windowId = await getCurrentWindowId(serviceWorker);
    expect(windowId).not.toBeNull();

    const tab1 = await context.newPage();
    await tab1.goto("data:text/html,<h1>Tab 1</h1>");

    const tab2 = await context.newPage();
    await tab2.goto("data:text/html,<h1>Tab 2</h1>");
    await tab2.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 200));

    await resetServiceWorkerTabQueryCalls(serviceWorker);
    await resetServiceWorkerUnhandledRejections(serviceWorker);
    await setServiceWorkerTabQueryFailure(
      serviceWorker,
      windowId!,
      `No window with id: ${windowId!}.`,
    );

    await serviceWorker.evaluate(async windowId => {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await globalThis.__testExports!.tabHandlers.handleTabActivated({
        tabId: activeTab!.id!,
        windowId,
      });
      await new Promise(resolve => setTimeout(resolve, 100));
    }, windowId!);

    await expect(async () => {
      const unhandledRejections = await getServiceWorkerUnhandledRejections(serviceWorker);
      expect(unhandledRejections).toEqual([]);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should ignore stale restored activation history entries when reconstructing the first post-restart source transition", async ({
    context,
    serviceWorker,
  }) => {
    const windowId = await getCurrentWindowId(serviceWorker);
    expect(windowId).not.toBeNull();

    await createTabsInWindow(serviceWorker, windowId!, 3);
    await activateTabByIndexInWindow(serviceWorker, windowId!, 1);
    await new Promise(resolve => setTimeout(resolve, 200));

    await setExtensionSettings(context, {
      newTab: { position: "right", openInBackground: false },
    });

    const beforeState = await getTabState(serviceWorker);
    const beforeTabs = await getCurrentWindowTabs(serviceWorker);
    const activeTabIndex = beforeTabs.findIndex(tab => tab.active);
    expect(activeTabIndex).toBe(1);

    const activeTabId = beforeTabs[activeTabIndex]!.id;
    const closedTab = await createTabInWindow(serviceWorker, windowId!, {
      active: false,
    });
    await serviceWorker.evaluate(async tabId => {
      await chrome.tabs.remove(tabId);
    }, closedTab.newTabId!);
    await new Promise(resolve => setTimeout(resolve, 200));

    await serviceWorker.evaluate(
      async ({ windowId, liveTabs, activeTabId, closedTabId }) => {
        await chrome.storage.session.set({
          tabSnapshot: {
            [String(windowId)]: liveTabs,
          },
          tabActivationHistory: {
            [String(windowId)]: [activeTabId, closedTabId],
          },
        });
      },
      {
        windowId: windowId!,
        liveTabs: beforeTabs,
        activeTabId,
        closedTabId: closedTab.newTabId!,
      },
    );

    await simulateServiceWorkerRestart(serviceWorker);
    await createExternalTabWithRaceCondition(serviceWorker);

    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      expect(state.activeTabIndex).toBe(activeTabIndex + 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should ignore stale restored snapshot active flags when the first post-restart active tab is removed", async ({
    context,
    serviceWorker,
  }) => {
    const windowId = await getCurrentWindowId(serviceWorker);
    expect(windowId).not.toBeNull();

    await createTabsInWindow(serviceWorker, windowId!, 3);
    await activateTabByIndexInWindow(serviceWorker, windowId!, 1);
    await new Promise(resolve => setTimeout(resolve, 200));

    await setExtensionSettings(context, {
      afterTabClosing: { activateTab: "left" },
    });

    const beforeState = await getTabState(serviceWorker);
    const beforeTabs = await getCurrentWindowTabs(serviceWorker);
    const activeTabIndex = beforeTabs.findIndex(tab => tab.active);
    expect(activeTabIndex).toBe(1);

    const staleSnapshot = beforeTabs.map((tab, index) => ({
      ...tab,
      active: index === beforeTabs.length - 1,
    }));

    await serviceWorker.evaluate(
      async ({ windowId, staleSnapshot }) => {
        await chrome.storage.session.set({
          tabSnapshot: {
            [String(windowId)]: staleSnapshot,
          },
        });
      },
      {
        windowId: windowId!,
        staleSnapshot,
      },
    );

    await simulateServiceWorkerRestart(serviceWorker);
    await closeActiveTabWithoutActivatedHandler(serviceWorker);

    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs - 1);
      expect(state.activeTabIndex).toBe(activeTabIndex - 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should ignore stale restored activation history tails when reconstructing close transitions after Service Worker restart", async ({
    context,
    serviceWorker,
  }) => {
    const windowId = await getCurrentWindowId(serviceWorker);
    expect(windowId).not.toBeNull();

    await createTabsInWindow(serviceWorker, windowId!, 3);
    await activateTabByIndexInWindow(serviceWorker, windowId!, 1);
    await new Promise(resolve => setTimeout(resolve, 200));

    await setExtensionSettings(context, {
      afterTabClosing: { activateTab: "left" },
    });

    const beforeState = await getTabState(serviceWorker);
    const beforeTabs = await getCurrentWindowTabs(serviceWorker);
    const activeTabIndex = beforeTabs.findIndex(tab => tab.active);
    expect(activeTabIndex).toBe(1);

    const removedTabId = beforeTabs[activeTabIndex]!.id;
    const successorTabId = beforeTabs[activeTabIndex + 1]!.id;
    const staleClosedTab = await createTabInWindow(serviceWorker, windowId!, {
      active: false,
    });
    await serviceWorker.evaluate(async tabId => {
      await chrome.tabs.remove(tabId);
    }, staleClosedTab.newTabId!);
    await new Promise(resolve => setTimeout(resolve, 200));

    await serviceWorker.evaluate(
      async ({ windowId, removedTabId, staleClosedTabId }) => {
        await chrome.storage.session.set({
          tabActivationHistory: {
            [String(windowId)]: [removedTabId, staleClosedTabId],
          },
        });
      },
      {
        windowId: windowId!,
        removedTabId,
        staleClosedTabId: staleClosedTab.newTabId!,
      },
    );

    await simulateServiceWorkerRestart(serviceWorker);

    await serviceWorker.evaluate(
      async ({ windowId, removedTabId, successorTabId }) => {
        const { handleTabActivated, handleTabRemoved, onActivated, onRemoved } =
          globalThis.__testExports!.tabHandlers;

        onActivated.removeListener(handleTabActivated);
        onRemoved.removeListener(handleTabRemoved);

        try {
          await chrome.tabs.update(successorTabId, { active: true });
          await handleTabActivated({
            tabId: successorTabId,
            windowId,
          });
          globalThis.__testExports!.states.removeTabFromSnapshot(windowId, removedTabId);
          await chrome.tabs.remove(removedTabId);
          await handleTabRemoved(removedTabId, {
            windowId,
            isWindowClosing: false,
          });
          await new Promise(resolve => setTimeout(resolve, 100));
        } finally {
          onActivated.addListener(handleTabActivated);
          onRemoved.addListener(handleTabRemoved);
        }
      },
      {
        windowId: windowId!,
        removedTabId,
        successorTabId,
      },
    );

    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs - 1);
      expect(state.activeTabIndex).toBe(activeTabIndex - 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });
});
