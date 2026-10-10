import { describeToken } from "./driverSession";

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

export interface PayoutAccount {
  id: string;
  bank: string;
  last4: string;
  holder: string;
  isDefault: boolean;
}

export const normalizeAccounts = (res: any): PayoutAccount[] =>
  asList(res, "accounts", "payoutAccounts").map((a) => ({
    id: String(a.id ?? a._id),
    bank: String(a.bankName ?? a.bank ?? "Bank"),
    last4: String(a.accountNumber ?? a.last4 ?? "").slice(-4),
    holder: String(a.accountName ?? a.accountHolder ?? a.holder ?? ""),
    isDefault: Boolean(a.isDefault ?? a.default),
  }));

export interface WalletInfo {
  id: string;
  balance: number;
  pending: number;
  currency: string;
}

export function normalizeWallet(res: any): WalletInfo {
  const w = res?.data ?? res?.wallet ?? res ?? {};
  return {
    id: String(w.id ?? w._id ?? w.walletId ?? ""),
    balance: Number(w.availableBalance ?? w.balance ?? 0),
    pending: Number(w.pendingBalance ?? w.pending ?? 0),
    currency: String(w.currency ?? "NGN"),
  };
}

export interface WalletTx {
  id: string;
  title: string;
  date: string;
  dateRaw: string;
  status: "Pending" | "Failed" | "Successful";
  amount: number;
  isDebit: boolean;
}

const dmy = (iso?: string) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d.getTime())
    ? d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
    : "—";
};

export const normalizeTransactions = (res: any): WalletTx[] =>
  asList(res, "transactions").map((t) => {
    const s = String(t.status ?? "").toLowerCase();
    const type = String(t.type ?? t.direction ?? t.category ?? "").toLowerCase();
    const raw = t.createdAt ?? t.date ?? "";
    return {
      id: String(t.id ?? t._id ?? Math.random()),
      title: String(t.description ?? t.narration ?? t.type ?? "Transaction"),
      date: dmy(raw),
      dateRaw: raw,
      status: /fail|reject|revers/.test(s)
        ? "Failed"
        : /pend|process|init/.test(s)
          ? "Pending"
          : "Successful",
      amount: Number(t.amount ?? 0),
      isDebit: /debit|withdraw|payout/.test(type),
    };
  });

/** Fallback when the profile response carries no id: the JWT `sub`. */
export function jwtSub(): string | undefined {
  const t = localStorage.getItem("token");
  try {
    const part = t?.split(".")[1];
    if (!part) return undefined;
    const p = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return p.sub ?? p.id ?? p.userId ?? p.driverId;
  } catch {
    console.log("[finance] token:", describeToken(t));
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
