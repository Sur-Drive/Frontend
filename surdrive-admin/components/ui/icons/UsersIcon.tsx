type UsersIconProps = {
  className?: string;
};

export function UsersIcon({ className = 'h-5 w-5' }: UsersIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M15.5 5.1a3.5 3.5 0 0 1 0 5.8" />
      <path d="M17.2 14a5.5 5.5 0 0 1 3.3 5" />
    </svg>
  );
}
