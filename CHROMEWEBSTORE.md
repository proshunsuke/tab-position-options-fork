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

Keep all supported features listed below, aligned across all 10 locales. Avoid repeated use of the tab-related keyword and keep it to no more than five occurrences per description, counting the product name and URLs. Do not include a changelog or keyword lists. English is the source text and default locale; keep translations consistent when changing their meaning.

##### English — `en`

```text
Tab Position Options Fork reimplements the original Chrome extension with Manifest V3. Control where new browser views open and which becomes active after one closes. Set placement, foreground or background behavior, and URL rules for new openings and navigation.

FEATURES
• New openings: first, last, immediately right or left of the current one, or the browser default.
• Background setting: open new tabs in the background.
• After closing one: activate the first or last, a neighbor on either side, the most recently active, the source of an opened link, that source or the most recently active, or the browser default.
• On activation: keep the current position or move the selection to the beginning or end.
• URL rules for new openings: choose first, last, right, left, browser default, and foreground or background behavior.
• URL rules during loading: place a matching destination first, in the middle, or last.
• Convert pop-up windows to open in the regular browser window, with URL exceptions.
• External links: open in new tabs by default. URL rules can exclude a source URL or route links by source or destination URL to open in the foreground, background, or current view/frame.
• Keyboard shortcuts: sort by title or URL, or return to the last active item.
• Import and export settings files.
• Automatically sync settings and URL rules when Chrome Sync is enabled.

HOW TO USE
1. Settings open automatically after installation. Reopen them from Chrome’s Extensions menu or the toolbar.
2. Choose your preferences and add URL rules if needed.
3. Save your settings. Chrome requests optional permissions when you first use a feature that needs them.

SUPPORT
Report bugs or request features:
https://github.com/proshunsuke/tab-position-options-fork/issues

This is an independent community fork of the original extension.
Original extension:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl
```

##### 日本語 — `ja`

```text
Tab Position Options Fork は、原版をChrome向けManifest V3で再実装した拡張機能です。新しいタブの配置や、閉じた後にアクティブにする対象を設定できます。前面／背景での開き方とURL別ルールにも対応します。

機能
・新規タブの位置：常に先頭／常に末尾／現在のものの右側／左側／ブラウザの既定
・新しいものをバックグラウンドで開く設定
・閉じた後に選択する対象：最初／最後／右隣／左隣／直近にアクティブだったもの／リンクを開いた元／元がなければ直近にアクティブだったもの／ブラウザの既定
・アクティブにしたとき：位置を維持／先頭／末尾
・新規タブのURL別ルール：位置（先頭／末尾／現在のものの右側／左側／ブラウザの既定）と前面／背景での開き方
・読み込み時のURL別ルール：条件に一致するものを先頭／中央／末尾に配置
・ポップアップウィンドウを通常ウィンドウ内で開く形に変換し、URL別の例外を設定
・外部リンク：既定で新しいタブに開く。URL別にリンク元を除外し、リンク元／リンク先URLに応じて前面／背景で開くか、現在の表示領域／フレームを使うかを指定
・キーボードショートカットでタイトル／URL順に並べ替え、直前にアクティブだったものに切り替え
・設定ファイルのインポート／エクスポート
・Chrome 同期が有効な場合、設定とURLルールを自動同期

使い方
1. インストール後に設定画面が自動的に開きます。再度開く場合は、Chromeの拡張機能メニューまたはツールバーを使います。
2. 動作を設定し、必要に応じてURLルールを追加します。
3. 設定を保存します。権限が必要な機能を初めて使うときに、Chromeが必要な権限を要求します。

サポート
不具合報告・機能の要望:
https://github.com/proshunsuke/tab-position-options-fork/issues

原版から派生した独立したコミュニティフォークです。
原版の拡張機能:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl
```

##### 简体中文 — `zh_CN`

