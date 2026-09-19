import type { FC } from "react";
import { RadioGroup, type RadioOption } from "@/entrypoints/options/ui/RadioGroup";
import { TabContent } from "@/entrypoints/options/ui/TabContent";
import { TabSection } from "@/entrypoints/options/ui/TabSection";
import type { TabOnActivateBehavior } from "@/src/types";

type Props = {
  behavior: TabOnActivateBehavior;
  onBehaviorChange: (value: string) => void;
};

const ActivationOptions: RadioOption<TabOnActivateBehavior>[] = [
  { value: "default", label: "Default (Keep position)" },
  { value: "first", label: "First" },
  { value: "last", label: "Last" },
];

export const TabOnActivate: FC<Props> = ({ behavior, onBehaviorChange }) => (
  <TabContent>
    <TabSection
      title="Tab on Activate"
      description="Move a tab to the first or last position when it becomes active. Pinned tabs stay in place."
    >
      <RadioGroup
        name="tabOnActivate"
        options={ActivationOptions}
        value={behavior}
        onChange={onBehaviorChange}
      />
    </TabSection>
  </TabContent>
);
