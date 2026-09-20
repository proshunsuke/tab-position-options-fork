---
name: tab-position-release
description: Tab Position Options Forkのリリース準備、Changelog・申請文書の更新、ダッシュボードへの反映、リリース実行の手順。これらの作業を依頼された場合に使用する。
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
- `CHANGELOG.md`を更新したら、`CHROMEWEBSTORE.md`の全10言語の説明末尾にあるバージョン別変更履歴も同時に更新する。新旧すべてのバージョン・項目を同じ順序で含め、英語は正本と同一の文言、他言語は同じ意味の翻訳とする。各言語の説明全体が16,000文字以内であることを確認する。

## リリース準備

1. 対象バージョンと変更内容を確認し、PRを作る場合は変更をコミットする前に`release/vX.X.X`ブランチを用意する。
2. バージョンの正本である[package.json](../../../package.json)を更新し、`npm install`でlockfileを更新する。アプリや設定にバージョンをハードコードしない。
3. 上記の形式でChangelogを更新する。
4. [CHROMEWEBSTORE.md](../../../CHROMEWEBSTORE.md)の掲載文・単一用途・権限理由・データ使用・画像アセット・対象バージョンを、実装と照合して更新する。データの扱いが変わった場合は[PRIVACY.md](../../../PRIVACY.md)も先に更新し、説明を一致させる。READMEの変更が必要なら3言語を同期する。
5. `CHROMEWEBSTORE.md`はダッシュボードのページ・項目に対応する転記元とし、対象バージョンの入力文・選択値・画像ファイルを一意に記載する。過去の掲載文、調査メモ、提出・公開履歴は混在させない。文字数制限と実装との一致を確認し、画面上だけで文案を変更しない。
6. 型チェック・lint・全E2E・Chromeビルドの成功を確認する。環境準備とE2E実行には[tab-position-e2e](../tab-position-e2e/SKILL.md)を使用する。

```fish
npx wxt prepare
npm run typecheck
npm run lint:check
npm run test:e2e
```

`test:e2e`は先に`npm run build`を実行するため、成功後に変更していなければ同じビルドを繰り返す必要はない。

コミット・PR作成が依頼に含まれる場合、コミットは`chore: bump version to X.X.X`、PRの向き先は`main`とする。英語の本文にバージョン、Changelogと同じ主な変更、検証結果のチェックリストを含める。

## リリース実行

リリース実行またはダッシュボードへの反映を依頼された場合は[公開手順](references/publish.md)を読む。Gitタグは手動作成しない。
