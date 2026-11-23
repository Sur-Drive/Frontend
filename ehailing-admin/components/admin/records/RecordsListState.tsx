import { Button } from "@/components/ui/Button";

interface RecordsSkeletonProps {
  // Number of placeholder rows; roughly a screenful at the default page size.
  rows?: number;
}

// Loading placeholder for a records list: pulse rows in the same rhythm as
// the table/cards it replaces, announced to screen readers via role="status".
export function RecordsSkeleton({ rows = 6 }: RecordsSkeletonProps) {
  return (
    <div
      role="status"
      className="flex flex-col gap-3 px-1 py-2"
      aria-busy="true"
    >
      <span className="sr-only">Loading records…</span>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="h-14 w-full animate-pulse rounded-xl bg-surface-muted"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

interface RecordsErrorProps {
  // Backend message, or the friendly network-failure message from apiFetch.
  message: string;
  onRetry: () => void;
}

// Error banner for a failed list/detail request, with a Retry button.
export function RecordsError({ message, onRetry }: RecordsErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-border bg-danger-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="min-w-0 text-sm font-medium text-danger">{message}</p>
      <Button
        variant="secondary"
        onClick={onRetry}
        className="shrink-0 self-start sm:self-auto"
      >
        Retry
      </Button>
    </div>
  );
}
