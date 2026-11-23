import {
  EM_DASH,
  formatDateLabel,
  formatNaira,
  formatNairaCompact,
  formatNumber,
  formatTimeLabel,
  humanize,
} from "@/lib/format";
import { driverDisplayRating } from "@/lib/drivers";
import {
  driverAccountStatusDisplay,
  driverOnlineDisplay,
  driverSuspension,
  driverVerificationDisplay,
} from "@/types/drivers";
import type { StatusTone } from "@/components/ui/StatusPill";
import type {
  DetailSection,
  DriverDetailData,
  EntityDetailsModel,
} from "@/types/entity-details";
import type { DriverOverviewResponse } from "@/types/drivers-api";
import type { Driver } from "@/types/drivers";


// Footer actions map to confirmed endpoints (api/drivers.html). Flip the set
// below when an action's landing is confirmed; the status guards read RAW
// backend values through driverSuspension()/the display helpers, so the
// "already X" reasons start working unchanged. Actions not in the set stay
// disabled with "Not available yet".
function isActionWired(actionId: string): boolean {
  return new Set(["suspend", "reactivate", "approve"]).has(actionId);
}

const ACTIVITY_TITLE = "Recent activity";

const GALLERY_VIEWS = [
  "Front view",
  "Rear",
  "Left side",
  "Right side",
  "Interior",
  "Dashboard",
];

// Recent-activity timeline for the Overview and Activity tabs, built from the
// overview's recentActivity entries (validated at runtime — entries were
// observed as an array of { type, at }). Missing/empty entries fall back to
// the empty message; the separate /activity endpoint is never fetched.
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
function loadedTab(
  tabs: Record<string, DriverDetailData>,
  tabId: string,
): DriverDetailData | null {
  const tab = tabs[tabId];
  return tab && tab.loaded ? tab : null;
}

// Stat helpers: null (missing or unloaded) is always "—", never a 0.
function numLabel(value: number | null | undefined): string {
  return value === null || value === undefined ? EM_DASH : formatNumber(value);
}

// Money display for earnings/wallet values whose unit is UNRESOLVED as of
// 2026-11-10 (every observed value was 0 and recentTransactions was empty) —
// rendered as-is, see the unit note in lib/drivers.ts applyDriverOverview.
// Ride fares/summaries are confirmed naira and use the same formatter with
// no conversion.
function nairaLabel(value: number | null | undefined): string {
  return value === null || value === undefined ? EM_DASH : formatNaira(value);
}

function text(value: string | null | undefined): string {
  return value && value.trim() ? value : EM_DASH;
}

// Rate units settled 2026-11-10: completionRate, cancellationRate and
// commissionPercent are percents 0–100 (observed 42.11 = 8/19 x 100,
// 57.89 = 11/19 x 100, 20), while acceptanceRate is a fraction 0–1
// (observed 1 for a driver with 8 completed rides in the same window — a
// 1% value could not produce them).
function percentLabel(value: number | null | undefined): string {
  return value === null || value === undefined ? EM_DASH : `${value}%`;
}

function fractionPercentLabel(value: number | null | undefined): string {
  return value === null || value === undefined
    ? EM_DASH
    : `${Math.round(value * 100)}%`;
}

// averagePickupSeconds -> whole minutes (397 -> "7 min").
function pickupTimeLabel(seconds: number | null | undefined): string {
  return seconds === null || seconds === undefined
    ? EM_DASH
    : `${Math.round(seconds / 60)} min`;
}

