import type { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
}

export function ComingSoon({ icon: Icon, title }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface px-6 py-16 text-center">
      <span
        aria-hidden="true"
        className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-brand-soft"
      >
        <Icon className="size-7 text-brand" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        {title}
      </h1>
      <p className="mt-2 text-sm text-ink-muted">This section is coming soon.</p>
    </div>
  );
}
