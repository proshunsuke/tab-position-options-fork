import type { FC } from "react";
import { i18n } from "#i18n";
import { TabSection } from "@/entrypoints/options/ui/TabSection";
import type { LoadingPageUrlRule } from "@/src/types";

type Props = {
  rules: LoadingPageUrlRule[];
  onRulesChange: (rules: LoadingPageUrlRule[]) => void;
};

export const LoadingPage: FC<Props> = ({ rules, onRulesChange }) => (
  <TabSection title={i18n.t("loadingPage")} description={i18n.t("loadingPageDescription")}>
    <div className="space-y-3">
      {rules.map((rule, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: Controlled rows have no independent state or persisted identity.
          key={index}
          className="flex flex-wrap items-center gap-3 rounded-md bg-gray-50 p-3"
        >
          <input
            aria-label={i18n.t("loadingUrlPatternLabel", [String(index + 1)])}
            placeholder={i18n.t("urlPattern")}
            value={rule.url}
            onChange={event =>
              onRulesChange(
                rules.map((item, i) => (i === index ? { ...item, url: event.target.value } : item)),
              )
            }
            className="min-w-48 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2"
          />
          <select
            aria-label={i18n.t("loadingPositionLabel", [String(index + 1)])}
            value={rule.position}
            onChange={event =>
              onRulesChange(
                rules.map((item, i) =>
                  i === index
                    ? { ...item, position: event.target.value as LoadingPageUrlRule["position"] }
                    : item,
                ),
              )
            }
            className="rounded-md border border-gray-300 bg-white px-3 py-2"
          >
            <option value="last">{i18n.t("positionLast")}</option>
            <option value="middle">{i18n.t("positionMiddle")}</option>
            <option value="first">{i18n.t("positionFirst")}</option>
          </select>
          <button
            type="button"
            aria-label={i18n.t("removeLoadingRuleLabel", [String(index + 1)])}
            onClick={() => onRulesChange(rules.filter((_, i) => i !== index))}
            className="text-red-600 hover:text-red-800"
          >
            {i18n.t("remove")}
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onRulesChange([...rules, { url: "", position: "last" }])}
        className="rounded-md bg-chrome-blue px-4 py-2 text-white hover:bg-chrome-blue/90"
      >
        {i18n.t("addLoadingRule")}
      </button>
      <p className="text-sm text-gray-600">{i18n.t("loadingPageHelp")}</p>
    </div>
  </TabSection>
);
