import { expect, test } from "@/e2e/fixtures";
import {
  activatePage,
  clearExtensionStorage,
  getTabState,
  setExtensionSettings,
} from "@/e2e/utils/helpers";

test.describe("Race Condition - Multiple Tab Closure", () => {
  test.beforeEach(async ({ serviceWorker }) => {
    await clearExtensionStorage(serviceWorker);
  });
  test("should handle multiple tabs closing simultaneously without race conditions", async ({
    context,
    serviceWorker,
  }) => {
    // 複数タブを作成
    const pages = [];
    for (let i = 0; i < 6; i++) {
      const page = await context.newPage();
      await page.goto(`data:text/html,<h1>Tab ${i + 1}</h1>`);
      pages.push(page);
    }

    // Tab 3 (pages[2]) をアクティブにする
    await activatePage(serviceWorker, pages[2]);

    // "Left Tab" アクティベーション動作を設定
    await setExtensionSettings(context, {
      afterTabClosing: { activateTab: "left" },
    });

    // 初期タブ状態を取得
    const initialState = await serviceWorker.evaluate(async () => {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const activeTab = tabs.find(t => t.active);
      return {
        totalTabs: tabs.length,
        activeTabIndex: activeTab?.index,
        activeTabId: activeTab?.id,
        tabIds: tabs.map(t => ({ id: t.id, index: t.index })),
      };
    });

    // アクティブタブはインデックス3にあるはず（0ベース、初期タブを含む）
    const activeIndex = initialState.activeTabIndex!;

    // アクティブタブより右側のタブを閉じることで「右側のタブを閉じる」をシミュレート
    // これはユーザーが「Close tabs to the right」を使用した場合をシミュレートする
    const tabsToClose = initialState.tabIds.filter(t => t.index > activeIndex).map(t => t.id);

    // レースコンディションを引き起こすため複数タブを同時に閉じる
    await serviceWorker.evaluate(async tabIds => {
      // 待機せずにすべてのタブを一度に閉じる
      const promises = tabIds.map(id => chrome.tabs.remove(id!));

      // ここでawaitしない - 同時に発火させる
      Promise.all(promises).catch(err => console.error("Error closing tabs:", err));

      // レースコンディションをシミュレートするため即座にリターン
      return true;
    }, tabsToClose);

    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(activeIndex + 1);
      expect(state.activeTabIndex).toBe(activeIndex);
    }).toPass({ timeout: 5000 });
  });

  test("should maintain consistent state when closing all tabs to the right", async ({
    context,
    serviceWorker,
  }) => {
    // タブを作成してアクティベーション履歴を構築
    const pages = [];
    for (let i = 0; i < 5; i++) {
      const page = await context.newPage();
      await page.goto(`data:text/html,<h1>Tab ${i + 1}</h1>`);
      pages.push(page);
    }

    // 特定のアクティベーション履歴を構築: Tab 0 -> Tab 2 -> Tab 4 -> Tab 1
    await activatePage(serviceWorker, pages[0]);
    await activatePage(serviceWorker, pages[2]);
    await activatePage(serviceWorker, pages[4]);
    await activatePage(serviceWorker, pages[1]);

    // "In activated order" の動作を設定（アクティベーション履歴に依存）
    await setExtensionSettings(context, {
      afterTabClosing: { activateTab: "inActivatedOrder" },
    });

    // 現在の状態を取得
    const initialState = await serviceWorker.evaluate(async () => {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const activeTab = tabs.find(t => t.active);
      return {
        activeTabIndex: activeTab?.index,
        tabIds: tabs.map(t => ({ id: t.id, index: t.index })),
      };
    });

    const activeIndex = initialState.activeTabIndex!;

    // アクティブタブより右側のタブを閉じる
    const tabsToClose = initialState.tabIds.filter(t => t.index > activeIndex).map(t => t.id);

    // すべてのタブを同時に閉じてレースコンディションをシミュレート
    await serviceWorker.evaluate(async tabIds => {
      // すべてのremoveイベントを一度に発火
      tabIds.forEach(id => {
        chrome.tabs.remove(id!).catch(err => console.error("Error removing tab:", err));
      });
    }, tabsToClose);

    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(activeIndex + 1);
      expect(state.activeTabIndex).toBe(activeIndex);
    }).toPass({ timeout: 5000 });
  });

  test("should handle rapid successive tab closures", async ({ context, serviceWorker }) => {
    // タブを作成
    const pages = [];
    for (let i = 0; i < 5; i++) {
      const page = await context.newPage();
      await page.goto(`data:text/html,<h1>Tab ${i + 1}</h1>`);
      pages.push(page);
    }

    // 最後のタブをアクティブにする
    await activatePage(serviceWorker, pages[4]);

    await setExtensionSettings(context, {
      afterTabClosing: { activateTab: "left" },
    });

    // タブIDを取得
    const tabIds = await serviceWorker.evaluate(async () => {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      return tabs.map(t => t.id);
    });

    // タブを連続して高速に閉じる（同時ではなく、非常に素早く）
    // これはユーザーがタブを1つずつ素早く閉じる場合をシミュレート
    await serviceWorker.evaluate(async ids => {
      // 最後の3つのタブを連続して高速に閉じる
      const totalTabs = ids.length;
      for (let i = totalTabs - 1; i >= totalTabs - 3 && i > 0; i--) {
        chrome.tabs.remove(ids[i]!).catch(err => console.error("Error:", err));
        // 高速クリックをシミュレートする最小遅延
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }, tabIds);

    await expect(async () => {
      const state = await getTabState(serviceWorker);
      expect(state.totalTabs).toBe(tabIds.length - 3);
      expect(state.activeTabIndex).toBe(tabIds.length - 4);
    }).toPass({ timeout: 5000 });
  });
});
