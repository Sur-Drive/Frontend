// Finance data layer: confirmed
// apiFetch calls, the one mapping layer from backend
// records to the design's cards/rows/drawer model, and the display helpers
// that render raw backend vocabulary with a neutral fallback for unknown
// values.
//
// Confirmed endpoints (observed 2026-11-17):
//   GET /admin/finance/overview                      bare object, defaults to
//                                                    the last 30 days
//   GET /admin/finance/transactions                  envelope { data, meta }
//   GET /admin/finance/transactions/{id}             detail (+ gateway fields)
//   GET /admin/finance/transactions/{id}/timeline    { id, title, description, at }[]
//   GET /admin/finance/refunds/stats                 bare object, defaults to
//                                                    the current month
//   GET /admin/finance/refunds                       envelope { data, meta }
//                                                    (EMPTY on this backend —
//                                                    row shapes are unobserved)
//   GET /admin/finance/refunds/{id}                  unobserved (no rows exist)
//   GET /admin/finance/refunds/{id}/timeline         unobserved (no rows exist)
//
// Wired here (the export endpoints are NEVER called
// from the terminal — browser fetch + bearer token + blob save only):
//   - Notes tab (transaction/settlement/refund drawers): GET/POST
//     /admin/finance/notes with { subjectType, subjectId, body } — body is
//     capped at 2000 chars and blank notes are rejected BEFORE any request;
//     the POST response is never trusted, the caller refetches with GET.
//     Observed GET shape (2026-11-17, all three subjectTypes, one with a real
//     payment id): 200 with an EMPTY body, so an empty note list is a true
//     zero and no item key has ever been observed. Note text lives ONLY in
//     the Notes tab and the POST body — never in rows, CSVs, toasts or logs
//     (asserted by the fixture harness).
//   - Export buttons (transactions/refunds/settlements lists): GET
//     /admin/finance/{transactions|refunds|settlements}/export with the same
//     filters as the on-screen list (search/status/method — page/limit are
//     pagination, not filters; from/to/sort have no on-screen control). The
//     CSV holds up to 50,000 rows of personal data: the response body is
//     never read, logged, printed or stored beyond the file save — only the
//     Content-Disposition header is inspected for the filename, and on
//     failure only the small JSON error body is parsed for the message.
//
// Refund mutations (responses never observed — typed
// unknown and never trusted, callers refetch list + stats + detail instead):
//   - Initiate refund (POST /admin/finance/refunds) from the transaction
//     drawer, only when the detail's canRefund is true, with a REQUIRED
//     Idempotency-Key header (a UUID minted once per user action and reused
//     when the same submit is retried — see createIdempotencyKey);
//   - Approve / Reject refund (POST /admin/finance/refunds/{id}/approve|
//     reject), enabled only by the detail's canApprove/canReject — plain
//     admins never see them active. Approve may move real money; reject
//     notifies the rider that the request was not approved and its reason is
//     internal (admin drawer only, never lists/exports).
//
// Settlement mutations (responses never observed — typed unknown
// and never trusted, callers refetch list + stats + detail + timeline):
//   - Driver settlement actions from the settlement drawer, each enabled only
//     by the detail's own can* flags (canApprove/canFlag/canUnflag/canRetry/
//     canReject — the admin's role is never assumed):
//       POST /admin/finance/settlements/{id}/approve  body none — WARNING: may
//         move REAL money (locks the funds and starts the bank transfer to
//         the default verified payout account shown on the drawer card);
//       POST .../retry                                body none — WARNING: may
//         move REAL money (starts a brand new payout attempt);
//       POST .../flag and POST .../reject             body { reason } — flag
//         marks the request for investigation; reject is FINAL, frees the
//         driver's reserved balance and pushes "Withdrawal not approved" (the
//         reason is internal: admin drawer only, never lists/exports);
//       POST .../unflag                               body none — back to
//         pending_approval.
//   - Approve/Retry fail closed when the amount or the masked payout account
//     cannot be read, and carry an AMBIGUOUS FAILURE GATE: after a network
//     error/timeout/5xx no second attempt goes out until the detail has been
//     refetched and still shows a status where the action is allowed
//     (pending_approval for approve, failed for retry).
//
// Units (probed 2026-11-17, see types/finance-api.ts): every money field is
// naira (doubles with cents) — no kobo conversion anywhere. ratePercent /
// averageRatePercent / changePercent are percents; changePercent is null when
// the previous window has no baseline. The commission rate is live data (20%
// on a card row, 0% on cash rows, 0.1% window average) and is never hardcoded.
// Refund stats: averageResolution.hours is hours and changeMinutes signed
// minutes (both 0/null on the empty backend — see the type header).
import { ApiError, apiFetch } from "@/lib/api";
import {
  NETWORK_ERROR_MESSAGE,
  apiBaseUrl,
  backendMessage,
  clearSession,
  getToken,
} from "@/lib/auth";
import {
  EM_DASH,
  formatDateLabel,
  formatNaira,
  formatNairaCompact,
  formatNumber,
  formatSignedNaira,
  formatTimeLabel,
  humanize,
} from "@/lib/format";
import type { Person } from "@/types/rides";
import type { DetailItem } from "@/types/ride-details";
import type { StatusTone } from "@/components/ui/StatusPill";
import type {
  DetailAction,
  DetailSection,
  EntityDetailsModel,
} from "@/types/entity-details";
import type {
  FinanceInitiateRefundBody,
  FinanceListResponse,
  FinanceNoteCreateBody,
  FinanceOverviewResponse,
  FinanceRefundDetail,
  FinanceRefundListItem,
  FinanceRefundsStatsResponse,
  FinanceRejectRefundBody,
  FinanceSettlementDetail,
  FinanceSettlementListItem,
  FinanceSettlementPeriod,
  FinanceSettlementReasonBody,
  FinanceSettlementsStatsResponse,
  FinanceTimelineEvent,
  FinanceTransactionDetail,
  FinanceTransactionListItem,
  FinanceTransactionMethod,
} from "@/types/finance-api";

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export interface FinanceOverviewQuery {
  // Optional window override; the design keeps the endpoint's default
  // (last 30 days), so the view never sends these today.
  from?: string;
  to?: string;
}

// GET /admin/finance/overview — bare object, no envelope.
export async function fetchFinanceOverview(
  query: FinanceOverviewQuery = {},
  signal?: AbortSignal,
): Promise<FinanceOverviewResponse> {
  const params = new URLSearchParams();
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<FinanceOverviewResponse>(`/admin/finance/overview${suffix}`, {
    signal,
  });
}

export interface FinanceTransactionsQuery {
  page: number;
  limit: number;
  // Matches passenger name/phone/email, the TXN-/SD- references and the
  // gateway reference.
  search?: string;
  // Raw backend values: successful | processing | pending | failed | refunded.
  status?: string;
  // Raw backend values: card | cash | wallet | bank_transfer | mobile_money |
  // ussd (observed: card, cash).
  method?: string;
  // from/to/sortBy/sortOrder are confirmed on the endpoint
  // but the design has no such controls, so they are never sent.
}

// GET /admin/finance/transactions — confirmed envelope { data, meta }. A
// response without a data array means the shape changed: fail loudly instead
// of rendering a fabricated empty list.
export async function fetchTransactionsPage(
  query: FinanceTransactionsQuery,
  signal?: AbortSignal,
): Promise<FinanceListResponse<FinanceTransactionListItem>> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  // User input: trim so whitespace-only search never becomes a query param.
  const search = query.search?.trim();
  if (search) params.set("search", search);
  if (query.status) params.set("status", query.status);
  if (query.method) params.set("method", query.method);
  const response = await apiFetch<
    FinanceListResponse<FinanceTransactionListItem>
  >(`/admin/finance/transactions?${params.toString()}`, { signal });
  if (
    !response ||
    typeof response !== "object" ||
    !Array.isArray(response.data)
  ) {
    throw new Error("Unexpected transactions response shape.");
  }
  return response;
}

// GET /admin/finance/transactions/{id} — drawer detail.
export async function fetchTransactionDetail(
  transactionId: string,
  signal?: AbortSignal,
): Promise<FinanceTransactionDetail> {
  return apiFetch<FinanceTransactionDetail>(
    `/admin/finance/transactions/${encodeURIComponent(transactionId)}`,
    { signal },
  );
}

// GET /admin/finance/transactions/{id}/timeline — drawer Timeline tab,
// oldest first.
export async function fetchTransactionTimeline(
  transactionId: string,
  signal?: AbortSignal,
): Promise<FinanceTimelineEvent[]> {
  return apiFetch<FinanceTimelineEvent[]>(
    `/admin/finance/transactions/${encodeURIComponent(transactionId)}/timeline`,
    { signal },
  );
}

// ---------------------------------------------------------------------------
// Value helpers (backend -> display)
// ---------------------------------------------------------------------------

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

// Money/count fields: null (missing) renders "—"; a real 0 stays 0.
function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// A money amount an admin could act on must be a finite positive number:
// missing (null/undefined), NaN/±Infinity and <= 0 are all "unreadable".
// The Approve/Retry guards use this so no drawer can confirm a money-moving
// action on an unknown value — the button's tooltip names the reason.
export function isUnreadableAmount(
  amount: number | null | undefined,
): boolean {
  return amount == null || !Number.isFinite(amount) || amount <= 0;
}

// Naira cell label — amounts pass through unchanged (no kobo conversion).
export function nairaLabel(value: number | null | undefined): string {
  return value === null || value === undefined ? EM_DASH : formatNaira(value);
}

// Compact naira for the overview cards, e.g. 1756602.7 -> "₦1.76M".
function compactNairaLabel(value: number | null | undefined): string {
  return value === null || value === undefined
    ? EM_DASH
    : formatNairaCompact(value);
}

function countLabel(value: number | null | undefined): string {
  return value === null || value === undefined ? EM_DASH : formatNumber(value);
}

// Percents keep one decimal (60.9 -> "60.9%"); null/missing renders "—".
export function percentLabel(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EM_DASH;
  }
  return `${formatNumber(Math.round(value * 10) / 10)}%`;
}

// Signed percent delta: 138.8 -> "+138.8%", -100 -> "−100%", null -> "—".
// Uses a real minus sign (U+2212), matching formatSignedNaira.
export function formatChangePercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EM_DASH;
  }
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) return "0%";
  return `${rounded > 0 ? "+" : "−"}${formatNumber(Math.abs(rounded))}%`;
}

// "17 Nov 2026, 10:42" for an ISO datetime; "—" for missing/invalid. Dates
// render in the user's timezone.
function formatDateTimeLabel(value: string | null | undefined): string {
  if (!value) return EM_DASH;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EM_DASH;
  return `${formatDateLabel(value)}, ${formatTimeLabel(value)}`;
}

// Initials avatar from a display name; missing names render "—" (same
// treatment as the ratings mapper).
const AVATAR_TONES = ["brand", "success", "warning", "info"] as const;

function makePerson(name: string | null | undefined): Person {
  const safeName = typeof name === "string" ? name.trim() : "";
  const initials = safeName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  const hash = safeName.length ? safeName.charCodeAt(0) + safeName.length : 0;
  return {
    name: safeName || EM_DASH,
    initials: initials || EM_DASH,
    tone: AVATAR_TONES[hash % AVATAR_TONES.length],
  };
}

// ---------------------------------------------------------------------------
// Display helpers (raw backend vocabulary -> design words)
// ---------------------------------------------------------------------------

