import { driverFetch } from "./account";

/**
 * Driver payouts and withdrawals. Uses driverFetch (driver login token).
 * All amounts are NAIRA (never kobo). See the Payment Flows guide, section 2.
 */

/* --------------------------------- Wallet --------------------------------- */

/** GET /ride-drivers/earnings/wallet — the wallet card (withdrawable, pending, debt…). */
export const getDriverWallet = () =>
  driverFetch("/ride-drivers/earnings/wallet", "GET", "Failed to load wallet");

/* ----------------------------- Payout accounts ----------------------------- */

/** GET /finance/payout-accounts/banks */
export const getPayoutBanks = () =>
  driverFetch("/finance/payout-accounts/banks", "GET", "Failed to load banks");

export interface AddPayoutAccountPayload {
  providerId: string;
  bankCode: string;
  accountNumber: string;
  bankName?: string;
  makeDefault?: boolean;
}

/** POST /finance/payout-accounts */
export const addPayoutAccount = (payload: AddPayoutAccountPayload) =>
  driverFetch(
    "/finance/payout-accounts",
    "POST",
    "Failed to add bank account",
    payload,
  );

/** GET /finance/payout-accounts/provider/:providerId */
export const getPayoutAccounts = (providerId: string) =>
  driverFetch(
    `/finance/payout-accounts/provider/${encodeURIComponent(providerId)}`,
    "GET",
    "Failed to load payout accounts",
  );

/** POST /finance/payout-accounts/:id/reverify */
export const reverifyPayoutAccount = (id: string) =>
  driverFetch(
    `/finance/payout-accounts/${encodeURIComponent(id)}/reverify`,
    "POST",
    "Failed to re-verify account",
  );

/* ------------------------------- Withdrawals ------------------------------- */

export interface WithdrawalPayload {
  providerId: string;
  amount: number;
  currency: string; // "NGN"
  payoutAccountId: string;
}

/**
 * POST /finance/withdrawals — `idempotencyKey` is REQUIRED (400 without it).
 * Use a fresh UUID per user action and REUSE it when retrying the same submit.
 */
export const requestWithdrawal = (
  payload: WithdrawalPayload,
  idempotencyKey: string,
) =>
  driverFetch(
    "/finance/withdrawals",
    "POST",
    "Failed to request withdrawal",
    payload,
    { "Idempotency-Key": idempotencyKey },
  );

/** GET /finance/withdrawals/limits -> { currency, minAmount, maxAmount|null } */
export const getWithdrawalLimits = () =>
  driverFetch("/finance/withdrawals/limits", "GET", "Failed to load limits");

/** GET /finance/withdrawals/provider/:providerId/awaiting-approval */
export const getAwaitingWithdrawals = (providerId: string) =>
  driverFetch(
    `/finance/withdrawals/provider/${encodeURIComponent(providerId)}/awaiting-approval`,
    "GET",
    "Failed to load pending requests",
  );

/** GET /finance/withdrawals/provider/:providerId */
export const getWithdrawalHistory = (providerId: string) =>
  driverFetch(
    `/finance/withdrawals/provider/${encodeURIComponent(providerId)}`,
    "GET",
    "Failed to load withdrawal history",
  );

/** GET /finance/withdrawals/:id */
export const getWithdrawal = (id: string) =>
  driverFetch(
    `/finance/withdrawals/${encodeURIComponent(id)}`,
    "GET",
    "Failed to load withdrawal",
  );

/** POST /finance/withdrawals/awaiting-approval/:settlementId/cancel (no body) */
export const cancelAwaitingWithdrawal = (settlementId: string) =>
  driverFetch(
    `/finance/withdrawals/awaiting-approval/${encodeURIComponent(settlementId)}/cancel`,
    "POST",
    "Failed to cancel request",
  );
