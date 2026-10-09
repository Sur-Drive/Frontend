import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  requestEmailChange,
  verifyEmailChange,
  resendEmailChange,
  requestPhoneChange,
  verifyPhoneChange,
  resendPhoneChange,
  changeRideDriverPassword,
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "../api/account";
import { RIDE_DRIVER_PROFILE_KEY } from "./useProfile";

export const useRequestEmailChange = () =>
  useMutation({ mutationFn: requestEmailChange });

export function useVerifyEmailChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: verifyEmailChange,
    onSuccess: () => qc.invalidateQueries({ queryKey: RIDE_DRIVER_PROFILE_KEY }),
  });
}

export const useResendEmailChange = () =>
  useMutation({ mutationFn: resendEmailChange });

export const useRequestPhoneChange = () =>
  useMutation({ mutationFn: requestPhoneChange });

export function useVerifyPhoneChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: verifyPhoneChange,
    onSuccess: () => qc.invalidateQueries({ queryKey: RIDE_DRIVER_PROFILE_KEY }),
  });
}

export const useResendPhoneChange = () =>
  useMutation({ mutationFn: resendPhoneChange });

export const useChangeRideDriverPassword = () =>
  useMutation({ mutationFn: changeRideDriverPassword });

export const NOTIFICATION_PREFS_KEY = [
  "ride-driver",
  "notification-preferences",
] as const;

export function useNotificationPreferences() {
  return useQuery({
    queryKey: NOTIFICATION_PREFS_KEY,
    queryFn: getNotificationPreferences,
    enabled: !!localStorage.getItem("token"),
    staleTime: 60_000,
    retry: false,
  });
}

/** PATCH with an optimistic update; rolls back if the request fails. */
export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateNotificationPreferences,
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: NOTIFICATION_PREFS_KEY });
      const previous = qc.getQueryData<NotificationPreferences>(
        NOTIFICATION_PREFS_KEY,
      );
      qc.setQueryData<NotificationPreferences>(NOTIFICATION_PREFS_KEY, (old) => ({
        pushEnabled: false,
        emailEnabled: false,
        ...old,
        ...patch,
      }));
      return { previous };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.previous) qc.setQueryData(NOTIFICATION_PREFS_KEY, ctx.previous);
    },
  });
}
