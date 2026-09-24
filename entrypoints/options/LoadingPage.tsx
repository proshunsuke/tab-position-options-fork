import type { FC } from "react";
import { i18n } from "#i18n";
import { HelpDetails } from "@/entrypoints/options/ui/HelpDetails";
import { TabSection } from "@/entrypoints/options/ui/TabSection";
import type { LoadingPageUrlRule } from "@/src/types";

type Props = {
  rules: LoadingPageUrlRule[];
  onRulesChange: (rules: LoadingPageUrlRule[]) => void;
  webNavigationPermissionGranted: boolean;
  onRequestWebNavigationPermission: () => Promise<boolean>;
  invalidRuleId: string | null;
};

export const LoadingPage: FC<Props> = ({
  rules,
  onRulesChange,
  webNavigationPermissionGranted,
  onRequestWebNavigationPermission,
  invalidRuleId,
}) => {
  const addRule = () => {
    const nextRules = [...rules, { url: "", position: "last" as const }];
    if (webNavigationPermissionGranted) {
      onRulesChange(nextRules);
      return;
    }
    void onRequestWebNavigationPermission().then(granted => granted && onRulesChange(nextRules));
  };

  return (
    <TabSection title={i18n.t("loadingPage")} description={i18n.t("loadingPageDescription")}>
      <div className="space-y-3">
        <fieldset aria-label={i18n.t("loadingPage")} className="min-w-0 space-y-3">
          {rules.map((rule, index) => {
            const inputId = `loading-rule-${index}`;
            const errorId = `${inputId}-error`;
            const hasError = invalidRuleId === inputId;
            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: Controlled rows have no independent state or persisted identity.
                key={index}
                className="flex flex-wrap items-center gap-3 rounded-md bg-gray-50 p-3"
              >
                <input
                  id={inputId}
                  aria-label={i18n.t("loadingUrlPatternLabel", [String(index + 1)])}
                  aria-invalid={hasError}
                  aria-describedby={hasError ? errorId : undefined}
                  placeholder={i18n.t("urlPattern")}
                  value={rule.url}
                  onChange={event =>
                    onRulesChange(
                      rules.map((item, i) =>
                        i === index ? { ...item, url: event.target.value } : item,
                      ),
                    )
                  }
                  className={`min-w-0 w-full sm:min-w-48 sm:w-auto sm:flex-1 rounded-md border bg-white px-3 py-2 ${hasError ? "border-red-600" : "border-gray-300"}`}
                />
                <select
                  aria-label={i18n.t("loadingPositionLabel", [String(index + 1)])}
                  value={rule.position}
                  onChange={event =>
                    onRulesChange(
                      rules.map((item, i) =>
                        i === index
                          ? {
                              ...item,
                              position: event.target.value as LoadingPageUrlRule["position"],
                            }
                          : item,
                      ),
                    )
                  }
                  className="max-w-full rounded-md border border-gray-300 bg-white px-3 py-2"
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
                {hasError && (
                  <p id={errorId} role="alert" className="basis-full text-sm text-red-700">
                    {i18n.t("invalidPattern")}
                  </p>
                )}
              </div>
            );
          })}
        </fieldset>
        <button
          type="button"
          onClick={addRule}
          className="rounded-md bg-chrome-blue px-4 py-2 text-white hover:bg-chrome-blue/90"
        >
          {i18n.t("addLoadingRule")}
        </button>
        <HelpDetails>{i18n.t("loadingPageHelp")}</HelpDetails>
      </div>
    </TabSection>
  );
};
