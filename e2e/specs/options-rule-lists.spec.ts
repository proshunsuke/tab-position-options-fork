import { expect, test } from "@/e2e/fixtures";
import { setExtensionSettings } from "@/e2e/utils/helpers";
import { DEFAULT_SETTINGS, type Settings } from "@/src/types";

const patterns = Array.from({ length: 30 }, (_, index) => ({ url: `example.test/${index}` }));
const settings: Settings = {
  ...DEFAULT_SETTINGS,
  newTab: {
    ...DEFAULT_SETTINGS.newTab,
    urlRules: patterns.map(rule => ({ ...rule, position: "first", active: "foreground" })),
  },
  loadingPage: { urlRules: patterns.map(rule => ({ ...rule, position: "last" })) },
  popup: { openAsNewTab: false, exceptions: patterns },
  externalLinks: {
    enabled: false,
    urlRules: patterns.map(rule => ({ ...rule, action: "exclude-page" })),
  },
};

for (const [section, groupName, inputName, addName, removeName] of [
  ["newTab", "Matching URLs", "URL pattern", "Add rule", "Remove rule"],
  ["loadingPage", "Loading Page", "Loading URL pattern", "Add loading rule", "Remove loading rule"],
  [
    "popup",
    "Matching URLs keep their pop-up window. Patterns support regular expressions.",
    "Pop-up exception",
    "Add pop-up exception",
    "Remove pop-up exception",
  ],
  ["externalLinks", "Matching URLs", "URL pattern", "Add rule", "Remove rule"],
] as const) {
  test(`long ${section} lists scroll while add, edit, remove, and save remain usable`, async ({
    context,
    extensionId,
    serviceWorker,
  }, testInfo) => {
    await setExtensionSettings(context, settings);
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    if (section === "externalLinks") {
      await page.getByRole("button", { name: "External Links", exact: true }).click();
    }
    const list = page.getByRole("group", { name: groupName, exact: true });
    await expect(list.getByRole("textbox")).toHaveCount(30);
    expect(
      await list.evaluate(
        element => element.scrollHeight > element.clientHeight && element.clientHeight <= 320,
      ),
    ).toBe(true);
    expect(await list.getByRole("button", { name: addName, exact: true }).count()).toBe(0);
    await list.getByRole("textbox", { name: `${inputName} 30`, exact: true }).fill("edited.test");
    expect(await list.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    await page.getByRole("button", { name: addName, exact: true }).click();
    await list.getByRole("textbox", { name: `${inputName} 31`, exact: true }).fill("added.test");
    await list.getByRole("button", { name: `${removeName} 1`, exact: true }).click();
    await expect(list.getByRole("textbox")).toHaveCount(30);
    await page.getByRole("button", { name: "Save Settings", exact: true }).click();
    await expect(async () => {
      const stored = await serviceWorker.evaluate(
        async () => (await chrome.storage.local.get<{ settings: Settings }>("settings")).settings,
      );
      const rules = section === "popup" ? stored.popup.exceptions : stored[section].urlRules;
      expect(rules).toHaveLength(30);
      expect(rules!.at(-2)?.url).toBe("edited.test");
      expect(rules!.at(-1)?.url).toBe("added.test");
    }).toPass();
    await page.screenshot({
      path: testInfo.outputPath(`${section}-scroll-list.png`),
      fullPage: true,
    });
  });
}
