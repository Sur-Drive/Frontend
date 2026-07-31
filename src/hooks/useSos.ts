import { useMutation } from '@tanstack/react-query'
import { triggerSos, cancelSos } from '../api/sos'
import type { TriggerSosPayload } from '../api/sos'

export function useTriggerSos() {
  return useMutation({
    mutationFn: (payload: TriggerSosPayload) => triggerSos(payload),
  })
}

export function useCancelSos() {
  return useMutation({
    mutationFn: (sosId: string) => cancelSos(sosId),
  })
}
