"use client";

import { useState } from "react";
import { Activity, Car, Download, Plus, User, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { StatusPill } from "@/components/ui/StatusPill";
import { Pagination, PAGE_SIZE } from "@/components/ui/Pagination";
import { FilterPopover } from "@/components/ui/FilterPopover";
import { PageHeader } from "@/components/admin/PageHeader";
import { RecordsToolbar } from "@/components/admin/RecordsToolbar";
import { StatCard, StatCardGrid } from "@/components/admin/StatCard";
import { RecordsTable } from "@/components/admin/records/RecordsTable";
import type { Column } from "@/components/admin/records/RecordsTable";
import { EntityDrawer } from "@/components/admin/details/EntityDrawer";
import { useRecordsList } from "@/lib/hooks/useRecordsList";
import { buildFleetDetails } from "@/lib/entity-details/fleet";
import { downloadCsv, toCsv } from "@/lib/csv";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { formatNumber } from "@/lib/format";
import { FLEET_STATUS_TONE } from "@/types/fleets";
import type { Fleet, FleetSummary } from "@/types/fleets";

// Display label for the hook's "all" sentinel; the toolbar only ever sees this.
const ALL_STATUSES_LABEL = "All statuses";

const STATUS_OPTIONS = ["Active", "Under Review", "Suspended"] as const;

const ALL_COMPLIANCE = "all";
const COMPLIANCE_HIGH = "90% and above";
const COMPLIANCE_LOW = "Below 90%";

const CSV_COLUMNS = [
  "Fleet ID",
  "Fleet name",
  "Owner",
  "Drivers",
  "Vehicles",
  "Active rides",
  "Compliance (%)",
  "Status",
];

const COLUMNS: Column<Fleet>[] = [
  {
    key: "name",
    header: "Fleet name",
    cell: (fleet) => (
      <span className="flex min-w-0 items-center gap-3">
        <InitialsAvatar initials={fleet.initials} tone={fleet.tone} />
        <span className="min-w-0 truncate text-sm font-semibold text-ink">
          {fleet.name}
        </span>
      </span>
    ),
  },
  {
    key: "owner",
    header: "Fleet owner",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (fleet) => fleet.owner,
  },
  {
    key: "drivers",
    header: "Drivers",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (fleet) => fleet.drivers,
  },
  {
    key: "vehicles",
    header: "Vehicles",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (fleet) => fleet.vehicles,
  },
  {
    key: "rides",
    header: "Active rides",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (fleet) => fleet.activeRides,
  },
  {
    key: "compliance",
    header: "Compliance",
    className: "whitespace-nowrap text-sm font-medium text-ink",
    cell: (fleet) => `${fleet.compliance}%`,
  },
  {
    key: "status",
    header: "Status",
    cell: (fleet) => (
      <StatusPill
        tone={FLEET_STATUS_TONE[fleet.status]}
        label={fleet.status}
      />
    ),
  },
];

interface FleetsViewProps {
  fleets: Fleet[];
  summary: FleetSummary;
}

export function FleetsView({ fleets, summary }: FleetsViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const confirmedExport = useConfirmedExport();

  const {
    query,
    setQuery,
    status,
    setStatus,
    filterValues,
    setFilter,
    clearFilters,
    activeFilterCount,
    page,
    setPage,
    filtered,
    pageRows,
    total,
  } = useRecordsList<Fleet>({
    rows: fleets,
    searchText: (fleet) => `${fleet.name} ${fleet.owner}`,
    statusOf: (fleet) => fleet.status,
    filters: {
      compliance: (fleet, value) =>
        value === COMPLIANCE_HIGH
          ? fleet.compliance >= 90
          : fleet.compliance < 90,
    },
  });

  const selected = fleets.find((item) => item.id === selectedId) ?? null;

  function handleExport() {
    const rows = filtered.map((fleet) => [
      fleet.id,
      fleet.name,
      fleet.owner,
      fleet.drivers,
      fleet.vehicles,
      fleet.activeRides,
      fleet.compliance,
      fleet.status,
    ]);
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`fleets-${today}.csv`, toCsv(CSV_COLUMNS, rows));
  }

  const filters = (
    <FilterPopover activeCount={activeFilterCount} onClear={clearFilters}>
      <Select
        label="Filter by compliance"
        value={filterValues.compliance}
        onChange={(event) => setFilter("compliance", event.target.value)}
      >
        <option value={ALL_COMPLIANCE}>All compliance</option>
        <option value={COMPLIANCE_HIGH}>{COMPLIANCE_HIGH}</option>
        <option value={COMPLIANCE_LOW}>{COMPLIANCE_LOW}</option>
      </Select>
    </FilterPopover>
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Fleet Management"
        description="Manage fleet partners, vehicles, drivers and compliance."
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
              Add fleet
            </Button>
          </>
        }
      />

      <StatCardGrid>
        <StatCard
          icon={Users}
          tone="brand"
          label="Fleet Partners"
          value={formatNumber(summary.fleetPartners)}
          note={summary.partnersNote}
        />
        <StatCard
          icon={User}
          tone="success"
          label="Active Drivers"
          value={formatNumber(summary.activeDrivers)}
          note={summary.driversNote}
        />
        <StatCard
          icon={Car}
          tone="warning"
          label="Fleet Vehicles"
          value={formatNumber(summary.fleetVehicles)}
          note={summary.vehiclesNote}
        />
        <StatCard
          icon={Activity}
          tone="info"
          label="Active Fleet Rides"
          value={formatNumber(summary.activeFleetRides)}
          note={summary.ridesNote}
        />
      </StatCardGrid>

      <Card className="min-w-0">
        <RecordsToolbar
          query={query}
          onQueryChange={setQuery}
          placeholder="Search fleet management..."
          searchLabel="Search fleet management"
          statusOptions={[ALL_STATUSES_LABEL, ...STATUS_OPTIONS]}
          status={status === "all" ? ALL_STATUSES_LABEL : status}
          onStatusChange={(value) =>
            setStatus(value === ALL_STATUSES_LABEL ? "all" : value)
          }
          filters={filters}
          resultCount={total}
          countLabel="records"
        />

        <RecordsTable
          columns={COLUMNS}
          rows={pageRows}
          getKey={(fleet) => fleet.id}
          onOpen={(fleet) => setSelectedId(fleet.id)}
          rowLabel={(fleet) => fleet.name}
          minWidth={1000}
          emptyMessage="No fleets match your filters."
          renderCard={(fleet) => (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <InitialsAvatar initials={fleet.initials} tone={fleet.tone} />
                  <p className="min-w-0 truncate text-sm font-semibold text-ink">
                    {fleet.name}
                  </p>
                </div>
                <StatusPill
                  tone={FLEET_STATUS_TONE[fleet.status]}
                  label={fleet.status}
                />
              </div>
              <p className="mt-2 truncate text-sm text-ink-muted">
                {fleet.owner}
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
                <span>{fleet.drivers} drivers</span>
                <span aria-hidden="true">·</span>
                <span>{fleet.vehicles} vehicles</span>
                <span aria-hidden="true">·</span>
                <span>{fleet.activeRides} rides</span>
              </p>
              <p className="mt-1 text-sm font-medium text-ink">
                {fleet.compliance}% compliant
              </p>
            </>
          )}
        />

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      </Card>

      <EntityDrawer
        model={selected ? buildFleetDetails(selected) : null}
        onClose={() => setSelectedId(null)}
      />

      {confirmedExport.dialog}
    </div>
  );
}

