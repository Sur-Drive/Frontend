/** List endpoints may return an array or wrap it (data / items / ...). */
export function asList(res: any, ...keys: string[]): any[] {
  if (Array.isArray(res)) return res;
  const c = [
    ...keys.map((k) => res?.[k]),
    res?.data,
    res?.items,
    ...keys.map((k) => res?.data?.[k]),
    res?.data?.items,
  ];
  return c.find(Array.isArray) ?? [];
}

export interface Bank {
  name: string;
  code: string;
}

export const normalizeBanks = (res: any): Bank[] =>
  asList(res, "banks")
    .map((b) => ({
      name: String(b.name ?? b.bankName ?? ""),
      code: String(b.code ?? b.bankCode ?? ""),
    }))
    .filter((b) => b.name && b.code);

export type AccountStatus = "pending_verification" | "verified" | "failed";

export interface PayoutAccount {
  id: string;
  bank: string;
  last4: string;
  holder: string;
  isDefault: boolean;
  status: AccountStatus;
}

const accountStatus = (v: any): AccountStatus => {
  const s = String(v ?? "").toLowerCase();
  if (s === "verified") return "verified";
  if (s === "failed") return "failed";
  return "pending_verification";
};

export const normalizeAccounts = (res: any): PayoutAccount[] =>
  asList(res, "accounts", "payoutAccounts").map((a) => ({
    id: String(a.id ?? a._id),
    bank: String(a.bankName ?? a.bank ?? "Bank"),
    last4: String(a.accountNumber ?? a.last4 ?? "").slice(-4),
    holder: String(a.accountName ?? a.accountHolder ?? a.holder ?? ""),
    isDefault: Boolean(a.isDefault ?? a.default),
    status: accountStatus(a.status),
  }));

/** GET /ride-drivers/earnings/wallet (naira). */
export interface WalletInfo {
  /** Max the driver can withdraw (already excludes requests awaiting approval). */
  balance: number;
  /** Reserved for withdrawals awaiting approval or in flight. */
  pendingWithdrawal: number;
  cashEarned: number;
  totalEarned: number;
  totalWithdrawn: number;
  outstandingDebt: number;
  currency: string;
}

export function normalizeWallet(res: any): WalletInfo {
  const w = res?.data ?? res?.wallet ?? res ?? {};
  return {
    balance: Number(w.withdrawableBalance ?? 0),
    pendingWithdrawal: Number(w.pendingWithdrawalBalance ?? 0),
    cashEarned: Number(w.cashEarned ?? 0),
    totalEarned: Number(w.totalEarned ?? 0),
    totalWithdrawn: Number(w.totalWithdrawn ?? 0),
    outstandingDebt: Number(w.outstandingDebt ?? 0),
    currency: String(w.currency ?? "NGN"),
  };
}

export interface WithdrawalLimits {
  minAmount: number;
  /** null = no per-request limit */
  maxAmount: number | null;
}

export function normalizeLimits(res: any): WithdrawalLimits {
  const l = res?.data ?? res ?? {};
  return {
    minAmount: Number(l.minAmount ?? 1),
    maxAmount:
      l.maxAmount === null || l.maxAmount === undefined
        ? null
        : Number(l.maxAmount),
  };
}

/** What the driver sees for a payout request / withdrawal. */
export type PayoutStatus = "Awaiting approval" | "Processing" | "Paid" | "Failed";

export interface PayoutItem {
  id: string;
  /** settlementId for awaiting requests (the cancel call needs it). */
  settlementId?: string;
  amount: number;
  status: PayoutStatus;
  /** raw status, useful for polling decisions */
  rawStatus: string;
  failureReason?: string;
  date: string;
  dateRaw: string;
  awaiting: boolean;
}

const dmy = (iso?: string) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d.getTime())
    ? d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
    : "—";
};

/** Guide table: withdrawal statuses -> what we show. */
export function withdrawalStatusLabel(raw: string): PayoutStatus {
  const s = raw.toLowerCase();
  if (s === "awaiting_approval") return "Awaiting approval";
  if (s === "completed") return "Paid";
  if (["failed", "reversed", "cancelled"].includes(s)) return "Failed";
  // requested, pending_validation, funds_locked, processing (and unknown)
  return "Processing";
}

/** Requests no admin has approved yet (shaped like the submit response). */
export const normalizeAwaiting = (res: any): PayoutItem[] =>
  asList(res, "requests", "settlements", "withdrawals").map((r) => {
    const id = String(r.settlementId ?? r.id ?? r._id);
    const raw = r.requestedAt ?? r.createdAt ?? "";
    return {
      id,
      settlementId: id,
      amount: Number(r.amount ?? r.requestedAmount ?? 0),
      status: "Awaiting approval",
      rawStatus: "awaiting_approval",
      date: dmy(raw),
      dateRaw: raw,
      awaiting: true,
    };
  });

export const normalizeWithdrawals = (res: any): PayoutItem[] =>
  asList(res, "withdrawals").map((w) => normalizeWithdrawal(w));

export function normalizeWithdrawal(w: any): PayoutItem {
  const x = w?.data && !Array.isArray(w.data) && w.data.id ? w.data : w;
  const raw = String(x?.status ?? "");
  const created = x?.createdAt ?? "";
  return {
    id: String(x?.id ?? x?._id),
    amount: Number(x?.requestedAmount ?? x?.amount ?? 0),
    status: withdrawalStatusLabel(raw),
    rawStatus: raw.toLowerCase(),
    failureReason: x?.failureReason ? String(x.failureReason) : undefined,
    date: dmy(created),
    dateRaw: created,
    awaiting: false,
  };
}

/** Response of POST /finance/withdrawals, in either mode. */
export interface WithdrawalResult {
  mode: "awaiting_approval" | "automatic";
  amount: number;
}

export function normalizeWithdrawalResult(res: any): WithdrawalResult {
  const r = res?.data ?? res ?? {};
  if (String(r.status ?? "").toLowerCase() === "awaiting_approval") {
    return { mode: "awaiting_approval", amount: Number(r.amount ?? 0) };
  }
  return { mode: "automatic", amount: Number(r.requestedAmount ?? r.amount ?? 0) };
}

/** Map the documented 400 messages to something actionable. */
export type WithdrawErrorKind = "no-account" | "support" | "generic";
export function classifyWithdrawError(msg: string): WithdrawErrorKind {
  if (/Add and verify a payout account/i.test(msg)) return "no-account";
  if (/has not been verified/i.test(msg)) return "no-account";
  return "generic";
}

/** Fallback when the profile response carries no id: the JWT `sub`. */
export function jwtSub(): string | undefined {
  const t = localStorage.getItem("token");
  try {
    const part = t?.split(".")[1];
    if (!part) return undefined;
    const p = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return p.sub ?? p.id ?? p.userId ?? p.driverId;
  } catch {
    return undefined;
  }
}

/** The driver's id: profile response first, then the token. */
export function extractDriverId(profileRaw: any): string | undefined {
  const b = profileRaw ?? {};
  const id =
    b?.data?.id ?? b?.profile?.id ?? b?.driver?.id ?? b?.user?.id ?? b?.id ??
    b?.data?.driverId ?? b?.driverId;
  return id ? String(id) : jwtSub();
}
