import { expect, test } from "@/e2e/fixtures";
import {
  clearExtensionStorage,
  createExternalTabViaServiceWorker,
  createExternalTabWithRaceCondition,
  getTabState,
  setExtensionSettings,
} from "@/e2e/utils/helpers";

test.describe("External Tab Opening Behavior", () => {
  test.beforeEach(async ({ serviceWorker }) => {
    await clearExtensionStorage(serviceWorker);
  });

  test("should open external tab to the right of current tab", async ({ context, serviceWorker }) => {
    await setExtensionSettings(context, { newTab: { position: "right" } });

    // 初期タブの状態を取得
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 3つのタブを作成
    const tab1 = await context.newPage();
    await tab1.goto("data:text/html,<h1>Tab 1</h1>");

    const tab2 = await context.newPage();
    await tab2.goto("data:text/html,<h1>Tab 2</h1>");

    const tab3 = await context.newPage();
    await tab3.goto("data:text/html,<h1>Tab 3</h1>");

    // tab2（インデックス1）をアクティブに
    await tab2.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 200));

    const beforeState = await getTabState(serviceWorker);
    expect(beforeState.totalTabs).toBe(initialTabCount + 3);
    expect(beforeState.activeTabIndex).toBe(initialTabCount + 1); // tab2

    // 外部タブを作成
    const result = await createExternalTabViaServiceWorker(serviceWorker);
    expect(result.openerTabId).toBeUndefined();

    // 期待: 現在のタブ（tab2）の右側に作成される
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      expect(state.activeTabIndex).toBe(beforeState.activeTabIndex + 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should open external tab to the left of current tab", async ({ context, serviceWorker }) => {
    await setExtensionSettings(context, { newTab: { position: "left" } });

    // 初期タブの状態を取得
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 3つのタブを作成
    const tab1 = await context.newPage();
    await tab1.goto("data:text/html,<h1>Tab 1</h1>");

    const tab2 = await context.newPage();
    await tab2.goto("data:text/html,<h1>Tab 2</h1>");

    const tab3 = await context.newPage();
    await tab3.goto("data:text/html,<h1>Tab 3</h1>");

    // tab2（インデックス1）をアクティブに
    await tab2.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 200));

    const beforeState = await getTabState(serviceWorker);
    expect(beforeState.totalTabs).toBe(initialTabCount + 3);
    expect(beforeState.activeTabIndex).toBe(initialTabCount + 1); // tab2

    // 外部タブを作成
    const result = await createExternalTabViaServiceWorker(serviceWorker);
    expect(result.openerTabId).toBeUndefined();

    // 期待: 現在のタブ（tab2）の左側に作成される
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      expect(state.activeTabIndex).toBe(beforeState.activeTabIndex); // 同じインデックス（左に挿入されたため）
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should open external tab at first position", async ({ context, serviceWorker }) => {
    await setExtensionSettings(context, { newTab: { position: "first" } });

    // 初期タブの状態を取得
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 3つのタブを作成
    const tab1 = await context.newPage();
    await tab1.goto("data:text/html,<h1>Tab 1</h1>");

    const tab2 = await context.newPage();
    await tab2.goto("data:text/html,<h1>Tab 2</h1>");

    const tab3 = await context.newPage();
    await tab3.goto("data:text/html,<h1>Tab 3</h1>");

    // tab2をアクティブに（first positionの影響でインデックス1にある）
    await tab2.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 200));

    const beforeState = await getTabState(serviceWorker);
    expect(beforeState.totalTabs).toBe(initialTabCount + 3);
    // first position設定により新規タブは常にindex:0に作成されるため、
    // tab1→tab2→tab3の順で作成後: tab3(index:0), tab2(index:1), tab1(index:2)の配置
    expect(beforeState.activeTabIndex).toBe(1);

    // 外部タブを作成
    const result = await createExternalTabViaServiceWorker(serviceWorker);
    expect(result.openerTabId).toBeUndefined();

    // 期待: 最初（インデックス0）に作成される
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      expect(state.activeTabIndex).toBe(0);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should open external tab at last position", async ({ context, serviceWorker }) => {
    await setExtensionSettings(context, { newTab: { position: "last" } });

    // 初期タブの状態を取得
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 3つのタブを作成
    const tab1 = await context.newPage();
    await tab1.goto("data:text/html,<h1>Tab 1</h1>");

    const tab2 = await context.newPage();
    await tab2.goto("data:text/html,<h1>Tab 2</h1>");

    const tab3 = await context.newPage();
    await tab3.goto("data:text/html,<h1>Tab 3</h1>");

    // tab2（インデックス1）をアクティブに
    await tab2.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 200));

    const beforeState = await getTabState(serviceWorker);
    expect(beforeState.totalTabs).toBe(initialTabCount + 3);
    expect(beforeState.activeTabIndex).toBe(initialTabCount + 1); // tab2

    // 外部タブを作成
    const result = await createExternalTabViaServiceWorker(serviceWorker);
    expect(result.openerTabId).toBeUndefined();

    // 期待: 最後に作成される
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      expect(state.activeTabIndex).toBe(state.totalTabs - 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should open external tab from middle tab position", async ({ context, serviceWorker }) => {
    await setExtensionSettings(context, { newTab: { position: "right" } });

    // 初期タブの状態を取得
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 5つのタブを作成
    const tab1 = await context.newPage();
    await tab1.goto("data:text/html,<h1>Tab 1</h1>");

    const tab2 = await context.newPage();
    await tab2.goto("data:text/html,<h1>Tab 2</h1>");

    const tab3 = await context.newPage();
    await tab3.goto("data:text/html,<h1>Tab 3</h1>");

    const tab4 = await context.newPage();
    await tab4.goto("data:text/html,<h1>Tab 4</h1>");

    const tab5 = await context.newPage();
    await tab5.goto("data:text/html,<h1>Tab 5</h1>");

    // tab3（中間のタブ）をアクティブに
    await tab3.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 200));

    const beforeState = await getTabState(serviceWorker);
    expect(beforeState.totalTabs).toBe(initialTabCount + 5);
    expect(beforeState.activeTabIndex).toBe(initialTabCount + 2); // tab3

    // 外部タブを作成
    const result = await createExternalTabViaServiceWorker(serviceWorker);
    expect(result.openerTabId).toBeUndefined();

    // 期待: tab3の右側に作成される
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      expect(state.activeTabIndex).toBe(beforeState.activeTabIndex + 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should open external tab with default position setting", async ({ context, serviceWorker }) => {
    await setExtensionSettings(context, { newTab: { position: "default" } });

    // 初期タブの状態を取得
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 3つのタブを作成
    const tab1 = await context.newPage();
    await tab1.goto("data:text/html,<h1>Tab 1</h1>");

    const tab2 = await context.newPage();
    await tab2.goto("data:text/html,<h1>Tab 2</h1>");

    const tab3 = await context.newPage();
    await tab3.goto("data:text/html,<h1>Tab 3</h1>");

    // tab2をアクティブに
    await tab2.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 200));

    const beforeState = await getTabState(serviceWorker);
    expect(beforeState.totalTabs).toBe(initialTabCount + 3);
    expect(beforeState.activeTabIndex).toBe(initialTabCount + 1); // tab2

    // 外部タブを作成
    const result = await createExternalTabViaServiceWorker(serviceWorker);
    expect(result.openerTabId).toBeUndefined();

    // デフォルト設定では、ブラウザのデフォルト動作（最後に作成）
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      expect(state.activeTabIndex).toBe(state.totalTabs - 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });
});

