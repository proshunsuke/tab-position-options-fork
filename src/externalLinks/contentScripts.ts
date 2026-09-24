import {
  resolveExternalLinkPermissionState,
  updateExternalLinkPermissionState,
} from "@/src/externalLinks/permissionState";
import { hasPermissions } from "@/src/permissions/optional";
import { getSettings } from "@/src/settings/state/appData";
import { initializeAllStates } from "@/src/state/initializer";

const contentScriptId = "tab-position-options-external-links";
const contentScript = {
  id: contentScriptId,
  matches: ["http://*/*", "https://*/*"],
  js: ["content-scripts/externalLinks.js"],
  allFrames: true,
  runAt: "document_start",
  persistAcrossSessions: true,
} satisfies chrome.scripting.RegisteredContentScript;

let requested = false;
let running = false;

export const setupExternalLinkContentScripts = () => {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.settings) {
      scheduleReconcile();
    }
  });
  chrome.permissions.onAdded.addListener(permissions => {
    if (hasExternalLinksPermissionChange(permissions)) {
      updateExternalLinkPermissionState(undefined);
      scheduleReconcile();
    }
  });
  chrome.permissions.onRemoved.addListener(permissions => {
    if (hasExternalLinksPermissionChange(permissions)) {
      updateExternalLinkPermissionState(false);
      scheduleReconcile();
    }
  });

  void initializeAllStates().then(scheduleReconcile);
};

const scheduleReconcile = () => {
  requested = true;
  if (!running) {
    void reconcile();
  }
};

const reconcile = async () => {
  running = true;
  try {
    while (requested) {
      requested = false;
      await reconcileOnce();
    }
  } finally {
    running = false;
    if (requested) {
      scheduleReconcile();
    }
  }
};

const reconcileOnce = async () => {
  const hasPermission = await resolveExternalLinkPermissionState();
  const enabled = getSettings().externalLinks?.enabled === true;
  if (!hasPermission || !enabled) {
    if (await hasPermissions({ permissions: ["scripting"] })) {
      await chrome.scripting.unregisterContentScripts({ ids: [contentScriptId] }).catch(() => {});
    }
    return;
  }

  const registered = await chrome.scripting
    .getRegisteredContentScripts({ ids: [contentScriptId] })
    .catch(() => []);
  try {
    if (registered.length === 0) {
      await chrome.scripting.registerContentScripts([contentScript]);
    } else {
      await chrome.scripting.updateContentScripts([contentScript]);
    }
  } catch (error) {
    console.error("Could not register the External Links content script:", error);
    return;
  }

  // 動的登録は既存ページには適用されないため、許可後に開いている HTTP(S) ページにも注入する。
  const tabs = await chrome.tabs.query({}).catch(() => []);
  await Promise.all(
    tabs
      .filter(tab => tab.id !== undefined && isHttpUrl(tab.url))
      .map(tab =>
        chrome.scripting
          .executeScript({
            target: { tabId: tab.id!, allFrames: true },
            files: contentScript.js,
          })
          .catch(() => []),
      ),
  );
};

const isHttpUrl = (value: string | undefined) => value !== undefined && /^https?:\/\//i.test(value);

const hasExternalLinksPermissionChange = (permissions: chrome.permissions.Permissions) =>
  permissions.permissions?.includes("scripting") === true || (permissions.origins?.length ?? 0) > 0;
