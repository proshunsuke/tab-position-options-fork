import { useEffect, useRef, useState } from "react";
import { i18n } from "#i18n";
import { ExternalLinks } from "@/entrypoints/options/ExternalLinks";
import { KeyboardShortcuts } from "@/entrypoints/options/KeyboardShortcuts";
import { LoadingPage } from "@/entrypoints/options/LoadingPage";
import { NewTab } from "@/entrypoints/options/NewTab";
import { Popup } from "@/entrypoints/options/Popup";
import { SettingsSyncStatus } from "@/entrypoints/options/SettingsSyncStatus";
import { TabClosing } from "@/entrypoints/options/TabClosing";
import { TabOnActivate } from "@/entrypoints/options/TabOnActivate";
import {
  externalLinkPermissionRequest,
  hasPermissions,
  requestPermissions,
  tabsPermissionRequest,
  webNavigationPermissionRequest,
} from "@/src/permissions/optional";
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

const Categories = [
  ["new", "newTab"],
  ["closing", "tabClosing"],
  ["activation", "tabOnActivate"],
  ["loading", "loadingPage"],
  ["popup", "popup"],
  ["external", "externalLinks"],
  ["shortcuts", "keyboardShortcuts"],
  ["management", "settingsManagement"],
] as const;
type Category = (typeof Categories)[number][0];
type OptionalPermissionState = {
  tabs: boolean;
  webNavigation: boolean;
  externalLinks: boolean;
};

