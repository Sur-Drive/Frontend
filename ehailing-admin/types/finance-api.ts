// Finance (Overview & Transactions) backend shapes — observed live with GET
// requests on 2026-11-17; everything below was probed. Sample, not exhaustive:
// fields may be absent or null; every consumer reads defensively.
//
// Units (settled by probes, never assumed):
//   - ALL money fields are NAIRA doubles with fractional cents
//     (grossRideRevenue.amount 1756602.7 / 1199836.92) — never kobo.
//   - ratePercent / averageRatePercent / changePercent are percent 0-100 style
//     numbers (60.9 + 37 = 100 on a closed window; commission rate 0.1 = 0.1%,
//     NOT 0-1). changePercent is null when the previous equal-length window
//     has no baseline (observed on October and September windows).
//   - The commission rate is NOT constant (claimed 15%, older probes 20%):
//     observed 20% on a card payment and 0% on cash rows in the same list, and
//     the overview's averageRatePercent was 0.1% for October. It is always
//     rendered from the backend's own fields, never hardcoded.
// passenger carries {id,name} only — the mapping layer copies the name, so
// ids/phones/emails never reach component state (asserted by the harness).

// GET /admin/finance/overview — bare object, defaults to the last 30 days
// (range echoes the effective window; from/to accepted as ISO datetimes and
// date-only strings both).
export interface FinanceRange {
  from?: string | null;
  to?: string | null;
}

export interface FinanceAmountMetric {
  amount?: number | null;
  changePercent?: number | null;
}

export interface FinanceCommissionMetric {
  amount?: number | null;
  // Percent (0.1 observed for October) — never a 0-1 fraction.
  averageRatePercent?: number | null;
  changePercent?: number | null;
}

export interface FinanceCountMetric {
  count?: number | null;
  // Share of the window's payments, percent (successfulPayments.ratePercent
  // 60.9 + failedPayments.ratePercent 37 on the default window; 46.9 + 53.1
  // summed to exactly 100 on the closed October window).
  ratePercent?: number | null;
}

export interface FinanceRefundsMetric {
  amount?: number | null;
  count?: number | null;
}

export interface FinancePendingSettlementsMetric {
  amount?: number | null;
  driverCount?: number | null;
}

export interface FinanceOverviewResponse {
  range?: FinanceRange | null;
  grossRideRevenue?: FinanceAmountMetric | null;
  platformCommission?: FinanceCommissionMetric | null;
  driverEarnings?: FinanceAmountMetric | null;
  successfulPayments?: FinanceCountMetric | null;
  failedPayments?: FinanceCountMetric | null;
  refunds?: FinanceRefundsMetric | null;
  pendingSettlements?: FinancePendingSettlementsMetric | null;
}

// One row of GET /admin/finance/transactions. Observed statuses:
// successful | processing (also documented: pending | failed | refunded);
// observed method types: card | cash (also documented: wallet | bank_transfer
// | mobile_money | ussd). Unknown values render as neutral chips.
export interface FinanceTransactionMethod {
  type?: string | null;
  label?: string | null;
  // null in 5 of 5 observed rows — render the label alone when missing.
  cardLast4?: string | null;
}

// Personal data: id + name only were observed. If the backend ever adds
// phones/emails they must stay behind the mapping layer.
export interface FinanceTransactionParty {
  id?: string | null;
  name?: string | null;
}

export interface FinanceTransactionListItem {
  id?: string | null; // UUID string — drawer fetch key
  reference?: string | null; // short display id, e.g. TXN-…
  rideId?: string | null; // UUID string — "View ride" navigation
  rideReference?: string | null; // short display id, e.g. SD-…
  passenger?: FinanceTransactionParty | null;
  paymentMethod?: FinanceTransactionMethod | null;
  grossFare?: number | null; // naira
  commission?: number | null; // naira (varies by method/status — never derived)
  driverEarnings?: number | null; // naira
  currency?: string | null; // NGN observed
  status?: string | null;
  createdAt?: string | null; // ISO 8601 UTC
}

// Confirmed envelope for admin/finance lists: { data, meta } — NOT the
// { items, total, page, limit, totalPages } shape the ride-hailing lists use.
export interface FinanceListMeta {
  total?: number | null;
  page?: number | null;
  limit?: number | null;
  totalPages?: number | null;
}

export interface FinanceListResponse<T> {
  data?: T[] | null;
  meta?: FinanceListMeta | null;
}

