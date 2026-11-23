"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard, StatCardGrid } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { RecordsError } from "@/components/admin/records/RecordsListState";
import { DateRangeControls } from "@/components/admin/analytics/DateRangeControls";
import { CategoryTabs } from "@/components/admin/analytics/CategoryTabs";
import { AnalyticsTrendCard } from "@/components/admin/analytics/AnalyticsTrendCard";
import { CategoryDistributionCard } from "@/components/admin/analytics/CategoryDistributionCard";
import { OperationalInsightsCard } from "@/components/admin/analytics/OperationalInsightsCard";
import { WeeklyPerformanceCard } from "@/components/admin/analytics/WeeklyPerformanceCard";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { downloadCsv } from "@/lib/csv";
import {
  buildDriverViewCsv,
  buildFinancialViewCsv,
  buildPassengerViewCsv,
  buildReportCsv,
  buildRideViewCsv,
  buildSafetyViewCsv,
  failureMessage,
  fetchDriverAnalytics,
  fetchFinancialAnalytics,
  fetchPassengerAnalytics,
  fetchReportPayloads,
  fetchRideAnalytics,
  fetchRideTrend,
  fetchSafetyAnalytics,
  mapDriverDistribution,
  mapDriverStats,
  mapFinancialInsights,
  mapFinancialStats,
  mapPassengerDistribution,
  mapPassengerStats,
  mapRideDistribution,
  mapRideInsights,
  mapRideStats,
  mapRideTrend,
  mapSafetyDistribution,
  mapSafetyStats,
} from "@/lib/analytics";
import { EM_DASH } from "@/lib/format";
import { toast } from "@/lib/toast-store";
import { CITIES, CATEGORY_META, isCity, STAT_ICON } from "@/types/analytics";
import type {
  AnalyticsDistribution,
  AnalyticsRange,
  AnalyticsStatData,
  AnalyticsTrend,
  CategoryId,
  CityId,
  Insight,
  PeriodId,
} from "@/types/analytics";
import type {
  DriverAnalyticsResponse,
  FinancialAnalyticsResponse,
  PassengerAnalyticsResponse,
  SafetyAnalyticsResponse,
} from "@/types/analytics-api";

interface AnalyticsFilters {
  category: CategoryId;
  period: PeriodId;
  city: CityId;
}

// One loaded analytics tab: raw responses are kept so the CSV export mirrors
// exactly what the screen shows. `trend`/`distribution` are null when the
// endpoint has no such data (only ride has a trend; financial has no
// distribution) and the matching card then renders "Not available yet".
interface AnalyticsPanel {
  stats: AnalyticsStatData[];
  trend: AnalyticsTrend | null;
  distribution: AnalyticsDistribution | null;
  insights: Insight[];
  csv: () => string;
}

// City filtering is documented only for the ride and financial endpoints;
// the other tabs fetch platform-wide and their selector stays disabled.
function citySupportsFilter(category: CategoryId): boolean {
  return category === "ride" || category === "financial";
}

function appliedCity(category: CategoryId, city: CityId): string | null {
  return citySupportsFilter(category) && city !== "All cities" ? city : null;
}

const DISTRIBUTION_TITLES: Record<CategoryId, string> = {
  ride: "Category distribution",
  driver: "Driver status distribution",
  passenger: "Passenger status distribution",
  financial: "Category distribution",
  safety: "Incident type distribution",
};

// "—" placeholders with the right labels per tab (mappers accept null).
function statPlaceholders(category: CategoryId): AnalyticsStatData[] {
  switch (category) {
    case "driver":
      return mapDriverStats(null);
    case "passenger":
      return mapPassengerStats(null);
    case "financial":
      return mapFinancialStats(null);
    case "safety":
      return mapSafetyStats(null);
    default:
      return [
        { key: "requests", label: "Total Requests", value: EM_DASH, delta: "", improving: true, tone: "brand" },
        { key: "completed", label: "Completed Rides", value: EM_DASH, delta: "", improving: true, tone: "success" },
        { key: "cancellation", label: "Cancellation Rate", value: EM_DASH, delta: "", improving: true, tone: "warning" },
        { key: "duration", label: "Avg. Trip Duration", value: EM_DASH, delta: "", improving: true, tone: "info" },
      ];
  }
}

function ChartPlaceholder({
  title,
  subtitle,
  loading,
}: {
  title: string;
  subtitle?: string;
  loading: boolean;
}) {
  return (
    <Card title={title} subtitle={subtitle}>
      <p className="flex h-56 items-center justify-center text-center text-sm text-ink-muted sm:h-64 lg:h-72">
        {loading ? "Loading…" : "—"}
      </p>
    </Card>
  );
}

