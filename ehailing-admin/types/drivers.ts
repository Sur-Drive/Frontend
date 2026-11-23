import type { StatusTone } from "@/components/ui/StatusPill";
import type { Person } from "@/types/rides";
import { EM_DASH, humanize } from "@/lib/format";

// UI record for a driver row, populated from live backend data by
// lib/drivers.ts. Status fields hold the RAW backend value; render them with
// the driver*Display helpers below so unknown values still get a safe pill.

export interface Driver {
  id: string;
  person: Person;
  phone: string;
  email: string;
  vehicle: string;
  category: string;
  totalRides: number | null;
  rating: number | null;
  // Earnings in naira; null until the overview detail has loaded (the list
  // response does not carry earnings).
  earnings: number | null;
  joinedLabel: string;
  lastActive: string;
  verification: string;
  online: string;
  account: string;
}

export interface StatusDisplay {
  label: string;
  tone: StatusTone;
}

// Known values are exactly those observed in backend samples.
// Samples are NOT exhaustive: anything unknown renders with a neutral tone and
// a humanised raw label, so a new backend value never breaks the UI.
const DRIVER_VERIFICATION_DISPLAY: Record<string, StatusDisplay> = {
  approved: { label: "Approved", tone: "success" },
  pending: { label: "Pending Review", tone: "warning" },
};

const DRIVER_ONLINE_DISPLAY: Record<string, StatusDisplay> = {
  online: { label: "Online", tone: "success" },
  on_ride: { label: "On trip", tone: "brand" },
  offline: { label: "Offline", tone: "neutral" },
};

const DRIVER_ACCOUNT_DISPLAY: Record<string, StatusDisplay> = {
  active: { label: "Active", tone: "success" },
};

function displayFrom(
  raw: string | null | undefined,
  known: Record<string, StatusDisplay>,
): StatusDisplay {
  if (raw === null || raw === undefined || raw.trim() === "") {
    return { label: EM_DASH, tone: "neutral" };
  }
  return known[raw.trim().toLowerCase()] ?? {
    label: humanize(raw),
    tone: "neutral",
  };
}

export function driverVerificationDisplay(
  raw: string | null | undefined,
): StatusDisplay {
  return displayFrom(raw, DRIVER_VERIFICATION_DISPLAY);
}

export function driverOnlineDisplay(
  raw: string | null | undefined,
): StatusDisplay {
  return displayFrom(raw, DRIVER_ONLINE_DISPLAY);
}

export function driverAccountDisplay(
  raw: string | null | undefined,
): StatusDisplay {
  return displayFrom(raw, DRIVER_ACCOUNT_DISPLAY);
}

// Account-status strings the backend may use for a non-active account.
// UNOBSERVED in every sample so far (the list has only
// ever reported "active") — kept tolerant so a future/alternate value still
// enables Reactivate instead of bricking it.
const SUSPENDED_ACCOUNT_STATUSES = new Set([
  "suspended",
  "inactive",
  "blocked",
]);

// Suspension state of a driver, read from the RAW backend values (never the
// display labels) and case-insensitively. The backend does NOT flip
// accountStatus on suspend: re-observed live 2026-11-18, a suspended driver
// reports accountStatus "active" on BOTH the list row and the overview while
// verificationStatus is "suspended" (no suspend event exists in activity-logs
// either — total 0 for entityType=driver and action=suspend). Suspension is
// therefore detected from EITHER field: the observed verificationStatus value,
// or the unobserved accountStatus variants above. `active` additionally
// requires the verification value NOT to contradict the account value, so the
// observed suspended row (active + suspended) is never treated as active.
export function driverSuspension(
  account: string | null | undefined,
  verification: string | null | undefined,
): { suspended: boolean; active: boolean } {
  const accountRaw = (account ?? "").trim().toLowerCase();
  const verificationRaw = (verification ?? "").trim().toLowerCase();
  const suspended =
    verificationRaw === "suspended" ||
    SUSPENDED_ACCOUNT_STATUSES.has(accountRaw);
  return {
    suspended,
    active: accountRaw === "active" && !suspended,
  };
}

// Account-status chip for a driver, derived from driverSuspension(): the
// backend keeps accountStatus "active" after suspend (observed live
// 2026-11-18), so the raw account value alone renders a misleading "Active"
// chip for a suspended driver. A suspended driver shows "Suspended" on danger
// no matter what accountStatus says; every other driver keeps the raw-value
// chip (unknown values keep the neutral "—"/humanised fallback). Single
// source for the drawer pills, the list row, the card and the CSV status.
export function driverAccountStatusDisplay(
  account: string | null | undefined,
  verification: string | null | undefined,
): StatusDisplay {
  if (driverSuspension(account, verification).suspended) {
    return { label: "Suspended", tone: "danger" };
  }
  return driverAccountDisplay(account);
}