// Raw payment status -> chip label + tone. Display statuses:
// successful | processing | pending | failed | refunded. Enums come from
// samples and are never exhaustive: unknown values fall back to a humanised
// label on a neutral chip.
const STATUS_DISPLAY: Record<string, { label: string; tone: StatusTone }> = {
  successful: { label: "Successful", tone: "success" },
  processing: { label: "Processing", tone: "info" },
  pending: { label: "Pending", tone: "warning" },
  failed: { label: "Failed", tone: "danger" },
  refunded: { label: "Refunded", tone: "neutral" },
};

export function transactionStatusDisplay(
  status: string | null | undefined,
): { label: string; tone: StatusTone } {
  const key = typeof status === "string" ? status.trim().toLowerCase() : "";
  return STATUS_DISPLAY[key] ?? { label: humanize(status), tone: "neutral" };
}

// Reference banner tone (the drawer's payment-reference card has no neutral
// option): successful/refunded green, pending/processing amber, failed red,
// unknown amber — a cautious default, never the riskiest one.
function bannerTone(status: string): "success" | "warning" | "danger" {
  const key = status.trim().toLowerCase();
  if (key === "successful" || key === "refunded") return "success";
  if (key === "pending" || key === "processing") return "warning";
  if (key === "failed") return "danger";
  return "warning";
}

// "Card •••• 4821" / "Cash" / humanised fallback for unknown types;
// cardLast4 can be null: show the label alone.
export function paymentMethodLabel(
  method: FinanceTransactionMethod | null | undefined,
): string {
  const label = asString(method?.label);
  const type = asString(method?.type);
  const base = label || humanize(type) || EM_DASH;
  const last4 = asString(method?.cardLast4);
  return last4 ? `${base} •••• ${last4}` : base;
}

// Toolbar options: labels -> confirmed raw query-param values. "All" sends no
// param. Method values are the backend's enum (card/cash observed live); an
// option the backend has not seen yet simply returns an empty list.
export const TRANSACTION_STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All statuses", value: "all" },
  { label: "Successful", value: "successful" },
  { label: "Processing", value: "processing" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
];

export const TRANSACTION_METHOD_OPTIONS: { label: string; value: string }[] = [
  { label: "All methods", value: "all" },
  { label: "Card", value: "card" },
  { label: "Wallet", value: "wallet" },
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "Cash", value: "cash" },
  { label: "Mobile Money", value: "mobile_money" },
  { label: "USSD", value: "ussd" },
];

// ---------------------------------------------------------------------------
// Overview cards — GET /overview -> the seven header cards
// ---------------------------------------------------------------------------

export interface FinanceOverviewCard {
  label: string;
  value: string;
  note: string | null;
  noteTone: "success" | "muted" | "danger";
}

function changeNote(value: number | null | undefined): {
  note: string;
  noteTone: "success" | "muted" | "danger";
} {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    // No baseline: the note renders "—" in a muted tone.
    return { note: EM_DASH, noteTone: "muted" };
  }
  if (value > 0) {
    return { note: formatChangePercent(value), noteTone: "success" };
  }
  if (value < 0) {
    return { note: formatChangePercent(value), noteTone: "danger" };
  }
  return { note: "0%", noteTone: "muted" };
}

// null response (not loaded or failed) keeps every value "—" so the cards
// never fabricate zeros; a loaded response shows the endpoint's true zeros
// (0 commission, 0 refunds were real values in the observed windows).
export function mapOverviewCards(
  response: FinanceOverviewResponse | null | undefined,
): FinanceOverviewCard[] {
  if (!response || typeof response !== "object") {
    return [
      "Gross Ride Revenue",
      "Platform Commission",
      "Driver Earnings",
      "Successful Payments",
      "Failed Payments",
      "Refunds",
      "Pending Settlements",
    ].map((label) => ({
      label,
      value: EM_DASH,
      note: null,
      noteTone: "muted" as const,
    }));
  }
  const grossChange = changeNote(response.grossRideRevenue?.changePercent);
  const driverChange = changeNote(response.driverEarnings?.changePercent);
  const averageRate = response.platformCommission?.averageRatePercent;
  const successfulRate = response.successfulPayments?.ratePercent;
  const failedRate = response.failedPayments?.ratePercent;
  const refundCount = response.refunds?.count;
  const driverCount = response.pendingSettlements?.driverCount;
  return [
    {
      label: "Gross Ride Revenue",
      value: compactNairaLabel(asNumber(response.grossRideRevenue?.amount)),
      note: grossChange.note,
      noteTone: grossChange.noteTone,
    },
    {
      label: "Platform Commission",
      // The window's live average rate from the endpoint — never a hardcoded
      // 15%/20% (observed 0.1% for October, 0% on the default window).
      value: compactNairaLabel(asNumber(response.platformCommission?.amount)),
      note:
        averageRate === null || averageRate === undefined
          ? null
          : `${percentLabel(averageRate)} avg. incl. cash rides`,
      noteTone: "muted",
    },
    {
      label: "Driver Earnings",
      value: compactNairaLabel(asNumber(response.driverEarnings?.amount)),
      note: driverChange.note,
      noteTone: driverChange.noteTone,
    },
    {
      label: "Successful Payments",
      value: countLabel(asNumber(response.successfulPayments?.count)),
      note:
        successfulRate === null || successfulRate === undefined
          ? null
          : percentLabel(successfulRate),
      noteTone: "success",
    },
    {
      label: "Failed Payments",
      value: countLabel(asNumber(response.failedPayments?.count)),
      note:
        failedRate === null || failedRate === undefined
          ? null
          : percentLabel(failedRate),
      noteTone: "muted",
    },
    {
      label: "Refunds",
      value: compactNairaLabel(asNumber(response.refunds?.amount)),
      note:
        refundCount === null || refundCount === undefined
          ? null
          : `${formatNumber(refundCount)} issued`,
      noteTone: "muted",
    },
    {
      label: "Pending Settlements",
      value: compactNairaLabel(asNumber(response.pendingSettlements?.amount)),
      note:
        driverCount === null || driverCount === undefined
          ? null
          : `${formatNumber(driverCount)} drivers`,
      noteTone: "muted",
    },
  ];
}

// ---------------------------------------------------------------------------
// Transactions list — GET /transactions -> table rows
// ---------------------------------------------------------------------------

// UI row for the Payments & Transactions table. Only display fields survive:
// the passenger's id never reaches component state, and the ride's raw uuid
// (rideId) is kept solely for the "View ride" navigation.
export interface FinanceTransactionRow {
  id: string; // UUID string — drawer fetch key
  reference: string; // TXN-… display id
  rideReference: string; // SD-… display id
  rideId: string; // UUID string — View ride navigation ("" when missing)
  passenger: Person;
  methodLabel: string;
  gross: number | null; // naira
  commission: number | null; // naira
  earnings: number | null; // naira
  status: string; // raw backend value
  createdAt: string | null; // ISO 8601 UTC
  dateLabel: string;
}

export function mapTransactionListItem(
  item: FinanceTransactionListItem,
): FinanceTransactionRow {
  return {
    id: asString(item.id) || EM_DASH,
    reference: asString(item.reference) || EM_DASH,
    rideReference: asString(item.rideReference) || EM_DASH,
    rideId: asString(item.rideId),
    passenger: makePerson(item.passenger?.name),
    methodLabel: paymentMethodLabel(item.paymentMethod),
    gross: asNumber(item.grossFare),
    commission: asNumber(item.commission),
    earnings: asNumber(item.driverEarnings),
    status: asString(item.status),
    createdAt: asStringOrNull(item.createdAt),
    dateLabel: formatDateLabel(item.createdAt),
  };
}

// ---------------------------------------------------------------------------
// Drawer model — detail + timeline -> EntityDetailsModel
// ---------------------------------------------------------------------------

// Everything the drawer renders, normalised from either the list row
// (provisional model while the detail loads) or the live detail + timeline.
// passengerId is deliberately absent: the drawer never renders it.
export interface TransactionModelSource {
  id: string; // UUID string
  reference: string;
  rideId: string; // "" when missing — the View ride action is dropped then
  rideReference: string;
  passengerName: string;
  methodLabel: string;
  gross: number | null;
  commission: number | null;
  earnings: number | null;
  status: string;
  createdAt: string | null;
  paidAt: string | null;
  updatedAt: string | null;
  provider: string | null;
  gatewayReference: string | null;
  totalRefunded: number | null;
  refundableAmount: number | null;
  canRefund: boolean;
  timeline: { title: string; time: string }[];
}

export function transactionSourceFromRow(
  row: FinanceTransactionRow,
): TransactionModelSource {
  return {
    id: row.id,
    reference: row.reference,
    rideId: row.rideId,
    rideReference: row.rideReference,
    passengerName: row.passenger.name,
    methodLabel: row.methodLabel,
    gross: row.gross,
    commission: row.commission,
    earnings: row.earnings,
    status: row.status,
    createdAt: row.createdAt,
    paidAt: null,
    updatedAt: null,
    provider: null,
    gatewayReference: null,
    totalRefunded: null,
    refundableAmount: null,
    canRefund: false,
    timeline: [],
  };
}

// Timeline events -> drawer steps, oldest first as delivered. The description
// has no dedicated line in the shared timeline section, so it rides on the
// title ("Title — description"); the timestamp renders as "date, time".
function mapTimelineEvents(
  events: FinanceTimelineEvent[] | null | undefined,
): { title: string; time: string }[] {
  const list = Array.isArray(events) ? events : [];
  return list.map((event) => {
    const title = asString(event?.title) || EM_DASH;
    const description = asString(event?.description);
    return {
      title: description ? `${title} — ${description}` : title,
      time: formatDateTimeLabel(asStringOrNull(event?.at)),
    };
  });
}

export function transactionSourceFromDetail(
  detail: FinanceTransactionDetail,
  timeline: FinanceTimelineEvent[] | null | undefined,
): TransactionModelSource {
  return {
    id: asString(detail.id),
    reference: asString(detail.reference) || EM_DASH,
    rideId: asString(detail.rideId),
    rideReference: asString(detail.rideReference) || EM_DASH,
    passengerName: asString(detail.passenger?.name),
    methodLabel: paymentMethodLabel(detail.paymentMethod),
    gross: asNumber(detail.grossFare),
    commission: asNumber(detail.commission),
    earnings: asNumber(detail.driverEarnings),
    status: asString(detail.status),
    createdAt: asStringOrNull(detail.createdAt),
    paidAt: asStringOrNull(detail.paidAt),
    updatedAt: asStringOrNull(detail.updatedAt),
    provider: asStringOrNull(detail.provider),
    gatewayReference: asStringOrNull(detail.gatewayReference),
    totalRefunded: asNumber(detail.totalRefunded),
    refundableAmount: asNumber(detail.refundableAmount),
    canRefund: detail.canRefund === true,
    timeline: mapTimelineEvents(timeline),
  };
}

