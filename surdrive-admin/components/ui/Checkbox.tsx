import type { InputHTMLAttributes } from 'react';

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
};

export function Checkbox({ id, label, className = '', ...props }: CheckboxProps) {
  return (
    <label htmlFor={id} className={`inline-flex cursor-pointer items-center gap-2.5 ${className}`}>
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border-[#D1D5DB] accent-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
        {...props}
      />
      <span className="text-sm text-[#374151]">{label}</span>
    </label>
  );
}
