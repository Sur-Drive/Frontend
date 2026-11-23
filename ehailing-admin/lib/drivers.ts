import { runEntityAction } from "@/lib/actions";
import { apiFetch } from "@/lib/api";
import { EM_DASH, formatDateLabel, formatDateLong, humanize } from "@/lib/format";
import type { Person } from "@/types/rides";
import type {
  DriverVehicleInfo,
  EntityActionTarget,
} from "@/types/entity-details";
import type { Driver } from "@/types/drivers";
import type {
  VerificationRequest,
  VerificationStatus,
  VerificationType,
} from "@/types/verification";
import type { VehicleAccount } from "@/types/vehicles";
import type {
  DriverListItem,
  DriverListResponse,
  DriverOverviewResponse,
  DriverDocumentsResponse,
  DriverDocumentCounts,
  DriverPerformanceResponse,
  DriverPerformancePayload,
  DriverRideItem,
  DriverRidesResponse,
  DriverRidesPayload,
  DriverFinancialsResponse,
  DriverFinancialsPayload,
  DriverVehicleResponse,
} from "@/types/drivers-api";

// Confirmed query params: page, limit, search, category,
// onlineStatus, verificationStatus, isActive. Only the ones this page wires
// are accepted here; nothing is invented.

export interface DriversPageQuery {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  onlineStatus?: string;
}

// GET /admin/ride-hailing/drivers — list page with the observed envelope
// { items, total, page, limit, totalPages }.
export async function fetchDriversPage(
  query: DriversPageQuery,
  signal?: AbortSignal,
): Promise<DriverListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.search) params.set("search", query.search);
  if (query.category) params.set("category", query.category);
  if (query.onlineStatus) params.set("onlineStatus", query.onlineStatus);
  return apiFetch<DriverListResponse>(
    `/admin/ride-hailing/drivers?${params.toString()}`,
    { signal },
  );
}

// GET /admin/ride-hailing/drivers/{profileId}/overview — observed shape
// (personal, stats, vehicle, verification, online, activity).
export async function fetchDriverOverview(
  profileId: string,
  signal?: AbortSignal,
): Promise<DriverOverviewResponse> {
  return apiFetch<DriverOverviewResponse>(
    `/admin/ride-hailing/drivers/${encodeURIComponent(profileId)}/overview`,
    { signal },
  );
}

const AVATAR_TONES: Person["tone"][] = ["brand", "success", "warning", "info"];

// Deterministic avatar from the name (same input -> same output on server
// and client, so hydration never mismatches).
function makePerson(name: string | null | undefined): Person {
  const safeName = typeof name === "string" && name.trim() ? name.trim() : EM_DASH;
  const words = safeName.split(/\s+/).filter((word) => /^[A-Za-z0-9]/.test(word));
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  let hash = 0;
  for (let index = 0; index < safeName.length; index += 1) {
    hash = (hash + safeName.charCodeAt(index)) % AVATAR_TONES.length;
  }
  return {
    name: safeName,
    initials: initials || EM_DASH,
    tone: AVATAR_TONES[hash],
  };
}

function formatVehicle(
  vehicle: DriverListItem["vehicle"],
): string {
  if (!vehicle) return EM_DASH;
  const model = vehicle.model?.trim();
  const plate = vehicle.plateNumber?.trim();
  if (model && plate) return `${model} • ${plate}`;
  return model ?? plate ?? EM_DASH;
}

// Maps one backend list record onto the UI Driver shape. Every field is read
// defensively: a missing/null value renders as "—" downstream and never throws.
export function mapDriverListItem(item: DriverListItem): Driver {
  const record = (item ?? {}) as Partial<DriverListItem>;
  return {
    id: record.profileId ?? "",
    person: makePerson(record.name),
    phone: record.phoneNumber?.trim() || EM_DASH,
    // The list response carries no email; the drawer gets it from the
    // overview detail when that loads.
    email: EM_DASH,
    vehicle: formatVehicle(record.vehicle ?? null),
    // Raw backend value humanised for display (e.g. "comfort" -> "Comfort");
    // the request-side filter sends the raw value, not this label.
    category: record.category ? humanize(record.category) : EM_DASH,
    totalRides: record.totalRides ?? null,
    rating: record.rating ?? null,
    earnings: null,
    joinedLabel: EM_DASH,
    lastActive: EM_DASH,
    verification: record.verificationStatus ?? "",
    online: record.onlineStatus ?? "",
    account: record.accountStatus ?? "",
  };
}

