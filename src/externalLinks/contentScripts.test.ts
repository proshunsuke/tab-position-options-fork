import { afterEach, expect, test, vi } from "vitest";
import { setupExternalLinkContentScripts } from "@/src/externalLinks/contentScripts";
import { updateExternalLinkPermissionState } from "@/src/externalLinks/permissionState";

const state = vi.hoisted(() => ({
  externalAccess: false,
  scriptingPermission: false,
  settings: { externalLinks: { enabled: true } },
  initializeAllStates: vi.fn(async () => {}),
  hasPermissions: vi.fn(async (_permissions: chrome.permissions.Permissions) => false),
}));

vi.mock("@/src/settings/state/appData", () => ({ getSettings: () => state.settings }));
vi.mock("@/src/state/initializer", () => ({ initializeAllStates: state.initializeAllStates }));
vi.mock("@/src/permissions/optional", () => ({
  externalLinkPermissionRequest: {
    permissions: ["scripting"],
    origins: ["http://*/*", "https://*/*"],
  },
  hasPermissions: state.hasPermissions,
}));

const createEvent = <T extends (...args: never[]) => void>() => {
  const listeners = new Set<T>();
  return {
    addListener: vi.fn((listener: T) => {
      listeners.add(listener);
    }),
    removeListener: vi.fn((listener: T) => {
      listeners.delete(listener);
    }),
    emit: (...args: Parameters<T>) => {
      for (const listener of listeners) {
        listener(...args);
      }
    },
  };
};

const externalLinkPermissions = {
  permissions: ["scripting"],
  origins: ["http://*/*", "https://*/*"],
} satisfies chrome.permissions.Permissions;

test("granting External Links access injects the script into existing HTTP(S) tabs", async () => {
  state.externalAccess = false;
  state.scriptingPermission = false;
  state.settings.externalLinks.enabled = true;
  state.hasPermissions.mockImplementation(async permissions => {
    return permissions.origins?.length
      ? state.externalAccess
      : permissions.permissions?.includes("scripting") === true && state.scriptingPermission;
  });
  updateExternalLinkPermissionState(undefined);

  const storageChanged =
    createEvent<(changes: Record<string, chrome.storage.StorageChange>, area: string) => void>();
  const permissionsAdded = createEvent<(permissions: chrome.permissions.Permissions) => void>();
  const permissionsRemoved = createEvent<(permissions: chrome.permissions.Permissions) => void>();
  const registeredContentScripts = vi.fn(async () => []);
  const registerContentScripts = vi.fn(
    async (_scripts: chrome.scripting.RegisteredContentScript[]) => {},
  );
  const unregisterContentScripts = vi.fn(
    async (_filter: chrome.scripting.ContentScriptFilter) => {},
  );
  const executeScript = vi.fn(async () => []);
  const tabsQuery = vi.fn(async () => [
    { id: 11, url: "https://already-open.test/" },
    { id: 12, url: "http://already-open.test/" },
    { id: 13, url: "chrome-extension://extension/options.html" },
    { id: 14, url: "about:blank" },
    { url: "https://missing-id.test/" },
  ]);

  vi.stubGlobal("chrome", {
    storage: { onChanged: storageChanged },
    permissions: { onAdded: permissionsAdded, onRemoved: permissionsRemoved },
    scripting: {
      getRegisteredContentScripts: registeredContentScripts,
      registerContentScripts,
      unregisterContentScripts,
      updateContentScripts: vi.fn(
        async (_scripts: chrome.scripting.RegisteredContentScript[]) => {},
      ),
      executeScript,
    },
    tabs: { query: tabsQuery },
  });

  setupExternalLinkContentScripts();

  await vi.waitFor(() =>
    expect(state.hasPermissions).toHaveBeenCalledWith(externalLinkPermissions),
  );
  await vi.waitFor(() => expect(state.hasPermissions).toHaveBeenCalledTimes(2));
  expect(registerContentScripts).not.toHaveBeenCalled();
  expect(tabsQuery).not.toHaveBeenCalled();

  state.externalAccess = true;
  state.scriptingPermission = true;
  permissionsAdded.emit(externalLinkPermissions);

  await vi.waitFor(() => expect(registerContentScripts).toHaveBeenCalledOnce());
  await vi.waitFor(() => expect(executeScript).toHaveBeenCalledTimes(2));
  expect(registeredContentScripts).toHaveBeenCalledWith({
    ids: ["tab-position-options-external-links"],
  });
  expect(registerContentScripts).toHaveBeenCalledWith([
    expect.objectContaining({
      matches: ["http://*/*", "https://*/*"],
      js: ["content-scripts/externalLinks.js"],
      allFrames: true,
    }),
  ]);
  expect(tabsQuery).toHaveBeenCalledWith({});
  expect(executeScript).toHaveBeenNthCalledWith(1, {
    target: { tabId: 11, allFrames: true },
    files: ["content-scripts/externalLinks.js"],
  });
  expect(executeScript).toHaveBeenNthCalledWith(2, {
    target: { tabId: 12, allFrames: true },
    files: ["content-scripts/externalLinks.js"],
  });

  state.externalAccess = false;
  permissionsRemoved.emit({ origins: externalLinkPermissions.origins });
  await vi.waitFor(() =>
    expect(unregisterContentScripts).toHaveBeenCalledWith({
      ids: ["tab-position-options-external-links"],
    }),
  );
  expect(executeScript).toHaveBeenCalledTimes(2);
});

afterEach(() => {
  vi.unstubAllGlobals();
});