```text
Tab Position Options Fork 是面向 Chrome、基于 Manifest V3 重新实现原版功能的扩展程序。您可以控制新内容的排列位置，以及关闭一项后要激活的对象，并按网址设置打开方式和导航规则。

功能
・新建位置：始终置于开头／末尾／当前项右侧／左侧，或遵循浏览器默认设置
・设置在后台打开新建项
・关闭后激活：第一个／最后一个／右侧／左侧／最近激活的项、打开链接的来源项、来源项（如不存在则选最近激活的项），或遵循浏览器默认设置
・激活时：保持当前位置，或移至开头／末尾
・新建内容的网址规则：指定位置（开头／末尾／当前项右侧／左侧／浏览器默认）及前台／后台打开方式
・加载时的网址规则：将匹配项移至开头／中间／末尾
・将弹出窗口并入常规浏览器窗口，并设置网址例外
・外部链接：默认在新标签页中打开。网址规则可排除来源网址，或按来源／目标网址指定在前台／后台打开，或使用当前视图／框架
・使用键盘快捷键按标题／网址排序，或返回最近激活的项
・导入和导出设置文件
・启用 Chrome 同步后自动同步设置和网址规则

使用方法
1. 安装后设置页面会自动打开。之后可通过 Chrome 的扩展程序菜单或工具栏再次打开。
2. 选择所需设置，并根据需要添加网址规则。
3. 保存设置。首次使用需要权限的功能时，Chrome 会请求相应的可选权限。

支持
报告问题或提出功能建议:
https://github.com/proshunsuke/tab-position-options-fork/issues

这是原版扩展的独立社区分支。
原版扩展程序:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl
```

##### 繁體中文 — `zh_TW`

```text
Tab Position Options Fork 是面向 Chrome、以 Manifest V3 重新實作原版功能的擴充功能。您可以控制新項目的排列位置，以及關閉一項後要啟用的對象，並依網址設定開啟方式和導覽規則。

功能
・新建位置：一律置於最前／最後／目前項目的右側／左側，或依瀏覽器預設設定
・設定在背景開啟新項目
・關閉後啟用：第一個／最後一個／右側／左側／最近啟用的項目、開啟連結的來源項目、來源項目（若不存在則選最近啟用的項目），或依瀏覽器預設設定
・啟用時：保留目前位置，或移至最前／最後
・新建內容的網址規則：指定位置（最前／最後／目前項目的右側／左側／瀏覽器預設）及前景／背景開啟方式
・載入時的網址規則：將符合條件的項目移至最前／中間／最後
・將彈出視窗併入一般瀏覽器視窗，並設定網址例外
・外部連結：預設在新分頁開啟。網址規則可排除來源網址，或依來源／目標網址指定在前景／背景開啟，或使用目前檢視區／框架
・使用鍵盤快速鍵依標題／網址排序，或返回最近作用中的項目
・匯入及匯出設定檔
・啟用 Chrome 同步時自動同步設定和網址規則

使用方式
1. 安裝後會自動開啟設定頁面。之後可透過 Chrome 的擴充功能選單或工具列再次開啟。
2. 選擇所需設定，並視需要新增網址規則。
3. 儲存設定。首次使用需要權限的功能時，Chrome 會要求相應的選用權限。

支援
回報問題或提出功能建議:
https://github.com/proshunsuke/tab-position-options-fork/issues

這是原版擴充功能的獨立社群分支。
原版擴充功能:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl
```

##### 한국어 — `ko`

