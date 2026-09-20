import { expect, test } from "vitest";
import de from "@/locales/de.json";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import fr from "@/locales/fr.json";
import ja from "@/locales/ja.json";
import ko from "@/locales/ko.json";
import ptBr from "@/locales/pt_BR.json";
import ru from "@/locales/ru.json";
import zhCn from "@/locales/zh_CN.json";
import zhTw from "@/locales/zh_TW.json";

for (const [locale, messages] of Object.entries({
  de,
  en,
  es,
  fr,
  ja,
  ko,
  pt_BR: ptBr,
  ru,
  zh_CN: zhCn,
  zh_TW: zhTw,
})) {
  test(`${locale} provides every message and preserves substitutions`, () => {
    expect(Object.keys(messages).sort()).toEqual(Object.keys(en).sort());
    expect(messages.extensionDescription.length).toBeLessThanOrEqual(132);
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(messages[key].trim(), key).not.toBe("");
      expect(messages[key].match(/\$\d+/g) ?? [], key).toEqual(en[key].match(/\$\d+/g) ?? []);
    }
  });
}
