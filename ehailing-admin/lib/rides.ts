import { apiFetch } from "@/lib/api";
import { EM_DASH, formatDateLabel, formatNaira } from "@/lib/format";
import type { Person } from "@/types/rides";
import type {
  RideListResponse,
  RideOverviewResponse,
  RidePaymentResponse,
  RideTimelineResponse,
} from "@/types/rides-api";
import type { Ride } from "@/types/rides";

// Confirmed query params: page, limit, search, rideStatus,
// category, paymentMethod, paymentStatus, from, to. Only the ones this page
// wires are accepted here; nothing is invented.

export interface RidesPageQuery {
  page: number;
  limit: number;
  search?: string;
  rideStatus?: string;
  category?: string;
  paymentStatus?: string;
}

// GET /admin/ride-hailing/rides — observed envelope { items, total, page,
// limit, totalPages }.
export async function fetchRidesPage(
  query: RidesPageQuery,
  signal?: AbortSignal,
): Promise<RideListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.search) params.set("search", query.search);
  if (query.rideStatus) params.set("rideStatus", query.rideStatus);
  if (query.category) params.set("category", query.category);
  if (query.paymentStatus) params.set("paymentStatus", query.paymentStatus);
  return apiFetch<RideListResponse>(
    `/admin/ride-hailing/rides?${params.toString()}`,
    { signal },
  );
}

// GET /admin/ride-hailing/rides/{rideId}/overview — bare object, no envelope.
export async function fetchRideOverview(
  rideId: string,
  signal?: AbortSignal,
): Promise<RideOverviewResponse> {
  return apiFetch<RideOverviewResponse>(
    `/admin/ride-hailing/rides/${encodeURIComponent(rideId)}/overview`,
    { signal },
  );
}

// GET /admin/ride-hailing/rides/{rideId}/timeline — bare object, no envelope.
export async function fetchRideTimeline(
  rideId: string,
  signal?: AbortSignal,
): Promise<RideTimelineResponse> {
  return apiFetch<RideTimelineResponse>(
    `/admin/ride-hailing/rides/${encodeURIComponent(rideId)}/timeline`,
    { signal },
  );
}

// GET /admin/ride-hailing/rides/{rideId}/payment — bare object, no envelope.
export async function fetchRidePayment(
  rideId: string,
  signal?: AbortSignal,
): Promise<RidePaymentResponse> {
  return apiFetch<RidePaymentResponse>(
    `/admin/ride-hailing/rides/${encodeURIComponent(rideId)}/payment`,
    { signal },
  );
}

// Converts a kobo amount to naira (100 kobo = 1 naira). Settled by arithmetic:
// observed payment transaction amounts are kobo (e.g. 258887 = ₦2,588.87),
// while ride fares/fareBreakdown totals are already naira. Returns null for
// non-numeric input so callers render "—" instead of fabricating a value.
export function koboToNaira(amount: unknown): number | null {
  return typeof amount === "number" ? amount / 100 : null;
}

const AVATAR_TONES: Person["tone"][] = ["brand", "success", "warning", "info"];

// Deterministic avatar from the name (same input -> same output on server
// and client, so hydration never mismatches).
function makePerson(name: string | null | undefined): Person {
  const safeName = typeof name === "string" && name.trim() ? name.trim() : EM_DASH;
  const words = safeName.split(/\s+/).filter((word) => /^[A-Za-z0-9]/.test(word));
  const initials = words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join("");
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

// Maps one backend list record onto the UI Ride shape. Every field is read
// defensively: a missing/null value renders as "—" downstream and never
// throws. The list endpoint does not carry distance/duration or vehicle info,
// so those default to 0 / null and are not rendered in the list.
export function mapRideListItem(item: RideListResponse["items"][number]): Ride {
  const record = item ?? {};
  return {
    id: typeof record.id === "string" ? record.id : "",
    passenger: makePerson(record.passenger?.name),
    driver: record.driver ? makePerson(record.driver.name) : null,
    pickup: typeof record.pickupAddress === "string" && record.pickupAddress ? record.pickupAddress : EM_DASH,
    destination:
      typeof record.dropoffAddress === "string" && record.dropoffAddress
        ? record.dropoffAddress
        : EM_DASH,
    category: typeof record.category === "string" ? record.category : EM_DASH,
    fare: typeof record.fare === "number" ? record.fare : 0,
    paymentStatus: typeof record.paymentStatus === "string" ? record.paymentStatus : "",
    status: typeof record.rideStatus === "string" ? record.rideStatus : "",
    dateLabel: typeof record.requestedAt === "string" ? formatDateLabel(record.requestedAt) : EM_DASH,
    vehicle: null,
    distanceKm: 0,
    durationMin: 0,
  };
}

// Resolves the ride for the drawer; the details drawer only ever opens from a
// row of the list it was rendered with.
export function findRide(rides: Ride[], id: string | null): Ride | null {
  if (!id) return null;
  return rides.find((ride) => ride.id === id) ?? null;
}

// Formats a fare value as naira, or "—" when missing.
export function formatRideFare(value: number | null | undefined): string {
  return value === null || value === undefined ? EM_DASH : formatNaira(value);
}

