import type { FC } from "react";
import { i18n } from "#i18n";
import { Checkbox } from "@/entrypoints/options/ui/Checkbox";
import { HelpDetails } from "@/entrypoints/options/ui/HelpDetails";
import { RadioGroup, type RadioOption } from "@/entrypoints/options/ui/RadioGroup";
import { TabContent } from "@/entrypoints/options/ui/TabContent";
import { TabSection } from "@/entrypoints/options/ui/TabSection";
import type { NewTabUrlRule, TabPosition } from "@/src/types";

type Props = {
  urlRules: NewTabUrlRule[];
  onUrlRulesChange: (rules: NewTabUrlRule[]) => void;
  newTabPosition: TabPosition;
  onNewTabPositionChange: (value: string) => void;
  openInBackground: boolean;
  onOpenInBackgroundChange: (checked: boolean) => void;
  tabsPermissionGranted: boolean;
  onRequestTabsPermission: () => Promise<boolean>;
  invalidRuleId: string | null;
};

const NewTabOptions: RadioOption<TabPosition>[] = [
  { value: "first", label: i18n.t("positionFirst") },
  { value: "last", label: i18n.t("positionLast") },
  { value: "right", label: i18n.t("positionRight") },
  { value: "left", label: i18n.t("positionLeft") },
  { value: "default", label: i18n.t("browserDefault") },
];

export const NewTab: FC<Props> = ({
  urlRules,
  onUrlRulesChange,
  newTabPosition,
  onNewTabPositionChange,
  openInBackground,
  onOpenInBackgroundChange,
  tabsPermissionGranted,
  onRequestTabsPermission,
  invalidRuleId,
}) => {
  const addRule = () => {
    const rules = [
      ...urlRules,
      { url: "", position: "default" as const, active: "foreground" as const },
    ];
    if (tabsPermissionGranted) {
      onUrlRulesChange(rules);
      return;
    }
    void onRequestTabsPermission().then(granted => granted && onUrlRulesChange(rules));
  };

  return (
    <TabContent>
      <TabSection title={i18n.t("newTab")} description={i18n.t("newTabDescription")}>
        <RadioGroup
          name="newTabPosition"
          options={NewTabOptions}
          value={newTabPosition}
          onChange={onNewTabPositionChange}
        />
        <div className="mt-4">
          <Checkbox
            name="openInBackground"
            label={i18n.t("newTabBackground")}
            checked={openInBackground}
            onChange={onOpenInBackgroundChange}
          />
        </div>
      </TabSection>

      <TabSection title={i18n.t("matchingUrls")} description={i18n.t("matchingUrlsDescription")}>
        <div className="space-y-3">
          <fieldset aria-label={i18n.t("matchingUrls")} className="min-w-0 space-y-3">
            {urlRules.map((rule, index) => {
              const inputId = `new-rule-${index}`;
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
                    aria-label={i18n.t("urlPatternLabel", [String(index + 1)])}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? errorId : undefined}
                    placeholder={i18n.t("urlPattern")}
                    value={rule.url}
                    onChange={event =>
                      onUrlRulesChange(
                        urlRules.map((item, i) =>
                          i === index ? { ...item, url: event.target.value } : item,
                        ),
                      )
                    }
                    className={`min-w-0 w-full sm:min-w-48 sm:w-auto sm:flex-1 rounded-md border bg-white px-3 py-2 ${hasError ? "border-red-600" : "border-gray-300"}`}
                  />
                  <select
                    aria-label={i18n.t("positionLabel", [String(index + 1)])}
                    value={rule.position}
                    onChange={event =>
                      onUrlRulesChange(
                        urlRules.map((item, i) =>
                          i === index
                            ? { ...item, position: event.target.value as TabPosition }
                            : item,
                        ),
                      )
                    }
                    className="max-w-full rounded-md border border-gray-300 bg-white px-3 py-2"
                  >
                    {NewTabOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={i18n.t("activationLabel", [String(index + 1)])}
                    value={rule.active}
                    onChange={event =>
                      onUrlRulesChange(
                        urlRules.map((item, i) =>
                          i === index
                            ? { ...item, active: event.target.value as NewTabUrlRule["active"] }
                            : item,
                        ),
                      )
                    }
                    className="max-w-full rounded-md border border-gray-300 bg-white px-3 py-2"
                  >
                    <option value="foreground">{i18n.t("foreground")}</option>
                    <option value="background">{i18n.t("background")}</option>
                  </select>
                  <button
                    type="button"
                    aria-label={i18n.t("removeRuleLabel", [String(index + 1)])}
                    onClick={() => onUrlRulesChange(urlRules.filter((_, i) => i !== index))}
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
            className="rounded-md bg-chrome-blue px-4 py-2 text-white hover:bg-blue-600"
          >
            {i18n.t("addRule")}
          </button>
          <HelpDetails>{i18n.t("matchingUrlsHelp")}</HelpDetails>
        </div>
      </TabSection>
    </TabContent>
  );
};