// GET /admin/finance/transactions/{id} — list keys plus the payment-reference
// banner and refund-eligibility fields (observed 2026-11-17). paidAt was null
// on the observed processing row; timeline[] is embedded here too but the
// drawer reads the dedicated /timeline endpoint.
export interface FinanceTransactionDetail extends FinanceTransactionListItem {
  gatewayReference?: string | null; // the "Payment reference" banner value
  provider?: string | null;
  totalRefunded?: number | null; // naira (observed integer)
  refundableAmount?: number | null; // naira
  canRefund?: boolean | null; // false on the observed cash payment
  paidAt?: string | null;
  updatedAt?: string | null;
  timeline?: FinanceTimelineEvent[] | null;
}

// GET /admin/finance/transactions/{id}/timeline — { id, title, description, at }
// events, oldest first (observed: "Record created", then "Payment attempt via
// paystack").
export interface FinanceTimelineEvent {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  at?: string | null; // ISO 8601 UTC
}

// ---------------------------------------------------------------------------
// Refunds — GET /admin/finance/refunds*
//
// Probed 2026-11-17: the refunds LIST IS EMPTY on
// this backend — total 0 on the default window and under every tab status —
// so NO row, detail or timeline shape has ever been observed. Everything
// below is an unobserved shape (no evidence yet): fields are
// optional and typed tolerantly (the unobserved "fare split" stays `unknown`)
// and lib/finance.ts maps defensively so a real shape that differs degrades
// to "—" instead of lying or crashing.
//
// Units (settled by probes, never assumed):
//   - Money is naira. Every observed refund amount is
//     0 (no refunds yet); the overview's fractional-cent doubles
//     (grossRideRevenue.amount 1292244.09 for Nov 1-17) confirm naira, never
//     kobo.
//   - averageResolution.hours is a plain number of hours and changeMinutes a
//     signed number of minutes (design mock "3.4 hrs" /
//     "−18 min"). Both were 0/null on the empty backend — units could not be
//     confirmed against non-zero live data.
//   - Cross-check: stats.refunded {amount, count} == overview.refunds
//     {amount, count} for the same window (Nov 1-17: 0/0 == 0/0). OK.
// ---------------------------------------------------------------------------

// GET /admin/finance/refunds/stats — probed 200. Defaults to the current
// month; from/to are accepted and echoed back via range (probed).
export interface FinanceRefundsStatsResponse {
  range?: FinanceRange | null;
  refunded?: FinanceRefundsMetric | null;
  pendingReview?: FinanceRefundsMetric | null;
  processing?: FinanceRefundsMetric | null;
  averageResolution?: FinanceRefundsAverageResolution | null;
}

// averageResolution: hours is hours (design "3.4 hrs"); changeMinutes is the
// signed minute delta vs the previous equal-length window and is null without
// a baseline (observed) — the same nullability rule as the overview's
// changePercent.
export interface FinanceRefundsAverageResolution {
  hours?: number | null;
  changeMinutes?: number | null;
}

// One row of GET /admin/finance/refunds — UNOBSERVED (these
// keys have never been returned; the live list is empty). Unknown real
// values must survive the mapper: every consumer reads defensively.
export interface FinanceRefundListItem {
  id?: string | null; // uuid — drawer fetch key
  reference?: string | null; // RFD-… display id
  transactionReference?: string | null; // original payment TXN-…
  rideReference?: string | null; // SD-… display id
  rideId?: string | null; // unobserved — kept only for "View ride" navigation
  passenger?: FinanceTransactionParty | null; // id + name only; ids never render
  paymentMethod?: FinanceTransactionMethod | null;
  refundAmount?: number | null; // naira
  // "fare split of the original payment" — the backend names no
  // field, so it stays unknown and the mapper picks numbers tolerantly.
  fareSplit?: unknown;
  reason?: string | null; // why the refund was raised (rider/admin note)
  initiator?: unknown; // unobserved — mapped as display text only
  // Validated server-side (probed 400 on an unknown value):
  // pending | processing | refunded | rejected | failed.
  status?: string | null;
  createdAt?: string | null; // ISO 8601 UTC
}

