type EyeOffIconProps = {
  className?: string;
};

export function EyeOffIcon({ className = 'h-5 w-5' }: EyeOffIconProps) {
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
      <path d="m3 3 18 18" />
      <path d="M10.6 5.7c.46-.13.93-.2 1.4-.2 6 0 9.5 6.5 9.5 6.5a17.6 17.6 0 0 1-2.16 2.95" />
      <path d="M6.36 6.86C3.9 8.76 2.5 12 2.5 12S6 18.5 12 18.5c1.52 0 2.88-.4 4.06-1.02" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}