// Builds the drawer model. Rules applied here:
//   - the "Payment reference" banner shows gatewayReference (falling back to
//     the transaction reference while the detail loads);
//   - Initiate refund appears ONLY when canRefund is true (cash payments are
//     never refundable here) and opens the refund dialog, which confirms
//     before anything is sent;
//   - View ride navigates with the raw rideId.
export function buildTransactionDetailModel(
  source: TransactionModelSource,
): EntityDetailsModel {
  const status = transactionStatusDisplay(source.status);
  const timelineSection: DetailSection = source.timeline.length
    ? { kind: "timeline", title: "Transaction timeline", steps: source.timeline }
    : {
        kind: "empty",
        title: "Transaction timeline",
        message: "No recorded activity yet.",
      };

  const infoItems: DetailItem[] = [
    { label: "Transaction ID", value: source.reference },
    { label: "Ride", value: source.rideReference },
    { label: "Payment method", value: source.methodLabel },
    { label: "Provider", value: source.provider },
    { label: "Gross fare", value: nairaLabel(source.gross) },
    { label: "Commission", value: nairaLabel(source.commission) },
    { label: "Driver earnings", value: nairaLabel(source.earnings) },
    {
      label: "Status",
      value: null,
      pill: { tone: status.tone, label: status.label },
    },
    { label: "Created", value: formatDateTimeLabel(source.createdAt) },
    {
      label: "Paid",
      value: source.paidAt ? formatDateTimeLabel(source.paidAt) : EM_DASH,
    },
    {
      label: "Last updated",
      value: source.updatedAt ? formatDateTimeLabel(source.updatedAt) : EM_DASH,
    },
    { label: "Total refunded", value: nairaLabel(source.totalRefunded) },
    { label: "Refundable", value: nairaLabel(source.refundableAmount) },
  ];

  const actions: DetailAction[] = [];
  if (source.rideId) {
    actions.push({
      id: "view-ride",
      label: "View ride",
      variant: "outline",
      dialogTitle: "Confirm view ride",
      href: `/admin/ride-management?ride=${encodeURIComponent(source.rideId)}`,
    });
  }
  if (source.canRefund) {
    actions.push({
      id: "initiate-refund",
      label: "Initiate refund",
      variant: "brand",
      dialogTitle: "Confirm initiate refund",
      confirmTone: "brand",
      // Notes are required by the endpoint (POST /admin/finance/refunds);
      // the amount is optional and lives in the
      // dialog's extra field (see TransactionDetailsDrawer).
      noteLabel: "Notes",
      noteRequired: true,
      notePlaceholder: "Why is this refund being issued?",
    });
  }

  return {
    entity: "transaction",
    id: source.id,
    eyebrow: "TRANSACTION DETAILS",
    title: source.passengerName || EM_DASH,
    subtitle: source.updatedAt
      ? `${source.reference} • Updated ${formatDateLabel(source.updatedAt)}`
      : source.reference,
    tabs: [
      {
        id: "overview",
        label: "Overview",
        sections: [
          {
            kind: "reference",
            label: "Payment reference",
            value: source.gatewayReference || source.reference,
            pill: { tone: status.tone, label: status.label },
            tone: bannerTone(source.status),
          },
          {
            kind: "breakdown",
            title: "Fare breakdown",
            rows: [
              { label: "Gross fare", value: nairaLabel(source.gross) },
              {
                label: "Platform commission",
                value: nairaLabel(source.commission),
              },
            ],
            total: {
              label: "Driver earnings",
              value: nairaLabel(source.earnings),
            },
          },
          { kind: "info", title: "Transaction information", items: infoItems },
          timelineSection,
        ],
      },
      {
        id: "timeline",
        label: "Timeline",
        sections: [timelineSection],
      },
      {
        id: "notes",
        label: "Notes",
        // Live notes tab: FinanceDrawerShell renders the
        // FinanceNotesTab panel for this tab id (GET/POST
        // /admin/finance/notes), so the model carries no sections of its own.
        sections: [],
      },
    ],
    actions,
  };
}

// ---------------------------------------------------------------------------
// Refunds — fetchers
// ---------------------------------------------------------------------------

export interface FinanceRefundsStatsQuery {
  // Optional window override. The cards say "Refunded This Month", so the
  // view sends the EXPLICIT current Lagos month (lagosMonthWindow below)
  // instead of trusting the server's idea of "now": the window then matches
  // the month the admin is looking at, whatever the server timezone is.
  from?: string;
  to?: string;
}

// Lagos is UTC+1 all year (no DST), so a Lagos calendar month maps onto a
// fixed UTC window. `reference` is the instant whose Lagos month is wanted:
// October 2026 -> from 2026-09-30T23:00:00.000Z (1st 00:00 Lagos) to
// 2026-10-31T22:59:59.999Z (last day 23:59:59.999 Lagos). Pure: the caller
// supplies the instant, so the fixture pins any month without a clock.
const LAGOS_UTC_OFFSET_MS = 3_600_000;

export interface FinanceDateWindow {
  from: string;
  to: string;
}

export function lagosMonthWindow(reference: Date): FinanceDateWindow | null {
  const time = reference.getTime();
  if (!Number.isFinite(time)) return null;
  // Shift by the fixed offset so the UTC getters read the Lagos calendar.
  const lagos = new Date(time + LAGOS_UTC_OFFSET_MS);
  const year = lagos.getUTCFullYear();
  const month = lagos.getUTCMonth();
  const from = new Date(Date.UTC(year, month, 1) - LAGOS_UTC_OFFSET_MS);
  const to = new Date(
    Date.UTC(year, month + 1, 1) - LAGOS_UTC_OFFSET_MS - 1,
  );
  return { from: from.toISOString(), to: to.toISOString() };
}

// GET /admin/finance/refunds/stats — bare object (probed 200), defaults to
// the current month; from/to are accepted and echoed back via range.
export async function fetchRefundsStats(
  query: FinanceRefundsStatsQuery = {},
  signal?: AbortSignal,
): Promise<FinanceRefundsStatsResponse> {
  const params = new URLSearchParams();
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<FinanceRefundsStatsResponse>(
    `/admin/finance/refunds/stats${suffix}`,
    { signal },
  );
}

export interface FinanceRefundsQuery {
  page: number;
  limit: number;
  // Search matches the refund/payment/ride references and the passenger
  // (a refund row carries reference + transactionReference +
  // rideReference + passenger).
  search?: string;
  // Validated server-side (probed 400 on an unknown value):
  // pending | processing | refunded | rejected | failed.
  status?: string;
  // Validated server-side (probed 400 on an unknown value): the same method
  // enum as the transactions list (card/cash observed there).
  method?: string;
  // from/to are accepted by the endpoint (probed 200) but the design has no
  // window control, so they are never sent.
}

// GET /admin/finance/refunds — confirmed envelope { data, meta }. A response
// without a data array means the shape changed: fail loudly instead of
// rendering a fabricated empty list.
export async function fetchRefundsPage(
  query: FinanceRefundsQuery,
  signal?: AbortSignal,
): Promise<FinanceListResponse<FinanceRefundListItem>> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  // User input: trim so whitespace-only search never becomes a query param.
  const search = query.search?.trim();
  if (search) params.set("search", search);
  if (query.status) params.set("status", query.status);
  if (query.method) params.set("method", query.method);
  const response = await apiFetch<FinanceListResponse<FinanceRefundListItem>>(
    `/admin/finance/refunds?${params.toString()}`,
    { signal },
  );
  if (
    !response ||
    typeof response !== "object" ||
    !Array.isArray(response.data)
  ) {
    throw new Error("Unexpected refunds response shape.");
  }
  return response;
}

// GET /admin/finance/refunds/{id} — drawer detail. UNOBSERVED (the live list
// is empty, so no id has ever existed): the mapper must survive any real
// shape and render "—" for whatever is missing.
export async function fetchRefundDetail(
  refundId: string,
  signal?: AbortSignal,
): Promise<FinanceRefundDetail> {
  return apiFetch<FinanceRefundDetail>(
    `/admin/finance/refunds/${encodeURIComponent(refundId)}`,
    { signal },
  );
}

// GET /admin/finance/refunds/{id}/timeline — drawer Timeline tab, oldest
// first. UNOBSERVED (no rows exist).
export async function fetchRefundTimeline(
  refundId: string,
  signal?: AbortSignal,
): Promise<FinanceTimelineEvent[]> {
  return apiFetch<FinanceTimelineEvent[]>(
    `/admin/finance/refunds/${encodeURIComponent(refundId)}/timeline`,
    { signal },
  );
}

// ---------------------------------------------------------------------------
// Refunds — display helpers (raw backend vocabulary -> design words)
// ---------------------------------------------------------------------------

// Raw refund status -> chip label + tone. Validated backend values (probed
// 400 on an unknown value): pending | processing | refunded | rejected |
// failed. `requested` is the rider-app request status from the raw
// enum; it waits in the same pending review queue, so it renders exactly like
// pending (the tab/status filters stay untouched). The tab bar calls
// `refunded` "Completed"; the chip keeps the status vocabulary shared with
// the payments list (REFUND_STATUS_TONE). Unknown values fall back to a
// humanised label on a neutral chip.
const REFUND_STATUS_DISPLAY: Record<string, { label: string; tone: StatusTone }> =
  {
    requested: { label: "Pending", tone: "warning" },
    pending: { label: "Pending", tone: "warning" },
    processing: { label: "Processing", tone: "info" },
    refunded: { label: "Refunded", tone: "success" },
    rejected: { label: "Rejected", tone: "danger" },
    failed: { label: "Failed", tone: "danger" },
  };

export function refundStatusDisplay(
  status: string | null | undefined,
): { label: string; tone: StatusTone } {
  const key = typeof status === "string" ? status.trim().toLowerCase() : "";
  return (
    REFUND_STATUS_DISPLAY[key] ?? { label: humanize(status), tone: "neutral" }
  );
}

// Reference banner tone for the refund drawer (no neutral option): refunded
// green, pending/processing amber, failed/rejected red, unknown amber — a
// cautious default, never the riskiest one.
function refundBannerTone(status: string): "success" | "warning" | "danger" {
  const key = status.trim().toLowerCase();
  if (key === "refunded") return "success";
  if (key === "failed" || key === "rejected") return "danger";
  return "warning";
}

// Toolbar options: labels -> confirmed raw query-param values. "All" sends no
// param. The five statuses are the endpoint's validated enum (probed 400 on
// an unknown value); `failed` has no tab of its own and is reachable here or
// under All.
export const REFUND_STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Refunded", value: "refunded" },
  { label: "Rejected", value: "rejected" },
  { label: "Failed", value: "failed" },
];

// ---------------------------------------------------------------------------
// Refunds stats — GET /refunds/stats -> the four header cards
// ---------------------------------------------------------------------------

// Signed minute delta, e.g. -18 -> "−18 min", 12 -> "+12 min", 0 -> "0 min".
// null (no baseline, observed on the empty backend) renders no note at all.
function changeMinutesNote(value: number | null | undefined): string | null {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  const rounded = Math.round(value);
  if (rounded === 0) return "0 min";
  return `${rounded > 0 ? "+" : "−"}${formatNumber(Math.abs(rounded))} min`;
}

// "3.4 hrs" style value (one decimal, like the design's mock); "—" when the
// stats have not loaded.
function hoursLabel(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EM_DASH;
  }
  return `${formatNumber(Math.round(value * 10) / 10)} hrs`;
}

function refundMetricCard(
  label: string,
  metric: FinanceRefundsStatsResponse["refunded"],
  countNoun: "refunds" | "requests",
): FinanceOverviewCard {
  const count = asNumber(metric?.count);
  return {
    label,
    value: compactNairaLabel(asNumber(metric?.amount)),
    note: count === null ? null : `${formatNumber(count)} ${countNoun}`,
    noteTone: "muted",
  };
}

