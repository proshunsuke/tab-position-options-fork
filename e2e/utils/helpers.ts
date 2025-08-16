import type { BrowserContext, Worker } from "@playwright/test";
import type { Settings } from "@/src/types";
import { defaultSettings } from "@/src/types";

/**
 * Service Workerが利用可能になるまで待機
 */
export const waitForServiceWorker = async (context: BrowserContext): Promise<Worker> => {
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

// グローバル型定義
declare global {
  // biome-ignore lint/suspicious/noExplicitAny: テスト用のグローバル変数のため
  var __simpleStorageTestHelpers: any;
}

/**
 * Service Workerの再起動をシミュレート
 * メモリキャッシュをクリアして、ストレージからの再読み込みを強制
 */
export const simulateServiceWorkerRestart = async (serviceWorker: Worker): Promise<void> => {
  // メモリキャッシュをクリア
  await serviceWorker.evaluate(() => {
    // simpleStorageのメモリキャッシュをクリア
    if (globalThis.__simpleStorageTestHelpers) {
      globalThis.__simpleStorageTestHelpers.clearMemoryCache();
    }

    // sessionRestoreDetectorの状態もリセット
    if (globalThis.__testExports) {
      globalThis.__testExports.defaultDetector.__testHelpers.resetState();
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
    if (globalThis.__simpleStorageTestHelpers) {
      return {
        size: globalThis.__simpleStorageTestHelpers.getMemoryCacheSize(),
        keys: globalThis.__simpleStorageTestHelpers.getMemoryCacheKeys(),
        hasLastActiveTab: globalThis.__simpleStorageTestHelpers.hasInMemoryCache("lastActiveTabId"),
        hasTabIndexCache: globalThis.__simpleStorageTestHelpers.hasInMemoryCache("tabIndexCache"),
        hasSettings: globalThis.__simpleStorageTestHelpers.hasInMemoryCache("settings"),
      };
    }
    return null;
  });
};