function NotAvailableCard({ title }: { title: string }) {
  return (
    <Card title={title}>
      <p className="flex h-56 items-center justify-center text-center text-sm text-ink-muted sm:h-64 lg:h-72">
        Not available yet
      </p>
    </Card>
  );
}

interface AnalyticsReportsViewProps {
  initialFilters: AnalyticsFilters;
  initialRange: AnalyticsRange;
}

// System > Analytics & Reports. Filter state lives in the URL (?category=
// &period=&city=&from=&to=), seeded by the server page and updated with
// router.replace. The custom range is server-validated before it reaches here.
export function AnalyticsReportsView({
  initialFilters,
  initialRange,
}: AnalyticsReportsViewProps) {
  const router = useRouter();
  const confirmedExport = useConfirmedExport();
  const [panel, setPanel] = useState<AnalyticsPanel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const settled = (cause: unknown): boolean =>
      cancelled || (cause instanceof Error && cause.name === "AbortError");

    const category = initialFilters.category;
    const city = appliedCity(category, initialFilters.city);
    const range = { from: initialRange.from, to: initialRange.to };

    const load: Promise<AnalyticsPanel> =
      category === "ride"
        ? Promise.all([
            fetchRideAnalytics(range, city, controller.signal),
            fetchRideTrend(range, city, controller.signal),
          ]).then(([raw, trendRaw]) => ({
            stats: mapRideStats(raw),
            trend: mapRideTrend(raw, trendRaw, city),
            distribution: mapRideDistribution(raw),
            insights: mapRideInsights(raw),
            csv: () => buildRideViewCsv(raw, trendRaw, city),
          }))
      : category === "driver"
        ? fetchDriverAnalytics(range, controller.signal).then(
            (raw: DriverAnalyticsResponse) => ({
              stats: mapDriverStats(raw),
              trend: null,
              distribution: mapDriverDistribution(raw),
              insights: [],
              csv: () => buildDriverViewCsv(raw),
            }),
          )
      : category === "passenger"
        ? fetchPassengerAnalytics(range, controller.signal).then(
            (raw: PassengerAnalyticsResponse) => ({
              stats: mapPassengerStats(raw),
              trend: null,
              distribution: mapPassengerDistribution(raw),
              insights: [],
              csv: () => buildPassengerViewCsv(raw),
            }),
          )
      : category === "financial"
        ? fetchFinancialAnalytics(range, city, controller.signal).then(
            (raw: FinancialAnalyticsResponse) => ({
              stats: mapFinancialStats(raw),
              trend: null,
              distribution: null,
              insights: mapFinancialInsights(raw),
              csv: () => buildFinancialViewCsv(raw),
            }),
          )
      : fetchSafetyAnalytics(range, controller.signal).then(
          (raw: SafetyAnalyticsResponse) => ({
            stats: mapSafetyStats(raw),
            trend: null,
            distribution: mapSafetyDistribution(raw),
            insights: [],
            csv: () => buildSafetyViewCsv(raw),
          }),
        );

    load
      .then((next) => {
        if (cancelled) return;
        setPanel(next);
        setError(null);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (settled(cause)) return;
        setError(failureMessage(cause));
        setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    initialFilters.category,
    initialFilters.city,
    initialRange.from,
    initialRange.to,
    reloadKey,
  ]);

  function update(
    patch: Partial<AnalyticsFilters> & { from?: string; to?: string },
  ) {
    const next = { ...initialFilters, ...patch };
    // Reset from the event handler; the effect refetches for the new URL.
    setPanel(null);
    setError(null);
    setLoading(true);
    const params = new URLSearchParams({
      category: next.category,
      period: next.period,
      city: next.city,
    });
    if (next.period === "custom") {
      // Keep the pinned range when only other filters change; an explicit
      // patch (new selection) wins.
      params.set("from", patch.from ?? initialRange.from);
      params.set("to", patch.to ?? initialRange.to);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function handleDateChange(from: string, to: string) {
    update({ period: "custom", from, to });
  }

  function handleRetry() {
    setPanel(null);
    setError(null);
    setLoading(true);
    setReloadKey((key) => key + 1);
  }

  // Filenames carry the concrete range so two exports never overwrite each
  // other's names; the CSV is built from the same raw payload the screen shows.
  function handleExport() {
    if (!panel) return;
    confirmedExport.requestExport("Confirm export", () => {
      downloadCsv(
        `analytics-${initialFilters.category}-${initialRange.from}_${initialRange.to}.csv`,
        panel.csv(),
      );
    });
  }

  // All five categories now load, so the report export fetches every endpoint
  // for the current range (city only where documented) and downloads one CSV.
  // The download happens after the async fetches complete; a failure surfaces
  // through the error toast instead of the success one.
  function handleExportReport() {
    const city = appliedCity(initialFilters.category, initialFilters.city);
    confirmedExport.requestExport("Confirm export report", () => {
      fetchReportPayloads(
        { from: initialRange.from, to: initialRange.to },
        city,
      )
        .then((payloads) => {
          downloadCsv(
            `analytics-report-${initialRange.from}_${initialRange.to}.csv`,
            buildReportCsv(payloads, city),
          );
        })
        .catch((cause: unknown) => {
          toast.error({
            title: "Export failed",
            description: failureMessage(cause),
          });
        });
    });
  }

  return (
    <div>
      <PageHeader
        title="Analytics & Reports"
        description="Understand platform growth, operations, finance and safety performance."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={!panel}
            >
              <Download className="size-4" aria-hidden="true" />
              Export
            </Button>
            {/* All five categories load: the report fetches each one for the
                current range on confirm. */}
            <Button variant="primary" onClick={handleExportReport}>
              <Plus className="size-4" aria-hidden="true" />
              Export report
            </Button>
          </>
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <DateRangeControls
          from={initialRange.from}
          to={initialRange.to}
          onChange={handleDateChange}
        />
        {/* Only ride and financial document a city filter; on the other tabs
            the selector keeps its slot, disabled. */}
        {citySupportsFilter(initialFilters.category) ? (
          <Select
            label="Filter by city"
            className="w-40"
            value={initialFilters.city}
            onChange={(event) => {
              const city = event.target.value;
              if (isCity(city)) update({ city });
            }}
          >
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>
        ) : (
          <span title="Not available yet" className="inline-block">
            <Select
              label="Filter by city"
              className="w-40"
              value={initialFilters.city}
              onChange={() => undefined}
              disabled
            >
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </Select>
          </span>
        )}
      </div>

      <div className="mt-4">
        <CategoryTabs
          value={initialFilters.category}
          onChange={(category) => update({ category })}
        />
      </div>

      <div
        id="analytics-panel"
        role="tabpanel"
        aria-labelledby={`analytics-tab-${initialFilters.category}`}
        className="mt-5"
      >
        {error ? (
          <div className="mb-4">
            <RecordsError message={error} onRetry={handleRetry} />
          </div>
        ) : null}

        <StatCardGrid>
          {(panel ? panel.stats : statPlaceholders(initialFilters.category)).map(
            (stat) => (
              <StatCard
                key={stat.key}
                icon={STAT_ICON}
                tone={stat.tone}
                label={stat.label}
                value={stat.value}
                note={stat.delta || undefined}
                noteTone={
                  stat.flat ? "muted" : stat.improving ? "success" : "danger"
                }
              />
            ),
          )}
        </StatCardGrid>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            {initialFilters.category === "ride" ? (
              panel ? (
                <AnalyticsTrendCard trend={panel.trend as AnalyticsTrend} />
              ) : (
                <ChartPlaceholder
                  title="Ride demand by hour"
                  subtitle={`${initialRange.from} to ${initialRange.to}`}
                  loading={loading}
                />
              )
            ) : (
              // Only the ride endpoint has a trend series; the other tabs keep
              // the card slot with the availability note.
              <NotAvailableCard
                title={`${CATEGORY_META[initialFilters.category].label} trend`}
              />
            )}
          </div>
          <div className="min-w-0">
            {panel && panel.distribution ? (
              <CategoryDistributionCard distribution={panel.distribution} />
            ) : panel ? (
              <NotAvailableCard title={DISTRIBUTION_TITLES[initialFilters.category]} />
            ) : (
              <ChartPlaceholder
                title={DISTRIBUTION_TITLES[initialFilters.category]}
                loading={loading}
              />
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <div className="min-w-0 lg:col-span-2">
            {panel ? (
              <OperationalInsightsCard insights={panel.insights} />
            ) : (
              <ChartPlaceholder title="Operational insights" loading={loading} />
            )}
          </div>
          <div className="min-w-0 lg:col-span-3">
            <WeeklyPerformanceCard />
          </div>
        </div>
      </div>

      {confirmedExport.dialog}
    </div>
  );
}
