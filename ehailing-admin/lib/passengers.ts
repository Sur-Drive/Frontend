import { apiFetch } from "@/lib/api";
import { EM_DASH, formatDateLabel } from "@/lib/format";
import type { Person } from "@/types/rides";
import type { Passenger } from "@/types/passengers";
import type {
  PassengerListItem,
  PassengerListResponse,
  PassengerOverviewResponse,
  PassengerRidesResponse,
  PassengerPaymentsResponse,
  PassengerRatingsResponse,
  PassengerRideItem,
  PassengerTransactionItem,
  PassengerRatingItem,
  PassengerTabData,
} from "@/types/passengers-api";

// Confirmed query params: page, limit, search,
// isActive, minRating, minRides. Only the ones this page wires are accepted
// here; nothing is invented.

export interface PassengersPageQuery {
  page: number;
  limit: number;
  search?: string;
  minRating?: number;
  minRides?: number;
}

// GET /admin/ride-hailing/passengers — list page with the observed envelope
// { items, total, page, limit, totalPages }.
export async function fetchPassengersPage(
  query: PassengersPageQuery,
  signal?: AbortSignal,
): Promise<PassengerListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.search) params.set("search", query.search);
  if (typeof query.minRating === "number") {
    params.set("minRating", String(query.minRating));
  }
  if (typeof query.minRides === "number") {
    params.set("minRides", String(query.minRides));
  }
  return apiFetch<PassengerListResponse>(
    `/admin/ride-hailing/passengers?${params.toString()}`,
    { signal },
  );
}

// GET /admin/ride-hailing/passengers/{profileId}/overview — observed shape
// (personal, stats, recentActivity).
export async function fetchPassengerOverview(
  profileId: string,
  signal?: AbortSignal,
): Promise<PassengerOverviewResponse> {
  return apiFetch<PassengerOverviewResponse>(
    `/admin/ride-hailing/passengers/${encodeURIComponent(profileId)}/overview`,
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

// Maps one backend list record onto the UI Passenger shape. Every field is
// read defensively: a missing/null value renders as "—" downstream and never
// throws (email is observed null in every list sample).
export function mapPassengerListItem(item: PassengerListItem): Passenger {
  const record = (item ?? {}) as Partial<PassengerListItem>;
  return {
    id: record.profileId ?? "",
    person: makePerson(record.name),
    phone: record.phoneNumber?.trim() || EM_DASH,
    email: record.email?.trim() || EM_DASH,
    totalRides: record.totalRides ?? null,
    totalSpend: record.totalSpend ?? null,
    rating: record.rating ?? null,
    registeredLabel: formatDateLabel(record.registeredAt),
    status: record.accountStatus ?? "",
    lastActive: EM_DASH,
  };
}

// The list `rating` is only meaningful with rides behind it: every zero-ride
// passenger in the observed list sample (15 of 15 at limit=20, 2026-11-10)
// carries the backend default 5. Returns null (renders as "—") whenever the
// passenger has no rides, so the default never shows as a real rating.
export function passengerDisplayRating(passenger: Passenger): number | null {
  if ((passenger.totalRides ?? 0) === 0) return null;
  return passenger.rating;
}

// Enriches a list record with fields only the overview detail carries
// (email when present, last-active timestamp).
export function applyPassengerOverview(
  passenger: Passenger,
  overview: PassengerOverviewResponse | null | undefined,
): Passenger {
  if (!overview) return passenger;
  const personal = overview.personal;
  return {
    ...passenger,
    email: personal?.email?.trim() || passenger.email,
    lastActive: personal?.lastActiveAt
      ? formatDateLabel(personal.lastActiveAt)
      : passenger.lastActive,
  };
}

// GET /admin/ride-hailing/passengers/{passengerId}/rides
export interface PassengerRidesQuery {
  page: number;
  limit: number;
  status?: string;
}

export async function fetchPassengerRides(
  passengerId: string,
  query: PassengerRidesQuery,
  signal?: AbortSignal,
): Promise<PassengerRidesResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.status) params.set("status", query.status);
  return apiFetch<PassengerRidesResponse>(
    `/admin/ride-hailing/passengers/${encodeURIComponent(passengerId)}/rides?${params.toString()}`,
    { signal },
  );
}

// GET /admin/ride-hailing/passengers/{passengerId}/payments
export async function fetchPassengerPayments(
  passengerId: string,
  signal?: AbortSignal,
): Promise<PassengerPaymentsResponse> {
  return apiFetch<PassengerPaymentsResponse>(
    `/admin/ride-hailing/passengers/${encodeURIComponent(passengerId)}/payments`,
    { signal },
  );
}

