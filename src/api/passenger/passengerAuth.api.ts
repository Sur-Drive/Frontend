import {
  passengerApi,
} from "./passengerClient";

import {
  passengerSession,
} from "./passengerSession";

import type {
  PassengerGoogleAuthResponse,
  PassengerOnboardingStatusResponse,
  PassengerPersonalInfoRequest,
  PassengerPersonalInfoResponse,
  PassengerVerifyOtpResponse,
  SendPassengerOtpRequest,
  SendPassengerOtpResponse,
  VerifyPassengerOtpRequest,
} from "./passengerAuth.types";

/* =========================================================
   API
========================================================= */

export const passengerAuthApi = {
  /* =======================================================
     SEND OTP
  ======================================================= */

  async sendOtp(
    payload: SendPassengerOtpRequest,
  ) {
    const identifier =
      payload.identifier.trim();

    if (!identifier) {
      throw new Error(
        "Email address or phone number is required.",
      );
    }

    /*
     * We're beginning a new authentication attempt.
     *
     * Remove stale auth/onboarding tokens so they cannot
     * accidentally affect the OTP flow.
     */
    passengerSession.clearAuthTokens();

    passengerSession.setIdentifier(
      identifier,
    );

    return passengerApi.post<
      SendPassengerOtpResponse
    >(
      "/riders/send-otp",
      {
        identifier,
        role: "rider",
      },
      {
        authMode: "none",
      },
    );
  },

  /* =======================================================
     VERIFY OTP
  ======================================================= */

  async verifyOtp(
    payload: VerifyPassengerOtpRequest,
  ): Promise<PassengerVerifyOtpResponse> {
    const identifier =
      payload.identifier.trim();

    const otp =
      payload.otp.trim();

    if (!identifier) {
      throw new Error(
        "Your email address or phone number is missing.",
      );
    }

    if (!otp) {
      throw new Error(
        "Enter the verification code.",
      );
    }

    const response =
      await passengerApi.post<
        PassengerVerifyOtpResponse
      >(
        "/riders/verify-otp",
        {
          identifier,
          otp,
        },
        {
          authMode: "none",
        },
      );

    passengerSession.setIdentifier(
      response.user?.identifier ||
        identifier,
    );

    /*
     * ================================================
     * EXISTING PASSENGER
     * ================================================
     *
     * The actual backend response contains:
     *
     * tokens.accessToken
     * tokens.refreshToken
     *
     * when the passenger already has a completed
     * account.
     */
    if (
      response.tokens?.accessToken &&
      response.tokens?.refreshToken
    ) {
      passengerSession.setTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken,
      );

      return response;
    }

    /*
     * ================================================
     * NEW / INCOMPLETE PASSENGER
     * ================================================
     *
     * For a new passenger we have observed the
     * onboarding JWT at:
     *
     * user.accessToken
     *
     * That token is used for /riders/personal-info.
     */
    if (
      response.requiresPersonalInfo
    ) {
      const onboardingToken =
        response.user?.accessToken;

      if (!onboardingToken) {
        throw new Error(
          "Verification succeeded, but the onboarding session was not returned.",
        );
      }

      passengerSession.setTempToken(
        onboardingToken,
      );

      return response;
    }

    /*
     * If verification says onboarding is finished but
     * provides no normal session, we should NOT guess.
     */
    if (
      response.user
        ?.hasCompletedOnboarding
    ) {
      throw new Error(
        "Your account was verified, but the server did not return a login session. Please try again.",
      );
    }

    throw new Error(
      "Unable to determine your account status after verification.",
    );
  },

  /* =======================================================
     PERSONAL INFO
  ======================================================= */

  async setPersonalInfo(
    payload: PassengerPersonalInfoRequest,
  ): Promise<PassengerPersonalInfoResponse> {
    const onboardingToken =
      passengerSession.getTempToken();

    if (!onboardingToken) {
      throw new Error(
        "Your verification session has expired. Please verify your account again.",
      );
    }

    const response =
      await passengerApi.patch<
        PassengerPersonalInfoResponse
      >(
        "/riders/personal-info",
        {
          firstName:
            payload.firstName.trim(),

          lastName:
            payload.lastName.trim(),

          gender:
            payload.gender,

          dateOfBirth:
            payload.dateOfBirth,
        },
        {
          authMode: "temp",
        },
      );

    /*
     * If the backend returns the final authenticated
     * session after personal-info, save it.
     *
     * We only promote explicit normal tokens.
     */
    if (
      response.tokens
        ?.accessToken &&
      response.tokens
        ?.refreshToken
    ) {
      passengerSession.setTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken,
      );
    } else if (
      response.accessToken &&
      response.refreshToken
    ) {
      passengerSession.setTokens(
        response.accessToken,
        response.refreshToken,
      );
    }

    return response;
  },

  /* =======================================================
     ONBOARDING STATUS
  ======================================================= */

  async onboardingStatus() {
    return passengerApi.get<
      PassengerOnboardingStatusResponse
    >(
      "/riders/onboarding-status",
      {
        authMode: "access",
      },
    );
  },

  /* =======================================================
     LOGOUT
  ======================================================= */

  async logout() {
    try {
      return await passengerApi.post(
        "/riders/logout",
        undefined,
        {
          authMode: "access",
        },
      );
    } finally {
      passengerSession.clear();
    }
  },

  /* =======================================================
     GOOGLE AUTH
  ======================================================= */
 async googleAuth(
  idToken: string,
): Promise<PassengerGoogleAuthResponse> {
  if (!idToken.trim()) {
    throw new Error(
      "Google authentication token is missing.",
    );
  }

  const response =
    await passengerApi.post<PassengerGoogleAuthResponse>(
      "/riders/google",
      {
        idToken,
        role: "rider",
      },
      {
        authMode: "none",
      },
    );

  if (response.tokens?.accessToken) {
    passengerSession.setTokens(
      response.tokens.accessToken,
      response.tokens.refreshToken,
    );

    if (response.user?.identifier) {
      passengerSession.setIdentifier(
        response.user.identifier,
      );
    }
  }

  return response;
},
};