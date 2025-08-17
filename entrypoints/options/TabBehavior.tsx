import type { FC } from "react";
import { RadioGroup, type RadioOption } from "@/entrypoints/options/ui/RadioGroup";
import { TabContent } from "@/entrypoints/options/ui/TabContent";
import { TabSection } from "@/entrypoints/options/ui/TabSection";
import type { TabPosition } from "@/src/types";

type Props = {
  newTabPosition: TabPosition;
  onNewTabPositionChange: (value: string) => void;
};

const NewTabOptions: RadioOption<TabPosition>[] = [
  { value: "first", label: "Always first" },
  { value: "last", label: "Always last" },
  { value: "right", label: "Right of current tab" },
  { value: "left", label: "Left of current tab" },
  { value: "default", label: "Default (Browser default)" },
];

export const TabBehavior: FC<Props> = ({ newTabPosition, onNewTabPositionChange }) => {
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
      </TabSection>

      <TabSection
        title="Loading Page"
        description="Choose where tabs are opened when loading new pages from links"
      >
        <div className="text-gray-500 italic">Coming soon...</div>
      </TabSection>
    </TabContent>
  );
};
