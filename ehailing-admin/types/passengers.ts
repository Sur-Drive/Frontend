import type { StatusTone } from "@/components/ui/StatusPill";
import type { Person } from "@/types/rides";
import { EM_DASH, humanize } from "@/lib/format";

// UI record for a passenger row, populated from live backend data by
// lib/passengers.ts. `status` holds the RAW backend accountStatus value;
// render it with passengerAccountDisplay so unknown values stay safe.

export interface Passenger {
  id: string;
  person: Person;
  phone: string;
  email: string;
  totalRides: number | null;
  // Fare spend in naira.
  totalSpend: number | null;
  rating: number | null;
  registeredLabel: string;
  status: string;
  lastActive: string;
}

export interface StatusDisplay {
  label: string;
  tone: StatusTone;
}

// Known values are exactly those observed in backend samples.
// Samples are NOT exhaustive: anything unknown gets a
// neutral tone and a humanised raw label.
const PASSENGER_ACCOUNT_DISPLAY: Record<string, StatusDisplay> = {
  active: { label: "Active", tone: "success" },
};

export function passengerAccountDisplay(
  raw: string | null | undefined,
): StatusDisplay {
  if (raw === null || raw === undefined || raw.trim() === "") {
    return { label: EM_DASH, tone: "neutral" };
  }
  return PASSENGER_ACCOUNT_DISPLAY[raw.trim().toLowerCase()] ?? {
    label: humanize(raw),
    tone: "neutral",
  };
}
