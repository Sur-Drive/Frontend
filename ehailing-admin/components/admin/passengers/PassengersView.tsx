"use client";

import { useEffect, useState } from "react";
import { Download, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { PersonCell } from "@/components/ui/PersonCell";
import { StatusPill } from "@/components/ui/StatusPill";
import { RatingValue } from "@/components/ui/RatingValue";
import { Pagination, PAGE_SIZE } from "@/components/ui/Pagination";
import { FilterPopover } from "@/components/ui/FilterPopover";
import { PageHeader } from "@/components/admin/PageHeader";
import { RecordsToolbar } from "@/components/admin/RecordsToolbar";
import { RecordsTable } from "@/components/admin/records/RecordsTable";
import type { Column } from "@/components/admin/records/RecordsTable";
import {
  RecordsError,
  RecordsSkeleton,
} from "@/components/admin/records/RecordsListState";
import { EntityDrawer } from "@/components/admin/details/EntityDrawer";
import { runEntityAction } from "@/lib/actions";
import { useRecordsQuery } from "@/lib/hooks/useRecordsQuery";
import { buildPassengerDetails } from "@/lib/entity-details/passenger";
import {
  applyPassengerOverview,
  fetchPassengerOverview,
  fetchPassengerPayments,
  fetchPassengerRatings,
  fetchPassengerRides,
  fetchPassengersPage,
  mapPassengerListItem,
  mapPassengerPayments,
  mapPassengerRatings,
  mapPassengerRides,
  passengerDisplayRating,
} from "@/lib/passengers";
import { downloadCsv, toCsv } from "@/lib/csv";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { formatNaira } from "@/lib/format";
import { passengerAccountDisplay } from "@/types/passengers";
import type { Passenger } from "@/types/passengers";
import type {
  PassengerOverviewResponse,
  PassengerTabData,
} from "@/types/passengers-api";

// Display label for the status select's "all" sentinel. The account status
// select is VISUAL-ONLY this round: the backend has no confirmed accountStatus
// query param, so changing it never filters (see task report).
const ALL_STATUSES_LABEL = "All statuses";

const STATUS_OPTIONS = ["Active", "Restricted"] as const;

const ALL_RATINGS = "all";
const RATING_HIGH = "4.8 and above";
// No confirmed maxRating param exists, so this option cannot filter.
const RATING_LOW = "Below 4.8";

const ALL_RIDES = "all";
const RIDES_MANY = "100 or more";
// No confirmed maxRides param exists, so this option cannot filter.
const RIDES_FEW = "Under 100";

const CSV_COLUMNS = [
  "Name",
  "Phone",
  "Email",
  "Total rides",
  "Total spend (NGN)",
  "Rating",
  "Registration date",
  "Account status",
];
const COLUMNS: Column<Passenger>[] = [
  {
    key: "name",
    header: "Name",
    cell: (passenger) => <PersonCell person={passenger.person} />,
  },
  {
    key: "phone",
    header: "Phone",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (passenger) => passenger.phone,
  },
  {
    key: "email",
    header: "Email",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (passenger) => passenger.email,
  },
  {
    key: "rides",
    header: "Total rides",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (passenger) =>
      passenger.totalRides === null ? "—" : passenger.totalRides,
  },
  {
    key: "spend",
    header: "Total spend",
    className: "whitespace-nowrap text-sm font-medium text-ink",
    cell: (passenger) =>
      passenger.totalSpend === null ? "—" : formatNaira(passenger.totalSpend),
  },
  {
    key: "rating",
    header: "Rating",
    cell: (passenger) => (
      <RatingValue value={passengerDisplayRating(passenger)} decimals={1} />
    ),
  },
  {
    key: "registered",
    header: "Registration date",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (passenger) => passenger.registeredLabel,
  },
  {
    key: "status",
    header: "Account status",
    cell: (passenger) => {
      const display = passengerAccountDisplay(passenger.status);
      return <StatusPill tone={display.tone} label={display.label} />;
    },
  },
];
export function PassengersView() {
  // Status select is visual-only (no confirmed backend param for it).
  const [status, setStatus] = useState<string>("all");
  const confirmedExport = useConfirmedExport();

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
  } = useRecordsQuery<Passenger>({
    filterKeys: ["rating", "rides"],
    fetchPage: async (
      { page: nextPage, pageSize, query: search, filters },
      signal,
    ) => {
      const result = await fetchPassengersPage(
        {
          page: nextPage,
          limit: pageSize,
          search: search.trim() || undefined,
          // Only the confirmed "min" params can be wired; the "Below"/"Under"
          // options have no backend param and intentionally send nothing.
          minRating: filters.rating === RATING_HIGH ? 4.8 : undefined,
          minRides: filters.rides === RIDES_MANY ? 100 : undefined,
        },
        signal,
      );
      return {
        items: result.items.map(mapPassengerListItem),
        total: result.total,
        totalPages: result.totalPages,
      };
    },
  });

  // Exclude the visually-disabled options from the count: they carry no
  // backend param and must never appear to be applied.
  const passengerActiveCount =
    activeFilterCount -
    (filterValues.rating === RATING_LOW ? 1 : 0) -
    (filterValues.rides === RIDES_FEW ? 1 : 0);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailState, setDetailState] = useState<{
    id: string | null;
    loading: boolean;
    error: string | null;
    data: PassengerOverviewResponse | null;
  }>({ id: null, loading: false, error: null, data: null });
  const [detailRetry, setDetailRetry] = useState(0);

  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    let cancelled = false;
    // The loading state is set by openDetails/retryDetail (event handlers);
    // this effect only performs the async fetch and applies its result.
    fetchPassengerOverview(selectedId, controller.signal)
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

  function openDetails(id: string) {
    // Stale protection: clear any previous record's tab data before opening
    // the drawer for a new record.
    setTabData({});
    setActiveTabId(null);
    setTabFetch({ loading: false, error: null });
    setSelectedId(id);
    setDetailState({ id, loading: true, error: null, data: null });
  }

  function closeDetails() {
    setSelectedId(null);
    setDetailState({ id: null, loading: false, error: null, data: null });
  }

  function retryDetail() {
    setDetailState((current) => ({ ...current, loading: true, error: null }));
    setDetailRetry((token) => token + 1);
  }
  // Tab sub-resource data, fetched lazily when a tab is first opened. Keyed by
  // tab id so re-opening a tab does not refetch. Reset when the row changes.
  // Each entry carries its endpoint summary + a `loaded` flag kept separate
  // from the payload arrays: a loaded tab shows the backend's true zeros, an
  // unloaded or failed tab has no entry and renders "—".
  const [tabData, setTabData] = useState<Record<string, PassengerTabData>>({});
  const [tabFetch, setTabFetch] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Fetches the sub-resource for the given tab lazily (first open only) and
  // stores it keyed by tab id. Item shapes come from the confirmed backend
  // response, so the mappers keep the real items; nothing is
  // fabricated when the backend sends fewer fields than expected.
  async function fetchTabData(tabId: string) {
    if (!selected) return;
    setTabFetch({ loading: true, error: null });
    try {
      let data: PassengerTabData = { loaded: true };
      switch (tabId) {
        case "ride-history": {
          const res = await fetchPassengerRides(selected.id, { page: 1, limit: 5 });
          data = mapPassengerRides(res);
          break;
        }
        case "payments": {
          const res = await fetchPassengerPayments(selected.id);
          data = mapPassengerPayments(res);
          break;
        }
        case "ratings": {
          const res = await fetchPassengerRatings(selected.id);
          data = mapPassengerRatings(res);
          break;
        }
        case "activity":
          // The activity timeline renders overview.recentActivity; the separate
          // /activity response was never rendered, so nothing is fetched here.
          data = { loaded: true };
          break;
      }
      setTabData((current) => ({ ...current, [tabId]: data }));
      setTabFetch({ loading: false, error: null });
    } catch (cause) {
      setTabFetch({
        loading: false,
        error:
          cause instanceof Error && cause.message
            ? cause.message
            : "Request failed. Please try again.",
      });
    }
  }

  function retryTab() {
    setTabFetch((current) => ({ ...current, loading: true, error: null }));
    if (activeTabId) fetchTabData(activeTabId);
  }

  async function onTabChange(tabId: string) {
    setActiveTabId(tabId);
    if (tabData[tabId]) return;
    await fetchTabData(tabId);
  }

  // The stored state lags one render behind a new selection: treat that as
  // loading so a previous row's detail never flashes under the new row.
  const selectionDetail =
    detailState.id === selectedId
      ? detailState
      : {
          id: selectedId,
          loading: selectedId !== null,
          error: null,
          data: null,
        };

  const selected = rows.find((item) => item.id === selectedId) ?? null;
  const selectedOverview = selected
    ? applyPassengerOverview(selected, selectionDetail.data)
    : null;

  // Combined fetch state shown above the active tab's sections: the overview
  // detail while it loads, otherwise the active sub-resource tab while it
  // loads. `selectionDetail.data` (overview) is kept separate; tab data lives
  // in tabData and the builder reads every loaded tab's summary from it.
  const detailLoading = selectionDetail.loading || tabFetch.loading;
  const detailError = selectionDetail.error || tabFetch.error;
  const onRetry = () => {
    if (tabFetch.error && activeTabId) retryTab();
    else retryDetail();
  };

  // Drawer footer actions: passenger actions have no confirmed endpoints, so
  // the buttons stay disabled with "Not available yet". If one is ever wired,
  // this handler refetches detail + list after the backend confirms.
  async function handleAction(actionId: string, note: string) {
    if (!selectedId) return;
    await runEntityAction({
      entity: "passenger",
      id: selectedId,
      action: actionId,
      note,
    });
    setDetailState((current) => ({ ...current, loading: true, error: null }));
    setDetailRetry((token) => token + 1);
    retry();
  }

  function handleExport() {
    const exportRows = rows.map((passenger) => [
      passenger.person.name,
      passenger.phone,
      passenger.email,
      passenger.totalRides ?? "",
      // "—" matches the table: null spend, and the rating guard hides the
      // backend's default 5 for zero-ride passengers.
      passenger.totalSpend ?? "—",
      passengerDisplayRating(passenger) ?? "—",
      passenger.registeredLabel,
      passengerAccountDisplay(passenger.status).label,
    ]);
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`passengers-${today}.csv`, toCsv(CSV_COLUMNS, exportRows));
  }

  const filters = (
    <FilterPopover activeCount={passengerActiveCount} onClear={clearFilters}>
      <Select
        label="Filter by rating"
        value={filterValues.rating}
        onChange={(event) => {
          const value = event.target.value;
          // RATING_LOW has no backend param: keep it visible but unavailable.
          setFilter("rating", value === RATING_LOW ? ALL_RATINGS : value);
        }}
      >
        <option value={ALL_RATINGS}>All ratings</option>
        <option value={RATING_HIGH}>{RATING_HIGH}</option>
        <option value={RATING_LOW} disabled title="Not available yet">
          {RATING_LOW}
        </option>
      </Select>
      <Select
        label="Filter by rides"
        value={filterValues.rides}
        onChange={(event) => {
          const value = event.target.value;
          // RIDES_FEW has no backend param: keep it visible but unavailable.
          setFilter("rides", value === RIDES_FEW ? ALL_RIDES : value);
        }}
      >
        <option value={ALL_RIDES}>All rides</option>
        <option value={RIDES_MANY}>{RIDES_MANY}</option>
        <option value={RIDES_FEW} disabled title="Not available yet">
          {RIDES_FEW}
        </option>
      </Select>
    </FilterPopover>
  );
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Passenger Management"
        description="View passenger profiles, activity and account health."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                confirmedExport.requestExport("Confirm export", handleExport)
              }
            >
              <Download className="size-4" aria-hidden="true" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" aria-hidden="true" />
              Add passenger
            </Button>
          </>
        }
      />

      <Card className="min-w-0">
        <RecordsToolbar
          query={query}
          onQueryChange={setQuery}
          placeholder="Search passenger management..."
          searchLabel="Search passenger management"
          statusOptions={[ALL_STATUSES_LABEL, ...STATUS_OPTIONS]}
          status={status === "all" ? ALL_STATUSES_LABEL : status}
          onStatusChange={(value) =>
            setStatus(value === ALL_STATUSES_LABEL ? "all" : value)
          }
          statusDisabled
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
            className={
              loading ? "opacity-60 transition-opacity" : "transition-opacity"
            }
          >
            {error ? (
              <div className="mb-4">
                <RecordsError message={error} onRetry={retry} />
              </div>
            ) : null}
            <RecordsTable
              columns={COLUMNS}
              rows={rows}
              getKey={(passenger) => passenger.id}
              onOpen={(passenger) => openDetails(passenger.id)}
              rowLabel={(passenger) => passenger.person.name}
              minWidth={1080}
              emptyMessage="No passengers match your filters."
              renderCard={(passenger) => (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <PersonCell person={passenger.person} />
                    <StatusPill
                      tone={passengerAccountDisplay(passenger.status).tone}
                      label={passengerAccountDisplay(passenger.status).label}
                    />
                  </div>
                  <div className="mt-3 flex min-w-0 flex-col gap-1">
                    <p className="truncate text-sm text-ink-muted">
                      {passenger.phone}
                    </p>
                    <p className="truncate text-sm text-ink-muted">
                      {passenger.email}
                    </p>
                  </div>
                  <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
                    <span>
                      {passenger.totalRides === null
                        ? "—"
                        : `${passenger.totalRides} rides`}
                    </span>
                    <span aria-hidden="true">·</span>
                    <RatingValue
                      value={passengerDisplayRating(passenger)}
                      decimals={1}
                    />
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-ink">
                      {passenger.totalSpend === null
                        ? "—"
                        : formatNaira(passenger.totalSpend)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{passenger.registeredLabel}</span>
                  </p>
                </>
              )}
            />
          </div>
        )}

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      </Card>

      <EntityDrawer
        model={
          selectedOverview
            ? buildPassengerDetails(
                selectedOverview,
                selectionDetail.data,
                tabData,
              )
            : null
        }
        onClose={closeDetails}
        onAction={handleAction}
        onTabChange={onTabChange}
        detailState={{
          loading: detailLoading,
          error: detailError,
          onRetry,
        }}
      />

      {confirmedExport.dialog}
    </div>
  );
}



