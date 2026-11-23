type IconProps = {
  className?: string;
};

export function CheckIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}