import type { BrowserContext, Worker } from "@playwright/test";
import type { Settings } from "@/src/types";
import { defaultSettings } from "@/src/types";

/**
 * Service Workerが利用可能になるまで待機
 */
export const waitForServiceWorker = async (context: BrowserContext) => {
  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent("serviceworker");
  }

  // Service Workerがアクティブになるまで待機
  await serviceWorker.evaluate(() => {
    return new Promise<void>(resolve => {
      // @ts-ignore
      if (self.serviceWorker && self.serviceWorker.state !== "activated") {
        // @ts-ignore
        self.serviceWorker.addEventListener("statechange", () => {
          // @ts-ignore
          if (self.serviceWorker.state === "activated") {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  });

  return serviceWorker;
};

/**
 * 拡張機能の設定を直接保存する（Service Worker経由）
 */
export const setExtensionSettings = async (
  context: BrowserContext,
  settings: Partial<Settings>,
) => {
  // Service Workerを取得
  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent("serviceworker");
  }

  // Service Worker内で設定を保存
  await serviceWorker.evaluate(async settings => {
    await chrome.storage.local.set({ settings });
  }, settings);
};

/**
 * タブの状態を取得する（Service Worker経由）
 */
export const getTabState = async (serviceWorker: Worker) =>
  serviceWorker.evaluate(async () => {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const activeTab = tabs.find(t => t.active);
    return {
      totalTabs: tabs.length,
      activeTabIndex: activeTab?.index ?? -1,
    };
  });

/**
 * Service Worker経由で新しいタブを作成する
 */
export const createTabViaServiceWorker = async (serviceWorker: Worker) =>
  serviceWorker.evaluate(async () => {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const newTab = await chrome.tabs.create({
      active: true,
      openerTabId: activeTab?.id,
    });
    return {
      newTabId: newTab.id,
      newTabIndex: newTab.index,
      openerTabId: newTab.openerTabId,
    };
  });

/**
 * Service Worker経由で外部アプリケーションからのタブ開放をシミュレート
 * openerTabIdがない状態でタブを作成
 */
export const createExternalTabViaServiceWorker = async (serviceWorker: Worker) =>
  serviceWorker.evaluate(async () => {
    const newTab = await chrome.tabs.create({
      active: true,
      // openerTabIdを意図的に設定しない（外部タブの特徴）
    });
    return {
      newTabId: newTab.id,
      newTabIndex: newTab.index,
      openerTabId: newTab.openerTabId, // undefined になるはず
    };
  });

/**
 * 外部アプリケーションからのタブ作成時に発生するレースコンディションを再現
 *
 * ⚠️ 警告: これは非常に特殊なテストヘルパーです
 *
 * 背景:
 * - 外部アプリ（VSCode、Slack等）からリンクを開くと、Chromeは特殊な順序でイベントを発火
 * - 通常: onCreated → onActivated の順
 * - 外部アプリ: onActivated → onCreated の順（レースコンディション）
 * - この順序の違いにより、lastActiveTabIdが新規タブ自身のIDになってしまう
 *
 * 実装の詳細:
 * - Chrome Extension APIではイベントを直接発火できない
 * - そのため、イベントリスナーを一時的に削除し、手動で関数を実行
 * - chrome.tabs.create()による通常のイベント発火と手動実行の二重実行を防ぐ
 *
 * 注意:
 * - handler.tsの実装（関数名等）が変わった場合、このテストも更新が必要
 * - イベントリスナーの削除・再登録の間に実際のイベントが発生すると見逃す可能性がある
 *
 * @param serviceWorker - Service Workerのインスタンス
 * @returns 作成されたタブの情報
 */
export const createExternalTabWithRaceCondition = async (serviceWorker: Worker) =>
  serviceWorker.evaluate(async () => {
    // グローバルに公開されたテスト用エクスポートから関数を取得
    if (!globalThis.__testExports?.tabHandlers) {
      throw new Error(
        "Tab handlers not found in test exports. Make sure test environment is set up.",
      );
    }

    const { handleTabActivated, handleNewTab, onCreated, onActivated } =
      globalThis.__testExports.tabHandlers;

    // 一時的にイベントリスナーを削除（二重実行を防ぐため）
    onCreated.removeListener(handleNewTab);
    onActivated.removeListener(handleTabActivated);

    try {
      // 新規タブを作成（イベントリスナーが削除されているため、handleNewTab/handleTabActivatedは呼ばれない）
      const newTab = await chrome.tabs.create({
        active: true,
      });

      // 外部アプリからのタブ作成時の動作を再現：
      // Step 1: onActivatedが先に発火（これによりlastActiveTabIdが新規タブ自身のIDになる）
      await handleTabActivated({
        tabId: newTab.id!,
        windowId: newTab.windowId,
      });

      // Step 2: その後onCreatedが発火
      await handleNewTab(newTab);

      return {
        newTabId: newTab.id,
        newTabIndex: newTab.index,
        openerTabId: newTab.openerTabId, // undefined のはず
      };
    } finally {
      // 必ずイベントリスナーを復元
      onCreated.addListener(handleNewTab);
      onActivated.addListener(handleTabActivated);
    }
  });

/**
 * Service Worker経由でアクティブなタブを閉じる
 */
export const closeActiveTabViaServiceWorker = async (serviceWorker: Worker) =>
  serviceWorker.evaluate(async () => {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id) {
      await chrome.tabs.remove(activeTab.id);
      return true;
    }
    return false;
  });

/**
 * 拡張機能のストレージをクリアしてデフォルト設定に戻す
 */
export const clearExtensionStorage = async (serviceWorker: Worker) => {
  await serviceWorker.evaluate(async defaultSettings => {
    // chrome.storage.localとsessionを完全にクリア
    await chrome.storage.local.clear();
    await chrome.storage.session.clear();

    // デフォルト設定を復元
    await chrome.storage.local.set({ settings: defaultSettings });
  }, defaultSettings);
};

// グローバル型定義は src/test/types.d.ts で一元管理

/**
 * Service Workerの再起動をシミュレート
 * メモリキャッシュをクリアして、ストレージからの再読み込みを強制
 */
export const simulateServiceWorkerRestart = async (serviceWorker: Worker) => {
  // メモリキャッシュをクリア
  await serviceWorker.evaluate(() => {
    // simpleStorageのメモリキャッシュをクリア（後方互換性のため両方チェック）
    if (globalThis.__testExports?.simpleStorage) {
      globalThis.__testExports.simpleStorage.clearMemoryCache();
    } else if (globalThis.__simpleStorageTestHelpers) {
      globalThis.__simpleStorageTestHelpers.clearMemoryCache();
    }

    // sessionRestoreDetectorの状態もリセット
    if (globalThis.__testExports?.sessionRestore) {
      globalThis.__testExports.sessionRestore.defaultDetector.__testHelpers.resetState();
    }
  });

  // ストレージから状態を再読み込みする時間を確保
  await new Promise(resolve => setTimeout(resolve, 100));
};

/**
 * メモリキャッシュの状態を確認
 */
export const getMemoryCacheState = async (serviceWorker: Worker) => {
  return serviceWorker.evaluate(() => {
    // 新しい構造を優先、後方互換性のためフォールバック
    const helpers =
      globalThis.__testExports?.simpleStorage || globalThis.__simpleStorageTestHelpers;

    if (helpers) {
      return {
        size: helpers.getMemoryCacheSize(),
        keys: helpers.getMemoryCacheKeys(),
        hasLastActiveTab: helpers.hasInMemoryCache("lastActiveTabId"),
        hasTabIndexCache: helpers.hasInMemoryCache("tabIndexCache"),
        hasSettings: helpers.hasInMemoryCache("settings"),
      };
    }
    return null;
  });
};
