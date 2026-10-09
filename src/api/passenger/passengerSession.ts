const ACCESS_TOKEN_KEY =
  "passenger_access_token";

const REFRESH_TOKEN_KEY =
  "passenger_refresh_token";

const TEMP_TOKEN_KEY =
  "passenger_temp_token";

const IDENTIFIER_KEY =
  "passenger_identifier";

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export const passengerSession = {
  /* ======================================================
     ACCESS TOKEN
  ====================================================== */

  getAccessToken(): string | null {
    return (
      getStorage()?.getItem(
        ACCESS_TOKEN_KEY,
      ) ?? null
    );
  },

  setAccessToken(
    token: string,
  ) {
    if (!token) return;

    getStorage()?.setItem(
      ACCESS_TOKEN_KEY,
      token,
    );
  },

  removeAccessToken() {
    getStorage()?.removeItem(
      ACCESS_TOKEN_KEY,
    );
  },

  /* ======================================================
     REFRESH TOKEN
  ====================================================== */

  getRefreshToken(): string | null {
    return (
      getStorage()?.getItem(
        REFRESH_TOKEN_KEY,
      ) ?? null
    );
  },

  setRefreshToken(
    token: string,
  ) {
    if (!token) return;

    getStorage()?.setItem(
      REFRESH_TOKEN_KEY,
      token,
    );
  },

  removeRefreshToken() {
    getStorage()?.removeItem(
      REFRESH_TOKEN_KEY,
    );
  },

  /* ======================================================
     ONBOARDING TOKEN
  ====================================================== */

  getTempToken(): string | null {
    return (
      getStorage()?.getItem(
        TEMP_TOKEN_KEY,
      ) ?? null
    );
  },

  setTempToken(
    token: string,
  ) {
    if (!token) return;

    getStorage()?.setItem(
      TEMP_TOKEN_KEY,
      token,
    );
  },

  removeTempToken() {
    getStorage()?.removeItem(
      TEMP_TOKEN_KEY,
    );
  },

  /* ======================================================
     IDENTIFIER
  ====================================================== */

  getIdentifier(): string {
    return (
      getStorage()?.getItem(
        IDENTIFIER_KEY,
      ) ?? ""
    );
  },

  setIdentifier(
    identifier: string,
  ) {
    const value =
      identifier.trim();

    if (!value) return;

    getStorage()?.setItem(
      IDENTIFIER_KEY,
      value,
    );
  },

  removeIdentifier() {
    getStorage()?.removeItem(
      IDENTIFIER_KEY,
    );
  },

  /* ======================================================
     NORMAL SESSION
  ====================================================== */

 setTokens(
  accessToken: string,
  refreshToken?: string | null,
) {
  if (!accessToken) {
    return;
  }

  this.setAccessToken(
    accessToken,
  );

  /*
   * Only replace the stored refresh token when
   * the backend actually returned a new one.
   *
   * Otherwise keep the existing refresh token.
   */
  if (refreshToken) {
    this.setRefreshToken(
      refreshToken,
    );
  }

  /*
   * Once we have a normal authenticated session,
   * the onboarding token is no longer needed.
   */
  this.removeTempToken();
},

  isAuthenticated(): boolean {
    return Boolean(
      this.getAccessToken(),
    );
  },

  hasOnboardingSession(): boolean {
    return Boolean(
      this.getTempToken(),
    );
  },

  /* ======================================================
     CLEAR
  ====================================================== */

  clearAuthTokens() {
    this.removeAccessToken();
    this.removeRefreshToken();
    this.removeTempToken();
  },

  clear() {
    const storage =
      getStorage();

    if (!storage) return;

    storage.removeItem(
      ACCESS_TOKEN_KEY,
    );

    storage.removeItem(
      REFRESH_TOKEN_KEY,
    );

    storage.removeItem(
      TEMP_TOKEN_KEY,
    );

    storage.removeItem(
      IDENTIFIER_KEY,
    );
  },
};