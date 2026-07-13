import { useMutation } from '@tanstack/react-query'
import { sendOtp, type SendOtpPayload, type SendOtpResponse } from '../api/auth'

export function useSendOtp() {
  return useMutation<SendOtpResponse, Error, SendOtpPayload>({
    mutationFn: sendOtp,
  })
}