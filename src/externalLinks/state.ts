type PendingLinkTab = {
  windowId: number | null;
  openerTabId: number | undefined;
  url: string;
  tabId?: number;
  consumed: boolean;
};
const pendingTabs = new Set<PendingLinkTab>();

export const recordExternalLinkTab = (
  windowId: number | null,
  openerTabId: number | undefined,
  url: string,
) => {
  const pending: PendingLinkTab = { windowId, openerTabId, url, consumed: false };
  pendingTabs.add(pending);
  return pending;
};

export const removeExternalLinkTab = (pending: PendingLinkTab) => {
  pendingTabs.delete(pending);
};

export const consumeExternalLinkTab = (tab: chrome.tabs.Tab) => {
  const pending = [...pendingTabs].find(item =>
    item.tabId !== undefined
      ? item.tabId === tab.id
      : (item.windowId === null || item.windowId === tab.windowId) &&
        // ChromeはonCreatedの後でopenerTabIdを付ける場合がある。
        (item.openerTabId === undefined ||
          tab.openerTabId === undefined ||
          item.openerTabId === tab.openerTabId) &&
        item.url === (tab.pendingUrl || tab.url),
  );
  if (!pending) {
    return false;
  }
  pending.consumed = true;
  pendingTabs.delete(pending);
  return true;
};
