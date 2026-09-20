import { useEffect, useRef, useState } from "react";
import { i18n } from "#i18n";
import { ExternalLinks } from "@/entrypoints/options/ExternalLinks";
import { KeyboardShortcuts } from "@/entrypoints/options/KeyboardShortcuts";
import { TabBehavior } from "@/entrypoints/options/TabBehavior";
import { TabClosing } from "@/entrypoints/options/TabClosing";
import { TabOnActivate } from "@/entrypoints/options/TabOnActivate";
import {
  getSettings,
  initializeAppData,
  saveSettingsWithVersion,
} from "@/src/settings/state/appData";
import { parseSettingsFile, SETTINGS_FILE_NAME, serializeSettings } from "@/src/settings/transfer";
import { isValidUrlPattern } from "@/src/tabs/urlRules";
import type {
  LoadingPageUrlRule,
  NewTabUrlRule,
  Settings,
  TabActivation,
  TabOnActivateBehavior,
  TabPosition,
} from "@/src/types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"behavior" | "closing" | "activation" | "external">(
    "behavior",
  );
  const [externalLinks, setExternalLinks] = useState<Settings["externalLinks"]>({
    enabled: false,
    urlRules: [],
  });
  const [newTabPosition, setNewTabPosition] = useState<TabPosition>("default");
  const [openInBackground, setOpenInBackground] = useState(false);
  const [afterTabClosing, setAfterTabClosing] = useState<TabActivation>("default");
  const [tabOnActivate, setTabOnActivate] = useState<TabOnActivateBehavior>("default");
  const [urlRules, setUrlRules] = useState<NewTabUrlRule[]>([]);
  const [loadingRules, setLoadingRules] = useState<LoadingPageUrlRule[]>([]);
  const [popup, setPopup] = useState<Settings["popup"]>({ openAsNewTab: false, exceptions: [] });
  const fileInput = useRef<HTMLInputElement>(null);
  const isDirty = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "invalidPattern" | "saveFailed" | "imported" | "importFailed" | "exportFailed" | null
  >(null);
  const saveMessage = saveStatus ? i18n.t(saveStatus) : "";

  // 起動時に保存済みの設定を読み込む
  useEffect(() => {
    let disposed = false;
    let changed = false;
    const applySettings = (settings: Settings) => {
      setExternalLinks(settings.externalLinks ?? { enabled: false, urlRules: [] });
      if (settings.newTab?.position) {
        setNewTabPosition(settings.newTab.position);
      }
      if (settings.newTab?.openInBackground !== undefined) {
        setOpenInBackground(settings.newTab.openInBackground);
      }
      setUrlRules(settings.newTab?.urlRules ?? []);
      setLoadingRules(settings.loadingPage?.urlRules ?? []);
      setPopup({
        openAsNewTab: settings.popup?.openAsNewTab ?? false,
        exceptions: settings.popup?.exceptions ?? [],
      });
      if (settings.afterTabClosing?.activateTab) {
        setAfterTabClosing(settings.afterTabClosing.activateTab);
      }
      if (settings.tabOnActivate?.behavior) {
        setTabOnActivate(settings.tabOnActivate.behavior);
      }
      setIsReady(true);
    };
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== "local" || !changes.settings?.newValue) {
        return;
      }
      changed = true;
      // 同期済み設定は未編集の画面だけに反映し、編集中の入力は保存まで維持する。
      if (!isDirty.current) {
        applySettings(changes.settings.newValue as Settings);
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    void (async () => {
      await initializeAppData();
      if (!disposed && !changed) {
        applySettings(getSettings());
      }
    })();
    return () => {
      disposed = true;
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const handleNewTabPositionChange = (value: string) => {
    isDirty.current = true;
    setNewTabPosition(value as TabPosition);
  };

  const handleOpenInBackgroundChange = (checked: boolean) => {
    isDirty.current = true;
    setOpenInBackground(checked);
  };

  const handleAfterTabClosingChange = (value: string) => {
    isDirty.current = true;
    setAfterTabClosing(value as TabActivation);
  };

  const handleTabOnActivateChange = (value: string) => {
    isDirty.current = true;
    setTabOnActivate(value as TabOnActivateBehavior);
  };

  const getDraftSettings = () =>
    ({
      externalLinks: {
        ...externalLinks,
        urlRules: externalLinks.urlRules.map(rule => ({ ...rule, url: rule.url.trim() })),
      },
      newTab: {
        position: newTabPosition,
        openInBackground,
        urlRules: urlRules.map(rule => ({ ...rule, url: rule.url.trim() })),
      },
      loadingPage: { urlRules: loadingRules.map(rule => ({ ...rule, url: rule.url.trim() })) },
      afterTabClosing: {
        activateTab: afterTabClosing,
      },
      tabOnActivate: { behavior: tabOnActivate },
      popup: {
        openAsNewTab: popup.openAsNewTab,
        exceptions: popup.exceptions?.map(rule => ({ url: rule.url.trim() })) ?? [],
      },
    }) satisfies Settings;

  const handleImport = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    setIsImporting(true);
    isDirty.current = true;
    setSaveStatus(null);
    try {
      // ファイル全体の読み込みと検証が終わるまで、画面にもストレージにも反映しない。
      const settings = parseSettingsFile(await file.text());
      setNewTabPosition(settings.newTab.position);
      setOpenInBackground(settings.newTab.openInBackground);
      setUrlRules(settings.newTab.urlRules);
      setLoadingRules(settings.loadingPage.urlRules);
      setAfterTabClosing(settings.afterTabClosing.activateTab);
      setTabOnActivate(settings.tabOnActivate.behavior);
      setPopup(settings.popup);
      setExternalLinks(settings.externalLinks);
      setSaveStatus("imported");
    } catch {
      setSaveStatus("importFailed");
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = () => {
    try {
      const content = serializeSettings(getDraftSettings());
      const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = SETTINGS_FILE_NAME;
      document.body.append(link);
      try {
        link.click();
        setSaveStatus(null);
      } finally {
        link.remove();
        // ダウンロード開始後に解放する。タブ操作とは独立した画面内の後処理。
        setTimeout(() => URL.revokeObjectURL(url), 0);
      }
    } catch {
      setSaveStatus("exportFailed");
    }
  };

  const handleSave = () => {
    if (
      [...urlRules, ...externalLinks.urlRules, ...loadingRules, ...(popup.exceptions ?? [])].some(
        rule => !isValidUrlPattern(rule.url.trim()),
      )
    ) {
      setSaveStatus("invalidPattern");
      return;
    }
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const currentSettings = getSettings();
      saveSettingsWithVersion({
        ...currentSettings,
        ...getDraftSettings(),
      });
      isDirty.current = false;

      setSaveStatus("saved");

      // 3秒後にメッセージを消す
      setTimeout(() => setSaveStatus(status => (status === "saved" ? null : status)), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveStatus("saveFailed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Tab Position Options</h1>

        {/* タブナビゲーション */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("behavior")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "behavior"
                ? "border-chrome-blue text-chrome-blue"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            {i18n.t("tabBehavior")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("closing")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "closing"
                ? "border-chrome-blue text-chrome-blue"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            {i18n.t("tabClosing")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("activation")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "activation"
                ? "border-chrome-blue text-chrome-blue"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            {i18n.t("tabOnActivate")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("external")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === "external" ? "border-chrome-blue text-chrome-blue" : "border-transparent text-gray-600 hover:text-gray-800"}`}
          >
            {i18n.t("externalLinks")}
          </button>
        </div>

        {/* タブコンテンツと保存ボタンのコンテナ */}
        <fieldset disabled={!isReady || isImporting} className="flex min-w-0 flex-col gap-6">
          {/* タブコンテンツ */}
          <div className="bg-white rounded-lg shadow-lg p-10 min-h-[500px]">
            {activeTab === "behavior" && (
              <TabBehavior
                popup={popup}
                onPopupChange={value => {
                  isDirty.current = true;
                  setPopup(value);
                }}
                loadingRules={loadingRules}
                onLoadingRulesChange={value => {
                  isDirty.current = true;
                  setLoadingRules(value);
                }}
                urlRules={urlRules}
                onUrlRulesChange={value => {
                  isDirty.current = true;
                  setUrlRules(value);
                }}
                newTabPosition={newTabPosition}
                onNewTabPositionChange={handleNewTabPositionChange}
                openInBackground={openInBackground}
                onOpenInBackgroundChange={handleOpenInBackgroundChange}
              />
            )}

            {activeTab === "activation" && (
              <TabOnActivate
                behavior={tabOnActivate}
                onBehaviorChange={handleTabOnActivateChange}
              />
            )}

            {activeTab === "external" && (
              <ExternalLinks
                settings={externalLinks}
                onChange={value => {
                  isDirty.current = true;
                  setExternalLinks(value);
                }}
              />
            )}

            {activeTab === "closing" && (
              <TabClosing
                afterTabClosing={afterTabClosing}
                onAfterTabClosingChange={handleAfterTabClosingChange}
              />
            )}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExport}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-100 disabled:opacity-50"
              >
                {i18n.t("exportSettings")}
              </button>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-100 disabled:opacity-50"
              >
                {isImporting ? i18n.t("importing") : i18n.t("importSettings")}
              </button>
              <input
                ref={fileInput}
                type="file"
                accept=".json,application/json"
                hidden
                aria-label={i18n.t("importSettings")}
                onChange={event => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  void handleImport(file);
                }}
              />
            </div>
            <p className="text-sm text-gray-600">{i18n.t("settingsTransferHelp")}</p>
            <p className="text-sm text-gray-600">{i18n.t("settingsSyncHelp")}</p>
          </div>

          {/* 保存ボタン（タブコンテンツの外に固定） */}
          <div className="flex flex-wrap items-center justify-end gap-4">
            <p
              role="status"
              className={`text-sm ${
                !saveMessage
                  ? "invisible"
                  : (saveStatus === "saved" || saveStatus === "imported")
                    ? "text-green-600"
                    : "text-red-600"
              }`}
            >
              {saveMessage || "\u00a0"}
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-chrome-blue text-white px-8 py-3 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
            >
              {isSaving ? i18n.t("saving") : i18n.t("saveSettings")}
            </button>
          </div>
        </fieldset>
        <KeyboardShortcuts />
      </div>
    </div>
  );
}
