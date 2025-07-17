import type { FC } from "react";

export type RadioOption<T extends string = string> = {
  value: T;
  label: string;
};

type Props<T extends string = string> = {
  name: string;
  options: RadioOption<T>[];
  value: T;
  onChange: (value: string) => void;
  columns?: 1 | 2;
};

export const RadioGroup: FC<Props> = ({ name, options, value, onChange, columns = 2 }) => {
  const gridCols = columns === 1 ? "grid-cols-1" : "grid-cols-2";

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {options.map(option => (
        <label
          key={option.value}
          className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-chrome-blue hover:bg-blue-50 cursor-pointer transition-all"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={e => onChange(e.target.value)}
            className="w-4 h-4 text-chrome-blue"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
};
