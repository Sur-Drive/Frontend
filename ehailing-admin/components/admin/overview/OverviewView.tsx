"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Car,
  Check,
  ChartLine,
  Clock,
  TriangleAlert,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RecordsError } from "@/components/admin/records/RecordsListState";
import { OverviewHeader } from "@/components/admin/overview/OverviewHeader";
import { KpiCard } from "@/components/admin/overview/KpiCard";
import { RideActivityTrend } from "@/components/admin/overview/RideActivityTrend";
import { RideCategoryDonut } from "@/components/admin/overview/RideCategoryDonut";
import { RevenuePerformance } from "@/components/admin/overview/RevenuePerformance";
import { DriverAvailability } from "@/components/admin/overview/DriverAvailability";
import { LiveOperationsSummary } from "@/components/admin/overview/LiveOperationsSummary";
import { RecentActivity } from "@/components/admin/overview/RecentActivity";
import { NeedsAttention } from "@/components/admin/overview/NeedsAttention";
import {
  failureMessage,
  fetchDashboard,
  mapDashboardCategories,
  mapDashboardKpis,
  mapHourlyActivity,
} from "@/lib/analytics";
import { EM_DASH, formatNumber, formatNairaCompact } from "@/lib/format";
import { CITY_SCOPE_LABELS } from "@/types/overview";
import type { CityScope, KpiData, LiveOperation } from "@/types/overview";
import type { DashboardResponse } from "@/types/analytics-api";

// Design metadata per KPI key (icon only — tone/value come from the mapper).
const KPI_ICONS: Record<string, LucideIcon> = {
  passengers: Users,
  drivers: User,
  "online-drivers": Activity,
  "active-rides": Car,
  "completed-rides": Check,
  "pending-approvals": Clock,
  "gross-revenue": Wallet,
  "pending-settlements": ChartLine,
};

// Values render "—" until the first response lands (loaded flag stays
// separate, so true zeros show as "0" once loaded).
const UNLOADED_KPIS: KpiData[] = [
  { key: "passengers", label: "Total Passengers", value: EM_DASH, tone: "brand" },
  { key: "drivers", label: "Registered Drivers", value: EM_DASH, tone: "warning" },
  { key: "online-drivers", label: "Online Drivers", value: EM_DASH, tone: "success" },
  { key: "active-rides", label: "Active Rides", value: EM_DASH, tone: "info" },
  { key: "completed-rides", label: "Completed Today", value: EM_DASH, tone: "brand" },
  { key: "pending-approvals", label: "Pending Driver Approvals", value: EM_DASH, tone: "warning" },
  { key: "gross-revenue", label: "Gross Revenue Today", value: EM_DASH, tone: "success" },
  { key: "pending-settlements", label: "Pending Settlements", value: EM_DASH, tone: "warning" },
];

// Live-ops rows without a dashboard field keep their labels; values fill in
// as "—" before the fetch and "Not available yet" once loaded.
const LIVE_ROWS: LiveOperation[] = [
  { label: "Active rides", value: null, tone: "brand" },
  { label: "Searching", value: null, tone: "warning" },
  { label: "Drivers en route", value: null, tone: "info" },
  { label: "In progress", value: null, tone: "success" },
  { label: "Delayed rides", value: null, tone: "danger" },
];

// Client shell for the dashboard. The city scope drives the header copy and
// the fetch (?city=), so the board lives under one useState here and the
// route file stays a server component that exports its metadata.
export function OverviewView() {
  const [scope, setScope] = useState<CityScope>("all");
  const [dash, setDash] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const settled = (cause: unknown): boolean =>
      cancelled || (cause instanceof Error && cause.name === "AbortError");

    fetchDashboard(
      scope === "all" ? null : CITY_SCOPE_LABELS[scope],
      controller.signal,
    )
      .then((raw) => {
        if (cancelled) return;
        setDash(raw);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (settled(cause)) return;
        setError(failureMessage(cause));
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [scope, reloadKey]);

  // Scope changes and retries reset the board from the event handler; the
  // effect above then refetches for the new key.
  function handleScopeChange(next: CityScope) {
    setScope(next);
    setDash(null);
    setError(null);
  }

  function handleRetry() {
    setDash(null);
    setError(null);
    setReloadKey((key) => key + 1);
  }

  const city = scope === "all" ? null : CITY_SCOPE_LABELS[scope];
  const kpis = dash ? mapDashboardKpis(dash) : UNLOADED_KPIS;
  const categories = dash ? mapDashboardCategories(dash) : null;
  const categorySlices = categories?.slices ?? [];
  const categoryTotal = categorySlices.reduce(
    (sum, slice) => sum + slice.count,
    0,
  );
  const liveRows: LiveOperation[] = dash
    ? [
        { label: "Active rides", value: dash.stats.activeRides, tone: "brand" },
        { label: "Searching", value: dash.stats.searchingRides, tone: "warning" },
        { label: "Drivers en route", value: null, tone: "info" },
        { label: "In progress", value: null, tone: "success" },
        { label: "Delayed rides", value: null, tone: "danger" },
      ]
    : LIVE_ROWS;
  const attentionItems = dash
    ? [
        {
          title: `${formatNumber(dash.stats.pendingDriverApprovals)} driver applications`,
          detail: "Awaiting verification",
          level: "warning" as const,
          count: dash.stats.pendingDriverApprovals,
          href: "/admin/verification-centre",
          icon: TriangleAlert,
        },
      ]
    : null;

  return (
    <div>
      <OverviewHeader scope={scope} onScopeChange={handleScopeChange} />

      {error ? (
        <div className="mt-4">
          <RecordsError message={error} onRetry={handleRetry} />
        </div>
      ) : null}

      <div className="mt-7 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.key}
            icon={KPI_ICONS[kpi.key]}
            tone={kpi.tone}
            label={kpi.label}
            value={kpi.value}
            note={kpi.note}
            noteTone={kpi.noteTone}
          />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <RideActivityTrend
            data={dash ? mapHourlyActivity(dash) : null}
            title={`${CITY_SCOPE_LABELS[scope]} ride activity`}
            subtitle={
              city
                ? `Ride requests per hour today in ${city}`
                : "Ride requests per hour today"
            }
          />
        </div>
        <div className="min-w-0">
          <RideCategoryDonut
            data={categorySlices}
            total={categoryTotal}
            unavailable={categories ? !categories.shapeKnown : false}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <RevenuePerformance
            total={
              dash ? formatNairaCompact(dash.stats.grossRevenueToday) : EM_DASH
            }
          />
        </div>
        <div className="min-w-0">
          <DriverAvailability total={dash ? dash.stats.onlineDrivers : null} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0">
          {/* No new-registrations-by-day endpoint exists on the dashboard. */}
          <Card title="Passenger Growth">
            <p className="flex h-40 items-center justify-center text-center text-sm text-ink-muted">
              Not available yet
            </p>
          </Card>
        </div>
        <div className="min-w-0">
          <LiveOperationsSummary data={liveRows} />
        </div>
        <div className="min-w-0">
          <RecentActivity data={null} />
        </div>
        <div className="min-w-0">
          <NeedsAttention data={attentionItems} urgentCount={null} />
        </div>
      </div>
    </div>
  );
}
