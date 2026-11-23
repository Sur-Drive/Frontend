import type { StatusTone } from "@/components/ui/StatusPill";
import { EM_DASH, humanize } from "@/lib/format";

// UI record for a ride row, populated from live backend data by lib/rides.ts.
// Status fields hold the RAW backend value; render them with the ride*Display
// helpers below so unknown values still get a safe pill. Samples are NOT
// exhaustive: anything unknown renders with a neutral tone and a humanised
// raw label, so a new backend value never breaks the UI. NULL renders "—".

export interface StatusDisplay {
  label: string;
  tone: StatusTone;
}

// Humanised category labels used by the scheduled-rides section. The live
// rides section maps raw backend values through rideCategoryDisplay instead.
export type RideCategory = "Economy" | "Comfort" | "SUV";

export interface Person {
  name: string;
  initials: string;
  tone: "brand" | "success" | "warning" | "info";
}

export interface Ride {
  id: string;
  passenger: Person;
  driver: Person | null;
  pickup: string;
  destination: string;
  // Raw backend category: economy | comfort | suv observed.
  category: string;
  // Fare in naira.
  fare: number;
  // Raw backend payment status: paid | unpaid observed.
  paymentStatus: string;
  // Raw backend ride status: paid | cancelled | no_drivers_found |
  // payment_pending | driver_en_route | ride_in_progress observed.
  status: string;
  dateLabel: string;
  // e.g. "Honda Accord • LSR 318 KE", or null when no driver is assigned.
  vehicle: string | null;
  distanceKm: number;
  durationMin: number;
}

// Observed ride statuses -> chip tones. Not exhaustive;
// anything missing falls back to neutral + a humanised label.
const RIDE_STATUS_TONES: Record<string, StatusTone> = {
  paid: "success",
  payment_pending: "warning",
  ride_in_progress: "info",
  driver_en_route: "info",
  no_drivers_found: "danger",
  cancelled: "neutral",
};

// Observed payment statuses -> chip tones.
const PAYMENT_STATUS_TONES: Record<string, StatusTone> = {
  paid: "success",
  unpaid: "warning",
};

// Backend category values are lowercase; the UI uses title case, with "suv"
// kept as the acronym "SUV".
const CATEGORY_LABELS: Record<string, string> = { suv: "SUV" };

function displayFrom(
  raw: string | null | undefined,
  tones: Record<string, StatusTone>,
): StatusDisplay {
  if (raw === null || raw === undefined || raw.trim() === "") {
    return { label: EM_DASH, tone: "neutral" };
  }
  return {
    label: humanize(raw),
    tone: tones[raw.trim().toLowerCase()] ?? "neutral",
  };
}

export function rideStatusDisplay(raw: string | null | undefined): StatusDisplay {
  return displayFrom(raw, RIDE_STATUS_TONES);
}

export function paymentStatusDisplay(raw: string | null | undefined): StatusDisplay {
  return displayFrom(raw, PAYMENT_STATUS_TONES);
}

export function rideCategoryDisplay(raw: string | null | undefined): string {
  if (raw === null || raw === undefined || raw.trim() === "") {
    return EM_DASH;
  }
  const trimmed = raw.trim();
  return CATEGORY_LABELS[trimmed.toLowerCase()] ?? humanize(trimmed);
}


