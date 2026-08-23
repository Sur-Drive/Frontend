// import { useMutation } from '@tanstack/react-query'
// import {
//   sendOtp,
//   verifyOtp,
//   sendPersonalInfo,
//   setPassword,
//   login,
//   refreshToken,
//   logout,
//   forgotPassword,
//   verifyResetOtp,
//   resetPassword,
//   updatePassword,
// } from '../api/auth'

// export function useSendOtp() {
//   return useMutation({ mutationFn: sendOtp })
// }

// export function useVerifyOtp() {
//   return useMutation({ mutationFn: verifyOtp })
// }

// export function useSendPersonalInfo() {
//   return useMutation({ mutationFn: sendPersonalInfo })
// }

// export function useSetPassword() {
//   return useMutation({ mutationFn: setPassword })
// }

// export function useLogin() {
//   return useMutation({ mutationFn: login })
// }

// export function useRefreshToken() {
//   return useMutation({ mutationFn: refreshToken })
// }

// export function useLogout() {
//   return useMutation({ mutationFn: logout })
// }

// export function useForgotPassword() {
//   return useMutation({ mutationFn: forgotPassword })
// }

// export function useVerifyResetOtp() {
//   return useMutation({ mutationFn: verifyResetOtp })
// }

// export function useResetPassword() {
//   return useMutation({ mutationFn: resetPassword })
// }

// export function useUpdatePassword() {
//   return useMutation({ mutationFn: updatePassword })
// }









import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  sendOtp,
  verifyOtp,
  sendPersonalInfo,
  setPassword,
  login,
  refreshToken,
  logout,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  updatePassword,
  googleSignIn,
  getOnboardingStatus,
  type OnboardingStatusResponse,
} from '../api/auth'

export const onboardingStatusQueryKey = ['onboardingStatus'] as const

export function useSendOtp() {
  return useMutation({ mutationFn: sendOtp })
}

export function useVerifyOtp() {
  return useMutation({ mutationFn: verifyOtp })
}

export function useSendPersonalInfo() {
  return useMutation({ mutationFn: sendPersonalInfo })
}

export function useSetPassword() {
  return useMutation({ mutationFn: setPassword })
}

export function useLogin() {
  return useMutation({ mutationFn: login })
}

export function useRefreshToken() {
  return useMutation({ mutationFn: refreshToken })
}

export function useLogout() {
  return useMutation({ mutationFn: logout })
}

export function useForgotPassword() {
  return useMutation({ mutationFn: forgotPassword })
}

export function useVerifyResetOtp() {
  return useMutation({ mutationFn: verifyResetOtp })
}

export function useResetPassword() {
  return useMutation({ mutationFn: resetPassword })
}

export function useUpdatePassword() {
  return useMutation({ mutationFn: updatePassword })
}

// ─── Google Sign-In ─────────────────────────────────────────────────
// POST /auth/google — body: { idToken, role }. Saves the returned
// access/refresh tokens the same way email+password login does.
export function useGoogleSignIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: googleSignIn,
    onSuccess: () => {
      // A brand-new or newly-linked account may have a different
      // onboarding status than whatever was cached before — refetch it.
      queryClient.invalidateQueries({ queryKey: onboardingStatusQueryKey })
    },
  })
}

// ─── Onboarding status ──────────────────────────────────────────────
// GET /auth/onboarding-status — only fetch once a token exists.
export function useOnboardingStatus(enabled: boolean = true) {
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token')

  return useQuery<OnboardingStatusResponse, Error>({
    queryKey: onboardingStatusQueryKey,
    queryFn: getOnboardingStatus,
    enabled: enabled && isLoggedIn,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

// Prefetch helper for router loaders / imperative checks (e.g. right
// after a Google sign-in mutation resolves, before the next render).
export function prefetchOnboardingStatus(queryClient: QueryClient) {
  return queryClient.fetchQuery({
    queryKey: onboardingStatusQueryKey,
    queryFn: getOnboardingStatus,
  })
}