// null response (not loaded or failed) keeps every value "—" so the cards
// never fabricate zeros; a loaded response shows the endpoint's true zeros
// (the probed stats are all 0 — no refund has ever been issued on this
// backend, so a loaded "₦0 / 0 refunds" is the real state).
export function mapRefundStats(
  response: FinanceRefundsStatsResponse | null | undefined,
): FinanceOverviewCard[] {
  if (!response || typeof response !== "object") {
    return [
      "Refunded This Month",
      "Pending Review",
      "Processing",
      "Average Resolution",
    ].map((label) => ({
      label,
      value: EM_DASH,
      note: null,
      noteTone: "muted" as const,
    }));
  }
  return [
    refundMetricCard("Refunded This Month", response.refunded, "refunds"),
    refundMetricCard("Pending Review", response.pendingReview, "requests"),
    refundMetricCard("Processing", response.processing, "refunds"),
    {
      label: "Average Resolution",
      value: hoursLabel(asNumber(response.averageResolution?.hours)),
      note: changeMinutesNote(response.averageResolution?.changeMinutes),
      noteTone: "muted",
    },
  ];
}

// ---------------------------------------------------------------------------
// Refunds list — GET /refunds -> table rows
// ---------------------------------------------------------------------------

// UI row for the Refunds table. Only display fields survive: the passenger's
// id never reaches component state, and no gateway/provider reference is
// copied (the detail may carry one — it stays behind this layer, asserted by
// the fixture harness). The reject reason is internal and is never mapped for
// display anywhere.
export interface FinanceRefundRow {
  id: string; // UUID string — drawer fetch key
  reference: string; // RFD-… display id
  transactionReference: string; // original payment TXN-…
  rideReference: string; // SD-… display id
  rideId: string; // raw uuid for View ride navigation ("" when missing)
  passenger: Person;
  methodLabel: string;
  refundAmount: number | null; // naira
  gross: number | null; // fare split of the original payment (naira)
  commission: number | null; // naira
  earnings: number | null; // naira
  reason: string | null; // why the refund was raised (drawer-only row)
  status: string; // raw backend value
  createdAt: string | null; // ISO 8601 UTC
  dateLabel: string;
}

// The "fare split of the original payment" names no field and the
// live list is empty, so this reads numbers tolerantly from whatever object
// arrives and gives up with nulls ("—") for anything else — never a guess
// rendered as fact.
function fareSplitNumbers(split: unknown): {
  gross: number | null;
  commission: number | null;
  earnings: number | null;
} {
  if (!split || typeof split !== "object" || Array.isArray(split)) {
    return { gross: null, commission: null, earnings: null };
  }
  const record = split as Record<string, unknown>;
  const pick = (...keys: string[]): number | null => {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "number" && Number.isFinite(value)) return value;
    }
    return null;
  };
  return {
    gross: pick("grossFare", "gross"),
    commission: pick("commission"),
    earnings: pick("driverEarnings", "earnings"),
  };
}

export function mapRefundListItem(
  item: FinanceRefundListItem,
): FinanceRefundRow {
  const split = fareSplitNumbers(item.fareSplit);
  return {
    id: asString(item.id) || EM_DASH,
    reference: asString(item.reference) || EM_DASH,
    transactionReference: asString(item.transactionReference) || EM_DASH,
    rideReference: asString(item.rideReference) || EM_DASH,
    rideId: asString(item.rideId),
    passenger: makePerson(item.passenger?.name),
    methodLabel: paymentMethodLabel(item.paymentMethod),
    refundAmount: asNumber(item.refundAmount),
    gross: split.gross,
    commission: split.commission,
    earnings: split.earnings,
    reason: asStringOrNull(item.reason),
    status: asString(item.status),
    createdAt: asStringOrNull(item.createdAt),
    dateLabel: formatDateLabel(item.createdAt),
  };
}

// ---------------------------------------------------------------------------
// Refund drawer model — detail + timeline -> EntityDetailsModel
// ---------------------------------------------------------------------------

// Everything the drawer renders, normalised from either the list row
// (provisional model while the detail loads) or the live detail + timeline.
// passengerId is deliberately absent: the drawer never renders it. No
// gateway/provider reference is copied either.
export interface RefundModelSource {
  id: string; // UUID string
  reference: string; // RFD-…
  transactionReference: string;
  rideId: string; // "" when missing — the View ride action is dropped then
  rideReference: string;
  passengerName: string;
  methodLabel: string;
  refundAmount: number | null; // naira
  gross: number | null; // fare split of the original payment (naira)
  commission: number | null;
  earnings: number | null;
  reason: string | null;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  canApprove: boolean;
  canReject: boolean;
  timeline: { title: string; time: string }[];
}

export function refundSourceFromRow(
  row: FinanceRefundRow,
): RefundModelSource {
  return {
    id: row.id,
    reference: row.reference,
    transactionReference: row.transactionReference,
    rideId: row.rideId,
    rideReference: row.rideReference,
    passengerName: row.passenger.name,
    methodLabel: row.methodLabel,
    refundAmount: row.refundAmount,
    gross: row.gross,
    commission: row.commission,
    earnings: row.earnings,
    reason: row.reason,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: null,
    canApprove: false,
    canReject: false,
    timeline: [],
  };
}

export function refundSourceFromDetail(
  detail: FinanceRefundDetail,
  timeline: FinanceTimelineEvent[] | null | undefined,
): RefundModelSource {
  const split = fareSplitNumbers(detail.fareSplit);
  return {
    id: asString(detail.id),
    reference: asString(detail.reference) || EM_DASH,
    transactionReference: asString(detail.transactionReference) || EM_DASH,
    rideId: asString(detail.rideId),
    rideReference: asString(detail.rideReference) || EM_DASH,
    passengerName: asString(detail.passenger?.name),
    methodLabel: paymentMethodLabel(detail.paymentMethod),
    refundAmount: asNumber(detail.refundAmount),
    gross: split.gross,
    commission: split.commission,
    earnings: split.earnings,
    reason: asStringOrNull(detail.reason),
    status: asString(detail.status),
    createdAt: asStringOrNull(detail.createdAt),
    updatedAt: asStringOrNull(detail.updatedAt),
    canApprove: detail.canApprove === true,
    canReject: detail.canReject === true,
    timeline: mapTimelineEvents(timeline),
  };
}

// Builds the drawer model. Rules applied here:
//   - the banner shows the refund's own RFD reference;
//   - Approve / Reject render ONLY from the detail's canApprove / canReject
//     and each opens a confirm dialog first (approving starts the gateway
//     payout and rejecting pushes the rider a generic "not approved"
//     notification);
//   - View ride navigates with the raw rideId;
//   - Notes is rendered by the drawer shell's live Notes tab;
//   - the reject reason is internal and is never rendered.
export function buildRefundDetailModel(
  source: RefundModelSource,
): EntityDetailsModel {
  const status = refundStatusDisplay(source.status);
  const timelineSection: DetailSection = source.timeline.length
    ? { kind: "timeline", title: "Refund timeline", steps: source.timeline }
    : {
        kind: "empty",
        title: "Refund timeline",
        message: "No recorded activity yet.",
      };

  const infoItems: DetailItem[] = [
    { label: "Refund ID", value: source.reference },
    { label: "Transaction", value: source.transactionReference },
    { label: "Ride", value: source.rideReference },
    { label: "Payment method", value: source.methodLabel },
    { label: "Refund amount", value: nairaLabel(source.refundAmount) },
    { label: "Reason", value: source.reason || EM_DASH },
    {
      label: "Status",
      value: null,
      pill: { tone: status.tone, label: status.label },
    },
    { label: "Created", value: formatDateTimeLabel(source.createdAt) },
    {
      label: "Updated",
      value: source.updatedAt ? formatDateTimeLabel(source.updatedAt) : EM_DASH,
    },
  ];

  const actions: DetailAction[] = [];
  if (source.rideId) {
    actions.push({
      id: "view-ride",
      label: "View ride",
      variant: "outline",
      dialogTitle: "Confirm view ride",
      href: `/admin/ride-management?ride=${encodeURIComponent(source.rideId)}`,
    });
  }
  if (source.canApprove) {
    // The approve dialog shows the refund's own amount and reference so the
    // super admin approves a KNOWN value (see RefundDetailsDrawer). An
    // amount that is missing, non-finite or <= 0 is unreadable, so the
    // button stays disabled with that reason as its tooltip — approving may
    // move REAL money, never an unknown amount.
    const amountUnreadable = isUnreadableAmount(source.refundAmount);
    actions.push({
      id: "approve-refund",
      label: "Approve refund",
      variant: "brand",
      dialogTitle: "Confirm approve refund",
      confirmTone: "brand",
      // Approve refund (POST .../refunds/{id}/approve). Approving may
      // move REAL money (it starts the gateway refund), and it may still fail
      // with 400 when it would exceed the remaining refundable amount — the
      // drawer then offers Reject. No request body, so no note field.
      disabled: amountUnreadable,
      ...(amountUnreadable
        ? { disabledReason: "Refund amount could not be read" }
        : {}),
    });
  }
  if (source.canReject) {
    actions.push({
      id: "reject-refund",
      label: "Reject refund",
      variant: "danger",
      dialogTitle: "Confirm reject refund",
      confirmTone: "danger",
      // Reject refund (POST .../refunds/{id}/reject) with a required
      // { reason } body. Rejecting notifies the rider that the request was
      // not approved; the reason is INTERNAL — admin drawer only.
      noteLabel: "Reason",
      noteRequired: true,
      notePlaceholder: "Why is this refund being rejected?",
    });
  }

  return {
    entity: "transaction",
    id: source.id,
    eyebrow: "REFUND DETAILS",
    title: source.passengerName || EM_DASH,
    subtitle: source.createdAt
      ? `${source.reference} • Requested ${formatDateLabel(source.createdAt)}`
      : source.reference,
    tabs: [
      {
        id: "overview",
        label: "Overview",
        sections: [
          {
            kind: "reference",
            label: "Refund reference",
            value: source.reference,
            pill: { tone: status.tone, label: status.label },
            tone: refundBannerTone(source.status),
          },
          {
            kind: "breakdown",
            title: "Fare breakdown",
            rows: [
              { label: "Gross fare", value: nairaLabel(source.gross) },
              {
                label: "Platform commission",
                value: nairaLabel(source.commission),
              },
            ],
            total: {
              label: "Driver earnings",
              value: nairaLabel(source.earnings),
            },
          },
          { kind: "info", title: "Refund information", items: infoItems },
          timelineSection,
        ],
      },
      {
        id: "timeline",
        label: "Timeline",
        sections: [timelineSection],
      },
      {
        id: "notes",
        label: "Notes",
        // Live notes tab: FinanceDrawerShell renders the
        // FinanceNotesTab panel for this tab id (GET/POST
        // /admin/finance/notes), so the model carries no sections of its own.
        sections: [],
      },
    ],
    actions,
  };
}






// ---------------------------------------------------------------------------
// Refund mutations — POST /admin/finance/refunds (initiate),
// POST /admin/finance/refunds/{id}/approve, POST .../reject
// ---------------------------------------------------------------------------

// Confirm-dialog copy — nothing more is claimed. Keyed by the footer action
// id; the finance drawer shell falls back to the shared generic copy for any
// other action.
export const REFUND_ACTION_DESCRIPTIONS: Record<string, string> = {
  "initiate-refund": "Needs a super admin's approval before any money moves.",
  "approve-refund": "Starts a refund through the payment gateway.",
  "reject-refund":
    "Notifies the rider that the request was not approved. The reason is internal.",
};

