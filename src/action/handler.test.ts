import { beforeEach, expect, test, vi } from "vitest";
import { setupActionHandlers } from "@/src/action/handler";

let click: () => Promise<void>;
let installed: (details: { reason: string }) => Promise<void> | undefined;

beforeEach(() => {
  vi.stubGlobal("chrome", {
    action: {
      onClicked: {
        addListener: (listener: typeof click) => {
          click = listener;
        },
      },
    },
    runtime: {
      onInstalled: {
        addListener: (listener: typeof installed) => {
          installed = listener;
        },
      },
      openOptionsPage: vi.fn(async () => {}),
      getURL: (path: string) => `chrome-extension://test/${path}`,
    },
    tabs: { query: vi.fn(async () => []), update: vi.fn(async () => ({})) },
    windows: { update: vi.fn(async () => ({})) },
  });
  setupActionHandlers();
});

test("opens a settings page when none exists", async () => {
  await click();
  expect(chrome.runtime.openOptionsPage).toHaveBeenCalledTimes(1);
});

test("opens options on first installation", async () => {
  await installed({ reason: "install" });
  expect(chrome.runtime.openOptionsPage).toHaveBeenCalledTimes(1);
});

for (const reason of ["update", "chrome_update", "shared_module_update"]) {
  test(`does not open options on ${reason}`, () => {
    installed({ reason });
    expect(chrome.runtime.openOptionsPage).not.toHaveBeenCalled();
  });
}

test("handles failure without an unhandled rejection", async () => {
  const error = new Error("unavailable");
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    vi.mocked(chrome.runtime.openOptionsPage).mockRejectedValueOnce(error);
    await click();
    expect(log).toHaveBeenCalledWith("Failed to open options page:", error);
  } finally {
    log.mockRestore();
  }
});

test("reuses settings in another window and coalesces simultaneous clicks", async () => {
  vi.mocked(chrome.tabs.query).mockImplementation(async () => [
    { id: 10, windowId: 5 } as chrome.tabs.Tab,
  ]);
  await Promise.all([click(), click()]);
  expect(chrome.tabs.query).toHaveBeenCalledExactlyOnceWith({
    url: "chrome-extension://test/options.html",
  });
  expect(chrome.tabs.update).toHaveBeenCalledExactlyOnceWith(10, { active: true });
  expect(chrome.windows.update).toHaveBeenCalledExactlyOnceWith(5, { focused: true });
  expect(chrome.runtime.openOptionsPage).not.toHaveBeenCalled();
});