// GET /admin/finance/refunds/{id} — UNOBSERVED, never seen (no rows exist
// to fetch). The detail carries canApprove/canReject (they gate the
// Approve/Reject buttons) and a reject reason that is INTERNAL: it may appear
// inside this admin drawer (timeline text) but never in lists or outside.
// No gateway/provider reference is typed on purpose: if the real detail
// carries one it must stay behind the mapping layer (asserted by the
// fixture harness).
export interface FinanceRefundDetail extends FinanceRefundListItem {
  canApprove?: boolean | null;
  canReject?: boolean | null;
  updatedAt?: string | null;
  timeline?: FinanceTimelineEvent[] | null; // embedded copy; drawer reads /timeline
}

// ---------------------------------------------------------------------------
// Refund mutations — bodies only,
// never sent from the terminal and never observed live, so the RESPONSES stay
// unknown and every caller refetches list + stats + detail instead of trusting
// them. Bodies only:
//   POST /admin/finance/refunds                  { paymentId, amount?, notes }
//     + a REQUIRED Idempotency-Key header (a UUID minted once per user action;
//     the same key is reused when retrying the same submit after an error).
//     amount is NAIRA and optional — omit it to refund everything refundable.
//   POST /admin/finance/refunds/{id}/approve     body none
//   POST /admin/finance/refunds/{id}/reject      { reason } (required,
//     internal — shown only inside the admin drawer, never in lists/exports)
// ---------------------------------------------------------------------------
export interface FinanceInitiateRefundBody {
  paymentId: string;
  amount?: number; // naira, optional — the key is omitted when refunding all
  notes: string;
}

export interface FinanceRejectRefundBody {
  reason: string;
}
// ---------------------------------------------------------------------------
// Driver settlements — probed 2026-11-17 via GET probes only.
// The LIST IS EMPTY on this backend (meta.total 0 on the default window, under
// all seven status filters, search and from/to), so NO row, detail or timeline
// shape has ever been observed: the row/detail keys below are unobserved and
// every consumer reads defensively ("—").
//
// Units (settled by probes, never assumed):
//   - Money is NAIRA (the overview's fractional-cent
//     doubles confirm it). Every observed settlement amount is 0 — nothing
//     contradicts that yet.
//   - stats.range is ISO 8601 UTC and the default window is the last 30 days
// (from = to − 30d, time-of-day preserved: 11:58:00 → 11:58:00 observed).
//   - Cross-check: stats.pendingApproval {amount, driverCount} ==
//     overview.pendingSettlements {amount, driverCount} on the identical
//     window (probed with the overview's own range: 0/0 == 0/0). Agreement.
//   - The earnings identity (gross − commission + adjustments = net) is
//     unobservable live with no rows; the fixture asserts the mapper renders
//     each side from the backend's own fields and never recomputes it.
// ---------------------------------------------------------------------------

// GET /admin/finance/settlements/stats — bare object (probed 200), defaults to
// the last 30 days; from/to are accepted (ISO datetimes probed) and echoed
// back exactly via range.
export interface FinanceSettlementsStatsMetric {
  amount?: number | null;
  count?: number | null;
  driverCount?: number | null;
}

export interface FinanceSettlementsStatsResponse {
  range?: FinanceRange | null;
  // failed, rejected and cancelled settlements are excluded from netPayable.
  // Amount only — no counts observed on this one.
  netPayable?: { amount?: number | null } | null;
  pendingApproval?: FinanceSettlementsStatsMetric | null;
  processing?: FinanceSettlementsStatsMetric | null;
  failed?: FinanceSettlementsStatsMetric | null;
}

// The row's payout bank: the account number arrives ALREADY
// masked, so the UI renders it as-is and never unmasks or re-masks it.
export interface FinanceSettlementBank {
  name?: string | null;
  accountNumber?: string | null; // masked server-side
}

export interface FinanceSettlementPeriod {
  start?: string | null;
  end?: string | null;
}

// One row of GET /admin/finance/settlements — UNOBSERVED (the
// live list is empty so none has ever been observed). Unknown real values
// must survive the mapper: every consumer reads defensively.
export interface FinanceSettlementListItem {
  id?: string | null; // uuid — drawer fetch key
  reference?: string | null; // STL-… display id (search matches it)
  driver?: FinanceTransactionParty | null; // id + name only; ids never render
  bank?: FinanceSettlementBank | null; // null when no default payout account
  amount?: number | null; // naira (net payable)
  currency?: string | null; // NGN
  period?: FinanceSettlementPeriod | null; // withdrawal requests: start == end (request time)
  // Display statuses (probed 400 enumerates exactly these):
  // pending_approval | processing | paid | failed | flagged | rejected |
  // cancelled. Unknown values render as neutral chips.
  status?: string | null;
  createdAt?: string | null; // ISO 8601 UTC (unobserved)
}

