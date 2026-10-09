import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addPayoutAccount,
  getDriverWallet,
  getPayoutAccounts,
  getPayoutBanks,
  getWalletTransactions,
  requestWithdrawal,
} from "../api/finance";
import {
  extractDriverId,
  normalizeAccounts,
  normalizeBanks,
  normalizeTransactions,
  normalizeWallet,
} from "../lib/financeMap";
import { useRideDriverProfile } from "./useProfile";

/** ownerId (wallet) and providerId (payouts) are both the driver's id. */
export function useDriverId() {
  const profile = useRideDriverProfile();
  const id = profile.data ? extractDriverId(profile.data.raw) : undefined;
  if (profile.data) console.log("[finance] driver id:", id);
  return {
    id,
    isLoading: profile.isLoading,
    error: profile.error as Error | null,
  };
}

export function useDriverWallet(ownerId?: string) {
  return useQuery({
    queryKey: ["finance", "wallet", ownerId],
    queryFn: async () => normalizeWallet(await getDriverWallet(ownerId!)),
    enabled: !!ownerId,
    retry: false,
  });
}

export function useWalletTransactions(walletId?: string) {
  return useQuery({
    queryKey: ["finance", "transactions", walletId],
    queryFn: async () =>
      normalizeTransactions(await getWalletTransactions(walletId!)),
    enabled: !!walletId,
    retry: false,
  });
}

export function usePayoutBanks() {
  return useQuery({
    queryKey: ["finance", "banks"],
    queryFn: async () => normalizeBanks(await getPayoutBanks()),
    staleTime: 60 * 60_000,
    retry: 1,
  });
}

export function usePayoutAccounts(providerId?: string) {
  return useQuery({
    queryKey: ["finance", "payout-accounts", providerId],
    queryFn: async () =>
      normalizeAccounts(await getPayoutAccounts(providerId!)),
    enabled: !!providerId,
    retry: false,
  });
}

export function useAddPayoutAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addPayoutAccount,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["finance", "payout-accounts"] }),
  });
}

export function useRequestWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: requestWithdrawal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance"] }),
  });
}
