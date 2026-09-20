import { isValidUrlPattern } from "@/src/tabs/urlRules";
import type { Settings } from "@/src/types";

export const SETTINGS_FILE_NAME = "tab-position-options-fork-settings.json";
const fileFormat = "tab-position-options-fork";
const fileVersion = 1;

export const parseSettingsFile = (text: string) => {
  const data = readObject(JSON.parse(text), ["format", "version", "settings"]);
  if (data.format !== fileFormat || data.version !== fileVersion) {
    throw new Error("Unsupported settings file");
  }
  return readSettings(data.settings);
};

export const serializeSettings = (settings: Settings) => {
  // 保存前の画面からも書き出すため、読み込み可能な設定だけを出力する。
  const validated = readSettings({
    ...settings,
    newTab: { ...settings.newTab, urlRules: settings.newTab.urlRules ?? [] },
    loadingPage: { ...settings.loadingPage, urlRules: settings.loadingPage.urlRules ?? [] },
    popup: { ...settings.popup, exceptions: settings.popup.exceptions ?? [] },
  });
  return JSON.stringify({ format: fileFormat, version: fileVersion, settings: validated }, null, 2);
};

const readSettings = (value: unknown) => {
  const settings = readObject(value, [
    "newTab",
    "loadingPage",
    "afterTabClosing",
    "tabOnActivate",
    "popup",
  ]);
  const newTab = readObject(settings.newTab, ["position", "openInBackground", "urlRules"]);
  const loadingPage = readObject(settings.loadingPage, ["urlRules"]);
  const afterTabClosing = readObject(settings.afterTabClosing, ["activateTab"]);
  const tabOnActivate = readObject(settings.tabOnActivate, ["behavior"]);
  const popup = readObject(settings.popup, ["openAsNewTab", "exceptions"]);

  return {
    newTab: {
      position: readChoice(newTab.position, ["first", "last", "right", "left", "default"]),
      openInBackground: readBoolean(newTab.openInBackground),
      urlRules: readArray(newTab.urlRules).map(value => {
        const rule = readObject(value, ["url", "position", "active"]);
        return {
          url: readPattern(rule.url),
          position: readChoice(rule.position, ["first", "last", "right", "left", "default"]),
          active: readChoice(rule.active, ["foreground", "background"]),
        };
      }),
    },
    loadingPage: {
      urlRules: readArray(loadingPage.urlRules).map(value => {
        const rule = readObject(value, ["url", "position"]);
        return {
          url: readPattern(rule.url),
          position: readChoice(rule.position, ["first", "middle", "last"]),
        };
      }),
    },
    afterTabClosing: {
      activateTab: readChoice(afterTabClosing.activateTab, [
        "first",
        "last",
        "left",
        "right",
        "inActivatedOrder",
        "sourceTab",
        "sourceTabAndOrder",
        "default",
      ]),
    },
    tabOnActivate: { behavior: readChoice(tabOnActivate.behavior, ["default", "first", "last"]) },
    popup: {
      openAsNewTab: readBoolean(popup.openAsNewTab),
      exceptions: readArray(popup.exceptions).map(value => {
        const rule = readObject(value, ["url"]);
        return { url: readPattern(rule.url) };
      }),
    },
  } satisfies Settings;
};

const readObject = (value: unknown, keys: string[]) => {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== keys.length ||
    !keys.every(key => Object.hasOwn(value, key))
  ) {
    throw new Error("Invalid settings object");
  }
  return value as Record<string, unknown>;
};

const readArray = (value: unknown): unknown[] => {
  if (!Array.isArray(value)) {
    throw new Error("Invalid settings list");
  }
  return value;
};

const readBoolean = (value: unknown) => {
  if (typeof value !== "boolean") {
    throw new Error("Invalid settings boolean");
  }
  return value;
};

const readChoice = <T extends string>(value: unknown, choices: T[]) => {
  const choice = choices.find(item => item === value);
  if (choice === undefined) {
    throw new Error("Invalid settings choice");
  }
  return choice;
};

const readPattern = (value: unknown) => {
  if (typeof value !== "string" || !isValidUrlPattern(value.trim())) {
    throw new Error("Invalid URL pattern");
  }
  return value.trim();
};
