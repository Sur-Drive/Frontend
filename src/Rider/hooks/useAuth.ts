import { useMutation } from "@tanstack/react-query";
import {
  sendRideDriverOtp,
  verifyRideDriverOtp,
  submitRideDriverPersonalInfo,
  loginRideDriver,
  forgotRideDriverPassword,
  verifyRideDriverForgotPasswordOtp,
  resetRideDriverPassword,
} from "../api/auth";

export function useSendRideDriverOtp() {
  return useMutation({ mutationFn: sendRideDriverOtp });
}

export function useVerifyRideDriverOtp() {
  return useMutation({ mutationFn: verifyRideDriverOtp });
}

export function useSubmitRideDriverPersonalInfo() {
  return useMutation({ mutationFn: submitRideDriverPersonalInfo });
}

export function useLoginRideDriver() {
  return useMutation({ mutationFn: loginRideDriver });
}

export function useForgotRideDriverPassword() {
  return useMutation({ mutationFn: forgotRideDriverPassword });
}

export function useVerifyRideDriverForgotPasswordOtp() {
  return useMutation({ mutationFn: verifyRideDriverForgotPasswordOtp });
}

export function useResetRideDriverPassword() {
  return useMutation({ mutationFn: resetRideDriverPassword });
}
