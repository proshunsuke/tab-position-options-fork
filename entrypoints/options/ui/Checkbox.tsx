import type { FC } from "react";

type Props = {
  name: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
};

export const Checkbox: FC<Props> = ({ name, label, checked, onChange, description }) => {
  return (
    <label className="flex items-center space-x-3 p-4 rounded hover:bg-gray-50 cursor-pointer transition-colors">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 text-chrome-blue rounded border-gray-300 focus:ring-chrome-blue"
      />
      <div className="flex-1">
        <span className="text-gray-900">{label}</span>
        {description && <span className="block text-sm text-gray-500 mt-1">{description}</span>}
      </div>
    </label>
  );
};
