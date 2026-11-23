import { PersonCell } from "@/components/ui/PersonCell";
import { StatusPill } from "@/components/ui/StatusPill";
import type { Column } from "@/components/admin/records/RecordsTable";
import {
  riskLevelDisplay,
  riskPatternDisplay,
  riskScoreLabel,
  riskStatusDisplay,
} from "@/lib/fraud";
import type { RiskCase } from "@/types/trust";

// Table columns for the Fraud & Risk records table. Subject uses a PersonCell
// (initials avatar + bold name); risk level and status chips come from the
// lib/fraud display helpers (raw backend values in, neutral humanised chip
// for unknown values).
export const RISK_COLUMNS: Column<RiskCase>[] = [
  {
    key: "subject",
    header: "SUBJECT",
    cell: (risk) => <PersonCell person={risk.subject} />,
  },
  {
    key: "pattern",
    header: "RISK PATTERN",
    className: "whitespace-nowrap text-sm text-ink",
    cell: (risk) => riskPatternDisplay(risk.pattern),
  },
  {
    key: "signal",
    header: "SIGNAL",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (risk) => risk.signal ?? "—",
  },
  {
    key: "riskLevel",
    header: "RISK LEVEL",
    cell: (risk) => {
      const level = riskLevelDisplay(risk.riskLevel);
      return <StatusPill tone={level.tone} label={level.label} />;
    },
  },
  {
    key: "riskScore",
    header: "RISK SCORE",
    className: "whitespace-nowrap text-sm text-ink",
    cell: (risk) => riskScoreLabel(risk.riskScore),
  },
  {
    key: "detected",
    header: "DETECTED",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (risk) => risk.detectedLabel,
  },
  {
    key: "status",
    header: "STATUS",
    cell: (risk) => {
      const status = riskStatusDisplay(risk.status);
      return <StatusPill tone={status.tone} label={status.label} />;
    },
  },
];

// Mobile/tablet card for a single risk row.
export function RiskCard({ risk }: { risk: RiskCase }) {
  const status = riskStatusDisplay(risk.status);
  const level = riskLevelDisplay(risk.riskLevel);
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <PersonCell person={risk.subject} />
        <StatusPill tone={status.tone} label={status.label} />
      </div>
      <p className="mt-2 text-sm text-ink">
        {riskPatternDisplay(risk.pattern)}
      </p>
      <p className="mt-1 text-sm text-ink-muted">{risk.signal ?? "—"}</p>
      <p className="mt-2 flex flex-wrap items-center gap-2">
        <StatusPill tone={level.tone} label={level.label} />
        <span className="text-sm text-ink-muted">
          {riskScoreLabel(risk.riskScore)}
        </span>
      </p>
      <p className="mt-1 text-xs text-ink-muted">{risk.detectedLabel}</p>
    </>
  );
}
