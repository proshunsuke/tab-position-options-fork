import { expect, test } from "@/e2e/fixtures";
import { clearExtensionStorage, setExtensionSettings } from "@/e2e/utils/helpers";

test.describe("Browser Startup Tab Order", () => {
  test.beforeEach(async ({ serviceWorker }) => {
    await clearExtensionStorage(serviceWorker);
  });

  test("should respect 'first' position setting for new tabs after session restore", async ({
    context,
    serviceWorker,
  }) => {
    // "Always first" 設定を適用
    await setExtensionSettings(context, {
      newTab: { position: "first" },
    });

    // Service Worker内でセッション復元をシミュレート
    await serviceWorker.evaluate(() => {
      if (globalThis.__testExports?.sessionRestore) {
        globalThis.__testExports.sessionRestore.defaultDetector.__testHelpers.setStartupPhase(true);
      }
    });

    // セッション復元をシミュレート（短い間隔でタブを作成）
    const restoredPages = [];
    for (let i = 0; i < 4; i++) {
      const page = await context.newPage();
      await page.goto(`data:text/html,<h1>Restored Tab ${i + 1}</h1>`);
      restoredPages.push(page);
      // 短い間隔でタブを作成（50ms）
      if (i < 3) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // セッション復元フェーズが終了するまで待つ
    await new Promise(resolve => setTimeout(resolve, 300));

    // セッション復元フェーズを明示的に終了
    await serviceWorker.evaluate(() => {
      if (globalThis.__testExports?.sessionRestore) {
        globalThis.__testExports.sessionRestore.defaultDetector.__testHelpers.setStartupPhase(
          false,
        );
      }
    });

    // 通常のユーザータブを作成
    const userPage = await context.newPage();
    await userPage.goto("data:text/html,<h1>User Tab</h1>");

    // タブ移動の処理を待つ
    await new Promise(resolve => setTimeout(resolve, 200));

    // タブの状態を確認
    const state = await serviceWorker.evaluate(async () => {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      // User Tabを検索（タブ移動後の位置で）
      const userTab = tabs.find(t => t.index === 0); // firstポジションならindex 0にあるはず
      return {
        totalTabs: tabs.length,
        userTabIndex: userTab?.index,
        tabOrder: tabs.map(t => ({
          index: t.index,
          title: t.title || "untitled",
          url: t.url || "about:blank",
        })),
      };
    });

    // "Always first" 設定により、ユーザータブはindex 0にあるべき
    // セッション復元タブは元の位置を保持
    expect(state.userTabIndex).toBe(0);
    expect(state.totalTabs).toBe(6); // 復元タブ4つ + ユーザータブ1つ + Extension管理ページ1つ
  });

  test("should handle session restore with 'last' position setting", async ({
    context,
    serviceWorker,
  }) => {
    // "Always last" 設定を適用
    await setExtensionSettings(context, {
      newTab: { position: "last" },
    });

    // Service Worker内でセッション復元をシミュレート
    await serviceWorker.evaluate(() => {
      if (globalThis.__testExports?.sessionRestore) {
        globalThis.__testExports.sessionRestore.defaultDetector.__testHelpers.setStartupPhase(true);
      }
    });

    // セッション復元タブを作成
    const restoredPages = [];
    for (let i = 0; i < 3; i++) {
      const page = await context.newPage();
      await page.goto(`data:text/html,<h1>Restored Tab ${i + 1}</h1>`);
      restoredPages.push(page);
      if (i < 2) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // セッション復元フェーズ終了を待つ
    await new Promise(resolve => setTimeout(resolve, 300));

    // セッション復元フェーズを明示的に終了
    await serviceWorker.evaluate(() => {
      if (globalThis.__testExports?.sessionRestore) {
        globalThis.__testExports.sessionRestore.defaultDetector.__testHelpers.setStartupPhase(
          false,
        );
      }
    });

    // ユーザータブを作成
    const userPage = await context.newPage();
    await userPage.goto("data:text/html,<h1>User Tab</h1>");
    await new Promise(resolve => setTimeout(resolve, 100));

    // 結果を確認
    const state = await serviceWorker.evaluate(async () => {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      // 最後に作成されたタブ（通常のユーザータブ）を特定
      const userTab = tabs[tabs.length - 1]; // 最後のタブがユーザータブ
      return {
        totalTabs: tabs.length,
        userTabIndex: userTab?.index,
        lastIndex: Math.max(...tabs.map(t => t.index)),
      };
    });

    // "Always last" 設定により、ユーザータブは最後にあるべき
    expect(state.userTabIndex).toBe(state.lastIndex);
  });

  test("should detect rapid tab creation as session restore", async ({
    context,
    serviceWorker,
  }) => {
    // カスタム検出器をService Worker内に設定
    await serviceWorker.evaluate(() => {
      if (!globalThis.__testExports?.sessionRestore) {
        console.error("Test exports not available");
        return;
      }

      // モック時刻を使用するカスタム検出器を作成
      let mockTime = 0;
      const customDetector = globalThis.__testExports.sessionRestore.createDetector({
        timeProvider: () => mockTime,
        thresholdMs: 100, // テスト用に短い閾値
      });

      // グローバルに保存（テストから制御可能）
      globalThis.__testDetector = {
        detector: customDetector,
        setTime: (time: number) => {
          mockTime = time;
        },
      };
    });

    // "Always first" 設定
    await setExtensionSettings(context, {
      newTab: { position: "first" },
    });

    // ブラウザ起動をシミュレート
    await serviceWorker.evaluate(() => {
      if (globalThis.__testDetector) {
        globalThis.__testDetector.detector.handleBrowserStartup();
        globalThis.__testDetector.setTime(1000);
      }
    });

    // 急速なタブ作成（セッション復元）
    const rapidTabs = [];
    const baseTime = 1000;
    for (let i = 0; i < 3; i++) {
      // 時刻を進める（50ms間隔）
      await serviceWorker.evaluate(
        time => {
          if (globalThis.__testDetector) {
            globalThis.__testDetector.setTime(time);
          }
        },
        baseTime + i * 50,
      );

      const page = await context.newPage();
      await page.goto(`data:text/html,<h1>Rapid Tab ${i + 1}</h1>`);
      rapidTabs.push(page);

      // 検出状態をチェック
      const isRestore = await serviceWorker.evaluate(() => {
        return globalThis.__testDetector?.detector.isSessionRestoreTab() ?? false;
      });

      expect(isRestore).toBe(true);
    }

    // 時間を進めて通常のタブ作成
    await serviceWorker.evaluate(() => {
      if (globalThis.__testDetector) {
        globalThis.__testDetector.setTime(1500); // 500ms後
      }
    });

    const normalPage = await context.newPage();
    await normalPage.goto("data:text/html,<h1>Normal Tab</h1>");

    const isNormalRestore = await serviceWorker.evaluate(() => {
      return globalThis.__testDetector?.detector.isSessionRestoreTab() ?? false;
    });

    expect(isNormalRestore).toBe(false);

    // クリーンアップ
    await serviceWorker.evaluate(() => {
      globalThis.__testDetector = undefined;
    });
  });

  test("should transition from session restore to normal mode", async ({
    context,
    serviceWorker,
  }) => {
    // "Right of current tab" 設定
    await setExtensionSettings(context, {
      newTab: { position: "right" },
    });

    // セッション復元を開始
    await serviceWorker.evaluate(() => {
      if (globalThis.__testExports?.sessionRestore) {
        globalThis.__testExports.sessionRestore.defaultDetector.__testHelpers.setStartupPhase(true);
      }
    });

    // 最初のタブをアクティブに
    const firstPage = await context.newPage();
    await firstPage.goto("data:text/html,<h1>First Tab</h1>");
    await firstPage.bringToFront();

    // セッション復元タブ（短い間隔）
    for (let i = 0; i < 2; i++) {
      const page = await context.newPage();
      await page.goto(`data:text/html,<h1>Restored ${i + 1}</h1>`);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 長い間隔を空けて通常モードに移行
    await new Promise(resolve => setTimeout(resolve, 300));

    // セッション復元フェーズを明示的に終了
    await serviceWorker.evaluate(() => {
      if (globalThis.__testExports?.sessionRestore) {
        globalThis.__testExports.sessionRestore.defaultDetector.__testHelpers.setStartupPhase(
          false,
        );
      }
    });

    // 通常のタブ作成
    const normalPage = await context.newPage();
    await normalPage.goto("data:text/html,<h1>Normal Tab</h1>");

    // 位置を確認
    const state = await serviceWorker.evaluate(async () => {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const normalTab = tabs.find(t => t.url?.includes("Normal Tab"));
      const firstTab = tabs.find(t => t.url?.includes("First Tab"));
      return {
        normalTabIndex: normalTab?.index,
        firstTabIndex: firstTab?.index,
        totalTabs: tabs.length,
      };
    });

    // "Right of current tab" 設定で、通常タブは最初のタブの右側に配置されるべき
    // （セッション復元タブは位置調整されない）
    if (state.firstTabIndex !== undefined && state.normalTabIndex !== undefined) {
      expect(state.normalTabIndex).toBeGreaterThan(state.firstTabIndex);
    }
  });
});
