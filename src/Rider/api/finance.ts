import { driverFetch } from "./account";

/**
 * Driver wallet / payouts. Uses driverFetch (driver login token).
 * Paths come from the backend collection: {{baseUrl}}/finance/...
 */

/** GET /finance/wallets/driver/:ownerId */
export const getDriverWallet = (ownerId: string) =>
  driverFetch(
    `/finance/wallets/driver/${encodeURIComponent(ownerId)}`,
    "GET",
    "Failed to load wallet",
  );

/** GET /finance/wallets/:walletId/transactions */
export const getWalletTransactions = (walletId: string) =>
  driverFetch(
    `/finance/wallets/${encodeURIComponent(walletId)}/transactions`,
    "GET",
    "Failed to load transactions",
  );

/** GET /finance/payout-accounts/banks */
export const getPayoutBanks = () =>
  driverFetch("/finance/payout-accounts/banks", "GET", "Failed to load banks");

export interface AddPayoutAccountPayload {
  providerId: string;
  bankCode: string;
  accountNumber: string;
  bankName: string;
  makeDefault: boolean;
}

/** POST /finance/payout-accounts */
export const addPayoutAccount = (payload: AddPayoutAccountPayload) => {
  // TEMP DEBUG LOGGING — compare with the working Postman body.
  console.log("[finance] POST /finance/payout-accounts payload:", payload);
  return driverFetch(
    "/finance/payout-accounts",
    "POST",
    "Failed to add bank account",
    payload,
  );
};

/** GET /finance/payout-accounts/provider/:providerId */
export const getPayoutAccounts = (providerId: string) =>
  driverFetch(
    `/finance/payout-accounts/provider/${encodeURIComponent(providerId)}`,
    "GET",
    "Failed to load payout accounts",
  );

export interface WithdrawalPayload {
  providerId: string;
  amount: number;
  currency: string; // "NGN"
  payoutAccountId: string;
}

/** POST /finance/withdrawals */
export const requestWithdrawal = (payload: WithdrawalPayload) =>
  driverFetch("/finance/withdrawals", "POST", "Failed to request withdrawal", payload);
