"use client";

import { useEffect, useState } from "react";
import { Download, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { PersonCell } from "@/components/ui/PersonCell";
import { StatusPill } from "@/components/ui/StatusPill";
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
import { useRecordsQuery } from "@/lib/hooks/useRecordsQuery";
import { buildVehicleDetails } from "@/lib/entity-details/vehicle";
import {
  fetchVehicleDetail,
  fetchVehiclesPage,
  mapVehicleListItem,
} from "@/lib/vehicles";
import { downloadCsv, toCsv } from "@/lib/csv";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { EM_DASH } from "@/lib/format";
import {
  vehicleAccountDisplay,
  vehicleInspectionDisplay,
} from "@/types/vehicles";
import type { Vehicle } from "@/types/vehicles";
import type { VehicleDetailResponse } from "@/types/vehicles-api";

// Display label for useRecordsQuery's "all" sentinel inside the toolbar.
const ALL = "all";
const ALL_STATUSES_LABEL = "All statuses";

// Status select options map 1:1 onto the confirmed `status` query param
// (values observed 2026-11-11 across all 37 rows: approved | pending |
// suspended). This filter IS wired — unlike the drivers/passengers pages.
const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: ALL_STATUSES_LABEL, value: ALL },
  { label: "Approved", value: "approved" },
  { label: "Pending", value: "pending" },
  { label: "Suspended", value: "suspended" },
];

const ALL_CATEGORIES = "all";
const CATEGORIES = ["Economy", "Comfort", "SUV"] as const;

// Inspection filter options backed by the two confirmed boolean params. Both
// were only ever observed as `=true`: hasInspection=true returned exactly the
// 10 rows with inspection.complete=true and inspectionIncomplete=true exactly
// the 27 rows with complete=false (37 rows total, observed 2026-11-11).
const ALL_INSPECTIONS = "all";
const INSPECTION_OPTIONS: { label: string; value: string }[] = [
  { label: "All inspections", value: ALL_INSPECTIONS },
  { label: "Inspection complete", value: "complete" },
  { label: "Inspection incomplete", value: "incomplete" },
];

// The endpoint carries no year/colour/VIN/roadworthiness/last-inspection
// field: those columns stay in the design and
// export as "—" instead of a fabricated value. "Make" and "Model" merge into
// one column because the backend sends a single makeModel string.
const CSV_COLUMNS = [
  "Vehicle ID",
  "Make & model",
  "Year",
  "Registration number",
  "Colour",
  "VIN",
  "Driver",
  "Category",
  "Insurance expiry",
  "Roadworthiness",
  "Inspection",
  "Last inspection",
  "Account status",
];

const COLUMNS: Column<Vehicle>[] = [
  {
    key: "makeModel",
    header: "Make & model",
    className: "whitespace-nowrap text-sm font-medium text-ink",
    cell: (vehicle) => vehicle.makeModel,
  },
  {
    key: "reg",
    header: "Registration number",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (vehicle) => vehicle.regNumber,
  },
  {
    key: "year",
    header: "Year",
    className: "whitespace-nowrap text-sm text-ink-muted",
    // No year field exists on this endpoint.
    cell: () => EM_DASH,
  },
  {
    key: "driver",
    header: "Driver",
    cell: (vehicle) => <PersonCell person={vehicle.driver} />,
  },
  {
    key: "category",
    header: "Category",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (vehicle) => vehicle.category,
  },
  {
    key: "insurance",
    header: "Insurance expiry",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (vehicle) => vehicle.insuranceExpiry,
  },
  {
    key: "inspection",
    header: "Inspection",
    cell: (vehicle) => {
      const display = vehicleInspectionDisplay(vehicle.inspectionComplete);
      return <StatusPill tone={display.tone} label={display.label} />;
    },
  },
  {
    key: "account",
    header: "Account status",
    cell: (vehicle) => {
      const display = vehicleAccountDisplay(vehicle.account);
      return <StatusPill tone={display.tone} label={display.label} />;
    },
  },
];