// ⚠️ 以下のテストは特殊な方法でレースコンディションを再現しています
// 外部アプリからのタブ作成時にChromeが発火するイベント順序（onActivated → onCreated）を模擬
// handler.tsの実装が変更された場合、テストの更新が必要です
test.describe("External Tab Opening with Race Condition", () => {
  test.beforeEach(async ({ serviceWorker }) => {
    await clearExtensionStorage(serviceWorker);
  });

  test("should handle race condition: external tab respects 'right' position", async ({
    context,
    serviceWorker,
  }) => {
    await setExtensionSettings(context, { newTab: { position: "right" } });

    // 初期タブの状態を取得
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 3つのタブを作成
    const tab1 = await context.newPage();
    await tab1.goto("data:text/html,<h1>Tab 1</h1>");

    const tab2 = await context.newPage();
    await tab2.goto("data:text/html,<h1>Tab 2</h1>");

    const tab3 = await context.newPage();
    await tab3.goto("data:text/html,<h1>Tab 3</h1>");

    // tab2（インデックス1）をアクティブに
    await tab2.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 200));

    const beforeState = await getTabState(serviceWorker);
    expect(beforeState.totalTabs).toBe(initialTabCount + 3);
    expect(beforeState.activeTabIndex).toBe(initialTabCount + 1); // tab2

    // レースコンディションを伴う外部タブ作成
    const result = await createExternalTabWithRaceCondition(serviceWorker);
    expect(result.openerTabId).toBeUndefined();

    // 期待: 現在のタブ（tab2）の右側に作成される
    // 現在のバグ: 最後尾に配置される
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      expect(state.activeTabIndex).toBe(beforeState.activeTabIndex + 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should handle race condition: external tab respects 'left' position", async ({
    context,
    serviceWorker,
  }) => {
    await setExtensionSettings(context, { newTab: { position: "left" } });

    // 初期タブの状態を取得
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 3つのタブを作成
    const tab1 = await context.newPage();
    await tab1.goto("data:text/html,<h1>Tab 1</h1>");

    const tab2 = await context.newPage();
    await tab2.goto("data:text/html,<h1>Tab 2</h1>");

    const tab3 = await context.newPage();
    await tab3.goto("data:text/html,<h1>Tab 3</h1>");

    // tab2（インデックス1）をアクティブに
    await tab2.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 200));

    const beforeState = await getTabState(serviceWorker);
    expect(beforeState.totalTabs).toBe(initialTabCount + 3);
    expect(beforeState.activeTabIndex).toBe(initialTabCount + 1); // tab2

    // レースコンディションを伴う外部タブ作成
    const result = await createExternalTabWithRaceCondition(serviceWorker);
    expect(result.openerTabId).toBeUndefined();

    // 期待: 現在のタブ（tab2）の左側に作成される
    // 現在のバグ: 最後尾に配置される
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      expect(state.activeTabIndex).toBe(beforeState.activeTabIndex); // 同じインデックス（左に挿入されたため）
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should handle race condition: external tab respects 'first' position", async ({
    context,
    serviceWorker,
  }) => {
    await setExtensionSettings(context, { newTab: { position: "first" } });

    // 初期タブの状態を取得
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 3つのタブを作成
    const tab1 = await context.newPage();
    await tab1.goto("data:text/html,<h1>Tab 1</h1>");

    const tab2 = await context.newPage();
    await tab2.goto("data:text/html,<h1>Tab 2</h1>");

    const tab3 = await context.newPage();
    await tab3.goto("data:text/html,<h1>Tab 3</h1>");

    // tab2をアクティブに
    await tab2.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 200));

    const beforeState = await getTabState(serviceWorker);
    expect(beforeState.totalTabs).toBe(initialTabCount + 3);

    // レースコンディションを伴う外部タブ作成
    const result = await createExternalTabWithRaceCondition(serviceWorker);
    expect(result.openerTabId).toBeUndefined();

    // 期待: 最初（インデックス0）に作成される
    // 現在のバグ: 最後尾に配置される
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      expect(state.activeTabIndex).toBe(0);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should handle race condition: external tab respects 'last' position", async ({
    context,
    serviceWorker,
  }) => {
    await setExtensionSettings(context, { newTab: { position: "last" } });

    // 初期タブの状態を取得
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 3つのタブを作成
    const tab1 = await context.newPage();
    await tab1.goto("data:text/html,<h1>Tab 1</h1>");

    const tab2 = await context.newPage();
    await tab2.goto("data:text/html,<h1>Tab 2</h1>");

    const tab3 = await context.newPage();
    await tab3.goto("data:text/html,<h1>Tab 3</h1>");

    // tab2（インデックス1）をアクティブに
    await tab2.bringToFront();
    await new Promise(resolve => setTimeout(resolve, 200));

    const beforeState = await getTabState(serviceWorker);
    expect(beforeState.totalTabs).toBe(initialTabCount + 3);
    expect(beforeState.activeTabIndex).toBe(initialTabCount + 1); // tab2

    // レースコンディションを伴う外部タブ作成
    const result = await createExternalTabWithRaceCondition(serviceWorker);
    expect(result.openerTabId).toBeUndefined();

    // 期待: 最後に作成される
    // このケースは現在のバグでも正しく動作する（最後尾が期待値のため）
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      expect(state.activeTabIndex).toBe(state.totalTabs - 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });
});
