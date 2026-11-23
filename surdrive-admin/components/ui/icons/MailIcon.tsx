type MailIconProps = {
  className?: string;
};

export function MailIcon({ className = 'h-5 w-5' }: MailIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7.5 9 6 9-6" />
    </svg>
  );
}
