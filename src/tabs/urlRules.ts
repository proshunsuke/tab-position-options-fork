type UrlRule = { url: string };
const compiledRuleCache = new WeakMap<UrlRule[], { index: number; regex: RegExp }[]>();

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

export const findUrlRule = <T extends UrlRule>(url: string, rules: T[] | undefined) => {
  if (!url || !rules?.length) {
    return undefined;
  }
  // 設定が変わった時だけ正規表現を生成し、通常の作成イベントではメモリ内で照合する。
  let compiledRules = compiledRuleCache.get(rules);
  if (!compiledRules) {
    compiledRules = rules.flatMap((rule, index) =>
      isValidUrlPattern(rule.url) ? [{ index, regex: new RegExp(rule.url) }] : [],
    );
    compiledRuleCache.set(rules, compiledRules);
  }
  const match = compiledRules.find(({ index, regex }) => {
    const rule = rules[index];
    if (regex.test(url)) {
      return true;
    }
    if (/^https?:\/\/.+$/.test(rule.url)) {
      return url.startsWith(rule.url);
    }
    const domain = url.split("/")[2];
    return domain !== undefined && (domain.startsWith(rule.url) || regex.test(domain));
  });
  return match ? rules[match.index] : undefined;
};
