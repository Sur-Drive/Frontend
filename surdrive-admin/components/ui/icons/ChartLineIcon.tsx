type ChartLineIconProps = {
  className?: string;
};

export function ChartLineIcon({ className = 'h-5 w-5' }: ChartLineIconProps) {
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
      <path d="M4 4v15a1 1 0 0 0 1 1h15" />
      <path d="m7.5 13.5 3.5-3.5 2.5 2.5 4.5-5.5" />
    </svg>
  );
}
