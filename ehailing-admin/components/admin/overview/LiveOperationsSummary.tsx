import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EM_DASH, formatNumber } from "@/lib/format";
import { TONE_STYLES } from "@/types/overview";
import type { LiveOperation } from "@/types/overview";

interface LiveOperationsSummaryProps {
  // null = the dashboard fetch has not landed yet (values render "—").
  data: LiveOperation[] | null;
}

// The dashboard endpoint provides only activeRides and searchingRides — the
// en-route / in-progress / delayed rows have no field here, so once loaded
// they render "Not available yet" instead of mock numbers.
export function LiveOperationsSummary({ data }: LiveOperationsSummaryProps) {
  const rows: LiveOperation[] = data ?? [];
  return (
    <Card
      title="Live Operations Summary"
      action={
        <Link
          href="/admin/live-operations"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
        >
          View live
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      }
    >
      <ul className="divide-y divide-border">
        {rows.map((item) => {
          const t = TONE_STYLES[item.tone];
          return (
            <li
              key={item.label}
              className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
            >
              <span className="flex items-center gap-2 text-sm text-ink-muted">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: t.var }}
                  aria-hidden="true"
                />
                {item.label}
              </span>
              {item.value === null ? (
                <span className="text-xs text-ink-muted">
                  {data === null ? EM_DASH : "Not available yet"}
                </span>
              ) : (
                <span className="text-sm font-bold text-ink">
                  {formatNumber(item.value)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
