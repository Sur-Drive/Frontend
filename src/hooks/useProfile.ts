import { useQuery, QueryClient } from '@tanstack/react-query'
import { getUserProfile, type UserProfileResponse } from '../api/profile'

export const profileQueryKey = ['userProfile'] as const

export function useProfile() {
  return useQuery<UserProfileResponse, Error>({
    queryKey: profileQueryKey,
    queryFn: getUserProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

// Prefetch helper for router loaders
export function prefetchProfile(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: profileQueryKey,
    queryFn: getUserProfile,
  })
}