import { createServer } from "node:http";
import { expect, test } from "@/e2e/fixtures";
import {
  activatePage,
  setExtensionSettings,
  simulateServiceWorkerRestart,
} from "@/e2e/utils/helpers";
import { DEFAULT_SETTINGS, type ExternalLinkRule, type Settings } from "@/src/types";

let origin = "";
let destination = "";
const server = createServer((request, response) => {
  response.writeHead(200, { "content-type": "text/html" });
  response.end(`<title>Link test</title>
    <a id="external" href="${destination}/Destination?Token=ABC"><span>External</span></a>
    <a id="internal" href="/internal">Internal</a>
    <a id="blank" target="_blank" href="${destination}/blank">Blank</a>
    <a id="anchor" href="#section">Anchor</a>
    <a id="download" download="file.txt" href="/file.txt">Download</a>
    <a id="script" href="javascript:void(document.body.dataset.script='yes')">Script</a>
    <section id="section">Section</section>
    ${request.url === "/frames" ? `<iframe src="${destination}/frame"></iframe>` : ""}
    <script>document.addEventListener('click', e => {
      if (e.target.closest('#external')) { e.preventDefault(); window.open('${destination}/duplicate'); }
    });</script>`);
});
const targetServer = createServer((_request, response) => {
  response.writeHead(200, { "content-type": "text/html" });
  response.end(
    `<title>Destination</title><a id="frame-link" href="${origin}/from-frame">Frame link</a>`,
  );
});

