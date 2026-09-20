## プロジェクト概要

Tab Position Optionsを再実装したChrome Manifest V3拡張機能。WXT・TypeScript・React・Tailwind CSSを使用する。

## 最重要原則：タブ操作の即時性

タブの位置・アクティブ状態を制御する際は、イベント受信から操作APIの呼び出しまでの遅延を最小化すること。特に新規タブは、移動がわずかに遅れるだけでも画面のちらつきにつながる。この原則は機能追加・修正・リファクタリングすべての必須要件とする。

- 初期化済みの通常経路では、メモリ上の設定・スナップショットから同期的に判断し、`chrome.tabs.move()`や`chrome.tabs.update()`を速やかに呼び出す。操作前に不要なストレージ読み取りや`chrome.tabs.query()`の完了待ちを追加しない。
- タブ操作までの経路には、不要な`async`/`await`、Promiseの直列化、固定時間の待機を追加しない。`await`を`.then()`に置き換えても、先行処理の完了を待つなら遅延は解消しない。
- イベント順序の差分は、既存のスナップショット・短命な遷移ステートで吸収し、不要な`chrome.tabs.query()`を増やさない。単に処理順序を揃えたり、イベントが落ち着くのを待ったりする目的で待機を入れない。
- 待機は、必要な初期化や操作間の実際の依存関係など、正しい動作のために不可欠な場合に限り、範囲を最小限にする。追加する場合は、待機が必要な理由をコードコメントで説明する。
- ステートの更新はメモリへ即時反映し、ストレージへの保存完了を待たせない。永続化や操作後の状態再取得は、可能な限り操作APIを呼び出した後に行い、操作開始を待たせない。
- タブ制御の変更時は、最終的な配置が正しいことに加え、操作APIの呼び出し前に不要な待機・API呼び出しが増えていないことを確認する。機能テストの成功だけで即時性を満たしたと判断しない。

外部Skillの一般的な指針と競合する場合も、この即時性の原則と本プロジェクトのステート管理方針を優先する。

## コード規約

- 既存の構成・慣例を優先する。
- 関数はアロー関数、型定義は`type`を使い、返り値の型は基本的に推論に任せる。
- アプリ内のimportは`@/`エイリアスを使用する。設定ファイルなど既存の相対importは、実行環境を確認せず一律に置換しない。
- 定数・型・内部データ構造、メイン処理・export、ヘルパーの順に配置する。
- 命名・フォーマット・lintルールの正本は[biome.json](biome.json)。

## 画面文言と翻訳

- 画面文言は[locales/en.json](locales/en.json)を正本とする。文言の追加・削除・意味の変更時は、`locales/*.json`の全対応ロケールを確認し、必要な翻訳更新を同じ変更に含める。単一言語の誤字修正など、他言語に影響しない場合は不要な変更を行わない。
- 翻訳テストはキー・空文字・置換文字の整合性を検証する。テストの成功だけで翻訳の更新完了とせず、各言語で意味が一致していることも確認する。

## タブとステート管理

- 共有ステートに依存するタブハンドラーは、`needsInitialization()`が真なら`initializeAllStates()`の完了を待って処理する。
- Service Workerはアイドル時に停止し、次のイベントで起動する。メモリの継続を前提にしない。
- 設定は`chrome.storage.local`、アクティベーション履歴とタブスナップショットは`chrome.storage.session`を使用する。短命な遷移ステートはメモリ内で扱う。
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