// A fresh UUID for the required Idempotency-Key header (minted once per user
// action; the caller keeps it in state and reuses it
// when the same submit is retried). crypto.randomUUID covers browsers
// (secure contexts) and Node 18+; the fallback keeps the UUID flowing
// everywhere else.
export function createIdempotencyKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

// Module-level double-submit lock across ALL refund mutations: the confirm
// buttons already disable while loading, but a second request must never go
// out even if two drawers race. One refund action in flight at a time; the
// lock is released when the action settles (success or failure).
let refundMutationInFlight = false;

async function runExclusiveRefundMutation<T>(
  run: () => Promise<T>,
): Promise<T> {
  if (refundMutationInFlight) {
    throw new Error("A refund action is already in progress.");
  }
  refundMutationInFlight = true;
  try {
    return await run();
  } finally {
    refundMutationInFlight = false;
  }
}

export interface InitiateRefundInput {
  paymentId: string;
  // Naira, OPTIONAL: left out entirely to refund everything still refundable.
  // NEVER unit-converted (the API speaks naira).
  amount?: number;
  notes: string;
  // REQUIRED UUID header, minted once per user action by the drawer and kept
  // in its state so a retry of the same submit reuses it.
  idempotencyKey: string;
}

// POST /admin/finance/refunds — from the transaction drawer, only when the
// detail's canRefund is true (cash payments are never refundable). Admin
// refunds always wait for a super admin's approval. The response is a
// snapshot of the new refund whose shape was never observed: typed unknown,
// never trusted — the drawer refetches list + stats + detail after this.
export async function initiateRefund(
  input: InitiateRefundInput,
): Promise<void> {
  if (!input.idempotencyKey) {
    // The header is REQUIRED: fail before any request goes out rather than
    // posting an un-idempotent refund.
    throw new Error("An idempotency key is required to initiate a refund.");
  }
  const body: FinanceInitiateRefundBody = {
    paymentId: input.paymentId,
    notes: input.notes,
  };
  if (input.amount !== undefined) {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      // Validation, enforced again at the data layer: an invalid
      // amount can never reach the network even if a caller skips the
      // dialog's check (the UI validates > 0 and <= refundableAmount too).
      throw new Error("A refund amount must be greater than 0.");
    }
    body.amount = input.amount;
  }
  await runExclusiveRefundMutation(() =>
    apiFetch<unknown>("/admin/finance/refunds", {
      method: "POST",
      headers: { "Idempotency-Key": input.idempotencyKey },
      body: JSON.stringify(body),
    }),
  );
}

// Validates the initiate dialog's optional amount field. Blank
// means "refund everything refundable" — the request body then omits
// `amount` — and is always accepted. A typed value must be a PLAIN positive
// number with at most 2 decimals: no commas, no signs, no NaN text, no
// exponent notation. When the detail's refundableAmount could not be read,
// NO typed amount is accepted at all (it cannot be checked against the
// balance), so blank is the only option. Returns the inline dialog error,
// or null when the draft may be submitted. Lives here so the fixture
// harness canaries the exact rules the dialog renders.
export function refundAmountFieldError(
  draft: string,
  refundableAmount: number | null | undefined,
): string | null {
  const value = draft.trim();
  if (!value) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    return "Enter a plain naira amount with at most 2 decimals — no commas or other characters — or leave the field blank to refund everything refundable.";
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "Enter an amount greater than 0, or leave the field blank to refund everything refundable.";
  }
  if (refundableAmount == null) {
    return "The refundable balance could not be read, so a typed amount cannot be accepted. Leave the field blank to refund everything refundable.";
  }
  if (parsed > refundableAmount) {
    return `That exceeds the refundable balance of ${nairaLabel(refundableAmount)}.`;
  }
  return null;
}

// POST /admin/finance/refunds/{id}/approve — super admin only (the API 403s
// a plain admin; the drawer renders this action only from the detail's
// canApprove). WARNING: approving may move REAL money — it starts the gateway
// refund. No request body. Response unknown — the caller refetches.
export async function approveRefund(refundId: string): Promise<void> {
  await runExclusiveRefundMutation(() =>
    apiFetch<unknown>(
      `/admin/finance/refunds/${encodeURIComponent(refundId)}/approve`,
      { method: "POST" },
    ),
  );
}

// POST /admin/finance/refunds/{id}/reject — super admin only (canReject gate).
// WARNING: rejecting notifies the rider that the request was not approved
// (generic push — the rider never sees the reason). The reason itself is
// INTERNAL: admin drawer only, never lists or exports.
export async function rejectRefund(
  refundId: string,
  reason: string,
): Promise<void> {
  const trimmed = reason.trim();
  if (!trimmed) {
    throw new Error("A reason is required to reject a refund.");
  }
  const body: FinanceRejectRefundBody = { reason: trimmed };
  await runExclusiveRefundMutation(() =>
    apiFetch<unknown>(
      `/admin/finance/refunds/${encodeURIComponent(refundId)}/reject`,
      { method: "POST", body: JSON.stringify(body) },
    ),
  );
}

// ---------------------------------------------------------------------------
// Driver settlements — fetchers
// ---------------------------------------------------------------------------

export interface FinanceSettlementsStatsQuery {
  // Optional window override; the design keeps the endpoint's default (last
  // 30 days), so the view never sends these today. ISO datetimes and
  // date-only strings are accepted (probed); the response echoes the
  // effective window via range.
  from?: string;
  to?: string;
}

// GET /admin/finance/settlements/stats — bare object (probed 200), defaults
// to the last 30 days. netPayable excludes failed/rejected/cancelled
// settlements.
export async function fetchSettlementsStats(
  query: FinanceSettlementsStatsQuery = {},
  signal?: AbortSignal,
): Promise<FinanceSettlementsStatsResponse> {
  const params = new URLSearchParams();
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<FinanceSettlementsStatsResponse>(
    `/admin/finance/settlements/stats${suffix}`,
    { signal },
  );
}

export interface FinanceSettlementsQuery {
  page: number;
  limit: number;
  // Search matches the driver name/phone or the STL- reference.
  search?: string;
  // Validated server-side (probed 400 on an unknown value; the message
  // enumerates pending_approval, processing, paid, failed, flagged, rejected,
  // cancelled — exactly seven display statuses).
  status?: string;
  // from/to (settlement period) are accepted by the endpoint (probed 200) but
  // the design has no window control, so they are never sent.
}

// GET /admin/finance/settlements — confirmed envelope { data, meta }. A
// response without a data array means the shape changed: fail loudly instead
// of rendering a fabricated empty list.
export async function fetchSettlementsPage(
  query: FinanceSettlementsQuery,
  signal?: AbortSignal,
): Promise<FinanceListResponse<FinanceSettlementListItem>> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  // User input: trim so whitespace-only search never becomes a query param.
  const search = query.search?.trim();
  if (search) params.set("search", search);
  if (query.status) params.set("status", query.status);
  const response = await apiFetch<
    FinanceListResponse<FinanceSettlementListItem>
  >(`/admin/finance/settlements?${params.toString()}`, { signal });
  if (
    !response ||
    typeof response !== "object" ||
    !Array.isArray(response.data)
  ) {
    throw new Error("Unexpected settlements response shape.");
  }
  return response;
}

// GET /admin/finance/settlements/{id} — drawer detail. UNOBSERVED (the live
// list is empty; the route exists and 404s "Settlement not found" for an
// unknown id): the mapper must survive any real shape and render "—" for
// whatever is missing.
export async function fetchSettlementDetail(
  settlementId: string,
  signal?: AbortSignal,
): Promise<FinanceSettlementDetail> {
  return apiFetch<FinanceSettlementDetail>(
    `/admin/finance/settlements/${encodeURIComponent(settlementId)}`,
    { signal },
  );
}

// GET /admin/finance/settlements/{id}/timeline — drawer Timeline tab, oldest
// first. UNOBSERVED (no rows exist).
export async function fetchSettlementTimeline(
  settlementId: string,
  signal?: AbortSignal,
): Promise<FinanceTimelineEvent[]> {
  return apiFetch<FinanceTimelineEvent[]>(
    `/admin/finance/settlements/${encodeURIComponent(settlementId)}/timeline`,
    { signal },
  );
}

// ---------------------------------------------------------------------------
// Settlements — display helpers (raw backend vocabulary -> design words)
// ---------------------------------------------------------------------------

// Raw settlement status -> chip label + tone. Validated backend values (the
// probed 400 enumerates exactly these): pending_approval | processing | paid
// | failed | flagged | rejected | cancelled. rejected/cancelled are final
// admin-closed states: neutral chips, and the cancelled label says the driver
// cancelled. Unknown values fall back to a humanised label on a
// neutral chip.
const SETTLEMENT_STATUS_DISPLAY: Record<
  string,
  { label: string; tone: StatusTone }
> = {
  pending_approval: { label: "Pending approval", tone: "warning" },
  processing: { label: "Processing", tone: "info" },
  paid: { label: "Paid", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  flagged: { label: "Flagged", tone: "danger" },
  rejected: { label: "Rejected", tone: "neutral" },
  cancelled: { label: "Cancelled by driver", tone: "neutral" },
};

export function settlementStatusDisplay(
  status: string | null | undefined,
): { label: string; tone: StatusTone } {
  const key = typeof status === "string" ? status.trim().toLowerCase() : "";
  return (
    SETTLEMENT_STATUS_DISPLAY[key] ?? {
      label: humanize(status),
      tone: "neutral",
    }
  );
}

// Reference banner tone for the settlement drawer (no neutral option): paid
// green, everything in-flight amber, failed red, closed states amber — a
// cautious default, never the riskiest one.
function settlementBannerTone(
  status: string,
): "success" | "warning" | "danger" {
  const key = status.trim().toLowerCase();
  if (key === "paid") return "success";
  if (key === "failed") return "danger";
  return "warning";
}

// Toolbar options: labels -> confirmed raw query-param values. "All" sends no
// param. The seven statuses are the endpoint's validated enum (probed 400 on
// an unknown value); flagged/rejected/cancelled have no tab of their own and
// are reachable here or under All.
export const SETTLEMENT_STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All statuses", value: "all" },
  { label: "Pending approval", value: "pending_approval" },
  { label: "Processing", value: "processing" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
  { label: "Flagged", value: "flagged" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
];

// Period bounds arrive in two shapes. A DATE-ONLY string is a calendar date,
// not an instant: rendering it through new Date() + toLocaleDateString drifts
// a day across timezones (UTC midnight in a negative offset), so its parts are
// rendered as a local calendar date instead — stable in every timezone. A
// FULL instant is a real point in time, so it is rendered on the Lagos
// calendar (UTC+1, no DST): an end-of-day 23:59:59Z bound belongs to the NEXT
// Lagos day and must show it. Anything else falls back to formatDateLabel.
const PERIOD_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
// A full instant carries its own UTC/offset designator; a datetime without one
// is not a point in time, so it is left to formatDateLabel instead of being
// read as if it were Lagos or UTC.
const PERIOD_INSTANT =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/;
const LAGOS_DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Lagos",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatPeriodDate(value: string | null | undefined): string {
  if (!value) return EM_DASH;
  const trimmed = value.trim();
  const dateOnly = PERIOD_DATE_ONLY.exec(trimmed);
  if (dateOnly) {
    const date = new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
    );
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  }
  if (PERIOD_INSTANT.test(trimmed)) {
    const instant = new Date(trimmed);
    if (!Number.isNaN(instant.getTime())) {
      return LAGOS_DATE_FORMAT.format(instant);
    }
  }
  return formatDateLabel(value);
}

