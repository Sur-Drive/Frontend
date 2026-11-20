import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addPayoutAccount,
  cancelAwaitingWithdrawal,
  getAwaitingWithdrawals,
  getDriverWallet,
  getPayoutAccounts,
  getPayoutBanks,
  getWithdrawal,
  getWithdrawalHistory,
  getWithdrawalLimits,
  requestWithdrawal,
  reverifyPayoutAccount,
  type WithdrawalPayload,
} from "../api/finance";
import {
  extractDriverId,
  normalizeAccounts,
  normalizeAwaiting,
  normalizeBanks,
  normalizeLimits,
  normalizeWallet,
  normalizeWithdrawal,
  normalizeWithdrawalResult,
  normalizeWithdrawals,
  withdrawalStatusLabel,
} from "../lib/financeMap";
import { useRideDriverProfile } from "./useProfile";

/** providerId (payouts / withdrawals) is the driver's own user id. */
export function useDriverId() {
  const profile = useRideDriverProfile();
  const id = profile.data ? extractDriverId(profile.data.raw) : undefined;
  return {
    id,
    isLoading: profile.isLoading,
    error: profile.error as Error | null,
  };
}

/** GET /ride-drivers/earnings/wallet */
export function useDriverWallet() {
  return useQuery({
    queryKey: ["finance", "wallet"],
    queryFn: async () => normalizeWallet(await getDriverWallet()),
    retry: false,
    refetchOnWindowFocus: true,
  });
}

export function useWithdrawalLimits() {
  return useQuery({
    queryKey: ["finance", "limits"],
    queryFn: async () => normalizeLimits(await getWithdrawalLimits()),
    // Set on the server and can change: read it each time the screen opens.
    staleTime: 0,
    retry: 1,
  });
}

export function useAwaitingWithdrawals(providerId?: string) {
  return useQuery({
    queryKey: ["finance", "awaiting", providerId],
    queryFn: async () =>
      normalizeAwaiting(await getAwaitingWithdrawals(providerId!)),
    enabled: !!providerId,
    retry: false,
    refetchOnWindowFocus: true,
  });
}

export function useWithdrawalHistory(providerId?: string) {
  return useQuery({
    queryKey: ["finance", "withdrawals", providerId],
    queryFn: async () =>
      normalizeWithdrawals(await getWithdrawalHistory(providerId!)),
    enabled: !!providerId,
    retry: false,
    refetchOnWindowFocus: true,
  });
}

/** One withdrawal. Polls every 12s ONLY while its status is Processing (call it from the open detail screen). */
export function useWithdrawal(id?: string) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["finance", "withdrawal", id],
    queryFn: async () => normalizeWithdrawal(await getWithdrawal(id!)),
    enabled: !!id,
    retry: false,
    refetchInterval: (query) => {
      const st = query.state.data?.rawStatus;
      return st && withdrawalStatusLabel(st) === "Processing" ? 12_000 : false;
    },
  });
  const status = q.data?.rawStatus;
  const last = useRef(status);
  useEffect(() => {
    if (last.current && status && last.current !== status) {
      qc.invalidateQueries({ queryKey: ["finance", "wallet"] });
      qc.invalidateQueries({ queryKey: ["finance", "withdrawals"] });
    }
    last.current = status;
  }, [status, qc]);
  return q;
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

export function useReverifyPayoutAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reverifyPayoutAccount,
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ["finance", "payout-accounts"] }),
  });
}

/**
 * Submit a withdrawal. The Idempotency-Key is created per user action and
 * REUSED when the same submit is retried (e.g. after a network error); it is
 * reset only after the request is definitively accepted or rejected (4xx).
 * Branch on the returned `mode`, never on the server's configuration.
 */
export function useRequestWithdrawal() {
  const qc = useQueryClient();
  const keyRef = useRef<string | null>(null);
  const mutation = useMutation({
    mutationFn: async (payload: WithdrawalPayload) => {
      if (!keyRef.current) keyRef.current = crypto.randomUUID();
      return normalizeWithdrawalResult(
        await requestWithdrawal(payload, keyRef.current),
      );
    },
    onSuccess: () => {
      keyRef.current = null; // next submit is a new user action
    },
    onError: (e) => {
      const status = (e as Error & { status?: number }).status;
      // A definitive client error means a *new* attempt is a new action.
      // Network errors / 5xx keep the key so a retry returns the original.
      if (status && status >= 400 && status < 500) keyRef.current = null;
    },
    onSettled: () => {
      // Source of truth: refetch after any action.
      qc.invalidateQueries({ queryKey: ["finance"] });
      qc.invalidateQueries({ queryKey: ["earnings"] });
    },
  });
  return mutation;
}

export function useCancelAwaitingWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelAwaitingWithdrawal,
    // Success or 409/404, the list is the truth: refetch either way.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["finance"] });
      qc.invalidateQueries({ queryKey: ["earnings"] });
    },
  });
}

/**
 * Refetch money state when a push arrives (relayed by the service worker as
 * { type: "push-received" }) and when the tab regains focus.
 */
export function useFinancePushRefresh() {
  const qc = useQueryClient();
  useEffect(() => {
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ["finance"] });
      qc.invalidateQueries({ queryKey: ["earnings", "wallet"] });
    };
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "push-received") refresh();
    };
    navigator.serviceWorker?.addEventListener("message", onMsg);
    window.addEventListener("focus", refresh);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", onMsg);
      window.removeEventListener("focus", refresh);
    };
  }, [qc]);
}
