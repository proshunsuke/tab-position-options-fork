import { useEffect, useState } from "react";
import type { TabPosition } from "@/src/types";

export default function App() {
  const [newTabPosition, setNewTabPosition] = useState<TabPosition>("default");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // 起動時に保存済みの設定を読み込む
  useEffect(() => {
    chrome.storage.local.get(["version", "settings"], result => {
      if (result.settings?.newTab?.position) {
        setNewTabPosition(result.settings.newTab.position);
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

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      // 現在の設定を取得（他の設定を保持するため）
      const result = await chrome.storage.local.get(["version", "settings"]);
      const currentSettings = result.settings || {};

      // 新しい設定を保存
      await chrome.storage.local.set({
        version: "1.0.0",
        settings: {
          ...currentSettings,
          newTab: {
            position: newTabPosition,
          },
        },
      });

      setSaveMessage("Settings saved successfully!");
      console.log("Settings saved:", { newTabPosition });

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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Tab Position Options</h1>

      <section className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">New Tab</h2>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="newTabPosition"
              value="first"
              checked={newTabPosition === "first"}
              onChange={e => handleNewTabPositionChange(e.target.value)}
              className="w-4 h-4"
            />
            <span>Always first</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="newTabPosition"
              value="last"
              checked={newTabPosition === "last"}
              onChange={e => handleNewTabPositionChange(e.target.value)}
              className="w-4 h-4"
            />
            <span>Always last</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="newTabPosition"
              value="right"
              checked={newTabPosition === "right"}
              onChange={e => handleNewTabPositionChange(e.target.value)}
              className="w-4 h-4"
            />
            <span>Right of current tab</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="newTabPosition"
              value="left"
              checked={newTabPosition === "left"}
              onChange={e => handleNewTabPositionChange(e.target.value)}
              className="w-4 h-4"
            />
            <span>Left of current tab</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="newTabPosition"
              value="default"
              checked={newTabPosition === "default"}
              onChange={e => handleNewTabPositionChange(e.target.value)}
              className="w-4 h-4"
            />
            <span>Default</span>
          </label>
        </div>
      </section>

      <div className="mt-8">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-chrome-blue text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
        <p
          className={`mt-2 text-sm h-5 ${!saveMessage ? "invisible" : saveMessage.includes("success") ? "text-green-600" : "text-red-600"}`}
        >
          {saveMessage || "Placeholder"}
        </p>
      </div>
    </div>
  );
}
