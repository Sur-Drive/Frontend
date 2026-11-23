import { PersonCell } from "@/components/ui/PersonCell";
import { StatusPill } from "@/components/ui/StatusPill";
import type { Column } from "@/components/admin/records/RecordsTable";
import {
  incidentSeverityDisplay,
  incidentStatusDisplay,
  incidentTypeDisplay,
} from "@/lib/safety-incidents";
import type { Incident } from "@/types/trust";

// Table columns for the Safety & Incidents records table. Reported by uses a
// PersonCell (initials avatar + bold name); severity and status go through the
// display helpers so raw backend values (incl. ones outside the design's sets)
// fall back to a humanised label on a neutral chip.
export const INCIDENT_COLUMNS: Column<Incident>[] = [
  {
    key: "id",
    header: "INCIDENT ID",
    className: "whitespace-nowrap text-sm font-semibold text-ink",
    cell: (incident) => incident.id,
  },
  {
    key: "type",
    header: "TYPE",
    className: "whitespace-nowrap text-sm text-ink",
    cell: (incident) => incidentTypeDisplay(incident.type),
  },
  {
    key: "ride",
    header: "RIDE ID",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (incident) => incident.rideId,
  },
  {
    key: "reporter",
    header: "REPORTED BY",
    cell: (incident) => <PersonCell person={incident.reporter} />,
  },
  {
    key: "severity",
    header: "SEVERITY",
    cell: (incident) => {
      const display = incidentSeverityDisplay(incident.severity);
      return <StatusPill tone={display.tone} label={display.label} />;
    },
  },
  {
    key: "officer",
    header: "ASSIGNED OFFICER",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (incident) => incident.officer ?? "Unassigned",
  },
  {
    key: "date",
    header: "DATE",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (incident) => incident.dateLabel,
  },
  {
    key: "status",
    header: "STATUS",
    cell: (incident) => {
      const display = incidentStatusDisplay(incident.status);
      return <StatusPill tone={display.tone} label={display.label} />;
    },
  },
];

// Mobile/tablet card for a single incident row.
export function IncidentCard({ incident }: { incident: Incident }) {
  const status = incidentStatusDisplay(incident.status);
  const severity = incidentSeverityDisplay(incident.severity);
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold text-ink">
          {incident.id}
        </p>
        <StatusPill tone={status.tone} label={status.label} />
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        {incidentTypeDisplay(incident.type)} · {incident.rideId}
      </p>
      <div className="mt-2">
        <PersonCell person={incident.reporter} />
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-2">
        <StatusPill tone={severity.tone} label={severity.label} />
        <span className="text-sm text-ink-muted">
          {incident.officer ?? "Unassigned"}
        </span>
      </p>
      <p className="mt-1 text-xs text-ink-muted">{incident.dateLabel}</p>
    </>
  );
}
