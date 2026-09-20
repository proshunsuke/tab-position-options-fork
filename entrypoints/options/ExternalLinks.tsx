import type { FC } from "react";
import { i18n } from "#i18n";
import { Checkbox } from "@/entrypoints/options/ui/Checkbox";
import { TabContent } from "@/entrypoints/options/ui/TabContent";
import { TabSection } from "@/entrypoints/options/ui/TabSection";
import { EXTERNAL_LINK_ACTIONS, type ExternalLinkRule, type Settings } from "@/src/types";

type Props = {
  settings: Settings["externalLinks"];
  onChange: (settings: Settings["externalLinks"]) => void;
};
const ActionLabels = {
  "exclude-page": "externalExcludePage",
  "new-page": "externalNewPage",
  "background-page": "externalBackgroundPage",
  "current-page": "externalCurrentPage",
  "new-link": "externalNewLink",
  "background-link": "externalBackgroundLink",
  "current-link": "externalCurrentLink",
} as const;

export const ExternalLinks: FC<Props> = ({ settings, onChange }) => (
  <TabContent>
    <TabSection title={i18n.t("externalLinks")} description={i18n.t("externalDescription")}>
      <Checkbox
        name="externalLinksEnabled"
        label={i18n.t("externalEnabled")}
        checked={settings.enabled}
        onChange={enabled => onChange({ ...settings, enabled })}
      />
    </TabSection>
    <TabSection title={i18n.t("matchingUrls")} description={i18n.t("externalRulesHelp")}>
      <div className="space-y-3">
        <fieldset
          aria-label={i18n.t("matchingUrls")}
          className="min-w-0 max-h-80 overflow-y-auto space-y-3 p-1"
        >
          {settings.urlRules.map((rule, index) => (
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
                  onChange({
                    ...settings,
                    urlRules: settings.urlRules.map((item, i) =>
                      i === index ? { ...item, url: event.target.value } : item,
                    ),
                  })
                }
                className="min-w-48 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2"
              />
              <select
                aria-label={i18n.t("externalActionLabel", [String(index + 1)])}
                value={rule.action}
                onChange={event =>
                  onChange({
                    ...settings,
                    urlRules: settings.urlRules.map((item, i) =>
                      i === index
                        ? { ...item, action: event.target.value as ExternalLinkRule["action"] }
                        : item,
                    ),
                  })
                }
                className="rounded-md border border-gray-300 bg-white px-3 py-2"
              >
                {EXTERNAL_LINK_ACTIONS.map(action => (
                  <option key={action} value={action}>
                    {i18n.t(ActionLabels[action])}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label={i18n.t("removeRuleLabel", [String(index + 1)])}
                onClick={() =>
                  onChange({
                    ...settings,
                    urlRules: settings.urlRules.filter((_, i) => i !== index),
                  })
                }
                className="text-red-600 hover:text-red-800"
              >
                {i18n.t("remove")}
              </button>
            </div>
          ))}
        </fieldset>

        <button
          type="button"
          onClick={() =>
            onChange({
              ...settings,
              urlRules: [...settings.urlRules, { url: "", action: "exclude-page" }],
            })
          }
          className="rounded-md bg-chrome-blue px-4 py-2 text-white hover:bg-blue-600"
        >
          {i18n.t("addRule")}
        </button>
        <p className="text-sm text-gray-600">{i18n.t("externalPlacementHelp")}</p>
      </div>
    </TabSection>
  </TabContent>
);
