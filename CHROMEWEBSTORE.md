# Chrome Web Store submission information

[Developer Dashboard](https://chrome.google.com/webstore/devconsole/8009c97a-122b-4cb9-abdd-a961267915fc/bimiahgcjenkoacmdfggckkaflnnebki/edit)

Target version: **1.1.0**. The values below are the intended submission contents, not a record of what is currently published. Headings match the Japanese dashboard; copy each text block into the indicated field and locale. “空欄” means leave the field empty; “維持” means keep the existing value or upload.

## パッケージ

| 項目 | 値 |
| --- | --- |
| パッケージ | `dist/tab-position-options-fork-1.1.0-chrome.zip` |
| バージョン | `1.1.0` (from `package.json`) |
| アイテムタイプ | 拡張機能 |
| 必須権限 | `storage` |
| 任意権限 | `tabs`, `webNavigation`, `scripting` (requested when using the related features) |
| サイトへのアクセス | 任意: `http://*/*`, `https://*/*` (requested when enabling External Links; runtime content script, all frames) |
| 検証済み CRX アップロード | 無効のまま維持 |

## ストアの掲載情報

### 商品の詳細

| 項目 | 値 |
| --- | --- |
| パッケージのタイトル | Tab Position Options Fork (from manifest) |
| パッケージの概要 | `__MSG_extensionDescription__`: `extensionDescription` in each [locales/*.json](locales/) (from manifest; maximum 132 characters) |
| カテゴリ | ワークフローと計画 |
| 言語 | 英語 |

#### 説明

Maximum: 16,000 characters per locale. Upload the localized package, then select each locale in the listing language selector and copy its description below. English is the source text and default locale; keep all 10 descriptions consistent when changing their meaning. Use the matching locale’s screenshots listed under 画像アセット.

Each description includes the full version history from [CHANGELOG.md](CHANGELOG.md), newest first. Keep the English entries identical to the source and translate every entry into the other nine languages in the same change.

##### English — `en`

```text
Tab Position Options Fork is a Manifest V3 reimplementation of the original Tab Position Options for Chrome. Customize where tabs open and which tab becomes active when you close a tab.

FEATURES
・New Tab: Always first / Always last / Right of current tab / Left of current tab / Default (Browser default)
・New Tab Background
・Activate Tab After Tab Closing: First tab / Last tab / Right tab / Left tab / In activated order / Source tab (Open link) / Source tab & Activated order / Default (Browser default)
・Tab on Activate: Default (Keep position) / First / Last
・New Tab — Matching URLs: Always first / Always last / Right of current tab / Left of current tab / Default (Browser default); Foreground / Background
・Loading Page — Matching URLs: Always last / Always middle / Always first
・Convert pop-up windows into tabs, with URL exceptions
・Open external links in new tabs
・External Links — Matching URLs: Page: exclude / Page: new foreground tab / Page: new background tab / Page: current tab/frame / Link: new foreground tab / Link: new background tab / Link: current tab/frame
・Use keyboard shortcuts to sort tabs by title or URL and switch to the last active tab
・Export and import settings files
・Automatically sync settings and URL rules when Chrome sync is enabled

HOW TO USE
1. Settings open automatically after installation. Use Chrome's Extensions menu or the toolbar icon to return to them.
2. Choose your preferences and add URL rules if needed.
3. Click Save Settings.
Chrome requests optional permissions when you first use a feature that needs them.

SUPPORT AND SOURCE CODE
https://github.com/proshunsuke/tab-position-options-fork
Report bugs or request features:
https://github.com/proshunsuke/tab-position-options-fork/issues

This is an independent community fork of the original Tab Position Options.
Original extension:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl

CHANGELOG
1.1.0
- Made tab, navigation, and website access optional, requesting permissions only when you use the features that need them

1.0.0
- Added the remaining original Tab Position Options features, completing the Manifest V3 reimplementation
- Added Tab on Activate settings to move activated tabs to the first or last position
- Added URL-specific rules for new-tab position and foreground/background behavior, and Loading Page rules for navigation
- Added pop-up conversion to tabs with URL exceptions
- Added external-link handling with page exclusions and current-tab, foreground-tab, and background-tab rules
- Added keyboard shortcuts to sort tabs by title or URL and switch to the last active tab
- Added settings import/export and automatic Chrome Sync, with local fallback and synchronization failure notices
- Added options-page and store-description translations for 10 locales
- Updated the options page with category navigation, a persistent save bar, and dedicated settings-management and shortcut sections
- Added automatic settings display after installation and reuse of existing settings tabs
- Fixed tab positions and selection changing when Chrome restores the previous session

0.2.2
- Fixed tab closing behavior on Chrome 147.0.7727.56
- Fixed tab closing behavior to keep working even if Chrome changes tab-close event order in future updates

0.2.1
- Fixed new tab positioning and tab closing behavior using stale session state after a Service Worker restart

0.2.0
- Fixed tab closing behavior on Chrome 146 to keep the configured activation order working reliably
- Updated the extension to work with the latest development toolchain and browser support

0.1.0
- Added "New Tab Background" option to open new tabs in the background while keeping the current tab active

0.0.6
- Significantly improved performance for all tab operations

0.0.5
- Fixed tab position settings not being applied when opening links from external applications

0.0.4
- Fixed issues with Service Worker restart handling that were not fully resolved in version 0.0.3

0.0.3
- Fixed unexpected behavior when Service Worker restarts after 30 seconds of inactivity

0.0.2
- Fixed "Left Tab" setting not working correctly when closing tabs opened via target="_blank" links
- Fixed tab order preservation during browser session restore

0.0.1
- Initial release
```

##### 日本語 — `ja`

```text
Tab Position Options Fork は、Chrome 向けに原版の Tab Position Options を Manifest V3 で再実装した拡張機能です。タブを開く位置や、タブを閉じた後にアクティブになるタブを設定できます。

機能
・新規タブ：常に先頭／常に末尾／現在のタブの右側／現在のタブの左側／既定（ブラウザに従う）
・新規タブをバックグラウンドで開く
・タブを閉じた後に選択するタブ：先頭のタブ／末尾のタブ／右側のタブ／左側のタブ／最後にアクティブだったタブ／リンクを開いた元のタブ／元のタブ、なければ最後にアクティブだったタブ／既定（ブラウザに従う）
・タブをアクティブにしたとき：既定（位置を維持）／先頭／末尾
・新規タブ — URL 別ルール：常に先頭／常に末尾／現在のタブの右側／現在のタブの左側／既定（ブラウザに従う）; 前面で開く／バックグラウンドで開く
・ページ読み込み時 — URL 別ルール：常に末尾／常に中央／常に先頭
・ポップアップウィンドウをタブに変換し、URL 別の例外を設定
・外部リンクを新規タブで開く
・外部リンク — URL 別ルール：ページ：除外／ページ：新規タブを前面で開く／ページ：新規タブを背景で開く／ページ：現在のタブ・フレームで開く／リンク先：新規タブを前面で開く／リンク先：新規タブを背景で開く／リンク先：現在のタブ・フレームで開く
・キーボードショートカットでタイトル・URL 順の並べ替えや直前のアクティブタブへの切り替え
・設定ファイルのエクスポート・インポート
・Chrome の同期が有効な場合、設定と URL ルールを自動同期

使い方
1. インストール後に設定画面が自動的に開きます。再度開く場合は、Chrome の拡張機能メニューまたはツールバーアイコンを使います。
2. 動作を設定し、必要に応じて URL ルールを追加します。
3. 「設定を保存」をクリックします。
権限が必要な機能を初めて使うときに、Chrome が必要な権限を要求します。

サポートとソースコード
https://github.com/proshunsuke/tab-position-options-fork
不具合報告・機能の要望:
https://github.com/proshunsuke/tab-position-options-fork/issues

原版の Tab Position Options から派生した、独立したコミュニティフォークです。
原版の拡張機能:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl

変更履歴
1.1.0
- タブ、ナビゲーション、ウェブサイトへのアクセスを任意権限に変更し、必要な機能を使うときだけ権限を要求するよう変更

1.0.0
- 原版 Tab Position Options の残りの機能を追加し、Manifest V3 向けの再実装を完了
- アクティブになったタブを先頭または末尾へ移動する設定を追加
- 新規タブの位置と前面・背景の開き方を指定する URL 別ルール、およびページ移動時の配置ルールを追加
- URL の例外を指定できるポップアップのタブ変換機能を追加
- ページの除外、現在のタブ・前面の新規タブ・背景の新規タブのルールを指定できる外部リンク処理を追加
- タイトル・URL でのタブの並べ替えと、直前のアクティブタブへの切り替えを行うキーボードショートカットを追加
- 設定のインポート・エクスポートと Chrome 自動同期を追加し、同期失敗時のローカル設定利用と通知に対応
- 設定画面とストア説明文を10言語に翻訳
- 設定画面にカテゴリ別ナビゲーション、常時表示の保存バー、設定管理・ショートカット専用セクションを追加
- インストール後の設定画面の自動表示と、既存の設定タブの再利用を追加
- Chrome が前回のセッションを復元する際に、タブの位置や選択状態が変わる問題を修正

0.2.2
- Chrome 147.0.7727.56 でのタブを閉じる際の動作を修正
- 今後の Chrome 更新でタブを閉じるイベントの順序が変わっても、閉じた後の動作が維持されるよう修正

0.2.1
- Service Worker 再起動後に古いセッション状態を使用していた新規タブ配置とタブを閉じた後の動作を修正

0.2.0
- Chrome 146 で、設定したアクティベーション順序が安定して機能するようタブを閉じた後の動作を修正
- 最新の開発ツールチェーンとブラウザ対応に合わせて拡張機能を更新

0.1.0
- 現在のタブをアクティブに保ったまま新規タブを背景で開く「新規タブをバックグラウンドで開く」設定を追加

0.0.6
- すべてのタブ操作のパフォーマンスを大幅に改善

0.0.5
- 外部アプリケーションからリンクを開いた際にタブの位置設定が適用されない問題を修正

0.0.4
- 0.0.3 で完全には解決していなかった Service Worker 再起動時の処理を修正

0.0.3
- 30秒間の非アクティブ状態の後に Service Worker が再起動した際の予期しない動作を修正

0.0.2
- target="_blank" のリンクから開いたタブを閉じる際に「左のタブ」設定が機能しない問題を修正
- ブラウザのセッション復元時にタブの順序が維持されるよう修正

0.0.1
- 初回リリース
```

##### 简体中文 — `zh_CN`

```text
Tab Position Options Fork 是面向 Chrome、基于 Manifest V3 重新实现的原版 Tab Position Options。您可以自定义标签页的打开位置，以及关闭标签页后激活哪个标签页。

功能
・新标签页：始终在最前面／始终在最后面／当前标签页右侧／当前标签页左侧／默认（遵循浏览器设置）
・在后台打开新标签页
・关闭标签页后激活的标签页：第一个标签页／最后一个标签页／右侧标签页／左侧标签页／最近激活的标签页／打开链接的来源标签页／来源标签页；若不存在则选择最近激活的标签页／默认（遵循浏览器设置）
・激活标签页：默认（保持位置）／最前面／最后面
・新标签页 — 按 URL 匹配的规则：始终在最前面／始终在最后面／当前标签页右侧／当前标签页左侧／默认（遵循浏览器设置）; 在前台打开／在后台打开
・页面加载时 — 按 URL 匹配的规则：始终在最后面／始终在中间／始终在最前面
・将弹出窗口转换为标签页，并设置 URL 例外
・在新标签页中打开外部链接
・外部链接 — 按 URL 匹配的规则：页面：排除／页面：新前台标签页／页面：新后台标签页／页面：当前标签页或框架／链接：新前台标签页／链接：新后台标签页／链接：当前标签页或框架
・通过键盘快捷键按标题或 URL 排序标签页，或切换到上一个活动标签页
・导出和导入设置文件
・启用 Chrome 同步时自动同步设置和 URL 规则

使用方法
1. 安装后设置页面会自动打开。之后可通过 Chrome 的扩展程序菜单或工具栏图标再次打开。
2. 选择所需设置，并根据需要添加 URL 规则。
3. 点击“保存设置”。
首次使用需要权限的功能时，Chrome 会请求相应权限。

支持与源代码
https://github.com/proshunsuke/tab-position-options-fork
报告问题或提出功能建议:
https://github.com/proshunsuke/tab-position-options-fork/issues

这是原版 Tab Position Options 的独立社区分支。
原版扩展程序:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl

更新日志
1.1.0
- 将标签页、导航和网站访问权限改为可选，仅在使用相关功能时请求权限

1.0.0
- 添加原版 Tab Position Options 的其余功能，完成 Manifest V3 重制
- 添加激活标签页时将其移至最前或最后的设置
- 添加按 URL 设置新标签页位置及前台或后台打开方式的规则，以及页面导航时的配置规则
- 添加将弹出窗口转换为标签页的功能，支持 URL 例外
- 添加外部链接处理，支持页面排除及当前标签页、前台新标签页和后台新标签页规则
- 添加按标题或 URL 排序标签页及切换到上一个活动标签页的键盘快捷键
- 添加设置导入、导出和 Chrome 自动同步，支持同步失败时使用本地设置并显示通知
- 为设置页面和商店说明添加10种语言的翻译
- 更新设置页面，添加分类导航、始终可见的保存栏，以及独立的设置管理和快捷键区域
- 添加安装后自动显示设置页面及复用已有设置标签页的功能
- 修复 Chrome 恢复上次会话时标签页位置和选中状态发生变化的问题

0.2.2
- 修复 Chrome 147.0.7727.56 中关闭标签页的行为
- 修复关闭标签页的行为，使其在未来 Chrome 更新改变事件顺序时仍可正常工作

0.2.1
- 修复 Service Worker 重启后，新标签页定位和关闭标签页的行为使用过期会话状态的问题

0.2.0
- 修复 Chrome 146 中关闭标签页的行为，确保设置的激活顺序稳定工作
- 更新扩展程序以适配最新开发工具链和浏览器支持

0.1.0
- 添加“在后台打开新标签页”选项，在保持当前标签页激活的同时在后台打开新标签页

0.0.6
- 显著提升所有标签页操作的性能

0.0.5
- 修复从外部应用程序打开链接时未应用标签页位置设置的问题

0.0.4
- 修复 0.0.3 中未完全解决的 Service Worker 重启处理问题

0.0.3
- 修复 Service Worker 在闲置30秒后重启时出现的异常行为

0.0.2
- 修复关闭通过 target="_blank" 链接打开的标签页时，“左侧标签页”设置不起作用的问题
- 修复浏览器恢复会话时未保留标签页顺序的问题

0.0.1
- 首次发布
```

##### 繁體中文 — `zh_TW`

```text
Tab Position Options Fork 是針對 Chrome、以 Manifest V3 重新實作原版 Tab Position Options 的擴充功能。您可以自訂分頁的開啟位置，以及關閉分頁後要啟用哪個分頁。

功能
・新分頁：一律置於最前方／一律置於最後方／目前分頁的右側／目前分頁的左側／預設（依瀏覽器設定）
・在背景開啟新分頁
・關閉分頁後啟用的分頁：第一個分頁／最後一個分頁／右側分頁／左側分頁／最近啟用的分頁／開啟連結的來源分頁／來源分頁，若無則選擇最近啟用的分頁／預設（依瀏覽器設定）
・啟用分頁時：預設（保留位置）／最前方／最後方
・新分頁 — URL 比對規則：一律置於最前方／一律置於最後方／目前分頁的右側／目前分頁的左側／預設（依瀏覽器設定）; 在前景開啟／在背景開啟
・載入網頁時 — URL 比對規則：一律置於最後方／一律置於中間／一律置於最前方
・將彈出視窗轉換為分頁，並設定 URL 例外
・在新分頁開啟外部連結
・外部連結 — URL 比對規則：頁面：排除／頁面：新前景分頁／頁面：新背景分頁／頁面：目前分頁或框架／連結：新前景分頁／連結：新背景分頁／連結：目前分頁或框架
・透過鍵盤快速鍵依標題或 URL 排序分頁，或切換至上一個作用中的分頁
・匯出及匯入設定檔
・啟用 Chrome 同步功能時自動同步設定和 URL 規則

使用方式
1. 安裝後會自動開啟設定頁面。之後可透過 Chrome 的擴充功能選單或工具列圖示再次開啟。
2. 選擇所需設定，並視需要新增 URL 規則。
3. 按一下「儲存設定」。
首次使用需要權限的功能時，Chrome 會要求相應權限。

支援與原始碼
https://github.com/proshunsuke/tab-position-options-fork
回報問題或提出功能建議:
https://github.com/proshunsuke/tab-position-options-fork/issues

這是原版 Tab Position Options 的獨立社群分支。
原版擴充功能:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl

更新紀錄
1.1.0
- 將分頁、導覽和網站存取權限改為選用，僅在使用相關功能時要求權限

1.0.0
- 新增原版 Tab Position Options 的其餘功能，完成 Manifest V3 重製
- 新增啟用分頁時將其移至最前或最後的設定
- 新增依 URL 設定新分頁位置及前景或背景開啟方式的規則，以及頁面導覽時的配置規則
- 新增將彈出視窗轉換為分頁的功能，支援 URL 例外
- 新增外部連結處理，支援頁面排除及目前分頁、前景新分頁和背景新分頁規則
- 新增依標題或 URL 排序分頁及切換至上一個作用中分頁的鍵盤快速鍵
- 新增設定匯入、匯出和 Chrome 自動同步，支援同步失敗時使用本機設定並顯示通知
- 為設定頁面與商店說明新增10種語言的翻譯
- 更新設定頁面，新增分類導覽、持續顯示的儲存列，以及獨立的設定管理和快速鍵區塊
- 新增安裝後自動顯示設定頁面及重用現有設定分頁的功能
- 修正 Chrome 還原上次工作階段時分頁位置與選取狀態改變的問題

0.2.2
- 修正 Chrome 147.0.7727.56 中關閉分頁的行為
- 修正關閉分頁的行為，使其在未來 Chrome 更新改變事件順序時仍可正常運作

0.2.1
- 修正 Service Worker 重新啟動後，新分頁定位與關閉分頁的行為使用過期工作階段狀態的問題

0.2.0
- 修正 Chrome 146 中關閉分頁的行為，確保設定的啟用順序穩定運作
- 更新擴充功能以配合最新開發工具鏈與瀏覽器支援

0.1.0
- 新增「在背景開啟新分頁」選項，在保持目前分頁啟用的同時於背景開啟新分頁

0.0.6
- 大幅提升所有分頁操作的效能

0.0.5
- 修正從外部應用程式開啟連結時未套用分頁位置設定的問題

0.0.4
- 修正 0.0.3 中未完全解決的 Service Worker 重新啟動處理問題

0.0.3
- 修正 Service Worker 在閒置30秒後重新啟動時出現的非預期行為

0.0.2
- 修正關閉透過 target="_blank" 連結開啟的分頁時，「左側分頁」設定無效的問題
- 修正瀏覽器還原工作階段時未保留分頁順序的問題

0.0.1
- 首次發行
```

##### 한국어 — `ko`

```text
Tab Position Options Fork는 원본 Tab Position Options를 Chrome용 Manifest V3로 재구현한 확장 프로그램입니다. 탭이 열리는 위치와 탭을 닫은 후 활성화할 탭을 설정할 수 있습니다.

기능
・새 탭: 항상 맨 앞 / 항상 맨 뒤 / 현재 탭 오른쪽 / 현재 탭 왼쪽 / 기본값(브라우저 기본값)
・새 탭을 백그라운드에서 열기
・탭을 닫은 후 활성화할 탭: 첫 번째 탭 / 마지막 탭 / 오른쪽 탭 / 왼쪽 탭 / 가장 최근에 활성화한 탭 / 링크를 연 원본 탭 / 원본 탭, 없으면 가장 최근에 활성화한 탭 / 기본값(브라우저 기본값)
・탭을 활성화할 때: 기본값(위치 유지) / 맨 앞 / 맨 뒤
・새 탭 — URL별 규칙: 항상 맨 앞 / 항상 맨 뒤 / 현재 탭 오른쪽 / 현재 탭 왼쪽 / 기본값(브라우저 기본값); 포그라운드에서 열기 / 백그라운드에서 열기
・페이지를 불러올 때 — URL별 규칙: 항상 맨 뒤 / 항상 가운데 / 항상 맨 앞
・팝업 창을 탭으로 전환하고 URL 예외 설정
・외부 링크를 새 탭에서 열기
・외부 링크 — URL별 규칙: 페이지: 제외 / 페이지: 새 전경 탭 / 페이지: 새 배경 탭 / 페이지: 현재 탭/프레임 / 링크: 새 전경 탭 / 링크: 새 배경 탭 / 링크: 현재 탭/프레임
・키보드 단축키로 제목·URL별 탭 정렬 및 직전에 활성화된 탭으로 전환
・설정 파일 내보내기·가져오기
・Chrome 동기화가 켜져 있으면 설정과 URL 규칙 자동 동기화

사용 방법
1. 설치 후 설정 화면이 자동으로 열립니다. 다시 열려면 Chrome 확장 프로그램 메뉴 또는 도구 모음 아이콘을 사용하세요.
2. 원하는 동작을 설정하고 필요하면 URL 규칙을 추가하세요.
3. '설정 저장'을 클릭하세요.
권한이 필요한 기능을 처음 사용할 때 Chrome에서 해당 권한을 요청합니다.

지원 및 소스 코드
https://github.com/proshunsuke/tab-position-options-fork
버그 신고 및 기능 요청:
https://github.com/proshunsuke/tab-position-options-fork/issues

이 프로젝트는 원본 Tab Position Options에서 파생된 독립적인 커뮤니티 포크입니다.
원본 확장 프로그램:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl

변경 이력
1.1.0
- 탭, 탐색 및 웹사이트 접근 권한을 선택 권한으로 바꾸고, 필요한 기능을 사용할 때만 요청

1.0.0
- 원본 Tab Position Options의 나머지 기능을 추가하여 Manifest V3 재구현 완료
- 활성화된 탭을 맨 앞이나 맨 뒤로 이동하는 설정 추가
- 새 탭의 위치와 전경·배경 열기를 지정하는 URL별 규칙 및 페이지 이동 시 배치 규칙 추가
- URL 예외를 지원하는 팝업 창의 탭 전환 기능 추가
- 페이지 제외와 현재 탭·전경 새 탭·배경 새 탭 규칙을 지원하는 외부 링크 처리 추가
- 제목·URL별 탭 정렬과 직전에 활성화된 탭으로 전환하는 키보드 단축키 추가
- 설정 가져오기·내보내기와 Chrome 자동 동기화 추가, 동기화 실패 시 로컬 설정 사용 및 알림 지원
- 설정 화면과 스토어 설명에 10개 언어 번역 추가
- 설정 화면에 카테고리 탐색, 항상 표시되는 저장 표시줄, 설정 관리 및 단축키 전용 영역 추가
- 설치 후 설정 화면 자동 표시 및 기존 설정 탭 재사용 추가
- Chrome이 이전 세션을 복원할 때 탭 위치와 선택 상태가 바뀌는 문제 수정

0.2.2
- Chrome 147.0.7727.56에서 탭을 닫을 때의 동작 수정
- 향후 Chrome 업데이트에서 탭 닫기 이벤트 순서가 바뀌어도 닫은 후의 동작이 유지되도록 수정

0.2.1
- Service Worker 재시작 후 오래된 세션 상태를 사용하던 새 탭 배치 및 탭 닫기 동작 수정

0.2.0
- Chrome 146에서 설정한 활성화 순서가 안정적으로 작동하도록 탭 닫기 동작 수정
- 최신 개발 도구 체인 및 브라우저 지원에 맞춰 확장 프로그램 업데이트

0.1.0
- 현재 탭을 활성 상태로 유지하면서 새 탭을 배경에서 여는 '새 탭을 백그라운드에서 열기' 옵션 추가

0.0.6
- 모든 탭 작업의 성능을 크게 개선

0.0.5
- 외부 애플리케이션에서 링크를 열 때 탭 위치 설정이 적용되지 않는 문제 수정

0.0.4
- 0.0.3에서 완전히 해결되지 않았던 Service Worker 재시작 처리 문제 수정

0.0.3
- 30초 동안 활동이 없어 Service Worker가 중지된 뒤 재시작할 때 발생하는 예기치 않은 동작 수정

0.0.2
- target="_blank" 링크로 연 탭을 닫을 때 '왼쪽 탭' 설정이 작동하지 않는 문제 수정
- 브라우저 세션 복원 시 탭 순서가 유지되도록 수정

0.0.1
- 최초 출시
```

##### Español — `es`

```text
Tab Position Options Fork es una reimplementación de Tab Position Options para Chrome con Manifest V3. Personaliza dónde se abren las pestañas y cuál se activa al cerrar una pestaña.

FUNCIONES
・Nueva pestaña: Siempre al principio / Siempre al final / A la derecha de la pestaña actual / A la izquierda de la pestaña actual / Predeterminado del navegador
・Abrir pestañas nuevas en segundo plano
・Pestaña que se activa al cerrar otra: Primera pestaña / Última pestaña / Pestaña de la derecha / Pestaña de la izquierda / Última pestaña activada / Pestaña de origen del enlace / Pestaña de origen o, si no existe, última pestaña activada / Predeterminado del navegador
・Al activar una pestaña: Predeterminado (conservar posición) / Al principio / Al final
・Nueva pestaña — Reglas por URL: Siempre al principio / Siempre al final / A la derecha de la pestaña actual / A la izquierda de la pestaña actual / Predeterminado del navegador; Primer plano / Segundo plano
・Al cargar una página — Reglas por URL: Siempre al final / Siempre en el centro / Siempre al principio
・Convierte ventanas emergentes en pestañas con excepciones por URL
・Abrir enlaces externos en pestañas nuevas
・Enlaces externos — Reglas por URL: Página: excluir / Página: nueva pestaña en primer plano / Página: nueva pestaña en segundo plano / Página: pestaña/marco actual / Enlace: nueva pestaña en primer plano / Enlace: nueva pestaña en segundo plano / Enlace: pestaña/marco actual
・Usa atajos para ordenar pestañas por título o URL y volver a la última pestaña activa
・Exporta e importa archivos de configuración
・Sincroniza automáticamente los ajustes y las reglas de URL cuando la sincronización de Chrome está activada

CÓMO USARLA
1. Los ajustes se abren automáticamente tras la instalación. Para volver a abrirlos, usa el menú de extensiones de Chrome o el icono de la barra de herramientas.
2. Elige tus preferencias y añade reglas de URL si lo necesitas.
3. Haz clic en Guardar configuración.
Chrome solicitará los permisos opcionales necesarios la primera vez que uses una función que los requiera.

ASISTENCIA Y CÓDIGO FUENTE
https://github.com/proshunsuke/tab-position-options-fork
Informa de errores o solicita funciones:
https://github.com/proshunsuke/tab-position-options-fork/issues

Este es un fork comunitario independiente del Tab Position Options original.
Extensión original:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl

HISTORIAL DE CAMBIOS
1.1.0
- Se hicieron opcionales los permisos de pestañas, navegación y sitios web, y se solicitan solo al usar las funciones que los necesitan

1.0.0
- Añadidas las funciones restantes de Tab Position Options, completando la reimplementación para Manifest V3
- Añadidos ajustes para mover las pestañas activadas a la primera o última posición
- Añadidas reglas por URL para la posición y apertura en primer o segundo plano de nuevas pestañas, y reglas de posición al navegar
- Añadida la conversión de ventanas emergentes en pestañas con excepciones por URL
- Añadida la gestión de enlaces externos con exclusiones de páginas y reglas para la pestaña actual o nuevas pestañas en primer o segundo plano
- Añadidos atajos para ordenar pestañas por título o URL y volver a la última pestaña activa
- Añadidas la importación y exportación de ajustes y la sincronización automática de Chrome, con respaldo local y avisos de errores de sincronización
- Añadidas traducciones de los ajustes y la descripción de la tienda en 10 idiomas
- Actualizados los ajustes con navegación por categorías, una barra de guardado siempre visible y secciones de gestión de ajustes y atajos
- Añadidas la apertura automática de los ajustes tras la instalación y la reutilización de pestañas de ajustes existentes
- Corregidos los cambios de posición y selección de pestañas al restaurar Chrome la sesión anterior

0.2.2
- Corregido el comportamiento al cerrar pestañas en Chrome 147.0.7727.56
- Corregido el cierre de pestañas para que siga funcionando aunque futuras actualizaciones de Chrome cambien el orden de los eventos

0.2.1
- Corregido el uso de un estado de sesión desactualizado al colocar nuevas pestañas y cerrar pestañas tras reiniciar el Service Worker

0.2.0
- Corregido el cierre de pestañas en Chrome 146 para mantener de forma fiable el orden de activación configurado
- Actualizada la extensión para las herramientas de desarrollo y compatibilidad con navegadores más recientes

0.1.0
- Añadida la opción «Nueva pestaña en segundo plano» para abrir pestañas sin dejar de mantener activa la actual

0.0.6
- Mejorado significativamente el rendimiento de todas las operaciones con pestañas

0.0.5
- Corregida la falta de aplicación de la posición de pestañas al abrir enlaces desde aplicaciones externas

0.0.4
- Corregidos problemas de reinicio del Service Worker que no se habían resuelto por completo en la versión 0.0.3

0.0.3
- Corregido el comportamiento inesperado cuando el Service Worker se reinicia tras 30 segundos de inactividad

0.0.2
- Corregido el fallo de la opción «Pestaña izquierda» al cerrar pestañas abiertas mediante enlaces target="_blank"
- Corregida la conservación del orden de las pestañas al restaurar la sesión del navegador

0.0.1
- Primera versión
```

##### Français — `fr`

```text
Tab Position Options Fork est une réimplémentation de Tab Position Options pour Chrome avec Manifest V3. Personnalisez l’emplacement des nouveaux onglets et choisissez lequel devient actif après la fermeture d’un onglet.

FONCTIONNALITÉS
・Nouvel onglet: Toujours au début / Toujours à la fin / À droite de l’onglet actuel / À gauche de l’onglet actuel / Par défaut (selon le navigateur)
・Ouvrir les nouveaux onglets en arrière-plan
・Onglet à activer après la fermeture: Premier onglet / Dernier onglet / Onglet de droite / Onglet de gauche / Dernier onglet actif / Onglet à l’origine du lien / Onglet d’origine, sinon dernier onglet actif / Par défaut (selon le navigateur)
・À l’activation d’un onglet: Par défaut (conserver la position) / Au début / À la fin
・Nouvel onglet — Règles par URL: Toujours au début / Toujours à la fin / À droite de l’onglet actuel / À gauche de l’onglet actuel / Par défaut (selon le navigateur); Premier plan / Arrière-plan
・Au chargement d’une page — Règles par URL: Toujours à la fin / Toujours au milieu / Toujours au début
・Convertissez les fenêtres pop-up en onglets avec des exceptions par URL
・Ouvrir les liens externes dans de nouveaux onglets
・Liens externes — Règles par URL: Page : exclure / Page : nouvel onglet au premier plan / Page : nouvel onglet en arrière-plan / Page : onglet/cadre actuel / Lien : nouvel onglet au premier plan / Lien : nouvel onglet en arrière-plan / Lien : onglet/cadre actuel
・Utilisez les raccourcis pour trier les onglets par titre ou URL et revenir au dernier onglet actif
・Exportez et importez des fichiers de paramètres
・Synchronisez automatiquement les paramètres et les règles d’URL lorsque la synchronisation Chrome est activée

UTILISATION
1. Les paramètres s’ouvrent automatiquement après l’installation. Utilisez le menu Extensions de Chrome ou l’icône de la barre d’outils pour les rouvrir.
2. Choisissez vos préférences et ajoutez des règles d’URL si nécessaire.
3. Cliquez sur Enregistrer les paramètres.
Chrome demande les autorisations facultatives nécessaires lorsque vous utilisez pour la première fois une fonctionnalité qui en a besoin.

ASSISTANCE ET CODE SOURCE
https://github.com/proshunsuke/tab-position-options-fork
Signaler un bug ou demander une fonctionnalité :
https://github.com/proshunsuke/tab-position-options-fork/issues

Il s’agit d’un fork communautaire indépendant de Tab Position Options.
Extension d’origine :
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl

HISTORIQUE DES MODIFICATIONS
1.1.0
- Rendre facultatifs les accès aux onglets, à la navigation et aux sites Web, et ne les demander que lors de l’utilisation des fonctionnalités concernées

1.0.0
- Ajout des fonctions restantes de Tab Position Options, achevant sa réimplémentation pour Manifest V3
- Ajout de paramètres pour déplacer les onglets activés en première ou dernière position
- Ajout de règles par URL pour la position des nouveaux onglets et leur ouverture au premier plan ou en arrière-plan, ainsi que de règles de position lors de la navigation
- Ajout de la conversion des fenêtres pop-up en onglets avec des exceptions par URL
- Ajout de la gestion des liens externes avec exclusions de pages et règles pour l’onglet actuel ou de nouveaux onglets au premier plan ou en arrière-plan
- Ajout de raccourcis pour trier les onglets par titre ou URL et revenir au dernier onglet actif
- Ajout de l’importation et de l’exportation des paramètres et de la synchronisation automatique Chrome, avec conservation locale et notifications d’échec
- Ajout de traductions des paramètres et de la description de la boutique en 10 langues
- Mise à jour des paramètres avec navigation par catégories, barre d’enregistrement toujours visible et sections de gestion des paramètres et des raccourcis
- Ajout de l’ouverture automatique des paramètres après installation et de la réutilisation des onglets de paramètres existants
- Correction des changements de position et de sélection des onglets lorsque Chrome restaure la session précédente

0.2.2
- Correction du comportement à la fermeture des onglets dans Chrome 147.0.7727.56
- Correction de la fermeture des onglets pour préserver son fonctionnement si Chrome modifie l’ordre des événements dans de futures mises à jour

0.2.1
- Correction de l’utilisation d’un état de session obsolète pour placer les nouveaux onglets et fermer les onglets après un redémarrage du Service Worker

0.2.0
- Correction de la fermeture des onglets dans Chrome 146 pour respecter de façon fiable l’ordre d’activation configuré
- Mise à jour de l’extension pour les derniers outils de développement et la prise en charge des navigateurs

0.1.0
- Ajout de l’option « Nouvel onglet en arrière-plan » pour ouvrir des onglets tout en gardant l’onglet actuel actif

0.0.6
- Amélioration significative des performances de toutes les opérations sur les onglets

0.0.5
- Correction de la non-application du réglage de position des onglets lors de l’ouverture de liens depuis des applications externes

0.0.4
- Correction de problèmes de redémarrage du Service Worker non entièrement résolus dans la version 0.0.3

0.0.3
- Correction du comportement inattendu lorsque le Service Worker redémarre après 30 secondes d’inactivité

0.0.2
- Correction du dysfonctionnement de l’option « Onglet de gauche » à la fermeture d’onglets ouverts via des liens target="_blank"
- Correction de la conservation de l’ordre des onglets lors de la restauration de la session du navigateur

0.0.1
- Première version
```

##### Deutsch — `de`

```text
Tab Position Options Fork ist eine Neuimplementierung der ursprünglichen Chrome-Erweiterung Tab Position Options für Manifest V3. Legen Sie fest, wo Tabs geöffnet werden und welcher Tab nach dem Schließen eines Tabs aktiv wird.

FUNKTIONEN
・Neuer Tab: Immer am Anfang / Immer am Ende / Rechts vom aktuellen Tab / Links vom aktuellen Tab / Standard (Browsereinstellung)
・Neue Tabs im Hintergrund öffnen
・Tab nach dem Schließen aktivieren: Erster Tab / Letzter Tab / Rechter Tab / Linker Tab / Zuletzt aktiver Tab / Ursprungs-Tab des Links / Ursprungs-Tab, sonst zuletzt aktiver Tab / Standard (Browsereinstellung)
・Beim Aktivieren eines Tabs: Standard (Position beibehalten) / An den Anfang / Ans Ende
・Neuer Tab — URL-Regeln: Immer am Anfang / Immer am Ende / Rechts vom aktuellen Tab / Links vom aktuellen Tab / Standard (Browsereinstellung); Vordergrund / Hintergrund
・Beim Laden einer Seite — URL-Regeln: Immer am Ende / Immer in der Mitte / Immer am Anfang
・Pop-up-Fenster mit URL-Ausnahmen in Tabs umwandeln
・Externe Links in neuen Tabs öffnen
・Externe Links — URL-Regeln: Seite: ausschließen / Seite: neuer Vordergrund-Tab / Seite: neuer Hintergrund-Tab / Seite: aktueller Tab/Frame / Link: neuer Vordergrund-Tab / Link: neuer Hintergrund-Tab / Link: aktueller Tab/Frame
・Per Tastenkombination nach Titel oder URL sortieren und zum zuletzt aktiven Tab wechseln
・Einstellungsdateien exportieren und importieren
・Einstellungen und URL-Regeln bei aktivierter Chrome-Synchronisierung automatisch synchronisieren

VERWENDUNG
1. Nach der Installation öffnen sich die Einstellungen automatisch. Über das Erweiterungsmenü von Chrome oder das Symbol in der Symbolleiste können Sie sie erneut öffnen.
2. Wählen Sie Ihre Einstellungen und fügen Sie bei Bedarf URL-Regeln hinzu.
3. Klicken Sie auf Einstellungen speichern.
Chrome fragt nach den erforderlichen optionalen Berechtigungen, wenn Sie eine entsprechende Funktion zum ersten Mal verwenden.

SUPPORT UND QUELLCODE
https://github.com/proshunsuke/tab-position-options-fork
Fehler melden oder Funktionen vorschlagen:
https://github.com/proshunsuke/tab-position-options-fork/issues

Dies ist ein unabhängiger Community-Fork der ursprünglichen Erweiterung Tab Position Options.
Ursprüngliche Erweiterung:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl

ÄNDERUNGSPROTOKOLL
1.1.0
- Zugriffe auf Tabs, Navigation und Websites optional gemacht; Berechtigungen werden nur bei Verwendung der entsprechenden Funktionen angefordert

1.0.0
- Verbleibende Funktionen von Tab Position Options hinzugefügt und die Neuimplementierung für Manifest V3 abgeschlossen
- Einstellungen zum Verschieben aktivierter Tabs an die erste oder letzte Position hinzugefügt
- URL-Regeln für die Position neuer Tabs und das Öffnen im Vorder- oder Hintergrund sowie Positionsregeln bei Seitennavigationen hinzugefügt
- Umwandlung von Pop-up-Fenstern in Tabs mit URL-Ausnahmen hinzugefügt
- Verarbeitung externer Links mit Seitenausschlüssen und Regeln für den aktuellen Tab oder neue Tabs im Vorder- oder Hintergrund hinzugefügt
- Tastenkombinationen zum Sortieren nach Titel oder URL und zum Wechseln zum zuletzt aktiven Tab hinzugefügt
- Import und Export von Einstellungen sowie automatische Chrome-Synchronisierung mit lokaler Ausweichlösung und Fehlermeldungen hinzugefügt
- Übersetzungen der Einstellungen und der Store-Beschreibung für 10 Sprachen hinzugefügt
- Einstellungen um Kategorienavigation, eine stets sichtbare Speicherleiste und eigene Bereiche für Einstellungsverwaltung und Tastenkombinationen erweitert
- Automatisches Öffnen der Einstellungen nach der Installation und Wiederverwenden vorhandener Einstellungstabs hinzugefügt
- Änderungen der Tab-Positionen und Auswahl beim Wiederherstellen der letzten Chrome-Sitzung behoben

0.2.2
- Verhalten beim Schließen von Tabs in Chrome 147.0.7727.56 korrigiert
- Verhalten beim Schließen von Tabs gegen künftige Änderungen der Ereignisreihenfolge in Chrome abgesichert

0.2.1
- Verwendung veralteter Sitzungsdaten für neue Tab-Positionen und das Schließen von Tabs nach einem Service-Worker-Neustart behoben

0.2.0
- Verhalten beim Schließen von Tabs in Chrome 146 korrigiert, damit die eingestellte Aktivierungsreihenfolge zuverlässig erhalten bleibt
- Erweiterung an aktuelle Entwicklungswerkzeuge und Browserunterstützung angepasst

0.1.0
- Option „Neuer Tab im Hintergrund“ hinzugefügt, um neue Tabs zu öffnen und den aktuellen Tab aktiv zu lassen

0.0.6
- Leistung aller Tab-Operationen deutlich verbessert

0.0.5
- Fehlende Anwendung der Tab-Positionseinstellung beim Öffnen von Links aus externen Anwendungen behoben

0.0.4
- Probleme beim Service-Worker-Neustart behoben, die in Version 0.0.3 nicht vollständig gelöst waren

0.0.3
- Unerwartetes Verhalten beim Service-Worker-Neustart nach 30 Sekunden Inaktivität behoben

0.0.2
- Fehler der Einstellung „Linker Tab“ beim Schließen von Tabs behoben, die über target="_blank"-Links geöffnet wurden
- Beibehaltung der Tab-Reihenfolge beim Wiederherstellen der Browsersitzung korrigiert

0.0.1
- Erstveröffentlichung
```

##### Português (Brasil) — `pt_BR`

```text
Tab Position Options Fork é uma reimplementação do Tab Position Options original para Chrome com Manifest V3. Personalize onde as abas são abertas e qual aba se torna ativa após fechar uma aba.

RECURSOS
・Nova aba: Sempre no início / Sempre no final / À direita da aba atual / À esquerda da aba atual / Padrão do navegador
・Abrir novas abas em segundo plano
・Aba a ativar após fechar uma aba: Primeira aba / Última aba / Aba à direita / Aba à esquerda / Última aba ativa / Aba de origem do link / Aba de origem ou, se não existir, última aba ativa / Padrão do navegador
・Ao ativar uma aba: Padrão (manter posição) / Início / Final
・Nova aba — Regras por URL: Sempre no início / Sempre no final / À direita da aba atual / À esquerda da aba atual / Padrão do navegador; Primeiro plano / Segundo plano
・Ao carregar uma página — Regras por URL: Sempre no final / Sempre no meio / Sempre no início
・Converta janelas pop-up em abas com exceções por URL
・Abrir links externos em novas abas
・Links externos — Regras por URL: Página: excluir / Página: nova aba em primeiro plano / Página: nova aba em segundo plano / Página: aba/frame atual / Link: nova aba em primeiro plano / Link: nova aba em segundo plano / Link: aba/frame atual
・Use atalhos para ordenar abas por título ou URL e voltar à última aba ativa
・Exporte e importe arquivos de configurações
・Sincronize automaticamente configurações e regras de URL quando a sincronização do Chrome estiver ativada

COMO USAR
1. As configurações são abertas automaticamente após a instalação. Use o menu de extensões do Chrome ou o ícone na barra de ferramentas para abri-las novamente.
2. Escolha suas preferências e adicione regras de URL, se necessário.
3. Clique em Salvar configurações.
O Chrome solicitará as permissões opcionais necessárias na primeira vez que você usar um recurso que precise delas.

SUPORTE E CÓDIGO-FONTE
https://github.com/proshunsuke/tab-position-options-fork
Relate erros ou solicite recursos:
https://github.com/proshunsuke/tab-position-options-fork/issues

Este é um fork comunitário independente do Tab Position Options original.
Extensão original:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl

HISTÓRICO DE ALTERAÇÕES
1.1.0
- Tornou opcionais as permissões para acessar abas, navegação e sites, solicitando-as apenas ao usar os recursos correspondentes

1.0.0
- Adicionados os recursos restantes do Tab Position Options original, concluindo a reimplementação para Manifest V3
- Adicionadas configurações para mover abas ativadas para a primeira ou última posição
- Adicionadas regras por URL para a posição de novas abas e abertura em primeiro ou segundo plano, além de regras de posição durante a navegação
- Adicionada a conversão de pop-ups em abas com exceções por URL
- Adicionado o tratamento de links externos com exclusões de páginas e regras para a aba atual ou novas abas em primeiro ou segundo plano
- Adicionados atalhos para ordenar abas por título ou URL e voltar à última aba ativa
- Adicionadas a importação e exportação de configurações e a sincronização automática do Chrome, com alternativa local e avisos de falha
- Adicionadas traduções da página de configurações e da descrição na loja para 10 idiomas
- Atualizada a página de configurações com navegação por categorias, barra de salvamento sempre visível e seções de gerenciamento e atalhos
- Adicionadas a abertura automática das configurações após a instalação e a reutilização de abas de configurações existentes
- Corrigidas alterações na posição e seleção de abas quando o Chrome restaura a sessão anterior

0.2.2
- Corrigido o comportamento ao fechar abas no Chrome 147.0.7727.56
- Corrigido o fechamento de abas para continuar funcionando mesmo se futuras atualizações do Chrome alterarem a ordem dos eventos

0.2.1
- Corrigido o uso de estado de sessão desatualizado no posicionamento de novas abas e no fechamento de abas após reiniciar o Service Worker

0.2.0
- Corrigido o fechamento de abas no Chrome 146 para manter a ordem de ativação configurada funcionando de forma confiável
- Atualizada a extensão para as ferramentas de desenvolvimento e o suporte a navegadores mais recentes

0.1.0
- Adicionada a opção “Nova aba em segundo plano” para abrir abas mantendo a aba atual ativa

0.0.6
- Melhorado significativamente o desempenho de todas as operações com abas

0.0.5
- Corrigida a falta de aplicação da posição das abas ao abrir links de aplicativos externos

0.0.4
- Corrigidos problemas de reinicialização do Service Worker não totalmente resolvidos na versão 0.0.3

0.0.3
- Corrigido o comportamento inesperado quando o Service Worker reinicia após 30 segundos de inatividade

0.0.2
- Corrigida a opção “Aba à esquerda” ao fechar abas abertas por links target="_blank"
- Corrigida a preservação da ordem das abas ao restaurar a sessão do navegador

0.0.1
- Versão inicial
```

##### Русский — `ru`

```text
Tab Position Options Fork — это реализация оригинального расширения Tab Position Options для Chrome на Manifest V3. Настройте, где открываются вкладки и какая вкладка становится активной после закрытия текущей.

ВОЗМОЖНОСТИ
・Новая вкладка: Всегда в начале / Всегда в конце / Справа от текущей вкладки / Слева от текущей вкладки / По умолчанию (настройка браузера)
・Открывать новые вкладки в фоновом режиме
・Активная вкладка после закрытия: Первая вкладка / Последняя вкладка / Вкладка справа / Вкладка слева / Последняя активная вкладка / Исходная вкладка ссылки / Исходная вкладка, а при её отсутствии — последняя активная / По умолчанию (настройка браузера)
・При активации вкладки: По умолчанию (сохранять позицию) / В начало / В конец
・Новая вкладка — Правила по URL: Всегда в начале / Всегда в конце / Справа от текущей вкладки / Слева от текущей вкладки / По умолчанию (настройка браузера); На переднем плане / В фоновом режиме
・При загрузке страницы — Правила по URL: Всегда в конце / Всегда посередине / Всегда в начале
・Преобразование всплывающих окон во вкладки с исключениями по URL
・Открывать внешние ссылки в новых вкладках
・Внешние ссылки — Правила по URL: Страница: исключить / Страница: новая активная вкладка / Страница: новая фоновая вкладка / Страница: текущая вкладка/фрейм / Ссылка: новая активная вкладка / Ссылка: новая фоновая вкладка / Ссылка: текущая вкладка/фрейм
・Сочетания клавиш для сортировки по заголовку или URL и возврата к последней активной вкладке
・Экспорт и импорт файлов настроек
・Автоматическая синхронизация настроек и правил URL при включённой синхронизации Chrome

КАК ПОЛЬЗОВАТЬСЯ
1. После установки настройки откроются автоматически. Чтобы открыть их снова, используйте меню расширений Chrome или значок на панели инструментов.
2. Выберите нужные параметры и при необходимости добавьте правила URL.
3. Нажмите «Сохранить настройки».
Chrome запросит необходимые дополнительные разрешения при первом использовании соответствующей функции.

ПОДДЕРЖКА И ИСХОДНЫЙ КОД
https://github.com/proshunsuke/tab-position-options-fork
Сообщить об ошибке или предложить функцию:
https://github.com/proshunsuke/tab-position-options-fork/issues

Это независимый форк оригинального Tab Position Options, поддерживаемый сообществом.
Оригинальное расширение:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl

ИСТОРИЯ ИЗМЕНЕНИЙ
1.1.0
- Сделаны необязательными разрешения на вкладки, навигацию и доступ к сайтам; они запрашиваются только при использовании соответствующих функций

1.0.0
- Добавлены оставшиеся функции оригинального Tab Position Options, завершена реализация для Manifest V3
- Добавлены настройки перемещения активированных вкладок на первую или последнюю позицию
- Добавлены правила по URL для положения новых вкладок и открытия на переднем плане или в фоне, а также правила расположения при навигации
- Добавлено преобразование всплывающих окон во вкладки с исключениями по URL
- Добавлена обработка внешних ссылок с исключениями для страниц и правилами открытия в текущей вкладке либо в новой вкладке на переднем плане или в фоне
- Добавлены сочетания клавиш для сортировки вкладок по заголовку или URL и возврата к последней активной вкладке
- Добавлены импорт и экспорт настроек и автоматическая синхронизация Chrome с сохранением локальной копии и уведомлениями о сбоях
- Добавлены переводы страницы настроек и описания в магазине на 10 языков
- Страница настроек обновлена: добавлены навигация по категориям, постоянно видимая панель сохранения и разделы управления настройками и сочетаниями клавиш
- Добавлены автоматическое открытие настроек после установки и повторное использование существующих вкладок настроек
- Исправлено изменение положения и выбора вкладок при восстановлении предыдущего сеанса Chrome

0.2.2
- Исправлено поведение при закрытии вкладок в Chrome 147.0.7727.56
- Исправлено закрытие вкладок для сохранения корректной работы при будущих изменениях порядка событий в Chrome

0.2.1
- Исправлено использование устаревшего состояния сеанса при размещении новых вкладок и закрытии вкладок после перезапуска Service Worker

0.2.0
- Исправлено закрытие вкладок в Chrome 146 для надёжного соблюдения заданного порядка активации
- Расширение обновлено для работы с актуальными инструментами разработки и поддерживаемыми браузерами

0.1.0
- Добавлена настройка «Новая вкладка в фоне» для открытия вкладок с сохранением текущей вкладки активной

0.0.6
- Значительно повышена производительность всех операций с вкладками

0.0.5
- Исправлено неприменение настройки положения вкладок при открытии ссылок из внешних приложений

0.0.4
- Исправлены проблемы обработки перезапуска Service Worker, не полностью устранённые в версии 0.0.3

0.0.3
- Исправлено неожиданное поведение при перезапуске Service Worker после 30 секунд бездействия

0.0.2
- Исправлена работа настройки «Вкладка слева» при закрытии вкладок, открытых ссылками target="_blank"
- Исправлено сохранение порядка вкладок при восстановлении сеанса браузера

0.0.1
- Первый выпуск
```

### 画像アセット

Use the English screenshots in the all-languages fields. For each localized listing, upload the five files from its directory in the order below, replacing the existing screenshots. Leave all shared and localized promotional-video fields empty.

| 掲載情報の言語 | スクリーンショットのディレクトリ |
| --- | --- |
| 英語 / `en`（全言語共通欄にも使用） | [en](store-assets/screenshots/en/) |
| 日本語 / `ja` | [ja](store-assets/screenshots/ja/) |
| 中国語（簡体字） / `zh_CN` | [zh_CN](store-assets/screenshots/zh_CN/) |
| 中国語（繁体字） / `zh_TW` | [zh_TW](store-assets/screenshots/zh_TW/) |
| 韓国語 / `ko` | [ko](store-assets/screenshots/ko/) |
| スペイン語 / `es` | [es](store-assets/screenshots/es/) |
| フランス語 / `fr` | [fr](store-assets/screenshots/fr/) |
| ドイツ語 / `de` | [de](store-assets/screenshots/de/) |
| ポルトガル語（ブラジル） / `pt_BR` | [pt_BR](store-assets/screenshots/pt_BR/) |
| ロシア語 / `ru` | [ru](store-assets/screenshots/ru/) |

All 50 images are direct captures of the extension's settings page, at 1280×800 in 24-bit RGB PNG without alpha. All locales use the same example settings and capture dimensions.

| 掲載順 | ファイル名 | 画面 |
| --- | --- | --- |
| 1 | `01-new-tab.png` | New Tab |
| 2 | `02-tab-closing.png` | Tab Closing |
| 3 | `03-tab-on-activate.png` | Tab on Activate |
| 4 | `04-popup.png` | Pop-up |
| 5 | `05-external-links.png` | External Links |

| 項目 | ファイル／値 | 形式 |
| --- | --- | --- |
| ショップ アイコン | [public/icon-128.png](public/icon-128.png) | 128×128 PNG |
| 全言語向け・言語別プロモーション動画 | 空欄 | — |
| プロモーション タイル（小） | 既存アップロードを維持 | 440×280; local PNG has alpha and must not be uploaded as-is |
| マーキー プロモーション タイル | 既存アップロードを維持 | 1400×560; no corresponding local asset |

### 追加フィールド・追加の指標・アイテム サポート

| 項目 | 値 |
| --- | --- |
| 公式 URL | なし |
| ホームページ URL | https://github.com/proshunsuke/tab-position-options-fork |
| サポート URL | https://github.com/proshunsuke/tab-position-options-fork/issues |
| 成人向けコンテンツ | オフ |
| Google アナリティクス 4（GA4） | 無効 |
| アイテム サポート／公開設定 | オンを維持 (publisher-wide setting) |

## プライバシー

### 単一用途の説明

Maximum: 1,000 characters.

```text
Customize Chrome tab positioning and activation: choose where tabs open, which tab becomes active after closing a tab, where activated tabs move, and how URL rules affect new tabs and navigation. Pop-up conversion, external-link handling, and keyboard shortcuts for sorting and switching tabs serve the same tab-management purpose.
```

### 権限が必要な理由

Maximum: 1,000 characters per field. These justifications describe permissions requested only when the corresponding optional feature is used. Upload the target package before filling fields for newly added permissions. Site access is declared through the runtime content script's matches; use the dashboard's host-permission/site-access justification field when it appears.

#### storage が必要な理由

```text
Required permission. Saves tab preferences and user-entered URL rules in chrome.storage.local and synchronizes them through chrome.storage.sync when Chrome sync is enabled. Local settings remain usable if sync fails or exceeds its capacity. chrome.storage.session retains tab positions, activation order, opener relationships, restored-tab markers, and pop-up window state across service worker restarts. It also temporarily retains pending navigation URLs until commit, failure, or tab closure. Session data is cleared on browser restart. Browsing URLs, titles, and session tab state are not included in synchronized settings.
```

#### tabs が必要な理由

```text
Optional permission. Requested when a user adds a New Tab URL rule or invokes a title- or URL-sorting shortcut. Reads Tab.pendingUrl and Tab.url to match newly created tabs against user-defined position and foreground/background rules, and reads the current window's tab titles and URLs for sorting. These values are processed locally, are not transmitted externally, and are not saved as browsing history. Position-only tab operations do not require this permission.
```

#### webNavigation が必要な理由

```text
Optional permission. Requested when a user adds a Loading Page rule or enables pop-up conversion. Detects top-level navigation commits to apply Loading Page URL rules. For server redirects, the destination is checked first and the original URL is used if the destination has no match. Pending navigation URLs are temporarily retained in session storage across service worker restarts, then removed on commit, failure, or tab closure. Navigation-target and before-navigation events also provide pop-up URLs early enough to check exceptions before conversion. Tab update events alone do not provide the required navigation-commit and server-redirect information. Navigation data is processed locally and is not transmitted externally.
```

#### scripting が必要な理由

```text
Optional permission. Requested together with HTTP/HTTPS site access when a user enables External Links. Registers the extension's bundled content script for HTTP/HTTPS pages and frames, and injects it into already-open matching tabs after access is granted. This lets External Links take effect immediately without requiring users to reopen pages. The script processes link clicks locally according to the user's settings; it does not collect general page content or send browsing data externally.
```

#### ホスト権限／HTTP・HTTPS サイトへのアクセスが必要な理由

```text
Optional site access. Requested together with the `scripting` permission only when a user enables External Links. A dynamically registered bundled content script runs on HTTP/HTTPS pages and their frames so the user can control how external links open. It reads the current page URL and clicked link URL/attributes, compares origins, and applies page exclusions and link rules to choose current-tab, foreground-tab, or background-tab navigation. The feature is off by default; its disabled click handler returns without inspecting links. After permission is granted, the script is also injected into already-open HTTP/HTTPS tabs. It does not extract page text or form values, store a click history, or send browsing data externally. Following a link makes the normal request to its destination.
```

### リモートコード

| 項目 | 値 |
| --- | --- |
| リモートコードを使用していますか？ | いいえ、リモートコードを使用していません |
| 理由 | 空欄 (disabled) |

### データ使用

| ユーザーデータの種類 | 選択 |
| --- | --- |
| 個人を特定できる情報 | オフ |
| 健康に関する情報 | オフ |
| 財務状況や支払いに関する情報 | オフ |
| 認証に関する情報 | オフ |
| 個人的コミュニケーション | オフ |
| 位置情報 | オフ |
| ウェブ履歴 | オン |
| ユーザーのアクティビティ | オン |
| ウェブサイトのコンテンツ | オン |

These selections disclose local handling of tab/navigation URLs and titles, link-click events, and hyperlinks. They do not mean that browsing data is sent to the developer. The [User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq) requires disclosure even for local processing; the [privacy-field guide](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy) requires declarations consistent with the privacy policy.

| 開示事項 | 選択 |
| --- | --- |
| 私は、承認されている以外の用途で第三者にユーザーデータを販売、転送しません | オン |
| 私はアイテムの唯一の目的と関係のない目的でユーザーデータを使用または転送しません | オン |
| 私は信用力を判断する目的または融資目的でユーザーデータを使用または転送しません | オン |

### プライバシー ポリシー

| 項目 | 値 |
| --- | --- |
| プライバシー ポリシーの URL | https://github.com/proshunsuke/tab-position-options-fork/blob/main/PRIVACY.md |

## 販売地域

| 項目 | 値 |
| --- | --- |
| 決済方法 | 料金なし |
| 公開設定 | 公開 |
| 販売先の国 | すべての地域 |

## テスト手順

| 項目 | 値 |
| --- | --- |
| ユーザー名 | 空欄 |
| パスワード | 空欄 |

### 追加の手順

Maximum: 500 characters.

```text
No account or payment is required. Open options from the toolbar, set preferences, and save. Test URL rules with several tabs; patterns can target https://example.com/. Grant optional permissions when prompted. External Links is off by default: enable it, grant scripting and HTTP/HTTPS site access, then save; it also works on open HTTP/HTTPS pages. Set shortcuts at chrome://extensions/shortcuts. Chrome Sync is needed for cross-device sync; other features work without it.
```
