import type { FC, ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export const TabContent: FC<Props> = ({ children }) => {
  return <div className="space-y-10">{children}</div>;
};
