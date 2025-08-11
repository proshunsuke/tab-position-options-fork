import { expect, test } from "../fixtures";
import { createTabViaServiceWorker, getTabState, setExtensionSettings } from "../utils/helpers";

test.describe("New Tab Background", () => {
  test("should display the checkbox in options page", async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // チェックボックスが存在することを確認
    const checkbox = page.locator('input[type="checkbox"]').first();
    await expect(checkbox).toBeVisible();

    // ラベルテキストを確認
    const label = page.locator("text=New Tab Background");
    await expect(label).toBeVisible();
  });

  test("should save and load checkbox state", async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    const checkbox = page.locator('input[type="checkbox"]').first();
    const saveButton = page.locator('button:has-text("Save Settings")');

    // デフォルトではチェックされていない
    await expect(checkbox).not.toBeChecked();

    // チェックボックスをオンにして保存
    await checkbox.check();
    await saveButton.click();
    await expect(page.locator("text=Settings saved successfully!")).toBeVisible();

    // ページをリロード
    await page.reload();

    // チェック状態が保持されていることを確認
    await expect(checkbox).toBeChecked();

    // チェックボックスをオフにして保存
    await checkbox.uncheck();
    await saveButton.click();
    await expect(page.locator("text=Settings saved successfully!")).toBeVisible();

    // ページをリロード
    await page.reload();

    // チェック状態が保持されていることを確認
    await expect(checkbox).not.toBeChecked();
  });

  test("should open new tabs in background when enabled", async ({ context, serviceWorker }) => {
    // バックグラウンド設定を有効にする
    await setExtensionSettings(context, {
      newTab: {
        position: "default",
        background: true,
      },
    });

    // 既存のタブを開く（data: URLを使用してネットワークアクセスを回避）
    const initialTab = await context.newPage();
    await initialTab.goto("data:text/html,<h1>Test Page 1</h1>");
    await initialTab.bringToFront();

    const beforeState = await getTabState(serviceWorker);
    const currentActiveIndex = beforeState.activeTabIndex;

    // 新しいタブを作成（Ctrl+T相当）
    await createTabViaServiceWorker(serviceWorker);

    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 500));

    // タブ状態を確認
    const afterState = await getTabState(serviceWorker);

    // 新しいタブが作成されたことを確認
    expect(afterState.totalTabs).toBe(beforeState.totalTabs + 1);

    // 元のタブがまだアクティブであることを確認（バックグラウンドで開いた）
    expect(afterState.activeTabIndex).toBe(currentActiveIndex);
  });

  test("should open new tabs as active when disabled", async ({ context, serviceWorker }) => {
    // バックグラウンド設定を無効にする（デフォルト）
    await setExtensionSettings(context, {
      newTab: {
        position: "default",
        background: false,
      },
    });

    // 既存のタブを開く（data: URLを使用してネットワークアクセスを回避）
    const initialTab = await context.newPage();
    await initialTab.goto("data:text/html,<h1>Test Page 1</h1>");
    await initialTab.bringToFront();

    const beforeState = await getTabState(serviceWorker);

    // 新しいタブを作成（Ctrl+T相当）
    await createTabViaServiceWorker(serviceWorker);

    // 少し待機して、タブの切り替えが完了するのを待つ
    await new Promise(resolve => setTimeout(resolve, 500));

    // タブ状態を確認
    const afterState = await getTabState(serviceWorker);

    // 新しいタブが作成されたことを確認
    expect(afterState.totalTabs).toBe(beforeState.totalTabs + 1);

    // 新しいタブがアクティブになっていることを確認
    expect(afterState.activeTabIndex).not.toBe(beforeState.activeTabIndex);
  });

  test("should work with different tab positions", async ({ context, serviceWorker }) => {
    // バックグラウンド設定を有効にし、位置を「最初」に設定
    await setExtensionSettings(context, {
      newTab: {
        position: "first",
        background: true,
      },
    });

    // 既存のタブを複数開く（data: URLを使用してネットワークアクセスを回避）
    const tab1 = await context.newPage();
    await tab1.goto("data:text/html,<h1>Test Page A</h1>");
    const tab2 = await context.newPage();
    await tab2.goto("data:text/html,<h1>Test Page B</h1>");
    await tab2.bringToFront();

    const beforeState = await getTabState(serviceWorker);

    // 新しいタブを作成
    await createTabViaServiceWorker(serviceWorker);

    await new Promise(resolve => setTimeout(resolve, 500));

    // タブ状態を確認
    const afterState = await getTabState(serviceWorker);

    // 新しいタブが作成されたことを確認
    expect(afterState.totalTabs).toBe(beforeState.totalTabs + 1);

    // 新しいタブが最初の位置（0）に移動することを確認
    // Service Workerの内部的なタイミングにより、
    // 作成時のインデックスと最終的な位置が異なる可能性があるため、
    // 最終的な状態を確認
    await expect(async () => {
      const tabs = await serviceWorker.evaluate(async () => {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        return tabs.map(t => ({ index: t.index, url: t.url, active: t.active }));
      });

      // 新しいタブ（chrome://newtab/）が最初の位置にあることを確認
      const newTab = tabs.find(t => t.url?.includes("newtab"));
      if (newTab) {
        expect(newTab.index).toBe(0);
      }

      // Test Page Bタブがまだアクティブであることを確認
      const activeTab = tabs.find(t => t.active);
      if (activeTab?.url) {
        expect(activeTab.url).toContain("Test Page B");
      }
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 3000,
    });
  });
});
