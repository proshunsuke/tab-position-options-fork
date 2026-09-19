## プロジェクト概要

Tab Position Optionsを再実装したChrome Manifest V3拡張機能。WXT・TypeScript・React・Tailwind CSSを使用する。

## コード規約

- 既存の構成・慣例を優先する。
- 関数はアロー関数、型定義は`type`を使い、返り値の型は基本的に推論に任せる。
- アプリ内のimportは`@/`エイリアスを使用する。設定ファイルなど既存の相対importは、実行環境を確認せず一律に置換しない。
- 定数・型・内部データ構造、メイン処理・export、ヘルパーの順に配置する。
- 命名・フォーマット・lintルールの正本は[biome.json](biome.json)。

## タブとステート管理

- 初期化後のステート読み取りはメモリ優先とし、更新はメモリへ即時反映してストレージへの保存を待たせない。
- 共有ステートに依存するタブハンドラーは、`needsInitialization()`が真なら`initializeAllStates()`の完了を待って処理する。
- Service Workerはアイドル時に停止し、次のイベントで起動する。メモリの継続を前提にしない。
- 設定は`chrome.storage.local`、アクティベーション履歴とタブスナップショットは`chrome.storage.session`を使用する。短命な遷移ステートはメモリ内で扱う。
- イベント順序の差分は既存のスナップショットと遷移ステートの仕組みに合わせて扱い、不要な`chrome.tabs.query()`を増やさない。
- Promise形式のChrome APIはrejectionを処理し、コールバック形式では`chrome.runtime.lastError`を確認する。
- 拡張機能の権限は[wxt.config.ts](wxt.config.ts)で必要最小限に保つ。

## 検証

- コマンドの正本は[package.json](package.json)、CI手順は[.github/workflows/test.yml](.github/workflows/test.yml)。
- 型・lintの確認には`npm run typecheck`と`npm run lint:check`を使用する。初回など`.wxt`の生成が必要な場合は先に`npx wxt prepare`を実行する。
- `npm run lint`はunsafeな自動修正を含む。確認のみなら`lint:check`を使用する。

## コミット・Issue・PR

- コミットメッセージ、Issue、PRのタイトル・本文は英語で記述する。コミットは機能・目的ごとに分ける。
- Issueには現在と期待する動作、バグなら再現手順、可能なら解決案を含め、優先度をHigh 🔴・Medium 🟡・Low 🟢で示す。
- PRには変更内容と検証結果を、規模に応じて説明する。バグ修正では原因を、設計上の判断が必要なら技術的な理由を添える。

## ドキュメント

- READMEは英語版（`README.md`）を正本とし、変更時は日本語版（`README.ja.md`）と簡体字中国語版（`README.zh-CN.md`）も同時に更新する。

原版の挙動やUIを調べる場合は[仕様書](docs/original-extension/specification.md)、[日本語仕様書](docs/original-extension/specification-ja.md)、[設定画面の実装](docs/original-extension/options-page-assets/)、[スクリーンショット](docs/original-extension/screenshots/)を参照する。