// The list `rating` is only meaningful with rides behind it: every zero-ride
// driver in the observed list sample (35 of 37 rows at limit=20, 2026-11-10)
// carries the backend default 5. Returns null (renders as "—") whenever the
// driver has no rides, so the default never shows as a real rating.
export function driverDisplayRating(driver: Driver): number | null {
  if ((driver.totalRides ?? 0) === 0) return null;
  return driver.rating;
}

// Enriches a list record with fields only the overview detail carries
// (email, joined date, last-active, earnings). Status fields keep the list
// values — the list is what the table shows.
export function applyDriverOverview(
  driver: Driver,
  overview: DriverOverviewResponse | null | undefined,
): Driver {
  if (!overview) return driver;
  const personal = overview.personal;
  const stats = overview.stats;
  return {
    ...driver,
    email: personal?.email?.trim() || driver.email,
    joinedLabel: personal?.joinedAt
      ? formatDateLong(personal.joinedAt)
      : driver.joinedLabel,
    lastActive: personal?.lastActiveAt
      ? formatDateLong(personal.lastActiveAt)
      : driver.lastActive,
    earnings:
      typeof stats?.totalEarnings === "number"
        ? stats.totalEarnings
        : driver.earnings,
    // NOTE (unit): the naira-vs-kobo unit of stats.totalEarnings is UNRESOLVED
    // as of 2026-11-10 — every observed value was 0 (financials
    // lifetimeEarnings also 0, recentTransactions empty), so there is no
    // non-zero figure to compare against the naira ride fares. The value is
    // rendered as-is until a non-zero sample settles it.
  };
}

function mapDocStatus(status: string | null | undefined): VerificationStatus {
  const raw = typeof status === "string" ? status.trim().toLowerCase() : "";
  if (raw === "verified") return "Approved";
  if (raw === "rejected") return "Rejected";
  if (raw === "pending" || raw === "in review" || raw === "resubmission") {
    return raw as VerificationStatus;
  }
  return "Pending Review";
}

// Only https:// file URLs may reach an href/src. Anything else — http://,
// javascript:, data:, a non-string or null — is treated as "no file".
export function safeDocumentUrl(url: unknown): string | null {
  return typeof url === "string" && url.startsWith("https://") ? url : null;
}

// What the review panel renders for one document: an image preview, a link to
// the file after the image failed to load, or nothing when no safe URL exists.
export type DocumentPreview =
  | { kind: "none" }
  | { kind: "image"; href: string }
  | { kind: "link"; href: string };

export function documentPreviewState(
  url: unknown,
  imageFailed = false,
): DocumentPreview {
  const href = safeDocumentUrl(url);
  if (!href) return { kind: "none" };
  return imageFailed ? { kind: "link", href } : { kind: "image", href };
}

// Decisions are offered only for documents still awaiting a first review. The
// row carries the mapper's lowercase backend value ("pending"); the display
// label "Pending Review" is accepted too so both shapes count.
export function isPendingDocumentStatus(status: unknown): boolean {
  if (typeof status !== "string") return false;
  const raw = status.trim().toLowerCase();
  return raw === "pending" || raw === "pending review";
}

// Single guard for the Approve/Reject buttons: a decision can be submitted only
// for a pending document and only while no other request is in flight.
export function canSubmitDocumentDecision(
  inFlight: boolean,
  status: unknown,
): boolean {
  return !inFlight && isPendingDocumentStatus(status);
}

// Maps the documents endpoint response onto VerificationRequest records so the
// Documents tab can render submitted documents. Fields not carried by the
// endpoint render as "—" downstream and never throw. Every document — driver,
// vehicle and nin alike — carries its decision target.
export function mapDriverDocuments(
  documents: DriverDocument[] | null | undefined,
  applicant: string,
  profileId: string,
): VerificationRequest[] {
  const safeApplicant = typeof applicant === "string" && applicant.trim()
    ? applicant.trim()
    : EM_DASH;
  const initials = safeApplicant
    .split(/\s+/)
    .filter((word) => /^[A-Za-z0-9]/.test(word))
    .map((word) => word.charAt(0).toUpperCase())
    .join("") || EM_DASH;
  return (documents ?? []).map((doc) => ({
    id: doc.key,
    applicant: safeApplicant,
    initials,
    tone: "info" as const,
    type: (doc.type === "vehicle"
      ? "Vehicle"
      : doc.type === "driver"
        ? "Driver"
        : "Fleet") as VerificationType,
    document: doc.name,
    submittedLabel: doc.verifiedAt
      ? formatDateLabel(doc.verifiedAt)
      : EM_DASH,
    expiryLabel: doc.expiryDate
      ? formatDateLabel(doc.expiryDate)
      : null,
    reviewer: doc.verifiedBy ?? null,
    status: mapDocStatus(doc.status),
    expiringSoon: Boolean(doc.actionable),
    refNumber: doc.reference ?? EM_DASH,
    issuer: doc.type,
    documentUrl: safeDocumentUrl(doc.url),
    ...(profileId && doc.key
      ? { actionTarget: { profileId, documentKeys: [doc.key] } }
      : {}),
  }));
}

