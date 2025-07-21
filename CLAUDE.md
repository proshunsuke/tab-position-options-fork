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
│   ├── background.ts        # Service Worker
│   └── options/            # 設定画面
├── src/
│   ├── tabs/               # タブ操作ロジック
│   ├── storage.ts          # ストレージ管理
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

## 主要機能

### 1. 新規タブ（New Tab）設定
- **Always first**: 常に最初に開く
- **Always last**: 常に最後に開く
- **Right of current tab**: 現在のタブの右側に開く
- **Left of current tab**: 現在のタブの左側に開く
- **Default**: ブラウザのデフォルト動作（デフォルト）

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
      position: 'first' | 'last' | 'right' | 'left' | 'default'
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

**イベント駆動型の設計**
- chrome.tabs APIのイベントリスナーを使用
- 設定に基づいて動的にタブ位置を調整
- 非同期処理による高速な応答

**タブ操作の最適化**
- バッチ処理による複数タブの効率的な管理
- タブグループAPIとの互換性確保
- ウィンドウ間のタブ移動への対応

### 2. 設定管理システム

**リアクティブな設定更新**
- Reactの状態管理（useState）を使用した設定の管理
- chrome.storage.onChangedリスナーによる即座の反映
- 設定画面とバックグラウンドスクリプトの同期

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

### リリースワークフローの仕組み
`.github/workflows/release.yml`で定義されたワークフローを使用します：
- 手動実行のみ（`workflow_dispatch`）
- `package.json`のバージョンを読み取ってリリース
- GitHub ReleaseとChrome Web Storeへの同時アップロード

### リリース時の重要な制約
1. **バージョン番号は`package.json`のみで管理** - 他の場所でバージョンをハードコードしない
2. **Chrome Web Store APIの制限** - APIではZIPファイルのアップロードのみ可能。ストア掲載情報（説明文、スクリーンショット等）の更新は不可
3. **リリースワークフローの実行前に必ずビルドとテストが通ることを確認**

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