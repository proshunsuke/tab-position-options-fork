import { beforeEach, expect, test, vi } from "vitest";
import {
  clearSessionRestoreTab,
  consumeSessionRestoreActivation,
  initializeSessionRestoreState,
  isSessionRestoreTab,
  isSessionRestoreWindow,
  markSessionRestoreTabs,
  recordNewSessionTab,
  resetSessionRestoreState,
} from "@/src/tabs/sessionRestoreDetector";

const tabs = [
  { id: 1, windowId: 10, active: false },
  { id: 2, windowId: 10, active: true },
  { id: 3, windowId: 20, active: true },
];
let storage: Record<string, unknown>;

beforeEach(() => {
  storage = {};
  vi.stubGlobal("chrome", {
    storage: {
      session: {
        get: async () => structuredClone(storage),
        set: async (value: Record<string, unknown>) => {
          Object.assign(storage, structuredClone(value));
        },
      },
    },
  });
  resetSessionRestoreState();
});

test("restored tab identities do not expire and unrelated new tabs are immediately eligible", async () => {
  expect(await initializeSessionRestoreState()).toBe(true);
  markSessionRestoreTabs(tabs);
  const now = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
  try {
    expect(isSessionRestoreTab(1)).toBe(true);
    expect(isSessionRestoreTab(2)).toBe(true);
    expect(isSessionRestoreTab(4)).toBe(false);
    expect(isSessionRestoreWindow(20)).toBe(true);
    expect(isSessionRestoreWindow(30)).toBe(false);
  } finally {
    now.mockRestore();
  }
});

test("startup selection is consumed once per window without suppressing subsequent user activation", () => {
  markSessionRestoreTabs(tabs);
  expect(consumeSessionRestoreActivation(10, 2)).toBe(true);
  expect(consumeSessionRestoreActivation(10, 2)).toBe(false);
  expect(consumeSessionRestoreActivation(20, 3)).toBe(true);
  markSessionRestoreTabs(tabs);
  expect(consumeSessionRestoreActivation(10, 2)).toBe(false);
});

test("a different user selection clears a pending startup selection", () => {
  markSessionRestoreTabs(tabs);
  expect(consumeSessionRestoreActivation(10, 1)).toBe(false);
  expect(consumeSessionRestoreActivation(10, 2)).toBe(false);
});

test("worker restart retains restored identities and consumed selections", async () => {
  markSessionRestoreTabs(tabs);
  consumeSessionRestoreActivation(10, 2);
  await vi.waitFor(() =>
    expect(storage.sessionRestoreState).toEqual({
      tabs: { 1: 10, 2: 10, 3: 20 },
      activations: { 20: 3 },
    }),
  );
  resetSessionRestoreState();
  expect(await initializeSessionRestoreState()).toBe(false);
  expect(isSessionRestoreTab(1)).toBe(true);
  expect(isSessionRestoreTab(4)).toBe(false);
  expect(consumeSessionRestoreActivation(10, 2)).toBe(false);
  expect(consumeSessionRestoreActivation(20, 3)).toBe(true);
});

test("late startup snapshots do not suppress already observed normal tabs", () => {
  recordNewSessionTab(2);
  markSessionRestoreTabs(tabs);
  expect(isSessionRestoreTab(2)).toBe(false);
  expect(consumeSessionRestoreActivation(10, 2)).toBe(false);
});

test("closing restored tabs cleans up their window and pending selection", () => {
  markSessionRestoreTabs(tabs);
  clearSessionRestoreTab(3);
  expect(isSessionRestoreTab(3)).toBe(false);
  expect(isSessionRestoreWindow(20)).toBe(false);
  expect(consumeSessionRestoreActivation(20, 3)).toBe(false);
  expect(isSessionRestoreTab(1)).toBe(true);
});

test("an empty initialized session is distinct from browser startup", async () => {
  markSessionRestoreTabs([]);
  await vi.waitFor(() => expect(storage.sessionRestoreState).toBeDefined());
  resetSessionRestoreState();
  expect(await initializeSessionRestoreState()).toBe(false);
  expect(isSessionRestoreTab(1)).toBe(false);
});
