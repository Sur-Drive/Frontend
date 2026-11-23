import type { ReactNode } from 'react';

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full bg-brand-tint px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-accent ${className}`}
    >
      {children}
    </span>
  );
}
