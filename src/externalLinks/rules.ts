import { findUrlRule } from "@/src/tabs/urlRules";
import type { ExternalLinkRule, Settings } from "@/src/types";

type RuleGroups = {
  exclusions: ExternalLinkRule[];
  links: ExternalLinkRule[];
  pages: ExternalLinkRule[];
};
const groupedRules = new WeakMap<ExternalLinkRule[], RuleGroups>();

export const getExternalLinkAction = (
  pageUrl: string,
  linkUrl: string,
  settings: Settings["externalLinks"] | undefined,
) => {
  if (!settings?.enabled) {
    return null;
  }
  let page: URL;
  let link: URL;
  try {
    page = new URL(pageUrl);
    link = new URL(linkUrl);
  } catch {
    return null;
  }
  if (
    ![page.protocol, link.protocol].every(protocol => protocol === "http:" || protocol === "https:")
  ) {
    return null;
  }
  // 同一文書内のアンカー移動は、明示ルールでも妨げない。
  if (
    link.href.includes("#") &&
    page.origin === link.origin &&
    page.pathname === link.pathname &&
    page.search === link.search
  ) {
    return null;
  }

  let groups = groupedRules.get(settings.urlRules);
  if (!groups) {
    groups = {
      exclusions: settings.urlRules.filter(rule => rule.action === "exclude-page"),
      links: settings.urlRules.filter(rule => rule.action.endsWith("-link")),
      pages: settings.urlRules.filter(
        rule => rule.action.endsWith("-page") && rule.action !== "exclude-page",
      ),
    };
    groupedRules.set(settings.urlRules, groups);
  }
  if (findUrlRule(page.href, groups.exclusions)) {
    return null;
  }
  const rule = findUrlRule(link.href, groups.links) ?? findUrlRule(page.href, groups.pages);
  if (rule?.action.startsWith("current-")) {
    return "current";
  }
  if (rule?.action.startsWith("background-")) {
    return "background";
  }
  if (rule?.action.startsWith("new-")) {
    return "foreground";
  }
  return page.origin !== link.origin ? "new" : null;
};
