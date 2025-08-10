/**
 * セッション復元検出器
 *
 * ブラウザ起動直後にフラグを立て、タブ作成間隔を監視して
 * セッション復元が終了したタイミングを検出する
 */

type TimeProvider = () => number;

type DetectorState = {
  isStartupPhase: boolean;
  lastTabCreationTime: number;
};

type DetectorConfig = {
  timeProvider?: TimeProvider;
  thresholdMs?: number;
};

type SessionRestoreDetector = {
  handleBrowserStartup: () => void;
  initSessionRestoreDetector: () => void;
  isSessionRestoreTab: () => boolean;
  __testHelpers: {
    setStartupPhase: (value: boolean) => void;
    getState: () => DetectorState;
    resetState: () => void;
  };
};

/**
 * セッション復元検出器を作成
 */
export const createSessionRestoreDetector = (
  config: DetectorConfig = {},
): SessionRestoreDetector => {
  const timeProvider = config.timeProvider || (() => Date.now());
  const RAPID_CREATION_THRESHOLD_MS = config.thresholdMs || 200;

  // 状態を閉じ込める（クロージャ）
  const state: DetectorState = {
    isStartupPhase: false,
    lastTabCreationTime: 0,
  };

  /**
   * ブラウザ起動時の処理
   */
  const handleBrowserStartup = () => {
    state.isStartupPhase = true;
    state.lastTabCreationTime = 0;
  };

  /**
   * 検出器を初期化（拡張機能起動時に呼ばれる）
   */
  const initSessionRestoreDetector = () => {
    state.isStartupPhase = false;
    state.lastTabCreationTime = 0;
  };

  /**
   * セッション復元によるタブかどうかを判定
   * @returns セッション復元によるタブの場合はtrue
   */
  const isSessionRestoreTab = () => {
    // 起動フェーズが終了していれば、通常のタブ
    if (!state.isStartupPhase) {
      return false;
    }

    const now = timeProvider();

    // 最初のタブ
    if (state.lastTabCreationTime === 0) {
      state.lastTabCreationTime = now;
      // 最初のタブはセッション復元の可能性があるため、スキップ
      return true;
    }

    // 前回のタブからの間隔をチェック
    const interval = now - state.lastTabCreationTime;
    state.lastTabCreationTime = now;

    // 間隔が閾値より長い場合、ユーザーによる手動作成と判断
    if (interval >= RAPID_CREATION_THRESHOLD_MS) {
      // セッション復元フェーズ終了
      state.isStartupPhase = false;
      return false;
    }

    // 短い間隔の場合、セッション復元中
    return true;
  };

  // テスト用のヘルパー
  const __testHelpers = {
    setStartupPhase: (value: boolean) => {
      state.isStartupPhase = value;
      if (value) {
        state.lastTabCreationTime = 0;
      }
    },
    getState: () => ({ ...state }),
    resetState: () => {
      state.isStartupPhase = false;
      state.lastTabCreationTime = 0;
    },
  };

  return {
    handleBrowserStartup,
    initSessionRestoreDetector,
    isSessionRestoreTab,
    __testHelpers,
  };
};

// デフォルトのインスタンスを作成
const defaultDetector = createSessionRestoreDetector();

// シンプルなAPIとして公開
export const handleBrowserStartup = defaultDetector.handleBrowserStartup;
export const initSessionRestoreDetector = defaultDetector.initSessionRestoreDetector;
export const isSessionRestoreTab = defaultDetector.isSessionRestoreTab;

// テスト用にファクトリー関数とデフォルトインスタンスをグローバルに公開
// Service Worker内でのみ利用可能
declare global {
  var __testExports:
    | {
        createDetector: typeof createSessionRestoreDetector;
        defaultDetector: SessionRestoreDetector;
      }
    | undefined;
}

if (typeof globalThis !== "undefined") {
  globalThis.__testExports = {
    createDetector: createSessionRestoreDetector,
    defaultDetector,
  };
}
