import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  passengerSafetyApi,
} from "../../api/passenger/safety";

import type {
  CreateEmergencyContactRequest,
  UpdateEmergencyContactRequest,
} from "../../api/passenger/safety";

export const passengerSafetyKeys = {
  all: [
    "passenger",
    "safety",
  ] as const,

  contacts: [
    "passenger",
    "safety",
    "emergency-contacts",
  ] as const,
};

export function usePassengerEmergencyContacts() {
  return useQuery({
    queryKey:
      passengerSafetyKeys.contacts,

    queryFn: () =>
      passengerSafetyApi.getEmergencyContacts(),

    staleTime:
      30 * 1000,
  });
}

export function useSetPassengerPickupCode() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      enabled: boolean,
    ) =>
      passengerSafetyApi.setPickupCode(
        enabled,
      ),

    onSuccess: async () => {
      /*
       * pickupCodeEnabled is returned by GET /riders/profile,
       * so refresh the profile after changing it.
       */
      await queryClient.invalidateQueries({
        queryKey: [
          "passenger",
          "profile",
        ],
      });
    },
  });
}

export function useCreatePassengerEmergencyContact() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      payload:
        CreateEmergencyContactRequest,
    ) =>
      passengerSafetyApi.createEmergencyContact(
        payload,
      ),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            passengerSafetyKeys.contacts,
        }),

        /*
         * Profile contains emergencyContactsCount
         * and primaryEmergencyContact.
         */
        queryClient.invalidateQueries({
          queryKey: [
            "passenger",
            "profile",
          ],
        }),
      ]);
    },
  });
}

export function useUpdatePassengerEmergencyContact() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      contactId,
      payload,
    }: {
      contactId: string;
      payload:
        UpdateEmergencyContactRequest;
    }) =>
      passengerSafetyApi.updateEmergencyContact(
        contactId,
        payload,
      ),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            passengerSafetyKeys.contacts,
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "passenger",
            "profile",
          ],
        }),
      ]);
    },
  });
}

export function useDeletePassengerEmergencyContact() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      contactId: string,
    ) =>
      passengerSafetyApi.deleteEmergencyContact(
        contactId,
      ),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            passengerSafetyKeys.contacts,
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "passenger",
            "profile",
          ],
        }),
      ]);
    },
  });
}