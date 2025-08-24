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
      handleNewTab: (tab: chrome.tabs.Tab) => Promise<void>;
      handleTabActivated: (activeInfo: { tabId: number; windowId: number }) => Promise<void>;
      onCreated: typeof chrome.tabs.onCreated;
      onActivated: typeof chrome.tabs.onActivated;
    };

    /**
     * セッション復元検出器
     */
    sessionRestore: {
      createDetector: (config?: {
        timeProvider?: () => number;
        thresholdMs?: number;
      }) => SessionRestoreDetector;
      defaultDetector: SessionRestoreDetector;
    };

    /**
     * 状態関連
     */
    states: {
      resetActivationHistory: () => void;
      resetIndexCache: () => void;
      resetSourceMap: () => void;
      resetTabSnapshotState: () => void;
      resetAppDataState: () => void;
      resetInitializationState: () => void;
      getInitializationState: () => boolean;
    };
  }

  /**
   * カスタム検出器（一時的なテスト用）
   */
  interface TestDetector {
    detector: SessionRestoreDetector;
    setTime: (time: number) => void;
  }

  /**
   * グローバル変数の定義
   */
  var __testExports: GlobalTestExports | undefined;
  var __testDetector: TestDetector | undefined;
}

export type { GlobalTestExports };
