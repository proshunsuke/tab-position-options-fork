import type { FC } from "react";
import type { TabActivation } from "@/src/types";
import { RadioGroup, type RadioOption } from "./ui/RadioGroup";
import { TabContent } from "./ui/TabContent";
import { TabSection } from "./ui/TabSection";

type Props = {
  afterTabClosing: TabActivation;
  onAfterTabClosingChange: (value: string) => void;
};

const afterTabClosingOptions: RadioOption<TabActivation>[] = [
  { value: "first", label: "First tab" },
  { value: "last", label: "Last tab" },
  { value: "right", label: "Right tab" },
  { value: "left", label: "Left tab" },
  { value: "inActivatedOrder", label: "In activated order" },
  { value: "sourceTab", label: "Source tab (Open link)" },
  { value: "sourceTabAndOrder", label: "Source tab & Activated order" },
  { value: "default", label: "Default (Browser default)" },
];

export const TabClosing: FC<Props> = ({ afterTabClosing, onAfterTabClosingChange }) => {
  return (
    <TabContent>
      <TabSection
        title="Activate Tab After Tab Closing"
        description="Choose which tab becomes active when you close the current tab"
      >
        <RadioGroup
          name="afterTabClosing"
          options={afterTabClosingOptions}
          value={afterTabClosing}
          onChange={onAfterTabClosingChange}
        />
      </TabSection>
    </TabContent>
  );
};