// "03 Nov 2026 – 09 Nov 2026" style period label from the period endpoints.
// A withdrawal request's period start and end are the request time,
// so equal bounds render a single label; one missing bound renders the
// other; none renders "—".
export function settlementPeriodLabel(
  period: FinanceSettlementPeriod | null | undefined,
): string {
  const start = formatPeriodDate(period?.start ?? null);
  const end = formatPeriodDate(period?.end ?? null);
  if (start !== EM_DASH && end !== EM_DASH) {
    return start === end ? start : `${start} – ${end}`;
  }
  return start !== EM_DASH ? start : end;
}

// ---------------------------------------------------------------------------
// Settlements stats — GET /settlements/stats -> the four header cards
// ---------------------------------------------------------------------------

function countUnitNote(
  value: number | null | undefined,
  singular: string,
  plural: string,
): string | null {
  const count = asNumber(value);
  if (count === null) return null;
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

// null response (not loaded or failed) keeps every value "—" so the cards
// never fabricate zeros; a loaded response shows the endpoint's true zeros
// (the probed stats are all 0 today — "₦0 / 0 drivers" is the real state).
// The design's four cards map onto netPayable and the three per-status
// metrics: Pending Approval counts drivers, Processing/Failed count payouts.
export function mapSettlementStats(
  response: FinanceSettlementsStatsResponse | null | undefined,
): FinanceOverviewCard[] {
  if (!response || typeof response !== "object") {
    return [
      "Net Payable",
      "Pending Approval",
      "Processing",
      "Failed Payouts",
    ].map((label) => ({
      label,
      value: EM_DASH,
      note: null,
      noteTone: "muted" as const,
    }));
  }
  return [
    {
      label: "Net Payable",
      value: compactNairaLabel(asNumber(response.netPayable?.amount)),
      note: "Pending, flagged, processing and paid",
      noteTone: "muted",
    },
    {
      label: "Pending Approval",
      value: compactNairaLabel(asNumber(response.pendingApproval?.amount)),
      note: countUnitNote(
        response.pendingApproval?.driverCount,
        "driver",
        "drivers",
      ),
      noteTone: "muted",
    },
    {
      label: "Processing",
      value: compactNairaLabel(asNumber(response.processing?.amount)),
      note: countUnitNote(response.processing?.count, "payout", "payouts"),
      noteTone: "muted",
    },
    {
      label: "Failed Payouts",
      value: compactNairaLabel(asNumber(response.failed?.amount)),
      note: countUnitNote(response.failed?.count, "payout", "payouts"),
      noteTone: "muted",
    },
  ];
}

// ---------------------------------------------------------------------------
// Settlements list — GET /settlements -> table rows
// ---------------------------------------------------------------------------

// UI row for the Driver Settlements table. Only display fields survive: the
// driver's id never reaches component state (ids/phones/emails are stripped
// here, asserted by the fixture harness), and the account number is rendered
// exactly as the backend masked it — never unmasked or re-masked.
export interface FinanceSettlementRow {
  id: string; // UUID string — drawer fetch key
  reference: string; // STL-… display id
  driver: Person;
  bank: string; // bank name ("—" when the row has no payout account)
  accountMasked: string; // backend-masked value, shown as-is
  amount: number | null; // naira (net payable)
  period: string; // "start – end" label
  status: string; // raw backend value
  createdAt: string | null; // ISO 8601 UTC
  dateLabel: string;
}

export function mapSettlementListItem(
  item: FinanceSettlementListItem,
): FinanceSettlementRow {
  return {
    id: asString(item.id) || EM_DASH,
    reference: asString(item.reference) || EM_DASH,
    driver: makePerson(item.driver?.name),
    bank: asString(item.bank?.name) || EM_DASH,
    accountMasked: asString(item.bank?.accountNumber) || EM_DASH,
    amount: asNumber(item.amount),
    period: settlementPeriodLabel(item.period),
    status: asString(item.status),
    createdAt: asStringOrNull(item.createdAt),
    dateLabel: formatDateLabel(item.createdAt),
  };
}

// ---------------------------------------------------------------------------
// Settlement drawer model — detail + timeline -> EntityDetailsModel
// ---------------------------------------------------------------------------

// Everything the drawer renders, normalised from either the list row
// (provisional model while the detail loads) or the live detail + timeline.
// driverId is deliberately absent: the drawer never renders it. accountName
// is copied for the payout card only. No gateway/provider reference is
// copied either.
export interface SettlementModelSource {
  id: string; // UUID string
  reference: string; // STL-…
  driverName: string;
  bank: string;
  accountMasked: string; // masked as received ("—" when missing)
  accountName: string; // payout card holder ("" when missing)
  amount: number | null; // naira (net payable)
  gross: number | null; // naira
  commission: number | null; // naira
  adjustments: number | null; // naira
  netPayable: number | null; // naira — the backend's own total, never recomputed
  period: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  payoutStatus: string | null; // latest attempt (retry creates a new one)
  payoutReference: string | null;
  payoutFailure: string | null;
  canApprove: boolean;
  canFlag: boolean;
  canUnflag: boolean;
  canRetry: boolean;
  canReject: boolean;
  timeline: { title: string; time: string }[];
}

export function settlementSourceFromRow(
  row: FinanceSettlementRow,
): SettlementModelSource {
  return {
    id: row.id,
    reference: row.reference,
    driverName: row.driver.name,
    bank: row.bank,
    accountMasked: row.accountMasked,
    accountName: "",
    amount: row.amount,
    gross: null,
    commission: null,
    adjustments: null,
    netPayable: row.amount,
    period: row.period,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: null,
    payoutStatus: null,
    payoutReference: null,
    payoutFailure: null,
    canApprove: false,
    canFlag: false,
    canUnflag: false,
    canRetry: false,
    canReject: false,
    timeline: [],
  };
}

export function settlementSourceFromDetail(
  detail: FinanceSettlementDetail,
  timeline: FinanceTimelineEvent[] | null | undefined,
): SettlementModelSource {
  return {
    id: asString(detail.id),
    reference: asString(detail.reference) || EM_DASH,
    driverName: asString(detail.driver?.name),
    bank: asString(detail.bank?.name) || asString(detail.payoutAccount?.bank),
    accountMasked:
      asString(detail.bank?.accountNumber) ||
      asString(detail.payoutAccount?.accountNumber),
    accountName: asString(detail.payoutAccount?.accountName),
    amount: asNumber(detail.amount),
    gross: asNumber(detail.earnings?.grossEarnings),
    commission: asNumber(detail.earnings?.commission),
    adjustments: asNumber(detail.earnings?.adjustments),
    // The backend's own net — the UI never recomputes it from the parts.
    netPayable:
      asNumber(detail.earnings?.netPayable) ?? asNumber(detail.amount),
    period: settlementPeriodLabel(detail.period),
    status: asString(detail.status),
    createdAt: asStringOrNull(detail.createdAt),
    updatedAt: asStringOrNull(detail.updatedAt),
    payoutStatus: asStringOrNull(detail.payout?.status),
    payoutReference: asStringOrNull(detail.payout?.reference),
    payoutFailure: asStringOrNull(detail.payout?.failureReason),
    canApprove: detail.actions?.canApprove === true,
    canFlag: detail.actions?.canFlag === true,
    canUnflag: detail.actions?.canUnflag === true,
    canRetry: detail.actions?.canRetry === true,
    canReject: detail.actions?.canReject === true,
    timeline: mapTimelineEvents(timeline),
  };
}

// Signed naira cell: null renders "—", 0 stays "₦0" (formatSignedNaira).
function signedNairaLabel(value: number | null | undefined): string {
  return value === null || value === undefined
    ? EM_DASH
    : formatSignedNaira(value);
}

// Builds the drawer model. Rules applied here:
//   - the banner shows the settlement's own STL reference;
//   - the payout card shows the default verified payout account; accountName
//     is the holder (the driver's name is only the fallback when the backend
//     omits it, mirroring the design's mock);
//   - the earnings breakdown renders each side from the backend's own fields
//     (gross − commission + adjustments = net is the backend's identity to
//     keep, not one the UI recomputes);
//   - action buttons render ONLY from the detail's can* flags and all stay
//     disabled — the mutations are later finance tasks. Approving starts the
//     gateway payout (funds lock at that moment) and rejecting/flagging push
//     or notify the driver, so all of them need confirm dialogs then
//     (may notify people/devices — noted on each action);
//   - Notes stays an unavailable placeholder (GET/POST /notes is a later
//     task); History keeps the design's empty placeholder (the timeline
//     endpoint already merges system events with admin actions).
export function buildSettlementDetailModel(
  source: SettlementModelSource,
): EntityDetailsModel {
  const status = settlementStatusDisplay(source.status);
  const timelineSection: DetailSection = source.timeline.length
    ? { kind: "timeline", title: "Settlement timeline", steps: source.timeline }
    : {
        kind: "empty",
        title: "Settlement timeline",
        message: "No recorded activity yet.",
      };

  const infoItems: DetailItem[] = [
    { label: "Settlement ID", value: source.reference },
    { label: "Driver", value: source.driverName || EM_DASH },
    { label: "Bank", value: source.bank },
    { label: "Account number", value: source.accountMasked },
    { label: "Amount", value: nairaLabel(source.amount) },
    { label: "Period", value: source.period },
    {
      label: "Status",
      value: null,
      pill: { tone: status.tone, label: status.label },
    },
    {
      label: "Payout attempt",
      value: source.payoutStatus ? humanize(source.payoutStatus) : EM_DASH,
    },
    { label: "Payout reference", value: source.payoutReference || EM_DASH },
    { label: "Payout failure", value: source.payoutFailure || EM_DASH },
    { label: "Created", value: formatDateTimeLabel(source.createdAt) },
    {
      label: "Last updated",
      value: source.updatedAt ? formatDateTimeLabel(source.updatedAt) : EM_DASH,
    },
  ];

  // Every settlement action may move real money or notify the driver:
  // approve locks the funds and starts the bank transfer (REAL money), retry
  // starts a brand new payout attempt (REAL money), reject is FINAL — it
  // frees the reserved balance and pushes "Withdrawal not approved" — and
  // flag/unflag drive the investigation flow. All render only from the
  // detail's can* flags and are wired.
  const actions: DetailAction[] = [];
  if (source.canApprove) {
    // WARNING: approving moves REAL money — it locks the driver's funds and
    // starts the bank transfer to their default verified payout account.
    // The dialog must show what it is about to move, so the
    // action fails CLOSED when the amount or the masked payout account
    // cannot be read ("Details could not be read").
    const detailsUnreadable = settlementPayoutDetailsUnreadable(source);
    actions.push({
      id: "approve-payout",
      label: "Approve payout",
      variant: "brand",
      dialogTitle: "Confirm approve payout",
      confirmTone: "brand",
      disabled: detailsUnreadable,
      disabledReason: detailsUnreadable
        ? "Details could not be read"
        : undefined,
    });
  }
  if (source.canFlag) {
    actions.push({
      id: "flag-settlement",
      label: "Flag for investigation",
      variant: "danger",
      dialogTitle: "Confirm flag for investigation",
      confirmTone: "danger",
      // The flag reason is REQUIRED (POST body { reason }) and
      // internal — admin drawer only, never lists or exports.
      noteLabel: "Reason",
      noteRequired: true,
      notePlaceholder: "Why does this settlement need investigation?",
    });
  }

  if (source.canUnflag) {
    actions.push({
      id: "unflag-settlement",
      label: "Unflag",
      variant: "outline",
      dialogTitle: "Confirm unflag",
      // No request body and no documented dialog copy: the drawer
      // shell's generic confirmation line is used. Unflag returns a flagged
      // request to pending_approval.
    });
  }
  if (source.canRetry) {
    // WARNING: retrying moves REAL money — it starts a brand new payout
    // attempt for the settlement's amount. Same fail-closed
    // unreadable-details guard as approve.
    const detailsUnreadable = settlementPayoutDetailsUnreadable(source);
    actions.push({
      id: "retry-payout",
      label: "Retry payout",
      variant: "outline",
      dialogTitle: "Confirm retry payout",
      disabled: detailsUnreadable,
      disabledReason: detailsUnreadable
        ? "Details could not be read"
        : undefined,
    });
  }
  if (source.canReject) {
    actions.push({
      id: "reject-settlement",
      label: "Reject settlement",
      variant: "danger",
      dialogTitle: "Confirm reject settlement",
      confirmTone: "danger",
      // WARNING: rejecting is FINAL — it frees the driver's reserved balance
      // and sends the driver a "Withdrawal not approved" push. The reason is
      // REQUIRED ({ reason }, max 1000 chars) and INTERNAL: admin drawer
      // only, never lists or exports, and never shown to the driver.
      noteLabel: "Reason",
      noteRequired: true,
      notePlaceholder: "Why is this payout being rejected?",
    });
  }

  return {
    entity: "settlement",
    id: source.id,
    eyebrow: "SETTLEMENT DETAILS",
    title: source.driverName || EM_DASH,
    subtitle: source.createdAt
      ? `${source.reference} • Created ${formatDateLabel(source.createdAt)}`
      : source.reference,
    tabs: [
      {
        id: "overview",
        label: "Overview",
        sections: [
          {
            kind: "reference",
            label: "Settlement reference",
            value: source.reference,
            pill: { tone: status.tone, label: status.label },
            tone: settlementBannerTone(source.status),
          },
          {
            kind: "payout",
            caption: "PAYOUT ACCOUNT",
            bank: source.bank,
            accountNumber: source.accountMasked,
            holder: source.accountName || source.driverName || EM_DASH,
          },
          {
            kind: "breakdown",
            title: "Earnings breakdown",
            rows: [
              { label: "Gross ride earnings", value: nairaLabel(source.gross) },
              {
                label: "Commission",
                value: signedNairaLabel(
                  source.commission === null ? null : -source.commission,
                ),
              },
              {
                label: "Adjustments",
                value: signedNairaLabel(source.adjustments),
              },
            ],
            total: {
              label: "Net payable",
              value: nairaLabel(source.netPayable),
            },
          },
          { kind: "info", title: "Settlement information", items: infoItems },
          timelineSection,
        ],
      },
      {
        id: "timeline",
        label: "Timeline",
        sections: [timelineSection],
      },
      {
        id: "history",
        label: "History",
        sections: [
          {
            kind: "empty",
            title: "History",
            message: "No earlier activity for this settlement.",
          },
        ],
      },
      {
        id: "notes",
        label: "Notes",
        // Live notes tab: FinanceDrawerShell renders the
        // FinanceNotesTab panel for this tab id (GET/POST
        // /admin/finance/notes), so the model carries no sections of its own.
        sections: [],
      },
    ],
    actions,
  };
}


// ---------------------------------------------------------------------------
// Settlement mutations — POST /admin/finance/settlements/{id}/
// approve | retry | flag | unflag | reject
// ---------------------------------------------------------------------------

// Confirm-dialog copy — nothing more is claimed. Keyed by the footer action
// id; unflag has no documented copy and falls back to the drawer shell's
// generic line.
export const SETTLEMENT_ACTION_DESCRIPTIONS: Record<string, string> = {
  "approve-payout":
    "Locks the driver's funds and starts the bank transfer to their default verified payout account.",
  "retry-payout": "Starts a new payout attempt.",
  "flag-settlement": "Marks the request for investigation.",
  "reject-settlement":
    "Final. Frees the driver's reserved balance and sends the driver a 'Withdrawal not approved' push. The reason is internal.",
};

// The reject reason is required and capped at 1000 characters.
export const SETTLEMENT_REJECT_REASON_MAX = 1000;

// The Approve/Retry dialogs must show the amount (naira), the driver's masked
// payout account and the settlement reference. When the amount or the masked
// account cannot be read the action fails CLOSED: the button disables with
// "Details could not be read" and no dialog can confirm an unknown transfer.
export function settlementPayoutDetailsUnreadable(
  source: Pick<SettlementModelSource, "amount" | "accountMasked">,
): boolean {
  return (
    isUnreadableAmount(source.amount) ||
    !source.accountMasked ||
    source.accountMasked === EM_DASH
  );
}

// Module-level double-submit lock across ALL settlement mutations (same shape
// as the refund lock): the confirm buttons already disable while loading, but
// a second request must never go out even if two drawers race. One settlement
// action in flight at a time; the lock is released when the action settles
// (success or failure).
let settlementMutationInFlight = false;

async function runExclusiveSettlementMutation<T>(
  run: () => Promise<T>,
): Promise<T> {
  if (settlementMutationInFlight) {
    throw new Error("A settlement action is already in progress.");
  }
  settlementMutationInFlight = true;
  try {
    return await run();
  } finally {
    settlementMutationInFlight = false;
  }
}

// AMBIGUOUS FAILURE GATE for Approve and Retry (they may move REAL money): a
// network error, a timeout or a 5xx leaves the outcome UNKNOWN — the payout
// may or may not have started. A 4xx answer is definitive (the backend
// responded and the settlement returns to where it was), so it is not
// ambiguous.
export function isAmbiguousSettlementFailure(cause: unknown): boolean {
  if (cause instanceof ApiError) {
    return cause.status === 408 || cause.status >= 500;
  }
  // apiFetch turns a failed fetch (TypeError) into this exact network-error
  // message; that transport failure also leaves the outcome unknown.
  return cause instanceof Error && cause.message === NETWORK_ERROR_MESSAGE;
}

// Approve/Retry 400, 403 and 409 answers are definitive: the backend
// responded and the settlement was NOT updated (400: no verified payout
// account or insufficient balance; 403: the role may not move payouts; 409:
// someone else acted first). The drawer closes the confirm dialog, toasts the
// backend's message and reloads — the same shape as the reject 409. A 408,
// 5xx or transport failure has no answer, so isAmbiguousSettlementFailure
// still owns it and no second attempt may go out before the refetch.
export function settlementNotUpdatedFailure(
  cause: unknown,
  actionId: string,
): boolean {
  if (actionId !== "approve-payout" && actionId !== "retry-payout") {
    return false;
  }
  if (!(cause instanceof ApiError)) return false;
  return cause.status === 400 || cause.status === 403 || cause.status === 409;
}

// Which raw status still allows a money-moving action after an ambiguous
// failure: approve only from pending_approval, retry only from
// failed. The gate compares the REFETCHED detail's status against this.
export function settlementStatusAllowsAction(
  status: string | null | undefined,
  actionId: string,
): boolean {
  const key = typeof status === "string" ? status.trim().toLowerCase() : "";
  if (actionId === "approve-payout") return key === "pending_approval";
  if (actionId === "retry-payout") return key === "failed";
  return false;
}

// The dialog message while the gate holds: the last attempt's outcome is
// unknown and the refetched details have not arrived yet, so a second attempt
// must not go out.
export const SETTLEMENT_AMBIGUOUS_GATE_MESSAGE =
  "The previous attempt's outcome is unknown. Wait for the details to refresh and check the settlement's current status before trying again.";

// The gate's second half: the detail WAS refetched but no longer shows a
// status where the action is allowed — show the real status and stop.
export function settlementStatusChangedMessage(
  status: string | null | undefined,
): string {
  const label = settlementStatusDisplay(status).label;
  return `The settlement is now ${label} — the earlier attempt's outcome is visible in the refreshed details. This action is no longer available.`;
}

// The gate state kept by the settlement drawer: which action failed
// ambiguously on WHICH settlement and which source object was showing when it
// did. A refetch swaps in a NEW source object, which is what lifts the gate.
// The gate is scoped to the settlement's id: an unknown attempt on one
// settlement never blocks another settlement, and it survives closing and
// reopening the same settlement (the fresh fetch resolves it by status).
export interface SettlementAmbiguousGate {
  actionId: string;
  settlementId: string; // the gate only ever applies to this settlement
  sourceAtFailure: SettlementModelSource;
}

// Evaluated by the drawer before any Approve/Retry: returns the reason a
// second attempt must not go out, or null when it may proceed (the caller
// then clears the gate). "No request without a confirmed action" and "no
// request when an action flag is false" stay the drawer's job; this only
// blocks the repeat of an UNKNOWN attempt.
export function settlementAmbiguousBlockReason(
  gate: SettlementAmbiguousGate | null | undefined,
  actionId: string,
  source: SettlementModelSource | null | undefined,
): string | null {
  if (!gate || gate.actionId !== actionId) return null;
  // Scoped to one settlement: a different id (another record, or a drawer
  // opened for another row) is never blocked by an earlier unknown attempt.
  if (source && source.id !== gate.settlementId) return null;
  if (!source || source === gate.sourceAtFailure) {
    // Same source object: the detail has not been refetched yet.
    return SETTLEMENT_AMBIGUOUS_GATE_MESSAGE;
  }
  if (settlementStatusAllowsAction(source.status, actionId)) {
    // Refetched and still allowed: the gate lifts.
    return null;
  }
  return settlementStatusChangedMessage(source.status);
}

// The five settlement actions. Responses were never observed (the live list
// is empty): typed unknown, never trusted — the drawer refetches list + stats
// + detail + timeline after every confirmed action instead of using any
// response body.

// POST /admin/finance/settlements/{id}/approve — WARNING: may move REAL money.
// It locks the driver's funds and starts the bank transfer to their default
// verified payout account. No request body. 400 with a readable
// message when the driver has no verified payout account or an insufficient
// balance — the settlement returns to where it was.
export async function approveSettlement(settlementId: string): Promise<void> {
  if (!settlementId) {
    // Fail before any request goes out rather than posting to a bogus URL.
    throw new Error("A settlement id is required to approve a payout.");
  }
  await runExclusiveSettlementMutation(() =>
    apiFetch<unknown>(
      `/admin/finance/settlements/${encodeURIComponent(settlementId)}/approve`,
      { method: "POST" },
    ),
  );
}

// POST /admin/finance/settlements/{id}/retry — WARNING: may move REAL money.
// It starts a brand new payout attempt (the drawer's payout object then shows
// the latest attempt: status, reference, failureReason). No request body;
// 400 is handled exactly like approve's.
export async function retrySettlement(settlementId: string): Promise<void> {
  if (!settlementId) {
    throw new Error("A settlement id is required to retry a payout.");
  }
  await runExclusiveSettlementMutation(() =>
    apiFetch<unknown>(
      `/admin/finance/settlements/${encodeURIComponent(settlementId)}/retry`,
      { method: "POST" },
    ),
  );
}

// POST /admin/finance/settlements/{id}/flag — body { reason } (required;
// only pending or failed settlements can be flagged — the detail's
// canFlag decides the button, the backend validates the status). The reason
// is INTERNAL: admin drawer only, never lists or exports.
export async function flagSettlement(
  settlementId: string,
  reason: string,
): Promise<void> {
  if (!settlementId) {
    throw new Error("A settlement id is required to flag a settlement.");
  }
  const trimmed = reason.trim();
  if (!trimmed) {
    throw new Error("A reason is required to flag a settlement.");
  }
  const body: FinanceSettlementReasonBody = { reason: trimmed };
  await runExclusiveSettlementMutation(() =>
    apiFetch<unknown>(
      `/admin/finance/settlements/${encodeURIComponent(settlementId)}/flag`,
      { method: "POST", body: JSON.stringify(body) },
    ),
  );
}

// POST /admin/finance/settlements/{id}/unflag — no request body; returns a
// flagged request to pending_approval.
export async function unflagSettlement(settlementId: string): Promise<void> {
  if (!settlementId) {
    throw new Error("A settlement id is required to unflag a settlement.");
  }
  await runExclusiveSettlementMutation(() =>
    apiFetch<unknown>(
      `/admin/finance/settlements/${encodeURIComponent(settlementId)}/unflag`,
      { method: "POST" },
    ),
  );
}

// POST /admin/finance/settlements/{id}/reject — WARNING: rejecting is FINAL.
// It frees the driver's reserved balance and sends the driver a "Withdrawal
// not approved" push. Body { reason } — required, max 1000 characters, and
// INTERNAL (it shows as "Payout rejected: …" in the admin timeline/Notes but
// is never shown to the driver). 409 means someone else acted first: the
// caller shows the backend's message and reloads.
export async function rejectSettlement(
  settlementId: string,
  reason: string,
): Promise<void> {
  if (!settlementId) {
    throw new Error("A settlement id is required to reject a settlement.");
  }
  const trimmed = reason.trim();
  if (!trimmed) {
    throw new Error("A reason is required to reject a settlement.");
  }
  if (trimmed.length > SETTLEMENT_REJECT_REASON_MAX) {
    // Fail BEFORE any request: the backend caps the reason at 1000 chars.
    throw new Error(
      `Keep the reason to ${SETTLEMENT_REJECT_REASON_MAX} characters or fewer.`,
    );
  }
  const body: FinanceSettlementReasonBody = { reason: trimmed };
  await runExclusiveSettlementMutation(() =>
    apiFetch<unknown>(
      `/admin/finance/settlements/${encodeURIComponent(settlementId)}/reject`,
      { method: "POST", body: JSON.stringify(body) },
    ),
  );
}

// ---------------------------------------------------------------------------
// Notes — GET/POST /admin/finance/notes
// ---------------------------------------------------------------------------

// The drawer subject notes attach to: a transaction's payment, a settlement
// or a refund.
export type FinanceNoteSubjectType = "payment" | "settlement" | "refund";

export interface FinanceNotesQuery {
  subjectType: FinanceNoteSubjectType;
  subjectId: string;
}

export interface FinanceNotesPage {
  items: FinanceNoteItem[];
}

// The Notes tab's UI model. Note text lives ONLY here (this tab) and in the
// POST body — never in list rows, CSVs, toasts or logs (asserted by the
// fixture harness). The item shape was never observed (the 2026-11-17 probes
// returned 200 with an empty body for all three subjectTypes), so id/body/
// createdAt are read defensively and a missing time renders "—".
export interface FinanceNoteItem {
  id: string;
  body: string;
  createdAtLabel: string;
}

// Envelope resolution for GET /admin/finance/notes: null/undefined (the
// observed empty 200 body) is an EMPTY note list — a true zero, not a shape
// failure. A bare array or the finance list's { data } envelope is mapped
// item by item; any other shape fails loudly instead of fabricating a list.
function notesRowsOf(data: unknown): unknown[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (
    typeof data === "object" &&
    Array.isArray((data as { data?: unknown }).data)
  ) {
    return (data as { data: unknown[] }).data;
  }
  throw new Error("Unexpected notes response shape.");
}

// Notes without text are not notes: rows without a body are dropped instead
// of rendering an empty bubble.
function mapFinanceNoteItem(row: unknown): FinanceNoteItem | null {
  if (typeof row !== "object" || row === null) return null;
  const record = row as { id?: unknown; body?: unknown; createdAt?: unknown };
  const body = asString(record.body);
  if (!body) return null;
  return {
    id: asString(record.id),
    body,
    createdAtLabel: formatDateTimeLabel(asStringOrNull(record.createdAt)),
  };
}

// GET /admin/finance/notes?subjectType=…&subjectId=… — the drawer's Notes tab.
export async function fetchFinanceNotes(
  query: FinanceNotesQuery,
  signal?: AbortSignal,
): Promise<FinanceNotesPage> {
  const params = new URLSearchParams({
    subjectType: query.subjectType,
    subjectId: query.subjectId,
  });
  const data = await apiFetch<unknown>(
    `/admin/finance/notes?${params.toString()}`,
    { signal },
  );
  const items: FinanceNoteItem[] = [];
  for (const row of notesRowsOf(data)) {
    const item = mapFinanceNoteItem(row);
    if (item) items.push(item);
  }
  return { items };
}

// A note is capped at 2000 characters and may not be blank. The
// rule lives here so the composer disables its button with the same message
// and the mutator refuses to fetch (canaried: blank and over-2000 notes send
// nothing).
export const FINANCE_NOTE_MAX = 2000;

export const FINANCE_NOTE_REQUIRED_MESSAGE = "Write a note before adding it.";
export const FINANCE_NOTE_TOO_LONG_MESSAGE = `Notes are limited to ${FINANCE_NOTE_MAX} characters.`;

// Returns the composer's validation message, or null when the draft may be
// sent. The blank check trims; the 2000-character cap counts the trimmed
// value that would actually be sent.
export function financeNoteDraftError(body: string): string | null {
  const trimmed = body.trim();
  if (!trimmed) return FINANCE_NOTE_REQUIRED_MESSAGE;
  if (trimmed.length > FINANCE_NOTE_MAX) return FINANCE_NOTE_TOO_LONG_MESSAGE;
  return null;
}

// Module-level double-submit lock (the refund/settlement mutator pattern):
// while one note POST is in flight a second one is rejected without queueing
// a request. The Notes tab also disables its button while posting.
let notePostInFlight = false;

// POST /admin/finance/notes with { subjectType, subjectId, body }. The
// documented response is "the refreshed list", but its shape was never
// observed and is never trusted: the response is typed unknown and discarded,
// and the caller refetches the list with GET. The draft is validated BEFORE
// any request; the body is sent trimmed.
export async function createFinanceNote(input: {
  subjectType: FinanceNoteSubjectType;
  subjectId: string;
  body: string;
}): Promise<void> {
  const draftError = financeNoteDraftError(input.body);
  if (draftError) throw new Error(draftError);
  if (!input.subjectId) throw new Error("The record id is missing.");
  if (notePostInFlight) {
    throw new Error("A note is already being added. Please wait a moment.");
  }
  notePostInFlight = true;
  try {
    const body: FinanceNoteCreateBody = {
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      body: input.body.trim(),
    };
    // The response body is deliberately not read: typed unknown, discarded,
    // refetched with GET by the caller.
    await apiFetch<unknown>("/admin/finance/notes", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } finally {
    notePostInFlight = false;
  }
}

// ---------------------------------------------------------------------------
// CSV exports — GET /admin/finance/{transactions,refunds,
// settlements}/export. NEVER called from the terminal: the
// download runs in the browser through fetch with the session's bearer token
// (a plain <a href> link cannot carry it) and saves the blob directly.
// ---------------------------------------------------------------------------

// The same filters each list sends (fetchTransactionsPage/fetchRefundsPage/
// fetchSettlementsPage): search (trimmed so whitespace-only input never
// becomes a param), status and — where the list has one — method.
// page/limit are pagination, not filters: the export returns up to 50,000
// rows and is never paginated. from/to/sort have no on-screen control, so
// they are never sent here either — the file reflects exactly the filters
// shown on screen.
export interface FinanceTransactionsExportQuery {
  search?: string;
  status?: string;
  method?: string;
}

export interface FinanceRefundsExportQuery {
  search?: string;
  status?: string;
  method?: string;
}

export interface FinanceSettlementsExportQuery {
  search?: string;
  status?: string;
}

// Content-Disposition attachment filename; null when absent (mirrors
// lib/activity-logs.ts).
function exportFilename(disposition: string | null): string | null {
  const match = /filename="?([^";]+)"?/i.exec(disposition ?? "");
  return match ? match[1] : null;
}

