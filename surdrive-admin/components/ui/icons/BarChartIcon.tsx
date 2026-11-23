type BarChartIconProps = {
  className?: string;
};

export function BarChartIcon({ className = 'h-5 w-5' }: BarChartIconProps) {
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
      <path d="M5 20v-7" />
      <path d="M12 20V6" />
      <path d="M19 20v-4" />
    </svg>
  );
}
