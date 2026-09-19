---
name: tab-position-release
description: Tab Position Options Forkのリリース準備、Changelog更新、リリース実行の手順。これらの作業を依頼された場合に使用する。
---

# リリースとChangelog

このリポジトリのルートでコマンドを実行する。以下のリポジトリへのリンクは、このSkillからの相対パス。

依頼された範囲を実施する。Changelogの編集だけならバージョン更新やPR作成へ進まず、リリース準備だけなら公開処理へ進まない。

## Changelogの編集

[CHANGELOG.md](../../../CHANGELOG.md)には、リリース準備中の対象バージョンと過去のリリースを、新しい順に記載する。

- 見出しはバージョン番号のみ（例：`## 0.2.2`）。日付・Unreleasedセクションは追加しない。
- 内容は英語の箇条書きで、Fixed・Added・Removedなどの動詞で始める。
- ユーザーから見た新機能・修正・動作変更のみ記載する。
- 内部実装の詳細・数値、テスト追加、内部リファクタリング、`Note:`などの補足セクションは記載しない。

## リリース準備

1. 対象バージョンと変更内容を確認し、PRを作る場合は変更をコミットする前に`release/vX.X.X`ブランチを用意する。
2. バージョンの正本である[package.json](../../../package.json)を更新し、`npm install`でlockfileを更新する。アプリや設定にバージョンをハードコードしない。
3. 上記の形式でChangelogを更新する。
4. 型チェック・lint・全E2E・Chromeビルドの成功を確認する。環境準備とE2E実行には[tab-position-e2e](../tab-position-e2e/SKILL.md)を使用する。

```fish
npx wxt prepare
npm run typecheck
npm run lint:check
npm run test:e2e
```

`test:e2e`は先に`npm run build`を実行するため、成功後に変更していなければ同じビルドを繰り返す必要はない。

コミット・PR作成が依頼に含まれる場合、コミットは`chore: bump version to X.X.X`、PRの向き先は`main`とする。英語の本文にバージョン、Changelogと同じ主な変更、検証結果のチェックリストを含める。

## リリース実行

実行を依頼された場合にだけ[公開手順](references/publish.md)を読む。Gitタグは手動作成しない。
