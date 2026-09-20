import { createServer } from "node:http";
import { expect, test } from "@/e2e/fixtures";
import {
  createWindowWithTabs,
  setExtensionSettings,
  simulateServiceWorkerRestart,
} from "@/e2e/utils/helpers";
import { DEFAULT_SETTINGS } from "@/src/types";

const server = createServer((request, response) => {
  response.writeHead(200, { "content-type": "text/html" });
  response.end(`<title>${request.url?.slice(1) ?? ""}</title>`);
});
let origin = "";
test.beforeAll(async () => {
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Missing server address");
  }
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve())),
  );
});

test.beforeEach(async ({ context }) => {
  await setExtensionSettings(context, DEFAULT_SETTINGS);
});

for (const command of ["sort-title", "sort-url"]) {
  test(`${command} preserves pinned tabs and group membership`, async ({ serviceWorker }) => {
    const { windowId } = await createWindowWithTabs(serviceWorker, 7);
    const setup = await serviceWorker.evaluate(
      async ({ windowId, origin }) => {
        const tabs = await chrome.tabs.query({ windowId });
        const ids = tabs.map(tab => tab.id!);
        await chrome.tabs.update(ids[0], { pinned: true });
        const groupId = await chrome.tabs.group({
          tabIds: [ids[3], ids[4]],
          createProperties: { windowId },
        });
        for (const [index, title] of ["pinned", "z", "a", "z", "a", "z", "a"].entries()) {
          await chrome.tabs.update(ids[index], { url: `${origin}/${title}` });
        }
        return { ids, groupId };
      },
      { windowId, origin },
    );
    await expect(async () => {
      const titles = await serviceWorker.evaluate(
        async id => (await chrome.tabs.query({ windowId: id })).map(tab => tab.title),
        windowId,
      );
      expect(titles).toEqual(["pinned", "z", "a", "z", "a", "z", "a"]);
    }).toPass({ timeout: 5000 });
    await serviceWorker.evaluate(
      async ({ windowId, command }) => {
        const [tab] = await chrome.tabs.query({ windowId, active: true });
        await globalThis.__testExports!.tabHandlers.handleCommand(command, tab);
      },
      { windowId, command },
    );
    const result = await serviceWorker.evaluate(
      async id =>
        (await chrome.tabs.query({ windowId: id })).map(tab => ({
          id: tab.id,
          pinned: tab.pinned,
          groupId: tab.groupId,
        })),
      windowId,
    );
    expect(result.map(tab => tab.id)).toEqual([0, 2, 1, 4, 3, 6, 5].map(index => setup.ids[index]));
    expect(result[0].pinned).toBe(true);
    expect(result.map(tab => tab.groupId)).toEqual([
      -1,
      -1,
      -1,
      setup.groupId,
      setup.groupId,
      -1,
      -1,
    ]);
  });
}

for (const behavior of ["default", "first", "last"] as const) {
  test(`toggle uses history after initialization and respects ${behavior} activation`, async ({
    context,
    serviceWorker,
  }) => {
    const { windowId } = await createWindowWithTabs(serviceWorker, 3);
    const ids = await serviceWorker.evaluate(
      async id => (await chrome.tabs.query({ windowId: id })).map(tab => tab.id!),
      windowId,
    );
    for (const id of [ids[0], ids[1]]) {
      await serviceWorker.evaluate(id => chrome.tabs.update(id, { active: true }), id);
      await expect(async () => {
        const last = await serviceWorker.evaluate(async windowId => {
          const value = await chrome.storage.session.get<{
            tabActivationHistory?: Record<string, number[]>;
          }>("tabActivationHistory");
          return value.tabActivationHistory?.[windowId]?.at(-1);
        }, windowId);
        expect(last).toBe(id);
      }).toPass({ timeout: 5000 });
    }
    await setExtensionSettings(context, { ...DEFAULT_SETTINGS, tabOnActivate: { behavior } });
    await simulateServiceWorkerRestart(serviceWorker);
    for (const target of [ids[0], ids[1], ids[0]]) {
      await serviceWorker.evaluate(async windowId => {
        const [tab] = await chrome.tabs.query({ windowId, active: true });
        // close直後の補正より明示的なcommandを優先する。
        globalThis.__testExports!.states.recordPendingCloseTarget(windowId, tab.id!);
        await globalThis.__testExports!.tabHandlers.handleCommand("toggle-last-active", tab);
      }, windowId);
      await expect(async () => {
        const active = await serviceWorker.evaluate(
          async windowId => (await chrome.tabs.query({ windowId, active: true }))[0],
          windowId,
        );
        expect(active.id).toBe(target);
        if (behavior !== "default") {
          expect(active.index).toBe(behavior === "first" ? 0 : 2);
        }
      }).toPass({ timeout: 5000 });
    }
    if (behavior === "default") {
      await serviceWorker.evaluate(async windowId => {
        const [tab] = await chrome.tabs.query({ windowId, active: true });
        await Promise.all(
          Array.from({ length: 10 }, () =>
            globalThis.__testExports!.tabHandlers.handleCommand("toggle-last-active", tab),
          ),
        );
      }, windowId);
      await expect(async () => {
        const active = await serviceWorker.evaluate(
          async windowId => (await chrome.tabs.query({ windowId, active: true }))[0],
          windowId,
        );
        expect(active.id).toBe(ids[0]);
      }).toPass({ timeout: 5000 });
    }
  });
}

test("options display actual assignments and open Chrome shortcut settings", async ({
  context,
  extensionId,
  serviceWorker,
}, testInfo) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  const commands = (await serviceWorker.evaluate(() => chrome.commands.getAll())).filter(
    command => command.name !== "_execute_action",
  );
  expect(commands.map(command => command.name).sort()).toEqual([
    "sort-title",
    "sort-url",
    "toggle-last-active",
  ]);
  for (const command of commands) {
    const row = page.locator("dl > div").filter({ hasText: command.description });
    await expect(row.locator("dd")).toHaveText(command.shortcut || "Not assigned");
  }
  await page.getByRole("heading", { name: "Keyboard shortcuts" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("shortcuts.png") });
  // Chromeの割り当て変更はfocus復帰時に再取得する。未割り当てと取得失敗も区別する。
  await page.evaluate(() => {
    chrome.commands.getAll = (() =>
      Promise.resolve([
        { name: "sort-title", shortcut: "Ctrl+Shift+Y" },
      ])) as typeof chrome.commands.getAll;
    window.dispatchEvent(new Event("focus"));
  });
  await expect(
    page.locator("dl > div").filter({ hasText: "Sort tabs by title" }).locator("dd"),
  ).toHaveText("Ctrl+Shift+Y");
  await expect(
    page.locator("dl > div").filter({ hasText: "Sort tabs by URL" }).locator("dd"),
  ).toHaveText("Not assigned");
  await page.evaluate(() => {
    chrome.commands.getAll = (() =>
      Promise.reject(new Error("Read failed"))) as typeof chrome.commands.getAll;
    window.dispatchEvent(new Event("focus"));
  });
  await expect(page.getByText("Unable to read shortcuts", { exact: true })).toHaveCount(3);
  await page.getByRole("button", { name: "Configure shortcuts" }).click();
  await expect(async () => {
    const urls = await serviceWorker.evaluate(async () =>
      (await chrome.tabs.query({})).map(tab => tab.url),
    );
    expect(urls).toContain("chrome://extensions/shortcuts");
  }).toPass({ timeout: 5000 });
});
