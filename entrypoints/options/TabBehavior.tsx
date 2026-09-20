import type { FC } from "react";
import { i18n } from "#i18n";
import { LoadingPage } from "@/entrypoints/options/LoadingPage";
import { Popup } from "@/entrypoints/options/Popup";
import { Checkbox } from "@/entrypoints/options/ui/Checkbox";
import { RadioGroup, type RadioOption } from "@/entrypoints/options/ui/RadioGroup";
import { TabContent } from "@/entrypoints/options/ui/TabContent";
import { TabSection } from "@/entrypoints/options/ui/TabSection";
import type { LoadingPageUrlRule, NewTabUrlRule, Settings, TabPosition } from "@/src/types";

type Props = {
  popup: Settings["popup"];
  onPopupChange: (settings: Settings["popup"]) => void;
  loadingRules: LoadingPageUrlRule[];
  onLoadingRulesChange: (rules: LoadingPageUrlRule[]) => void;
  urlRules: NewTabUrlRule[];
  onUrlRulesChange: (rules: NewTabUrlRule[]) => void;
  newTabPosition: TabPosition;
  onNewTabPositionChange: (value: string) => void;
  openInBackground: boolean;
  onOpenInBackgroundChange: (checked: boolean) => void;
};

const NewTabOptions: RadioOption<TabPosition>[] = [
  { value: "first", label: i18n.t("positionFirst") },
  { value: "last", label: i18n.t("positionLast") },
  { value: "right", label: i18n.t("positionRight") },
  { value: "left", label: i18n.t("positionLeft") },
  { value: "default", label: i18n.t("browserDefault") },
];

export const TabBehavior: FC<Props> = ({
  popup,
  onPopupChange,
  loadingRules,
  onLoadingRulesChange,
  urlRules,
  onUrlRulesChange,
  newTabPosition,
  onNewTabPositionChange,
  openInBackground,
  onOpenInBackgroundChange,
}) => {
  return (
    <TabContent>
      <TabSection title={i18n.t("newTab")} description={i18n.t("newTabDescription")}>
        <RadioGroup
          name="newTabPosition"
          options={NewTabOptions}
          value={newTabPosition}
          onChange={onNewTabPositionChange}
        />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Checkbox
            name="openInBackground"
            label={i18n.t("newTabBackground")}
            checked={openInBackground}
            onChange={onOpenInBackgroundChange}
          />
          <div></div>
        </div>
      </TabSection>

      <TabSection title={i18n.t("matchingUrls")} description={i18n.t("matchingUrlsDescription")}>
        <div className="space-y-3">
          {urlRules.map((rule, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: Controlled rows have no independent state or persisted identity.
              key={index}
              className="flex flex-wrap items-center gap-3 rounded-md bg-gray-50 p-3"
            >
              <input
                aria-label={i18n.t("urlPatternLabel", [String(index + 1)])}
                placeholder={i18n.t("urlPattern")}
                value={rule.url}
                onChange={event =>
                  onUrlRulesChange(
                    urlRules.map((item, i) =>
                      i === index ? { ...item, url: event.target.value } : item,
                    ),
                  )
                }
                className="min-w-48 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2"
              />
              <select
                aria-label={i18n.t("positionLabel", [String(index + 1)])}
                value={rule.position}
                onChange={event =>
                  onUrlRulesChange(
                    urlRules.map((item, i) =>
                      i === index ? { ...item, position: event.target.value as TabPosition } : item,
                    ),
                  )
                }
                className="rounded-md border border-gray-300 bg-white px-3 py-2"
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
                className="rounded-md border border-gray-300 bg-white px-3 py-2"
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
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onUrlRulesChange([
                ...urlRules,
                { url: "", position: "default", active: "foreground" },
              ])
            }
            className="rounded-md bg-chrome-blue px-4 py-2 text-white hover:bg-blue-600"
          >
            {i18n.t("addRule")}
          </button>
          <p className="text-sm text-gray-600">{i18n.t("matchingUrlsHelp")}</p>
        </div>
      </TabSection>

      <LoadingPage rules={loadingRules} onRulesChange={onLoadingRulesChange} />
      <Popup settings={popup} onChange={onPopupChange} />
    </TabContent>
  );
};
