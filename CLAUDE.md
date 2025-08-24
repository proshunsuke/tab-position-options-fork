# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Tab Position Options Chrome拡張機能の再実装プロジェクト。Chrome Manifest V3に対応したモダンな実装。

## 技術スタック

- **言語**: TypeScript 5.8.3
- **UIフレームワーク**: React 19.1.0
- **CSSフレームワーク**: Tailwind CSS 4.1.11
- **拡張機能フレームワーク**: WXT 0.20.7
- **リンター/フォーマッター**: Biome 2.1.1
- **E2Eテストフレームワーク**: Playwright 1.54.1
- **Chrome Extension API**: Manifest V3

## プロジェクト構造

```
tab-position-options-fork/
├── entrypoints/             # WXTエントリーポイント
│   ├── background.ts        # Service Worker (状態初期化を含む)
│   └── options/            # 設定画面
├── src/
│   ├── state/              # 状態管理の初期化
│   │   └── initializer.ts  # Service Worker ライフサイクル管理
│   ├── tabs/               # タブ操作ロジック
│   │   ├── handleNewTab.ts      # 新規タブハンドラー
│   │   ├── handleTabActivated.ts # タブアクティベーションハンドラー
│   │   ├── handleTabMoved.ts     # タブ移動ハンドラー
│   │   ├── handleTabRemoved.ts   # タブ削除ハンドラー
│   │   ├── handler.ts            # ハンドラー設定
│   │   ├── state/               # タブ状態管理
│   │   │   ├── activationHistory.ts # アクティベーション履歴
│   │   │   ├── indexCache.ts        # インデックスキャッシュ
│   │   │   ├── sourceMap.ts         # タブソースマップ
│   │   │   └── tabSnapshot.ts       # タブスナップショット
│   │   └── tabClosing.ts        # タブクローズ処理
│   ├── settings/           # 設定管理
│   │   └── state/          # 設定状態管理
│   │       └── appData.ts  # アプリケーション設定（同期的管理）
│   └── types.ts            # 型定義
├── assets/                 # 静的アセット
├── public/                 # 公開リソース
├── e2e/                    # E2Eテスト
│   ├── specs/              # テストスペック
│   └── utils/              # テストユーティリティ
└── [設定ファイル群]
```

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

CHANGELOG.mdは[Claude Code形式](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)に従う：

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

## 主要機能

### 1. 新規タブ（New Tab）設定
- **Always first**: 常に最初に開く
- **Always last**: 常に最後に開く
- **Right of current tab**: 現在のタブの右側に開く
- **Left of current tab**: 現在のタブの左側に開く
- **Default**: ブラウザのデフォルト動作（デフォルト）

**追加オプション**:
- **New Tab Background**: 新規タブをバックグラウンドで開く（現在のタブのフォーカスを維持）

### 2. ローディングページ（Loading Page）設定
新しいページを読み込む際のタブ位置（New Tabと同じオプション）
※ 現在は未実装（UI上で "Coming soon..." と表示）

### 3. タブを閉じた後のアクティブタブ（Activate Tab After Tab Closing）
タブを閉じた後にどのタブをアクティブにするか：
- **First tab**: 最初のタブ
- **Last tab**: 最後のタブ
- **Right tab**: 右側のタブ
- **Left tab**: 左側のタブ
- **In activated order**: アクティブ化された順序
- **Source tab (Open link)**: リンク元のタブ
- **Source tab (Open link) & In activated order**: リンク元のタブとアクティブ化順序の組み合わせ
- **Default**: ブラウザのデフォルト動作（デフォルト）

### 4. アクティブタブの動作（Tab on Activate）
- **Default**: デフォルト動作（デフォルト）
- **Last**: 最後のタブ
- **First**: 最初のタブ
※ 現在は未実装

### 5. ポップアップ（Pop-up）設定
- **Open pop-up window as new tab**: ポップアップウィンドウを新しいタブとして開く
※ 現在は未実装

### 6. 設定の保存
- `chrome.storage.local` APIを使用してローカルに設定を保存
- すべての設定はOptionsページで管理

## Chrome拡張機能API使用方法

