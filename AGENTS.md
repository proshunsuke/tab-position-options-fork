## プロジェクト概要

Tab Position Options Chrome拡張機能の再実装プロジェクト。Chrome Manifest V3に対応したモダンな実装。

## 技術スタック

- **言語**: TypeScript
- **UIフレームワーク**: React
- **CSSフレームワーク**: Tailwind CSS
- **拡張機能フレームワーク**: WXT
- **リンター/フォーマッター**: Biome
- **E2Eテストフレームワーク**: Playwright
- **Chrome Extension API**: Manifest V3

## 開発コマンド

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動（Chrome、ホットリロード対応）
npm run dev

# Firefox用の開発サーバー
npm run dev:firefox

# プロダクションビルド（Chrome）
npm run build

# Firefox用ビルド
npm run build:firefox

# 拡張機能のZIPファイル作成
npm run zip

# TypeScriptの型チェック
npm run typecheck

# Biomeによるリント・フォーマット（自動修正付き、unsafeオプション有効）
npm run lint

# Biomeによるチェックのみ（修正なし）
npm run lint:check

# CI環境用のチェック（エラーがあれば失敗）
npm run check:ci

# E2Eテストの実行（ビルド込み）
npm run test:e2e

# E2EテストをUIモードで実行
npm run test:e2e:ui

# E2Eテストをデバッグモードで実行
npm run test:e2e:debug
```

## コミット規約

- コミットメッセージは英語で記述する
- 適切な粒度でコミットを分割する（機能ごと、目的ごと）
- 明確で簡潔なメッセージを心がける

## Changelogの規約

CHANGELOG.mdは[Codex形式](https://github.com/anthropics/Codex/blob/main/CHANGELOG.md)に従う：

### 厳守すべきフォーマット
- **バージョン番号のみ**を見出しとする（例：`## 0.0.2`）
- **日付やUnreleasedセクションは記載しない**
- **リリース済みバージョンのみ**を記載する
- 新しいバージョンを上に、古いバージョンを下に配置

### 変更内容の記載方法
- 各バージョンの下に箇条書き（`-`）で変更内容を記載
- **ユーザー視点の変更のみ**を記載（バグ修正、新機能など）
- 動詞で始まる簡潔な文章（Fixed, Added, Removed など）
- **実装詳細やテスト追加は記載しない**

### 絶対に追加してはいけないもの
- `Note:` などの追加説明セクション
- 実装の技術的詳細（「200msのthreshold」など内部実装の数値）
- テストの追加に関する記載
- コードの内部的な改善（リファクタリングなど）

### 良い例
```markdown
## 0.0.2
- Fixed "Left Tab" setting not working correctly when closing tabs opened via target="_blank" links
- Fixed tab order preservation during browser session restore
```

### 悪い例
```markdown
## 0.0.2
- Added configurable threshold-based detection (200ms) ← 内部実装の詳細
- Added E2E tests for race conditions ← テストの追加
- Refactored tab handler ← 内部的な改善
Note: This release includes... ← 余計な説明セクション
```

## Issue作成時の規約

GitHubのissueは**英語で**記載すること。以下の要素を含める：

1. **明確なタイトル** - 問題や機能を簡潔に表現
2. **詳細な説明** - 問題の背景、現在の動作、期待される動作
3. **再現手順** - バグの場合は具体的な再現ステップ
4. **解決案** - 可能であれば技術的な解決策やコード例を提示
5. **優先度** - High 🔴、Medium 🟡、Low 🟢 で明記

## Pull Request作成時の規約

Pull Requestの概要欄は**英語で**記載し、以下の情報を詳細に含めること：

1. **Root Cause（問題の原因）** - バグの根本原因を段階的に説明し、問題が発生するメカニズムを明確に記述
2. **Solution（解決方法）** - 実装した修正内容を具体的に列挙し、なぜその修正が問題を解決するのかを説明
3. **Testing（テスト）** - 追加したテストケースの説明と既存テストへの影響・結果
4. **Technical Details（技術的詳細）** - 主要な実装変更の技術的な詳細とアーキテクチャへの影響

## オリジナル拡張機能の仕様

