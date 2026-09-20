import type { BrowserContext, Worker } from "@playwright/test";
import { expect, test } from "@/e2e/fixtures";
import {
  activateTabByIndexInWindow,
  clearExtensionStorage,
  getCurrentWindowId,
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
    await prepareRepresentativeCloseScenario(context, serviceWorker, "left");

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
    await prepareRepresentativeCloseScenario(context, serviceWorker, "left");

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

  test("should not override a quick user activation after an activated-first close", async ({
    context,
    serviceWorker,
  }) => {
    await prepareRepresentativeCloseScenario(context, serviceWorker, "right");

    await simulateActiveTabCloseWithEventOrder(serviceWorker, "activated-first", {
      waitForSettle: false,
    });

    const currentWindowId = await getCurrentWindowId(serviceWorker);
    if (currentWindowId === null) {
      throw new Error("Current window not found");
    }

    await activateTabByIndexInWindow(serviceWorker, currentWindowId, 0);

    await expect(async () => {
      const tabs = await getCurrentWindowTabs(serviceWorker);
      expect(tabs).toHaveLength(3);
      expect(tabs.find(tab => tab.active)?.index).toBe(0);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should keep reasserting the close target after the target tab is activated once", async ({
    context,
    serviceWorker,
  }) => {
    await prepareRepresentativeCloseScenario(context, serviceWorker, "left");

    await simulateActivatedFirstCloseRaceAfterTargetActivation(serviceWorker);

    await expect(async () => {
      const tabs = await getCurrentWindowTabs(serviceWorker);
      expect(tabs).toHaveLength(3);
      expect(tabs.find(tab => tab.active)?.index).toBe(1);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });

  test("should keep the pending close target across a background-tab removal burst", async ({
    context,
    serviceWorker,
  }) => {
    await prepareRepresentativeCloseScenario(context, serviceWorker, "left");

    await simulateActivatedFirstCloseWithBackgroundRemoveBeforeLateActivation(serviceWorker);

    await expect(async () => {
      const tabs = await getCurrentWindowTabs(serviceWorker);
      expect(tabs).toHaveLength(2);
      expect(tabs.find(tab => tab.active)?.index).toBe(0);
    }).toPass({
      intervals: [100, 100, 100],
      timeout: 5000,
    });
  });
});

const prepareRepresentativeCloseScenario = async (
  context: BrowserContext,
  serviceWorker: Worker,
  activateTab: "left" | "right",
) => {
  await context.newPage();
  const targetTab = await context.newPage();
  await context.newPage();

  await targetTab.bringToFront();
  await targetTab.waitForTimeout(200);

  await setExtensionSettings(context, {
    afterTabClosing: { activateTab },
  });

  const tabs = await getCurrentWindowTabs(serviceWorker);
  expect(tabs).toHaveLength(4);
  expect(tabs.find(tab => tab.active)?.index).toBe(2);
};

const simulateActiveTabCloseWithEventOrder = async (
  serviceWorker: Worker,
  eventOrder: CloseEventOrder,
  options: {
    waitForSettle?: boolean;
  } = {},
) =>
  serviceWorker.evaluate(
    async ({ eventOrder, options }) => {
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
          await chrome.tabs.remove(activeTab.id);
          // 操作APIの待ち時間をイベント間に含めず、同じcloseの通知を連続再生する。
          await handleTabActivated({
            tabId: successorTab.id,
            windowId: successorTab.windowId,
          });
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

        if (options.waitForSettle ?? true) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } finally {
        onActivated.addListener(handleTabActivated);
        onRemoved.addListener(handleTabRemoved);
      }
    },
    { eventOrder, options },
  );

const simulateActivatedFirstCloseRaceAfterTargetActivation = async (serviceWorker: Worker) =>
  serviceWorker.evaluate(async () => {
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
      const leftTab = tabs[closedTabIndex - 1];
      const rightTab = tabs[closedTabIndex + 1];
      if (!leftTab?.id || !rightTab?.id) {
        throw new Error("Adjacent tabs not found");
      }

      await chrome.tabs.update(rightTab.id, { active: true });
      await chrome.tabs.remove(activeTab.id);
      await handleTabActivated({
        tabId: rightTab.id,
        windowId: rightTab.windowId,
      });

      await handleTabRemoved(activeTab.id, {
        windowId: activeTab.windowId,
        isWindowClosing: false,
      });

      await chrome.tabs.update(leftTab.id, { active: true });
      await handleTabActivated({
        tabId: leftTab.id,
        windowId: leftTab.windowId,
      });

      await chrome.tabs.update(rightTab.id, { active: true });
      await handleTabActivated({
        tabId: rightTab.id,
        windowId: rightTab.windowId,
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    } finally {
      onActivated.addListener(handleTabActivated);
      onRemoved.addListener(handleTabRemoved);
    }
  });

const simulateActivatedFirstCloseWithBackgroundRemoveBeforeLateActivation = async (
  serviceWorker: Worker,
) =>
  serviceWorker.evaluate(async () => {
    const { handleTabActivated, handleTabRemoved, onActivated, onRemoved } =
      globalThis.__testExports!.tabHandlers;
    const { recordPendingCloseTarget } = globalThis.__testExports!.states;

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
      const farLeftTab = tabs[0];
      const leftTab = tabs[closedTabIndex - 1];
      const rightTab = tabs[closedTabIndex + 1];
      if (!farLeftTab?.id || !leftTab?.id || !rightTab?.id) {
        throw new Error("Representative tabs not found");
      }

      await chrome.tabs.update(rightTab.id, { active: true });
      await chrome.tabs.remove(activeTab.id);
      await handleTabActivated({
        tabId: rightTab.id,
        windowId: rightTab.windowId,
      });

      await handleTabRemoved(activeTab.id, {
        windowId: activeTab.windowId,
        isWindowClosing: false,
      });

      // 実時間の remove で pending window を跨がないよう、論点である
      // 「後続 remove が先行 close 用 pending target を消すか」だけを固定して検証する。
      recordPendingCloseTarget(activeTab.windowId, leftTab.id, 1000);

      await chrome.tabs.remove(farLeftTab.id);
      await handleTabRemoved(farLeftTab.id, {
        windowId: farLeftTab.windowId,
        isWindowClosing: false,
      });

      await chrome.tabs.update(rightTab.id, { active: true });
      await handleTabActivated({
        tabId: rightTab.id,
        windowId: rightTab.windowId,
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    } finally {
      onActivated.addListener(handleTabActivated);
      onRemoved.addListener(handleTabRemoved);
    }
  });
