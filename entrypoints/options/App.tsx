import { useEffect, useState } from "react";
import { TabBehavior } from "@/entrypoints/options/TabBehavior";
import { TabClosing } from "@/entrypoints/options/TabClosing";
import { TabOnActivate } from "@/entrypoints/options/TabOnActivate";
import {
  getSettings,
  initializeAppData,
  saveSettingsWithVersion,
} from "@/src/settings/state/appData";
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
  const [activeTab, setActiveTab] = useState<"behavior" | "closing" | "activation">("behavior");
  const [newTabPosition, setNewTabPosition] = useState<TabPosition>("default");
  const [openInBackground, setOpenInBackground] = useState(false);
  const [afterTabClosing, setAfterTabClosing] = useState<TabActivation>("default");
  const [tabOnActivate, setTabOnActivate] = useState<TabOnActivateBehavior>("default");
  const [urlRules, setUrlRules] = useState<NewTabUrlRule[]>([]);
  const [loadingRules, setLoadingRules] = useState<LoadingPageUrlRule[]>([]);
  const [popup, setPopup] = useState<Settings["popup"]>({ openAsNewTab: false, exceptions: [] });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // 起動時に保存済みの設定を読み込む
  useEffect(() => {
    void (async () => {
      await initializeAppData();
      const settings = getSettings();
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
    })();
  }, []);

  const handleNewTabPositionChange = (value: string) => {
    setNewTabPosition(value as TabPosition);
  };

  const handleOpenInBackgroundChange = (checked: boolean) => {
    setOpenInBackground(checked);
  };

  const handleAfterTabClosingChange = (value: string) => {
    setAfterTabClosing(value as TabActivation);
  };

  const handleTabOnActivateChange = (value: string) => {
    setTabOnActivate(value as TabOnActivateBehavior);
  };

  const handleSave = () => {
    if (
      [...urlRules, ...loadingRules, ...(popup.exceptions ?? [])].some(
        rule => !isValidUrlPattern(rule.url.trim()),
      )
    ) {
      setSaveMessage("Enter a valid URL pattern for each rule.");
      return;
    }
    setIsSaving(true);
    setSaveMessage("");

    try {
      const currentSettings = getSettings();
      saveSettingsWithVersion({
        ...currentSettings,
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
      });

      setSaveMessage("Settings saved successfully!");

      // 3秒後にメッセージを消す
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveMessage("Failed to save settings. Please try again.");
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
            Tab Behavior
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
            Tab Closing
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
            Tab on Activate
          </button>
        </div>

        {/* タブコンテンツと保存ボタンのコンテナ */}
        <div className="flex flex-col gap-6">
          {/* タブコンテンツ */}
          <div className="bg-white rounded-lg shadow-lg p-10 min-h-[500px]">
            {activeTab === "behavior" && (
              <TabBehavior
                popup={popup}
                onPopupChange={setPopup}
                loadingRules={loadingRules}
                onLoadingRulesChange={setLoadingRules}
                urlRules={urlRules}
                onUrlRulesChange={setUrlRules}
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

            {activeTab === "closing" && (
              <TabClosing
                afterTabClosing={afterTabClosing}
                onAfterTabClosingChange={handleAfterTabClosingChange}
              />
            )}
          </div>

          {/* 保存ボタン（タブコンテンツの外に固定） */}
          <div className="flex items-center justify-end gap-4">
            <p
              role="status"
              className={`text-sm ${
                !saveMessage
                  ? "invisible"
                  : saveMessage.includes("success")
                    ? "text-green-600"
                    : "text-red-600"
              }`}
            >
              {saveMessage || "Placeholder"}
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-chrome-blue text-white px-8 py-3 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
