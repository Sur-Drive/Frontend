"use client";

import { useEffect, useRef, useState } from "react";
import type { HTMLAttributes } from "react";
import { MoreHorizontal, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { PersonCell } from "@/components/ui/PersonCell";
import { StatusPill } from "@/components/ui/StatusPill";
import { Th, Td } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import {
  RecordsError,
  RecordsSkeleton,
} from "@/components/admin/records/RecordsListState";
import { RideDetailsDrawer } from "@/components/admin/rides/RideDetailsDrawer";
import {
  fetchRideOverview,
  fetchRidePayment,
  fetchRideTimeline,
} from "@/lib/rides";
import { buildLiveRideDetails } from "@/lib/ride-details";
import { rideCategoryDisplay, rideStatusDisplay } from "@/types/rides";
import type { LiveQueueRow } from "@/types/live-operations";
import type {
  RideOverviewResponse,
  RidePaymentResponse,
  RideTimelineEntry,
} from "@/types/rides-api";

// Status filter values are the documented rideStatus param
// (requested … ride_in_progress). The list is never
// treated as exhaustive: rows carry the raw backend value and render through
// rideStatusDisplay(), so an unknown status still gets a neutral humanised
// chip.
const ALL = "all";
const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All statuses", value: ALL },
  { label: "Requested", value: "requested" },
  { label: "Searching", value: "searching" },
  { label: "Driver assigned", value: "driver_assigned" },
  { label: "Driver en route", value: "driver_en_route" },
  { label: "Driver arrived", value: "driver_arrived" },
  { label: "Ride started", value: "ride_started" },
  { label: "Ride in progress", value: "ride_in_progress" },
];

const COLUMNS = [
  "Ride ID",
  "Passenger",
  "Driver",
  "Pickup",
  "Destination",
  "Category",
  "Status",
];

// Raw backend status -> display via rideStatusDisplay (unknown values get a
// neutral humanised chip). isDelayed renders as an extra danger pill, the
// affordance the mock queue used to show as a "Delayed" status.
function StatusCell({ ride }: { ride: LiveQueueRow }) {
  const display = rideStatusDisplay(ride.status);
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <StatusPill tone={display.tone} label={display.label} />
      {ride.isDelayed ? <StatusPill tone="danger" label="Delayed" /> : null}
    </span>
  );
}

