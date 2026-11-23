import type { InputHTMLAttributes, ReactNode } from 'react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  labelAction?: ReactNode;
  leadingIcon?: ReactNode;
  trailingAdornment?: ReactNode;
};

export function TextField({
  id,
  label,
  labelAction,
  leadingIcon,
  trailingAdornment,
  className = '',
  ...props
}: TextFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[14px] font-medium text-[#374151]">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        {leadingIcon ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-placeholder">
            {leadingIcon}
          </span>
        ) : null}
        <input
          id={id}
          className={`h-11 w-full rounded-xl border border-line-input bg-surface-card text-[14px] text-[#111827] placeholder:text-ink-placeholder focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/15 ${
            leadingIcon ? 'pl-11' : 'pl-4'
          } ${trailingAdornment ? 'pr-11' : 'pr-4'} ${className}`}
          {...props}
        />
        {trailingAdornment ? (
          <span className="absolute right-4 top-1/2 -translate-y-1/2">
            {trailingAdornment}
          </span>
        ) : null}
      </div>
    </div>
  );
}