export function VehiclesView() {
  const confirmedExport = useConfirmedExport();

  // Server-side pagination/filtering: useRecordsQuery owns the debounced
  // search (400ms), page resets, totals, loading/error states and the
  // stale-response protection for the list.
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
  } = useRecordsQuery<Vehicle>({
    filterKeys: ["status", "category", "inspection"],
    fetchPage: async (
      { page: nextPage, pageSize, query: search, filters },
      signal,
    ) => {
      const result = await fetchVehiclesPage(
        {
          page: nextPage,
          limit: pageSize,
          search: search.trim() || undefined,
          status: filters.status !== ALL ? filters.status : undefined,
          category:
            filters.category !== ALL_CATEGORIES
              ? filters.category.toLowerCase()
              : undefined,
          hasInspection: filters.inspection === "complete" ? true : undefined,
          inspectionIncomplete:
            filters.inspection === "incomplete" ? true : undefined,
        },
        signal,
      );
      return {
        items: result.items.map(mapVehicleListItem),
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
    data: VehicleDetailResponse | null;
  }>({ id: null, loading: false, error: null, data: null });
  const [detailRetry, setDetailRetry] = useState(0);

  // Detail fetched lazily when the drawer opens; the `cancelled` flag drops
  // responses that resolve after the selection changed (stale-response
  // protection). The loading flag itself is set by openDetails/retryDetail.
  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    let cancelled = false;
    fetchVehicleDetail(selectedId, controller.signal)
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

  // Drawer footer actions: the confirm dialog runs inside EntityDrawer and
  // this fires after the backend confirms the PATCH — and also after a
  // partially-applied batch (PartialDecisionError), when the screen must
  // refetch to drop the statuses that DID change. Either way it refetches the
  // drawer detail and the current list page — never a local status change
  // before the backend responds, and never a second submit (the dialog's
  // confirm button is disabled while the request is in flight).
  function handleAction() {
    setDetailState((current) => ({ ...current, loading: true, error: null }));
    setDetailRetry((token) => token + 1);
    retry();
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
  // `null` means "not loaded / failed" so every derived drawer value renders
  // "—"; a loaded detail renders the backend's true zeros.
  const selectedDetail = selected ? selectionDetail.data : null;

  function handleExport() {
    const exportRows = rows.map((vehicle) => [
      vehicle.id,
      vehicle.makeModel,
      // No year/colour/VIN/roadworthiness/last-inspection field exists on
      // this endpoint.
      EM_DASH,
      vehicle.regNumber,
      EM_DASH,
      EM_DASH,
      vehicle.driver.name,
      vehicle.category,
      vehicle.insuranceExpiry,
      EM_DASH,
      vehicleInspectionDisplay(vehicle.inspectionComplete).label,
      EM_DASH,
      vehicleAccountDisplay(vehicle.account).label,
    ]);
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`vehicles-${today}.csv`, toCsv(CSV_COLUMNS, exportRows));
  }

  const statusLabel =
    STATUS_OPTIONS.find((option) => option.value === filterValues.status)
      ?.label ?? ALL_STATUSES_LABEL;

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
        label="Filter by inspection"
        value={filterValues.inspection}
        onChange={(event) => setFilter("inspection", event.target.value)}
      >
        {INSPECTION_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FilterPopover>
  );


  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Vehicle Management"
        description="Review and manage the platform vehicle inventory."
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
            {/* No confirmed create endpoint:
                the button stays in place but disabled. Disabled buttons
                swallow hover, so the reason rides on a wrapper span. */}
            <span title="Not available yet" className="inline-flex">
              <Button disabled>
                <Plus className="size-4" aria-hidden="true" />
                Add vehicle
              </Button>
            </span>
          </>
        }
      />

      <Card className="min-w-0">
        <RecordsToolbar
          query={query}
          onQueryChange={setQuery}
          placeholder="Search vehicle management..."
          searchLabel="Search vehicle management"
          statusOptions={STATUS_OPTIONS.map((option) => option.label)}
          status={statusLabel}
          onStatusChange={(value) =>
            setFilter(
              "status",
              STATUS_OPTIONS.find((option) => option.label === value)?.value ??
                ALL,
            )
          }
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
              getKey={(vehicle) => vehicle.id}
              onOpen={(vehicle) => openDetails(vehicle.id)}
              rowLabel={(vehicle) => vehicle.makeModel}
              minWidth={1180}
              emptyMessage="No vehicles match your filters."
              renderCard={(vehicle) => (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-ink">
                      {vehicle.makeModel}
                    </p>
                    <StatusPill
                      tone={vehicleAccountDisplay(vehicle.account).tone}
                      label={vehicleAccountDisplay(vehicle.account).label}
                    />
                  </div>
                  <p className="mt-2 text-sm text-ink-muted">
                    {vehicle.regNumber}
                  </p>
                  <div className="mt-3">
                    <PersonCell person={vehicle.driver} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-ink-muted">
                    <span>{vehicle.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{vehicle.insuranceExpiry}</span>
                    <StatusPill
                      tone={vehicleInspectionDisplay(vehicle.inspectionComplete)
                        .tone}
                      label={vehicleInspectionDisplay(vehicle.inspectionComplete)
                        .label}
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
        model={selected ? buildVehicleDetails(selected, selectedDetail) : null}
        onClose={closeDetails}
        onAction={handleAction}
        detailState={{
          loading: selectionDetail.loading,
          error: selectionDetail.error,
          onRetry: retryDetail,
        }}
      />

      {confirmedExport.dialog}
    </div>
  );
}

