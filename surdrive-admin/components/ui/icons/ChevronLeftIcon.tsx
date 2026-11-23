type IconProps = {
  className?: string;
};

export function ChevronLeftIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}