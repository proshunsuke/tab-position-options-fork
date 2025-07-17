import type { FC, ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
};

export const TabSection: FC<Props> = ({ title, description, children }) => {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      {children}
    </section>
  );
};
