"use client";

import { Card } from "@/components/ui/Card";

interface RevenuePerformanceProps {
  // Gross revenue for today (dashboard.stats.grossRevenueToday, naira).
  // "—" until the dashboard fetch has landed.
  total: string;
}

// The dashboard endpoint exposes only the day's gross revenue scalar — there
// is no hourly revenue series and no delta — so the card keeps its header with
// the real total and its chart slot carries the availability note.
export function RevenuePerformance({ total }: RevenuePerformanceProps) {
  return (
    <Card
      title="Revenue Performance"
      subtitle="Gross revenue today"
      action={
        <span className="text-xl font-normal text-ink">{total}</span>
      }
    >
      <p className="flex h-56 items-center justify-center text-center text-sm text-ink-muted sm:h-64 lg:h-72">
        Not available yet
      </p>
    </Card>
  );
}

