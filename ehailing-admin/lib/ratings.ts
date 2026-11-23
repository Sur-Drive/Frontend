// Ratings & Reviews data layer: confirmed apiFetch calls (GET stats/list/
// detail, PATCH moderate), the one mapping layer from backend records to the
// design's Review rows, and the display helpers that render raw backend
// vocabulary with a neutral fallback for unknown values.
//
// Confirmed endpoints (observed 2026-11-14):
//   GET   /admin/ride-hailing/ratings/stats   bare { platformAverage, totalReviews,
//         driverAverage, driverReviewCount, passengerAverage, passengerReviewCount,
//         moderationQueue, visibleCount, hiddenCount, lowRatingCount, byStars }
//   GET   /admin/ride-hailing/ratings         envelope { items, total, page, limit, totalPages }
//   GET   /admin/ride-hailing/ratings/{id}    detail (+ moderatedBy, moderatedAt,
//         moderationNotes, ride)
//   PATCH /admin/ride-hailing/ratings/{id}/moderate  { moderationStatus, moderationNotes? }
//
// NOT wired:
//   - the isVisible list param: documented but observed as a NO-OP (true and
//     false both returned every row), so it is never sent;
//   - approve / hide / toggle-visibility / clear-moderation bodies: the design
//     has no such actions (only flag / unflag), so they stay unused;
//   - a standalone moderationNotes save: only documented as part of a
//     moderation decision, so the drawer's Notes tab stays local-only (same
//     treatment as the verification centre's reviewer notes).
import { apiFetch } from "@/lib/api";
import { EM_DASH, formatDateLabel, formatNumber, humanize } from "@/lib/format";
import type { Person } from "@/types/rides";
import type { StatusTone } from "@/components/ui/StatusPill";
import type {
  RatingDetailResponse,
  RatingListItem,
  RatingListResponse,
  RatingModerateBody,
  RatingParty,
  RatingsStatsResponse,
} from "@/types/ratings-api";
import type { Review, ReviewsSummary } from "@/types/trust";

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export interface RatingsPageQuery {
  page: number;
  limit: number;
  // Confirmed query params only: search,
  // moderationStatus, rating (1-5 -> ratingMin=ratingMax, observed working).
  // isVisible is documented but a no-op and is never sent.
  search?: string;
  moderationStatus?: string;
  rating?: string;
}

// GET /admin/ride-hailing/ratings — observed envelope
// { items, total, page, limit, totalPages } (default limit=20).
export async function fetchRatingsPage(
  query: RatingsPageQuery,
  signal?: AbortSignal,
): Promise<RatingListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  // User input: trim so whitespace-only search never becomes a query param.
  const search = query.search?.trim();
  if (search) params.set("search", search);
  if (query.moderationStatus) params.set("moderationStatus", query.moderationStatus);
  // Design rating filter value ("5".."1"); single-value ranges observed
  // working (ratingMin=5&ratingMax=5 returned exactly the 5-star rows).
  const rating = query.rating?.trim() ?? "";
  if (/^[1-5]$/.test(rating)) {
    params.set("ratingMin", rating);
    params.set("ratingMax", rating);
  }
  return apiFetch<RatingListResponse>(
    `/admin/ride-hailing/ratings?${params.toString()}`,
    { signal },
  );
}

// GET /admin/ride-hailing/ratings/stats — bare object. Confirmed to IGNORE
// query params (probed 2026-11-14 with ?limit=1: identical numbers), so it is
// always fetched unfiltered and never derived from a list length.
export async function fetchRatingsStats(
  signal?: AbortSignal,
): Promise<RatingsStatsResponse> {
  return apiFetch<RatingsStatsResponse>("/admin/ride-hailing/ratings/stats", {
    signal,
  });
}

// GET /admin/ride-hailing/ratings/{id} — lazy detail for the drawer.
export async function fetchRatingDetail(
  ratingId: string,
  signal?: AbortSignal,
): Promise<RatingDetailResponse> {
  return apiFetch<RatingDetailResponse>(
    `/admin/ride-hailing/ratings/${encodeURIComponent(ratingId)}`,
    { signal },
  );
}

