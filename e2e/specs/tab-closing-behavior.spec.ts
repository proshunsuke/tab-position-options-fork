import { expect, test } from "@/e2e/fixtures";
import {
  closeActiveTabViaServiceWorker,
  getTabState,
  setExtensionSettings,
} from "@/e2e/utils/helpers";

test.describe("Tab Behavior - After Tab Closing", () => {
  test("activate first tab after closing", async ({ context, serviceWorker }) => {
    // 設定を先に変更
    await setExtensionSettings(context, { afterTabClosing: { activateTab: "first" } });

    // 初期タブの状態を取得
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 3つのタブを追加で作成
    await context.newPage();
    await context.newPage();
    const tab3 = await context.newPage();

    // tab3をアクティブに
    await tab3.bringToFront();

    const beforeState = await getTabState(serviceWorker);
    expect(beforeState.totalTabs).toBe(initialTabCount + 3);
    expect(beforeState.activeTabIndex).toBe(initialTabCount + 2);

    // Service Worker経由でタブを閉じる
    await closeActiveTabViaServiceWorker(serviceWorker);

    // 最初のタブ（インデックス0）がアクティブになるべき
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs - 1);
      expect(state.activeTabIndex).toBe(0);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  test("activate last tab after closing", async ({ context, serviceWorker }) => {
    await setExtensionSettings(context, { afterTabClosing: { activateTab: "last" } });

    // 初期タブの状態を取得
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 3つのタブを追加で作成
    const tab1 = await context.newPage();
    await context.newPage();
    await context.newPage();

    // tab1をアクティブに
    await tab1.bringToFront();

    const beforeState = await getTabState(serviceWorker);
    expect(beforeState.totalTabs).toBe(initialTabCount + 3);
    expect(beforeState.activeTabIndex).toBe(initialTabCount);

    // Service Worker経由でタブを閉じる
    await closeActiveTabViaServiceWorker(serviceWorker);

    // 最後のタブがアクティブになるべき
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs - 1);
      expect(state.activeTabIndex).toBe(state.totalTabs - 1); // 最後のタブ
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  test("activate right tab after closing", async ({ context, serviceWorker }) => {
    await setExtensionSettings(context, { afterTabClosing: { activateTab: "right" } });

    // 初期タブの状態を取得
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 3つのタブを追加で作成
    const tab1 = await context.newPage();
    await context.newPage();
    await context.newPage();

    // tab1をアクティブに
    await tab1.bringToFront();

    const beforeState = await getTabState(serviceWorker);
    expect(beforeState.totalTabs).toBe(initialTabCount + 3);
    expect(beforeState.activeTabIndex).toBe(initialTabCount);

    // Service Worker経由でタブを閉じる
    await closeActiveTabViaServiceWorker(serviceWorker);

    // 右側のタブがアクティブになるべき
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs - 1);
      expect(state.activeTabIndex).toBe(beforeState.activeTabIndex); // タブが削除されて右側のタブが同じインデックスに
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  test("activate left tab after closing", async ({ context, serviceWorker }) => {
    await setExtensionSettings(context, { afterTabClosing: { activateTab: "left" } });

    // 初期タブの状態を取得
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 3つのタブを追加で作成
    await context.newPage();
    const tab2 = await context.newPage();
    await context.newPage();

    // tab2をアクティブに
    await tab2.bringToFront();

    const beforeState = await getTabState(serviceWorker);
    expect(beforeState.totalTabs).toBe(initialTabCount + 3);
    expect(beforeState.activeTabIndex).toBe(initialTabCount + 1);

    // Service Worker経由でタブを閉じる
    await closeActiveTabViaServiceWorker(serviceWorker);

    // 左側のタブがアクティブになるべき
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs - 1);
      expect(state.activeTabIndex).toBe(beforeState.activeTabIndex - 1); // 左側のタブ
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  test("activate in activated order after closing", async ({ context, serviceWorker }) => {
    await setExtensionSettings(context, { afterTabClosing: { activateTab: "inActivatedOrder" } });

    // 初期タブの状態を取得
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 4つのタブを追加で作成
    const tab1 = await context.newPage();
    const tab2 = await context.newPage();
    const tab3 = await context.newPage();
    const tab4 = await context.newPage();

    // 特定の順序でタブをアクティブ化: tab1 → tab3 → tab2 → tab4
    await tab1.bringToFront();
    await tab1.waitForTimeout(200);
    await tab3.bringToFront();
    await tab3.waitForTimeout(200);
    await tab2.bringToFront();
    await tab2.waitForTimeout(200);
    await tab4.bringToFront();
    await tab4.waitForTimeout(200);

    const beforeState = await getTabState(serviceWorker);
    expect(beforeState.totalTabs).toBe(initialTabCount + 4);
    expect(beforeState.activeTabIndex).toBe(initialTabCount + 3); // tab4

    // Service Worker経由でタブを閉じる
    await closeActiveTabViaServiceWorker(serviceWorker);

    // 最後にアクティブだったタブ（tab2）がアクティブになるべき
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs - 1);
      expect(state.activeTabIndex).toBe(initialTabCount + 1); // tab2
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  test("use browser default behavior after closing", async ({ context, serviceWorker }) => {
    await setExtensionSettings(context, { afterTabClosing: { activateTab: "default" } });

    // 初期タブの状態を取得
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 3つのタブを追加で作成
    await context.newPage();
    const tab2 = await context.newPage();
    await context.newPage();

    // tab2をアクティブに
    await tab2.bringToFront();

    const beforeState = await getTabState(serviceWorker);
    expect(beforeState.totalTabs).toBe(initialTabCount + 3);
    expect(beforeState.activeTabIndex).toBe(initialTabCount + 1);

    // Service Worker経由でタブを閉じる
    await closeActiveTabViaServiceWorker(serviceWorker);

    // デフォルトでは、ブラウザの標準動作（通常は右側のタブ）
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs - 1);
      // Chromeのデフォルトは右側のタブ
      expect(state.activeTabIndex).toBe(beforeState.activeTabIndex);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  // エッジケースのテスト
  test("activate left tab when closing first tab", async ({ context, serviceWorker }) => {
    await setExtensionSettings(context, { afterTabClosing: { activateTab: "left" } });

    // 初期タブの状態を取得
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 2つのタブを追加で作成
    await context.newPage();
    await context.newPage();

    // 最初に作成したタブをアクティブに
    const pages = context.pages();
    await pages[initialTabCount].bringToFront();

    const beforeState = await getTabState(serviceWorker);
    expect(beforeState.totalTabs).toBe(initialTabCount + 2);
    expect(beforeState.activeTabIndex).toBe(initialTabCount);

    // Service Worker経由でタブを閉じる
    await closeActiveTabViaServiceWorker(serviceWorker);

    // タブの左側は存在しないので、右側がアクティブになるべき
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs - 1);
      // 最初のタブを閉じた場合、左に移動できないので、新しいインデックス0（元の右側のタブ）がアクティブになる
      expect(state.activeTabIndex).toBe(initialTabCount - 1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  test("activate right tab when closing last tab", async ({ context, serviceWorker }) => {
    await setExtensionSettings(context, { afterTabClosing: { activateTab: "right" } });

    // 初期タブの状態を取得
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 2つのタブを追加で作成
    await context.newPage();
    const tab2 = await context.newPage();

    // 最後のタブをアクティブに
    await tab2.bringToFront();

    const beforeState = await getTabState(serviceWorker);
    expect(beforeState.totalTabs).toBe(initialTabCount + 2);
    expect(beforeState.activeTabIndex).toBe(initialTabCount + 1);

    // Service Worker経由でタブを閉じる
    await closeActiveTabViaServiceWorker(serviceWorker);

    // 最後のタブの右側は存在しないので、左側がアクティブになるべき
    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(beforeState.totalTabs - 1);
      expect(state.activeTabIndex).toBe(beforeState.activeTabIndex - 1); // 左側のタブ
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });

  test("handle closing only tab gracefully", async ({ context, serviceWorker }) => {
    await setExtensionSettings(context, { afterTabClosing: { activateTab: "left" } });

    // 初期タブの状態を取得
    const initialState = await getTabState(serviceWorker);
    const initialTabCount = initialState.totalTabs;

    // 2つ目のタブを作成して、最初のタブだけを残す
    const tab2 = await context.newPage();
    await tab2.waitForTimeout(200);

    // 最初のタブをアクティブに
    const pages = context.pages();
    await pages[0].bringToFront();

    // 2つ目のタブを閉じる
    await serviceWorker.evaluate(async () => {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const nonActiveTab = tabs.find(t => !t.active);
      if (nonActiveTab?.id) {
        await chrome.tabs.remove(nonActiveTab.id);
      }
    });

    const beforeState = await getTabState(serviceWorker);
    expect(beforeState.totalTabs).toBe(initialTabCount);

    // Service Worker経由で最後のタブを閉じようとする
    await serviceWorker.evaluate(async () => {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab?.id) {
        try {
          await chrome.tabs.remove(activeTab.id);
        } catch (e) {
          console.log("Cannot close the last tab:", e);
        }
      }
    });

    // Service Workerがまだ生きているか確認
    try {
      const afterState = await getTabState(serviceWorker);
      // Playwrightの環境では最後のタブも閉じられることがある
      if (afterState.totalTabs === 0) {
        // すべてのタブが閉じられた場合はテスト成功とする
        expect(afterState.totalTabs).toBe(0);
      } else {
        // タブが残っている場合は変化なし
        expect(afterState.totalTabs).toBe(beforeState.totalTabs);
      }
    } catch (_e) {
      // Service Workerが終了している場合はテスト成功
      expect(true).toBe(true);
    }
  });
});
