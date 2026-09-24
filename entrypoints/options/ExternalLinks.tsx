import type { FC } from "react";
import { i18n } from "#i18n";
import { Checkbox } from "@/entrypoints/options/ui/Checkbox";
import { HelpDetails } from "@/entrypoints/options/ui/HelpDetails";
import { TabContent } from "@/entrypoints/options/ui/TabContent";
import { TabSection } from "@/entrypoints/options/ui/TabSection";
import { EXTERNAL_LINK_ACTIONS, type ExternalLinkRule, type Settings } from "@/src/types";

type Props = {
  settings: Settings["externalLinks"];
  onChange: (settings: Settings["externalLinks"]) => void;
  permissionGranted: boolean;
  onRequestPermission: () => Promise<boolean>;
  invalidRuleId: string | null;
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

export const ExternalLinks: FC<Props> = ({
  settings,
  onChange,
  permissionGranted,
  onRequestPermission,
  invalidRuleId,
}) => {
  const handleEnabledChange = (enabled: boolean) => {
    if (!enabled) {
      onChange({ ...settings, enabled });
      return;
    }
    if (permissionGranted) {
      onChange({ ...settings, enabled });
      return;
    }
    void onRequestPermission().then(granted => {
      if (granted) {
        onChange({ ...settings, enabled: true });
      }
    });
  };

  return (
    <TabContent>
      <TabSection title={i18n.t("externalLinks")} description={i18n.t("externalDescription")}>
        <Checkbox
          name="externalLinksEnabled"
          label={i18n.t("externalEnabled")}
          checked={settings.enabled}
          onChange={handleEnabledChange}
        />
      </TabSection>
      <TabSection title={i18n.t("matchingUrls")} description={i18n.t("externalRulesHelp")}>
        <div className="space-y-3">
          <fieldset aria-label={i18n.t("matchingUrls")} className="min-w-0 space-y-3">
            {settings.urlRules.map((rule, index) => {
              const inputId = `external-rule-${index}`;
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
                      onChange({
                        ...settings,
                        urlRules: settings.urlRules.map((item, i) =>
                          i === index ? { ...item, url: event.target.value } : item,
                        ),
                      })
                    }
                    className={`min-w-0 w-full sm:min-w-48 sm:w-auto sm:flex-1 rounded-md border bg-white px-3 py-2 ${hasError ? "border-red-600" : "border-gray-300"}`}
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
                    className="max-w-full rounded-md border border-gray-300 bg-white px-3 py-2"
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
          <HelpDetails>{i18n.t("externalPlacementHelp")}</HelpDetails>
        </div>
      </TabSection>
    </TabContent>
  );
};
