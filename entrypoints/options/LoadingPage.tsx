import type { FC } from "react";
import { TabSection } from "@/entrypoints/options/ui/TabSection";
import type { LoadingPageUrlRule } from "@/src/types";

type Props = {
  rules: LoadingPageUrlRule[];
  onRulesChange: (rules: LoadingPageUrlRule[]) => void;
};

export const LoadingPage: FC<Props> = ({ rules, onRulesChange }) => (
  <TabSection
    title="Loading Page"
    description="Move tabs when navigating to a matching URL. The first matching rule wins. Patterns support regular expressions."
  >
    <div className="space-y-3">
      {rules.map((rule, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: Controlled rows have no independent state or persisted identity.
          key={index}
          className="flex flex-wrap items-center gap-3 rounded-md bg-gray-50 p-3"
        >
          <input
            aria-label={`Loading URL pattern ${index + 1}`}
            placeholder="URL pattern"
            value={rule.url}
            onChange={event =>
              onRulesChange(
                rules.map((item, i) => (i === index ? { ...item, url: event.target.value } : item)),
              )
            }
            className="min-w-48 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2"
          />
          <select
            aria-label={`Loading position ${index + 1}`}
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
            <option value="last">Always last</option>
            <option value="middle">Always middle</option>
            <option value="first">Always first</option>
          </select>
          <button
            type="button"
            aria-label={`Remove loading rule ${index + 1}`}
            onClick={() => onRulesChange(rules.filter((_, i) => i !== index))}
            className="text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onRulesChange([...rules, { url: "", position: "last" }])}
        className="rounded-md bg-chrome-blue px-4 py-2 text-white hover:bg-chrome-blue/90"
      >
        Add loading rule
      </button>
      <p className="text-sm text-gray-600">
        The destination URL takes priority; server redirects can also match the original URL.
        Loading rules override initial tab placement. Switching tabs later applies Tab on Activate.
        Pinned tabs and restored pages keep their positions.
      </p>
    </div>
  </TabSection>
);
