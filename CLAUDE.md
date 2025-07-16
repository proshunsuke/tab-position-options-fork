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
- **Chrome Extension API**: Manifest V3

## プロジェクト構造

```
tab-position-options-fork/
├── entrypoints/
│   ├── background.ts         # Service Worker - タブ操作のコアロジック
│   └── options/
│       ├── index.html       # 設定画面のHTMLエントリー
│       ├── main.tsx         # 設定画面のメインエントリー
│       ├── App.tsx          # 設定画面のメインコンポーネント
│       └── style.css        # 設定画面のスタイル
├── src/
│   ├── shared/
│   │   ├── types/           # 共通型定義
│   │   ├── utils/           # ユーティリティ関数
│   │   └── storage.ts       # chrome.storage APIのラッパー
│   └── styles/
│       └── index.css        # Tailwind CSS 4のメインスタイル
├── public/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── wxt.config.ts            # WXT設定ファイル
├── biome.json              # Biomeリンター/フォーマッター設定
├── tsconfig.json           # TypeScript設定
├── tsconfig.node.json      # Node.js環境用TypeScript設定
├── postcss.config.js       # PostCSS設定
└── package.json
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

# フォーマットのみ実行
npm run format

# CI環境用のチェック（エラーがあれば失敗）
npm run check:ci

# テストの実行
npm run test
```

## 主要機能

### 1. 新規タブ（New Tab）設定
- **Always first**: 常に最初に開く
- **Always last**: 常に最後に開く
- **Right of current tab**: 現在のタブの右側に開く（デフォルト）
- **Left of current tab**: 現在のタブの左側に開く
- **Default**: ブラウザのデフォルト動作

### 2. ローディングページ（Loading Page）設定
新しいページを読み込む際のタブ位置（New Tabと同じオプション）

### 3. タブを閉じた後のアクティブタブ（Activate Tab After Tab Closing）
タブを閉じた後にどのタブをアクティブにするか：
- **First tab**: 最初のタブ
- **Last tab**: 最後のタブ
- **Right tab**: 右側のタブ
- **Left tab**: 左側のタブ（デフォルト）
- **In activated order**: アクティブ化された順序
- **Source tab (Open link)**: リンク元のタブ
- **Source tab (Open link) & In activated order**: リンク元のタブとアクティブ化順序の組み合わせ
- **Default**: ブラウザのデフォルト動作

### 4. アクティブタブの動作（Tab on Activate）
- **Default**: デフォルト動作（デフォルト）
- **Last**: 最後のタブ
- **First**: 最初のタブ

### 5. ポップアップ（Pop-up）設定
- **Open pop-up window as new tab**: ポップアップウィンドウを新しいタブとして開く

### 6. 設定の保存
- `chrome.storage.sync` APIを使用して設定をGoogleアカウントに同期
- すべての設定はOptionsページで管理

## Chrome拡張機能API使用方法

### 主要API
- **chrome.tabs**: タブの作成、移動、クエリ等の操作
- **chrome.storage.sync**: 設定の保存とGoogleアカウント間での同期
- **chrome.runtime**: 拡張機能内でのメッセージング

## ビルド設定

### 主要な設定ファイル
- **wxt.config.ts**: WXTの設定ファイル、Reactモジュール使用、ポート5789で開発サーバー起動
- **tsconfig.json**: TypeScript設定、パスエイリアス（@/）を定義
- **biome.json**: リンター/フォーマッター設定、警告もエラーとして扱う

## 設定項目の詳細仕様

### 設定の概念と構造

拡張機能の設定は以下の5つのカテゴリに分類されます：

1. **新規タブの位置（New Tab）**
   - ブラウザで新しいタブを開く際の位置を制御
   - アドレスバーの＋ボタン、Ctrl+T、右クリックメニューなどから開かれるタブが対象

2. **ローディングページの位置（Loading Page）**
   - 既存のタブから新しいページを開く際の位置を制御
   - リンククリック、window.open()、target="_blank"などが対象

3. **タブを閉じた後のアクティブタブ（Activate Tab After Tab Closing）**
   - タブを閉じた際に次にアクティブにするタブを制御
   - ユーザーエクスペリエンスを考慮した複数のオプションを提供

4. **タブのアクティブ時動作（Tab on Activate）**
   - 特定の条件下でタブの左右に新しいタブを開く機能
   - 高度なタブ管理のためのオプション

5. **ポップアップウィンドウ（Pop-up）**
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
  version: "1.0.0",  // package.jsonのバージョンと同期
  settings: {
    newTab: {
      position: 'first' | 'last' | 'right' | 'left' | 'default'
    },
    loadingPage: {
      position: 'first' | 'last' | 'right' | 'left' | 'default'
    },
    afterTabClosing: {
      activateTab: 'first' | 'last' | 'right' | 'left' | 'lastAccessed' | 'default'
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
- React Contextを使用した設定の状態管理
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

## Tailwind CSS 4の設定

- 設定ファイル（tailwind.config.js）は不要
- src/styles/index.cssで@importと@themeディレクティブを使用
- Chromeブランドカラーをカスタムテーマ変数として定義

## WXTの特徴

- **ファイルベースのエントリーポイント**: entrypoints/ディレクトリに配置
- **自動マニフェスト生成**: manifest.jsonは不要、wxt.config.tsで設定
- **真のHMR**: UI開発で即座に反映、content/backgroundスクリプトも高速リロード
- **クロスブラウザ対応**: Chrome、Firefox、Edge、Safariに対応
- **アイコンクリック時の動作**: popupを使用せず、直接オプションページを開く