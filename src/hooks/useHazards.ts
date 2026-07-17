import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createHazard,
  createHazardWithPhoto,
  getNearbyHazards,
  voteHazard,
} from '../api/hazards'
import type {
  CreateHazardInput,
  CreateHazardWithPhotoInput,
  NearbyHazardsParams,
  HazardVoteInput,
} from '../api/hazards'

export const hazardKeys = {
  all: ['hazards'] as const,
  nearby: (params: NearbyHazardsParams) => ['hazards', 'nearby', params] as const,
}

// ---------- Fetch nearby hazards ----------

export function useNearbyHazards(params: NearbyHazardsParams | null) {
  const query = useQuery({
    queryKey: params ? hazardKeys.nearby(params) : ['hazards', 'nearby', 'disabled'],
    queryFn: () => getNearbyHazards(params!),
    enabled: !!params,
    staleTime: 30_000,
  })

  if (query.data) {
    console.log('[useNearbyHazards] data:', query.data)
  }
  if (query.error) {
    console.log('[useNearbyHazards] error:', query.error)
  }

  return query
}

// ---------- Create hazard (JSON only, no photo) ----------

export function useCreateHazard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateHazardInput) => createHazard(data),
    onSuccess: (result) => {
      console.log('[useCreateHazard] success:', result)
      queryClient.invalidateQueries({ queryKey: hazardKeys.all })
    },
    onError: (err) => {
      console.log('[useCreateHazard] error:', err)
    },
  })
}

// ---------- Create hazard with photo (multipart) ----------

export function useCreateHazardWithPhoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateHazardWithPhotoInput) => createHazardWithPhoto(data),
    onSuccess: (result) => {
      console.log('[useCreateHazardWithPhoto] success:', result)
      queryClient.invalidateQueries({ queryKey: hazardKeys.all })
    },
    onError: (err) => {
      console.log('[useCreateHazardWithPhoto] error:', err)
    },
  })
}

// ---------- Confirm / mark incorrect ----------

export function useVoteHazard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: HazardVoteInput) => voteHazard(data),
    onSuccess: (result) => {
      console.log('[useVoteHazard] success:', result)
      queryClient.invalidateQueries({ queryKey: hazardKeys.all })
    },
    onError: (err) => {
      console.log('[useVoteHazard] error:', err)
    },
  })
}