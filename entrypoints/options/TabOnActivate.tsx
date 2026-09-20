import type { FC } from "react";
import { i18n } from "#i18n";
import { RadioGroup, type RadioOption } from "@/entrypoints/options/ui/RadioGroup";
import { TabContent } from "@/entrypoints/options/ui/TabContent";
import { TabSection } from "@/entrypoints/options/ui/TabSection";
import type { TabOnActivateBehavior } from "@/src/types";

type Props = {
  behavior: TabOnActivateBehavior;
  onBehaviorChange: (value: string) => void;
};

const ActivationOptions: RadioOption<TabOnActivateBehavior>[] = [
  { value: "default", label: i18n.t("activationDefault") },
  { value: "first", label: i18n.t("activationFirst") },
  { value: "last", label: i18n.t("activationLast") },
];

export const TabOnActivate: FC<Props> = ({ behavior, onBehaviorChange }) => (
  <TabContent>
    <TabSection title={i18n.t("tabOnActivate")} description={i18n.t("activationDescription")}>
      <RadioGroup
        name="tabOnActivate"
        options={ActivationOptions}
        value={behavior}
        onChange={onBehaviorChange}
      />
    </TabSection>
  </TabContent>
);
