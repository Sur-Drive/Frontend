export interface SendPassengerOtpRequest {
  identifier: string;
  role?: "rider";
}

export interface SendPassengerOtpResponse {
  message: string;
  identifier: string;
  method: "email" | "phone" | string;
}

export interface VerifyPassengerOtpRequest {
  identifier: string;
  otp: string;
}

export interface PassengerPersonalInfoRequest {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
}

export interface PassengerAuthUser {
  id: string;
  identifier: string;
  authMethod: string;

  googleId: string | null;

  phoneNumber: string | null;
  email: string | null;

  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  occupation: string | null;

  isPhoneVerified: boolean;
  isEmailVerified: boolean;

  hasCompletedOnboarding: boolean;

  role: string;
  isActive: boolean;

  deviceTokens?: unknown[];
  notificationPreferences?: unknown;

  createdAt?: string;
  updatedAt?: string;

  profilePicture: string | null;
  profilePicturePublicId?: string | null;

  lastLoginAt?: string | null;
  lastLoginIp?: string | null;

  metadata?: unknown;
  driverProfile?: unknown;

  /**
   * For a NEW passenger the backend has been observed
   * returning the onboarding JWT here.
   */
  accessToken?: string;
}

export interface PassengerAuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * The backend has two important verify-OTP outcomes.
 *
 * NEW PASSENGER:
 * - requiresPersonalInfo = true
 * - user.accessToken = onboarding token
 * - tokens may be absent
 *
 * EXISTING PASSENGER:
 * - requiresPersonalInfo = false
 * - user.hasCompletedOnboarding = true
 * - tokens.accessToken + tokens.refreshToken
 */
export interface PassengerVerifyOtpResponse {
  user: PassengerAuthUser;

  tokens?: PassengerAuthTokens;

  requiresPersonalInfo: boolean;
  requiresPasswordSetup: boolean;

  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isVerified: boolean;
}

/**
 * The exact /riders/personal-info response still needs to be
 * matched to the backend response once observed.
 *
 * These optional fields allow us to safely accept tokens if the
 * backend returns them without inventing that it definitely does.
 */
export interface PassengerPersonalInfoResponse {
  message?: string;

  user?: PassengerAuthUser;

  tokens?: PassengerAuthTokens;

  accessToken?: string;
  refreshToken?: string;

  requiresPersonalInfo?: boolean;
  hasCompletedOnboarding?: boolean;

  [key: string]: unknown;
}

export interface PassengerOnboardingStatusResponse {
  hasCompletedOnboarding?: boolean;
  requiresPersonalInfo?: boolean;

  user?: PassengerAuthUser;

  [key: string]: unknown;
}

export interface PassengerGoogleAuthResponse {
  user: {
    id: string;
    identifier: string;
    email: string | null;
    phoneNumber: string | null;
    firstName: string | null;
    lastName: string | null;
    hasCompletedOnboarding: boolean;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  } | null;
  isNewUser: boolean;
  requiresPersonalInfo: boolean;
}