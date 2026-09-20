import { expect, test } from "vitest";
import { getExternalLinkAction } from "@/src/externalLinks/rules";
import type { ExternalLinkRule } from "@/src/types";

const action = (page: string, link: string, urlRules: ExternalLinkRule[] = []) =>
  getExternalLinkAction(page, link, { enabled: true, urlRules });

test.each([
  ["https://example.test/a", "https://example.test/b", null],
  ["https://example.test/a", "https://example.test:443/b", null],
  ["https://example.test/a", "https://example.test.evil/b", "new"],
  ["https://example.test/a", "http://example.test/b", "new"],
  ["https://example.test/a", "https://example.test:444/b", "new"],
  ["https://example.test/a", "https://sub.example.test/b", "new"],
  ["https://example.test/a", "mailto:a@example.test", null],
  ["https://example.test/a", "javascript:void(0)", null],
  ["invalid", "https://example.test/", null],
])("compares exact origins: %s -> %s", (page, link, expected) => {
  expect(action(page, link)).toBe(expected);
});

test("disabled settings and same-document fragments never intercept", () => {
  expect(getExternalLinkAction("https://a.test", "https://b.test", undefined)).toBeNull();
  expect(
    getExternalLinkAction("https://a.test", "https://b.test", { enabled: false, urlRules: [] }),
  ).toBeNull();
  expect(
    action("https://a.test/path?q=1", "https://a.test/path?q=1#part", [
      { url: ".*", action: "new-page" },
    ]),
  ).toBeNull();
});

test("page exclusions win regardless of row order; link rules precede page rules", () => {
  const rules: ExternalLinkRule[] = [
    { url: "page.test", action: "current-page" },
    { url: "link.test", action: "background-link" },
    { url: "link.test", action: "new-link" },
  ];
  expect(action("https://page.test/", "https://link.test/", rules)).toBe("background");
  expect(action("https://page.test/", "https://other.test/", rules)).toBe("current");
  expect(
    action("https://page.test/", "https://link.test/", [
      ...rules,
      { url: "page.test", action: "exclude-page" },
    ]),
  ).toBeNull();
});

test("page and link matching stay separate and URL case is preserved", () => {
  expect(
    action("https://page.test/UPPER?Token=X", "https://link.test/", [
      { url: "UPPER\\?Token=X", action: "new-page" },
    ]),
  ).toBe("foreground");
  expect(
    action("https://page.test/", "https://link.test/", [
      { url: "page.test", action: "current-link" },
    ]),
  ).toBe("new");
  expect(
    action("https://page.test/", "https://link.test/", [
      { url: "link.test", action: "current-page" },
    ]),
  ).toBe("new");
  expect(
    action("https://page.test/", "https://link.test/", [
      { url: "page.test", action: "background-page" },
    ]),
  ).toBe("background");
  expect(
    action("https://page.test/", "https://link.test/", [
      { url: "link.test", action: "current-link" },
    ]),
  ).toBe("current");
});
