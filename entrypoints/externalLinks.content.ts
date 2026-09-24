import { getExternalLinkAction } from "@/src/externalLinks/rules";
import { DEFAULT_SETTINGS, type Settings } from "@/src/types";

export default defineContentScript({
  registration: "runtime",
  matches: ["http://*/*", "https://*/*"],
  allFrames: true,
  runAt: "document_start",
  main(ctx) {
    const contentScriptState = globalThis as Record<string, unknown>;
    if (contentScriptState.__tabPositionOptionsExternalLinksInitialized) {
      return;
    }
    contentScriptState.__tabPositionOptionsExternalLinksInitialized = true;

    let settings = DEFAULT_SETTINGS.externalLinks;
    let changed = false;
    const settingsChangedEvent = chrome.storage.onChanged;
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== "local" || !changes.settings) {
        return;
      }
      changed = true;
      settings =
        (changes.settings.newValue as Settings | undefined)?.externalLinks ??
        DEFAULT_SETTINGS.externalLinks;
    };
    settingsChangedEvent.addListener(onChanged);
    ctx.onInvalidated(() => {
      try {
        settingsChangedEvent.removeListener(onChanged);
      } catch {
        // Chrome may invalidate the global API namespace before WXT runs cleanup.
      }
    });
    void chrome.storage.local
      .get<{ settings?: Settings }>("settings")
      .then(result => {
        if (!changed) {
          settings = result.settings?.externalLinks ?? DEFAULT_SETTINGS.externalLinks;
        }
      })
      .catch(() => {});

    ctx.addEventListener(
      window,
      "click",
      event => {
        if (
          !settings.enabled ||
          !event.isTrusted ||
          event.defaultPrevented ||
          event.button !== 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        const link = event.composedPath().find(node => node instanceof HTMLAnchorElement);
        if (
          !(link instanceof HTMLAnchorElement) ||
          !link.hasAttribute("href") ||
          link.hasAttribute("download")
        ) {
          return;
        }
        const pageUrl = location.href;
        const url = link.href;
        const action = getExternalLinkAction(pageUrl, url, settings);
        if (action === null) {
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        if (action === "current") {
          location.assign(url);
          return;
        }
        // クリック時にはストレージを読まず、直ちにWorkerへ作成を依頼する。
        void chrome.runtime
          .sendMessage({ type: "external-link", pageUrl, url })
          .then(handled => {
            // 設定変更の競合やAPI失敗でも、クリックしたリンク自体を失わない。
            if (handled === false) {
              location.assign(url);
            }
          })
          .catch(error => console.error("Could not open external link:", error));
      },
      { capture: true },
    );
  },
});
