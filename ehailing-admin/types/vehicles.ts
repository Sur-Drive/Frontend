import type { StatusTone } from "@/components/ui/StatusPill";
import type { Person } from "@/types/rides";
import { EM_DASH, humanize } from "@/lib/format";

// Kept for the driver drawer's vehicle record (lib/drivers.ts maps the
// vehicle approval status onto it). The vehicles section itself never uses
// this vocabulary: GET /admin/ride-hailing/vehicles reports accountStatus as
// approved | pending | suspended (see vehicleAccountDisplay below), which is
// a different meaning from a driver's "active".
export type VehicleAccount = "Active" | "Pending" | "Suspended";

export interface StatusDisplay {
  label: string;
  tone: StatusTone;
}

// UI record for a vehicle row, populated from live backend data by
// lib/vehicles.ts. Status fields hold the RAW backend value; render them with
// the vehicle*Display helpers below so unknown values still get a safe pill.
export interface Vehicle {
  id: string;
  // Backend makeModel already combines make + model ("Toyota Corolla 2021",
  // or just the make when model is null); "—" when no vehicle record exists.
  makeModel: string;
  regNumber: string;
  driver: Person;
  // Raw backend value humanised for display ("suv" -> "SUV").
  category: string;
  capacity: number | null;
  // Formatted expiry date, or "—" — null in every observed list row.
  insuranceExpiry: string;
  // Pair derived from nearestDocumentName + nearestDocumentExpiry.
  nearestDocument: string;
  // Raw inspection.complete; null when the field is missing.
  inspectionComplete: boolean | null;
  hasDocumentIssues: boolean;
  // Raw backend accountStatus: approved | pending | suspended observed.
  account: string;
}

// Known values are exactly those observed in backend samples
// (2026-11-11). Samples are NOT exhaustive: anything unknown renders with a
// neutral tone and a humanised raw label, so a new backend value never breaks
// the UI. NULL renders "—".
const VEHICLE_ACCOUNT_DISPLAY: Record<string, StatusDisplay> = {
  approved: { label: "Approved", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  suspended: { label: "Suspended", tone: "danger" },
};

export function vehicleAccountDisplay(
  raw: string | null | undefined,
): StatusDisplay {
  if (raw === null || raw === undefined || raw.trim() === "") {
    return { label: EM_DASH, tone: "neutral" };
  }
  return VEHICLE_ACCOUNT_DISPLAY[raw.trim().toLowerCase()] ?? {
    label: humanize(raw),
    tone: "neutral",
  };
}

// This endpoint carries no inspection status string — only the boolean
// inspection.complete — so the pill reports exactly that: true -> "Complete",
// false -> "Incomplete", missing -> "—".
export function vehicleInspectionDisplay(
  complete: boolean | null | undefined,
): StatusDisplay {
  if (typeof complete !== "boolean") {
    return { label: EM_DASH, tone: "neutral" };
  }
  return complete
    ? { label: "Complete", tone: "success" }
    : { label: "Incomplete", tone: "warning" };
}

// documents[].status observed values: pending | verified (2026-11-11).
const VEHICLE_DOCUMENT_DISPLAY: Record<string, StatusDisplay> = {
  verified: { label: "Verified", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
};

export function vehicleDocumentDisplay(
  raw: string | null | undefined,
): StatusDisplay {
  if (raw === null || raw === undefined || raw.trim() === "") {
    return { label: EM_DASH, tone: "neutral" };
  }
  return VEHICLE_DOCUMENT_DISPLAY[raw.trim().toLowerCase()] ?? {
    label: humanize(raw),
    tone: "neutral",
  };
}

// inspectionPhotos[].uploaded is a boolean, not a status string.
export function vehiclePhotoDisplay(uploaded: boolean): StatusDisplay {
  return uploaded
    ? { label: "Uploaded", tone: "success" }
    : { label: "Missing", tone: "warning" };
}
