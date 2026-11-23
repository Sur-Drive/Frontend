"use client";

import { useEffect, useRef, useState } from "react";
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
import { buildDriverDetails } from "@/lib/entity-details/driver";
import type {
  DocumentDecisionRequest,
  DriverDetailData,
} from "@/types/entity-details";
import {
  applyDriverOverview,
  driverDisplayRating,
  fetchDriverDocuments,
  fetchDriverFinancials,
  fetchDriverOverview,
  fetchDriverPerformance,
  fetchDriverRides,
  fetchDriversPage,
  fetchDriverVehicle,
  mapDriverDocuments,
  mapDriverDocumentCounts,
  mapDriverFinancials,
  mapDriverListItem,
  mapDriverPerformance,
  mapDriverRides,
  mapDriverVehicle,
  runDocumentDecision,
} from "@/lib/drivers";
import { downloadCsv, toCsv } from "@/lib/csv";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { formatNumber } from "@/lib/format";
import {
  driverAccountStatusDisplay,
  driverOnlineDisplay,
  driverVerificationDisplay,
} from "@/types/drivers";
import type { Driver } from "@/types/drivers";
import type { DriverOverviewResponse } from "@/types/drivers-api";

// Display label for the status select's "all" sentinel. The account status
// select is VISUAL-ONLY this round: the backend has no confirmed accountStatus
// query param, so changing it never filters (see task report).
const ALL_STATUSES_LABEL = "All statuses";

const ACCOUNT_OPTIONS = ["Active", "Pending", "Suspended"] as const;

const ALL_CATEGORIES = "all";
const CATEGORIES = ["Economy", "Comfort", "SUV"] as const;

const ALL_ONLINE = "all";
const ONLINE_OPTIONS = ["Online", "On trip", "Offline"] as const;

// UI label -> confirmed onlineStatus query param (values observed live).
const ONLINE_PARAM: Record<string, string> = {
  Online: "online",
  "On trip": "on_ride",
  Offline: "offline",
};

