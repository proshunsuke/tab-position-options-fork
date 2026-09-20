import { expect, test } from "vitest";
import { getSortedTabs } from "@/src/commands/sort";

const tabs = ["pinned", "z", "a", "z", "a", "z", "a"].map((title, index) => ({
  id: index,
  index,
  title,
  url: `https://${title}.test`,
  pinned: index === 0,
  groupId: index === 3 || index === 4 ? 1 : -1,
}));

for (const key of ["title", "url"] as const) {
  test(`${key} sorting preserves pinned tabs, groups and ungrouped boundaries`, () => {
    expect(getSortedTabs(tabs.toReversed(), key).map(tab => tab.id)).toEqual([0, 2, 1, 4, 3, 6, 5]);
    expect(tabs.map(tab => tab.id)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
}

test("missing values go last and ties preserve original order", () => {
  const input = [undefined, "same", "same", "", "alpha"].map((title, index) => ({
    id: index,
    index,
    title,
    pinned: false,
    groupId: -1,
  }));
  expect(getSortedTabs(input, "title").map(tab => tab.id)).toEqual([4, 1, 2, 0, 3]);
  expect(getSortedTabs([], "title")).toEqual([]);
});
