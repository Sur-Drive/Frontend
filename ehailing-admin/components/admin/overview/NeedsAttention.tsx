import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { AttentionItem } from "@/types/overview";

interface NeedsAttentionProps {
  // Real items only (currently the pending driver approvals, backed by
  // dashboard.stats.pendingDriverApprovals); null until the dashboard fetch
  // has landed.
  data: AttentionItem[] | null;
  // The urgent count needs the delayed-ride and payment-failure sources,
  // which have no fields on the dashboard endpoint — null renders a neutral
  // "Not available yet" pill instead of a fabricated zero.
  urgentCount: number | null;
}

export function NeedsAttention({ data, urgentCount }: NeedsAttentionProps) {
  return (
    <Card
      title="Needs Attention"
      action={
        urgentCount === null ? (
          <span
            title="Not available yet"
            className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-muted"
          >
            <span className="size-1.5 rounded-full bg-ink-subtle" aria-hidden="true" />
            Not available yet
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-2.5 py-1 text-xs font-medium text-danger">
            <span className="size-1.5 rounded-full bg-danger" aria-hidden="true" />
            {urgentCount} urgent
          </span>
        )
      }
    >
      {data === null ? (
        <p className="py-10 text-center text-sm text-ink-muted">—</p>
      ) : (
        <ul className="divide-y divide-border">
          {data.map((item) => {
            const isWarning = item.level === "warning";
            const Icon = item.icon;
            return (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 py-3 first:pt-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                      isWarning
                        ? "bg-warning-soft text-warning"
                        : "bg-danger-soft text-danger"
                    }`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-ink-muted">{item.detail}</p>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-ink"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
          <li className="py-3 text-xs text-ink-muted">
            Delayed rides, payment failures and expiring documents — Not
            available yet
          </li>
        </ul>
      )}
    </Card>
  );
}