```text
Tab Position Options Fork는 원본 Chrome 확장 프로그램을 Manifest V3로 재구현했습니다. 새 브라우저 항목의 배치와 하나를 닫은 뒤 활성화할 대상을 설정할 수 있으며, 전경·백그라운드 열기와 URL별 탐색 규칙도 지정할 수 있습니다.

기능
・새 항목 위치: 항상 맨 앞／맨 뒤／현재 항목 오른쪽／왼쪽／브라우저 기본값
・새 탭을 백그라운드에서 여는 설정
・닫은 뒤 활성화할 대상: 첫 번째／마지막／오른쪽／왼쪽／가장 최근에 활성화한 항목／링크를 연 원본／원본이 없으면 가장 최근 활성 항목／브라우저 기본값
・활성화할 때: 현재 위치 유지／맨 앞／맨 뒤
・새 항목의 URL별 규칙: 위치(맨 앞／맨 뒤／현재 항목 오른쪽／왼쪽／브라우저 기본값)와 전경／백그라운드 열기 지정
・로드 시 URL별 규칙: 일치하는 항목을 맨 앞／가운데／맨 뒤로 배치
・팝업 창을 일반 브라우저 창에 포함하고 URL 예외 설정
・외부 링크: 기본적으로 새 탭에서 열기. URL별로 출발 주소를 제외하거나 출발／대상 주소에 따라 전경／백그라운드에서 열고 현재 보기／프레임을 사용하도록 지정
・키보드 단축키로 제목／URL순 정렬 또는 가장 최근에 활성화한 항목으로 전환
・설정 파일 내보내기／가져오기
・Chrome 동기화가 켜져 있으면 설정과 URL 규칙 자동 동기화

사용 방법
1. 설치 후 설정 화면이 자동으로 열립니다. Chrome 확장 프로그램 메뉴나 도구 모음에서 다시 열 수 있습니다.
2. 원하는 동작을 설정하고 필요하면 URL 규칙을 추가하세요.
3. 설정을 저장하세요. 권한이 필요한 기능을 처음 사용할 때 Chrome에서 해당 선택 권한을 요청합니다.

지원
버그 신고 및 기능 요청:
https://github.com/proshunsuke/tab-position-options-fork/issues

원본 확장 프로그램에서 파생된 독립적인 커뮤니티 포크입니다.
원본 확장 프로그램:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl
```

##### Español — `es`

```text
Tab Position Options Fork es una reimplementación para Chrome con Manifest V3 de la extensión original. Controla dónde se abren las nuevas pestañas y cuál queda activa al cerrar una. Configura la ubicación, la apertura en primer o segundo plano y reglas por URL para nuevas aperturas y navegación.

FUNCIONES
・Ubicación al abrir: principio, final, derecha o izquierda de la actual, o valor predeterminado del navegador
・Abrir las nuevas en segundo plano
・Al cerrar una: activar la primera, la última, la vecina derecha o izquierda, la última usada, el origen de un enlace, ese origen (o la última usada si no existe) o el valor predeterminado
・Al activar: conservar la posición o mover la selección al principio o al final
・Reglas por URL para nuevas aperturas: posición (principio, final, derecha, izquierda o valor predeterminado) y primer o segundo plano
・Reglas durante la carga: colocar las coincidencias al principio, en el centro o al final
・Integrar las ventanas emergentes en la ventana normal del navegador, con excepciones por URL
・Enlaces externos: abrir en una pestaña nueva de forma predeterminada. Las reglas pueden excluir la URL de origen o dirigirlos según la URL de origen o destino al primer plano, segundo plano o vista/marco actual
・Atajos para ordenar por título o URL y volver a la última activa
・Exportar e importar archivos de configuración
・Sincronizar ajustes y reglas por URL cuando esté activada la sincronización de Chrome

CÓMO USARLA
1. Los ajustes se abren automáticamente tras la instalación. Para volver a abrirlos, usa el menú de extensiones de Chrome o la barra de herramientas.
2. Elige tus preferencias y añade reglas por URL si lo necesitas.
3. Guarda los ajustes. Chrome solicitará los permisos opcionales necesarios la primera vez que uses una función que los requiera.

ASISTENCIA
Informa de errores o solicita funciones:
https://github.com/proshunsuke/tab-position-options-fork/issues

Este es un fork comunitario independiente de la extensión original.
Extensión original:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl
```

##### Français — `fr`

