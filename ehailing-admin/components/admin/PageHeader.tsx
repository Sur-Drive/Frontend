import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

// Standard records-page header: a large title, a muted description and an
// optional right-hand actions slot that wraps below the text on small screens.
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-normal tracking-tight text-ink">{title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      </div>
      {actions ? (
        <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto sm:justify-end">{actions}</div>
      ) : null}
    </div>
  );
}
