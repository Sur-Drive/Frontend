"use client";

import { useEffect, useRef, useState } from "react";
import type { HTMLAttributes } from "react";
import { Download, MoreHorizontal } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { PersonCell } from "@/components/ui/PersonCell";
import { StatusPill } from "@/components/ui/StatusPill";
import { Th, Td } from "@/components/ui/DataTable";
import { Pagination, PAGE_SIZE } from "@/components/ui/Pagination";
import { FilterPopover } from "@/components/ui/FilterPopover";
import { PageHeader } from "@/components/admin/PageHeader";
import { RecordsToolbar } from "@/components/admin/RecordsToolbar";
import type { Column } from "@/components/admin/records/RecordsTable";
import {
  RecordsError,
  RecordsSkeleton,
} from "@/components/admin/records/RecordsListState";
import { RideDetailsDrawer } from "@/components/admin/rides/RideDetailsDrawer";
import {
  fetchRideOverview,
  fetchRidePayment,
  fetchRideTimeline,
  fetchRidesPage,
  formatRideFare,
  mapRideListItem,
} from "@/lib/rides";
import { buildLiveRideDetails } from "@/lib/ride-details";
import { useRecordsQuery } from "@/lib/hooks/useRecordsQuery";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { downloadCsv, toCsv } from "@/lib/csv";
import {
  paymentStatusDisplay,
  rideCategoryDisplay,
  rideStatusDisplay,
} from "@/types/rides";
import type { Ride } from "@/types/rides";
import type { RideOverviewResponse, RidePaymentResponse, RideTimelineEntry } from "@/types/rides-api";

const ALL = "all";
const ALL_STATUSES_LABEL = "All statuses";
const ALL_CATEGORIES_LABEL = "All categories";
const ALL_PAYMENTS_LABEL = "All payments";

const STATUS_ENTRIES: { label: string; value: string }[] = [
  { label: ALL_STATUSES_LABEL, value: ALL },
  { label: "Paid", value: "paid" },
  { label: "Cancelled", value: "cancelled" },
  { label: "No drivers found", value: "no_drivers_found" },
  { label: "Payment pending", value: "payment_pending" },
  { label: "Driver en route", value: "driver_en_route" },
  { label: "Ride in progress", value: "ride_in_progress" },
];
const CATEGORY_ENTRIES: { label: string; value: string }[] = [
  { label: ALL_CATEGORIES_LABEL, value: ALL },
  { label: "Economy", value: "economy" },
  { label: "Comfort", value: "comfort" },
  { label: "SUV", value: "suv" },
];
const PAYMENT_ENTRIES: { label: string; value: string }[] = [
  { label: ALL_PAYMENTS_LABEL, value: ALL },
  { label: "Paid", value: "paid" },
  { label: "Unpaid", value: "unpaid" },
];

const STATUS_BY_LABEL = Object.fromEntries(
  STATUS_ENTRIES.map((entry) => [entry.label, entry.value]),
);
const CATEGORY_BY_LABEL = Object.fromEntries(
  CATEGORY_ENTRIES.map((entry) => [entry.label, entry.value]),
);
const PAYMENT_BY_LABEL = Object.fromEntries(
  PAYMENT_ENTRIES.map((entry) => [entry.label, entry.value]),
);

const CSV_COLUMNS = [
  "Ride ID",
  "Passenger",
  "Driver",
  "Pickup",
  "Destination",
  "Category",
  "Fare (NGN)",
  "Payment status",
  "Ride status",
  "Date",
];

interface RideManagementViewProps {
  initialRideId?: string;
}