interface LiveRideQueueProps {
  rides: LiveQueueRow[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  // Backend message or friendly network text; first-load failure shows the
  // full error card, a failed refresh keeps the rows + a stale banner.
  error: string | null;
  // True once any page fetch has succeeded (even with zero rows).
  loadedOnce: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}


export function LiveRideQueue({
  rides,
  total,
  page,
  pageSize,
  loading,
  error,
  loadedOnce,
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  onPageChange,
  onRetry,
}: LiveRideQueueProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Drawer data, fetched lazily on open from the rides endpoints (live ids
  // come straight from the live-operations items; verified 2026-11-12).
  // Same pattern as RideManagementView: overview on open, timeline/payment
  // on tab switch, each with its own loading/error + Retry.
  const [detailState, setDetailState] = useState<{
    id: string | null;
    loading: boolean;
    error: string | null;
    data: RideOverviewResponse | null;
  }>({ id: null, loading: false, error: null, data: null });
  const [detailRetry, setDetailRetry] = useState(0);
  const [tabTimeline, setTabTimeline] = useState<{
    loaded: boolean;
    loading: boolean;
    error: string | null;
    entries: RideTimelineEntry[] | null;
  }>({ loaded: false, loading: false, error: null, entries: null });
  const [tabPayment, setTabPayment] = useState<{
    loaded: boolean;
    loading: boolean;
    error: string | null;
    payment: RidePaymentResponse | null;
  }>({ loaded: false, loading: false, error: null, payment: null });
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const tabFetchEpochRef = useRef(0);

  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    let cancelled = false;
    fetchRideOverview(selectedId, controller.signal)
      .then((data) => {
        if (cancelled) return;
        setDetailState({ id: selectedId, loading: false, error: null, data });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (cause instanceof Error && cause.name === "AbortError") return;
        setDetailState({
          id: selectedId,
          loading: false,
          error:
            cause instanceof Error && cause.message
              ? cause.message
              : "Request failed. Please try again.",
          data: null,
        });
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedId, detailRetry]);

  function openRide(id: string) {
    // Rows only carry ids the backend returned, so every row opens the
    // drawer; a failed overview fetch surfaces inside it with Retry.
    tabFetchEpochRef.current += 1;
    setTabTimeline({ loaded: false, loading: false, error: null, entries: null });
    setTabPayment({ loaded: false, loading: false, error: null, payment: null });
    setActiveTabId(null);
    setSelectedId(id);
    setDetailState({ id, loading: true, error: null, data: null });
  }

  function closeRide() {
    tabFetchEpochRef.current += 1;
    setSelectedId(null);
    setDetailState({ id: null, loading: false, error: null, data: null });
  }

  function retryDetail() {
    setDetailState((current) => ({ ...current, loading: true, error: null }));
    setDetailRetry((token) => token + 1);
  }

  async function fetchTabData(tabId: string) {
    const epoch = tabFetchEpochRef.current;
    if (!selectedId) return;
    if (tabId === "timeline") {
      setTabTimeline((current) => ({ ...current, loading: true, error: null }));
      try {
        const res = await fetchRideTimeline(selectedId);
        if (epoch !== tabFetchEpochRef.current) return;
        setTabTimeline({ loaded: true, loading: false, error: null, entries: res.entries ?? [] });
      } catch (cause) {
        if (epoch !== tabFetchEpochRef.current) return;
        setTabTimeline({
          loaded: true,
          loading: false,
          error:
            cause instanceof Error && cause.message
              ? cause.message
              : "Request failed. Please try again.",
          entries: null,
        });
      }
      return;
    }
    if (tabId === "payment") {
      setTabPayment((current) => ({ ...current, loading: true, error: null }));
      try {
        const res = await fetchRidePayment(selectedId);
        if (epoch !== tabFetchEpochRef.current) return;
        setTabPayment({ loaded: true, loading: false, error: null, payment: res });
      } catch (cause) {
        if (epoch !== tabFetchEpochRef.current) return;
        setTabPayment({
          loaded: true,
          loading: false,
          error:
            cause instanceof Error && cause.message
              ? cause.message
              : "Request failed. Please try again.",
          payment: null,
        });
      }
      return;
    }
    if (epoch !== tabFetchEpochRef.current) return;
    setActiveTabId(tabId);
  }

  function onTabChange(tabId: string) {
    setActiveTabId(tabId);
    if (tabId === "timeline" && !tabTimeline.loaded) {
      void fetchTabData(tabId);
    } else if (tabId === "payment" && !tabPayment.loaded) {
      void fetchTabData(tabId);
    }
  }

  function retryTab() {
    if (activeTabId === "timeline") {
      setTabTimeline((current) => ({ ...current, loading: true, error: null }));
      void fetchTabData("timeline");
    } else if (activeTabId === "payment") {
      setTabPayment((current) => ({ ...current, loading: true, error: null }));
      void fetchTabData("payment");
    }
  }

  const detailLoading =
    detailState.loading ||
    (activeTabId === "timeline" && tabTimeline.loading) ||
    (activeTabId === "payment" && tabPayment.loading);
  const detailError =
    detailState.error || tabTimeline.error || tabPayment.error;
  const onDrawerRetry = () => {
    if (detailState.error) retryDetail();
    else if (tabTimeline.error || tabPayment.error) retryTab();
  };

  const details = selectedId
    ? buildLiveRideDetails({
        overview: detailState.data,
        timelineEntries: tabTimeline.entries,
        payment: tabPayment.payment,
      })
    : null;


  function rowProps(ride: LiveQueueRow): HTMLAttributes<HTMLTableRowElement> {
    return {
      tabIndex: 0,
      onClick: () => openRide(ride.id),
      onKeyDown: (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openRide(ride.id);
        }
      },
      className:
        "cursor-pointer transition-colors hover:bg-brand-soft/40 focus-visible:bg-brand-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset",
    };
  }

  function cardProps(ride: LiveQueueRow): HTMLAttributes<HTMLLIElement> {
    return {
      role: "button",
      tabIndex: 0,
      onClick: () => openRide(ride.id),
      onKeyDown: (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openRide(ride.id);
        }
      },
      className:
        "w-full cursor-pointer text-left transition-colors hover:bg-brand-soft/40 focus-visible:bg-brand-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
    };
  }

