import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Select } from "@/components/ui/Select";

interface RecordsToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  // Accessible name for the search input. Defaults to "Search records";
  // each page passes the label that matches its own placeholder.
  searchLabel?: string;
  statusOptions: string[];
  status: string;
  onStatusChange: (value: string) => void;
  filters: ReactNode;
  resultCount: number;
  // Plural noun used for the count text; the singular drops the trailing "s".
  countLabel?: "results" | "records";
  // Renders the status select as unavailable (a visual-only filter with no
  // backend support yet) and surfaces the reason as a tooltip. The title sits
  // on a wrapper span because disabled controls swallow hover in some
  // browsers — the same pattern the drawer's disabled footer actions use.
  statusDisabled?: boolean;
  statusDisabledReason?: string;
}

// Records toolbar: search, a filter popover slot and a status select, with a
// result count. Single row from md up; stacks (search, then filters + status)
// on smaller screens.
export function RecordsToolbar({
  query,
  onQueryChange,
  placeholder,
  searchLabel = "Search records",
  statusOptions,
  status,
  onStatusChange,
  filters,
  resultCount,
  countLabel = "results",
  statusDisabled = false,
  statusDisabledReason = "Not available yet",
}: RecordsToolbarProps) {
  const countNoun = resultCount === 1 ? countLabel.replace(/s$/, "") : countLabel;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="order-1 w-full min-w-0 md:order-0 md:w-auto md:max-w-md md:flex-1">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label={searchLabel}
            placeholder={placeholder}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-base text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          />
        </div>
      </div>

      <div className="order-3 flex min-w-0 flex-1 items-center gap-3 md:order-0 md:flex-none">
        <div className="min-w-0 flex-1 md:flex-none">{filters}</div>
        {statusDisabled ? (
          <span
            className="min-w-0 flex-1 md:w-44 md:flex-none"
            title={statusDisabledReason}
          >
            <Select
              label="Filter by status"
              options={statusOptions}
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
              disabled
              className="w-full"
            />
          </span>
        ) : (
          <Select
            label="Filter by status"
            options={statusOptions}
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="min-w-0 flex-1 md:w-44 md:flex-none"
          />
        )}
      </div>

      <span className="order-4 w-full shrink-0 text-sm text-ink-muted md:order-0 md:ml-auto md:w-auto">
        {resultCount} {countNoun}
      </span>
    </div>
  );
}
