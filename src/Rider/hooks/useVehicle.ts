import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getRideDriverVehicle,
  updateRideDriverVehicleCombined,
  uploadRideDriverVehicleOwnership,
  uploadRideDriverVehicleLicense,
  uploadRideDriverVehicleRoadworthiness,
  submitRideDriverDriversLicense,
} from "../api/vehicle";

export function useRideDriverVehicle(enabled = true) {
  return useQuery({
    queryKey: ["ride-driver-vehicle"],
    queryFn: getRideDriverVehicle,
    enabled,
    retry: false,
  });
}

export function useUpdateRideDriverVehicleCombined() {
  return useMutation({ mutationFn: updateRideDriverVehicleCombined });
}

export function useUploadRideDriverVehicleOwnership() {
  return useMutation({ mutationFn: uploadRideDriverVehicleOwnership });
}

export function useUploadRideDriverVehicleLicense() {
  return useMutation({ mutationFn: uploadRideDriverVehicleLicense });
}

export function useUploadRideDriverVehicleRoadworthiness() {
  return useMutation({ mutationFn: uploadRideDriverVehicleRoadworthiness });
}

export function useSubmitRideDriverDriversLicense() {
  return useMutation({ mutationFn: submitRideDriverDriversLicense });
}
