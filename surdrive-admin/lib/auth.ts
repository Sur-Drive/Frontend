// ---------------------------------------------------------------------------
// auth — client-side auth helpers backed by the access/refresh cookies.
// login() calls POST /auth/login, stores both tokens, returns the user object.
// logout() clears both tokens. getUser() reads the session from the cookie.
// ---------------------------------------------------------------------------
import { apiFetch } from './api';
import { deleteCookie, getCookie, setCookie } from './cookies';

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

type LoginResponse = {
  user: AuthUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  requiresPersonalInfo: boolean;
  requiresPasswordSetup: boolean;
  isEmailVerified: boolean;
  isVerified: boolean;
  // + any other fields the backend returns — typed loosely here
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  // + any other fields the backend returns — typed loosely here
};

/**
 * Logs a user in: POST /auth/login, stores access + refresh tokens, returns user.
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    // Backend expects the email under the field name `identifier`.
    body: { identifier: email, password },
  });

  // TODO: wire up proper refresh flow later; for now refresh is just stored.
  setCookie(ACCESS_TOKEN_COOKIE, data.tokens.accessToken);
  setCookie(REFRESH_TOKEN_COOKIE, data.tokens.refreshToken);

  return data.user;
}

/** Clears both auth cookies. */
export function logout(): void {
  deleteCookie(ACCESS_TOKEN_COOKIE);
  deleteCookie(REFRESH_TOKEN_COOKIE);
}

/**
 * Returns true when a session exists (an access token cookie is present).
 * TODO: decode/validate the JWT and hydrate the user profile when needed.
 */
export function getUser(): AuthUser | null {
  const token = getCookie(ACCESS_TOKEN_COOKIE);
  if (!token) return null;

  // TODO: decode the JWT payload here to return the full user object.
  return { id: '', email: '', name: '', role: '' };
}