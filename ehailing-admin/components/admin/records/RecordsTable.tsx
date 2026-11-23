import type { KeyboardEvent, ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { Th, Td } from "@/components/ui/DataTable";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface RecordsTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  // When set, rows and cards open the record's details.
  onOpen?: (row: T) => void;
  renderCard: (row: T) => ReactNode;
  // Table min-width in px (only the wrapper scrolls horizontally).
  minWidth?: number;
  emptyMessage: string;
  // Human label used in the actions button's aria-label; falls back to the key.
  rowLabel?: (row: T) => string;
  // When provided, replaces the default "…" open-details button in the actions
  // cell (e.g. a per-row dropdown menu).
  renderActions?: (row: T) => ReactNode;
  // Read-only mode: rows keep their behaviour but lose the hover/pointer
  // affordance, so a log-style table never looks clickable.
  interactive?: boolean;
  // Omits the actions column entirely (no header cell, no cell content).
  hideActions?: boolean;
}

const ROW_CLASS =
  "cursor-pointer transition-colors hover:bg-brand-soft/40 focus-visible:bg-brand-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

// Generic records table mirroring Ride Management: a wide table from lg up
// (with a "…" actions cell) and stacked cards below lg. Renders purely from
// the column definitions and the card renderer, so every People & Fleets list
// keeps the same look and interaction.
export function RecordsTable<T>({
  columns,
  rows,
  getKey,
  onOpen,
  renderCard,
  minWidth = 960,
  emptyMessage,
  rowLabel,
  renderActions,
  interactive = true,
  hideActions = false,
}: RecordsTableProps<T>) {
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-ink-muted">{emptyMessage}</p>
    );
  }

  function label(row: T): string {
    return rowLabel ? rowLabel(row) : getKey(row);
  }

  function rowProps(row: T) {
    if (!onOpen) return {};
    return {
      tabIndex: 0,
      onClick: () => onOpen(row),
      onKeyDown: (event: KeyboardEvent<HTMLTableRowElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(row);
        }
      },
      className: interactive ? ROW_CLASS : undefined,
    };
  }

  function actionsCell(row: T) {
    if (renderActions) {
      return <Td className="text-right">{renderActions(row)}</Td>;
    }
    return (
      <Td className="text-right">
        <button
          type="button"
          aria-label={`Open details for ${label(row)}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpen?.(row);
          }}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </button>
      </Td>
    );
  }

  return (
    <>
      {/* Desktop: table. Only this wrapper scrolls, never the page. */}
      <div className="hidden w-full max-w-full min-w-0 overflow-x-auto lg:block">
        <table
          className="w-full border-collapse text-left"
          style={{ minWidth }}
        >
          <thead>
            <tr className="bg-surface-muted">
              {columns.map((column) => (
                <Th key={column.key} className={column.className}>
                  {column.header}
                </Th>
              ))}
              {hideActions ? null : (
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={getKey(row)} {...rowProps(row)}>
                {columns.map((column) => (
                  <Td key={column.key} className={column.className}>
                    {column.cell(row)}
                  </Td>
                ))}
                {hideActions ? null : actionsCell(row)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile and tablet: cards. Without onOpen they are plain elements,
          not buttons, so a read-only table stays non-interactive. */}
      <ul className="flex flex-col gap-3 lg:hidden">
        {rows.map((row) => (
          <li key={getKey(row)}>
            {onOpen ? (
              <button
                type="button"
                onClick={() => onOpen(row)}
                className={`w-full rounded-xl border border-border p-4 text-left ${interactive ? ROW_CLASS : ""}`}
              >
                {renderCard(row)}
              </button>
            ) : (
              <div className="w-full rounded-xl border border-border p-4 text-left">
                {renderCard(row)}
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
