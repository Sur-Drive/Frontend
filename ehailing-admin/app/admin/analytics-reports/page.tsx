import type { Metadata } from "next";
import { AnalyticsReportsView } from "@/components/admin/analytics/AnalyticsReportsView";
import {
  isCategory,
  isCity,
  isPeriod,
  parseAnalyticsRange,
} from "@/types/analytics";

export const metadata: Metadata = {
  title: "Analytics & Reports | SUR-DRIVEHT Admin",
};

interface AnalyticsPageProps {
  searchParams?: Promise<{
    category?: string | string[];
    period?: string | string[];
    city?: string | string[];
    from?: string | string[];
    to?: string | string[];
  }>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AnalyticsReportsPage({
  searchParams,
}: AnalyticsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const categoryParam = first(params?.category);
  const periodParam = first(params?.period);
  const cityParam = first(params?.city);

  return (
    <AnalyticsReportsView
      initialFilters={{
        category: isCategory(categoryParam) ? categoryParam : "ride",
        period: isPeriod(periodParam) ? periodParam : "custom",
        city: isCity(cityParam) ? cityParam : "All cities",
      }}
      // Server-validated: invalid, missing or reversed ?from/?to fall back to
      // the last 14 days.
      initialRange={parseAnalyticsRange(first(params?.from), first(params?.to))}
    />
  );
}
