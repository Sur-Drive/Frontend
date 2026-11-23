import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { ActivityEntry } from "@/types/overview";

interface RecentActivityProps {
  // The dashboard endpoint has no recent-activity field, so this stays null:
  // the card keeps its slot and the "View all" link with an availability note.
  data: ActivityEntry[] | null;
}

export function RecentActivity({ data }: RecentActivityProps) {
  return (
    <Card
      title="Recent Activity"
      action={
        <Link
          href="/admin/activity-logs"
          className="text-xs font-medium text-brand hover:underline"
        >
          View all
        </Link>
      }
    >
      {data === null || data.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-muted">
          Not available yet
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {data.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.title}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {item.title}
                  </p>
                  <p className="truncate text-xs text-ink-muted">{item.detail}</p>
                </div>
                <span className="shrink-0 text-xs text-ink-subtle">{item.time}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
