import { useMutation } from '@tanstack/react-query'
import { sendOtp, verifyOtp, sendPersonalInfo, setPassword, login } from '../api/auth'

export function useSendOtp() {
  return useMutation({
    mutationFn: sendOtp,
  })
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: verifyOtp,
  })
}

export function useSendPersonalInfo() {
  return useMutation({
    mutationFn: sendPersonalInfo,
  })
}

export function useSetPassword() {
  return useMutation({
    mutationFn: setPassword,
  })
}

export function useLogin() {
  return useMutation({
    mutationFn: login,
  })
}