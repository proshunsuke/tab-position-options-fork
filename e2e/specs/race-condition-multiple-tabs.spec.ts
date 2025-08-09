import { expect, test } from "@/e2e/fixtures";
import { setExtensionSettings } from "@/e2e/utils/helpers";

test.describe("Race Condition - Multiple Tab Closure", () => {
  test("should handle multiple tabs closing simultaneously without race conditions", async ({
    context,
    serviceWorker,
  }) => {
    // "Left Tab" アクティベーション動作を設定
    await setExtensionSettings(context, {
      afterTabClosing: { activateTab: "left" },
    });

    // 複数タブを作成
    const pages = [];
    for (let i = 0; i < 6; i++) {
      const page = await context.newPage();
      await page.goto(`data:text/html,<h1>Tab ${i + 1}</h1>`);
      pages.push(page);
    }

    // Tab 3 (pages[2]) をアクティブにする
    await pages[2].bringToFront();
    await new Promise(resolve => setTimeout(resolve, 200));

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

    // すべてのタブが閉じられイベントハンドラーが処理されるのを待つ
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 最終状態を確認
    const finalState = await serviceWorker.evaluate(async () => {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const activeTab = tabs.find(t => t.active);
      return {
        totalTabs: tabs.length,
        activeTabIndex: activeTab?.index,
        activeTabId: activeTab?.id,
        tabIndices: tabs.map(t => t.index).sort((a, b) => a - b),
      };
    });

    // タブが閉じられたことを確認
    const expectedRemainingTabs = activeIndex + 1; // アクティブタブまでのタブ
    expect(finalState.totalTabs).toBe(expectedRemainingTabs);

    // "left"設定での期待される動作：
    // アクティブタブが閉じられなかった場合、アクティブのまま残るはず
    // しかしレースコンディションのため、動作が予測不能になる可能性がある

    // レースコンディションのテスト：複数のハンドラーが競合した場合、
    // アクティブタブが期待通りでない可能性がある
    expect(finalState.activeTabIndex).toBe(activeIndex); // 同じアクティブタブのままのはず
  });

  test("should maintain consistent state when closing all tabs to the right", async ({
    context,
    serviceWorker,
  }) => {
    // "In activated order" の動作を設定（アクティベーション履歴に依存）
    await setExtensionSettings(context, {
      afterTabClosing: { activateTab: "inActivatedOrder" },
    });

    // タブを作成してアクティベーション履歴を構築
    const pages = [];
    for (let i = 0; i < 5; i++) {
      const page = await context.newPage();
      await page.goto(`data:text/html,<h1>Tab ${i + 1}</h1>`);
      pages.push(page);
    }

    // 特定のアクティベーション履歴を構築: Tab 0 -> Tab 2 -> Tab 4 -> Tab 1
    await pages[0].bringToFront();
    await new Promise(resolve => setTimeout(resolve, 100));
    await pages[2].bringToFront();
    await new Promise(resolve => setTimeout(resolve, 100));
    await pages[4].bringToFront();
    await new Promise(resolve => setTimeout(resolve, 100));
    await pages[1].bringToFront();
    await new Promise(resolve => setTimeout(resolve, 100));

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

    await new Promise(resolve => setTimeout(resolve, 1000));

    const finalState = await serviceWorker.evaluate(async () => {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const activeTab = tabs.find(t => t.active);
      return {
        totalTabs: tabs.length,
        activeTabIndex: activeTab?.index,
      };
    });

    // レースコンディションにより、アクティベーション履歴が破損する可能性がある
    // 期待値: アクティブタブは閉じられていないのでアクティブのまま
    // 実際: レースコンディションのため予測不能になる可能性がある
    const expectedRemainingTabs = activeIndex + 1;
    expect(finalState.totalTabs).toBe(expectedRemainingTabs);
    expect(finalState.activeTabIndex).toBe(activeIndex); // まだアクティブのはず
  });

  test("should handle rapid successive tab closures", async ({ context, serviceWorker }) => {
    await setExtensionSettings(context, {
      afterTabClosing: { activateTab: "left" },
    });

    // タブを作成
    const pages = [];
    for (let i = 0; i < 5; i++) {
      const page = await context.newPage();
      await page.goto(`data:text/html,<h1>Tab ${i + 1}</h1>`);
      pages.push(page);
    }

    // 最後のタブをアクティブにする
    await pages[4].bringToFront();
    await new Promise(resolve => setTimeout(resolve, 200));

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

    await new Promise(resolve => setTimeout(resolve, 1000));

    const finalState = await serviceWorker.evaluate(async () => {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const activeTab = tabs.find(t => t.active);
      return {
        totalTabs: tabs.length,
        activeTabIndex: activeTab?.index,
      };
    });

    // "left"設定での期待値:
    // 最後のタブを閉じた後、最後から2番目がアクティブになるはず
    // それを閉じた後、次の左タブがアクティブになるはず、以降同様
    // しかしレースコンディションのため、正しく動作しない可能性がある
    const expectedRemainingTabs = tabIds.length - 3; // 3つのタブが閉じられた
    expect(finalState.totalTabs).toBe(expectedRemainingTabs);

    // アクティブタブは残りの最後のタブから1つ左（left tab）のはず
    expect(finalState.activeTabIndex).toBe(expectedRemainingTabs - 1);
  });
});