// PATCH /admin/ride-hailing/ratings/{id}/moderate — response shape never
// observed (mutations are never sent from the terminal), typed unknown and
// never trusted: callers refetch instead of reading it.
async function moderateRating(
  ratingId: string,
  body: RatingModerateBody,
): Promise<unknown> {
  return apiFetch<unknown>(
    `/admin/ride-hailing/ratings/${encodeURIComponent(ratingId)}/moderate`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

// ---------------------------------------------------------------------------
// Display helpers (raw backend vocabulary -> design words)
// ---------------------------------------------------------------------------

// Raw moderationStatus -> chip label + tone. "none" is the default published
// state and maps to the design's "Published"; "under_review" is the design's
// "Flagged" (the .http calls it the moderation queue / "flagged for admin
// attention"). Enums come from samples and are never exhaustive: unknown
// values fall back to a humanised label on a neutral chip.
const STATUS_DISPLAY: Record<string, { label: string; tone: StatusTone }> = {
  none: { label: "Published", tone: "success" },
  under_review: { label: "Flagged", tone: "danger" },
  approved: { label: "Approved", tone: "success" },
  hidden: { label: "Hidden", tone: "neutral" },
};

export function reviewStatusDisplay(
  status: string | null | undefined,
): { label: string; tone: StatusTone } {
  const key = typeof status === "string" ? status.trim().toLowerCase() : "";
  return STATUS_DISPLAY[key] ?? { label: humanize(status), tone: "neutral" };
}

// Toolbar status filter: labels -> confirmed moderationStatus query-param
// values (none|under_review|approved|hidden). "All statuses" sends no param.
export const REVIEW_STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All statuses", value: "all" },
  { label: "Published", value: "none" },
  { label: "Flagged", value: "under_review" },
  { label: "Approved", value: "approved" },
  { label: "Hidden", value: "hidden" },
];

// rater/ratee.role -> the design's party words. Observed roles: rider
// (passenger), driver; anything else is humanised, missing renders "—".
export function partyLabel(role: string | null | undefined): string {
  const key = typeof role === "string" ? role.trim().toLowerCase() : "";
  if (key === "driver") return "Driver";
  if (key === "rider") return "Passenger";
  return humanize(role);
}

// Summary card helpers: null (unloaded/failed) -> "—", a loaded true zero
// stays "0". Averages keep the design's 2-decimal look (4.5 -> "4.50").
export function statLabel(value: number | null | undefined): string {
  return value === null || value === undefined ? EM_DASH : formatNumber(value);
}

export function averageLabel(value: number | null | undefined): string {
  return value === null || value === undefined ? EM_DASH : value.toFixed(2);
}

// ---------------------------------------------------------------------------
// Mapping layer — backend record -> design Review. Only the fields the design
// renders are copied: rater/ratee userId, tags, isLowRating, reportedIssue and
// isVisible never reach component state, the CSV export or the drawer.
// ---------------------------------------------------------------------------

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

const AVATAR_TONES: Person["tone"][] = ["brand", "success", "warning", "info"];

// Deterministic avatar from the name (same input -> same output on server
// and client, so hydration never mismatches) — mirrors lib/drivers.ts.
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

// Party word with a raterRole fallback for rows whose role field is missing
// (rider reviewing driver -> the ratee is the driver, and vice versa).
function partyWord(
  party: RatingParty | null | undefined,
  raterRole: string,
  fallback: string,
): string {
  const role = asString(party?.role);
  if (role) return partyLabel(role);
  const roleKey = raterRole.toLowerCase();
  if (roleKey === "rider" || roleKey === "driver") {
    return fallback;
  }
  return EM_DASH;
}

export function mapRatingListItem(item: RatingListItem): Review {
  const raterRole = asString(item.raterRole);
  const rater = item.rater;
  const ratee = item.ratee;
  const comment = typeof item.comment === "string" ? item.comment.trim() : "";
  return {
    id: asString(item.id) || EM_DASH,
    reviewer: makePerson(rater?.name),
    reviewerLabel: partyWord(
      rater,
      raterRole,
      raterRole.toLowerCase() === "driver" ? "Driver" : "Passenger",
    ),
    rated: makePerson(ratee?.name),
    ratedLabel: partyWord(
      ratee,
      raterRole,
      raterRole.toLowerCase() === "driver" ? "Passenger" : "Driver",
    ),
    raterRole,
    // stars null (never observed) renders as "—" instead of a fabricated 0.
    rating: asNumber(item.stars),
    text: comment || EM_DASH,
    rideId: asString(item.rideId) || EM_DASH,
    timeLabel: formatDateLabel(item.createdAt),
    status: asString(item.moderationStatus),
  };
}

// GET /ratings/stats -> the four header cards. null response (not loaded or
// failed) keeps every field null so the cards render "—"; a loaded response
// shows the endpoint's true zeros. Notes are built from the endpoint's count
// fields; the low-rated note stays null because /ratings/stats exposes no
// trend or delta field (observed 2026-11-14) — no percentage is fabricated.
export function mapRatingsSummary(
  response: RatingsStatsResponse | null | undefined,
): ReviewsSummary {
  if (!response || typeof response !== "object") {
    return {
      platformAverage: null,
      platformAverageNote: null,
      driverRating: null,
      driverRatingNote: null,
      passengerRating: null,
      passengerRatingNote: null,
      lowRatedRides: null,
      lowRatedRidesNote: null,
    };
  }
  const total = asNumber(response.totalReviews);
  const driverCount = asNumber(response.driverReviewCount);
  const passengerCount = asNumber(response.passengerReviewCount);
  return {
    platformAverage: asNumber(response.platformAverage),
    platformAverageNote:
      total === null ? null : `${formatNumber(total)} reviews`,
    driverRating: asNumber(response.driverAverage),
    driverRatingNote:
      driverCount === null ? null : `${formatNumber(driverCount)} reviews`,
    passengerRating: asNumber(response.passengerAverage),
    passengerRatingNote:
      passengerCount === null ? null : `${formatNumber(passengerCount)} reviews`,
    lowRatedRides: asNumber(response.lowRatingCount),
    lowRatedRidesNote: null,
  };
}

// ---------------------------------------------------------------------------
// Lazy detail model for the drawer — only the fields the design renders. The
// raw response (moderationNotes, moderatedBy, ride.*) never reaches the
// component.
// ---------------------------------------------------------------------------

export interface ReviewDetailModel {
  // "13 Nov 2026" for moderatedAt ?? createdAt; null when neither exists.
  updatedLabel: string | null;
  // Moderation step derived from moderatedAt + moderationStatus; null when the
  // review has never been moderated (never fabricated).
  moderatedStep: { title: string; time: string } | null;
}

// Timeline title for a moderation event; humanised fallback for statuses
// outside the observed set.
function moderatedStepTitle(status: string): string {
  const display = reviewStatusDisplay(status);
  if (display.label === "Flagged") return "Flagged for follow-up";
  if (display.label === "Published") return "Moderation cleared";
  return display.label;
}

export function mapRatingDetail(
  detail: RatingDetailResponse,
): ReviewDetailModel {
  const moderatedAt =
    typeof detail.moderatedAt === "string" ? detail.moderatedAt : null;
  const created =
    typeof detail.createdAt === "string" ? detail.createdAt : null;
  const updated = formatDateLabel(moderatedAt ?? created);
  const status = asString(detail.moderationStatus);
  return {
    updatedLabel: updated === EM_DASH ? null : updated,
    moderatedStep:
      moderatedAt && status
        ? { title: moderatedStepTitle(status), time: formatDateLabel(moderatedAt) }
        : null,
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

// One moderation mutation at a time: a second confirm fired while a PATCH is
// still in flight rejects instead of double-submitting (the dialog also
// disables its confirm button while `loading`).
let mutationInFlight = false;

export interface ReviewActionRequest {
  ratingId: string;
  action: "flag" | "unflag";
  // Confirm-dialog note; rides along as moderationNotes only when non-empty
  // (an empty note omits the field instead of sending "").
  note: string;
  // Invoked ONLY after the backend confirms — the view's single refetch point
  // (list + stats + detail). On failure it never runs, so the displayed state
  // stays untouched and the dialog keeps the backend message.
  onConfirmed: () => void;
}

// flag -> under_review (the .http "Queue for review" body); unflag -> none (the
// .http "Clear moderation" body, minus isVisible: visibility is unchanged
// unless explicitly overridden, and the design has no visibility action).
// NOTE FOR REVIEWERS: these moderation changes MAY notify the review author or
// the rated user — the backend does not document who, if anyone, is notified
// and that cannot be observed from the .http; the confirm dialog says so.
// Failures (403/404/409/422 carry the backend message via ApiError) rethrow
// untouched.
export async function runReviewAction(
  request: ReviewActionRequest,
): Promise<void> {
  if (mutationInFlight) {
    throw new Error("A review update is already in progress.");
  }
  mutationInFlight = true;
  try {
    const body: RatingModerateBody = {
      moderationStatus: request.action === "flag" ? "under_review" : "none",
    };
    const note = request.note.trim();
    if (note) body.moderationNotes = note;
    await moderateRating(request.ratingId, body);
    request.onConfirmed();
  } finally {
    mutationInFlight = false;
  }
}
