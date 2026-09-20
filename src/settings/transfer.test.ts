import { expect, test } from "vitest";
import { parseSettingsFile, serializeSettings } from "@/src/settings/transfer";
import { DEFAULT_SETTINGS, type Settings } from "@/src/types";

const settings: Settings = {
  newTab: {
    position: "right",
    openInBackground: true,
    urlRules: [
      { url: "^https://example\\.com/", position: "left", active: "background" },
      { url: "日本語", position: "default", active: "foreground" },
    ],
  },
  loadingPage: { urlRules: [{ url: "loading", position: "middle" }] },
  afterTabClosing: { activateTab: "sourceTabAndOrder" },
  tabOnActivate: { behavior: "last" },
  popup: { openAsNewTab: true, exceptions: [{ url: "popup" }] },
};
const file = { format: "tab-position-options-fork", version: 1, settings };

test("round trip preserves all settings, rule order, Unicode, and regex escapes", () => {
  const exported = serializeSettings(settings);
  expect(JSON.parse(exported)).toEqual(file);
  expect(parseSettingsFile(exported)).toEqual(settings);
  expect(parseSettingsFile(serializeSettings(DEFAULT_SETTINGS))).toEqual(DEFAULT_SETTINGS);
});

test("optional in-memory rule lists are exported as empty lists", () => {
  expect(
    parseSettingsFile(
      serializeSettings({
        ...DEFAULT_SETTINGS,
        newTab: { position: "default", openInBackground: false },
        loadingPage: {},
        popup: { openAsNewTab: false },
      }),
    ),
  ).toEqual(DEFAULT_SETTINGS);
});

test("normalizes patterns without changing the input settings", () => {
  const input = {
    ...settings,
    popup: { openAsNewTab: true, exceptions: [{ url: "  example  " }] },
  };
  expect(parseSettingsFile(JSON.stringify({ ...file, settings: input })).popup.exceptions).toEqual([
    { url: "example" },
  ]);
  expect(parseSettingsFile(serializeSettings(input)).popup.exceptions).toEqual([
    { url: "example" },
  ]);
  expect(input.popup.exceptions[0].url).toBe("  example  ");
});

for (const [name, value] of [
  ["null", null],
  ["array", []],
  ["empty object", {}],
  ["original extension format", { osel: "openbutton1", actb: "activebutton1" }],
  ["plain settings", settings],
  ["another extension", { ...file, format: "other-extension" }],
  ["unsupported version", { ...file, version: 2 }],
  ["string version", { ...file, version: "1" }],
  ["extra envelope field", { ...file, extra: true }],
] as const) {
  test(`rejects ${name}`, () => {
    expect(() => parseSettingsFile(JSON.stringify(value))).toThrow();
  });
}

for (const [name, value] of [
  ["missing section", { newTab: settings.newTab }],
  ["extra section", { ...settings, unknown: {} }],
  ["non-object section", { ...settings, popup: null }],
  ["missing rules", { ...settings, loadingPage: {} }],
  ["non-array rules", { ...settings, loadingPage: { urlRules: {} } }],
  ["non-object rule", { ...settings, popup: { ...settings.popup, exceptions: [null] } }],
  ["non-string pattern", { ...settings, popup: { ...settings.popup, exceptions: [{ url: 123 }] } }],
  [
    "extra rule field",
    { ...settings, popup: { ...settings.popup, exceptions: [{ url: "valid", extra: true }] } },
  ],
  ["new-tab position", { ...settings, newTab: { ...settings.newTab, position: "middle" } }],
  [
    "background boolean",
    { ...settings, newTab: { ...settings.newTab, openInBackground: "false" } },
  ],
  ["popup boolean", { ...settings, popup: { ...settings.popup, openAsNewTab: 1 } }],
  ["closing behavior", { ...settings, afterTabClosing: { activateTab: "middle" } }],
  ["activation behavior", { ...settings, tabOnActivate: { behavior: "right" } }],
  [
    "loading position",
    { ...settings, loadingPage: { urlRules: [{ url: "valid", position: "right" }] } },
  ],
  [
    "new-tab rule position",
    {
      ...settings,
      newTab: {
        ...settings.newTab,
        urlRules: [{ url: "valid", position: "middle", active: "foreground" }],
      },
    },
  ],
  [
    "rule activation",
    {
      ...settings,
      newTab: { ...settings.newTab, urlRules: [{ url: "valid", position: "first", active: true }] },
    },
  ],
] as const) {
  test(`rejects invalid ${name} without applying defaults`, () => {
    expect(() => parseSettingsFile(JSON.stringify({ ...file, settings: value }))).toThrow();
  });
}

for (const pattern of ["", "  ", "["]) {
  for (const value of [
    {
      ...settings,
      newTab: {
        ...settings.newTab,
        urlRules: [{ url: pattern, position: "first", active: "foreground" }],
      },
    },
    { ...settings, loadingPage: { urlRules: [{ url: pattern, position: "last" }] } },
    { ...settings, popup: { ...settings.popup, exceptions: [{ url: pattern }] } },
  ] satisfies Settings[]) {
    test(`rejects invalid patterns on import and export: ${JSON.stringify(value)}`, () => {
      expect(() => parseSettingsFile(JSON.stringify({ ...file, settings: value }))).toThrow();
      expect(() => serializeSettings(value)).toThrow();
    });
  }
}

test("rejects malformed JSON", () => {
  expect(() => parseSettingsFile("{invalid")).toThrow();
});
