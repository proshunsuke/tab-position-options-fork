import { expect, test } from "vitest";
import { findUrlRule, isValidUrlPattern } from "@/src/tabs/urlRules";

for (const [pattern, valid] of [
  ["", false],
  ["   ", false],
  ["[", false],
  ["example.com", true],
  ["^https://.*$", true],
] as const) {
  test(`validates URL pattern ${JSON.stringify(pattern)}`, () => {
    expect(isValidUrlPattern(pattern)).toBe(valid);
  });
}

for (const [pattern, url, matches] of [
  ["^about:blank#tar.*$", "about:blank#target", true],
  ["^https://source.test", "about:blank#target", false],
  ["[", "about:blank#target", false],
  ["https://rules.test/a$", "https://rules.test/a$more", true],
  ["^rules\\.test$", "https://rules.test/path", true],
  ["rules.test$", "https://rules.test$more/path", true],
  ["^rules\\.test$", "https://other.test/path", false],
  [".*", "", false],
  [" ", "https://rules.test/", false],
] as const) {
  test(`matches ${JSON.stringify(pattern)} against ${JSON.stringify(url)}`, () => {
    const rule = { url: pattern, position: "last" };
    expect(findUrlRule(url, [rule])).toBe(matches ? rule : undefined);
  });
}

test("the first matching rule wins and invalid rules are skipped", () => {
  const rules = [{ url: "[" }, { url: "about:" }, { url: "^about:blank#target$" }];
  expect(findUrlRule("about:blank#target", rules)).toBe(rules[1]);
});

test("missing rules leave the global setting in control", () => {
  expect(findUrlRule("https://rules.test/", undefined)).toBeUndefined();
  expect(findUrlRule("https://rules.test/", [])).toBeUndefined();
});

test("cached rules can be reused and replaced settings take effect immediately", () => {
  const original = [{ url: "^https://old.test/" }];
  const replacement = [{ url: "^https://new.test/" }];
  expect(findUrlRule("https://old.test/", original)).toBe(original[0]);
  expect(findUrlRule("https://old.test/", original)).toBe(original[0]);
  expect(findUrlRule("https://old.test/", replacement)).toBeUndefined();
  expect(findUrlRule("https://new.test/", replacement)).toBe(replacement[0]);
});
