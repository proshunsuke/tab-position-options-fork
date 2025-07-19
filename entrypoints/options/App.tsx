import { useEffect, useState } from "react";
import type { TabActivation, TabPosition } from "@/src/types";
import { APP_VERSION } from "@/src/version";
import { TabBehavior } from "./TabBehavior";
import { TabClosing } from "./TabClosing";

export default function App() {
  const [activeTab, setActiveTab] = useState<"behavior" | "closing">("behavior");
  const [newTabPosition, setNewTabPosition] = useState<TabPosition>("default");
  const [afterTabClosing, setAfterTabClosing] = useState<TabActivation>("default");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // 起動時に保存済みの設定を読み込む
  useEffect(() => {
    chrome.storage.local.get(["version", "settings"], result => {
      if (result.settings) {
        if (result.settings.newTab?.position) {
          setNewTabPosition(result.settings.newTab.position);
        }
        if (result.settings.afterTabClosing?.activateTab) {
          setAfterTabClosing(result.settings.afterTabClosing.activateTab);
        }
        console.log("Loaded settings:", result);
      } else {
        console.log("No saved settings found, using defaults");
      }
    });
  }, []);

  const handleNewTabPositionChange = (value: string) => {
    setNewTabPosition(value as TabPosition);
    console.log("New Tab Position changed to:", value);
  };

  const handleAfterTabClosingChange = (value: string) => {
    setAfterTabClosing(value as TabActivation);
    console.log("After Tab Closing changed to:", value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      // 現在の設定を取得（他の設定を保持するため）
      const result = await chrome.storage.local.get(["version", "settings"]);
      const currentSettings = result.settings || {};

      // 新しい設定を保存
      await chrome.storage.local.set({
        version: APP_VERSION,
        settings: {
          ...currentSettings,
          newTab: {
            position: newTabPosition,
          },
          afterTabClosing: {
            activateTab: afterTabClosing,
          },
        },
      });

      setSaveMessage("Settings saved successfully!");
      console.log("Settings saved:", { newTabPosition, afterTabClosing });

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
        </div>

        {/* タブコンテンツと保存ボタンのコンテナ */}
        <div className="flex flex-col gap-6">
          {/* タブコンテンツ */}
          <div className="bg-white rounded-lg shadow-lg p-10 min-h-[500px]">
            {activeTab === "behavior" && (
              <TabBehavior
                newTabPosition={newTabPosition}
                onNewTabPositionChange={handleNewTabPositionChange}
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