// GET /admin/finance/settlements/{id} — UNOBSERVED (the list is empty; the
// route exists and 404s "Settlement not found" for an unknown id). It
// adds payoutAccount, earnings, payout (the latest attempt), actions flags and
// an embedded timeline copy (the drawer reads the dedicated /timeline
// endpoint). accountName is the payout card's holder name and must stay
// behind the mapping layer like the driver id. No gateway/provider reference
// is typed on purpose: if the real detail carries one it must never render.
export interface FinanceSettlementDetail extends FinanceSettlementListItem {
  payoutAccount?: {
    bank?: string | null;
    accountName?: string | null; // holder — drawer payout card only
    accountNumber?: string | null; // masked server-side
    last4?: string | null;
    verified?: boolean | null;
  } | null;
  // Identity: grossEarnings − commission + adjustments = netPayable.
  // Rendered from the backend's own fields, never recomputed in the UI.
  earnings?: {
    grossEarnings?: number | null;
    commission?: number | null;
    adjustments?: number | null;
    netPayable?: number | null;
  } | null;
  // The latest payout attempt (retry creates a brand new one).
  payout?: {
    status?: string | null;
    reference?: string | null;
    failureReason?: string | null;
  } | null;
  // Gate the action buttons only — every settlement action stays disabled
  // until the mutation tasks wire them.
  actions?: {
    canApprove?: boolean | null;
    canFlag?: boolean | null;
    canUnflag?: boolean | null;
    canRetry?: boolean | null;
    canReject?: boolean | null;
  } | null;
  updatedAt?: string | null;
  timeline?: FinanceTimelineEvent[] | null; // embedded copy; drawer reads /timeline
}
// ---------------------------------------------------------------------------
// Settlement mutations — bodies only,
// never sent from the terminal and never observed live (the list is empty), so
// the RESPONSES stay unknown and every caller refetches list + stats + detail
// + timeline instead of trusting them. Bodies only:
//   POST /admin/finance/settlements/{id}/approve   body none
//   POST /admin/finance/settlements/{id}/retry     body none
//   POST /admin/finance/settlements/{id}/unflag    body none
//   POST /admin/finance/settlements/{id}/flag      { reason } (required)
//   POST /admin/finance/settlements/{id}/reject    { reason } (required, max
//     1000 chars). The reason is INTERNAL: it may appear inside the admin
//     drawer (timeline text "Payout rejected: …") but never in lists or
//     exports, and the driver is only told the withdrawal was not approved.
// Approve/Retry may move REAL money (the funds lock and the bank transfer
// starts); Reject notifies a driver.
// ---------------------------------------------------------------------------
export interface FinanceSettlementReasonBody {
  reason: string;
}

// ---------------------------------------------------------------------------
// Notes + CSV exports —
// GET /admin/finance/notes?subjectType=payment|settlement|refund&subjectId=<uuid>
//   probed 2026-11-17 for all three subjectTypes (payment with a real row id;
//   settlement/refund with fresh UUIDs — no rows exist): every probe returned
//   200 with an EMPTY body, so no envelope and no note item has ever been
//   observed. The item keys below are unobserved and every consumer reads
//   defensively. Note text lives only in the drawer's Notes tab and the POST
//   body — never in rows, CSVs, toasts or logs.
// POST /admin/finance/notes { subjectType, subjectId, body } — body capped at
//   2000 chars; never sent from the terminal (stub harness only). The POST is
//   documented to return the refreshed list; the response is never trusted —
//   the caller refetches with GET.
// GET /admin/finance/{transactions,refunds,settlements}/export — CSV of up to
//   50,000 rows; also never called from the terminal (the browser fetches it
//   with the bearer token and saves the blob — a plain link cannot carry the
//   token).
// ---------------------------------------------------------------------------
export type FinanceNoteSubjectType = "payment" | "settlement" | "refund";

export interface FinanceNoteCreateBody {
  subjectType: FinanceNoteSubjectType;
  subjectId: string;
  body: string;
}

// Spec-only item shape (never observed — see the header note): the mapper
// reads id/body/createdAt and tolerates their absence.
export interface FinanceNoteListItem {
  id?: string | null;
  body?: string | null;
  createdAt?: string | null; // ISO 8601 UTC
}

