/**
 * テスト環境のセットアップ
 * テスト用エクスポートの収集とグローバル変数への登録を管理
 */

import { handleCommand } from "@/src/commands/handler";
import { resetAppDataState } from "@/src/settings/state/appData";
import { getInitializationState, resetInitializationState } from "@/src/state/initializer";
import { handleNewTab } from "@/src/tabs/handleNewTab";
import { handleTabActivated } from "@/src/tabs/handleTabActivated";
import { handleTabRemoved } from "@/src/tabs/handleTabRemoved";
import {
  handleBeforeNavigate,
  handleLoadingPageStartup,
  handleNavigationCommitted,
  handleNavigationError,
} from "@/src/tabs/loadingPage";
import { defaultDetector } from "@/src/tabs/sessionRestoreDetector";
import { resetActivationHistory } from "@/src/tabs/state/activationHistory";
import { resetLoadingPageState } from "@/src/tabs/state/loadingPage";
import { resetNewTabActivation } from "@/src/tabs/state/newTabActivation";
import { resetNewTabSourceTransition } from "@/src/tabs/state/newTabSourceTransition";
import {
  recordPendingCloseTarget,
  resetPendingCloseTarget,
} from "@/src/tabs/state/pendingCloseTarget";
import { resetPendingCloseTransition } from "@/src/tabs/state/pendingCloseTransition";
import { resetPopupState } from "@/src/tabs/state/popup";
import { removeTabFromSnapshot, resetTabSnapshotState } from "@/src/tabs/state/tabSnapshot";
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
        handleCommand,
        handleBeforeNavigate,
        handleNavigationCommitted,
        handleNavigationError,
        handleLoadingPageStartup,
        handleNewTab,
        handleTabActivated,
        handleTabRemoved,
        onCreated: chrome.tabs.onCreated,
        onActivated: chrome.tabs.onActivated,
        onRemoved: chrome.tabs.onRemoved,
      },

      sessionRestore: {
        defaultDetector,
      },

      states: {
        resetLoadingPageState,
        resetPopupState,
        resetActivationHistory: resetActivationHistory,
        resetNewTabSourceTransition,
        resetNewTabActivation,
        recordPendingCloseTarget: recordPendingCloseTarget,
        resetPendingCloseTarget: resetPendingCloseTarget,
        resetPendingCloseTransition: resetPendingCloseTransition,
        resetTabSnapshotState: resetTabSnapshotState,
        removeTabFromSnapshot,
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
