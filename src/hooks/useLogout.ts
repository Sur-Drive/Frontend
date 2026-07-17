import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'

async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout')
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logoutRequest,
    // Clear the token and cached data regardless of whether the server
    // call succeeds — the user's intent is to be logged out locally either way.
    onSettled: () => {
      localStorage.removeItem('token')
      queryClient.clear()
    },
  })
}