export interface DocumentDecisionInput {
  target: EntityActionTarget;
  action: "approve" | "reject";
  // Optional reviewer note; the decision endpoint has no confirmed note field,
  // so it is never sent.
  note: string;
  // Runs after the request settles — success or failure — so the caller
  // refetches the documents tab and the driver overview in both cases.
  onSettled: () => void;
}

// Sends one document decision through the confirmed PATCH endpoint and always
// calls onSettled, then rethrows so the panel can show the backend message.
// The caller never changes a status locally.
export async function runDocumentDecision(
  input: DocumentDecisionInput,
): Promise<void> {
  try {
    await runEntityAction({
      entity: "verification",
      id: input.target.profileId,
      action: input.action,
      note: input.note,
      target: input.target,
    });
  } finally {
    input.onSettled();
  }
}

// Maps the vehicle detail endpoint onto the drawer's vehicle record. The
// response (observed 2026-11-10) carries no year/colour/VIN/insurance/
// roadworthiness/inspection-status fields, so those rows render "—" in the
// drawer — no constant such as "Pending Review" is ever fabricated.
export function mapDriverVehicle(
  response: DriverVehicleResponse | null | undefined,
): DriverVehicleInfo[] {
  const vehicle = response?.vehicle ?? null;
  const driverInfo = response?.driver ?? null;
  const approval = response?.approval ?? null;
  const accountRaw = typeof approval?.status === "string"
    ? approval.status.trim().toLowerCase()
    : "";
  const account: VehicleAccount =
    accountRaw === "approved" ? "Active" : accountRaw === "suspended"
      ? "Suspended"
      : "Pending";
  const makePersonFrom = (name: string | null | undefined): Person => {
    const safe = typeof name === "string" && name.trim() ? name.trim() : EM_DASH;
    const words = safe.split(/\s+/).filter((w) => /^[A-Za-z0-9]/.test(w));
    return {
      name: safe,
      initials:
        words.slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") ||
        EM_DASH,
      tone: "info" as const,
    };
  };
  if (!vehicle || !response) return [];
  return [
    {
      id: response.profileId,
      make: vehicle.make ?? EM_DASH,
      model: vehicle.model ?? EM_DASH,
      regNumber: vehicle.registrationNumber ?? EM_DASH,
      driver: makePersonFrom(driverInfo?.name ?? null),
      category: vehicle.category ?? EM_DASH,
      account,
    },
  ];
}

// Doc type used only as a local read view of the documents response items.
type DriverDocument = DriverDocumentsResponse["documents"][number];
export async function fetchDriverDocuments(
  profileId: string,
  signal?: AbortSignal,
): Promise<DriverDocumentsResponse> {
  return apiFetch<DriverDocumentsResponse>(
    `/admin/ride-hailing/drivers/${encodeURIComponent(profileId)}/documents`,
    { signal },
  );
}

// Defensive readers: a wrong-typed field becomes null (renders "—") instead of
// leaking `undefined` into the UI or throwing.
function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

// Keeps only object entries from a possibly-malformed items array.
function asItems<T>(value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is T => typeof entry === "object" && entry !== null,
  );
}

// Maps the documents counts onto the Documents tab header stats (null-safe).
export function mapDriverDocumentCounts(
  counts: DriverDocumentsResponse["counts"] | null | undefined,
): DriverDocumentCounts | null {
  if (!counts || typeof counts !== "object") return null;
  return {
    verified: asNumber(counts.verified),
    expiringSoon: asNumber(counts.expiringSoon),
    pending: asNumber(counts.pending),
    rejected: asNumber(counts.rejected),
    compliancePercent: asNumber(counts.compliancePercent),
  };
}

