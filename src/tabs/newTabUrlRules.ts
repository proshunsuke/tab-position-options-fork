import type { NewTabUrlRule } from "@/src/types";

let cachedRules: NewTabUrlRule[] | undefined;
let compiledRules: { rule: NewTabUrlRule; regex: RegExp }[] = [];

export const isValidUrlPattern = (pattern: string) => {
  if (!pattern.trim()) {
    return false;
  }
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
};

export const findNewTabUrlRule = (url: string, rules: NewTabUrlRule[] | undefined) => {
  // 設定が変わった時だけ正規表現を生成し、通常の作成イベントではメモリ内で照合する。
  if (cachedRules !== rules) {
    cachedRules = rules;
    compiledRules = (rules ?? [])
      .filter(rule => isValidUrlPattern(rule.url))
      .map(rule => ({ rule, regex: new RegExp(rule.url) }));
  }
  if (!url) {
    return undefined;
  }
  return compiledRules.find(({ rule, regex }) => {
    if (regex.test(url)) {
      return true;
    }
    if (/^https?:\/\/.+$/.test(rule.url)) {
      return url.startsWith(rule.url);
    }
    const domain = url.split("/")[2];
    return domain !== undefined && (domain.startsWith(rule.url) || regex.test(domain));
  })?.rule;
};
