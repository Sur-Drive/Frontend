import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary';
  fullWidth?: boolean;
  children: ReactNode;
};

const VARIANTS = {
  primary:
    'bg-brand-accent text-white hover:bg-brand-accent-hover focus-visible:ring-brand-accent/40',
} as const;

export function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex h-12 items-center justify-center rounded-[10px] text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        VARIANTS[variant]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
