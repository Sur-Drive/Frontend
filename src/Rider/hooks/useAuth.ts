import { useMutation } from "@tanstack/react-query";
import {
  sendRideDriverOtp,
  verifyRideDriverOtp,
  submitRideDriverPersonalInfo,
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
