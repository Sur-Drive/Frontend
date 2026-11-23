// ---------------------------------------------------------------------------
// accounts — admin account self-service endpoints (Settings page).
// GET    /users/profile         — read the logged-in user's own profile.
// PATCH  /users/profile         — update the logged-in user's names.
// POST   /auth/change-password  — change password while logged in.
// ---------------------------------------------------------------------------
import { apiFetch } from './api';

const PROFILE_ENDPOINT = '/users/profile';

const CHANGE_PASSWORD_ENDPOINT = '/auth/change-password';

/**
 * The profile payload the update endpoint returns. Note there is deliberately
 * NO email field — the API does not expose one here (email is login identity,
 * and the Settings UI email input stays disabled until backend says otherwise).
 * gender/dateOfBirth/occupation arrive here too but have no UI field; they are
 * never sent in requests (the UI can only edit first/last name today).
 */
export type AdminProfile = {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  occupation: string;
  phoneNumber: string;
  role: string;
  isPhoneVerified: boolean;
  hasCompletedOnboarding: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Only what the UI can actually edit today — do not widen without a UI field. */
export type UpdateProfileInput = {
  firstName: string;
  lastName: string;
};

/**
 * GET the logged-in user's own profile. No body and no params — the bearer
 * token identifies the user. This is the read side of the Settings page: the
 * context hydrates from it on mount so a saved update survives a reload.
 */
export function getMyProfile(): Promise<AdminProfile> {
  return apiFetch<AdminProfile>(PROFILE_ENDPOINT, { method: 'GET' });
}

/** PATCH the profile — returns the full (read-only) profile on success. */
export function updateProfile(input: UpdateProfileInput): Promise<AdminProfile> {
  return apiFetch<AdminProfile>(PROFILE_ENDPOINT, {
    method: 'PATCH',
    body: input,
  });
}

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

/** The change-password response is just a confirmation message. */
export type ChangePasswordResponse = {
  message: string;
};

/** POST the password change — a wrong current password surfaces in ApiError.message. */
export function changePassword(input: ChangePasswordInput): Promise<ChangePasswordResponse> {
  return apiFetch<ChangePasswordResponse>(CHANGE_PASSWORD_ENDPOINT, {
    method: 'POST',
    body: input,
  });
}
