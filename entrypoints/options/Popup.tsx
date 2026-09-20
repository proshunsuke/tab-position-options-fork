import type { FC } from "react";
import { Checkbox } from "@/entrypoints/options/ui/Checkbox";
import { TabSection } from "@/entrypoints/options/ui/TabSection";
import type { Settings } from "@/src/types";

type Props = {
  settings: Settings["popup"];
  onChange: (settings: Settings["popup"]) => void;
};

export const Popup: FC<Props> = ({ settings, onChange }) => {
  const exceptions = settings.exceptions ?? [];
  return (
    <TabSection
      title="Pop-up"
      description="Open pop-up windows as tabs in the last focused normal window."
    >
      <Checkbox
        name="popupAsNewTab"
        label="Open pop-up window as new tab"
        checked={settings.openAsNewTab}
        onChange={openAsNewTab => onChange({ ...settings, openAsNewTab })}
      />
      <div className="mt-4 space-y-3">
        <p id="popup-exceptions-help" className="text-sm text-gray-600">
          Matching URLs keep their pop-up window. Patterns support regular expressions.
        </p>
        {exceptions.map((rule, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: Controlled rows have no independent state or persisted identity.
            key={index}
            className="flex flex-wrap items-center gap-3 rounded-md bg-gray-50 p-3"
          >
            <input
              aria-label={`Pop-up exception ${index + 1}`}
              aria-describedby="popup-exceptions-help"
              placeholder="URL pattern"
              value={rule.url}
              onChange={event =>
                onChange({
                  ...settings,
                  exceptions: exceptions.map((item, i) =>
                    i === index ? { url: event.target.value } : item,
                  ),
                })
              }
              className="min-w-48 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2"
            />
            <button
              type="button"
              aria-label={`Remove pop-up exception ${index + 1}`}
              onClick={() =>
                onChange({ ...settings, exceptions: exceptions.filter((_, i) => i !== index) })
              }
              className="text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...settings, exceptions: [...exceptions, { url: "" }] })}
          className="rounded-md bg-chrome-blue px-4 py-2 text-white hover:bg-blue-600"
        >
          Add pop-up exception
        </button>
        <p className="text-sm text-gray-600">
          Converted tabs start at the end. Loading Page rules apply on navigation, and later tab
          switching follows Tab on Activate. Restored pop-up windows stay unchanged.
        </p>
      </div>
    </TabSection>
  );
};