### 主要API
- **chrome.tabs**: タブの作成、移動、クエリ等の操作
- **chrome.storage.local**: 設定のローカル保存
- **chrome.runtime**: 拡張機能内でのメッセージング

## ビルド設定

### 主要な設定ファイル
- **wxt.config.ts**: WXTの設定ファイル、Reactモジュール使用、ポート5789で開発サーバー起動
- **tsconfig.json**: TypeScript設定、パスエイリアス（@/）を定義
- **biome.json**: リンター/フォーマッター設定、警告もエラーとして扱う

## 設定項目の詳細仕様

### 設定の概念と構造

拡張機能の設定は以下の5つのカテゴリに分類されます：

1. **新規タブの位置（New Tab）** - 実装済み
   - ブラウザで新しいタブを開く際の位置を制御
   - アドレスバーの＋ボタン、Ctrl+T、右クリックメニューなどから開かれるタブが対象

2. **ローディングページの位置（Loading Page）** - 未実装
   - 既存のタブから新しいページを開く際の位置を制御
   - リンククリック、window.open()、target="_blank"などが対象

3. **タブを閉じた後のアクティブタブ（Activate Tab After Tab Closing）** - 実装済み
   - タブを閉じた際に次にアクティブにするタブを制御
   - ユーザーエクスペリエンスを考慮した複数のオプションを提供

4. **タブのアクティブ時動作（Tab on Activate）** - 未実装
   - 特定の条件下でタブの左右に新しいタブを開く機能
   - 高度なタブ管理のためのオプション

5. **ポップアップウィンドウ（Pop-up）** - 未実装
   - JavaScriptのポップアップウィンドウの扱いを制御
   - セキュリティと利便性のバランスを考慮

### 設定値の保存と同期

- Chrome Storage Local APIを使用してローカルに設定を保存
- 設定変更の即座の反映（リアルタイムリスナー）
- エラー時のフォールバック処理

### データ構造の仕様

Chrome Storage Localに保存されるデータは以下の構造を持ちます：

```
{
  version: "0.0.1",  // package.jsonのバージョンと同期
  settings: {
    newTab: {
      position: 'first' | 'last' | 'right' | 'left' | 'default',
      openInBackground: boolean
    },
    loadingPage: {
      position: 'first' | 'last' | 'right' | 'left' | 'default'
    },
    afterTabClosing: {
      activateTab: 'first' | 'last' | 'right' | 'left' | 'inActivatedOrder' | 'sourceTab' | 'sourceTabAndOrder' | 'default'
    },
    tabOnActivate: {
      behavior: 'default' | 'last' | 'first'
    },
    popup: {
      openAsNewTab: boolean
    }
  }
}
```

**データ構造の特徴**
- バージョン管理により将来の移行を容易に
- 機能ごとに名前空間を分離
- 型安全性を保証する構造
- デフォルト値の明確な定義

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
- 100msデバウンスによるレースコンディション対策
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
4. **レースコンディション対策**: 100msのデバウンス処理で連続イベントを制御

### 管理されるステート

**タブ関連ステート** (`src/tabs/state/`)
- `activationHistory`: タブのアクティベーション履歴（最大50件）
  - タブをアクティブにした順序を記録
  - タブクローズ時の次タブ決定に使用
- `indexCache`: タブのインデックス情報
  - タブIDとインデックスのマッピング
  - タブ位置計算の高速化
- `sourceMap`: タブの開元関係（openerTabId）
  - どのタブから開かれたかを記録
  - Source Tab設定で使用
- `tabSnapshot`: 現在のタブ状態のキャッシュ
  - chrome.tabs.query()の呼び出しを削減
  - パフォーマンス向上

**設定ステート** (`src/settings/state/`)
- `appData`: アプリケーション設定とバージョン
  - chrome.storage.localに永続化
  - Options画面とService Worker間で同期

### Service Worker ライフサイクル管理

**30秒再起動への対応**
```typescript
// src/state/initializer.ts
export const initializeAllStates = async () => {
  if (isInitialized) return; // 既に初期化済み
  
  await Promise.all([
    initializeActivationHistory(),
    initializeIndexCache(),
    initializeSourceMap(),
    initializeAppData(),
    initializeTabSnapshot(),
  ]);
  
  markInitialized();
};

// 各ハンドラーでの使用
export const handleNewTab = async (tab: chrome.tabs.Tab) => {
  if (needsInitialization()) {
    await initializeAllStates();
  }
  // 以降、同期的に処理
};
```

