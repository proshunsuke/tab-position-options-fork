---
name: tab-position-debug
description: Tab Position Options ForkのService Worker停止・再起動やタブ挙動をログで調査する場合に使用する。DevToolsを閉じた再現と保存ログの収集・後片付けを扱う。
---

# Service Workerのログ調査

Service WorkerのDevToolsを開くと停止条件が変わるため、アイドル停止に関係する不具合はDevToolsを閉じて再現する。30秒ごとの定期再起動を前提にしない。

## ログの追加

1. 調査前の差分と権限を確認し、今回追加する計測箇所を絞る。
2. [src/utils/debugLogger.ts](../../../src/utils/debugLogger.ts)の`debugLog`・`debugWarn`・`debugError`を使い、対象イベント・タブID・windowId・必要な状態を記録する。引数は`tag, message, tabs?, data?`。
3. [wxt.config.ts](../../../wxt.config.ts)の権限は調査に必要な場合だけ追加する。`tabs`はURL・タイトルなどの取得が必要な場合、`unlimitedStorage`は保存容量が不足する場合に限る。
4. ビルドして調査対象の拡張機能へ反映し、WorkerのDevToolsを閉じて再現する。

loggerは`chrome.storage.local`の`debug_logs`へ保存し、最大件数を超えると古いログを削除する。高頻度の計測はタイミングを変え、並行書き込みではログが欠落する可能性もあるため、ログの不在だけでイベント未発火と断定しない。

## 収集と切り分け

- 再現操作が終わってから、対象拡張機能のコンテキストで`chrome.storage.local.get("debug_logs")`を実行して取得する。設定ページのコンソールなど、Chrome拡張APIを利用できる場所を使う。
- イベント時刻・タブID・windowIdを照合し、初期化前後の状態、タブの位置とアクティブ状態を確認する。
- E2Eのメモリリセットと実際のWorker停止を区別する。回帰テストを追加する場合は[tab-position-e2e](../tab-position-e2e/SKILL.md)を使用する。

## 後片付け

- 必要な調査結果を残した後、今回追加したログ呼び出しと調査専用の権限を取り除く。既存のloggerユーティリティや他の変更は削除しない。
- 調査用の保存ログを消す場合は`chrome.storage.local.remove("debug_logs")`で対象キーだけを削除する。設定を含むstorage全体をクリアしない。
- 最終差分に調査用コード・権限が残っていないことを確認する。
