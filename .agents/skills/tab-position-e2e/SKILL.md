---
name: tab-position-e2e
description: Tab Position Options ForkのPlaywright E2Eの追加・変更・実行・失敗調査に使用する。拡張機能のfixture、タブ操作、再起動とイベント順序の検証を扱う。
---

# 拡張機能のE2E

コマンドはリポジトリのルートから実行する。実行設定は[playwright.config.ts](../../../playwright.config.ts)、CI環境は[test.yml](../../../.github/workflows/test.yml)を参照する。

## 環境準備と実行

- 依存関係がなければ`npm ci`を実行する。
- 初回などWXTの生成ファイルが必要な場合は`npx wxt prepare`を実行する。
- PlaywrightのChromiumが未導入なら`npx playwright install chromium`を実行する。Linux CIの依存パッケージ込みの導入はworkflowに従う。
- 通常は変更に関連するspecを選び、リリース準備では全E2Eを実行する。

```fish
# 対象specの実行例（ビルドを含む）
npm run test:e2e -- e2e/specs/service-worker-restart.spec.ts

# 全E2E（ビルドを含む）
npm run test:e2e
```

GUIのないLinuxでは、CIと同じくXvfb経由で実行する。

```fish
xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" npm run test:e2e
```

現在の設定は1 worker・非並列。並列化を前提に変更しない。結果は`test-results/`と`playwright-report/`を確認する。

## 追加・変更

- [e2e/fixtures.ts](../../../e2e/fixtures.ts)の`test`・`expect`を使用する。fixtureはビルド済みの`dist/chrome-mv3`を読み込み、テストごとに分離したプロファイルを作成・削除する。
- [e2e/utils/helpers.ts](../../../e2e/utils/helpers.ts)の既存helperを利用する。機能テストのタブ操作はService Worker経由のChrome APIを基本とし、UI操作や実際のリンク遷移を検証する場合はその操作を再現する。
- 機能テストの設定は`setExtensionSettings`で用意する。このhelperは設定全体のマージではなく`settings`キーの置換なので、検証に必要な設定を渡す。
- `waitForServiceWorker`はWorkerの利用可能性を待つ。アプリの全ステート初期化やタブイベント処理完了まで保証するものとして扱わない。
- タブ順・アクティブタブは既存の状態取得helperと`expect(...).toPass()`などで確認する。

## 再起動・イベント順序の検証

- [service-worker-restart.spec.ts](../../../e2e/specs/service-worker-restart.spec.ts)を参照する。`simulateServiceWorkerRestart`はメモリ状態のリセットであり、実際のWorker停止・再起動の検証ではない。
- イベント順序の再現は既存helperと[tab-closing-event-order.spec.ts](../../../e2e/specs/tab-closing-event-order.spec.ts)に合わせる。手動でハンドラーを呼ぶ際は通常イベントとの二重実行を避け、一時的に外したリスナーを`finally`で復元する。
- 実際のアイドル停止に依存する不具合は、シミュレーションの成功だけで解決したと判断しない。ログ調査には[tab-position-debug](../tab-position-debug/SKILL.md)を使用する。
