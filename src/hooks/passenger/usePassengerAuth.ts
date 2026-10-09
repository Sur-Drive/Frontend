import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  passengerAuthApi,
} from "../../api/passenger/passengerAuth.api";

import {
  passengerSession,
} from "../../api/passenger/passengerSession";

/* =========================================================
   QUERY KEYS
========================================================= */

export const passengerAuthKeys = {
  all: [
    "passenger-auth",
  ] as const,

  onboardingStatus: [
    "passenger-auth",
    "onboarding-status",
  ] as const,
};

/* =========================================================
   SEND OTP
========================================================= */

export function useSendPassengerOtp() {
  return useMutation({
    mutationFn:
      passengerAuthApi.sendOtp,
  });
}

/* =========================================================
   VERIFY OTP
========================================================= */

export function useVerifyPassengerOtp() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn:
      passengerAuthApi.verifyOtp,

    onSuccess: async (
      response,
    ) => {
      /*
       * Existing passengers may now have a complete
       * authenticated session.
       */
      if (
        response.tokens
          ?.accessToken
      ) {
        await queryClient.invalidateQueries(
          {
            queryKey:
              passengerAuthKeys.all,
          },
        );
      }
    },
  });
}

/* =========================================================
   PERSONAL INFO
========================================================= */

export function useSetPassengerPersonalInfo() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn:
      passengerAuthApi.setPersonalInfo,

    onSuccess: async () => {
      await queryClient.invalidateQueries(
        {
          queryKey:
            passengerAuthKeys.all,
        },
      );
    },
  });
}

/* =========================================================
   LOGOUT
========================================================= */

export function usePassengerLogout() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn:
      passengerAuthApi.logout,

    onSettled: () => {
      queryClient.removeQueries({
        queryKey:
          passengerAuthKeys.all,
      });
    },
  });
}

/* =========================================================
   ONBOARDING STATUS
========================================================= */

export function usePassengerOnboardingStatus(
  enabled = true,
) {
  return useQuery({
    queryKey:
      passengerAuthKeys.onboardingStatus,

    queryFn:
      passengerAuthApi
        .onboardingStatus,

    enabled:
      enabled &&
      Boolean(
        passengerSession
          .getAccessToken(),
      ),

    retry: false,
  });
}

/* =========================================================
   GOOGLE AUTH
========================================================= */

export function usePassengerGoogleAuth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: passengerAuthApi.googleAuth,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: passengerAuthKeys.all,
      });
    },
  });
}