test.beforeAll(async () => {
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  await new Promise<void>(resolve => targetServer.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const targetAddress = targetServer.address();
  if (
    !address ||
    typeof address === "string" ||
    !targetAddress ||
    typeof targetAddress === "string"
  ) {
    throw new Error("Missing server address");
  }
  origin = `http://127.0.0.1:${address.port}`;
  destination = `http://127.0.0.1:${targetAddress.port}`;
});
test.afterAll(async () => {
  await Promise.all(
    [server, targetServer].map(
      item =>
        new Promise<void>((resolve, reject) =>
          item.close(error => (error ? reject(error) : resolve())),
        ),
    ),
  );
});

for (const action of [
  "new-page",
  "background-page",
  "new-link",
  "background-link",
  "automatic",
] as const) {
  test(`${action} opens once at its final position with correct activation`, async ({
    context,
    serviceWorker,
  }) => {
    await setExtensionSettings(context, DEFAULT_SETTINGS);
    const page = await context.newPage();
    await page.goto(`${origin}/source`);
    const other = await context.newPage();
    await other.goto("about:blank");
    await activatePage(serviceWorker, page);
    const [source] = await serviceWorker.evaluate(url => chrome.tabs.query({ url }), page.url());
    const foreground = action.startsWith("new-");
    const rules: ExternalLinkRule[] =
      action === "automatic"
        ? []
        : [{ url: action.endsWith("-page") ? "/source" : "Destination", action }];
    await setExtensionSettings(context, {
      ...DEFAULT_SETTINGS,
      externalLinks: { enabled: true, urlRules: rules },
      newTab: {
        position: "last",
        openInBackground: false,
        urlRules: [
          {
            url: "Destination",
            position: "left",
            active: foreground || action === "automatic" ? "background" : "foreground",
          },
        ],
      },
    });
    if (action === "automatic") {
      await simulateServiceWorkerRestart(serviceWorker);
    }
    const created = context.waitForEvent("page");
    await page.locator("#external span").click();
    const newPage = await created;
    await expect(newPage).toHaveURL(`${destination}/Destination?Token=ABC`);
    await expect(async () => {
      const tabs = await serviceWorker.evaluate(
        id => chrome.tabs.query({ windowId: id }),
        source.windowId,
      );
      const target = tabs.find(tab => tab.url === newPage.url());
      expect(target?.active, JSON.stringify(tabs)).toBe(foreground);
      expect(target?.openerTabId).toBe(source.id);
      expect(target?.index).toBe(source.index);
      expect(tabs.filter(tab => tab.url?.startsWith(destination))).toHaveLength(1);
      expect(tabs.find(tab => tab.id === source.id)?.active).toBe(!foreground);
    }).toPass({ timeout: 5000 });
  });
}

for (const action of ["current-page", "current-link", "exclude-page", "disabled"] as const) {
  test(`${action} preserves current-tab navigation even with a conflicting page rule`, async ({
    context,
    serviceWorker,
  }) => {
    const ruleAction = action === "disabled" ? "new-page" : action;
    await setExtensionSettings(context, {
      ...DEFAULT_SETTINGS,
      externalLinks: {
        enabled: action !== "disabled",
        urlRules: [
          { url: ruleAction === "current-link" ? "/blank" : "/source", action: ruleAction },
          { url: "/source", action: "new-page" },
        ],
      },
    });
    const page = await context.newPage();
    await page.goto(`${origin}/source`);
    // target=_blankを持つリンクもcurrentルールでは現在のタブを使用する。
    if (action === "disabled" || action === "exclude-page") {
      await page.locator("#blank").evaluate(link => link.removeAttribute("target"));
    }
    const before = context.pages().length;
    await page.locator("#blank").click();
    await expect(page).toHaveURL(`${destination}/blank`);
    expect(context.pages()).toHaveLength(before);
    const tabs = await serviceWorker.evaluate(() => chrome.tabs.query({}));
    expect(tabs.filter(tab => tab.url === `${destination}/blank`)).toHaveLength(1);
  });
}

test("dynamic links and SPA URLs use live settings without reloading the page", async ({
  context,
  serviceWorker,
}) => {
  await setExtensionSettings(context, DEFAULT_SETTINGS);
  const page = await context.newPage();
  await page.goto(`${origin}/source`);
  await page.evaluate(url => {
    history.pushState({}, "", "/SPA?Case=UPPER");
    const anchor = document.createElement("a");
    anchor.id = "dynamic";
    anchor.href = url;
    anchor.textContent = "Dynamic";
    document.body.append(anchor);
  }, `${origin}/internal`);
  await setExtensionSettings(context, {
    ...DEFAULT_SETTINGS,
    externalLinks: {
      enabled: true,
      urlRules: [{ url: "SPA\\?Case=UPPER", action: "background-page" }],
    },
  });
  const created = context.waitForEvent("page");
  await page.locator("#dynamic").click();
  const newPage = await created;
  await expect(newPage).toHaveURL(`${origin}/internal`);
  await expect(page).toHaveURL(`${origin}/SPA?Case=UPPER`);
  await setExtensionSettings(context, DEFAULT_SETTINGS);
  await page.locator("#dynamic").click();
  await expect(page).toHaveURL(`${origin}/internal`);
  expect(
    (await serviceWorker.evaluate(() => chrome.tabs.query({}))).filter(
      tab => tab.url === `${origin}/internal`,
    ),
  ).toHaveLength(2);
});

test("modifier and middle clicks keep browser behavior; downloads and anchors remain native", async ({
  context,
  serviceWorker,
}) => {
  await setExtensionSettings(context, {
    ...DEFAULT_SETTINGS,
    externalLinks: { enabled: true, urlRules: [{ url: ".*", action: "current-page" }] },
  });
  const page = await context.newPage();
  await page.goto(`${origin}/source`);
  for (const options of [
    { modifiers: ["ControlOrMeta"] as "ControlOrMeta"[] },
    { button: "middle" as const },
  ]) {
    const created = context.waitForEvent("page");
    await page.locator("#internal").click(options);
    const newPage = await created;
    await expect(newPage).toHaveURL(`${origin}/internal`);
    await expect(page).toHaveURL(`${origin}/source`);
    await newPage.close();
  }
  await page.locator("#anchor").click();
  await expect(page).toHaveURL(`${origin}/source#section`);
  const download = page.waitForEvent("download");
  await page.locator("#download").click();
  expect((await download).suggestedFilename()).toBe("file.txt");
  await page.locator("#script").click();
  await expect(page.locator("body")).toHaveAttribute("data-script", "yes");
  expect(
    (await serviceWorker.evaluate(() => chrome.tabs.query({}))).filter(tab =>
      tab.url?.startsWith(destination),
    ),
  ).toHaveLength(0);
});

test("frame links use the frame origin and the containing tab as opener", async ({
  context,
  serviceWorker,
}) => {
  await setExtensionSettings(context, {
    ...DEFAULT_SETTINGS,
    externalLinks: { enabled: true, urlRules: [] },
  });
  const page = await context.newPage();
  await page.goto(`${origin}/frames`);
  const [source] = await serviceWorker.evaluate(url => chrome.tabs.query({ url }), page.url());
  const created = context.waitForEvent("page");
  await page.frameLocator("iframe").locator("#frame-link").click();
  const newPage = await created;
  await expect(newPage).toHaveURL(`${origin}/from-frame`);
  await expect
    .poll(
      async () =>
        (await serviceWorker.evaluate(url => chrome.tabs.query({ url }), newPage.url()))[0]
          ?.openerTabId,
    )
    .toBe(source.id);
});

for (const foreground of [true, false]) {
  test(`links from a pop-up preserve explicit activation in a normal window: ${foreground}`, async ({
    context,
    serviceWorker,
  }) => {
    await setExtensionSettings(context, {
      ...DEFAULT_SETTINGS,
      externalLinks: {
        enabled: true,
        urlRules: [{ url: "Destination", action: foreground ? "new-link" : "background-link" }],
      },
      newTab: { position: "last", openInBackground: foreground },
    });
    const popupEvent = context.waitForEvent("page");
    await serviceWorker.evaluate(
      url => chrome.windows.create({ type: "popup", url }),
      `${origin}/source`,
    );
    const popup = await popupEvent;
    await expect(popup).toHaveURL(`${origin}/source`);
    const created = context.waitForEvent("page");
    await popup.locator("#external").click();
    const newPage = await created;
    await expect(newPage).toHaveURL(`${destination}/Destination?Token=ABC`);
    await expect(async () => {
      const [tab] = await serviceWorker.evaluate(url => chrome.tabs.query({ url }), newPage.url());
      const window = await serviceWorker.evaluate(
        windowId => chrome.windows.get(windowId),
        tab.windowId,
      );
      expect(window.type).toBe("normal");
      expect(tab.active).toBe(foreground);
      expect(window.focused).toBe(foreground);
      const tabs = await serviceWorker.evaluate(
        windowId => chrome.tabs.query({ windowId }),
        tab.windowId,
      );
      expect(tab.index).toBe(tabs.length - 1);
    }).toPass({ timeout: 5000 });
  });
}

for (const loadingRule of [false, true]) {
  test(`activation and loading placement still apply (Loading Page: ${loadingRule})`, async ({
    context,
    serviceWorker,
  }) => {
    await setExtensionSettings(context, DEFAULT_SETTINGS);
    const page = await context.newPage();
    await page.goto(`${origin}/source`);
    await context.newPage();
    await activatePage(serviceWorker, page);
    await setExtensionSettings(context, {
      ...DEFAULT_SETTINGS,
      externalLinks: { enabled: true, urlRules: [{ url: "Destination", action: "new-link" }] },
      newTab: { position: "first", openInBackground: true },
      tabOnActivate: { behavior: "last" },
      loadingPage: { urlRules: loadingRule ? [{ url: "Destination", position: "first" }] : [] },
    });
    const created = context.waitForEvent("page");
    await page.locator("#external").click();
    const newPage = await created;
    await expect(newPage).toHaveURL(`${destination}/Destination?Token=ABC`);
    await expect(async () => {
      const [tab] = await serviceWorker.evaluate(url => chrome.tabs.query({ url }), newPage.url());
      const tabs = await serviceWorker.evaluate(
        windowId => chrome.tabs.query({ windowId }),
        tab.windowId,
      );
      expect(tab.active).toBe(true);
      expect(tab.index).toBe(loadingRule ? 0 : tabs.length - 1);
    }).toPass({ timeout: 5000 });
  });
}

test("same-origin links stay in the page; background tabs stay behind the pinned boundary", async ({
  context,
  serviceWorker,
}) => {
  await setExtensionSettings(context, DEFAULT_SETTINGS);
  const page = await context.newPage();
  await page.goto(`${origin}/source`);
  const [source] = await serviceWorker.evaluate(url => chrome.tabs.query({ url }), page.url());
  await serviceWorker.evaluate(id => chrome.tabs.update(id, { pinned: true }), source.id!);
  await setExtensionSettings(context, {
    ...DEFAULT_SETTINGS,
    externalLinks: { enabled: true, urlRules: [] },
    newTab: { position: "left", openInBackground: true },
  });
  const created = context.waitForEvent("page");
  await page.locator("#external").click();
  const newPage = await created;
  await expect(newPage).toHaveURL(`${destination}/Destination?Token=ABC`);
  await expect(async () => {
    const [tab] = await serviceWorker.evaluate(url => chrome.tabs.query({ url }), newPage.url());
    expect(tab.pinned).toBe(false);
    expect(tab.index).toBe(1);
    expect(tab.active).toBe(false);
  }).toPass({ timeout: 5000 });
  const count = context.pages().length;
  await page.locator("#internal").click();
  await expect(page).toHaveURL(`${origin}/internal`);
  expect(context.pages()).toHaveLength(count);
});

test("options validate, save and restore external link rules", async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  await setExtensionSettings(context, DEFAULT_SETTINGS);
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.getByRole("button", { name: "External Links", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Open external links in new tabs", exact: true })
    .check();
  await page.getByRole("button", { name: "Add rule", exact: true }).click();
  await page.getByRole("textbox", { name: "URL pattern 1", exact: true }).fill("[");
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Enter a valid URL pattern for each rule.");
  await page.getByRole("textbox", { name: "URL pattern 1", exact: true }).fill("example.test");
  await page
    .getByRole("combobox", { name: "Link action 1", exact: true })
    .selectOption("background-link");
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  await expect
    .poll(() =>
      serviceWorker.evaluate(
        async () =>
          (await chrome.storage.local.get<{ settings: Settings }>("settings")).settings
            .externalLinks,
      ),
    )
    .toEqual({ enabled: true, urlRules: [{ url: "example.test", action: "background-link" }] });
  await page.reload();
  await page.getByRole("button", { name: "External Links", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Open external links in new tabs", exact: true }),
  ).toBeChecked();
  await expect(page.getByRole("combobox", { name: "Link action 1", exact: true })).toHaveValue(
    "background-link",
  );
  await page.getByRole("button", { name: "Remove rule 1", exact: true }).click();
  await page.getByRole("button", { name: "Save Settings", exact: true }).click();
  await expect
    .poll(() =>
      serviceWorker.evaluate(
        async () =>
          (await chrome.storage.local.get<{ settings: Settings }>("settings")).settings
            .externalLinks.urlRules,
      ),
    )
    .toEqual([]);
});
