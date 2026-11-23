import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { TONE_STYLES } from "@/types/overview";
import type { Tone } from "@/types/overview";

interface StatCardProps {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  value: string;
  note?: string;
  noteTone?: "success" | "muted" | "danger";
}

// Compact stat card for People & Fleets headers: a soft-tone icon tile beside a
// stacked label/value/note. Separate from the Overview KPI card on purpose.
export function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  note,
  noteTone = "success",
}: StatCardProps) {
  const t = TONE_STYLES[tone];

  return (
    <div className="flex min-w-0 items-start gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${t.soft} ${t.text}`}
      >
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
        {note ? (
          <p
            className={`mt-1 text-xs ${
              noteTone === "success"
                ? "text-success"
                : noteTone === "danger"
                  ? "text-danger"
                  : "text-ink-muted"
            }`}
          >
            {note}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function StatCardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
      {children}
    </div>
  );
}