## オリジナル拡張機能の仕様

オリジナルのTab Position Options拡張機能の詳細な仕様と実装については、`/docs/original-extension/`ディレクトリを参照：

- **specification.md**: オリジナル拡張機能の完全な機能仕様書
- **options-page-assets/**: オリジナルの設定画面の実装（HTML/CSS/JS）
- **screenshots/**: 各機能のUIスクリーンショット

## 開発時の注意点

1. **Service Worker の制限**
   - DOM APIは使用不可
   - 永続的な状態保持は不可（chrome.storage APIを使用）
   - イベント駆動型の実装が必要

2. **権限の最小化**
   - 必要最小限の権限のみをmanifest.jsonで要求
   - ユーザーのプライバシーを考慮

3. **エラーハンドリング**
   - chrome.runtime.lastErrorのチェック
   - Promise rejectionの適切な処理

4. **パフォーマンス**
   - 大量のタブ操作時のバッチ処理
   - 設定変更時のデバウンス処理

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
   - 定数は大文字のスネークケース（UPPER_SNAKE_CASE）で定義
   - インポートは相対パスではなく`@/`エイリアスを使用した絶対パスで記述

8. **ステート管理パターン**
   すべてのステートモジュールは以下の同期的パターンに従う：

   ```typescript
   // グローバルメモリ状態
   let state: Type = defaultValue;

   // 初期化（Service Worker起動時に一度だけ）
   export const initializeState = async () => {
     const result = await chrome.storage.session.get('key');
     state = result.key || defaultValue;
   };

   // 同期的な読み取り
   export const getState = () => state;

   // 同期的な書き込み（メモリ即座更新 + ストレージ遅延保存）
   const setState = (value: Type) => {
     state = value;
     Promise.resolve().then(() => {
       chrome.storage.session.set({ key: value }).catch(() => {});
     });
   };
   ```

9. **Service Worker 再起動対応**
   - すべてのイベントハンドラーの先頭で `needsInitialization()` をチェック
   - 必要に応じて `initializeAllStates()` を呼び出し
   - レースコンディション対策として100msのデバウンス処理を実装

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

## WXTの特徴

- **ファイルベースのエントリーポイント**: entrypoints/ディレクトリに配置
- **自動マニフェスト生成**: manifest.jsonは不要、wxt.config.tsで設定
- **真のHMR**: UI開発で即座に反映、content/backgroundスクリプトも高速リロード
- **クロスブラウザ対応**: Chrome、Firefox、Edge、Safariに対応
- **アイコンクリック時の動作**: popupを使用せず、直接オプションページを開く

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
- GitHub ReleaseとChrome Web Storeへの同時アップロード
- **タグは自動的に作成される**（手動でタグを作成しない）

### リリース時の重要な制約
1. **バージョン番号は`package.json`のみで管理** - 他の場所でバージョンをハードコードしない
2. **Chrome Web Store APIの制限** - APIではZIPファイルのアップロードのみ可能。ストア掲載情報（説明文、スクリーンショット等）の更新は不可
3. **リリースワークフローの実行前に必ずビルドとテストが通ることを確認**
4. **手動でGitタグを作成しない** - ワークフローが自動的に処理する

### コード実装時の注意
1. **Service Workerの制限を常に意識** - DOM API使用不可、イベント駆動型実装
2. **エラーハンドリング** - `chrome.runtime.lastError`の確認を忘れない
3. **非同期処理** - Chrome Extension APIは基本的に非同期。適切にawaitを使用

### GitHub Secretsの構成
リリースワークフローは以下のRepository Secretsに依存：
- `CHROME_EXTENSION_ID`: Chrome Web StoreでのID
- `CHROME_CLIENT_ID`: OAuth 2.0クライアントID
- `CHROME_CLIENT_SECRET`: OAuth 2.0クライアントシークレット
- `CHROME_REFRESH_TOKEN`: OAuth 2.0リフレッシュトークン

これらが設定されていないとリリースワークフローは失敗します。