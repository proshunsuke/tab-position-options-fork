import { expect, test } from "@/e2e/fixtures";
import {
  clearExtensionStorage,
  createTabViaServiceWorker,
  getTabState,
  setExtensionSettings,
} from "@/e2e/utils/helpers";

test.describe("Tab Behavior - New Tab Background", () => {
  test.beforeEach(async ({ serviceWorker }) => {
    await clearExtensionStorage(serviceWorker);
  });

  test("should open new tab at first position in background", async ({
    context,
    serviceWorker,
  }) => {
    // 3つのタブを作成
    await context.newPage();
    const tab2 = await context.newPage();
    await context.newPage();

    // tab2をアクティブに
    await tab2.bringToFront();

    await setExtensionSettings(context, {
      newTab: { position: "first", openInBackground: true },
    });

    const beforeState = await getTabState(serviceWorker);
    const originalActiveIndex = beforeState.activeTabIndex;

    await createTabViaServiceWorker(serviceWorker);

    // 新しいタブは最初（インデックス0）に作成され、元のタブがアクティブのままであるべき
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      // 元のタブがアクティブのまま（インデックスは新しいタブの挿入により+1される）
      expect(state.activeTabIndex).toBe(originalActiveIndex + 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  test("should open new tab at last position in background", async ({ context, serviceWorker }) => {
    // 3つのタブを作成
    await context.newPage();
    const tab2 = await context.newPage();
    await context.newPage();

    // tab2をアクティブに
    await tab2.bringToFront();

    await setExtensionSettings(context, {
      newTab: { position: "last", openInBackground: true },
    });

    const beforeState = await getTabState(serviceWorker);
    const originalActiveIndex = beforeState.activeTabIndex;

    await createTabViaServiceWorker(serviceWorker);

    // 新しいタブは最後に作成され、元のタブがアクティブのままであるべき
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      // 元のタブがアクティブのまま（位置は変わらない）
      expect(state.activeTabIndex).toBe(originalActiveIndex);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  test("should open new tab to the right in background", async ({ context, serviceWorker }) => {
    // 3つのタブを作成
    await context.newPage();
    const tab2 = await context.newPage();
    await context.newPage();

    // tab2（インデックス1）をアクティブに
    await tab2.bringToFront();

    await setExtensionSettings(context, {
      newTab: { position: "right", openInBackground: true },
    });

    const beforeState = await getTabState(serviceWorker);
    const originalActiveIndex = beforeState.activeTabIndex;

    await createTabViaServiceWorker(serviceWorker);

    // 新しいタブは現在のタブの右側に作成され、元のタブがアクティブのままであるべき
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      // 元のタブがアクティブのまま（位置は変わらない）
      expect(state.activeTabIndex).toBe(originalActiveIndex);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  test("should open new tab to the left in background", async ({ context, serviceWorker }) => {
    // 3つのタブを作成
    await context.newPage();
    const tab2 = await context.newPage();
    await context.newPage();

    // tab2（インデックス1）をアクティブに
    await tab2.bringToFront();

    await setExtensionSettings(context, {
      newTab: { position: "left", openInBackground: true },
    });

    const beforeState = await getTabState(serviceWorker);
    const originalActiveIndex = beforeState.activeTabIndex;

    await createTabViaServiceWorker(serviceWorker);

    // 新しいタブは現在のタブの左側に作成され、元のタブがアクティブのままであるべき
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      // 元のタブがアクティブのまま（新しいタブが左に挿入されたため+1）
      expect(state.activeTabIndex).toBe(originalActiveIndex + 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  test("should open new tab at default position in background", async ({
    context,
    serviceWorker,
  }) => {
    // 3つのタブを作成
    await context.newPage();
    const tab2 = await context.newPage();
    await context.newPage();

    // tab2をアクティブに
    await tab2.bringToFront();

    await setExtensionSettings(context, {
      newTab: { position: "default", openInBackground: true },
    });

    const beforeState = await getTabState(serviceWorker);
    const originalActiveIndex = beforeState.activeTabIndex;

    await createTabViaServiceWorker(serviceWorker);

    // デフォルトでは、新しいタブは最後に作成され、元のタブがアクティブのままであるべき
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      // 元のタブがアクティブのまま（位置は変わらない）
      expect(state.activeTabIndex).toBe(originalActiveIndex);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  test("should maintain active tab when opening multiple tabs in background", async ({
    context,
    serviceWorker,
  }) => {
    // 2つのタブを作成
    await context.newPage();
    const tab2 = await context.newPage();

    // tab2をアクティブに
    await tab2.bringToFront();

    await setExtensionSettings(context, {
      newTab: { position: "right", openInBackground: true },
    });

    const beforeState = await getTabState(serviceWorker);
    const originalActiveIndex = beforeState.activeTabIndex;

    // 3つのタブを連続でバックグラウンドで作成
    await createTabViaServiceWorker(serviceWorker);
    await createTabViaServiceWorker(serviceWorker);
    await createTabViaServiceWorker(serviceWorker);

    // すべてのタブがバックグラウンドで作成され、元のタブがアクティブのままであるべき
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 3);
      // 元のタブがアクティブのまま（位置は変わらない、右側に追加されるため）
      expect(state.activeTabIndex).toBe(originalActiveIndex);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  test("should keep original tab active with edge positions in background", async ({
    context,
    serviceWorker,
  }) => {
    // エッジケース：最初のタブでleftポジション、最後のタブでrightポジション

    // Step 1: 最初のタブでleftポジションをテスト
    const tab1 = await context.newPage();
    await context.newPage();
    await context.newPage();

    // 最初のタブをアクティブに
    await tab1.bringToFront();

    await setExtensionSettings(context, {
      newTab: { position: "left", openInBackground: true },
    });

    const beforeState1 = await getTabState(serviceWorker);
    await createTabViaServiceWorker(serviceWorker);

    // 最初のタブの左側は存在しないので、同じ位置に作成され、元のタブがアクティブのまま
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState1.totalTabs + 1);
      // 元のタブがアクティブのまま（左に新しいタブが挿入されたため+1）
      expect(state.activeTabIndex).toBe(beforeState1.activeTabIndex + 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });

    // Step 2: 最後のタブでrightポジションをテスト
    const pages = context.pages();
    const lastTab = pages[pages.length - 1];
    await lastTab.bringToFront();

    await setExtensionSettings(context, {
      newTab: { position: "right", openInBackground: true },
    });

    const beforeState2 = await getTabState(serviceWorker);
    await createTabViaServiceWorker(serviceWorker);

    // 最後のタブの右側は新しい最後のタブになり、元のタブがアクティブのまま
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState2.totalTabs + 1);
      // 元のタブがアクティブのまま（右側に追加されるため位置は変わらない）
      expect(state.activeTabIndex).toBe(beforeState2.activeTabIndex);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });
});
