"use client";

import { Download, Funnel } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { downloadCsv, toCsv } from "@/lib/csv";
import { EM_DASH } from "@/lib/format";
import { glanceLabel } from "@/lib/live-operations";
import { rideCategoryDisplay, rideStatusDisplay } from "@/types/rides";
import type { LiveGlance } from "@/lib/live-operations";
import type { LiveQueueRow } from "@/types/live-operations";

interface LiveOperationsHeaderProps {
  stats: LiveGlance;
  rides: LiveQueueRow[];
}

// Snapshot CSV: the seven live metric cards (metric + raw value, "—" when
// the endpoint has no such field) followed by the live ride rows currently
// loaded. Raw numbers, not formatted strings.
function buildExport(stats: LiveGlance, rides: LiveQueueRow[]) {
  const rows: (string | number)[][] = [
    ["Online Drivers", EM_DASH],
    ["Active Rides", glanceLabel(stats.activeRides)],
    ["Searching", glanceLabel(stats.searching)],
    ["Driver En Route", EM_DASH],
    ["Driver Arrived", EM_DASH],
    ["In Progress", glanceLabel(stats.inProgress)],
    ["Delayed Rides", glanceLabel(stats.delayedRides)],
    [],
    [
      "Ride ID",
      "Passenger",
      "Driver",
      "Pickup",
      "Destination",
      "Category",
      "Status",
    ],
    ...rides.map((ride) => [
      ride.id,
      ride.passenger.name,
      ride.driver?.name ?? "Unassigned",
      ride.pickup,
      ride.destination,
      rideCategoryDisplay(ride.category),
      rideStatusDisplay(ride.status).label,
    ]),
  ];
  downloadCsv("live-operations.csv", toCsv(["Live Operations Snapshot"], rows));
}

export function LiveOperationsHeader({ stats, rides }: LiveOperationsHeaderProps) {
  const confirmedExport = useConfirmedExport();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-3xl font-normal tracking-tight text-ink">
            Live Operations
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
            <span
              className="size-1.5 rounded-full bg-success motion-safe:animate-pulse"
              aria-hidden="true"
            />
            Live updates
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          Monitor active rides and driver availability across Lagos.
        </p>
      </div>

      <div className="flex w-full shrink-0 gap-2 sm:w-auto">
        {/* No confirmed endpoint exists for map filters — the button stays in
            place but disabled; disabled buttons swallow hover, so the reason
            rides on a wrapper span. */}
        <span title="Not available yet" className="flex-1 sm:flex-none">
          <Button
            variant="secondary"
            disabled
            className="pointer-events-none flex-1 sm:flex-none"
          >
            <Funnel className="size-4" aria-hidden="true" />
            Map filters
          </Button>
        </span>
        <Button
          variant="secondary"
          className="flex-1 sm:flex-none"
          onClick={() =>
            confirmedExport.requestExport("Confirm export", () =>
              buildExport(stats, rides),
            )
          }
        >
          <Download className="size-4" aria-hidden="true" />
          Export
        </Button>
      </div>
      {confirmedExport.dialog}
    </div>
  );
}

