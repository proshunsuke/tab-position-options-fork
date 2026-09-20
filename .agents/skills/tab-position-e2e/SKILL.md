---
name: tab-position-e2e
description: Tab Position Options ForkのPlaywright E2Eの追加・変更・実行・失敗調査に使用する。拡張機能のfixture、タブ操作、再起動とイベント順序の検証を扱う。
---

# 拡張機能のE2E

コマンドはリポジトリのルートから実行する。実行設定は[playwright.config.ts](../../../playwright.config.ts)、CI環境は[test.yml](../../../.github/workflows/test.yml)を参照する。

## 環境準備と実行

- Node.jsはCIと同じメジャーバージョンを使う。レポート統合まで正常に完了することを確認する。
- 依存関係がなければ`npm ci`を実行する。
- 初回などWXTの生成ファイルが必要な場合は`npx wxt prepare`を実行する。
- PlaywrightのChromiumが未導入なら`npx playwright install chromium`を実行する。Linux CIの依存パッケージ込みの導入はworkflowに従う。
- 通常は変更に関連するspecを選び、リリース準備では全E2Eを実行する。

```fish
# 対象specの実行例（ビルドを含む）
npm run test:e2e -- e2e/specs/service-worker-restart.spec.ts

# 全E2Eをローカルで3分割並列実行（ビルドは1回）
npm run test:e2e:sharded

# 全E2Eを順次実行（比較・切り分け用）
npm run test:e2e
```

画面表示を伴う`test:e2e`をGUIのないLinuxで実行する場合は、CIと同じくXvfbを使う。`test:e2e:sharded`はヘッドレス実行なのでXvfbは不要。

```fish
xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" npm run test:e2e
```

各分割内は1 workerで順次実行し、CIと同じファイル単位の3分割を使う。ローカルの`test:e2e:sharded`は拡張機能対応の`channel: "chromium"`を使って3プロセスをヘッドレスで並列起動し、全分割の終了後にHTMLレポートを統合する。失敗した分割があっても残りを実行し、全体を失敗終了させる。

- 分割実行の結果・プロファイルは`test-results/sharded/shard-*`、統合レポートは`playwright-report/sharded`。通常の実行は`test-results/`と`playwright-report/`。
- プロファイルは`testInfo.outputPath()`または`test.info().outputPath()`配下に作り、分割間で保存先を共有しない。
- 通常実行と分割実行、または複数の分割実行コマンドを同じ作業ディレクトリで同時に起動しない。結果の後片付けが干渉する。
- 通常実行とCIは画面表示あり。分割実行はデスクトップ上のフォーカス競合を避けるためヘッドレスにする。ヘッドレスでは複数ウィンドウが同時に`focused: true`になるため、実際のウィンドウフォーカスは`test:e2e`で検証し、フォーカス変更APIの呼び出し条件も単体テストで確認する。

## 追加・変更

- [e2e/fixtures.ts](../../../e2e/fixtures.ts)の`test`・`expect`を使用する。fixtureはビルド済みの`dist/chrome-mv3`をテストごとのプロファイル内にコピーし、終了時に削除する。コピーには英語の翻訳データだけを残し、`default_locale: "en"`へのフォールバックで設定画面を英語に固定する。ブラウザ自体の表示言語と通常のビルド出力は変更しない。
- fixtureは初回インストールで設定画面の翻訳・設定が読み込まれるまで待ち、通常は設定画面を閉じて空白タブを残してからテストを開始する。Chromeが起動時の空白タブを設定画面に転用する場合も考慮する。初回表示・既存設定タブの再利用を検証する場合は`test.use({ keepInstallOptions: true })`で残す。
- [e2e/utils/helpers.ts](../../../e2e/utils/helpers.ts)の既存helperを利用する。機能テストのタブ操作はService Worker経由のChrome APIを基本とし、UI操作や実際のリンク遷移を検証する場合はその操作を再現する。
- 既存タブのURL遷移を検証する場合は、準備用の`createWindowWithTabs`で初期`about:blank`の読み込み完了まで待つ。作成APIの完了だけでは、初期navigationが次の遷移を中断することがある。新規作成中の挙動を検証する場合は、この準備待機と分ける。
- 機能テストの設定は`setExtensionSettings`で用意する。このhelperは設定全体のマージではなく`settings`キーの置換なので、検証に必要な設定を渡す。
- `waitForServiceWorker`はWorkerの利用可能性を待つ。アプリの全ステート初期化やタブイベント処理完了まで保証するものとして扱わない。
- タブ順・アクティブタブは既存の状態取得helperと`expect(...).toPass()`などで確認する。

## 再起動・イベント順序の検証

- ブラウザのセッション復元は[sessionRestore.ts](../../../e2e/utils/sessionRestore.ts)で拡張機能を初回のみ通常インストールし、同じプロファイルを閉じて再起動する。起動ごとの`--load-extension`やCDPの読み込みでは、復元中のイベントが届かず誤って成功することがある。再起動後の`onStartup`・復元タブの`onCreated`到達と、`onInstalled`が発生しないことも検証する。
- [service-worker-restart.spec.ts](../../../e2e/specs/service-worker-restart.spec.ts)を参照する。`simulateServiceWorkerRestart`はメモリ状態のリセットであり、実際のWorker停止・再起動の検証ではない。
- イベント順序の再現は既存helperと[tab-closing-event-order.spec.ts](../../../e2e/specs/tab-closing-event-order.spec.ts)に合わせる。手動でハンドラーを呼ぶ際は通常イベントとの二重実行を避け、一時的に外したリスナーを`finally`で復元する。
- 同じcloseのイベントを手動再生する場合は、ブラウザ操作を済ませてからハンドラーを連続して呼ぶ。イベント間に操作APIの完了待ちを挟むと、短命な遷移ステートの期限をテスト側の待ち時間で超えてしまう。
- 実際のアイドル停止に依存する不具合は、シミュレーションの成功だけで解決したと判断しない。ログ調査には[tab-position-debug](../tab-position-debug/SKILL.md)を使用する。