// The performance `window` is a snake_case string (observed exactly
// "last_30_days" on a driver with rides and one without, 2026-11-10). Render
// it as a short sentence-case label; a missing value or anything not a string
// omits the note rather than guessing.
function windowLabel(window: string | null | undefined): string | null {
  if (typeof window !== "string" || !window.trim()) return null;
  const spaced = window.trim().replace(/[_-]+/g, " ").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// Raw statuses observed on the driver rides endpoint (sample confirmed
// 2026-11-10, plus the task's observed set). Tones mirror how the app colours
// the same situations elsewhere; anything not listed keeps statusPill's
// neutral + humanised fallback, so no status value is invented here.
const DRIVER_RIDE_STATUS_TONE: Record<string, StatusTone> = {
  paid: "success",
  payment_pending: "warning",
  ride_in_progress: "info",
  driver_en_route: "info",
  no_drivers_found: "danger",
  cancelled: "neutral",
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
// per-tab payloads. Tab stats come exclusively from each endpoint's payload
// (stored in `tabs` by the view): a loaded tab shows the backend's true
// zeros, an unloaded or failed tab shows "—".
export function buildDriverDetails(
  driver: Driver,
  detail?: DriverOverviewResponse | null,
  tabs: Record<string, DriverDetailData> = {},
): EntityDetailsModel {
  const documentsTab = loadedTab(tabs, "documents");
  const vehicleTab = loadedTab(tabs, "vehicle");
  const performanceTab = loadedTab(tabs, "performance");
  const financialsTab = loadedTab(tabs, "financials");
  const ridesTab = loadedTab(tabs, "ride-history");

  const documentCounts = documentsTab?.documentCounts ?? null;
  const performance = performanceTab?.performance ?? null;
  const financials = financialsTab?.financials ?? null;
  const rideHistory = ridesTab?.rideHistory ?? null;

  // Backend defaults, not measurements: with no completed and no cancelled
  // rides in the window the performance response still reports completionRate
  // 100 and acceptanceRate 0 (observed 2026-11-10 on a zero-ride driver), so
  // both rates render "—". ASSUMPTION: an acceptanceRate of 1 with no
  // completed or cancelled rides is ambiguous and is also shown as "—".
  const ratesAreDefault =
    !performance ||
    (performance.completedRides === null &&
      performance.cancelledRides === null) ||
    (performance.completedRides ?? 0) + (performance.cancelledRides ?? 0) === 0;

  // With no rides at all the rides summary returns cancellationRate 0 and
  // averageFare 0 as backend defaults, not measurements — show "—". Real
  // non-zero values still render.
  const ridesAreEmpty =
    (rideHistory?.summary?.completedRides ?? 0) === 0 &&
    (rideHistory?.total ?? 0) === 0;

  const performanceNote = windowLabel(performance?.window);

  const totalRidesLabel =
    driver.totalRides === null ? EM_DASH : formatNumber(driver.totalRides);
  // Every document the endpoint returned, labelled by type (Driver / Vehicle /
  // Fleet via the issuer subtitle). The applicant name guard keeps the list
  // scoped to this drawer's driver.
  const driverVerifications = (documentsTab?.verifications ?? []).filter(
    (request) => request.applicant === driver.person.name,
  );
  // The vehicle payload comes from /vehicles/{driverProfileId}, so it is
  // already scoped to this driver — no name filter.
  const latestVehicle = vehicleTab?.vehicles?.[0] ?? null;
  const approvedDocuments = driverVerifications.filter(
    (request) => request.status === "Approved",
  );
  // Zero-ride drivers carry the backend's default rating 5 in the list
  // record; guard it so the drawer never presents that default as data.
  const rating = driverDisplayRating(driver);
  const ratingLabel = rating === null ? EM_DASH : String(rating);

  // Suspension is read from the RAW values (driverSuspension in
  // types/drivers.ts): the backend keeps accountStatus "active" after suspend
  // and instead sets verificationStatus "suspended" (observed live
  // 2026-11-18). Suspend is enabled only for an active, not-suspended driver;
  // Reactivate only for a suspended one.
  const suspension = driverSuspension(driver.account, driver.verification);

  const activity = buildActivity(detail?.recentActivity);

  // Ride items were observed: id,
  // pickup/dropoff, status chip, date and the naira fare come from the payload.
  const rideRows = (rideHistory?.items ?? []).map((item) => ({
    title: text(item.id),
    subtitle: `${text(item.pickupAddress)} → ${text(item.dropoffAddress)}`,
    value:
      item.finalFare === null
        ? formatDateLabel(item.requestedAt)
        : `${formatDateLabel(item.requestedAt)} • ${formatNaira(item.finalFare)}`,
    pill: statusPill(item.status, DRIVER_RIDE_STATUS_TONE),
  }));

  return {
    entity: "driver",
    id: driver.id,
    eyebrow: "DRIVER DETAILS",
    title: driver.person.name,
    subtitle: driver.email,
    tabs: [
      {
        id: "overview",
        label: "Overview",
        sections: [
          {
            kind: "profile",
            name: driver.person.name,
            initials: driver.person.initials,
            tone: driver.person.tone,
            subtitle: driver.phone,
            pill: {
              tone: driverAccountStatusDisplay(driver.account, driver.verification).tone,
              label: driverAccountStatusDisplay(driver.account, driver.verification).label,
            },
          },
          {
            kind: "stats",
            items: [
              { label: "Total rides", value: totalRidesLabel },
              { label: "Rating", value: ratingLabel },
              {
                label: "Earnings",
                value:
                  driver.earnings === null
                    ? EM_DASH
                    : formatNairaCompact(driver.earnings, 1),
              },
            ],
          },
          {
            kind: "info",
            title: "Personal information",
            items: [
              { label: "Full name", value: driver.person.name },
              { label: "Phone", value: driver.phone },
              { label: "Email", value: driver.email },
              { label: "Joined", value: driver.joinedLabel },
              {
                label: "Account status",
                value: null,
                pill: {
                  tone: driverAccountStatusDisplay(driver.account, driver.verification).tone,
                  label: driverAccountStatusDisplay(driver.account, driver.verification).label,
                },
              },
              {
                label: "Online status",
                value: null,
                pill: {
                  tone: driverOnlineDisplay(driver.online).tone,
                  label: driverOnlineDisplay(driver.online).label,
                },
              },
              { label: "Last active", value: driver.lastActive },
            ],
          },
          {
            kind: "info",
            title: "Vehicle & verification",
            items: [
              { label: "Vehicle", value: driver.vehicle },
              { label: "Category", value: driver.category },
              {
                label: "Verification status",
                value: null,
                pill: {
                  tone: driverVerificationDisplay(driver.verification).tone,
                  label: driverVerificationDisplay(driver.verification).label,
                },
              },
              {
                label: "Documents approved",
                value: documentsTab
                  ? formatNumber(approvedDocuments.length)
                  : EM_DASH,
              },
            ],
          },
          activity,
        ],
      },
      {
        id: "documents",
        label: "Documents",
        sections: [
          {
            // Header stats come from the documents response counts (null-safe):
            // an unloaded tab renders "—" for every count, never a fabricated 0.
            kind: "stats",
            items: [
              { label: "Verified", value: numLabel(documentCounts?.verified) },
              {
                label: "Expiring soon",
                value: numLabel(documentCounts?.expiringSoon),
              },
              { label: "Pending", value: numLabel(documentCounts?.pending) },
              { label: "Rejected", value: numLabel(documentCounts?.rejected) },
              {
                label: "Compliance",
                value: percentLabel(documentCounts?.compliancePercent),
              },
            ],
          },
          {
            kind: "documentList",
            title: "Submitted documents",
            rows: driverVerifications.map((request) => ({
              key: request.id,
              document: request.document,
              type: request.type,
              issuer: request.issuer,
              status: request.status,
              reference: request.refNumber,
              url: request.documentUrl ?? null,
              actionTarget: request.actionTarget,
            })),
            emptyMessage: "No documents submitted for this driver.",
          },
        ],
      },
      {
        id: "vehicle",
        label: "Vehicle",
        sections: [
          { kind: "gallery", views: GALLERY_VIEWS },
          {
            kind: "info",
            title: "Vehicle information",
            items: latestVehicle
              ? [
                  { label: "Vehicle", value: `${latestVehicle.make} ${latestVehicle.model}` },
                  { label: "Registration number", value: latestVehicle.regNumber },
                  // The vehicle detail response (observed 2026-11-10) has no
                  // year/colour/VIN field: "—", never a fabricated value.
                  { label: "Year", value: EM_DASH },
                  { label: "Colour", value: EM_DASH },
                  { label: "VIN", value: EM_DASH },
                  { label: "Category", value: latestVehicle.category },
                ]
              : [
                  { label: "Vehicle", value: driver.vehicle },
                  { label: "Category", value: driver.category },
                ],
          },
          {
            // No insurance/roadworthiness/inspection-status field exists on the
            // vehicle detail response (observed 2026-11-10): every row renders
            // "—" — never a fake "Pending Review" status.
            kind: "info",
            title: "Insurance & inspection",
            items: [
              { label: "Insurance expiry", value: EM_DASH },
              { label: "Roadworthiness", value: EM_DASH },
              { label: "Inspection status", value: EM_DASH },
              { label: "Last inspection", value: EM_DASH },
            ],
          },
        ],
      },
      {
        id: "performance",
        label: "Performance",
        note: performanceNote ?? undefined,
        sections: [
          {
            kind: "stats",
            items: [
              {
                label: "Acceptance rate",
                value: ratesAreDefault
                  ? EM_DASH
                  : fractionPercentLabel(performance?.acceptanceRate),
              },
              {
                label: "Completion rate",
                value: ratesAreDefault
                  ? EM_DASH
                  : percentLabel(performance?.completionRate),
              },
              // ratingCount 0 (or an unloaded tab) always shows "—": the
              // backend's default rating of 5 must never render.
              {
                label: "Rating",
                value:
                  performance &&
                  performance.ratingCount !== null &&
                  performance.ratingCount > 0 &&
                  performance.rating !== null
                    ? String(performance.rating)
                    : EM_DASH,
              },
            ],
          },
          {
            kind: "info",
            title: "Ride performance",
            items: [
              {
                label: "Ratings received",
                value: numLabel(performance?.ratingCount),
              },
              {
                label: "Low ratings",
                value: numLabel(performance?.lowRatingCount),
              },
              {
                label: "Completed rides",
                value: numLabel(performance?.completedRides),
              },
              {
                label: "Cancelled rides",
                value: numLabel(performance?.cancelledRides),
              },
              {
                label: "Average pickup time",
                value: pickupTimeLabel(performance?.averagePickupSeconds),
              },
            ],
          },
          {
            kind: "info",
            title: "Feedback",
            items: [
              {
                label: "Total ratings",
                value: numLabel(performance?.feedback?.totalRatings),
              },
              {
                label: "Total mentions",
                value: numLabel(performance?.feedback?.totalMentions),
              },
            ],
          },
        ],
      },
      {
        id: "financials",
        label: "Financials",
        sections: [
          {
            kind: "stats",
            items: [
              {
                label: "Total earnings",
                value: driver.earnings === null ? EM_DASH : formatNaira(driver.earnings),
              },
              {
                label: "This week earnings",
                value: nairaLabel(financials?.thisWeekEarnings),
              },
              {
                label: "Lifetime earnings",
                value: nairaLabel(financials?.lifetimeEarnings),
              },
            ],
          },
          {
            // Unit note: wallet balances and earnings were 0 in every observed
            // sample (2026-11-10) and recentTransactions was empty, so the
            // naira-vs-kobo question is UNRESOLVED — values render as-is with
            // no conversion.
            kind: "info",
            title: "Wallet",
            items: [
              {
                label: "Available balance",
                value: nairaLabel(financials?.wallet?.availableBalance),
              },
              {
                label: "Pending balance",
                value: nairaLabel(financials?.wallet?.pendingBalance),
              },
              {
                label: "Locked balance",
                value: nairaLabel(financials?.wallet?.lockedBalance),
              },
              {
                label: "Wallet status",
                value: financials?.wallet?.status
                  ? humanize(financials.wallet.status)
                  : EM_DASH,
              },
            ],
          },
          {
            kind: "info",
            title: "Account",
            items: [
              { label: "Currency", value: text(financials?.currency) },
              {
                label: "Commission",
                value: percentLabel(financials?.commissionPercent),
              },
            ],
          },
          {
            // The recentTransactions item shape was never observed (empty in
            // every sample), so only the count is shown — no fabricated rows.
            kind: "info",
            title: "Recent transactions",
            items: [
              {
                label: "Count",
                value:
                  financials && financials.recentTransactionsCount !== null
                    ? `${formatNumber(financials.recentTransactionsCount)} (list view not available yet)`
                    : EM_DASH,
              },
            ],
          },
        ],
      },
      {
        id: "ride-history",
        label: "Ride History",
        sections: [
          {
            // Stats come from the rides summary only — never from the length
            // of an unmapped array.
            kind: "stats",
            items: [
              {
                label: "Completed",
                value: numLabel(rideHistory?.summary?.completedRides),
              },
              {
                label: "Cancellation rate",
                value: ridesAreEmpty
                  ? EM_DASH
                  : percentLabel(rideHistory?.summary?.cancellationRate),
              },
              {
                label: "Average fare",
                value: ridesAreEmpty
                  ? EM_DASH
                  : nairaLabel(rideHistory?.summary?.averageFare),
              },
            ],
          },
          {
            kind: "list",
            title: "Recent rides",
            rows: rideRows,
            emptyMessage: "No rides found for this driver.",
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
        id: "suspend",
        label: "Suspend",
        variant: "danger",
        dialogTitle: "Confirm suspension",
        confirmTone: "danger",
        noteLabel: "Reason for suspension",
        noteRequired: true,
        notePlaceholder: "Explain why this driver is being suspended...",
        disabled: !isActionWired("suspend") || !suspension.active,
        disabledReason: !isActionWired("suspend")
          ? "Not available yet"
          : suspension.suspended
            ? "This driver is already suspended."
            : "Only active drivers can be suspended.",
      },
      {
        id: "reactivate",
        label: "Reactivate",
        variant: "brand",
        dialogTitle: "Confirm reactivation",
        confirmTone: "brand",
        noteLabel: "Reason for reactivation",
        notePlaceholder: "Add context for re-activating this account...",
        disabled: !isActionWired("reactivate") || !suspension.suspended,
        disabledReason: !isActionWired("reactivate")
          ? "Not available yet"
          : suspension.active
            ? "This driver is already active."
            : "This driver is not suspended.",
      },
      {
        id: "request-documents",
        label: "Request documents",
        variant: "outline",
        dialogTitle: "Confirm request documents",
        noteLabel: "Documents requested",
        notePlaceholder: "List the documents this driver needs to submit...",
        disabled: !isActionWired("request-documents") || driverVerificationDisplay(driver.verification).label === "Approved",
        disabledReason: !isActionWired("request-documents")
          ? "Not available yet"
          : "All documents have already been approved.",
      },
      {
        id: "approve",
        label: "Approve",
        variant: "brand",
        dialogTitle: "Confirm approve",
        confirmTone: "brand",
        noteLabel: "Approval note",
        notePlaceholder: "Add context for approving this driver...",
        // Verification-scoped: Approve is offered while the backend's
        // verificationStatus is pending or otherwise unapproved, but a
        // SUSPENDED driver is never approvable — the account must be
        // reactivated first, whatever its verification status says. For an
        // ACTIVE driver with pending verification this stays enabled — the
        // backend's approve endpoint answers with its own 400 blockers when
        // documents are still outstanding.
        disabled:
          !isActionWired("approve") ||
          suspension.suspended ||
          driverVerificationDisplay(driver.verification).label === "Approved",
        disabledReason: !isActionWired("approve")
          ? "Not available yet"
          : suspension.suspended
            ? "Reactivate this driver first"
            : "This driver is already approved.",
      },
    ],
  };
}






