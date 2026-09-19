import { expect, test } from "vitest";
import { createSessionRestoreDetector } from "@/src/tabs/sessionRestoreDetector";

test("rapid tab creation is restoration until the creation interval reaches the threshold", () => {
  let now = 1000;
  const detector = createSessionRestoreDetector({ timeProvider: () => now, thresholdMs: 100 });
  expect(detector.isSessionRestoreTab()).toBe(false);
  detector.handleBrowserStartup();
  for (const time of [1000, 1050, 1100]) {
    now = time;
    expect(detector.isSessionRestoreTab()).toBe(true);
  }
  now = 1200;
  expect(detector.isSessionRestoreTab()).toBe(false);
  now = 1201;
  expect(detector.isSessionRestoreTab()).toBe(false);
});

test("activation checks do not prolong session restoration", () => {
  let now = 1000;
  const detector = createSessionRestoreDetector({ timeProvider: () => now });
  detector.handleBrowserStartup();
  expect(detector.isSessionRestoreInProgress()).toBe(true);
  expect(detector.isSessionRestoreTab()).toBe(true);
  now = 1100;
  expect(detector.isSessionRestoreInProgress()).toBe(true);
  now = 1199;
  expect(detector.isSessionRestoreInProgress()).toBe(true);
  now = 1200;
  expect(detector.isSessionRestoreInProgress()).toBe(false);
});

test("startup expires without any created tabs and new creations extend restoration", () => {
  let now = 1000;
  const detector = createSessionRestoreDetector({ timeProvider: () => now });
  detector.handleBrowserStartup();
  now = 1200;
  expect(detector.isSessionRestoreInProgress()).toBe(false);
  detector.handleBrowserStartup();
  now = 1300;
  expect(detector.isSessionRestoreTab()).toBe(true);
  now = 1499;
  expect(detector.isSessionRestoreInProgress()).toBe(true);
  now = 1500;
  expect(detector.isSessionRestoreInProgress()).toBe(false);
});

test("extension initialization ends restoration and browser startup starts it again", () => {
  const detector = createSessionRestoreDetector({ timeProvider: () => 1000 });
  detector.handleBrowserStartup();
  detector.initSessionRestoreDetector();
  expect(detector.isSessionRestoreInProgress()).toBe(false);
  expect(detector.isSessionRestoreTab()).toBe(false);
  detector.handleBrowserStartup();
  expect(detector.isSessionRestoreInProgress()).toBe(true);
  expect(detector.isSessionRestoreTab()).toBe(true);
});
