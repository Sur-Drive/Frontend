import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  passengerProfileApi,
  type UpdatePassengerProfileRequest,
} from "../../api/passenger/profile";

export const passengerProfileKeys = {
  all: [
    "passenger",
    "profile",
  ] as const,

  profile: [
    "passenger",
    "profile",
    "details",
  ] as const,

  stats: [
    "passenger",
    "profile",
    "stats",
  ] as const,
};

export function usePassengerProfileQuery() {
  return useQuery({
    queryKey:
      passengerProfileKeys.profile,

    queryFn: () =>
      passengerProfileApi.getProfile(),

    staleTime: 30_000,

    refetchOnWindowFocus: true,
  });
}

export function usePassengerStatsQuery() {
  return useQuery({
    queryKey:
      passengerProfileKeys.stats,

    queryFn: () =>
      passengerProfileApi.getStats(),

    staleTime: 60_000,
  });
}

export function useUpdatePassengerProfile() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      payload:
        UpdatePassengerProfileRequest,
    ) =>
      passengerProfileApi.updateProfile(
        payload,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          passengerProfileKeys.profile,
      });
    },
  });
}

export function useUploadPassengerProfilePicture() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      file: File,
    ) =>
      passengerProfileApi.uploadProfilePicture(
        file,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          passengerProfileKeys.profile,
      });
    },
  });
}

export function useRequestPassengerEmailChange() {
  return useMutation({
    mutationFn: (
      email: string,
    ) =>
      passengerProfileApi.requestEmailChange(
        email,
      ),
  });
}

export function useVerifyPassengerEmailChange() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      otp: string,
    ) =>
      passengerProfileApi.verifyEmailChange(
        otp,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          passengerProfileKeys.profile,
      });
    },
  });
}

export function useResendPassengerEmailChange() {
  return useMutation({
    mutationFn: () =>
      passengerProfileApi.resendEmailChange(),
  });
}

export function useRequestPassengerPhoneChange() {
  return useMutation({
    mutationFn: (
      phone: string,
    ) =>
      passengerProfileApi.requestPhoneChange(
        phone,
      ),
  });
}

export function useVerifyPassengerPhoneChange() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      otp: string,
    ) =>
      passengerProfileApi.verifyPhoneChange(
        otp,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          passengerProfileKeys.profile,
      });
    },
  });
}

export function useResendPassengerPhoneChange() {
  return useMutation({
    mutationFn: () =>
      passengerProfileApi.resendPhoneChange(),
  });
}