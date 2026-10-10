import { driverFetch } from "./account";

export type DevicePlatform = "android" | "ios" | "web";

/** POST /notifications/device-token {token, platform} */
export const registerDeviceToken = (payload: {
  token: string;
  platform?: DevicePlatform;
}) =>
  driverFetch(
    "/notifications/device-token",
    "POST",
    "Failed to register device",
    { token: payload.token, platform: payload.platform ?? "android" },
  );

/** DELETE /notifications/device-token {token} — call on sign-out. */
export const unregisterDeviceToken = (payload: { token: string }) =>
  driverFetch(
    "/notifications/device-token",
    "DELETE",
    "Failed to unregister device",
    { token: payload.token },
  );