export function RideManagementView({ initialRideId }: RideManagementViewProps) {
  const confirmedExport = useConfirmedExport();
  const initialRef = useRef(initialRideId);

  const {
    query,
    setQuery,
    filterValues,
    setFilter,
    clearFilters,
    activeFilterCount,
    page,
    setPage,
    rows,
    total,
    loading,
    error,
    retry,
  } = useRecordsQuery<Ride>({
    filterKeys: ["rideStatus", "category", "paymentStatus"],
    fetchPage: async ({ page: nextPage, pageSize, query: search, filters }) => {
      const result = await fetchRidesPage(
        {
          page: nextPage,
          limit: pageSize,
          search: search.trim() || undefined,
          rideStatus: filters.rideStatus !== ALL ? filters.rideStatus : undefined,
          category: filters.category !== ALL ? filters.category : undefined,
          paymentStatus: filters.paymentStatus !== ALL ? filters.paymentStatus : undefined,
        },
        undefined,
      );
      return {
        items: result.items.map(mapRideListItem),
        total: result.total,
        totalPages: result.totalPages,
      };
    },
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
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
    if (initialRideId && initialRideId !== initialRef.current) {
      initialRef.current = initialRideId;
      openDetails(initialRideId);
    }
  }, [initialRideId]);

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
          error: cause instanceof Error && cause.message ? cause.message : "Request failed. Please try again.",
          data: null,
        });
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedId, detailRetry]);

  function openDetails(id: string) {
    tabFetchEpochRef.current += 1;
    setTabTimeline({ loaded: false, loading: false, error: null, entries: null });
    setTabPayment({ loaded: false, loading: false, error: null, payment: null });
    setActiveTabId(null);
    setSelectedId(id);
    setDetailState({ id, loading: true, error: null, data: null });
  }

  function closeDetails() {
    tabFetchEpochRef.current += 1;
    setSelectedId(null);
    setDetailState({ id: null, loading: false, error: null, data: null });
    setTabTimeline({ loaded: false, loading: false, error: null, entries: null });
    setTabPayment({ loaded: false, loading: false, error: null, payment: null });
  }

  function retryDetail() {
    setDetailState((current) => ({ ...current, loading: true, error: null }));
    setDetailRetry((token) => token + 1);
  }

  async function fetchTabData(tabId: string) {
    const epoch = tabFetchEpochRef.current;
    if (tabId === "timeline") {
      setTabTimeline((current) => ({ ...current, loading: true, error: null }));
      try {
        const res = await fetchRideTimeline(selectedId!);
        if (epoch !== tabFetchEpochRef.current) return;
        setTabTimeline({ loaded: true, loading: false, error: null, entries: res.entries });
      } catch (cause) {
        if (epoch !== tabFetchEpochRef.current) return;
        setTabTimeline({
          loaded: true,
          loading: false,
          error: cause instanceof Error && cause.message ? cause.message : "Request failed. Please try again.",
          entries: null,
        });
      }
      return;
    }
    if (tabId === "payment") {
      setTabPayment((current) => ({ ...current, loading: true, error: null }));
      try {
        const res = await fetchRidePayment(selectedId!);
        if (epoch !== tabFetchEpochRef.current) return;
        setTabPayment({ loaded: true, loading: false, error: null, payment: res });
      } catch (cause) {
        if (epoch !== tabFetchEpochRef.current) return;
        setTabPayment({
          loaded: true,
          loading: false,
          error: cause instanceof Error && cause.message ? cause.message : "Request failed. Please try again.",
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
      fetchTabData(tabId);
    } else if (tabId === "payment" && !tabPayment.loaded) {
      fetchTabData(tabId);
    }
  }

  function retryTab() {
    if (activeTabId === "timeline") {
      setTabTimeline((current) => ({ ...current, loading: true, error: null }));
      fetchTabData("timeline");
    } else if (activeTabId === "payment") {
      setTabPayment((current) => ({ ...current, loading: true, error: null }));
      fetchTabData("payment");
    }
  }

  const detailLoading =
    detailState.loading ||
    (activeTabId === "timeline" && tabTimeline.loading) ||
    (activeTabId === "payment" && tabPayment.loading);
  const detailError = detailState.error || tabTimeline.error || tabPayment.error;
  const onRetry = () => {
    if (detailState.error) retryDetail();
    else if (tabTimeline.error || tabPayment.error) retryTab();
    else retry();
  };

  const selectedOverview = detailState.data;
  const details = selectedOverview
    ? buildLiveRideDetails({
        overview: selectedOverview,
        timelineEntries: tabTimeline.entries,
        payment: tabPayment.payment,
      })
    : null;

  const rideStatusLabel =
    filterValues.rideStatus === ALL ? ALL_STATUSES_LABEL : rideStatusDisplay(filterValues.rideStatus).label;
  const categoryLabel =
    filterValues.category === ALL ? ALL_CATEGORIES_LABEL : rideCategoryDisplay(filterValues.category);
  const paymentLabel =
    filterValues.paymentStatus === ALL ? ALL_PAYMENTS_LABEL : paymentStatusDisplay(filterValues.paymentStatus).label;

  function setStatusAndReset(value: string) {
    setFilter("rideStatus", STATUS_BY_LABEL[value] ?? ALL);
    setPage(1);
  }
  function setCategoryAndReset(value: string) {
    setFilter("category", CATEGORY_BY_LABEL[value] ?? ALL);
    setPage(1);
  }
  function setPaymentAndReset(value: string) {
    setFilter("paymentStatus", PAYMENT_BY_LABEL[value] ?? ALL);
    setPage(1);
  }

  function handleExport() {
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`ride-management-${today}.csv`, toCsv(CSV_COLUMNS, buildExportRows()));
  }

  function buildExportRows() {
    return rows.map((ride) => [
      ride.id,
      ride.passenger.name,
      ride.driver?.name ?? "",
      ride.pickup,
      ride.destination,
      rideCategoryDisplay(ride.category),
      String(ride.fare),
      paymentStatusDisplay(ride.paymentStatus).label,
      rideStatusDisplay(ride.status).label,
      ride.dateLabel,
    ]);
  }

  function rowProps(ride: Ride): HTMLAttributes<HTMLTableRowElement> {
    return {
      tabIndex: 0,
      onClick: () => openDetails(ride.id),
      onKeyDown: (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetails(ride.id);
        }
      },
      className: "cursor-pointer transition-colors hover:bg-brand-soft/40 focus-visible:bg-brand-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset",
    };
  }

  const COLUMNS: Column<Ride>[] = [
    {
      key: "rideId",
      header: "Ride ID",
      className: "whitespace-nowrap text-sm text-ink-muted",
      cell: (ride) => ride.id,
    },
    {
      key: "passenger",
      header: "Passenger",
      cell: (ride) => <PersonCell person={ride.passenger} />,
    },
    {
      key: "driver",
      header: "Driver",
      cell: (ride) => <PersonCell person={ride.driver} />,
    },
    {
      key: "pickup",
      header: "Pickup",
      className: "whitespace-nowrap text-sm text-ink-muted",
      cell: (ride) => ride.pickup,
    },
    {
      key: "destination",
      header: "Destination",
      className: "whitespace-nowrap text-sm text-ink-muted",
      cell: (ride) => ride.destination,
    },
    {
      key: "category",
      header: "Category",
      className: "whitespace-nowrap text-sm text-ink-muted",
      cell: (ride) => rideCategoryDisplay(ride.category),
    },
    {
      key: "fare",
      header: "Fare",
      className: "whitespace-nowrap text-sm font-medium text-ink",
      cell: (ride) => formatRideFare(ride.fare),
    },
    {
      key: "paymentStatus",
      header: "Payment status",
      cell: (ride) => {
        const d = paymentStatusDisplay(ride.paymentStatus);
        return <StatusPill tone={d.tone} label={d.label} />;
      },
    },
    {
      key: "rideStatus",
      header: "Ride status",
      cell: (ride) => {
        const d = rideStatusDisplay(ride.status);
        return <StatusPill tone={d.tone} label={d.label} />;
      },
    },
    {
      key: "date",
      header: "Date",
      className: "whitespace-nowrap text-sm text-ink-muted",
      cell: (ride) => ride.dateLabel,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (ride) => {
        const label = `Open details for ride ${ride.id}`;
        return (
          <button
            type="button"
            aria-label={label}
            onClick={(event) => {
              event.stopPropagation();
              openDetails(ride.id);
            }}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </button>
        );
      },
    },
  ];

  const filters = (
    <FilterPopover activeCount={activeFilterCount} onClear={clearFilters}>
      <Select
        label="Filter by category"
        options={CATEGORY_ENTRIES.map((entry) => entry.label)}
        value={categoryLabel}
        onChange={(event) => setCategoryAndReset(event.target.value)}
      />
      <Select
        label="Filter by payment status"
        options={PAYMENT_ENTRIES.map((entry) => entry.label)}
        value={paymentLabel}
        onChange={(event) => setPaymentAndReset(event.target.value)}
      />
    </FilterPopover>
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Ride Management"
        description="Track, review and manage every ride on the platform."
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              confirmedExport.requestExport("Confirm export", handleExport)
            }
          >
            <Download className="size-4" aria-hidden="true" />
            Export
          </Button>
        }
      />

      <Card className="min-w-0">
        <RecordsToolbar
          query={query}
          onQueryChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="Search ride management..."
          searchLabel="Search ride management"
          statusOptions={STATUS_ENTRIES.map((entry) => entry.label)}
          status={rideStatusLabel}
          onStatusChange={setStatusAndReset}
          filters={filters}
          resultCount={total}
        />

        {loading && rows.length === 0 ? (
          <RecordsSkeleton />
        ) : error && rows.length === 0 ? (
          <RecordsError message={error} onRetry={retry} />
        ) : (
          <div
            aria-busy={loading}
            className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}
          >
            {error ? (
              <div className="mb-4">
                <RecordsError message={error} onRetry={retry} />
              </div>
            ) : null}
            {rows.length === 0 ? (
              <p className="py-10 text-center text-sm text-ink-muted">
                No rides match your filters.
              </p>
            ) : (
              <>
                <div className="hidden w-full max-w-full min-w-0 overflow-x-auto lg:block">
                  <table className="w-full min-w-295 border-collapse text-left">
                    <thead>
                      <tr className="bg-surface-muted">
                        {COLUMNS.map((column) => (
                          <Th key={column.key}>{column.header}</Th>
                        ))}
                        <Th>
                          <span className="sr-only">Actions</span>
                        </Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.map((ride) => (
                        <tr key={ride.id} {...rowProps(ride)}>
                          {COLUMNS.map((column) => (
                            <Td key={column.key}>{column.cell(ride)}</Td>
                          ))}
                          <Td className="text-right">
                            {COLUMNS.find((column) => column.key === "actions")!.cell(ride)}
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul className="flex flex-col gap-3 lg:hidden">
                  {rows.map((ride) => {
                    const interactiveProps: HTMLAttributes<HTMLDivElement> = {
                      role: "button",
                      tabIndex: 0,
                      onClick: () => openDetails(ride.id),
                      onKeyDown: (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openDetails(ride.id);
                        }
                      },
                    };
                    return (
                      <li key={ride.id}>
                        <div
                          className="w-full cursor-pointer rounded-xl border border-border p-4 text-left transition-colors hover:bg-brand-soft/40 focus-visible:bg-brand-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                          {...interactiveProps}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-xs text-ink-muted">{ride.id}</span>
                            <StatusPill
                              tone={rideStatusDisplay(ride.status).tone}
                              label={rideStatusDisplay(ride.status).label}
                            />
                          </div>
                          <div className="mt-3 flex flex-col gap-2.5">
                            <PersonCell person={ride.passenger} caption="Passenger" />
                            <PersonCell person={ride.driver} caption="Driver" />
                          </div>
                          <p className="mt-3 text-sm text-ink-muted">
                            {ride.pickup} - {ride.destination}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-ink-muted">
                              {rideCategoryDisplay(ride.category)}
                            </span>
                            <span className="text-sm font-semibold text-ink">
                              {formatRideFare(ride.fare)}
                            </span>
                            <StatusPill
                              tone={paymentStatusDisplay(ride.paymentStatus).tone}
                              label={paymentStatusDisplay(ride.paymentStatus).label}
                            />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        )}

        <RideDetailsDrawer
          details={details}
          onClose={closeDetails}
          onTabChange={onTabChange}
          detailState={{
            loading: detailLoading,
            error: detailError,
            onRetry,
          }}
        />

        {confirmedExport.dialog}
      </Card>
    </div>
  );
}