```text
Tab Position Options Fork réimplémente l’extension d’origine pour Chrome avec Manifest V3. Choisissez où s’ouvrent les nouveaux éléments et lequel devient actif après la fermeture d’un autre. Réglez leur emplacement, l’ouverture au premier plan ou en arrière-plan et les règles URL pour l’ouverture et la navigation.

FONCTIONNALITÉS
・À l’ouverture : début, fin, à droite ou à gauche de l’élément actuel, ou valeur par défaut du navigateur
・Ouvrir les nouveaux éléments en arrière-plan
・Après une fermeture, activer le premier, le dernier, le voisin de droite ou de gauche, le dernier utilisé, la source d’un lien ouvert, cette source (ou le dernier utilisé si elle n’existe pas), ou le choix du navigateur
・À l’activation : conserver la position ou déplacer la sélection au début ou à la fin
・Règles URL pour les nouvelles ouvertures : emplacement (début, fin, droite, gauche ou valeur par défaut) et premier ou arrière-plan
・Règles au chargement : placer les destinations correspondantes au début, au milieu ou à la fin
・Intégrer les fenêtres pop-up à la fenêtre normale du navigateur, avec des exceptions par URL
・Liens externes : ouvrir dans un nouvel onglet par défaut. Les règles URL peuvent exclure l’adresse source ou choisir, selon l’adresse source ou la destination, le premier plan, l’arrière-plan ou la vue/le cadre actuel
・Raccourcis clavier pour trier par titre ou URL et revenir au dernier élément actif
・Importer et exporter les fichiers de paramètres
・Synchroniser automatiquement les paramètres et règles URL lorsque la synchronisation Chrome est activée

UTILISATION
1. Les paramètres s’ouvrent automatiquement après l’installation. Rouvrez-les depuis le menu Extensions de Chrome ou la barre d’outils.
2. Choisissez vos préférences et ajoutez des règles par URL si nécessaire.
3. Enregistrez vos paramètres. Chrome demande les autorisations facultatives nécessaires lors de la première utilisation d’une fonctionnalité concernée.

ASSISTANCE
Signaler un bug ou demander une fonctionnalité :
https://github.com/proshunsuke/tab-position-options-fork/issues

Il s’agit d’un fork communautaire indépendant de l’extension d’origine.
Extension d’origine :
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl
```

##### Deutsch — `de`

```text
Tab Position Options Fork ist eine Neuimplementierung der ursprünglichen Chrome-Erweiterung mit Manifest V3. Legen Sie fest, wo neue Browser-Inhalte erscheinen und welches Element nach dem Schließen aktiv wird. Bestimmen Sie Position, Vorder- oder Hintergrundverhalten sowie URL-Regeln für Öffnungen und Navigation.

FUNKTIONEN
・Beim Öffnen: Anfang, Ende, rechts oder links vom aktuellen Element oder Browsereinstellung
・Neue Inhalte im Hintergrund öffnen
・Nach dem Schließen aktivieren: das erste, letzte, rechte oder linke Element, das zuletzt aktive, den Ursprung eines geöffneten Links, diesen Ursprung (sonst das zuletzt aktive) oder die Browsereinstellung
・Beim Aktivieren: Position beibehalten oder die Auswahl an den Anfang oder das Ende verschieben
・URL-Regeln für neue Öffnungen: Position (Anfang, Ende, rechts, links oder Browsereinstellung) und Vorder- oder Hintergrund festlegen
・Regeln beim Laden: passende Ziele an den Anfang, in die Mitte oder ans Ende verschieben
・Pop-up-Fenster mit URL-Ausnahmen in das normale Browserfenster integrieren
・Externe Links: standardmäßig in einem neuen Tab öffnen. URL-Regeln können eine Quelladresse ausschließen oder anhand von Quell- bzw. Zieladresse Vordergrund, Hintergrund oder die aktuelle Ansicht/den aktuellen Frame festlegen
・Tastenkürzel zum Sortieren nach Titel oder URL und zum Wechsel zum zuletzt aktiven Element
・Einstellungsdateien importieren und exportieren
・Einstellungen und URL-Regeln bei aktivierter Chrome-Synchronisierung automatisch abgleichen

VERWENDUNG
1. Nach der Installation öffnen sich die Einstellungen automatisch. Über das Erweiterungsmenü von Chrome oder die Symbolleiste können Sie sie erneut öffnen.
2. Wählen Sie Ihre Einstellungen und fügen Sie bei Bedarf URL-Regeln hinzu.
3. Speichern Sie Ihre Einstellungen. Chrome fragt bei der ersten Nutzung einer Funktion nach den erforderlichen optionalen Berechtigungen.

SUPPORT
Fehler melden oder Funktionen vorschlagen:
https://github.com/proshunsuke/tab-position-options-fork/issues

Dies ist ein unabhängiger Community-Fork der ursprünglichen Erweiterung.
Ursprüngliche Erweiterung:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl
```

##### Português (Brasil) — `pt_BR`

