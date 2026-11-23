"use client";

import { ChartLine } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { Insight } from "@/types/analytics";

interface OperationalInsightsCardProps {
  insights: Insight[];
}

// Four rows, each a yellow chart tile beside a bold title and a muted subline,
// divided by hairlines.
export function OperationalInsightsCard({
  insights,
}: OperationalInsightsCardProps) {
  // Rows come from endpoint-backed facts only (peak hour, completion leader);
  // the design's "Top city" / "Avg. resolution" rows have no source. An empty
  // list renders the availability note instead of an empty card body.
  return (
    <Card title="Operational insights">
      {insights.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-muted">
          Not available yet
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {insights.map((insight) => (
            <li key={insight.title} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning-soft text-warning"
              >
                <ChartLine className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{insight.title}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{insight.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
