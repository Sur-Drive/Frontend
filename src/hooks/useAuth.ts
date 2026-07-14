// import { useMutation } from '@tanstack/react-query'
// import { sendOtp, verifyOtp, sendPersonalInfo, setPassword, login } from '../api/auth'

// export function useSendOtp() {
//   return useMutation({
//     mutationFn: sendOtp,
//   })
// }

// export function useVerifyOtp() {
//   return useMutation({
//     mutationFn: verifyOtp,
//   })
// }

// export function useSendPersonalInfo() {
//   return useMutation({
//     mutationFn: sendPersonalInfo,
//   })
// }

// export function useSetPassword() {
//   return useMutation({
//     mutationFn: setPassword,
//   })
// }

// export function useLogin() {
//   return useMutation({
//     mutationFn: login,
//   })
// }




import { useMutation } from '@tanstack/react-query'
import {
  sendOtp,
  verifyOtp,
  sendPersonalInfo,
  setPassword,
  login,
  refreshToken,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from '../api/auth'

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

export function useForgotPassword() {
  return useMutation({ mutationFn: forgotPassword })
}

export function useVerifyResetOtp() {
  return useMutation({ mutationFn: verifyResetOtp })
}

export function useResetPassword() {
  return useMutation({ mutationFn: resetPassword })
}