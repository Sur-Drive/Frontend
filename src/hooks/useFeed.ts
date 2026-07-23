





import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNearbyHazards, confirmHazard } from '../api/publicApi'
import type { Hazard, ConfirmationType } from '../types/hazard'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

// ---- Local vote persistence ----
// /hazards/nearby is a public endpoint and doesn't return per-user vote
// state, so we track "what did I vote on this hazard" ourselves and merge
// it into every fetched hazard list. This is what makes the vote survive
// a page refresh.

const VOTES_KEY = 'hazardVotes' // { [hazardId]: 'CONFIRM' | 'INCORRECT' }

function readLocalVotes(): Record<string, ConfirmationType> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(VOTES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeLocalVote(hazardId: string, type: ConfirmationType) {
  if (typeof window === 'undefined') return
  const current = readLocalVotes()
  current[hazardId] = type
  localStorage.setItem(VOTES_KEY, JSON.stringify(current))
}

function mergeLocalVotes(hazards: Hazard[]): Hazard[] {
  const votes = readLocalVotes()
  return hazards.map((h) => {
    const localVote = votes[h.id]
    if (!localVote) return h
    return {
      ...h,
      confirmations: {
        ...h.confirmations,
        userConfirmation: localVote,
      },
    }
  })
}

export function useNearbyFeed(params: { latitude: number; longitude: number; radius: number } | null) {
  return useQuery({
    queryKey: ['hazards', 'nearby', params],
    queryFn: async () => {
      if (!params) throw new Error('Location required')
      const token = getToken()
      const data = await getNearbyHazards(params, token)
      const merged = mergeLocalVotes(data)
      console.log('[useNearbyFeed] merged local votes into fetched hazards:', merged.map((h: Hazard) => h.confirmations.userConfirmation))
      return merged
    },
    enabled: !!params,
  })
}

export function useVoteHazard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ hazardId, type }: { hazardId: string; type: ConfirmationType }) => {
      const token = getToken()
      return confirmHazard(hazardId, type, token)
    },

    onSuccess: (data: { hazard: Hazard }, variables) => {
      // Persist the vote locally so it survives refreshes, since the
      // public nearby endpoint won't echo it back to us.
      writeLocalVote(variables.hazardId, variables.type)

      queryClient.setQueriesData<Hazard[]>(
        { queryKey: ['hazards', 'nearby'] },
        (old) => {
          if (!old) return old
          return old.map((h) => (h.id === variables.hazardId ? data.hazard : h))
        }
      )
    },

    onError: (err, variables) => {
      console.log('[useVoteHazard] onError for', variables, err)
    },
  })
}



