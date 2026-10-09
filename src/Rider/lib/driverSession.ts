/**
 * Driver login session helpers.
 *
 * The driver app keeps its access token in localStorage "token" (the key every
 * Rider api file reads). The refresh token goes in its own key so the
 * passenger apiClient (which refreshes through /auth/refresh) never picks it up.
 */

const pickString = (...vals: unknown[]): string | undefined =>
  vals.find((v): v is string => typeof v === "string" && v.length > 0);

/** POST /ride-drivers/login can return the tokens in a few different shapes. */
export function extractLoginTokens(data: any): {
  accessToken?: string;
  refreshToken?: string;
} {
  const roots = [data, data?.data];
  let accessToken: string | undefined;
  let refreshToken: string | undefined;

  for (const r of roots) {
    if (!r) continue;
    accessToken ??= pickString(
      r.tokens?.accessToken,
      r.accessToken,
      r.token,
      r.access_token,
      r.tokens?.token,
    );
    refreshToken ??= pickString(
      r.tokens?.refreshToken,
      r.refreshToken,
      r.refresh_token,
    );
  }
  return { accessToken, refreshToken };
}

/** Replace any old session (passenger/fleet/stale driver) with this login. */
export function saveDriverSession(data: any): boolean {
  const { accessToken, refreshToken } = extractLoginTokens(data);

  // TEMP DEBUG LOGGING — remove once login is confirmed working.
  console.log("[login] response keys:", Object.keys(data ?? {}), {
    foundAccessToken: !!accessToken,
    foundRefreshToken: !!refreshToken,
    tokenInfo: describeToken(accessToken),
  });

  if (!accessToken) return false;

  localStorage.removeItem("refreshToken"); // passenger refresh token, if any
  localStorage.setItem("token", accessToken);
  if (refreshToken) localStorage.setItem("driverRefreshToken", refreshToken);
  else localStorage.removeItem("driverRefreshToken");
  return true;
}

/** Reads a JWT's claims (no verification) so failures are easy to diagnose. */
export function describeToken(token?: string | null) {
  if (!token) return "no token";
  try {
    const part = token.split(".")[1];
    if (!part) return "not a JWT";
    const payload = JSON.parse(
      atob(part.replace(/-/g, "+").replace(/_/g, "/")),
    );
    const exp = typeof payload.exp === "number" ? payload.exp * 1000 : null;
    return {
      role: payload.role ?? payload.type ?? payload.userType,
      expiresAt: exp ? new Date(exp).toISOString() : "no exp claim",
      expired: exp ? exp < Date.now() : undefined,
    };
  } catch {
    return "unreadable token";
  }
}
