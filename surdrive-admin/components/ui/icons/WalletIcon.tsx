type WalletIconProps = {
  className?: string;
};

export function WalletIcon({ className = 'h-5 w-5' }: WalletIconProps) {
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
      <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      <path d="M21 7h-8a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1Z" />
      <circle cx="16" cy="11" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}