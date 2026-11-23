import {
  EM_DASH,
  formatDateLabel,
  formatNaira,
  formatNumber,
  formatTimeLabel,
  humanize,
} from "@/lib/format";
import { passengerDisplayRating } from "@/lib/passengers";
import { passengerAccountDisplay } from "@/types/passengers";
import type { StatusTone } from "@/components/ui/StatusPill";
import type { DetailSection, EntityDetailsModel } from "@/types/entity-details";
import type {
  PassengerOverviewResponse,
  PassengerPaymentsPayload,
  PassengerRatingsPayload,
  PassengerRidesPayload,
  PassengerTabData,
} from "@/types/passengers-api";
import type { Passenger } from "@/types/passengers";

// Passenger actions have no confirmed endpoints (the endpoints are
// read-only), so they stay disabled with "Not available yet".
function isActionWired(): boolean {
  return false;
}

const ACTIVITY_TITLE = "Recent activity";

// Recent-activity timeline for the Overview and Activity tabs, built from the
// overview's recentActivity entries (validated at runtime). The observed array
// was empty, so missing/empty entries fall back to the empty message.
function buildActivity(overviewActivity?: unknown[] | null): DetailSection {
  if (Array.isArray(overviewActivity)) {
    const steps = overviewActivity
      .filter(
        (entry): entry is { type: string; at: string } =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as { type?: unknown }).type === "string" &&
          typeof (entry as { at?: unknown }).at === "string",
      )
      .slice(0, 3)
      .map((entry) => ({
        title: humanize(entry.type),
        time: formatTimeLabel(entry.at),
      }));
    if (steps.length > 0) {
      return { kind: "timeline", title: ACTIVITY_TITLE, steps };
    }
  }
  return {
    kind: "list",
    title: ACTIVITY_TITLE,
    rows: [],
    emptyMessage: "No recent activity.",
  };
}

// Tab payloads are only trusted once that tab fetched successfully: an
// unloaded or failed tab yields null so every derived stat renders "—"
// instead of a fabricated 0.
function loadedRides(
  tabs: Record<string, PassengerTabData>,
): PassengerRidesPayload | null {
  const tab = tabs["ride-history"];
  return tab && tab.loaded && tab.rides ? tab.rides : null;
}

function loadedPayments(
  tabs: Record<string, PassengerTabData>,
): PassengerPaymentsPayload | null {
  const tab = tabs["payments"];
  return tab && tab.loaded && tab.payments ? tab.payments : null;
}

function loadedRatings(
  tabs: Record<string, PassengerTabData>,
): PassengerRatingsPayload | null {
  const tab = tabs["ratings"];
  return tab && tab.loaded && tab.ratings ? tab.ratings : null;
}

// Stat helpers: null (missing or unloaded) is always "—", never a 0.
function numLabel(value: number | null | undefined): string {
  return value === null || value === undefined ? EM_DASH : formatNumber(value);
}

function nairaLabel(value: number | null | undefined): string {
  return value === null || value === undefined ? EM_DASH : formatNaira(value);
}

// Payments-endpoint amounts are integers in kobo (naira x 100): convert once
// here so the unit is documented in one place. Null/undefined stay null and
// render "—".
// ASSUMPTION: refunds and walletBalance have no non-zero sample yet; they sit
// in the same response as totalSpend, so they are treated as kobo too —
// re-check when a non-zero value appears.
export function koboToNaira(value: number | null | undefined): number | null {
  return value === null || value === undefined ? null : value / 100;
}

// Kobo-derived money carries at most 2 decimals, so always show exactly 2
// (0 -> "₦0.00"); null/undefined -> "—".
function koboNairaLabel(value: number | null | undefined): string {
  const naira = koboToNaira(value);
  if (naira === null) return EM_DASH;
  return `₦${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(naira)}`;
}

function text(value: string | null | undefined): string {
  return value && value.trim() ? value : EM_DASH;
}

