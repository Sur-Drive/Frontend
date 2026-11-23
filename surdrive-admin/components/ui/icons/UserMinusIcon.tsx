type IconProps = {
  className?: string;
};

export function UserMinusIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.5 19c.7-3 2.9-4.75 5.5-4.75S13.8 16 14.5 19" />
      <path d="M16.5 8.5h5" />
    </svg>
  );
}