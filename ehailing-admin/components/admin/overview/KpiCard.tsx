import { ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { TONE_STYLES } from "@/types/overview";
import type { Tone } from "@/types/overview";

interface KpiCardProps {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  value: string;
  note?: string;
  noteTone?: "success" | "muted";
}

export function KpiCard({
  icon: Icon,
  tone,
  label,
  value,
  note,
  noteTone,
}: KpiCardProps) {
  const t = TONE_STYLES[tone];
  return (
    <Card>
      <span
        className={`flex size-9 items-center justify-center rounded-xl ${t.soft} ${t.text}`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm text-ink-muted">{label}</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
        <p className="text-2xl font-semibold text-ink">{value}</p>
        {note ? (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              noteTone === "success" ? "text-success" : "text-ink-muted"
            }`}
          >
            {noteTone === "success" ? (
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            ) : null}
            {note}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
