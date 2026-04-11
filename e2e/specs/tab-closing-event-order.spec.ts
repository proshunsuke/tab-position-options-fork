import type { BrowserContext, Worker } from "@playwright/test";
import { expect, test } from "@/e2e/fixtures";
import {
  clearExtensionStorage,
  getCurrentWindowTabs,
  setExtensionSettings,
} from "@/e2e/utils/helpers";

type CloseEventOrder = "activated-first" | "removed-first";

test.describe("Tab Closing Event Order", () => {
  test.beforeEach(async ({ serviceWorker }) => {
    await clearExtensionStorage(serviceWorker);
  });

  test("should activate the left tab when onActivated fires before onRemoved", async ({
    context,
    serviceWorker,
  }) => {
    await prepareRepresentativeCloseScenario(context, serviceWorker);

    await simulateActiveTabCloseWithEventOrder(serviceWorker, "activated-first");

    await expect(async () => {
      const tabs = await getCurrentWindowTabs(serviceWorker);
      expect(tabs).toHaveLength(3);
      expect(tabs.find(tab => tab.active)?.index).toBe(1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should activate the left tab when onRemoved fires before onActivated", async ({
    context,
    serviceWorker,
  }) => {
    await prepareRepresentativeCloseScenario(context, serviceWorker);

    await simulateActiveTabCloseWithEventOrder(serviceWorker, "removed-first");

    await expect(async () => {
      const tabs = await getCurrentWindowTabs(serviceWorker);
      expect(tabs).toHaveLength(3);
      expect(tabs.find(tab => tab.active)?.index).toBe(1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });
});

const prepareRepresentativeCloseScenario = async (
  context: BrowserContext,
  serviceWorker: Worker,
) => {
  await context.newPage();
  const targetTab = await context.newPage();
  await context.newPage();

  await targetTab.bringToFront();
  await targetTab.waitForTimeout(200);

  await setExtensionSettings(context, {
    afterTabClosing: { activateTab: "left" },
  });

  const tabs = await getCurrentWindowTabs(serviceWorker);
  expect(tabs).toHaveLength(4);
  expect(tabs.find(tab => tab.active)?.index).toBe(2);
};

const simulateActiveTabCloseWithEventOrder = async (
  serviceWorker: Worker,
  eventOrder: CloseEventOrder,
) =>
  serviceWorker.evaluate(async eventOrder => {
    const { handleTabActivated, handleTabRemoved, onActivated, onRemoved } =
      globalThis.__testExports!.tabHandlers;

    onActivated.removeListener(handleTabActivated);
    onRemoved.removeListener(handleTabRemoved);

    try {
      const tabs = (await chrome.tabs.query({ currentWindow: true })).sort(
        (left, right) => left.index - right.index,
      );
      const activeTab = tabs.find(tab => tab.active);
      if (!activeTab?.id) {
        throw new Error("Active tab not found");
      }

      const closedTabIndex = tabs.findIndex(tab => tab.id === activeTab.id);
      const successorTab = tabs[closedTabIndex + 1];
      if (!successorTab?.id) {
        throw new Error("Right-side successor tab not found");
      }

      if (eventOrder === "activated-first") {
        await chrome.tabs.update(successorTab.id, { active: true });
        await handleTabActivated({
          tabId: successorTab.id,
          windowId: successorTab.windowId,
        });
        await chrome.tabs.remove(activeTab.id);
        await handleTabRemoved(activeTab.id, {
          windowId: activeTab.windowId,
          isWindowClosing: false,
        });
      } else {
        await chrome.tabs.remove(activeTab.id);
        await handleTabRemoved(activeTab.id, {
          windowId: activeTab.windowId,
          isWindowClosing: false,
        });

        const [newActiveTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!newActiveTab?.id) {
          throw new Error("New active tab not found after removal");
        }

        await handleTabActivated({
          tabId: newActiveTab.id,
          windowId: newActiveTab.windowId,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    } finally {
      onActivated.addListener(handleTabActivated);
      onRemoved.addListener(handleTabRemoved);
    }
  }, eventOrder);
