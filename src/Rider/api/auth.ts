const API_BASE = "https://backend-production-01de.up.railway.app";

async function parseResponse(res: Response, fallbackMessage: string) {
  const responseText = await res.text();

  if (!res.ok) {
    let errorData: any = {};
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = { raw: responseText };
    }
    throw new Error(
      errorData.message ||
        errorData.error ||
        `${fallbackMessage} (${res.status})`,
    );
  }

  return responseText ? JSON.parse(responseText) : {};
}

export interface RideDriverSendOtpPayload {
  email: string;
  phoneNumber: string;
  location: string;
}

export interface RideDriverSendOtpResponse {
  message: string;
  userId?: string;
  [key: string]: any;
}

export async function sendRideDriverOtp(
  payload: RideDriverSendOtpPayload,
): Promise<RideDriverSendOtpResponse> {
  const res = await fetch(`${API_BASE}/ride-drivers/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse(res, "Failed to send OTP");
}

export interface RideDriverVerifyOtpPayload {
  userId: string;
  otp: string;
}

export interface RideDriverVerifyOtpResponse {
  message: string;
  [key: string]: any;
}

export async function verifyRideDriverOtp(
  payload: RideDriverVerifyOtpPayload,
): Promise<RideDriverVerifyOtpResponse> {
  const res = await fetch(`${API_BASE}/ride-drivers/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse(res, "Failed to verify OTP");
}

export interface RideDriverPersonalInfoPayload {
  userId: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string; // YYYY-MM-DD
  nin: string;
}

export interface RideDriverPersonalInfoResponse {
  message: string;
  [key: string]: any;
}

export async function submitRideDriverPersonalInfo(
  payload: RideDriverPersonalInfoPayload,
): Promise<RideDriverPersonalInfoResponse> {
  const res = await fetch(`${API_BASE}/ride-drivers/personal`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse(res, "Failed to save personal information");
}
