import type { FC } from "react";
import type { TabPosition } from "@/src/types";
import { RadioGroup, type RadioOption } from "./ui/RadioGroup";
import { TabContent } from "./ui/TabContent";
import { TabSection } from "./ui/TabSection";

type Props = {
  newTabPosition: TabPosition;
  onNewTabPositionChange: (value: string) => void;
};

const newTabOptions: RadioOption<TabPosition>[] = [
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
          options={newTabOptions}
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