const CSV_COLUMNS = [
  "Driver",
  "Phone",
  "Email",
  "Vehicle",
  "Category",
  "Total rides",
  "Rating",
  "Earnings (NGN)",
  "Verification status",
  "Online status",
  "Account status",
];
const COLUMNS: Column<Driver>[] = [
  {
    key: "driver",
    header: "Driver",
    cell: (driver) => <PersonCell person={driver.person} />,
  },
  {
    key: "phone",
    header: "Phone",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (driver) => driver.phone,
  },
  {
    key: "vehicle",
    header: "Vehicle",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (driver) => driver.vehicle,
  },
  {
    key: "category",
    header: "Category",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (driver) => driver.category,
  },
  {
    key: "rides",
    header: "Total rides",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (driver) =>
      driver.totalRides === null ? "—" : formatNumber(driver.totalRides),
  },
  {
    key: "rating",
    header: "Rating",
    // The guard hides the backend's default rating 5 for zero-ride drivers.
    cell: (driver) => <RatingValue value={driverDisplayRating(driver)} decimals={2} />,
  },
  {
    key: "verification",
    header: "Verification status",
    cell: (driver) => {
      const display = driverVerificationDisplay(driver.verification);
      return <StatusPill tone={display.tone} label={display.label} />;
    },
  },
  {
    key: "online",
    header: "Online status",
    cell: (driver) => {
      const display = driverOnlineDisplay(driver.online);
      return <StatusPill tone={display.tone} label={display.label} />;
    },
  },
  {
    key: "account",
    header: "Account status",
    cell: (driver) => {
      // Derived from driverSuspension(): a suspended driver shows "Suspended"
      // (danger) even though the backend's accountStatus still reads "active".
      const display = driverAccountStatusDisplay(driver.account, driver.verification);
      return <StatusPill tone={display.tone} label={display.label} />;
    },
  },
];
export function DriversView() {
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
  } = useRecordsQuery<Driver>({
    filterKeys: ["category", "online"],
    fetchPage: async (
      { page: nextPage, pageSize, query: search, filters },
      signal,
    ) => {
      const result = await fetchDriversPage(
        {
          page: nextPage,
          limit: pageSize,
          search: search.trim() || undefined,
          category:
            filters.category !== ALL_CATEGORIES
              ? filters.category.toLowerCase()
              : undefined,
          onlineStatus:
            filters.online !== ALL_ONLINE
              ? ONLINE_PARAM[filters.online]
              : undefined,
        },
        signal,
      );
      return {
        items: result.items.map(mapDriverListItem),
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
    data: DriverOverviewResponse | null;
  }>({ id: null, loading: false, error: null, data: null });
  const [detailRetry, setDetailRetry] = useState(0);
  // Tab sub-resource data, fetched lazily when a tab is first opened. Keyed by
  // tab id so re-opening a tab does not refetch. Reset when the row changes.
  // Each entry carries its endpoint payload + a `loaded` flag kept separate
  // from the payload arrays: a loaded tab shows the backend's true zeros, an
  // unloaded or failed tab has no entry and renders "—".
  const [tabData, setTabData] = useState<Record<string, DriverDetailData>>({});
  const [tabFetch, setTabFetch] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  // Invalidated whenever the selected row changes so an in-flight tab fetch
  // from a previous row can never write into the new row's tabData
  // (stale-response protection).
  const tabFetchEpochRef = useRef(0);

  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    let cancelled = false;
    // The loading state is set by openDetails/retryDetail (event handlers);
    // this effect only performs the async fetch and applies its result.
    fetchDriverOverview(selectedId, controller.signal)
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
    // the drawer for a new record, and invalidate in-flight tab fetches.
    tabFetchEpochRef.current += 1;
    setTabData({});
    setActiveTabId(null);
    setTabFetch({ loading: false, error: null });
    setSelectedId(id);
    setDetailState({ id, loading: true, error: null, data: null });
  }

  function closeDetails() {
    tabFetchEpochRef.current += 1;
    setSelectedId(null);
    setDetailState({ id: null, loading: false, error: null, data: null });
  }

  function retryDetail() {
    setDetailState((current) => ({ ...current, loading: true, error: null }));
    setDetailRetry((token) => token + 1);
  }

  // Fetches the sub-resource for the given tab lazily (first open only) and
  // stores it keyed by tab id. Each entry carries its endpoint payload plus a
  // `loaded` flag kept separate from the payload arrays; the epoch guard drops
  // responses that resolve after the row changed (stale-response protection).
  async function fetchTabData(tabId: string) {
    if (!selected) return;
    const epoch = tabFetchEpochRef.current;
    const profileId = selected.id;
    setTabFetch({ loading: true, error: null });
    try {
      let data: DriverDetailData = { loaded: true };
      switch (tabId) {
        case "documents": {
          const res = await fetchDriverDocuments(profileId);
          data = {
            loaded: true,
            verifications: mapDriverDocuments(
              res.documents,
              selected.person.name,
              profileId,
            ),
            documentCounts: mapDriverDocumentCounts(res.counts),
          };
          break;
        }
        case "vehicle": {
          const res = await fetchDriverVehicle(profileId);
          data = { loaded: true, vehicles: mapDriverVehicle(res) };
          break;
        }
        case "performance": {
          const res = await fetchDriverPerformance(profileId);
          data = { loaded: true, performance: mapDriverPerformance(res) };
          break;
        }
        case "financials": {
          const res = await fetchDriverFinancials(profileId);
          data = { loaded: true, financials: mapDriverFinancials(res) };
          break;
        }
        case "ride-history": {
          const res = await fetchDriverRides(profileId, { page: 1, limit: 5 });
          data = { loaded: true, rideHistory: mapDriverRides(res) };
          break;
        }
        case "activity":
          // The activity timeline renders overview.recentActivity; the separate
          // /activity response is never fetched.
          data = { loaded: true };
          break;
      }
      if (epoch !== tabFetchEpochRef.current) return;
      setTabData((current) => ({ ...current, [tabId]: data }));
      setTabFetch({ loading: false, error: null });
    } catch (cause) {
      if (epoch !== tabFetchEpochRef.current) return;
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
    ? applyDriverOverview(selected, selectionDetail.data)
    : null;

  // Combined fetch state shown above the active tab's sections: the overview
  // detail while it loads, otherwise the active sub-resource tab while it
  // loads. `selectionDetail.data` (overview) is kept separate and passed to
  // buildDriverDetails directly; the full tabData record goes along so every
  // loaded tab's payload is available to the builder.
  const detailLoading = selectionDetail.loading || tabFetch.loading;
  const detailError = selectionDetail.error || tabFetch.error;
  const onRetry = () => {
    if (tabFetch.error && activeTabId) retryTab();
    else retryDetail();
  };

  // Drawer footer actions: confirm dialog runs in EntityDrawer; this handler
  // only runs after the backend confirms, so it refetches the drawer detail
  // and the current list page and never changes status locally first.
  async function handleAction(actionId: string, note: string) {
    if (!selectedId) return;
    await runEntityAction({
      entity: "driver",
      id: selectedId,
      action: actionId,
      note,
    });
    // Refetch the drawer detail and the list page now that the backend has
    // confirmed; never trust or depend on the mutation response shape.
    setDetailState((current) => ({ ...current, loading: true, error: null }));
    setDetailRetry((token) => token + 1);
    retry();
  }

  // Document review panel: one decision per click. The helper refetches the
  // documents tab and this drawer's overview after the request settles, on
  // success and failure alike; no status is changed locally.
  async function handleDocumentDecision({
    row,
    action,
    note,
  }: DocumentDecisionRequest) {
    if (!row.actionTarget) {
      throw new Error("This document has no decision target.");
    }
    await runDocumentDecision({
      target: row.actionTarget,
      action,
      note,
      onSettled: () => {
        void fetchTabData("documents");
        retryDetail();
      },
    });
  }

  function handleExport() {
    const exportRows = rows.map((driver) => [
      driver.person.name,
      driver.phone,
      driver.email,
      driver.vehicle,
      driver.category,
      driver.totalRides ?? "",
      // "—" matches the table: the rating guard hides the backend's default 5
      // for zero-ride drivers, and null earnings render as "—" like the drawer.
      driverDisplayRating(driver) ?? "—",
      driver.earnings ?? "—",
      driverVerificationDisplay(driver.verification).label,
      driverOnlineDisplay(driver.online).label,
      driverAccountStatusDisplay(driver.account, driver.verification).label,
    ]);
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`drivers-${today}.csv`, toCsv(CSV_COLUMNS, exportRows));
  }

  const filters = (
    <FilterPopover activeCount={activeFilterCount} onClear={clearFilters}>
      <Select
        label="Filter by category"
        value={filterValues.category}
        onChange={(event) => setFilter("category", event.target.value)}
      >
        <option value={ALL_CATEGORIES}>All categories</option>
        {CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </Select>
      <Select
        label="Filter by online status"
        value={filterValues.online}
        onChange={(event) => setFilter("online", event.target.value)}
      >
        <option value={ALL_ONLINE}>All</option>
        {ONLINE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </FilterPopover>
  );
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Driver Management"
        description="Manage drivers, verification and platform performance."
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
            {/* No create endpoint exists (there is no POST /drivers): the
                button stays in place but disabled. Disabled
                buttons swallow hover, so the reason rides on a wrapper span. */}
            <span title="Not available yet" className="inline-flex">
              <Button disabled>
                <Plus className="size-4" aria-hidden="true" />
                Add driver
              </Button>
            </span>
          </>
        }
      />

      <Card className="min-w-0">
        <RecordsToolbar
          query={query}
          onQueryChange={setQuery}
          placeholder="Search driver management..."
          searchLabel="Search driver management"
          statusOptions={[ALL_STATUSES_LABEL, ...ACCOUNT_OPTIONS]}
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
              getKey={(driver) => driver.id}
              onOpen={(driver) => openDetails(driver.id)}
              rowLabel={(driver) => driver.person.name}
              minWidth={1280}
              emptyMessage="No drivers match your filters."
              renderCard={(driver) => (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <PersonCell person={driver.person} />
                    <StatusPill
                      tone={driverAccountStatusDisplay(driver.account, driver.verification).tone}
                      label={driverAccountStatusDisplay(driver.account, driver.verification).label}
                    />
                  </div>
                  <div className="mt-3 flex min-w-0 flex-col gap-1">
                    <p className="truncate text-sm text-ink">{driver.vehicle}</p>
                    <p className="truncate text-sm text-ink-muted">
                      {driver.category}
                    </p>
                  </div>
                  <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
                    <span>
                      {driver.totalRides === null
                        ? "—"
                        : `${formatNumber(driver.totalRides)} rides`}
                    </span>
                    <span aria-hidden="true">·</span>
                    <RatingValue
                      value={driverDisplayRating(driver)}
                      decimals={2}
                    />
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusPill
                      tone={driverVerificationDisplay(driver.verification).tone}
                      label={driverVerificationDisplay(driver.verification).label}
                    />
                    <StatusPill
                      tone={driverOnlineDisplay(driver.online).tone}
                      label={driverOnlineDisplay(driver.online).label}
                    />
                  </div>
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
            ? buildDriverDetails(
                selectedOverview,
                selectionDetail.data,
                tabData,
              )
            : null
        }
        onClose={closeDetails}
        onAction={handleAction}
        onTabChange={onTabChange}
        onDocumentDecision={handleDocumentDecision}
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