  const actionsButton = (id: string) => (
    <button
      type="button"
      aria-label={`Open details for ride ${id}`}
      onClick={(event) => {
        event.stopPropagation();
        openRide(id);
      }}
      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <MoreHorizontal className="size-4" aria-hidden="true" />
    </button>
  );

  return (
    <Card className="min-w-0">
      <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-base font-normal text-ink">
            Live Ride Queue
          </h2>
          <p className="mt-0.5 text-xs text-ink-subtle">
            Rides currently active across Lagos
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search rides"
              placeholder="Search rides..."
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-base text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>
          <Select
            label="Filter by status"
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
            className="w-full sm:w-44"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </header>

      {loading && rides.length === 0 && !error ? (
        <RecordsSkeleton />
      ) : error && !loadedOnce ? (
        <RecordsError message={error} onRetry={onRetry} />
      ) : (
        <>
          {/* Failed refresh: keep the last good rows and show a small stale
              banner instead of a full error screen. */}
          {error && loadedOnce ? (
            <div
              role="status"
              className="mb-3 flex flex-col gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="min-w-0 text-xs text-ink-muted">
                Refresh failed — showing last data. {error}
              </p>
              <Button
                variant="secondary"
                onClick={onRetry}
                className="shrink-0 self-start sm:self-auto"
              >
                Retry
              </Button>
            </div>
          ) : null}
          {rides.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              No rides match your filters.
            </p>
          ) : (
            <>
          {/* Desktop: table. Only this wrapper scrolls, never the page. */}
          <div className="hidden w-full max-w-full min-w-0 overflow-x-auto lg:block">
            <table className="w-full min-w-190 border-collapse text-left">
              <thead>
                <tr className="bg-surface-muted">
                  {COLUMNS.map((heading) => (
                    <Th key={heading}>{heading}</Th>
                  ))}
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rides.map((ride) => (
                  <tr key={ride.id} {...rowProps(ride)}>
                    <Td className="whitespace-nowrap text-sm text-ink-muted">
                      {ride.id}
                    </Td>
                    <Td>
                      <PersonCell person={ride.passenger} />
                    </Td>
                    <Td>
                      <PersonCell person={ride.driver} />
                    </Td>
                    <Td className="whitespace-nowrap text-sm text-ink-muted">
                      {ride.pickup}
                    </Td>
                    <Td className="whitespace-nowrap text-sm text-ink-muted">
                      {ride.destination}
                    </Td>
                    <Td className="whitespace-nowrap text-sm text-ink-muted">
                      {rideCategoryDisplay(ride.category)}
                    </Td>
                    <Td>
                      <StatusCell ride={ride} />
                    </Td>
                    <Td className="text-right">{actionsButton(ride.id)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile and tablet: cards. */}
          <ul className="flex flex-col gap-3 lg:hidden">
            {rides.map((ride) => (
              <li
                key={ride.id}
                className="rounded-xl border border-border p-4"
                {...cardProps(ride)}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-ink-muted">{ride.id}</span>
                  <div className="flex items-center gap-2">
                    <StatusCell ride={ride} />
                    {actionsButton(ride.id)}
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2.5">
                  <PersonCell person={ride.passenger} caption="Passenger" />
                  <PersonCell person={ride.driver} caption="Driver" />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-ink-muted">
                    {ride.pickup} → {ride.destination}
                  </span>
                  <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-ink-muted">
                    {rideCategoryDisplay(ride.category)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={onPageChange}
              />
            </>
          )}
        </>
      )}

      <RideDetailsDrawer
        details={details ? { ...details, id: details.id || selectedId || "" } : null}
        onClose={closeRide}
        onTabChange={onTabChange}
        detailState={{
          loading: detailLoading,
          error: detailError,
          onRetry: onDrawerRetry,
        }}
      />
    </Card>
  );
}
