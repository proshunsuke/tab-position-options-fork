import { type BrowserContext, expect, type Page, type Worker } from "@playwright/test";
import type { TabSnapshot } from "@/src/tabs/state/tabSnapshot";
import type { Settings } from "@/src/types";
import { DEFAULT_SETTINGS } from "@/src/types";

type WindowTabState = {
  windowId: number;
  totalTabs: number;
  activeTabIndex: number;
  activeTabId: number | null;
};

type CurrentWindowTab = {
  id: number;
  index: number;
  active: boolean;
  openerTabId?: number;
};

type TestServiceWorkerQueryState = {
  __testTabQueryCalls?: chrome.tabs.QueryInfo[];
  __testOriginalTabsQuery?: typeof chrome.tabs.query;
  __testFailingTabQueryWindowId?: number | null;
  __testFailingTabQueryMessage?: string | null;
  __testUnhandledRejections?: string[];
  __testUnhandledRejectionListenerInstalled?: boolean;
};

type ServiceWorkerLikeGlobal = WorkerGlobalScope & {
  registration: {
    active: ServiceWorker | null;
  };
};

const SERVICE_WORKER_WAIT_TIMEOUT_MS = 30_000;

export const activatePage = async (serviceWorker: Worker, page: Page) => {
  await page.bringToFront();
  // Chromeのactive状態だけでなく、次の操作・再起動で使う履歴とsnapshotへの反映を待つ。
  await expect(async () => {
    const ready = await serviceWorker.evaluate(async url => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || tab.url !== url) {
        return false;
      }
      const state = await chrome.storage.session.get<{
        tabActivationHistory?: Record<string, number[]>;
        tabSnapshot?: Record<string, TabSnapshot[]>;
      }>(["tabActivationHistory", "tabSnapshot"]);
      return (
        state.tabActivationHistory?.[tab.windowId]?.at(-1) === tab.id &&
        state.tabSnapshot?.[tab.windowId]?.find(snapshot => snapshot.id === tab.id)?.active === true
      );
    }, page.url());
    expect(ready).toBe(true);
  }).toPass({ timeout: 5000 });
};

/**
 * Service Workerが利用可能になるまで待機
 */
