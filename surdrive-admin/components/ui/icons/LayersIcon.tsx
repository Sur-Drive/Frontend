type LayersIconProps = {
  className?: string;
};

export function LayersIcon({ className = 'h-5 w-5' }: LayersIconProps) {
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
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m4.5 12.5-1.5.9 9 5 9-5-1.5-.9" />
      <path d="m4.5 16.5-1.5.9 9 5 9-5-1.5-.9" />
    </svg>
  );
}