// Concurrent 401s must trigger only one full-page redirect. The export path
// cannot go through apiFetch (it parses the body as JSON, which would consume
// the CSV), so it mirrors apiFetch's 401 handling — clearSession() and a
// guarded single navigation to /signin — with its own module flag.
let exportRedirecting = false;

// The shared download path: authenticated GET -> blob -> file save. Only the
// error path parses a body (the small JSON error object, for the backend
// message); the CSV body itself is never read, logged or stored beyond the
// file save. Returns the saved filename; throws the backend message (or the
// friendly network text) on failure.
async function downloadFinanceCsv(
  path: string,
  params: URLSearchParams,
  fallbackFilename: string,
): Promise<string> {
  const search = params.toString();
  const url = `${apiBaseUrl()}${path}${search ? `?${search}` : ""}`;

  const headers = new Headers();
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(url, { method: "GET", headers });
  } catch (cause) {
    if (cause instanceof TypeError) throw new Error(NETWORK_ERROR_MESSAGE);
    throw cause;
  }

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    if (response.status === 401) {
      clearSession();
      // Full-page navigation on 401, same as apiFetch (browser only; the
      // reload wipes expired in-memory state).
      if (typeof window !== "undefined" && !exportRedirecting) {
        exportRedirecting = true;
        window.location.assign(
          new URL("/signin", window.location.origin).href,
        );
      }
    }
    throw new ApiError(
      backendMessage(data) ??
        (response.status === 401
          ? "Your session has expired. Please sign in again."
          : "Request failed. Please try again."),
      response.status,
    );
  }

  // Success: the body goes straight into the file save — untouched,
  // unlogged, unread.
  const blob = await response.blob();
  const filename =
    exportFilename(response.headers.get("Content-Disposition")) ??
    fallbackFilename;
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
  return filename;
}

