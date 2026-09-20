import { expect, test } from "@/e2e/fixtures";

test.use({ keepInstallOptions: true });

test("first install opens options, and repeated opens reuse the tab without losing edits", async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  const url = `chrome-extension://${extensionId}/options.html`;
  const page = context.pages().find(page => page.url() === url)!;
  await expect(
    page.getByRole("heading", { name: "Tab Position Options", exact: true }),
  ).toBeVisible();
  await page.locator('input[name="newTabPosition"][value="left"]').check();
  // 別ウィンドウが選択されている場合も同じ設定ページを使う。
  await serviceWorker.evaluate(() => chrome.windows.create({ url: "about:blank" }));
  await serviceWorker.evaluate(async () => {
    await Promise.all([
      globalThis.__testExports!.actionHandlers.openOptionsPage(),
      globalThis.__testExports!.actionHandlers.openOptionsPage(),
    ]);
  });
  await expect(page.locator('input[name="newTabPosition"][value="left"]')).toBeChecked();
  const tabs = await serviceWorker.evaluate(url => chrome.tabs.query({ url }), url);
  expect(tabs).toHaveLength(1);
  expect(tabs[0].active).toBe(true);
  expect(context.pages().filter(page => page.url() === url)).toHaveLength(1);
});

test("opens settings again when the previous settings tab was closed", async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  const url = `chrome-extension://${extensionId}/options.html`;
  await context
    .pages()
    .find(page => page.url() === url)!
    .close();
  await serviceWorker.evaluate(() => globalThis.__testExports!.actionHandlers.openOptionsPage());
  // Chromeが空白タブを再利用する場合はpageイベントが発生しない。
  await expect.poll(() => context.pages().some(page => page.url() === url)).toBe(true);
  const page = context.pages().find(page => page.url() === url)!;
  await expect(page).toHaveURL(url);
  await expect(page.getByRole("button", { name: "Save Settings", exact: true })).toBeEnabled();
});
