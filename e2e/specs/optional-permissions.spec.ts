import { expect, test } from "@/e2e/fixtures";

declare global {
  interface Window {
    __permissionRequests: chrome.permissions.Permissions[];
    __permissionRequestGranted: boolean;
  }
}

test.use({ grantOptionalPermissions: false });

test("requests optional access only from feature actions and applies the action only after a grant", async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(page.getByRole("button", { name: "Save Settings", exact: true })).toBeEnabled();

  await page.evaluate(() => {
    window.__permissionRequests = [];
    window.__permissionRequestGranted = false;
    Object.defineProperty(chrome.permissions, "request", {
      configurable: true,
      value: async (permissions: chrome.permissions.Permissions) => {
        window.__permissionRequests.push(permissions);
        return window.__permissionRequestGranted;
      },
    });
  });

  const getRequests = () => page.evaluate(() => window.__permissionRequests);
  const setRequestResult = (granted: boolean) =>
    page.evaluate(granted => {
      window.__permissionRequestGranted = granted;
    }, granted);

  expect(await getRequests()).toEqual([]);

  await page.getByRole("button", { name: "Add rule", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "URL pattern 1", exact: true })).toHaveCount(0);
  await expect.poll(getRequests).toEqual([{ permissions: ["tabs"] }]);

  await setRequestResult(true);
  await page.getByRole("button", { name: "Add rule", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "URL pattern 1", exact: true })).toHaveCount(1);

  await setRequestResult(false);
  await page.getByRole("button", { name: "Pop-up", exact: true }).click();
  await page.getByRole("checkbox", { name: "Open pop-up window as new tab", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Open pop-up window as new tab", exact: true }),
  ).not.toBeChecked();

  await page.getByRole("button", { name: "Loading Page", exact: true }).click();
  await page.getByRole("button", { name: "Add loading rule", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Loading URL pattern 1", exact: true }),
  ).toHaveCount(0);

  await setRequestResult(true);
  await page.getByRole("button", { name: "Add loading rule", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Loading URL pattern 1", exact: true }),
  ).toHaveCount(1);

  await page.getByRole("button", { name: "Pop-up", exact: true }).click();
  await page.getByRole("checkbox", { name: "Open pop-up window as new tab", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Open pop-up window as new tab", exact: true }),
  ).toBeChecked();

  await setRequestResult(false);
  await page.getByRole("button", { name: "External Links", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Open external links in new tabs", exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", { name: "Open external links in new tabs", exact: true }),
  ).not.toBeChecked();

  await setRequestResult(true);
  await page
    .getByRole("checkbox", { name: "Open external links in new tabs", exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", { name: "Open external links in new tabs", exact: true }),
  ).toBeChecked();

  await expect
    .poll(getRequests)
    .toEqual([
      { permissions: ["tabs"] },
      { permissions: ["tabs"] },
      { permissions: ["webNavigation"] },
      { permissions: ["webNavigation"] },
      { permissions: ["webNavigation"] },
      { permissions: ["scripting"], origins: ["http://*/*", "https://*/*"] },
      { permissions: ["scripting"], origins: ["http://*/*", "https://*/*"] },
    ]);
});
