"use client";

import { useMemo, useState } from "react";
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
import { RideDetailsDrawer } from "@/components/admin/rides/RideDetailsDrawer";
import { downloadCsv, toCsv } from "@/lib/csv";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { buildScheduledRideDetails } from "@/lib/ride-details";
import { SCHEDULED_STATUS_TONE } from "@/types/scheduled-rides";
import type {
  ScheduledRide,
  ScheduledStatus,
  WhenBucket,
} from "@/types/scheduled-rides";

const ALL_STATUSES = "All statuses";
const ALL_WHEN = "All dates";
const ALL_ASSIGNMENT = "All";
const ASSIGNED = "Assigned";
const NOT_ASSIGNED = "Not assigned";

const STATUS_OPTIONS: ScheduledStatus[] = [
  "Confirmed",
  "Pending Assignment",
  "Cancelled",
];

const WHEN_OPTIONS: { label: string; value: WhenBucket }[] = [
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "Later", value: "later" },
];

const COLUMNS = [
  "Scheduled Ride ID",
  "Passenger",
  "Pickup",
  "Destination",
  "Scheduled Date & Time",
  "Assigned Driver",
  "Status",
];

interface ScheduledRidesViewProps {
  rides: ScheduledRide[];
}

function matchesQuery(ride: ScheduledRide, query: string): boolean {
  if (!query) return true;
  const haystack = [
    ride.id,
    ride.passenger.name,
    ride.pickup,
    ride.destination,
    ride.driverName ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function ScheduledRidesView({ rides }: ScheduledRidesViewProps) {
  const [query, setQuery] = useState("");
  const confirmedExport = useConfirmedExport();
  const [status, setStatus] = useState(ALL_STATUSES);
  const [when, setWhen] = useState<WhenBucket | typeof ALL_WHEN>(ALL_WHEN);
  const [assignment, setAssignment] = useState(ALL_ASSIGNMENT);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rides.filter(
      (ride) =>
        (status === ALL_STATUSES || ride.status === status) &&
        (when === ALL_WHEN || ride.whenBucket === when) &&
        (assignment === ALL_ASSIGNMENT ||
          (assignment === ASSIGNED) === (ride.driverName !== null)) &&
        matchesQuery(ride, q),
    );
  }, [rides, query, status, when, assignment]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  const activeFilterCount =
    (when === ALL_WHEN ? 0 : 1) + (assignment === ALL_ASSIGNMENT ? 0 : 1);

  function withReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function clearFilters() {
    setWhen(ALL_WHEN);
    setAssignment(ALL_ASSIGNMENT);
    setPage(1);
  }

  function handleExport() {
    const columns = [
      "Scheduled ride ID",
      "Passenger",
      "Pickup",
      "Destination",
      "Scheduled date & time",
      "Assigned driver",
      "Status",
    ];
    const rows = filtered.map((ride) => [
      ride.id,
      ride.passenger.name,
      ride.pickup,
      ride.destination,
      ride.whenLabel,
      ride.driverName ?? "",
      ride.status,
    ]);
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`scheduled-rides-${today}.csv`, toCsv(columns, rows));
  }

  function rowProps(ride: ScheduledRide): HTMLAttributes<HTMLTableRowElement> {
    return {
      tabIndex: 0,
      onClick: () => setSelectedId(ride.id),
      onKeyDown: (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setSelectedId(ride.id);
        }
      },
      className:
        "cursor-pointer transition-colors hover:bg-brand-soft/40 focus-visible:bg-brand-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset",
    };
  }

  function actionsCell(ride: ScheduledRide) {
    return (
      <button
        type="button"
        aria-label={`Open details for ${ride.id}`}
        onClick={(event) => {
          event.stopPropagation();
          setSelectedId(ride.id);
        }}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </button>
    );
  }


  const filters = (
    <FilterPopover activeCount={activeFilterCount} onClear={clearFilters}>
      <Select
        label="Filter by scheduled date"
        options={[ALL_WHEN, ...WHEN_OPTIONS.map((option) => option.label)]}
        value={
          WHEN_OPTIONS.find((option) => option.value === when)?.label ?? ALL_WHEN
        }
        onChange={(event) => {
          const option = WHEN_OPTIONS.find(
            (o) => o.label === event.target.value,
          );
          withReset(setWhen)(option ? option.value : ALL_WHEN);
        }}
      />
      <Select
        label="Filter by driver assignment"
        options={[ALL_ASSIGNMENT, ASSIGNED, NOT_ASSIGNED]}
        value={assignment}
        onChange={(event) => withReset(setAssignment)(event.target.value)}
      />
    </FilterPopover>
  );

  const selectedRide = rides.find((ride) => ride.id === selectedId) ?? null;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Scheduled Rides"
        description="Manage upcoming bookings, assignments and schedules."
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
          onQueryChange={withReset(setQuery)}
          placeholder="Search scheduled rides..."
          searchLabel="Search scheduled rides"
          statusOptions={[ALL_STATUSES, ...STATUS_OPTIONS]}
          status={status}
          onStatusChange={withReset(setStatus)}
          filters={filters}
          resultCount={filtered.length}
        />

        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-muted">
            No scheduled rides match your filters.
          </p>
        ) : (
          <>
            {/* Desktop: table. Only this wrapper scrolls, never the page. */}
            <div className="hidden w-full max-w-full min-w-0 overflow-x-auto lg:block">
              <table className="w-full min-w-240 border-collapse text-left">
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
                  {pageRows.map((ride) => (
                    <tr key={ride.id} {...rowProps(ride)}>
                      <Td className="whitespace-nowrap text-sm text-ink-muted">
                        {ride.id}
                      </Td>
                      <Td>
                        <PersonCell person={ride.passenger} />
                      </Td>
                      <Td className="whitespace-nowrap text-sm text-ink-muted">
                        {ride.pickup}
                      </Td>
                      <Td className="whitespace-nowrap text-sm text-ink-muted">
                        {ride.destination}
                      </Td>
                      <Td className="whitespace-nowrap text-sm text-ink-muted">
                        {ride.whenLabel}
                      </Td>
                      <Td className="whitespace-nowrap text-sm text-ink-muted">
                        {ride.driverName ?? NOT_ASSIGNED}
                      </Td>
                      <Td>
                        <StatusPill
                          tone={SCHEDULED_STATUS_TONE[ride.status]}
                          label={ride.status}
                        />
                      </Td>
                      <Td className="text-right">{actionsCell(ride)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


            {/* Mobile and tablet: cards. */}
            <ul className="flex flex-col gap-3 lg:hidden">
              {pageRows.map((ride) => {
                const interactiveProps: HTMLAttributes<HTMLDivElement> = {
                  role: "button",
                  tabIndex: 0,
                  onClick: () => setSelectedId(ride.id),
                  onKeyDown: (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(ride.id);
                    }
                  },
                };
                return (
                  <li key={ride.id}>
                    <div
                      className="w-full cursor-pointer rounded-xl border border-border p-4 text-left transition-colors hover:bg-brand-soft/40 focus-visible:bg-brand-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      {...interactiveProps}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-ink-muted">{ride.id}</span>
                        <StatusPill
                          tone={SCHEDULED_STATUS_TONE[ride.status]}
                          label={ride.status}
                        />
                      </div>

                      <div className="mt-3">
                        <PersonCell
                          person={ride.passenger}
                          caption="Passenger"
                        />
                      </div>

                      <p className="mt-3 text-sm text-ink-muted">
                        {ride.pickup} → {ride.destination}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-ink-subtle">
                          {ride.whenLabel}
                        </span>
                        <span
                          className={
                            ride.driverName
                              ? "text-xs text-ink-muted"
                              : "text-xs text-ink-subtle"
                          }
                        >
                          {ride.driverName ?? NOT_ASSIGNED}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <Pagination
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPageChange={setPage}
        />
      </Card>

      <RideDetailsDrawer
        details={selectedRide ? buildScheduledRideDetails(selectedRide) : null}
        onClose={() => setSelectedId(null)}
      />

      {confirmedExport.dialog}
    </div>
  );
}

