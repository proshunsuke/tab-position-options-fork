import type { FC } from "react";
import { i18n } from "#i18n";
import { Checkbox } from "@/entrypoints/options/ui/Checkbox";
import { HelpDetails } from "@/entrypoints/options/ui/HelpDetails";
import { TabSection } from "@/entrypoints/options/ui/TabSection";
import type { Settings } from "@/src/types";

type Props = {
  settings: Settings["popup"];
  onChange: (settings: Settings["popup"]) => void;
  webNavigationPermissionGranted: boolean;
  onRequestWebNavigationPermission: () => Promise<boolean>;
  invalidRuleId: string | null;
};

export const Popup: FC<Props> = ({
  settings,
  onChange,
  webNavigationPermissionGranted,
  onRequestWebNavigationPermission,
  invalidRuleId,
}) => {
  const exceptions = settings.exceptions ?? [];
  const handleOpenAsNewTabChange = (openAsNewTab: boolean) => {
    if (!openAsNewTab) {
      onChange({ ...settings, openAsNewTab });
      return;
    }
    if (webNavigationPermissionGranted) {
      onChange({ ...settings, openAsNewTab });
      return;
    }
    void onRequestWebNavigationPermission().then(granted => {
      if (granted) {
        onChange({ ...settings, openAsNewTab: true });
      }
    });
  };

  return (
    <TabSection title={i18n.t("popup")} description={i18n.t("popupDescription")}>
      <Checkbox
        name="popupAsNewTab"
        label={i18n.t("popupAsNewTab")}
        checked={settings.openAsNewTab}
        onChange={handleOpenAsNewTabChange}
      />
      <div className="mt-4 space-y-3">
        <p id="popup-exceptions-help" className="text-sm text-gray-600">
          {i18n.t("popupExceptionsHelp")}
        </p>
        <fieldset aria-label={i18n.t("popupExceptionsHelp")} className="min-w-0 space-y-3">
          {exceptions.map((rule, index) => {
            const inputId = `popup-rule-${index}`;
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
                  aria-label={i18n.t("popupExceptionLabel", [String(index + 1)])}
                  aria-invalid={hasError}
                  aria-describedby={`popup-exceptions-help${hasError ? ` ${errorId}` : ""}`}
                  placeholder={i18n.t("urlPattern")}
                  value={rule.url}
                  onChange={event =>
                    onChange({
                      ...settings,
                      exceptions: exceptions.map((item, i) =>
                        i === index ? { url: event.target.value } : item,
                      ),
                    })
                  }
                  className={`min-w-0 w-full sm:min-w-48 sm:w-auto sm:flex-1 rounded-md border bg-white px-3 py-2 ${hasError ? "border-red-600" : "border-gray-300"}`}
                />
                <button
                  type="button"
                  aria-label={i18n.t("removePopupExceptionLabel", [String(index + 1)])}
                  onClick={() =>
                    onChange({ ...settings, exceptions: exceptions.filter((_, i) => i !== index) })
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
          onClick={() => onChange({ ...settings, exceptions: [...exceptions, { url: "" }] })}
          className="rounded-md bg-chrome-blue px-4 py-2 text-white hover:bg-blue-600"
        >
          {i18n.t("addPopupException")}
        </button>
        <HelpDetails>{i18n.t("popupHelp")}</HelpDetails>
      </div>
    </TabSection>
  );
};
