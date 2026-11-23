import { PersonCell } from "@/components/ui/PersonCell";
import { StatusPill } from "@/components/ui/StatusPill";
import type { StatusTone } from "@/components/ui/StatusPill";
import type { Column } from "@/components/admin/records/RecordsTable";
import { formatNaira } from "@/lib/format";
import { REFUND_STATUS_TONE, TRANSACTION_STATUS_TONE } from "@/types/finance";
import type { Transaction } from "@/types/finance";

// Which tone map a transaction list uses: payments keep the transaction map,
// refunds use the refund map (same statuses, different colours).
export type TransactionKind = "payment" | "refund";

function statusTone(status: Transaction["status"], kind: TransactionKind): StatusTone {
  return kind === "refund"
    ? REFUND_STATUS_TONE[status]
    : TRANSACTION_STATUS_TONE[status];
}

// Shared Payments & Transactions pieces, reused by Refunds.
export function buildTransactionColumns(
  kind: TransactionKind = "payment",
): Column<Transaction>[] {
  return [
    {
      key: "id",
      header: "TRANSACTION ID",
      className: "whitespace-nowrap text-sm font-semibold text-ink",
      cell: (tx) => tx.id,
    },
    {
      key: "ride",
      header: "RIDE ID",
      className: "whitespace-nowrap text-sm text-ink-muted",
      cell: (tx) => tx.rideId,
    },
    {
      key: "passenger",
      header: "PASSENGER",
      cell: (tx) => <PersonCell person={tx.passenger} />,
    },
    {
      key: "method",
      header: "PAYMENT METHOD",
      className: "whitespace-nowrap text-sm text-ink-muted",
      cell: (tx) => tx.method,
    },
    {
      key: "gross",
      header: "GROSS FARE",
      className: "whitespace-nowrap text-sm font-medium text-ink",
      cell: (tx) => formatNaira(tx.gross),
    },
    {
      key: "commission",
      header: "COMMISSION",
      className: "whitespace-nowrap text-sm text-ink-muted",
      cell: (tx) => formatNaira(tx.commission),
    },
    {
      key: "earnings",
      header: "DRIVER EARNINGS",
      className: "whitespace-nowrap text-sm font-medium text-ink",
      cell: (tx) => formatNaira(tx.earnings),
    },
    {
      key: "status",
      header: "STATUS",
      cell: (tx) => (
        <StatusPill tone={statusTone(tx.status, kind)} label={tx.status} />
      ),
    },
    {
      key: "date",
      header: "DATE",
      className: "whitespace-nowrap text-sm text-ink-muted",
      cell: (tx) => tx.dateLabel,
    },
  ];
}

export function TransactionCard({
  tx,
  kind = "payment",
}: {
  tx: Transaction;
  kind?: TransactionKind;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold text-ink">
          {tx.id}
        </p>
        <StatusPill tone={statusTone(tx.status, kind)} label={tx.status} />
      </div>
      <div className="mt-2">
        <PersonCell person={tx.passenger} />
      </div>
      <p className="mt-2 truncate text-sm text-ink-muted">
        {tx.method} · {tx.dateLabel}
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        Gross {formatNaira(tx.gross)} · Commission{" "}
        {formatNaira(tx.commission)} · Earnings {formatNaira(tx.earnings)}
      </p>
    </>
  );
}
