import { useMutation, useQuery } from "@tanstack/react-query";
import {
  submitRideDriverInspection,
  uploadRideDriverProfilePicture,
  setRideDriverPassword,
  getRideDriverStatus,
} from "../api/onboarding";

export function useSubmitRideDriverInspection() {
  return useMutation({ mutationFn: submitRideDriverInspection });
}

export function useUploadRideDriverProfilePicture() {
  return useMutation({ mutationFn: uploadRideDriverProfilePicture });
}

export function useSetRideDriverPassword() {
  return useMutation({ mutationFn: setRideDriverPassword });
}

export function useRideDriverStatus(enabled = true) {
  return useQuery({
    queryKey: ["ride-driver-status"],
    queryFn: getRideDriverStatus,
    enabled,
    retry: false,
  });
}
