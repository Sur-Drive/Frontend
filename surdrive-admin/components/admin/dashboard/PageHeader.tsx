type PageHeaderProps = {
  title: string;
  subtitle: string;
};

/**
 * Plain page header. The old right-side controls (a stub YearSelect and a
 * no-op "Reset Data" button) were removed: neither had a backend to drive
 * them, and decorative controls are not allowed.
 */
export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-ink-primary">{title}</h1>
        <p className="mt-1 text-sm text-ink-tertiary">{subtitle}</p>
      </div>
    </div>
  );
}