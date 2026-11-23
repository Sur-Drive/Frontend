import type { Person } from "@/types/rides";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";

interface PersonCellProps {
  person: Person | null;
  // Small muted caption above the name (e.g. "Passenger" / "Driver").
  caption?: string;
}

export function PersonCell({ person, caption }: PersonCellProps) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {person ? (
        <>
          <InitialsAvatar initials={person.initials} tone={person.tone} />
          <span className="flex min-w-0 flex-col">
            {caption ? (
              <span className="text-xs text-ink-subtle">{caption}</span>
            ) : null}
            <span className="truncate text-sm font-medium text-ink">
              {person.name}
            </span>
          </span>
        </>
      ) : (
        <>
          <InitialsAvatar initials="" tone="info" empty />
          <span className="flex min-w-0 flex-col">
            {caption ? (
              <span className="text-xs text-ink-subtle">{caption}</span>
            ) : null}
            <span className="text-sm text-ink-muted">—</span>
          </span>
        </>
      )}
    </div>
  );
}
