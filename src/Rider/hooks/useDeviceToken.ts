import { useMutation } from "@tanstack/react-query";
import { registerDeviceToken, unregisterDeviceToken } from "../api/notifications";

export function useRegisterDeviceToken() {
  return useMutation({ mutationFn: registerDeviceToken });
}

export function useUnregisterDeviceToken() {
  return useMutation({ mutationFn: unregisterDeviceToken });
}
