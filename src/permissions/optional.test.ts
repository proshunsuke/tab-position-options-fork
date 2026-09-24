import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { requestPermissions, tabsPermissionRequest } from "@/src/permissions/optional";

const permissionsRequest = vi.fn(async () => true);

beforeEach(() => {
  permissionsRequest.mockReset().mockResolvedValue(true);
  vi.stubGlobal("chrome", {
    permissions: { request: permissionsRequest },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("requests the specified optional permission and returns Chrome's result", async () => {
  permissionsRequest.mockResolvedValueOnce(false);

  await expect(requestPermissions(tabsPermissionRequest)).resolves.toBe(false);
  expect(permissionsRequest).toHaveBeenCalledWith(tabsPermissionRequest);
});

test("treats a rejected permission request as denied", async () => {
  permissionsRequest.mockRejectedValueOnce(new Error("Request failed"));

  await expect(requestPermissions(tabsPermissionRequest)).resolves.toBe(false);
});
