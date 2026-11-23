import type {
  AdminUser,
  LoginResult,
  RequestPasswordResetInput,
  VerifyOtpInput,
} from "@/types/auth";

// Only the password-reset and OTP flows are still unconnected (their endpoints
// are not confirmed yet). Every stub below rejects with this same message so
// the UI can surface the wiring gap without inventing an endpoint.
export const AUTH_NOT_CONNECTED_MESSAGE =
  "Authentication backend not connected yet.";

// This module owns the session cookies and the API base URL; lib/api.ts imports
// them from here so the fetch layer stays a single thin dependency (no cycle).
export const NETWORK_ERROR_MESSAGE =
  "Can't reach the server. Check your connection.";

export function apiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  return base.replace(/\/+$/, "");
}

// Pulls the backend's `message` field out of an unknown JSON body, if present.
export function backendMessage(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null || !("message" in data)) {
    return undefined;
  }
  const message = (data as { message?: unknown }).message;
  return typeof message === "string" && message ? message : undefined;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Tokens live in cookies (never localStorage) so proxy.ts can read them.
const ACCESS_TOKEN_COOKIE = "accessToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";

// The signed-in admin's email, kept in localStorage (never rendered) so the
// RBAC UI can guard self-mutations without a /me endpoint. Set at login from
// the login response user; cleared with the session on logout/401.
const CURRENT_USER_EMAIL_KEY = "surdrive.currentUserEmail";

export function getCurrentUserEmail(): string | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_EMAIL_KEY);
    return raw && raw.trim() ? raw.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

function secureSuffix(): string {
  // Browser-only guard: `location` does not exist during SSR.
  return typeof location !== "undefined" && location.protocol === "https:"
    ? "; Secure"
    : "";
}

function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; Path=/; SameSite=Lax${secureSuffix()}`;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const row = document.cookie
    .split("; ")
    .find((candidate) => candidate.startsWith(`${name}=`));
  return row ? row.slice(name.length + 1) : null;
}

export function setSession(tokens: AuthTokens): void {
  writeCookie(ACCESS_TOKEN_COOKIE, tokens.accessToken);
  writeCookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken);
}

export function getToken(): string | null {
  return readCookie(ACCESS_TOKEN_COOKIE);
}

export function clearSession(): void {
  if (typeof document === "undefined") return;
  const expire = `Path=/; Max-Age=0; SameSite=Lax${secureSuffix()}`;
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; ${expire}`;
  document.cookie = `${REFRESH_TOKEN_COOKIE}=; ${expire}`;
  try {
    localStorage.removeItem(CURRENT_USER_EMAIL_KEY);
  } catch {
    /* storage unavailable — session cookies already cleared */
  }
}

// POST /auth/login — the only confirmed auth endpoint. Deliberately not routed
// through apiFetch: a 401 here means "wrong credentials", not "expired
// session", so it surfaces the backend message instead of redirecting.
export async function login(
  identifier: string,
  password: string,
): Promise<AdminUser> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
  } catch (error) {
    if (error instanceof TypeError) throw new Error(NETWORK_ERROR_MESSAGE);
    throw error;
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(backendMessage(data) ?? "Login failed");
  const { user, tokens } = data as { user: AdminUser; tokens: AuthTokens };
  setSession(tokens);
  try {
    if (user?.email?.trim()) {
      localStorage.setItem(CURRENT_USER_EMAIL_KEY, user.email.trim().toLowerCase());
    }
  } catch {
    /* storage unavailable — guard falls back to allowing backend to decide */
  }
  return user;
}

export async function requestPasswordReset(
  input: RequestPasswordResetInput,
): Promise<void> {
  void input;
  throw new Error(AUTH_NOT_CONNECTED_MESSAGE);
}

export async function verifyOtp(input: VerifyOtpInput): Promise<LoginResult> {
  void input;
  throw new Error(AUTH_NOT_CONNECTED_MESSAGE);
}

export async function resendOtp(): Promise<void> {
  throw new Error(AUTH_NOT_CONNECTED_MESSAGE);
}