// GET /admin/finance/transactions/export — the Finance Overview's export.
export async function exportTransactionsCsv(
  query: FinanceTransactionsExportQuery,
): Promise<string> {
  const params = new URLSearchParams();
  const search = query.search?.trim();
  if (search) params.set("search", search);
  if (query.status) params.set("status", query.status);
  if (query.method) params.set("method", query.method);
  return downloadFinanceCsv(
    "/admin/finance/transactions/export",
    params,
    "transactions.csv",
  );
}

// GET /admin/finance/refunds/export — the Refunds view's export.
export async function exportRefundsCsv(
  query: FinanceRefundsExportQuery,
): Promise<string> {
  const params = new URLSearchParams();
  const search = query.search?.trim();
  if (search) params.set("search", search);
  if (query.status) params.set("status", query.status);
  if (query.method) params.set("method", query.method);
  return downloadFinanceCsv(
    "/admin/finance/refunds/export",
    params,
    "refunds.csv",
  );
}

// GET /admin/finance/settlements/export — the Driver Settlements view's
// export (the settlements list has no method filter).
export async function exportSettlementsCsv(
  query: FinanceSettlementsExportQuery,
): Promise<string> {
  const params = new URLSearchParams();
  const search = query.search?.trim();
  if (search) params.set("search", search);
  if (query.status) params.set("status", query.status);
  return downloadFinanceCsv(
    "/admin/finance/settlements/export",
    params,
    "settlements.csv",
  );
}

