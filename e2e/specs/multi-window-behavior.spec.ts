import { expect, test } from "@/e2e/fixtures";
import {
  activateTabByIndexInWindow,
  clearExtensionStorage,
  closeActiveTabInWindow,
  createTabInWindow,
  createTabsInWindow,
  createWindowWithTabs,
  getCurrentWindowId,
  getWindowTabState,
  setExtensionSettings,
  simulateServiceWorkerRestart,
} from "@/e2e/utils/helpers";

test.describe("Multi Window Behavior", () => {
  test.beforeEach(async ({ serviceWorker }) => {
    await clearExtensionStorage(serviceWorker);
  });

  test("should keep new tab positioning isolated between windows", async ({
    context,
    serviceWorker,
  }) => {
    const primaryWindowId = await getCurrentWindowId(serviceWorker);
    if (primaryWindowId === null) {
      throw new Error("Primary window not found");
    }

    await createTabsInWindow(serviceWorker, primaryWindowId, 3);
    const secondaryWindow = await createWindowWithTabs(serviceWorker, 5);

    await activateTabByIndexInWindow(serviceWorker, primaryWindowId, 1);
    await new Promise(resolve => setTimeout(resolve, 200));
    await activateTabByIndexInWindow(serviceWorker, secondaryWindow.windowId, 4);
    await new Promise(resolve => setTimeout(resolve, 200));

    await setExtensionSettings(context, { newTab: { position: "right", openInBackground: false } });

    const beforePrimary = await getWindowTabState(serviceWorker, primaryWindowId);
    const beforeSecondary = await getWindowTabState(serviceWorker, secondaryWindow.windowId);
    expect(beforePrimary.totalTabs).toBe(4);
    expect(beforePrimary.activeTabIndex).toBe(1);
    expect(beforeSecondary.totalTabs).toBe(5);
    expect(beforeSecondary.activeTabIndex).toBe(4);

    await createTabInWindow(serviceWorker, primaryWindowId);

    await expect(async () => {
      const primaryState = await getWindowTabState(serviceWorker, primaryWindowId);
      const secondaryState = await getWindowTabState(serviceWorker, secondaryWindow.windowId);

      expect(primaryState.totalTabs).toBe(beforePrimary.totalTabs + 1);
      expect(primaryState.activeTabIndex).toBe(beforePrimary.activeTabIndex + 1);
      expect(secondaryState.totalTabs).toBe(beforeSecondary.totalTabs);
      expect(secondaryState.activeTabIndex).toBe(beforeSecondary.activeTabIndex);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should activate the left tab only within the same window after closing", async ({
    context,
    serviceWorker,
  }) => {
    const primaryWindowId = await getCurrentWindowId(serviceWorker);
    if (primaryWindowId === null) {
      throw new Error("Primary window not found");
    }

    await createTabsInWindow(serviceWorker, primaryWindowId, 4);
    const secondaryWindow = await createWindowWithTabs(serviceWorker, 6);

    await activateTabByIndexInWindow(serviceWorker, primaryWindowId, 2);
    await new Promise(resolve => setTimeout(resolve, 200));
    await activateTabByIndexInWindow(serviceWorker, secondaryWindow.windowId, 4);
    await new Promise(resolve => setTimeout(resolve, 200));

    await setExtensionSettings(context, { afterTabClosing: { activateTab: "left" } });

    const beforePrimary = await getWindowTabState(serviceWorker, primaryWindowId);
    const beforeSecondary = await getWindowTabState(serviceWorker, secondaryWindow.windowId);
    expect(beforePrimary.totalTabs).toBe(5);
    expect(beforePrimary.activeTabIndex).toBe(2);
    expect(beforeSecondary.totalTabs).toBe(6);
    expect(beforeSecondary.activeTabIndex).toBe(4);

    await closeActiveTabInWindow(serviceWorker, primaryWindowId);

    await expect(async () => {
      const primaryState = await getWindowTabState(serviceWorker, primaryWindowId);
      const secondaryState = await getWindowTabState(serviceWorker, secondaryWindow.windowId);

      expect(primaryState.totalTabs).toBe(beforePrimary.totalTabs - 1);
      expect(primaryState.activeTabIndex).toBe(beforePrimary.activeTabIndex - 1);
      expect(secondaryState.totalTabs).toBe(beforeSecondary.totalTabs);
      expect(secondaryState.activeTabIndex).toBe(beforeSecondary.activeTabIndex);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should use activation history from the same window after closing", async ({
    context,
    serviceWorker,
  }) => {
    const primaryWindowId = await getCurrentWindowId(serviceWorker);
    if (primaryWindowId === null) {
      throw new Error("Primary window not found");
    }

    await createTabsInWindow(serviceWorker, primaryWindowId, 4);
    const secondaryWindow = await createWindowWithTabs(serviceWorker, 5);

    await activateTabByIndexInWindow(serviceWorker, primaryWindowId, 1);
    await new Promise(resolve => setTimeout(resolve, 200));
    await activateTabByIndexInWindow(serviceWorker, secondaryWindow.windowId, 4);
    await new Promise(resolve => setTimeout(resolve, 200));
    await activateTabByIndexInWindow(serviceWorker, primaryWindowId, 4);
    await new Promise(resolve => setTimeout(resolve, 200));
    await activateTabByIndexInWindow(serviceWorker, secondaryWindow.windowId, 2);
    await new Promise(resolve => setTimeout(resolve, 200));
    await activateTabByIndexInWindow(serviceWorker, primaryWindowId, 2);
    await new Promise(resolve => setTimeout(resolve, 200));

    await setExtensionSettings(context, { afterTabClosing: { activateTab: "inActivatedOrder" } });

    const beforePrimary = await getWindowTabState(serviceWorker, primaryWindowId);
    const beforeSecondary = await getWindowTabState(serviceWorker, secondaryWindow.windowId);
    expect(beforePrimary.totalTabs).toBe(5);
    expect(beforePrimary.activeTabIndex).toBe(2);
    expect(beforeSecondary.totalTabs).toBe(5);
    expect(beforeSecondary.activeTabIndex).toBe(2);

    await closeActiveTabInWindow(serviceWorker, primaryWindowId);

    await expect(async () => {
      const primaryState = await getWindowTabState(serviceWorker, primaryWindowId);
      const secondaryState = await getWindowTabState(serviceWorker, secondaryWindow.windowId);

      expect(primaryState.totalTabs).toBe(beforePrimary.totalTabs - 1);
      expect(primaryState.activeTabIndex).toBe(3);
      expect(secondaryState.totalTabs).toBe(beforeSecondary.totalTabs);
      expect(secondaryState.activeTabIndex).toBe(beforeSecondary.activeTabIndex);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should restore per-window activation history for new tab positioning after Service Worker restart", async ({
    context,
    serviceWorker,
  }) => {
    const primaryWindowId = await getCurrentWindowId(serviceWorker);
    if (primaryWindowId === null) {
      throw new Error("Primary window not found");
    }

    await createTabsInWindow(serviceWorker, primaryWindowId, 3);
    const secondaryWindow = await createWindowWithTabs(serviceWorker, 5);

    await activateTabByIndexInWindow(serviceWorker, primaryWindowId, 1);
    await new Promise(resolve => setTimeout(resolve, 200));
    await activateTabByIndexInWindow(serviceWorker, secondaryWindow.windowId, 4);
    await new Promise(resolve => setTimeout(resolve, 200));

    await setExtensionSettings(context, { newTab: { position: "right", openInBackground: false } });

    const beforePrimary = await getWindowTabState(serviceWorker, primaryWindowId);
    const beforeSecondary = await getWindowTabState(serviceWorker, secondaryWindow.windowId);
    expect(beforePrimary.totalTabs).toBe(4);
    expect(beforePrimary.activeTabIndex).toBe(1);
    expect(beforeSecondary.totalTabs).toBe(5);
    expect(beforeSecondary.activeTabIndex).toBe(4);

    await simulateServiceWorkerRestart(serviceWorker);
    await createTabInWindow(serviceWorker, primaryWindowId);

    await expect(async () => {
      const primaryState = await getWindowTabState(serviceWorker, primaryWindowId);
      const secondaryState = await getWindowTabState(serviceWorker, secondaryWindow.windowId);

      expect(primaryState.totalTabs).toBe(beforePrimary.totalTabs + 1);
      expect(primaryState.activeTabIndex).toBe(beforePrimary.activeTabIndex + 1);
      expect(secondaryState.totalTabs).toBe(beforeSecondary.totalTabs);
      expect(secondaryState.activeTabIndex).toBe(beforeSecondary.activeTabIndex);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should restore per-window activation history for tab closing after Service Worker restart", async ({
    context,
    serviceWorker,
  }) => {
    const primaryWindowId = await getCurrentWindowId(serviceWorker);
    if (primaryWindowId === null) {
      throw new Error("Primary window not found");
    }

    await createTabsInWindow(serviceWorker, primaryWindowId, 4);
    const secondaryWindow = await createWindowWithTabs(serviceWorker, 5);

    await activateTabByIndexInWindow(serviceWorker, primaryWindowId, 1);
    await new Promise(resolve => setTimeout(resolve, 200));
    await activateTabByIndexInWindow(serviceWorker, secondaryWindow.windowId, 4);
    await new Promise(resolve => setTimeout(resolve, 200));
    await activateTabByIndexInWindow(serviceWorker, primaryWindowId, 4);
    await new Promise(resolve => setTimeout(resolve, 200));
    await activateTabByIndexInWindow(serviceWorker, secondaryWindow.windowId, 2);
    await new Promise(resolve => setTimeout(resolve, 200));
    await activateTabByIndexInWindow(serviceWorker, primaryWindowId, 2);
    await new Promise(resolve => setTimeout(resolve, 200));

    await setExtensionSettings(context, { afterTabClosing: { activateTab: "inActivatedOrder" } });

    const beforePrimary = await getWindowTabState(serviceWorker, primaryWindowId);
    const beforeSecondary = await getWindowTabState(serviceWorker, secondaryWindow.windowId);
    expect(beforePrimary.totalTabs).toBe(5);
    expect(beforePrimary.activeTabIndex).toBe(2);
    expect(beforeSecondary.totalTabs).toBe(5);
    expect(beforeSecondary.activeTabIndex).toBe(2);

    await simulateServiceWorkerRestart(serviceWorker);
    await closeActiveTabInWindow(serviceWorker, primaryWindowId);

    await expect(async () => {
      const primaryState = await getWindowTabState(serviceWorker, primaryWindowId);
      const secondaryState = await getWindowTabState(serviceWorker, secondaryWindow.windowId);

      expect(primaryState.totalTabs).toBe(beforePrimary.totalTabs - 1);
      expect(primaryState.activeTabIndex).toBe(3);
      expect(secondaryState.totalTabs).toBe(beforeSecondary.totalTabs);
      expect(secondaryState.activeTabIndex).toBe(beforeSecondary.activeTabIndex);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should restore opener relationships per window after Service Worker restart", async ({
    context,
    serviceWorker,
  }) => {
    const primaryWindowId = await getCurrentWindowId(serviceWorker);
    if (primaryWindowId === null) {
      throw new Error("Primary window not found");
    }

    await createTabsInWindow(serviceWorker, primaryWindowId, 2);
    const secondaryWindow = await createWindowWithTabs(serviceWorker, 4);

    await activateTabByIndexInWindow(serviceWorker, primaryWindowId, 1);
    await new Promise(resolve => setTimeout(resolve, 200));

    const childTab = await createTabInWindow(serviceWorker, primaryWindowId, {
      active: true,
      useActiveTabAsOpener: true,
    });
    expect(childTab.openerTabId).not.toBeNull();

    await new Promise(resolve => setTimeout(resolve, 200));
    await activateTabByIndexInWindow(serviceWorker, secondaryWindow.windowId, 2);
    await new Promise(resolve => setTimeout(resolve, 200));

    await setExtensionSettings(context, { afterTabClosing: { activateTab: "sourceTab" } });

    const beforePrimary = await getWindowTabState(serviceWorker, primaryWindowId);
    const beforeSecondary = await getWindowTabState(serviceWorker, secondaryWindow.windowId);
    expect(beforePrimary.totalTabs).toBe(4);
    expect(beforePrimary.activeTabIndex).toBe(3);
    expect(beforeSecondary.totalTabs).toBe(4);
    expect(beforeSecondary.activeTabIndex).toBe(2);

    await simulateServiceWorkerRestart(serviceWorker);
    await closeActiveTabInWindow(serviceWorker, primaryWindowId);

    await expect(async () => {
      const primaryState = await getWindowTabState(serviceWorker, primaryWindowId);
      const secondaryState = await getWindowTabState(serviceWorker, secondaryWindow.windowId);

      expect(primaryState.totalTabs).toBe(beforePrimary.totalTabs - 1);
      expect(primaryState.activeTabIndex).toBe(1);
      expect(secondaryState.totalTabs).toBe(beforeSecondary.totalTabs);
      expect(secondaryState.activeTabIndex).toBe(beforeSecondary.activeTabIndex);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });
});
