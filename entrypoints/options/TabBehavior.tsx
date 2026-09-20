import type { FC } from "react";
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
  { value: "first", label: "Always first" },
  { value: "last", label: "Always last" },
  { value: "right", label: "Right of current tab" },
  { value: "left", label: "Left of current tab" },
  { value: "default", label: "Default (Browser default)" },
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
      <TabSection
        title="New Tab"
        description="Choose where new tabs are opened when you create them"
      >
        <RadioGroup
          name="newTabPosition"
          options={NewTabOptions}
          value={newTabPosition}
          onChange={onNewTabPositionChange}
        />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Checkbox
            name="openInBackground"
            label="New Tab Background"
            checked={openInBackground}
            onChange={onOpenInBackgroundChange}
          />
          <div></div>
        </div>
      </TabSection>

      <TabSection
        title="Matching URLs"
        description="Match the new tab's URL. The first matching rule wins. Patterns support regular expressions."
      >
        <div className="space-y-3">
          {urlRules.map((rule, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: Controlled rows have no independent state or persisted identity.
              key={index}
              className="flex flex-wrap items-center gap-3 rounded-md bg-gray-50 p-3"
            >
              <input
                aria-label={`URL pattern ${index + 1}`}
                placeholder="URL pattern"
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
                aria-label={`Position ${index + 1}`}
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
                aria-label={`Activation ${index + 1}`}
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
                <option value="foreground">Foreground</option>
                <option value="background">Background</option>
              </select>
              <button
                type="button"
                aria-label={`Remove rule ${index + 1}`}
                onClick={() => onUrlRulesChange(urlRules.filter((_, i) => i !== index))}
                className="text-red-600 hover:text-red-800"
              >
                Remove
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
            Add rule
          </button>
          <p className="text-sm text-gray-600">
            Default keeps the browser's position. Tab on Activate can override the position when the
            tab becomes active.
          </p>
        </div>
      </TabSection>

      <LoadingPage rules={loadingRules} onRulesChange={onLoadingRulesChange} />
      <Popup settings={popup} onChange={onPopupChange} />
    </TabContent>
  );
};
