import type { ReactNode } from 'react';

type AlertBannerProps = {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AlertBanner({ icon, children, className = '' }: AlertBannerProps) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-xl bg-status-success-bg py-2.5 pl-11 pr-5 ${className}`}
      role="status"
    >
      {icon ? (
        <span className="absolute left-4 top-1/2 flex -translate-y-1/2 text-status-success-text">
          {icon}
        </span>
      ) : null}
      <p className="text-[12px] leading-5 text-status-success-text">{children}</p>
    </div>
  );
}

