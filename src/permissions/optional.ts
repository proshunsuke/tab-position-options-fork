export const externalLinkPermissionRequest = {
  permissions: ["scripting"],
  origins: ["http://*/*", "https://*/*"],
} satisfies chrome.permissions.Permissions;

export const tabsPermissionRequest = {
  permissions: ["tabs"],
} satisfies chrome.permissions.Permissions;

export const webNavigationPermissionRequest = {
  permissions: ["webNavigation"],
} satisfies chrome.permissions.Permissions;

export const hasPermissions = (permissions: chrome.permissions.Permissions) => {
  try {
    return chrome.permissions.contains(permissions).catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
};

export const requestPermissions = (permissions: chrome.permissions.Permissions) => {
  try {
    return chrome.permissions.request(permissions).catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
};
