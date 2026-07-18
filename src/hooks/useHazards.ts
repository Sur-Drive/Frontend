// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
// import { createHazard, createHazardWithPhoto, getMyHazards } from '../api/hazards'
// import type {
//   CreateHazardPayload,
//   CreateHazardWithPhotoPayload,
// } from '../types/hazard'

// export const hazardKeys = {
//   all: ['hazards'] as const,
//   my: () => [...hazardKeys.all, 'my'] as const,
// }

// export function useMyHazards() {
//   return useQuery({
//     queryKey: hazardKeys.my(),
//     queryFn: getMyHazards,
//   })
// }

// export function useCreateHazard() {
//   const queryClient = useQueryClient()
//   return useMutation({
//     mutationFn: (payload: CreateHazardPayload) => createHazard(payload),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: hazardKeys.my() })
//     },
//   })
// }

// export function useCreateHazardWithPhoto() {
//   const queryClient = useQueryClient()
//   return useMutation({
//     mutationFn: (payload: CreateHazardWithPhotoPayload) => createHazardWithPhoto(payload),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: hazardKeys.my() })
//     },
//   })
// }




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

// params is nullable so callers can wait on geolocation before enabling the query
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

export function useConfirmHazard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ConfirmHazardPayload) => confirmHazard(payload),
    onSuccess: () => {
      // Feed/nearby/my all embed confirmation counts, so just invalidate everything hazard-related
      queryClient.invalidateQueries({ queryKey: hazardKeys.all })
    },
  })
}