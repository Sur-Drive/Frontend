"use client";

import { Card } from "@/components/ui/Card";

// No endpoint provides a this-week/last-week comparison (the analytics deltas
// compare against the preceding equal-length period, not week bars), so the
// card keeps its design slot with the app's availability note.
export function WeeklyPerformanceCard() {
  return (
    <Card title="Weekly performance comparison">
      <p className="flex h-40 items-center justify-center text-center text-sm text-ink-muted">
        Not available yet
      </p>
    </Card>
  );
}