// GET /admin/ride-hailing/passengers/{passengerId}/ratings
export async function fetchPassengerRatings(
  passengerId: string,
  signal?: AbortSignal,
): Promise<PassengerRatingsResponse> {
  return apiFetch<PassengerRatingsResponse>(
    `/admin/ride-hailing/passengers/${encodeURIComponent(passengerId)}/ratings`,
    { signal },
  );
}

// Defensive readers: a field of the wrong type becomes null (renders "—")
// instead of leaking `undefined` into the UI or throwing.
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

// Maps the rides response onto the ride-history tab data. The summary is the
// source of truth for tab stats; `recentRides.total` is the envelope's
// collection total (total rides), and items carry the confirmed list shape
// observed in the backend list shape. A missing response yields an unloaded
// entry so stats render "—", never a fabricated 0.
export function mapPassengerRides(
  response: PassengerRidesResponse | null | undefined,
): PassengerTabData {
  if (!response || typeof response !== "object") return { loaded: false };
  const summary = response.summary as
    | Partial<PassengerRidesResponse["summary"]>
    | null
    | undefined;
  const page = response.recentRides as
    | { total?: unknown; items?: unknown }
    | null
    | undefined;
  return {
    loaded: true,
    rides: {
      summary: summary
        ? {
            completedRides: asNumber(summary.completedRides),
            cancellationRate: asNumber(summary.cancellationRate),
            averageFare: asNumber(summary.averageFare),
          }
        : null,
      totalRides: asNumber(page?.total),
      items: asItems<PassengerRideItem>(page?.items),
    },
  };
}

// Maps the payments response onto the payments tab data (summary + payment
// method card details + confirmed transaction items).
export function mapPassengerPayments(
  response: PassengerPaymentsResponse | null | undefined,
): PassengerTabData {
  if (!response || typeof response !== "object") return { loaded: false };
  const summary = response.summary as
    | Partial<PassengerPaymentsResponse["summary"]>
    | null
    | undefined;
  const method = response.paymentMethod as
    | Partial<PassengerPaymentsResponse["paymentMethod"]>
    | null
    | undefined;
  const page = response.recentTransactions as { items?: unknown } | null | undefined;
  return {
    loaded: true,
    payments: {
      summary: summary
        ? {
            totalSpend: asNumber(summary.totalSpend),
            refunds: asNumber(summary.refunds),
            walletBalance: asNumber(summary.walletBalance),
            failedLast90Days: asNumber(summary.failedLast90Days),
            lastPaymentAt: asString(summary.lastPaymentAt),
            currency: asString(summary.currency),
          }
        : null,
      paymentMethod: method
        ? {
            primaryCard: asString(method.primaryCard),
            cardExpiry: asString(method.cardExpiry),
            billingEmail: asString(method.billingEmail),
          }
        : null,
      items: asItems<PassengerTransactionItem>(page?.items),
    },
  };
}

// Maps the ratings response onto the ratings tab data. Distribution entries
// with a non-numeric field are dropped so the renderer only ever sees the
// confirmed { stars, count, percent } shape.
export function mapPassengerRatings(
  response: PassengerRatingsResponse | null | undefined,
): PassengerTabData {
  if (!response || typeof response !== "object") return { loaded: false };
  const summary = response.summary as
    | (Partial<PassengerRatingsResponse["summary"]> & { distribution?: unknown })
    | null
    | undefined;
  const page = response.recent as { items?: unknown } | null | undefined;
  const distribution = Array.isArray(summary?.distribution)
    ? summary.distribution
        .map((entry) => ({
          stars: asNumber((entry as { stars?: unknown }).stars),
          count: asNumber((entry as { count?: unknown }).count),
          percent: asNumber((entry as { percent?: unknown }).percent),
        }))
        .filter(
          (entry): entry is { stars: number; count: number; percent: number } =>
            entry.stars !== null && entry.count !== null && entry.percent !== null,
        )
    : [];
  return {
    loaded: true,
    ratings: {
      summary: summary
        ? {
            averageRating: asNumber(summary.averageRating),
            total: asNumber(summary.total),
            complaintsResolved: asNumber(summary.complaintsResolved),
            distribution,
          }
        : null,
      items: asItems<PassengerRatingItem>(page?.items),
    },
  };
}
