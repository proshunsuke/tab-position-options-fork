/**
 * Service Worker のステート初期化管理
 * Service Worker 再起動時の検知とステートの復元を統合管理
 */

import { initializeAppData } from "@/src/settings/state/appData";
import { initializeActivationHistory } from "@/src/tabs/state/activationHistory";
import { initializeIndexCache } from "@/src/tabs/state/indexCache";
import { initializeSourceMap } from "@/src/tabs/state/sourceMap";
import { initializeTabSnapshot } from "@/src/tabs/state/tabSnapshot";

/**
 * Service Worker の初期化状態を管理するフラグ
 * Service Worker が再起動されると false にリセットされる
 */
let isInitialized = false;

/**
 * 初期化が必要かどうかをチェック
 * Service Worker 再起動後の最初のアクセス時に true を返す
 */
export const needsInitialization = () => {
  return !isInitialized;
};

/**
 * 初期化完了をマーク
 * 内部的に使用される関数
 */
const markInitialized = () => {
  isInitialized = true;
};

/**
 * 全ステートを初期化
 * Service Worker 起動時や再起動検知時に呼び出される
 * 既に初期化済みの場合はスキップされる
 */
export const initializeAllStates = async () => {
  if (isInitialized) {
    return; // 既に初期化済み
  }
  // 全ステートを並行して初期化（高速化のため）
  await Promise.all([
    initializeActivationHistory(),
    initializeIndexCache(),
    initializeSourceMap(),
    initializeAppData(),
    initializeTabSnapshot(),
  ]);

  // 初期化完了をマーク
  markInitialized();
};

/**
 * メモリをリセット（テスト用）
 * @internal
 */
export const resetInitializationState = () => {
  isInitialized = false;
};

/**
 * Service Worker の初期化状態を取得（テスト用）
 * @internal
 */
export const getInitializationState = () => {
  return isInitialized;
};