```text
Tab Position Options Fork é uma reimplementação da extensão original para Chrome com Manifest V3. Controle onde os novos itens do navegador aparecem e qual fica ativo depois que outro é fechado. Defina posição, abertura em primeiro ou segundo plano e regras por URL para novas aberturas e navegação.

RECURSOS
・Ao abrir: início, fim, à direita ou à esquerda do item atual, ou padrão do navegador
・Abrir novos itens em segundo plano
・Ao fechar um: ativar o primeiro, o último, o vizinho à direita ou à esquerda, o último usado, a origem de um link aberto, essa origem (ou o último usado se não existir) ou o padrão do navegador
・Ao ativar: manter a posição ou mover a seleção para o início ou o fim
・Regras por URL para novas aberturas: posição (início, fim, direita, esquerda ou padrão do navegador) e primeiro ou segundo plano
・Regras durante o carregamento: colocar os destinos correspondentes no início, no meio ou no fim
・Integrar janelas pop-up à janela normal do navegador, com exceções por URL
・Links externos: abrir em uma nova aba por padrão. As regras podem excluir a URL de origem ou escolher, conforme a origem ou o destino, primeiro plano, segundo plano ou a visualização/estrutura atual
・Atalhos para ordenar por título ou URL e voltar ao último item ativo
・Importar e exportar arquivos de configurações
・Sincronizar configurações e regras por URL quando a sincronização do Chrome estiver ativada

COMO USAR
1. As configurações são abertas automaticamente após a instalação. Para abri-las novamente, use o menu de extensões do Chrome ou a barra de ferramentas.
2. Escolha suas preferências e adicione regras por URL, se necessário.
3. Salve as configurações. O Chrome solicitará as permissões opcionais necessárias na primeira vez que você usar um recurso que precise delas.

SUPORTE
Relate erros ou solicite recursos:
https://github.com/proshunsuke/tab-position-options-fork/issues

Este é um fork comunitário independente da extensão original.
Extensão original:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl
```

##### Русский — `ru`

```text
Tab Position Options Fork — это реализация оригинального расширения для Chrome на Manifest V3. Настройте расположение новых элементов браузера и выберите, какой станет активным после закрытия другого. Задайте положение, открытие на переднем плане или в фоне и правила URL для новых элементов и навигации.

ВОЗМОЖНОСТИ
・При открытии: в начале, в конце, справа или слева от текущего элемента либо по умолчанию браузера
・Открытие новых элементов в фоновом режиме
・После закрытия активировать первый, последний, соседний справа или слева, последний использованный, исходный для открытой ссылки, исходный (или последний использованный, если его нет) либо вариант браузера по умолчанию
・При активации: сохранить положение или переместить выбор в начало либо конец
・Правила URL для новых элементов: положение (начало, конец, справа, слева или по умолчанию браузера) и открытие на переднем плане или в фоне
・Правила при загрузке: перемещать подходящие элементы в начало, середину или конец
・Объединение всплывающих окон с обычным окном браузера с исключениями по URL
・Внешние ссылки: по умолчанию открывать в новой вкладке. Правила URL позволяют исключить исходный адрес или выбрать открытие на переднем плане, в фоне либо в текущем окне/фрейме в зависимости от адреса источника или назначения
・Сочетания клавиш для сортировки по заголовку или URL и возврата к последнему активному элементу
・Импорт и экспорт файлов настроек
・Автоматическая синхронизация настроек и правил URL при включённой синхронизации Chrome

КАК ПОЛЬЗОВАТЬСЯ
1. После установки настройки откроются автоматически. Чтобы открыть их снова, используйте меню расширений Chrome или панель инструментов.
2. Выберите нужные параметры и при необходимости добавьте правила URL.
3. Сохраните настройки. Chrome запросит необходимые дополнительные разрешения при первом использовании соответствующей функции.

ПОДДЕРЖКА
Сообщить об ошибке или предложить функцию:
https://github.com/proshunsuke/tab-position-options-fork/issues

Это независимый форк оригинального расширения, поддерживаемый сообществом.
Оригинальное расширение:
https://chrome.google.com/webstore/detail/tab-position-options/fjccjnfkdkdmjohojoggodkigkjkkjhl
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
