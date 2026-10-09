import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  passengerLocationApi,
  type UpdatePassengerLocationRequest,
} from "../../api/passenger/location";

export const passengerLocationKeys = {
  all: ["passenger", "location"] as const,
};

export function usePassengerLocation() {
  return useQuery({
    queryKey: passengerLocationKeys.all,
    queryFn: passengerLocationApi.getLocation,
    staleTime: 30_000,
  });
}

export function useSetPassengerLocationEnabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enabled: boolean) =>
      passengerLocationApi.setLocationEnabled(
        enabled,
      ),

    onSuccess: (location) => {
      queryClient.setQueryData(
        passengerLocationKeys.all,
        location,
      );
    },
  });
}

export function useUpdatePassengerLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: UpdatePassengerLocationRequest,
    ) =>
      passengerLocationApi.updateLocation(
        payload,
      ),

    onSuccess: (location) => {
      queryClient.setQueryData(
        passengerLocationKeys.all,
        location,
      );
    },
  });
}