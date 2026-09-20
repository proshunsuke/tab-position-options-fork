import type { FC } from "react";
import { i18n } from "#i18n";
import { RadioGroup, type RadioOption } from "@/entrypoints/options/ui/RadioGroup";
import { TabContent } from "@/entrypoints/options/ui/TabContent";
import { TabSection } from "@/entrypoints/options/ui/TabSection";
import type { TabActivation } from "@/src/types";

type Props = {
  afterTabClosing: TabActivation;
  onAfterTabClosingChange: (value: string) => void;
};

const AfterTabClosingOptions: RadioOption<TabActivation>[] = [
  { value: "first", label: i18n.t("closingFirst") },
  { value: "last", label: i18n.t("closingLast") },
  { value: "right", label: i18n.t("closingRight") },
  { value: "left", label: i18n.t("closingLeft") },
  { value: "inActivatedOrder", label: i18n.t("closingActivatedOrder") },
  { value: "sourceTab", label: i18n.t("closingSource") },
  { value: "sourceTabAndOrder", label: i18n.t("closingSourceAndOrder") },
  { value: "default", label: i18n.t("browserDefault") },
];

export const TabClosing: FC<Props> = ({ afterTabClosing, onAfterTabClosingChange }) => {
  return (
    <TabContent>
      <TabSection title={i18n.t("closingTitle")} description={i18n.t("closingDescription")}>
        <RadioGroup
          name="afterTabClosing"
          options={AfterTabClosingOptions}
          value={afterTabClosing}
          onChange={onAfterTabClosingChange}
        />
      </TabSection>
    </TabContent>
  );
};
