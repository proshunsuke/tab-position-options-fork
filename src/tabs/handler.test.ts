import { beforeEach, expect, test, vi } from "vitest";
import { setupTabHandlers } from "@/src/tabs/handler";

const createEvent = () => ({ addListener: vi.fn() });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("chrome", {
    windows: {
      onCreated: createEvent(),
      onFocusChanged: createEvent(),
      onRemoved: createEvent(),
    },
    tabs: {
      onDetached: createEvent(),
      onAttached: createEvent(),
      onCreated: createEvent(),
      onActivated: createEvent(),
      onRemoved: createEvent(),
      onMoved: createEvent(),
      onUpdated: createEvent(),
    },
    permissions: { onAdded: createEvent() },
    runtime: { onStartup: createEvent() },
  });
});

test("registers webNavigation listeners when that optional permission is added", () => {
  const webNavigation = {
    onCreatedNavigationTarget: { addListener: vi.fn(), hasListener: vi.fn(() => false) },
    onBeforeNavigate: { addListener: vi.fn(), hasListener: vi.fn(() => false) },
    onCommitted: { addListener: vi.fn(), hasListener: vi.fn(() => false) },
    onErrorOccurred: { addListener: vi.fn(), hasListener: vi.fn(() => false) },
  };

  setupTabHandlers();
  expect(webNavigation.onCreatedNavigationTarget.addListener).not.toHaveBeenCalled();

  const onAdded = vi.mocked(chrome.permissions.onAdded.addListener).mock.calls[0][0];
  onAdded({ permissions: ["tabs"] });
  expect(webNavigation.onCreatedNavigationTarget.addListener).not.toHaveBeenCalled();

  vi.stubGlobal("chrome", { ...chrome, webNavigation });
  onAdded({ permissions: ["webNavigation"] });

  expect(webNavigation.onCreatedNavigationTarget.addListener).toHaveBeenCalledOnce();
  expect(webNavigation.onBeforeNavigate.addListener).toHaveBeenCalledOnce();
  expect(webNavigation.onCommitted.addListener).toHaveBeenCalledOnce();
  expect(webNavigation.onErrorOccurred.addListener).toHaveBeenCalledOnce();
});
