type EditIconProps = {
  className?: string;
};

/** Pencil-in-square icon used for the "Extend" subscription action */
export function EditIcon({ className = 'h-5 w-5' }: EditIconProps) {
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
      <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
      <path d="M18.4 3.6a2 2 0 0 1 2.8 2.8L13 14.6 9 15.5l.9-4L18.4 3.6Z" />
    </svg>
  );
}