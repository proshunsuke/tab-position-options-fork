import type { FC } from "react";
import { i18n } from "#i18n";

type Props = {
  children: string;
};

export const HelpDetails: FC<Props> = ({ children }) => (
  <details className="text-sm text-gray-600">
    <summary className="cursor-pointer py-2 font-medium text-gray-700">{i18n.t("details")}</summary>
    <p className="pt-1">{children}</p>
  </details>
);
