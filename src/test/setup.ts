/**
 * テスト環境のセットアップ
 * テスト用エクスポートの収集とグローバル変数への登録を管理
 */

import { resetAppDataState } from "@/src/settings/state/appData";
import { getInitializationState, resetInitializationState } from "@/src/state/initializer";
import { handleNewTab } from "@/src/tabs/handleNewTab";
import { handleTabActivated } from "@/src/tabs/handleTabActivated";
import { createSessionRestoreDetector, defaultDetector } from "@/src/tabs/sessionRestoreDetector";
import { resetActivationHistory } from "@/src/tabs/state/activationHistory";
import { resetIndexCache } from "@/src/tabs/state/indexCache";
import { resetSourceMap } from "@/src/tabs/state/sourceMap";
import { resetTabSnapshotState } from "@/src/tabs/state/tabSnapshot";
import type { GlobalTestExports } from "./types";

/**
 * テスト環境をセットアップする
 * テスト用の関数をグローバル変数に登録して、E2Eテストから利用可能にする
 */
export const setupTestEnvironment = () => {
  // グローバルオブジェクトが利用可能かチェック
  if (typeof globalThis === "undefined") {
    console.warn("globalThis is not available");
    return;
  }

  // Chrome APIが利用可能かチェック
  if (typeof chrome === "undefined" || !chrome.tabs) {
    console.error("Chrome APIs are not available");
    return;
  }

  try {
    // テスト用エクスポートを構築
    const exports: GlobalTestExports = {
      tabHandlers: {
        handleNewTab,
        handleTabActivated,
        onCreated: chrome.tabs.onCreated,
        onActivated: chrome.tabs.onActivated,
      },

      sessionRestore: {
        createDetector: createSessionRestoreDetector,
        defaultDetector,
      },

      states: {
        resetActivationHistory: resetActivationHistory,
        resetIndexCache: resetIndexCache,
        resetSourceMap: resetSourceMap,
        resetTabSnapshotState: resetTabSnapshotState,
        resetAppDataState: resetAppDataState,
        resetInitializationState: resetInitializationState,
        getInitializationState: getInitializationState,
      },
    };

    // グローバル変数に登録
    globalThis.__testExports = exports;
    console.log("Test environment initialized with exports:", Object.keys(exports));
  } catch (error) {
    console.error("Failed to setup test environment:", error);
  }
};
