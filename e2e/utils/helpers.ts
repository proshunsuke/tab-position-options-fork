import type { BrowserContext, Worker } from "@playwright/test";
import type { Settings } from "@/src/types";

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