オリジナルのTab Position Options拡張機能の詳細な仕様と実装については、`/docs/original-extension/`ディレクトリを参照：

- **specification.md**: オリジナル拡張機能の完全な機能仕様書
- **options-page-assets/**: オリジナルの設定画面の実装（HTML/CSS/JS）
- **screenshots/**: 各機能のUIスクリーンショット

## 実装戦略

### 1. タブ位置制御のアーキテクチャ

**同期的ステート管理**
- メモリファーストの同期的読み取りで即座の応答
- ストレージへの遅延書き込み（非ブロッキング）
- Service Worker 30秒再起動時の自動状態復元

**イベント駆動型の設計**
- chrome.tabs APIのイベントリスナーを使用
- 各ハンドラーは独立したモジュールに分割
- すべてのハンドラーで初期化状態をチェック

**タブ操作の最適化**
- タブスナップショットによるchrome.tabs.query()の呼び出し削減
- 短命なメモリステートによるイベント順序差分の吸収
- 並列初期化（Promise.all）による高速起動

### 2. 設定管理システム

**メモリファーストパターン**
- グローバルメモリでの設定状態保持
- 同期的なgetSettingsによる即座のアクセス
- Promise.resolve().then()による遅延永続化

**リアクティブな設定更新**
- Reactの状態管理（useState）を使用した設定画面
- chrome.storage.onChangedリスナーによる即座の反映
- Service Worker起動時の自動初期化

**UIコンポーネントの設計**
- ラジオボタングループによる排他的選択の実装
- 視覚的フィードバックによるユーザビリティ向上
- アクセシビリティを考慮したキーボード操作

### 3. エラーハンドリングとデバッグ

**堅牢なエラー処理**
- chrome.runtime.lastErrorの確実なチェック
- タブ操作失敗時のフォールバック
- ユーザーへの適切なエラー通知

**開発者向けデバッグ機能**
- コンソールログによる動作追跡
- 設定値の検証とバリデーション
- Service Workerのライフサイクル管理

## ステート管理アーキテクチャ

### 同期的ステート管理の原則

**メモリファーストアプローチ**
1. **メモリファースト**: すべての読み取りは同期的にメモリから実行
2. **遅延永続化**: ストレージへの書き込みは非ブロッキングで実行
3. **自動初期化**: Service Worker再起動時に自動的に状態を復元
4. **レースコンディション対策**: `newTabSourceTransition` や `pendingCloseTransition` などの短命ステートで連続イベントを制御


## 開発時の注意点

1. **Service Worker の制限**
   - DOM APIは使用不可
   - 永続的な状態保持は不可（chrome.storage APIを使用）
   - イベント駆動型の実装が必要

2. **権限の最小化**
   - 必要最小限の権限のみを`wxt.config.ts`の`manifest`で要求
   - ユーザーのプライバシーを考慮

3. **エラーハンドリング**
   - chrome.runtime.lastErrorのチェック
   - Promise rejectionの適切な処理

4. **パフォーマンス**
   - 大量のタブ操作時のバッチ処理
   - タブスナップショットとメモリステートを使った無駄なChrome API呼び出しの削減

5. **コード品質の維持**
   - Biomeによる自動フォーマット（保存時）
   - TypeScriptの厳格な型チェック（noExplicitAnyはエラー）
   - React Hooksの依存関係チェック（useExhaustiveDependenciesはエラー）
   - CI環境では`npm run check:ci`でエラーチェック

6. **コード構成の方針**
   - 定数定義、型定義、内部データ構造は最上部に配置
   - その下にメイン処理やexportされる関数を配置
   - 詳細な実装やヘルパー関数はファイルの下部に配置
   - トップダウンで読みやすい構造を心がける

7. **TypeScript/JavaScriptの規約**
   - メソッドはアロー関数で記述
   - 関数の返り値の型は省略（型推論に任せる）
   - 型定義には`interface`ではなく`type`を使用
   - 定数名はBiomeの命名規則と既存実装に従う（`CONSTANT_CASE`、`camelCase`、`PascalCase` を文脈に応じて使い分ける）
   - インポートは相対パスではなく`@/`エイリアスを使用した絶対パスで記述

9. **Service Worker 再起動対応**
   - すべてのイベントハンドラーの先頭で `needsInitialization()` をチェック
   - 必要に応じて `initializeAllStates()` を呼び出し
   - 再起動直後のイベント順序差分は短命ステートと閾値付き判定で吸収する

## デバッグログの仕込み方

Service WorkerのDevToolsを開くと、Service Workerが常に動作し続けるため、実際のプロダクション環境（30秒で自動停止）と異なる挙動になってしまう。
そのため、DevToolsを開かずにログを収集する仕組みが必要。

### 手順
1. `@/src/utils/debugLogger.ts`を使用してログを仕込む
2. `wxt.config.ts`の`permissions`に以下を追加:
   - `"unlimitedStorage"`（大量ログ保存のため）
   - `"tabs"`（タブのタイトルやURL等の詳細情報取得のため）
3. ログは`debug_logs`をキーとしてchrome.storage.localに保存される
4. **重要**: デバッグ完了後は必ず以下を実施
   - デバッグログのコードを削除
   - `unlimitedStorage`権限を削除
   - `tabs`権限を削除（デバッグ目的のみで使用の場合）

## Tailwind CSS 4の設定

- 設定ファイル（tailwind.config.js）は不要
- assets/styles/index.cssで@importと@themeディレクティブを使用
- Chromeブランドカラーをカスタムテーマ変数として定義

## E2Eテスト

### テスト方針

1. **Service Worker経由でのテスト**
   - Chrome拡張機能のイベントを正しく発火させるため、Service Worker経由でタブ操作を実行
   - Chrome Extension APIを直接使用してテストの信頼性を確保

2. **テストの分離**
   - UIテスト: 設定画面の操作とUI要素の確認
   - 機能テスト: 拡張機能の動作確認
   - 統合テスト: エンドツーエンドのシナリオテスト

3. **テストユーティリティの活用**
   - Service Workerの初期化待機
   - 設定の直接操作（UIを経由しない高速なセットアップ）
   - タブ状態の取得と検証

### テスト環境の考慮事項

1. **Chrome Extension API特有の制約**
   - イベントの発火タイミングが非同期
   - 一部のAPIで取得できる情報に制限がある
   - Service Workerのライフサイクル管理

2. **Playwrightとの統合**
   - 拡張機能の永続的なコンテキストを使用
   - カスタムフィクスチャによるテスト環境の構築
   - 非同期処理の適切な待機戦略

3. **テストの安定性**
   - リトライ機構の活用
   - タイムアウトの適切な設定
   - CI環境での実行を考慮した設計

## リリースプロセス

### リリース準備の手順
1. **package.jsonのバージョンを更新**
2. **`npm install`を実行してpackage-lock.jsonを更新**
3. **CHANGELOG.mdを更新**（上記の規約に厳密に従うこと）
4. **全てのチェックを実行**:
   - `npm run typecheck`
   - `npm run lint:check`
   - `npm run test:e2e`
   - `npm run build`
5. **変更をコミット**: `chore: bump version to X.X.X`

### リリースPRの作成
リリース準備が完了したら、以下の手順でPRを作成：
1. **リリース用のブランチを作成**: `release/vX.X.X`
2. **mainブランチへのPRを作成**
3. **PR概要に含める内容**:
   - リリースバージョン番号
   - 主な変更内容（CHANGELOGと同じ内容）
   - チェックリスト（ビルド確認、テスト確認など）

### リリースワークフローの仕組み
`.github/workflows/release.yml`で定義されたワークフローを使用します：
- 手動実行のみ（`workflow_dispatch`）
- `package.json`のバージョンを読み取ってリリース
- Chrome Web Storeへドラフトアップロードし、成功後にGitHub Releaseを作成
- **タグは自動的に作成される**（手動でタグを作成しない）

### リリース時の重要な制約
1. **バージョン番号は`package.json`のみで管理** - 他の場所でバージョンをハードコードしない
2. **リリースワークフローで自動化されるのはChrome Web Storeへのドラフトアップロードまで** - 審査提出やストア掲載情報の更新は手動で行う
3. **リリースワークフローの実行前に必ずビルドとテストが通ることを確認**
4. **手動でGitタグを作成しない** - ワークフローが自動的に処理する
