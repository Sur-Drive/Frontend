// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// import { getNearbyHazards, confirmHazard } from '../api/publicApi'

// function getToken(): string | null {
//   if (typeof window === 'undefined') return null
//   return localStorage.getItem('token')
// }

// // export function useNearbyFeed(params: { latitude: number; longitude: number; radius: number } | null) {
// //   return useQuery({
// //     queryKey: ['hazards', 'nearby', params],
// //     queryFn: () => {
// //       if (!params) throw new Error('Location required')
// //       return getNearbyHazards(params)
// //     },
// //     enabled: !!params,
// //   })
// // }

// export function useNearbyFeed(params: { latitude: number; longitude: number; radius: number } | null) {
//   return useQuery({
//     queryKey: ['hazards', 'nearby', params],
//     queryFn: async () => {
//       if (!params) throw new Error('Location required')
//       const data = await getNearbyHazards(params)
//       console.log('[feed] fetched hazards:', data)
//       return data
//     },
//     enabled: !!params,
//   })
// }


// export function useVoteHazard() {
//   const queryClient = useQueryClient()

//   return useMutation({
//     mutationFn: ({ hazardId, type }: { hazardId: string; type: 'CONFIRM' | 'INCORRECT' }) => {
//       const token = getToken()
//       console.log('[vote] sending', { hazardId, type, hasToken: !!token })
//       return confirmHazard(hazardId, type, token)
//     },
//     onSuccess: (data) => {
//       console.log('[vote] success, response:', data)
//       queryClient.invalidateQueries({ queryKey: ['hazards', 'nearby'] })
//       console.log('[vote] invalidated nearby queries')
//     },
//     onError: (err) => {
//       console.log('[vote] error:', err)
//     },
//   })
// }




import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNearbyHazards, confirmHazard } from '../api/publicApi'
import type { Hazard } from '../types/hazard'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export function useNearbyFeed(params: { latitude: number; longitude: number; radius: number } | null) {
  return useQuery({
    queryKey: ['hazards', 'nearby', params],
    queryFn: () => {
      if (!params) throw new Error('Location required')
      return getNearbyHazards(params)
    },
    enabled: !!params,
  })
}

export function useVoteHazard() {
  const queryClient = useQueryClient()

  return useMutation({
    // Read the token at call-time, not at hook-render time, so a token
    // obtained via sign-in mid-flow is picked up correctly on retry.
    mutationFn: ({ hazardId, type }: { hazardId: string; type: 'CONFIRM' | 'INCORRECT' }) => {
      const token = getToken()
      return confirmHazard(hazardId, type, token)
    },

    onSuccess: (data: { hazard: Hazard }, variables) => {
      // Directly patch every cached "nearby hazards" list with the
      // updated hazard returned by the server. This updates the UI
      // immediately, regardless of whether a background refetch happens.
      queryClient.setQueriesData<Hazard[]>(
        { queryKey: ['hazards', 'nearby'] },
        (old) => {
          if (!old) return old
          return old.map((h) => (h.id === variables.hazardId ? data.hazard : h))
        }
      )

      // Also invalidate so a background refetch keeps everything else
      // (counts, other users' votes, etc.) in sync with the server.
      queryClient.invalidateQueries({ queryKey: ['hazards', 'nearby'] })
    },
  })
}