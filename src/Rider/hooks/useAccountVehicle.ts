import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDriverVehicle,
  uploadVehicleDocument,
  type VehicleDocKind,
} from "../api/accountVehicle";

export const vehicleKey = ["driver-vehicle"] as const;

export function useDriverVehicle() {
  return useQuery({
    queryKey: vehicleKey,
    queryFn: getDriverVehicle,
    retry: false,
  });
}

export function useUploadVehicleDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, file }: { kind: VehicleDocKind; file: File }) =>
      uploadVehicleDocument(kind, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: vehicleKey }),
  });
}
