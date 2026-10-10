import { useMutation } from "@tanstack/react-query";
import { triggerDriverSos, cancelDriverSos } from "../api/sos";
import type { DriverSosPayload } from "../api/sos";

export function useTriggerDriverSos() {
  return useMutation({
    mutationFn: (payload: DriverSosPayload) => triggerDriverSos(payload),
  });
}

export function useCancelDriverSos() {
  return useMutation({
    mutationFn: (sosId: string) => cancelDriverSos(sosId),
  });
}
