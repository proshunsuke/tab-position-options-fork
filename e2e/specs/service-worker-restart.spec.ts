import { expect, test } from "@/e2e/fixtures";
import {
  clearExtensionStorage,
  closeActiveTabViaServiceWorker,
  getMemoryCacheState,
  getTabState,
  setExtensionSettings,
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
    // Step 1: 左タブアクティベーション設定
    await setExtensionSettings(context, {
      afterTabClosing: { activateTab: "left" },
    });

    // Step 2: 3つのタブを作成
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    const tab1 = await context.newPage();
    await tab1.goto("data:text/html,<h1>Tab 1</h1>");

    const tab2 = await context.newPage();
    await tab2.goto("data:text/html,<h1>Tab 2</h1>");

    const tab3 = await context.newPage();
    await tab3.goto("data:text/html,<h1>Tab 3</h1>");

    // Step 3: 右端のタブ（tab3）をアクティブに
    await tab3.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 200));

    // 初期状態を確認
    const beforeRestartState = await getTabState(serviceWorker);
    expect(beforeRestartState.totalTabs).toBe(initialTabCount + 3);
    expect(beforeRestartState.activeTabIndex).toBe(initialTabCount + 2); // tab3

    // メモリキャッシュが存在することを確認
    const cacheBeforeRestart = await getMemoryCacheState(serviceWorker);
    expect(cacheBeforeRestart).not.toBeNull();
    expect(cacheBeforeRestart!.size).toBeGreaterThan(0);
    expect(cacheBeforeRestart!.hasSettings).toBe(true);

    // Step 4: Service Worker再起動をシミュレート（30秒経過を想定）
    await simulateServiceWorkerRestart(serviceWorker);

    // メモリキャッシュがクリアされたことを確認
    const cacheAfterRestart = await getMemoryCacheState(serviceWorker);
    expect(cacheAfterRestart).not.toBeNull();
    expect(cacheAfterRestart!.size).toBe(0);
    expect(cacheAfterRestart!.keys.length).toBe(0);
    expect(cacheAfterRestart!.hasSettings).toBe(false);
    expect(cacheAfterRestart!.hasLastActiveTab).toBe(false);
    expect(cacheAfterRestart!.hasTabIndexCache).toBe(false);

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
    expect(cacheAfterOperation!.size).toBeGreaterThan(0);
  });

  test("should preserve activation history after Service Worker restart", async ({
    context,
    serviceWorker,
  }) => {
    // アクティベーション履歴を使用する設定
    await setExtensionSettings(context, {
      afterTabClosing: { activateTab: "inActivatedOrder" },
    });

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

    // メモリキャッシュが存在することを確認
    const cacheBeforeRestart = await getMemoryCacheState(serviceWorker);
    expect(cacheBeforeRestart!.size).toBeGreaterThan(0);

    // Service Worker再起動をシミュレート
    await simulateServiceWorkerRestart(serviceWorker);

    // メモリキャッシュがクリアされたことを確認
    const cacheAfterRestart = await getMemoryCacheState(serviceWorker);
    expect(cacheAfterRestart!.size).toBe(0);

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
    // ソースタブ設定を使用
    await setExtensionSettings(context, {
      afterTabClosing: { activateTab: "sourceTab" },
    });

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

    // メモリキャッシュが存在することを確認
    const cacheBeforeRestart = await getMemoryCacheState(serviceWorker);
    expect(cacheBeforeRestart!.size).toBeGreaterThan(0);
    expect(cacheBeforeRestart!.hasTabIndexCache).toBe(true);

    // Service Worker再起動をシミュレート
    await simulateServiceWorkerRestart(serviceWorker);

    // メモリキャッシュがクリアされたことを確認
    const cacheAfterRestart = await getMemoryCacheState(serviceWorker);
    expect(cacheAfterRestart!.size).toBe(0);
    expect(cacheAfterRestart!.hasTabIndexCache).toBe(false);

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
    expect(cache1Before!.size).toBeGreaterThan(0);

    await simulateServiceWorkerRestart(serviceWorker);

    const cache1After = await getMemoryCacheState(serviceWorker);
    expect(cache1After!.size).toBe(0);

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
    expect(cache2Before!.size).toBeGreaterThan(0);

    await simulateServiceWorkerRestart(serviceWorker);

    const cache2After = await getMemoryCacheState(serviceWorker);
    expect(cache2After!.size).toBe(0);

    // Tab4を閉じる -> Tab5がアクティブになるはず
    await closeActiveTabViaServiceWorker(serviceWorker);

    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.activeTabIndex).toBe(initialTabCount + 2); // Tab5の新しいインデックス
    }).toPass({ timeout: 5000 });
  });
});
