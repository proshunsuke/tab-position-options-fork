import { expect, test } from "vitest";
import { calculateNewTabIndex } from "@/src/tabs/position";
import type { TabSnapshot } from "@/src/tabs/state/tabSnapshot";

const tabs: TabSnapshot[] = [
  { id: 10, index: 0, active: false, pinned: true },
  { id: 20, index: 1, active: true, pinned: false },
  { id: 30, index: 2, active: false, pinned: false },
];

for (const [position, currentTabId, expected] of [
  ["first", 20, 0],
  ["left", 20, 1],
  ["right", 20, 2],
  ["left", 10, 0],
  ["right", 30, 3],
  ["left", 99, undefined],
  ["right", 99, undefined],
  ["default", 20, undefined],
  ["last", 20, undefined],
] as const) {
  test(`${position} uses source tab ${currentTabId}`, () => {
    expect(calculateNewTabIndex(position, tabs, currentTabId)).toBe(expected);
  });
}

test("relative positions use the snapshot index rather than array order", () => {
  const reversed = tabs.toReversed();
  expect(calculateNewTabIndex("left", reversed, 10)).toBe(0);
  expect(calculateNewTabIndex("right", reversed, 30)).toBe(3);
  expect(reversed.map(tab => tab.id)).toEqual([30, 20, 10]);
});

test("an empty snapshot cannot resolve a relative position", () => {
  expect(calculateNewTabIndex("left", [], 20)).toBeUndefined();
  expect(calculateNewTabIndex("right", [], 20)).toBeUndefined();
});