// Raw statuses observed on the passenger rides/payments endpoints (samples
// confirmed 2026-11-10). Tones mirror how the app colours the same situations
// elsewhere (Paid -> success, Pending -> warning, Failed -> danger, Cancelled
// -> neutral, Driver En Route -> info); anything not listed keeps statusPill's
// neutral + humanised fallback, so no other status value is invented here.
const PASSENGER_RIDE_STATUS_TONE: Record<string, StatusTone> = {
  paid: "success",
  payment_pending: "warning",
  ride_in_progress: "info",
  driver_en_route: "info",
  no_drivers_found: "danger",
  cancelled: "neutral",
};

const PASSENGER_TRANSACTION_STATUS_TONE: Record<string, StatusTone> = {
  succeeded: "success",
  failed: "danger",
};

function statusPill(
  status: string | null | undefined,
  tones: Record<string, StatusTone>,
): { tone: StatusTone; label: string } {
  return {
    tone: (status && tones[status]) || "neutral",
    label: humanize(status),
  };
}

// Renders from the live list record plus the optional overview detail and the
// per-tab payloads. Tab stats come exclusively from each endpoint's summary
// (stored in `tabs` by the view): a loaded tab shows the backend's true
// zeros, an unloaded or failed tab shows "—".
export function buildPassengerDetails(
  passenger: Passenger,
  detail?: PassengerOverviewResponse | null,
  tabs: Record<string, PassengerTabData> = {},
): EntityDetailsModel {
  const ridesTab = loadedRides(tabs);
  const paymentsTab = loadedPayments(tabs);
  const ratingsTab = loadedRatings(tabs);

  const ridesSummary = ridesTab?.summary ?? null;
  const paymentsSummary = paymentsTab?.summary ?? null;
  const paymentMethod = paymentsTab?.paymentMethod ?? null;
  const ratingsSummary = ratingsTab?.summary ?? null;

  const completedRides = ridesSummary?.completedRides ?? null;
  const cancellationRate = ridesSummary?.cancellationRate ?? null;
  const averageFare = ridesSummary?.averageFare ?? null;

  // With no rides at all the rides summary returns cancellationRate 0 and
  // averageFare 0 as backend defaults, not measurements — show "—" instead
  // of "0%" and "₦0.00". Total rides and completed keep their true zeros.
  const ridesAreEmpty =
    (completedRides ?? 0) === 0 && (ridesTab?.totalRides ?? 0) === 0;

  // Ratings stats only become real numbers when the ratings endpoint reports
  // a non-zero total: the backend's default average of 5 must never render,
  // and an empty distribution never renders either.
  const ratingsTotal = ratingsSummary?.total ?? null;
  const hasRatings = ratingsTotal !== null && ratingsTotal > 0;
  const averageRating = hasRatings
    ? ratingsSummary?.averageRating ?? null
    : null;
  const distribution =
    hasRatings && ratingsSummary && ratingsSummary.distribution.length > 0
      ? ratingsSummary.distribution
      : [];

  const totalRidesLabel =
    passenger.totalRides === null ? EM_DASH : formatNumber(passenger.totalRides);
  const totalSpendLabel =
    passenger.totalSpend === null ? EM_DASH : formatNaira(passenger.totalSpend);
  // Zero-ride passengers carry the backend's default rating 5 in the list
  // record; guard it so the drawer never presents that default as data.
  const rating = passengerDisplayRating(passenger);
  const ratingLabel = rating === null ? EM_DASH : String(rating);

  const activity = buildActivity(detail?.recentActivity);

  // List rows use only the fields confirmed by the backend (observed
  // 2026-11-10); nothing is invented for an item the backend didn't send.
  const rideRows = (ridesTab?.items ?? []).map((item) => ({
    title: text(item.id),
    subtitle: `${text(item.pickupAddress)} → ${text(item.dropoffAddress)}`,
    value: formatDateLabel(item.requestedAt),
    pill: statusPill(item.status, PASSENGER_RIDE_STATUS_TONE),
  }));

  const transactionRows = (paymentsTab?.items ?? []).map((item) => ({
    title: text(item.id),
    subtitle: text(item.description),
    value: koboNairaLabel(item.amount),
    pill: statusPill(item.status, PASSENGER_TRANSACTION_STATUS_TONE),
  }));

  const ratingRows = (ratingsTab?.items ?? []).map((item) => ({
    title: text(item.id),
    subtitle:
      typeof item.stars === "number"
        ? `${item.stars} / 5${
            item.comment && item.comment.trim() ? ` • ${item.comment}` : ""
          }`
        : text(item.comment),
    value: formatDateLabel(item.createdAt),
    pill: { tone: "neutral" as StatusTone, label: text(item.rideId) },
  }));

  return {
    entity: "passenger",
    id: passenger.id,
    eyebrow: "Passenger details",
    title: passenger.person.name,
    subtitle: passenger.email,
    tabs: [
      {
        id: "overview",
        label: "Overview",
        sections: [
          {
            kind: "profile",
            name: passenger.person.name,
            initials: passenger.person.initials,
            tone: passenger.person.tone,
            subtitle: passenger.phone,
            pill: {
              tone: passengerAccountDisplay(passenger.status).tone,
              label: passengerAccountDisplay(passenger.status).label,
            },
          },
          {
            kind: "stats",
            items: [
              { label: "Total rides", value: totalRidesLabel },
              { label: "Rating", value: ratingLabel },
              { label: "Total spend", value: totalSpendLabel },
            ],
          },
          {
            kind: "info",
            title: "Personal information",
            items: [
              { label: "Full name", value: passenger.person.name },
              { label: "Phone", value: passenger.phone },
              { label: "Email", value: passenger.email },
              { label: "Joined", value: passenger.registeredLabel },
              {
                label: "Account status",
                value: null,
                pill: {
                  tone: passengerAccountDisplay(passenger.status).tone,
                  label: passengerAccountDisplay(passenger.status).label,
                },
              },
              { label: "Last active", value: passenger.lastActive },
            ],
          },
          {
            kind: "info",
            title: "Ride summary",
            items: [
              // Completed/average come from the ride-history summary once that
              // tab has loaded; until then they show "—", never a false 0.
              { label: "Completed rides", value: numLabel(completedRides) },
              { label: "Average ride fare", value: nairaLabel(averageFare) },
              // No confirmed support-ticket endpoint for passengers.
              { label: "Open support tickets", value: EM_DASH },
              // Overview stats.ratingCount — the rating count the backend
              // holds for this passenger (null renders as "—").
              {
                label: "Ratings given",
                value: numLabel(detail?.stats.ratingCount ?? null),
              },
            ],
          },
          activity,
        ],
      },
      {
        id: "ride-history",
        label: "Ride History",
        sections: [
          {
            kind: "stats",
            items: [
              {
                label: "Total rides",
                value: numLabel(ridesTab?.totalRides ?? null),
              },
              { label: "Completed", value: numLabel(completedRides) },
              {
                label: "Cancellation rate",
                value:
                  ridesAreEmpty || cancellationRate === null
                    ? EM_DASH
                    : `${cancellationRate}%`,
              },
              {
                label: "Average fare",
                value: ridesAreEmpty ? EM_DASH : nairaLabel(averageFare),
              },
            ],
          },
          {
            kind: "list",
            title: "Recent rides",
            rows: rideRows,
            emptyMessage: "No rides found for this passenger.",
          },
        ],
      },
      {
        id: "payments",
        label: "Payments",
        sections: [
          {
            kind: "stats",
            items: [
              {
                label: "Total spend",
                value: koboNairaLabel(paymentsSummary?.totalSpend ?? null),
              },
              {
                label: "Refunds",
                value: koboNairaLabel(paymentsSummary?.refunds ?? null),
              },
              {
                label: "Wallet balance",
                value: koboNairaLabel(paymentsSummary?.walletBalance ?? null),
              },
            ],
          },
          {
            kind: "info",
            title: "Payment activity",
            items: [
              {
                label: "Failed (last 90 days)",
                value: numLabel(paymentsSummary?.failedLast90Days ?? null),
              },
              {
                label: "Last payment",
                value: paymentsSummary?.lastPaymentAt
                  ? formatDateLabel(paymentsSummary.lastPaymentAt)
                  : EM_DASH,
              },
            ],
          },
          {
            kind: "info",
            title: "Payment method",
            items: [
              {
                label: "Primary card",
                value: text(paymentMethod?.primaryCard ?? null),
              },
              {
                label: "Card expiry",
                value: text(paymentMethod?.cardExpiry ?? null),
              },
              {
                label: "Billing email",
                value: text(paymentMethod?.billingEmail ?? null),
              },
            ],
          },
          {
            kind: "list",
            title: "Transactions",
            rows: transactionRows,
            emptyMessage: "No payments found for this passenger.",
          },
        ],
      },
      {
        id: "support",
        label: "Support Tickets",
        sections: [
          {
            kind: "stats",
            items: [
              // No confirmed support-ticket endpoint for passengers: "—", never 0.
              { label: "Tickets", value: EM_DASH },
              { label: "Open", value: EM_DASH },
              { label: "Resolved", value: EM_DASH },
            ],
          },
          {
            kind: "list",
            title: "Support tickets",
            rows: [],
            emptyMessage: "No support tickets for this passenger.",
          },
        ],
      },
      {
        id: "ratings",
        label: "Ratings",
        sections: [
          {
            kind: "stats",
            items: [
              { label: "Passenger rating", value: ratingLabel },
              {
                label: "Average rating",
                value: averageRating === null ? EM_DASH : String(averageRating),
              },
              { label: "Total ratings", value: numLabel(ratingsTotal) },
              {
                label: "Complaints resolved",
                value: numLabel(ratingsSummary?.complaintsResolved ?? null),
              },
            ],
          },
          ...(distribution.length > 0
            ? [
                {
                  kind: "breakdown" as const,
                  title: "Rating distribution",
                  rows: distribution.map((entry) => ({
                    label: `${entry.stars} stars`,
                    value: `${formatNumber(entry.count)} (${entry.percent}%)`,
                  })),
                  total: {
                    label: "Total",
                    value:
                      ratingsTotal === null
                        ? EM_DASH
                        : formatNumber(ratingsTotal),
                  },
                },
              ]
            : []),
          {
            kind: "list",
            title: "Recent ratings",
            rows: ratingRows,
            emptyMessage: "No ratings from this passenger yet.",
          },
        ],
      },
      {
        id: "activity",
        label: "Activity",
        sections: [activity],
      },
    ],
    actions: [
      {
        id: "restrict",
        label: "Restrict",
        variant: "danger",
        dialogTitle: "Confirm restrict",
        confirmTone: "danger",
        noteLabel: "Reason for restriction",
        noteRequired: true,
        notePlaceholder: "Explain why this passenger is being restricted...",
        disabled:
          !isActionWired() ||
          passengerAccountDisplay(passenger.status).label === "Restricted",
        disabledReason: !isActionWired()
          ? "Not available yet"
          : "This passenger is already restricted.",
      },
      {
        id: "reactivate",
        label: "Reactivate",
        variant: "brand",
        dialogTitle: "Confirm reactivate",
        noteLabel: "Reason for reactivation",
        notePlaceholder: "Add context for re-activating this account...",
        disabled:
          !isActionWired() ||
          passengerAccountDisplay(passenger.status).label === "Active",
        disabledReason: !isActionWired()
          ? "Not available yet"
          : "This passenger is already active.",
      },
    ],
  };
}
