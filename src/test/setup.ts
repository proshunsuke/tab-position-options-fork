/**
 * テスト環境のセットアップ
 * テスト用エクスポートの収集とグローバル変数への登録を管理
 */

import { handleNewTab, handleTabActivated } from "@/src/tabs/handler";
import { createSessionRestoreDetector, defaultDetector } from "@/src/tabs/sessionRestoreDetector";
import { __testHelpers as simpleStorageHelpers } from "@/src/utils/simpleStorage";
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

      simpleStorage: {
        clearMemoryCache: simpleStorageHelpers.clearMemoryCache,
        getMemoryCacheSize: simpleStorageHelpers.getMemoryCacheSize,
        getMemoryCacheKeys: simpleStorageHelpers.getMemoryCacheKeys,
        hasInMemoryCache: simpleStorageHelpers.hasInMemoryCache,
      },
    };

    // グローバル変数に登録
    globalThis.__testExports = exports;

    // 後方互換性のため、既存の名前でも公開
    globalThis.__simpleStorageTestHelpers = exports.simpleStorage;

    console.log("Test environment initialized with exports:", Object.keys(exports));
  } catch (error) {
    console.error("Failed to setup test environment:", error);
  }
};
