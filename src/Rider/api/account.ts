import { describeToken } from "../lib/driverSession";

const API_BASE = "https://backend-production-01de.up.railway.app";

/**
 * Logged-in driver account calls. Uses plain fetch with the driver's login
 * token ("token" in localStorage), NOT lib/apiClient.ts — that client
 * refreshes/clears the session through the passenger /auth/* endpoints.
 */
export async function driverFetch(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  fallbackMessage: string,
  body?: unknown,
): Promise<any> {
  const token = localStorage.getItem("token");
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  // TEMP DEBUG LOGGING — shows whether the stored token is the right one.
  console.log(`[account] token for ${method} ${path}:`, describeToken(token));

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      // FormData: let the browser set the multipart boundary itself.
      ...(body !== undefined && !isForm
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined
      ? { body: isForm ? (body as FormData) : JSON.stringify(body) }
      : {}),
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  // TEMP DEBUG LOGGING — remove once the response shapes are confirmed.
  console.log(`[account] ${method} ${path}`, { status: res.status, body: data });

  if (!res.ok) {
    const msg = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message || data?.error;
    const err: Error & { code?: string; status?: number } = new Error(
      res.status === 401
        ? "Your session has expired. Please sign in again."
        : msg || `${fallbackMessage} (${res.status})`,
    );
    err.code = typeof data?.code === "string" ? data.code : undefined;
    err.status = res.status;
    throw err;
  }

  return data;
}

export interface MessageResponse {
  message?: string;
  [key: string]: any;
}

/* ------------------------------ Email change ------------------------------ */

/** POST /ride-drivers/email/change — sends an OTP to the new email. */
export const requestEmailChange = (payload: { newEmail: string }) =>
  driverFetch(
    "/ride-drivers/email/change",
    "POST",
    "Failed to send verification code",
    payload,
  ) as Promise<MessageResponse>;

/** POST /ride-drivers/email/change/verify */
export const verifyEmailChange = (payload: { otp: string }) =>
  driverFetch(
    "/ride-drivers/email/change/verify",
    "POST",
    "Failed to verify code",
    payload,
  ) as Promise<MessageResponse>;

/** POST /ride-drivers/email/change/resend */
export const resendEmailChange = () =>
  driverFetch(
    "/ride-drivers/email/change/resend",
    "POST",
    "Failed to resend code",
  ) as Promise<MessageResponse>;

/* ------------------------------ Phone change ------------------------------ */

/** POST /ride-drivers/phone/change — sends an OTP to the new number. */
export const requestPhoneChange = (payload: { newPhoneNumber: string }) =>
  driverFetch(
    "/ride-drivers/phone/change",
    "POST",
    "Failed to send verification code",
    payload,
  ) as Promise<MessageResponse>;

/** POST /ride-drivers/phone/change/verify */
export const verifyPhoneChange = (payload: { otp: string }) =>
  driverFetch(
    "/ride-drivers/phone/change/verify",
    "POST",
    "Failed to verify code",
    payload,
  ) as Promise<MessageResponse>;

/** POST /ride-drivers/phone/change/resend */
export const resendPhoneChange = () =>
  driverFetch(
    "/ride-drivers/phone/change/resend",
    "POST",
    "Failed to resend code",
  ) as Promise<MessageResponse>;

/* ----------------------------- Change password ---------------------------- */

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** POST /ride-drivers/change-password — for logged-in drivers. */
export const changeRideDriverPassword = (payload: ChangePasswordPayload) =>
  driverFetch(
    "/ride-drivers/change-password",
    "POST",
    "Failed to change password",
    payload,
  ) as Promise<MessageResponse>;

/* -------------------------- Notification preferences ---------------------- */

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
}

/** GET /ride-drivers/notification-preferences */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const body = await driverFetch(
    "/ride-drivers/notification-preferences",
    "GET",
    "Failed to load notification settings",
  );
  // May be the object itself or wrapped in data/preferences.
  const p = body?.data ?? body?.preferences ?? body ?? {};
  return {
    pushEnabled: !!p.pushEnabled,
    emailEnabled: !!p.emailEnabled,
  };
}

/** PATCH /ride-drivers/notification-preferences — send only what changed. */
export const updateNotificationPreferences = (
  payload: Partial<NotificationPreferences>,
) =>
  driverFetch(
    "/ride-drivers/notification-preferences",
    "PATCH",
    "Failed to update notification settings",
    payload,
  ) as Promise<MessageResponse>;