// Maps the performance response onto the Performance tab payload. A missing
// response yields null so every stat renders "—", never a fabricated 0.
export function mapDriverPerformance(
  response: DriverPerformanceResponse | null | undefined,
): DriverPerformancePayload | null {
  if (!response || typeof response !== "object") return null;
  const feedback = response.feedback as
    | Partial<DriverPerformanceResponse["feedback"]>
    | null
    | undefined;
  return {
    window: asString(response.window),
    acceptanceRate: asNumber(response.acceptanceRate),
    completionRate: asNumber(response.completionRate),
    rating: asNumber(response.rating),
    ratingCount: asNumber(response.ratingCount),
    lowRatingCount: asNumber(response.lowRatingCount),
    completedRides: asNumber(response.completedRides),
    cancelledRides: asNumber(response.cancelledRides),
    averagePickupSeconds: asNumber(response.averagePickupSeconds),
    feedback: feedback
      ? {
          totalRatings: asNumber(feedback.totalRatings),
          totalMentions: asNumber(feedback.totalMentions),
        }
      : null,
  };
}

// Maps the rides response onto the Ride History tab payload. The summary is
// the source of truth for the tab stats; recentRides.total is the collection
// total (not the page size); items carry the observed list shape (limit=5
// sample, 2026-11-10).
export function mapDriverRides(
  response: DriverRidesResponse | null | undefined,
): DriverRidesPayload | null {
  if (!response || typeof response !== "object") return null;
  const summary = response.summary as
    | Partial<DriverRidesResponse["summary"]>
    | null
    | undefined;
  const page = response.recentRides as
    | { total?: unknown; items?: unknown }
    | null
    | undefined;
  return {
    summary: summary
      ? {
          completedRides: asNumber(summary.completedRides),
          cancellationRate: asNumber(summary.cancellationRate),
          averageFare: asNumber(summary.averageFare),
        }
      : null,
    total: asNumber(page?.total),
    items: asItems<DriverRideItem>(page?.items),
  };
}

// Maps the financials response onto the Financials tab payload.
// recentTransactions items were never observed (empty in every sample), so
// only the count is kept and the tab shows a count note instead of rows.
export function mapDriverFinancials(
  response: DriverFinancialsResponse | null | undefined,
): DriverFinancialsPayload | null {
  if (!response || typeof response !== "object") return null;
  const wallet = response.wallet as
    | Partial<DriverFinancialsResponse["wallet"]>
    | null
    | undefined;
  return {
    currency: asString(response.currency),
    wallet: wallet
      ? {
          availableBalance: asNumber(wallet.availableBalance),
          pendingBalance: asNumber(wallet.pendingBalance),
          lockedBalance: asNumber(wallet.lockedBalance),
          status: asString(wallet.status),
        }
      : null,
    thisWeekEarnings: asNumber(response.thisWeekEarnings),
    lifetimeEarnings: asNumber(response.lifetimeEarnings),
    commissionPercent: asNumber(response.commissionPercent),
    recentTransactionsCount: Array.isArray(response.recentTransactions)
      ? response.recentTransactions.length
      : null,
  };
}

// GET /admin/ride-hailing/drivers/{profileId}/performance
export async function fetchDriverPerformance(
  profileId: string,
  signal?: AbortSignal,
): Promise<DriverPerformanceResponse> {
  return apiFetch<DriverPerformanceResponse>(
    `/admin/ride-hailing/drivers/${encodeURIComponent(profileId)}/performance`,
    { signal },
  );
}

// GET /admin/ride-hailing/drivers/{profileId}/rides
export interface DriverRidesQuery {
  page: number;
  limit: number;
  status?: string;
}

export async function fetchDriverRides(
  profileId: string,
  query: DriverRidesQuery,
  signal?: AbortSignal,
): Promise<DriverRidesResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.status) params.set("status", query.status);
  return apiFetch<DriverRidesResponse>(
    `/admin/ride-hailing/drivers/${encodeURIComponent(profileId)}/rides?${params.toString()}`,
    { signal },
  );
}

// GET /admin/ride-hailing/drivers/{profileId}/financials
export async function fetchDriverFinancials(
  profileId: string,
  signal?: AbortSignal,
): Promise<DriverFinancialsResponse> {
  return apiFetch<DriverFinancialsResponse>(
    `/admin/ride-hailing/drivers/${encodeURIComponent(profileId)}/financials`,
    { signal },
  );
}

// GET /admin/ride-hailing/vehicles/{driverProfileId}
export async function fetchDriverVehicle(
  profileId: string,
  signal?: AbortSignal,
): Promise<DriverVehicleResponse> {
  return apiFetch<DriverVehicleResponse>(
    `/admin/ride-hailing/vehicles/${encodeURIComponent(profileId)}`,
    { signal },
  );
}
