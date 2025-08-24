import { expect, test } from "@/e2e/fixtures";
import {
  clearExtensionStorage,
  createTabViaServiceWorker,
  getTabState,
  setExtensionSettings,
} from "@/e2e/utils/helpers";

test.describe("Tab Behavior - New Tab Position", () => {
  test.beforeEach(async ({ serviceWorker }) => {
    await clearExtensionStorage(serviceWorker);
  });
  test("should open new tab at first position", async ({ context, serviceWorker }) => {
    // 3つのタブを作成
    await context.newPage();
    await context.newPage();
    const tab3 = await context.newPage();

    // tab3をアクティブに
    await tab3.bringToFront();

    await setExtensionSettings(context, { newTab: { position: "first", openInBackground: false } });

    const beforeState = await getTabState(serviceWorker);
    await createTabViaServiceWorker(serviceWorker);

    // 新しいタブは最初（インデックス0）に作成されるべき
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      expect(state.activeTabIndex).toBe(0);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  test("should open new tab at last position", async ({ context, serviceWorker }) => {
    // 3つのタブを作成
    await context.newPage();
    const tab2 = await context.newPage();
    await context.newPage();

    // tab2をアクティブに
    await tab2.bringToFront();

    await setExtensionSettings(context, { newTab: { position: "last", openInBackground: false } });

    const beforeState = await getTabState(serviceWorker);
    await createTabViaServiceWorker(serviceWorker);

    // 新しいタブは最後に作成されるべき
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      expect(state.activeTabIndex).toBe(state.totalTabs - 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  test("should open new tab to the right of current tab", async ({ context, serviceWorker }) => {
    // 3つのタブを作成
    await context.newPage();
    const tab2 = await context.newPage();
    await context.newPage();

    // tab2（インデックス1）をアクティブに
    await tab2.bringToFront();

    await setExtensionSettings(context, { newTab: { position: "right", openInBackground: false } });

    const beforeState = await getTabState(serviceWorker);
    await createTabViaServiceWorker(serviceWorker);

    // 新しいタブは現在のタブの右側に作成されるべき
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      expect(state.activeTabIndex).toBe(beforeState.activeTabIndex + 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  test("should open new tab to the left of current tab", async ({ context, serviceWorker }) => {
    // 3つのタブを作成
    await context.newPage();
    const tab2 = await context.newPage();
    await context.newPage();

    // tab2（インデックス1）をアクティブに
    await tab2.bringToFront();

    await setExtensionSettings(context, { newTab: { position: "left", openInBackground: false } });

    const beforeState = await getTabState(serviceWorker);
    await createTabViaServiceWorker(serviceWorker);

    // 新しいタブは現在のタブの左側に作成されるべき
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      expect(state.activeTabIndex).toBe(beforeState.activeTabIndex);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  test("should open new tab at browser default position", async ({ context, serviceWorker }) => {
    // 3つのタブを作成
    await context.newPage();
    const tab2 = await context.newPage();
    await context.newPage();

    // tab2をアクティブに
    await tab2.bringToFront();

    await setExtensionSettings(context, {
      newTab: { position: "default", openInBackground: false },
    });

    const beforeState = await getTabState(serviceWorker);
    await createTabViaServiceWorker(serviceWorker);

    // デフォルトでは、新しいタブは最後に作成される（ブラウザのデフォルト動作）
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      // デフォルトでは移動しないので、最後に作成される
      expect(state.activeTabIndex).toBe(state.totalTabs - 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  // エッジケースのテスト
  test("should open new tab to the left of first tab", async ({ context, serviceWorker }) => {
    // 2つのタブを作成
    const tab1 = await context.newPage();
    await context.newPage();

    // 最初のタブをアクティブに
    await tab1.bringToFront();

    await setExtensionSettings(context, { newTab: { position: "left", openInBackground: false } });

    const beforeState = await getTabState(serviceWorker);
    await createTabViaServiceWorker(serviceWorker);

    // 最初のタブの左側は存在しないので、同じインデックス（元のアクティブタブの位置）に作成される
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      expect(state.activeTabIndex).toBe(beforeState.activeTabIndex);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  test("should open new tab to the right of last tab", async ({ context, serviceWorker }) => {
    // 3つのタブを作成
    await context.newPage();
    await context.newPage();
    const tab3 = await context.newPage();

    // 最後のタブをアクティブに
    await tab3.bringToFront();

    await setExtensionSettings(context, { newTab: { position: "right", openInBackground: false } });

    const beforeState = await getTabState(serviceWorker);
    await createTabViaServiceWorker(serviceWorker);

    // 最後のタブの右側は新しい最後のタブになる
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs + 1);
      expect(state.activeTabIndex).toBe(beforeState.activeTabIndex + 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });
});
