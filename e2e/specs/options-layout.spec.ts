import { expect, test } from "@/e2e/fixtures";
import { setExtensionSettings } from "@/e2e/utils/helpers";
import { DEFAULT_SETTINGS } from "@/src/types";

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 375, height: 667 },
]) {
  test(`settings layout keeps actions visible at ${viewport.width}px`, async ({
    context,
    extensionId,
  }, testInfo) => {
    await setExtensionSettings(context, DEFAULT_SETTINGS);
    const page = await context.newPage();
    await page.setViewportSize(viewport);
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    const selectCategory = async (name: string) => {
      if (viewport.width < 768) {
        await page
          .getByRole("combobox", { name: "Settings categories", exact: true })
          .selectOption({ label: name });
      } else {
        await page.getByRole("navigation").getByRole("button", { name, exact: true }).click();
      }
    };
    const save = page.getByRole("button", { name: "Save Settings", exact: true });
    await expect(save).toBeEnabled();
    await expect(save).toBeInViewport();
    await expect(page.getByRole("button", { name: "Export Settings", exact: true })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Configure shortcuts", exact: true }),
    ).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath("new-tab.png") });
    await page.locator('input[name="newTabPosition"][value="left"]').check();
    await expect(page.getByRole("status")).toHaveText("You have unsaved changes.");
    await selectCategory("Pop-up");
    await page.getByLabel("Open pop-up window as new tab", { exact: true }).check();
    await selectCategory("Keyboard shortcuts");
    await expect(
      page.getByText(
        "Shortcut changes are applied in Chrome and do not require Save Settings here.",
      ),
    ).toBeVisible();
    await selectCategory("Settings management");
    await expect(page.getByRole("button", { name: "Export Settings", exact: true })).toBeVisible();
    await selectCategory("New Tab");
    await expect(page.locator('input[name="newTabPosition"][value="left"]')).toBeChecked();
    await save.click();
    await expect(page.getByRole("status")).toHaveText("Settings saved successfully!");
    await page.reload();
    await expect(page.locator('input[name="newTabPosition"][value="left"]')).toBeChecked();
    await selectCategory("Pop-up");
    await expect(page.getByLabel("Open pop-up window as new tab", { exact: true })).toBeChecked();
    await expect(save).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: testInfo.outputPath("popup.png") });
    await selectCategory("External Links");
    await page.getByRole("button", { name: "Add rule", exact: true }).click();
    const pattern = page.getByRole("textbox", { name: "URL pattern 1", exact: true });
    await pattern.fill("example.test");
    await pattern.press("Tab");
    const action = page.getByRole("combobox", { name: "Link action 1", exact: true });
    await expect(action).toBeFocused();
    const actionBox = (await action.boundingBox())!;
    const footerBox = (await page.getByRole("contentinfo").boundingBox())!;
    expect(actionBox.y + actionBox.height).toBeLessThanOrEqual(footerBox.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(save).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath("external-links.png") });
  });
}

for (const [category, add, input] of [
  ["New Tab", "Add rule", "URL pattern 1"],
  ["Loading Page", "Add loading rule", "Loading URL pattern 1"],
  ["Pop-up", "Add pop-up exception", "Pop-up exception 1"],
  ["External Links", "Add rule", "URL pattern 1"],
]) {
  test(`saving from another category focuses an invalid ${category} rule`, async ({
    context,
    extensionId,
  }) => {
    await setExtensionSettings(context, DEFAULT_SETTINGS);
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.getByRole("navigation").getByRole("button", { name: category, exact: true }).click();
    await page.getByRole("button", { name: add, exact: true }).click();
    await page.getByRole("textbox", { name: input, exact: true }).fill("[");
    await page.getByRole("button", { name: "Settings management", exact: true }).click();
    await page.getByRole("button", { name: "Save Settings", exact: true }).click();
    await expect(page.getByRole("textbox", { name: input, exact: true })).toBeFocused();
    await expect(page.getByRole("alert")).toHaveText("Enter a valid URL pattern.");
    await expect(
      page.getByRole("navigation").getByRole("button", { name: category, exact: true }),
    ).toHaveAttribute("aria-current", "page");
    // 同じカテゴリから再度保存してもエラー箇所へ戻る。
    await page.getByRole("button", { name: "Save Settings", exact: true }).click();
    await expect(page.getByRole("textbox", { name: input, exact: true })).toBeFocused();
  });
}
