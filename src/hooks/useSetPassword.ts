import { useMutation } from '@tanstack/react-query'
import { apiRequest } from './useEmergencyContacts'

// Rename the keys if your backend expects different ones
// (e.g. oldPassword / password). Method is POST — switch to
// PATCH or PUT here if the route expects that.
export interface SetPasswordPayload {
  currentPassword: string
  newPassword: string
}

export function useSetPassword() {
  return useMutation({
    mutationFn: (payload: SetPasswordPayload) =>
      apiRequest('/auth/set-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  })
}