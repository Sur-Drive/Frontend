import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/apiClient'

// Rename the keys if your backend expects different ones
// (e.g. oldPassword / password). Method is POST — switch to
// api.patch/api.put here if the route expects that.
export interface SetPasswordPayload {
  currentPassword: string
  newPassword: string
}

export function useSetPassword() {
  return useMutation({
    mutationFn: (payload: SetPasswordPayload) =>
      api.post('/auth/set-password', payload),
  })
}