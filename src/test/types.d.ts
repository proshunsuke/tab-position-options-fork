/**
 * テスト用グローバル変数の型定義
 * すべてのテスト関連のグローバル型をここで一元管理
 */

import type { SessionRestoreDetector } from "@/src/tabs/sessionRestoreDetector";

declare global {
  /**
   * テスト用エクスポートの統合インターフェース
   */
  interface GlobalTestExports {
    /**
     * タブハンドラー関連
     */
    tabHandlers: {
      handleBeforeNavigate: (
        details: chrome.webNavigation.WebNavigationBaseCallbackDetails,
      ) => Promise<void>;
      handleNavigationCommitted: (
        details: chrome.webNavigation.WebNavigationTransitionCallbackDetails,
      ) => Promise<void>;
      handleNavigationError: (
        details: chrome.webNavigation.WebNavigationFramedErrorCallbackDetails,
      ) => Promise<void>;
      handleLoadingPageStartup: () => Promise<void>;
      handleNewTab: (tab: chrome.tabs.Tab) => Promise<void>;
      handleTabActivated: (activeInfo: { tabId: number; windowId: number }) => Promise<void>;
      handleTabRemoved: (
        tabId: number,
        removeInfo: { windowId: number; isWindowClosing: boolean },
      ) => Promise<void>;
      onCreated: typeof chrome.tabs.onCreated;
      onActivated: typeof chrome.tabs.onActivated;
      onRemoved: typeof chrome.tabs.onRemoved;
    };

    /**
     * セッション復元検出器
     */
    sessionRestore: {
      defaultDetector: SessionRestoreDetector;
    };

    /**
     * 状態関連
     */
    states: {
      resetLoadingPageState: () => void;
      resetActivationHistory: () => void;
      resetNewTabSourceTransition: () => void;
      resetNewTabActivation: () => void;
      recordPendingCloseTarget: (windowId: number, targetTabId: number, windowMs?: number) => void;
      resetPendingCloseTarget: () => void;
      resetPendingCloseTransition: () => void;
      resetTabSnapshotState: () => void;
      removeTabFromSnapshot: (windowId: number, tabId: number) => unknown;
      resetAppDataState: () => void;
      resetInitializationState: () => void;
      getInitializationState: () => boolean;
    };
  }

  /**
   * グローバル変数の定義
   */
  var __testExports: GlobalTestExports | undefined;
}

export type { GlobalTestExports };