export const waitForServiceWorker = async (context: BrowserContext) => {
  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent("serviceworker", {
      timeout: SERVICE_WORKER_WAIT_TIMEOUT_MS,
    });
  }

  // Service Workerがアクティブになるまで待機
  await serviceWorker.evaluate(() => {
    return new Promise<void>(resolve => {
      const serviceWorkerGlobal = self as unknown as ServiceWorkerLikeGlobal;
      const activeWorker = serviceWorkerGlobal.registration.active;
      if (activeWorker && activeWorker.state !== "activated") {
        activeWorker.addEventListener("statechange", () => {
          if (activeWorker.state === "activated") {
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
    serviceWorker = await context.waitForEvent("serviceworker", {
      timeout: SERVICE_WORKER_WAIT_TIMEOUT_MS,
    });
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

export const getCurrentWindowTabs = async (serviceWorker: Worker) =>
  serviceWorker.evaluate(async () => {
    const tabs = (await chrome.tabs.query({ currentWindow: true })).sort(
      (left, right) => left.index - right.index,
    );

    return tabs
      .filter((tab): tab is chrome.tabs.Tab & { id: number } => tab.id !== undefined)
      .map(tab => {
        return {
          id: tab.id,
          index: tab.index,
          active: tab.active,
          openerTabId: tab.openerTabId,
        } satisfies CurrentWindowTab;
      });
  });

export const getCurrentWindowId = async (serviceWorker: Worker) =>
  serviceWorker.evaluate(async () => {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return activeTab?.windowId ?? null;
  });

export const getWindowTabState = async (serviceWorker: Worker, windowId: number) =>
  serviceWorker.evaluate(async windowId => {
    const tabs = (await chrome.tabs.query({ windowId })).sort(
      (left, right) => left.index - right.index,
    );
    const activeTab = tabs.find(tab => tab.active);

    return {
      windowId,
      totalTabs: tabs.length,
      activeTabIndex: activeTab?.index ?? -1,
      activeTabId: activeTab?.id ?? null,
    } satisfies WindowTabState;
  }, windowId);

export const createTabsInWindow = async (serviceWorker: Worker, windowId: number, count: number) =>
  serviceWorker.evaluate(
    async ({ windowId, count }) => {
      const createdTabIds: number[] = [];

      for (let index = 0; index < count; index++) {
        const tab = await chrome.tabs.create({
          windowId,
          url: "about:blank",
          active: false,
        });

        if (tab.id) {
          createdTabIds.push(tab.id);
        }
      }

      return createdTabIds;
    },
    { windowId, count },
  );

export const createWindowWithTabs = async (serviceWorker: Worker, totalTabs: number) => {
  const window = await serviceWorker.evaluate(async totalTabs => {
    const createdWindow = await chrome.windows.create({
      url: "about:blank",
      focused: false,
    });

    if (!createdWindow?.id) {
      throw new Error("Failed to create browser window");
    }

    for (let index = 1; index < totalTabs; index++) {
      await chrome.tabs.create({
        windowId: createdWindow.id,
        url: "about:blank",
        active: false,
      });
    }

    return {
      windowId: createdWindow.id,
    };
  }, totalTabs);

  // 作成APIの完了は初期navigationの完了を保証しない。既存タブとして操作する前に、
  // 遅れて確定するabout:blankが次のURL遷移を中断しない状態まで待つ。
  await expect(async () => {
    const tabs = await serviceWorker.evaluate(
      windowId => chrome.tabs.query({ windowId }),
      window.windowId,
    );
    expect(tabs).toHaveLength(totalTabs);
    expect(tabs.every(tab => tab.url === "about:blank" && tab.status === "complete")).toBe(true);
  }).toPass({ timeout: 5000 });

  return window;
};

export const activateTabByIndexInWindow = async (
  serviceWorker: Worker,
  windowId: number,
  tabIndex: number,
) =>
  serviceWorker.evaluate(
    async ({ windowId, tabIndex }) => {
      const tabs = (await chrome.tabs.query({ windowId })).sort(
        (left, right) => left.index - right.index,
      );
      const targetTab = tabs.find(tab => tab.index === tabIndex);

      if (!targetTab?.id) {
        throw new Error(`Tab not found: windowId=${windowId}, tabIndex=${tabIndex}`);
      }

      await chrome.tabs.update(targetTab.id, { active: true });
      return targetTab.id;
    },
    { windowId, tabIndex },
  );

export const createTabInWindow = async (
  serviceWorker: Worker,
  windowId: number,
  options: {
    active?: boolean;
    useActiveTabAsOpener?: boolean;
  } = {},
) =>
  serviceWorker.evaluate(
    async ({ windowId, options }) => {
      const tabs = await chrome.tabs.query({ windowId });
      const activeTab = tabs.find(tab => tab.active);
      const newTab = await chrome.tabs.create({
        windowId,
        url: "about:blank",
        active: options.active ?? true,
        openerTabId: options.useActiveTabAsOpener ? activeTab?.id : undefined,
      });

      return {
        newTabId: newTab.id ?? null,
        newTabIndex: newTab.index,
        openerTabId: newTab.openerTabId,
        windowId: newTab.windowId,
      };
    },
    { windowId, options },
  );

export const closeActiveTabInWindow = async (serviceWorker: Worker, windowId: number) =>
  serviceWorker.evaluate(async windowId => {
    const [activeTab] = await chrome.tabs.query({ active: true, windowId });
    if (activeTab?.id) {
      await chrome.tabs.remove(activeTab.id);
      return true;
    }
    return false;
  }, windowId);

export const closeWindow = async (serviceWorker: Worker, windowId: number) =>
  serviceWorker.evaluate(async windowId => {
    await chrome.windows.remove(windowId);
  }, windowId);

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

export const closeActiveTabWithoutActivatedHandler = async (serviceWorker: Worker) =>
  serviceWorker.evaluate(async () => {
    const { handleTabActivated, onActivated } = globalThis.__testExports!.tabHandlers;

    onActivated.removeListener(handleTabActivated);

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.remove(activeTab!.id!);
    } finally {
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
    await chrome.storage.sync.clear();
    // chrome.storage.localとsessionを完全にクリア
    await chrome.storage.local.clear();
    await chrome.storage.session.clear();
    // ストレージの掃除はブラウザ再起動ではない。通常セッションのマーカーを維持する。
    globalThis.__testExports!.sessionRestore.resetSessionRestoreState();
    globalThis.__testExports!.sessionRestore.markSessionRestoreTabs([]);

    // デフォルト設定を復元
    await chrome.storage.local.set({ settings: defaultSettings, settingsSyncPending: true });
  }, DEFAULT_SETTINGS);
};

// グローバル型定義は src/test/types.d.ts で一元管理

/**
 * Service Workerの再起動をシミュレート
 * メモリキャッシュをクリアして、ストレージからの再読み込みを強制
 */
export const simulateServiceWorkerRestart = async (serviceWorker: Worker) => {
  // メモリキャッシュをクリア
  await serviceWorker.evaluate(() => {
    // メモリキャッシュをクリア
    if (globalThis.__testExports?.states) {
      globalThis.__testExports.states.resetActivationHistory();
      globalThis.__testExports.states.resetNewTabSourceTransition();
      globalThis.__testExports.states.resetNewTabActivation();
      globalThis.__testExports.states.resetPendingCloseTarget();
      globalThis.__testExports.states.resetPendingCloseTransition();
      globalThis.__testExports.states.resetTabSnapshotState();
      globalThis.__testExports.states.resetLoadingPageState();
      globalThis.__testExports.states.resetPopupState();
      globalThis.__testExports.states.resetAppDataState();
      globalThis.__testExports.states.resetInitializationState();
    }

    // sessionRestoreDetectorの状態もリセット
    if (globalThis.__testExports?.sessionRestore) {
      globalThis.__testExports.sessionRestore.resetSessionRestoreState();
    }
  });

  // 再初期化は次のイベントで始まるため、ここでは待機しない。
};

/**
 * メモリキャッシュの状態を確認
 */
export const getMemoryCacheState = async (serviceWorker: Worker) => {
  return serviceWorker.evaluate(() => {
    return {
      initializationState: globalThis.__testExports?.states.getInitializationState() || false,
    };
  });
};

export const resetServiceWorkerTabQueryCalls = async (serviceWorker: Worker) =>
  serviceWorker.evaluate(() => {
    const workerGlobal = globalThis as typeof globalThis & TestServiceWorkerQueryState;
    workerGlobal.__testTabQueryCalls = [];
    workerGlobal.__testFailingTabQueryWindowId = null;
    workerGlobal.__testFailingTabQueryMessage = null;

    if (!workerGlobal.__testOriginalTabsQuery) {
      workerGlobal.__testOriginalTabsQuery = chrome.tabs.query.bind(chrome.tabs);
      chrome.tabs.query = (async queryInfo => {
        workerGlobal.__testTabQueryCalls?.push(queryInfo ?? {});
        if (
          workerGlobal.__testFailingTabQueryWindowId !== null &&
          workerGlobal.__testFailingTabQueryWindowId !== undefined &&
          queryInfo?.windowId === workerGlobal.__testFailingTabQueryWindowId
        ) {
          throw new Error(workerGlobal.__testFailingTabQueryMessage ?? "Injected tabs.query error");
        }
        return workerGlobal.__testOriginalTabsQuery!(queryInfo);
      }) as typeof chrome.tabs.query;
    }
  });

export const getServiceWorkerTabQueryCalls = async (serviceWorker: Worker) =>
  serviceWorker.evaluate(() => {
    const workerGlobal = globalThis as typeof globalThis & TestServiceWorkerQueryState;
    return [...(workerGlobal.__testTabQueryCalls ?? [])];
  });

export const resetServiceWorkerUnhandledRejections = async (serviceWorker: Worker) =>
  serviceWorker.evaluate(() => {
    const workerGlobal = globalThis as typeof globalThis & TestServiceWorkerQueryState;
    workerGlobal.__testUnhandledRejections = [];

    if (!workerGlobal.__testUnhandledRejectionListenerInstalled) {
      self.addEventListener("unhandledrejection", event => {
        event.preventDefault();

        const reason =
          event.reason instanceof Error
            ? event.reason.message
            : typeof event.reason === "string"
              ? event.reason
              : JSON.stringify(event.reason);

        workerGlobal.__testUnhandledRejections?.push(reason);
      });

      workerGlobal.__testUnhandledRejectionListenerInstalled = true;
    }
  });

export const getServiceWorkerUnhandledRejections = async (serviceWorker: Worker) =>
  serviceWorker.evaluate(() => {
    const workerGlobal = globalThis as typeof globalThis & TestServiceWorkerQueryState;
    return [...(workerGlobal.__testUnhandledRejections ?? [])];
  });

export const setServiceWorkerTabQueryFailure = async (
  serviceWorker: Worker,
  windowId: number,
  message: string,
) =>
  serviceWorker.evaluate(
    ({ windowId, message }) => {
      const workerGlobal = globalThis as typeof globalThis & TestServiceWorkerQueryState;
      workerGlobal.__testFailingTabQueryWindowId = windowId;
      workerGlobal.__testFailingTabQueryMessage = message;
    },
    { windowId, message },
  );
