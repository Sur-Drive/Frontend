import {
  passengerApi,
} from "./passengerClient";

import {
  passengerSession,
} from "./passengerSession";

export interface SendOtpPayload {
  identifier: string;
}

export interface VerifyOtpPayload {
  identifier: string;
  otp: string;
}

export interface PersonalInfoPayload {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
}

export interface GoogleAuthPayload {
  idToken: string;
}

export interface ChangeEmailPayload {
  newEmail: string;
}

export interface ChangePhonePayload {
  newPhoneNumber: string;
}

export interface VerifyChangePayload {
  otp: string;
}

export interface AuthResponse {
  message?: string;

  token?: string;

  accessToken?: string;

  refreshToken?: string;

  tempToken?: string;

  tokens?: {
    accessToken?: string;
    refreshToken?: string;
  };

  data?: any;

  user?: any;

  [key: string]: any;
}

function findTokens(
  response: AuthResponse,
) {
  const accessToken =
    response.tokens?.accessToken ??
    response.accessToken ??
    response.token ??
    response.data?.accessToken ??
    response.data?.token;

  const refreshToken =
    response.tokens?.refreshToken ??
    response.refreshToken ??
    response.data?.refreshToken;

  const tempToken =
    response.tempToken ??
    response.data?.tempToken;

  return {
    accessToken,
    refreshToken,
    tempToken,
  };
}

function saveAuthResponse(
  response: AuthResponse,
) {
  const {
    accessToken,
    refreshToken,
    tempToken,
  } = findTokens(response);

  if (accessToken) {
    passengerSession.setAccessToken(
      accessToken,
    );
  }

  if (refreshToken) {
    passengerSession.setRefreshToken(
      refreshToken,
    );
  }

  if (tempToken) {
    passengerSession.setTempToken(
      tempToken,
    );
  }

  return response;
}

export async function sendPassengerOtp(
  payload: SendOtpPayload,
) {
  passengerSession.setIdentifier(
    payload.identifier,
  );

  return passengerApi.post<AuthResponse>(
    "/riders/send-otp",
    {
      identifier:
        payload.identifier,

      role: "rider",
    },
    {
      skipAuth: true,
    },
  );
}

export async function verifyPassengerOtp(
  payload: VerifyOtpPayload,
) {
  const response =
    await passengerApi.post<AuthResponse>(
      "/riders/verify-otp",
      payload,
      {
        skipAuth: true,
      },
    );

  return saveAuthResponse(response);
}

export async function setPassengerPersonalInfo(
  payload: PersonalInfoPayload,
) {
  const response =
    await passengerApi.patch<AuthResponse>(
      "/riders/personal-info",
      payload,
    );

  saveAuthResponse(response);

  return response;
}

export function getPassengerOnboardingStatus() {
  return passengerApi.get<any>(
    "/riders/onboarding-status",
  );
}

export async function passengerGoogleAuth(
  payload: GoogleAuthPayload,
) {
  const response =
    await passengerApi.post<AuthResponse>(
      "/riders/google",
      {
        idToken: payload.idToken,
        role: "rider",
      },
      {
        skipAuth: true,
      },
    );

  passengerSession.setIdentifier(
    response?.user?.email ??
      response?.data?.user?.email ??
      "",
  );

  return saveAuthResponse(response);
}

export function requestPassengerEmailChange(
  newEmail: string,
) {
  return passengerApi.post(
    "/riders/email/change",
    {
      newEmail,
    },
  );
}

export function verifyPassengerEmailChange(
  otp: string,
) {
  return passengerApi.post(
    "/riders/email/change/verify",
    {
      otp,
    },
  );
}

export function resendPassengerEmailChangeOtp() {
  return passengerApi.post(
    "/riders/email/change/resend",
    {},
  );
}

export function requestPassengerPhoneChange(
  newPhoneNumber: string,
) {
  return passengerApi.post(
    "/riders/phone/change",
    {
      newPhoneNumber,
    },
  );
}

export function verifyPassengerPhoneChange(
  otp: string,
) {
  return passengerApi.post(
    "/riders/phone/change/verify",
    {
      otp,
    },
  );
}

export function resendPassengerPhoneChangeOtp() {
  return passengerApi.post(
    "/riders/phone/change/resend",
    {},
  );
}

export async function logoutPassenger() {
  try {
    await passengerApi.post(
      "/riders/logout",
      {},
    );
  } finally {
    passengerSession.clear();

    window.dispatchEvent(
      new Event(
        "passenger:logout",
      ),
    );
  }
}