const App = () => {
  const [activeTab, setActiveTab] = useState<Category>("new");
  const [invalidRule, setInvalidRule] = useState<{ id: string } | null>(null);
  const content = useRef<HTMLElement>(null);
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
  const [optionalPermissions, setOptionalPermissions] = useState<OptionalPermissionState>({
    tabs: false,
    webNavigation: false,
    externalLinks: false,
  });
  const [saveStatus, setSaveStatus] = useState<"saved" | "saveFailed" | null>(null);
  const [transferStatus, setTransferStatus] = useState<
    "imported" | "importFailed" | "exportFailed" | null
  >(null);
  const saveMessage = saveStatus
    ? i18n.t(saveStatus)
    : isDirty.current
      ? i18n.t("unsavedChanges")
      : "";
  const saveMessageClass =
    saveStatus === "saved"
      ? "text-green-700"
      : saveStatus === "saveFailed"
        ? "text-red-700"
        : "text-gray-600";

  useEffect(() => {
    let disposed = false;
    const refreshPermissions = () => {
      void Promise.all([
        hasPermissions(tabsPermissionRequest),
        hasPermissions(webNavigationPermissionRequest),
        hasPermissions(externalLinkPermissionRequest),
      ]).then(([tabs, webNavigation, externalLinks]) => {
        if (!disposed) {
          setOptionalPermissions({ tabs, webNavigation, externalLinks });
        }
      });
    };
    chrome.permissions.onAdded.addListener(refreshPermissions);
    chrome.permissions.onRemoved.addListener(refreshPermissions);
    refreshPermissions();
    return () => {
      disposed = true;
      chrome.permissions.onAdded.removeListener(refreshPermissions);
      chrome.permissions.onRemoved.removeListener(refreshPermissions);
    };
  }, []);

  const requestFeaturePermission = (
    permission: chrome.permissions.Permissions,
    key: keyof OptionalPermissionState,
  ) => {
    const request = requestPermissions(permission);
    void request.then(granted => {
      if (granted) {
        setOptionalPermissions(current => ({ ...current, [key]: true }));
      }
    });
    return request;
  };
  const requestTabsPermission = () => requestFeaturePermission(tabsPermissionRequest, "tabs");
  const requestWebNavigationPermission = () =>
    requestFeaturePermission(webNavigationPermissionRequest, "webNavigation");
  const requestExternalLinkPermission = () =>
    requestFeaturePermission(externalLinkPermissionRequest, "externalLinks");

  const changeCategory = (category: Category) => {
    setActiveTab(category);
    content.current?.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (invalidRule) {
      document.getElementById(invalidRule.id)?.focus();
    }
  }, [invalidRule]);

  const markDirty = () => {
    isDirty.current = true;
    setSaveStatus(null);
    setTransferStatus(null);
    setInvalidRule(null);
  };

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
    markDirty();
    setNewTabPosition(value as TabPosition);
  };

  const handleOpenInBackgroundChange = (checked: boolean) => {
    markDirty();
    setOpenInBackground(checked);
  };

  const handleAfterTabClosingChange = (value: string) => {
    markDirty();
    setAfterTabClosing(value as TabActivation);
  };

  const handleTabOnActivateChange = (value: string) => {
    markDirty();
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
    setTransferStatus(null);
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
      isDirty.current = true;
      setTransferStatus("imported");
    } catch {
      setTransferStatus("importFailed");
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = () => {
    setTransferStatus(null);
    try {
      const content = serializeSettings(getDraftSettings());
      const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = SETTINGS_FILE_NAME;
      document.body.append(link);
      try {
        link.click();
      } finally {
        link.remove();
        // ダウンロード開始後に解放する。タブ操作とは独立した画面内の後処理。
        setTimeout(() => URL.revokeObjectURL(url), 0);
      }
    } catch {
      setTransferStatus("exportFailed");
    }
  };

  const handleSave = () => {
    const groups = [
      { category: "new", prefix: "new-rule", rules: urlRules },
      { category: "loading", prefix: "loading-rule", rules: loadingRules },
      { category: "popup", prefix: "popup-rule", rules: popup.exceptions ?? [] },
      { category: "external", prefix: "external-rule", rules: externalLinks.urlRules },
    ] as const;
    for (const group of groups) {
      const index = group.rules.findIndex(rule => !isValidUrlPattern(rule.url.trim()));
      if (index !== -1) {
        changeCategory(group.category);
        setInvalidRule({ id: `${group.prefix}-${index}` });
        return;
      }
    }
    setInvalidRule(null);
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const currentSettings = getSettings();
      saveSettingsWithVersion({
        ...currentSettings,
        ...getDraftSettings(),
      });
      isDirty.current = false;
      setTransferStatus(null);

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
    <div className="flex h-dvh flex-col bg-gray-50 text-gray-900">
      <header className="shrink-0 border-b border-gray-200 bg-white px-4 py-4 md:px-8">
        <h1 className="text-xl font-bold">Tab Position Options</h1>
        <div className="mt-3 md:hidden">
          <label htmlFor="settings-category" className="mb-1 block text-sm font-medium">
            {i18n.t("settingsCategories")}
          </label>
          <select
            id="settings-category"
            value={activeTab}
            onChange={event => changeCategory(event.target.value as Category)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
          >
            {Categories.map(([key, label]) => (
              <option key={key} value={key}>
                {i18n.t(label)}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1">
        <nav
          aria-label={i18n.t("settingsCategories")}
          className="hidden w-60 shrink-0 overflow-y-auto border-r border-gray-200 p-4 md:block"
        >
          {Categories.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-current={activeTab === key ? "page" : undefined}
              onClick={() => changeCategory(key)}
              className={`mb-1 w-full rounded-md px-4 py-3 text-left text-sm font-medium ${key === "shortcuts" ? "mt-6" : ""} ${activeTab === key ? "bg-blue-100 text-blue-900" : "text-gray-700 hover:bg-gray-100"}`}
            >
              {i18n.t(label)}
            </button>
          ))}
        </nav>

        <main ref={content} className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 md:p-8">
          <fieldset
            disabled={!isReady || isImporting}
            className="min-w-0 rounded-lg border border-gray-200 bg-white p-4 md:p-6"
          >
            {activeTab === "new" && (
              <NewTab
                urlRules={urlRules}
                onUrlRulesChange={value => {
                  markDirty();
                  setUrlRules(value);
                }}
                newTabPosition={newTabPosition}
                onNewTabPositionChange={handleNewTabPositionChange}
                openInBackground={openInBackground}
                onOpenInBackgroundChange={handleOpenInBackgroundChange}
                tabsPermissionGranted={optionalPermissions.tabs}
                onRequestTabsPermission={requestTabsPermission}
                invalidRuleId={invalidRule?.id ?? null}
              />
            )}
            {activeTab === "loading" && (
              <LoadingPage
                rules={loadingRules}
                webNavigationPermissionGranted={optionalPermissions.webNavigation}
                onRequestWebNavigationPermission={requestWebNavigationPermission}
                invalidRuleId={invalidRule?.id ?? null}
                onRulesChange={value => {
                  markDirty();
                  setLoadingRules(value);
                }}
              />
            )}
            {activeTab === "popup" && (
              <Popup
                settings={popup}
                webNavigationPermissionGranted={optionalPermissions.webNavigation}
                onRequestWebNavigationPermission={requestWebNavigationPermission}
                invalidRuleId={invalidRule?.id ?? null}
                onChange={value => {
                  markDirty();
                  setPopup(value);
                }}
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
                permissionGranted={optionalPermissions.externalLinks}
                onRequestPermission={requestExternalLinkPermission}
                invalidRuleId={invalidRule?.id ?? null}
                onChange={value => {
                  markDirty();
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
            {activeTab === "shortcuts" && <KeyboardShortcuts />}
            {activeTab === "management" && (
              <section className="space-y-6">
                <h2 className="text-xl font-semibold">{i18n.t("settingsManagement")}</h2>
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
                  {transferStatus && (
                    <p
                      role="status"
                      className={`text-sm ${transferStatus === "imported" ? "text-green-700" : "text-red-700"}`}
                    >
                      {i18n.t(transferStatus)}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">{i18n.t("settingsTransferHelp")}</p>
                </div>
                <p className="text-sm text-gray-600">{i18n.t("settingsSyncHelp")}</p>
              </section>
            )}
          </fieldset>
        </main>
      </div>

      <footer className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 md:px-8">
        <div className="mx-auto max-w-7xl space-y-3">
          <SettingsSyncStatus />
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <p
              role="status"
              className={`w-full text-right text-sm sm:w-auto sm:max-w-xl ${saveMessageClass}`}
            >
              {saveMessage}
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isReady || isImporting || isSaving}
              className="shrink-0 rounded-md bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? i18n.t("saving") : i18n.t("saveSettings")}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
