import type { FC } from "react";

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name?: string;
};

export const Checkbox: FC<Props> = ({ label, checked, onChange, name }) => {
  return (
    <label className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-chrome-blue hover:bg-blue-50 cursor-pointer transition-all">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 text-chrome-blue bg-gray-100 border-gray-300 rounded focus:ring-chrome-blue focus:ring-2"
      />
      <span>{label}</span>
    </label>
  );
};
