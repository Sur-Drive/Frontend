import { refreshToken as refreshTokenRequest } from "../api/auth";

const API_BASE = "https://backend-production-01de.up.railway.app";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function getAuthToken(): string | null {
  return localStorage.getItem("token");
}

interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  data?: unknown;

  _retry?: boolean;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = new URL(API_BASE + path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

let refreshPromise: Promise<string> | null = null;

function isAuthEndpoint(path: string): boolean {
  return path.startsWith("/auth/refresh") || path.startsWith("/auth/login");
}

function getRefreshAccessToken(): string | null {
  return localStorage.getItem("refreshToken");
}

async function performRefresh(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshTokenRequest()
      .then((data) => {
        const newToken =
          data.tokens?.accessToken || data.accessToken || data.token;
        if (!newToken || typeof newToken !== "string") {
          throw new Error("Refresh response did not include an access token");
        }
        return newToken;
      })
      .finally(() => {
        // Whether it succeeded or failed, the next 401 should be able
        // to start a fresh refresh attempt.
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  // Let the rest of the app know the session is gone (e.g. a listener
  // can redirect to sign-in or show the SignInModal) without every
  // page having to poll localStorage.
  window.dispatchEvent(new Event("auth:logout"));
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = getAuthToken();
  const url = buildUrl(path, options.params);

  const isFormData = options.data instanceof FormData;

  console.log(
    `[api] -> ${method} ${url}`,
    isFormData ? "[FormData]" : (options.data ?? ""),
  );

  const res = await fetch(url, {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body:
      options.data === undefined
        ? undefined
        : isFormData
          ? (options.data as FormData)
          : JSON.stringify(options.data),
  });

  if (
    res.status === 401 &&
    !options._retry &&
    !isAuthEndpoint(path) &&
    getRefreshAccessToken()
  ) {
    try {
      console.log("[api] 401 received, attempting silent token refresh...");
      await performRefresh();
      return request<T>(method, path, { ...options, _retry: true });
    } catch (refreshError) {
      console.log("[api] token refresh failed, clearing session", refreshError);
      clearSession();
    }
  }

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    console.log(`[api] x ${method} ${url} -> ${res.status}`, body);

    if (res.status === 401 && !isAuthEndpoint(path)) {
      clearSession();
    }

    const rawMessage = body?.message ?? body?.error;
    const errorMessage = Array.isArray(rawMessage)
      ? rawMessage.join("; ")
      : rawMessage || `Request failed with status ${res.status}`;

    throw new ApiError(errorMessage, res.status, body);
  }

  console.log(`[api] ok ${method} ${url} -> ${res.status}`, body);

  return body as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, options),
  post: <T>(
    path: string,
    data?: unknown,
    options?: Omit<RequestOptions, "data">,
  ) => request<T>("POST", path, { ...options, data }),
  put: <T>(
    path: string,
    data?: unknown,
    options?: Omit<RequestOptions, "data">,
  ) => request<T>("PUT", path, { ...options, data }),
  patch: <T>(
    path: string,
    data?: unknown,
    options?: Omit<RequestOptions, "data">,
  ) => request<T>("PATCH", path, { ...options, data }),
  delete: <T>(
    path: string,
    data?: unknown,
    options?: Omit<RequestOptions, "data">,
  ) => request<T>("DELETE", path, { ...options, data }),
};
