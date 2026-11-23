type SirenIconProps = {
  className?: string;
};

export function SirenIcon({ className = 'h-5 w-5' }: SirenIconProps) {
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
      <path d="M7 18v-6a5 5 0 0 1 10 0v6" />
      <path d="M5 21a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v0a0 0 0 0 1 0 0H6a0 0 0 0 1 0 0v0Z" />
      <path d="M12 2v2" />
      <path d="M4.9 4.9l1.4 1.4" />
      <path d="M19.1 4.9l-1.4 1.4" />
    </svg>
  );
}