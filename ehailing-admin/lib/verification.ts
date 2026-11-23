import { apiFetch } from "@/lib/api";
import { EM_DASH, formatDateLabel, formatNumber, humanize } from "@/lib/format";
import type { Person } from "@/types/rides";
import type { VerificationRequest, VerificationSummary } from "@/types/verification";
import type {
  VerificationListItem,
  VerificationListResponse,
  VerificationStatsResponse,
} from "@/types/verification-api";

// Confirmed query params: page, limit, search, status,
// documentKey. Only the ones this page wires are accepted here; nothing is
// invented. Verified 2026-11-11: `search` returns total=0 for a nonsense
// term while the default is non-empty on all three tabs, and every wired
// `status` value returns 200.

export type VerificationTab = "driver" | "vehicle" | "expiring";

export interface VerificationPageQuery {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

// GET /admin/ride-hailing/verification/{tab} — observed envelope
// { items, total, page, limit, totalPages }.
export async function fetchVerificationPage(
  tab: VerificationTab,
  query: VerificationPageQuery,
  signal?: AbortSignal,
): Promise<VerificationListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  return apiFetch<VerificationListResponse>(
    `/admin/ride-hailing/verification/${tab}?${params.toString()}`,
    { signal },
  );
}

// GET /admin/ride-hailing/verification/stats — bare object, no envelope.
export async function fetchVerificationStats(
  signal?: AbortSignal,
): Promise<VerificationStatsResponse> {
  return apiFetch<VerificationStatsResponse>(
    "/admin/ride-hailing/verification/stats",
    { signal },
  );
}

const AVATAR_TONES: Person["tone"][] = ["brand", "success", "warning", "info"];

// Deterministic avatar from the name (same input -> same output on server
// and client, so hydration never mismatches).
function makePerson(name: string): Person {
  const words = name.split(/\s+/).filter((word) => /^[A-Za-z0-9]/.test(word));
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index)) % AVATAR_TONES.length;
  }
  return {
    name,
    initials: initials || EM_DASH,
    tone: AVATAR_TONES[hash],
  };
}

function asString(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// Maps one backend submission onto the UI VerificationRequest shape. Every
// field is read defensively: a missing/null value renders as "—" downstream
// and an undefined record never throws. The endpoint carries no reviewer
// assignment, reference number or issuer field (verifiedBy is null in every
// observed sample), so those render "—" / "Unassigned" — never a fabricated
// name. `actionTarget` feeds the PATCH decision endpoint
// (/verification/{profileId}/documents/{key}).
export function mapVerificationListItem(
  item: VerificationListItem,
): VerificationRequest {
  const record = (item ?? {}) as Partial<VerificationListItem>;
  const applicant = (record.applicant ?? {}) as Partial<
    VerificationListItem["applicant"]
  >;
  const document = (record.document ?? {}) as Partial<
    VerificationListItem["document"]
  >;
  const name = asString(applicant.name) || EM_DASH;
  const person = makePerson(name);
  const submissionType = asString(record.submissionType).toLowerCase();
  const profileId = asString(applicant.profileId);
  const documentKey = asString(document.key);
  const documentName =
    asString(document.name) || (documentKey ? humanize(documentKey) : EM_DASH);
  const verifiedAt = asString(record.verifiedAt);
  return {
    id: asString(record.id),
    applicant: name,
    initials: person.initials,
    tone: person.tone,
    // Mirrors the driver-drawer documents mapping: unknown types fall back to
    // "Fleet" (the only non-vehicle/driver bucket the design has).
    type:
      submissionType === "vehicle"
        ? "Vehicle"
        : submissionType === "driver"
          ? "Driver"
          : "Fleet",
    document: documentName,
    submittedLabel: formatDateLabel(record.submissionDate ?? null),
    expiryLabel: record.expiryDate ? formatDateLabel(record.expiryDate) : null,
    reviewer: asString(record.verifiedBy) || null,
    // Raw backend status — render through verificationStatusDisplay().
    status: asString(record.status),
    expiringSoon:
      asString(record.status) === "expiring_soon" ||
      (asNumber(record.daysUntilExpiry) ?? Infinity) <= 14,
    // No reference-number / issuer field exists on this endpoint.
    refNumber: EM_DASH,
    issuer: EM_DASH,
    ...(profileId && documentKey
      ? { actionTarget: { profileId, documentKeys: [documentKey] } }
      : {}),
    ...(verifiedAt ? { verifiedLabel: formatDateLabel(verifiedAt) } : {}),
  };
}

// Maps the stats response onto the summary cards. A missing response (not
// loaded or failed) yields all-null fields so every card renders "—", never a
// fabricated 0; a loaded response keeps the endpoint's true zeros.
export function mapVerificationSummary(
  response: VerificationStatsResponse | null | undefined,
): VerificationSummary {
  if (!response || typeof response !== "object") {
    return {
      pendingReview: null,
      approvedToday: null,
      expiringSoon: null,
      expiringSoonWindowDays: null,
    };
  }
  return {
    pendingReview: asNumber(response.pendingReviews),
    approvedToday: asNumber(response.approvedToday),
    expiringSoon: asNumber(response.expiringSoon),
    expiringSoonWindowDays: asNumber(response.expiringSoonWindowDays),
  };
}

// Stat card label: null (unloaded / failed / missing field) is "—", a loaded
// true zero stays "0".
export function statLabel(value: number | null | undefined): string {
  return value === null || value === undefined ? EM_DASH : formatNumber(value);
}
