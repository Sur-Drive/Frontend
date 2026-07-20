





import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createHazard,
  createHazardWithPhoto,
  getMyHazards,
  confirmHazard,
  getHazardFeed,
  getNearbyHazards,
} from '../api/hazards'
import type {
  CreateHazardPayload,
  CreateHazardWithPhotoPayload,
  ConfirmHazardPayload,
  Hazard,
  HazardLocationQuery,
} from '../types/hazard'

export const hazardKeys = {
  all: ['hazards'] as const,
  my: () => [...hazardKeys.all, 'my'] as const,
  feed: (params: HazardLocationQuery) => [...hazardKeys.all, 'feed', params] as const,
  nearby: (params: HazardLocationQuery) => [...hazardKeys.all, 'nearby', params] as const,
}

export function useMyHazards() {
  return useQuery({
    queryKey: hazardKeys.my(),
    queryFn: getMyHazards,
  })
}

export function useCreateHazard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateHazardPayload) => createHazard(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hazardKeys.all })
    },
  })
}

export function useCreateHazardWithPhoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateHazardWithPhotoPayload) => createHazardWithPhoto(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hazardKeys.all })
    },
  })
}

export function useHazardFeed(params: HazardLocationQuery | null) {
  return useQuery({
    queryKey: params ? hazardKeys.feed(params) : hazardKeys.all,
    queryFn: () => getHazardFeed(params as HazardLocationQuery),
    enabled: params !== null,
  })
}

export function useNearbyHazards(params: HazardLocationQuery | null) {
  return useQuery({
    queryKey: params ? hazardKeys.nearby(params) : hazardKeys.all,
    queryFn: () => getNearbyHazards(params as HazardLocationQuery),
    enabled: params !== null,
  })
}

type HazardsSnapshot = [readonly unknown[], Hazard[] | undefined][]

export function useConfirmHazard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ConfirmHazardPayload) => confirmHazard(payload),

    // Optimistically flip the card the instant the user taps.
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: hazardKeys.all })

      const previous: HazardsSnapshot = queryClient.getQueriesData<Hazard[]>({
        queryKey: hazardKeys.all,
      })

      // FIX: backend's userConfirmation is 'CONFIRM' | 'INCORRECT' | null,
      // not a boolean — payload.type already matches that shape exactly.
      const newVote = payload.type

      queryClient.setQueriesData<Hazard[] | undefined>(
        { queryKey: hazardKeys.all },
        (old) => {
          if (!old) return old
          return old.map((hazard) => {
            if (hazard.id !== payload.hazardId) return hazard

            const prevVote = hazard.confirmations.userConfirmation
            let confirms = hazard.confirmations.confirms

            if (newVote === 'CONFIRM' && prevVote !== 'CONFIRM') confirms += 1
            if (newVote !== 'CONFIRM' && prevVote === 'CONFIRM') confirms -= 1

            return {
              ...hazard,
              confirmations: {
                ...hazard.confirmations,
                confirms,
                userConfirmation: newVote,
              },
            }
          })
        }
      )

      return { previous }
    },

    onError: (_err, _payload, context) => {
      context?.previous?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      queryClient.invalidateQueries({ queryKey: hazardKeys.all })
    },

    // Always resync with the server after the mutation settles,
    // so the UI reflects what actually got persisted.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: hazardKeys.all })
    },
  })
}