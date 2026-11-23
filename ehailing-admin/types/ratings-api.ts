// Ratings & Reviews backend shapes — observed live (GET only) on 2026-11-14.
// Sample, not exhaustive:
// fields may be absent or null; every consumer reads defensively.
// rater/ratee carry personal data (userId, name): the mapping layer copies
// only the display name, so ids never reach component state or the CSV.

// GET /admin/ride-hailing/ratings/stats — bare object, no envelope; the
// endpoint ignores query params (observed: ?limit=1 returned identical
// numbers), so it is always fetched unfiltered.
export interface RatingsByStar {
  // Observed integer 1-5, descending (5 first).
  stars?: number | null;
  count?: number | null;
  // Observed double on the 0-100 scale (percents summed to 100 across the
  // five entries); counts summed to totalReviews.
  percent?: number | null;
}

export interface RatingsStatsResponse {
  // Observed doubles on the 1-5 rating scale (4.24 / 4.5 / 4.15).
  platformAverage?: number | null;
  // Observed integer counts (never percentages).
  totalReviews?: number | null;
  driverAverage?: number | null;
  // raterRole=rider rows (rider reviewing driver); equaled the list total for
  // ?raterRole=rider in the observed sample.
  driverReviewCount?: number | null;
  passengerAverage?: number | null;
  // raterRole=driver rows (driver reviewing rider).
  passengerReviewCount?: number | null;
  moderationQueue?: number | null;
  visibleCount?: number | null;
  hiddenCount?: number | null;
  lowRatingCount?: number | null;
  byStars?: RatingsByStar[] | null;
}

// rater/ratee party object. Observed keys: userId, name, role (role values
// observed: rider | driver).
export interface RatingParty {
  userId?: string | null;
  name?: string | null;
  role?: string | null;
}

// One row of GET /admin/ride-hailing/ratings (observed keys, 2026-11-14).
export interface RatingListItem {
  id?: string | null; // UUID string
  rideId?: string | null; // UUID string
  // Observed integer on the 1-5 scale (sample rows were 3, 4 and 5).
  stars?: number | null;
  // string | null — null in 14 of 17 observed rows.
  comment?: string | null;
  tags?: string[] | null; // string[] in every observed row
  isLowRating?: boolean | null;
  reportedIssue?: unknown; // null in every observed row
  // Observed enum: rider | driver (rider = rider reviewing driver).
  raterRole?: string | null;
  rater?: RatingParty | null;
  ratee?: RatingParty | null;
  // Observed enum: none | approved; the endpoint also accepts
  // none | under_review | approved | hidden.
  moderationStatus?: string | null;
  isVisible?: boolean | null;
  // ISO datetime string.
  createdAt?: string | null;
}

export interface RatingListResponse {
  items: RatingListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// The linked ride on GET /admin/ride-hailing/ratings/{id}. finalFare is naira
// (standing unit rule for ride finalFare — never rendered by this section).
export interface RatingDetailRide {
  id?: string | null;
  pickupAddress?: string | null;
  dropoffAddress?: string | null;
  status?: string | null;
  finalFare?: number | null;
  requestedAt?: string | null;
  completedAt?: string | null;
}

// GET /admin/ride-hailing/ratings/{id} — list keys plus the moderation audit
// fields and the linked ride (observed 2026-11-14; all three moderation fields
// were null on an unmoderated row, and no "subject" key was present).
export interface RatingDetailResponse extends RatingListItem {
  moderatedBy?: unknown; // shape unobserved (null in the sample)
  moderatedAt?: string | null; // ISO datetime string
  moderationNotes?: string | null;
  ride?: RatingDetailRide | null;
}

// PATCH /admin/ride-hailing/ratings/{id}/moderate — confirmed body fields only.
// isVisible is deliberately absent: the design has
// no visibility action, and the documented defaulting behaviour
// (approved→visible, hidden→invisible) means sending it could flip visibility
// as a side effect.
export interface RatingModerateBody {
  // none | under_review | approved | hidden.
  moderationStatus: string;
  // Included only when the confirm dialog's note is non-empty.
  moderationNotes?: string;
}
