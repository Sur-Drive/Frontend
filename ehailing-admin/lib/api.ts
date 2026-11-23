import {
  NETWORK_ERROR_MESSAGE,
  apiBaseUrl,
  backendMessage,
  clearSession,
  getToken,
} from "./auth";

// Thrown by apiFetch for non-OK responses: `message` carries the backend's
// `message` field (or a fallback), `status` the HTTP status code.
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Concurrent 401s must trigger only one full-page redirect; never reset
// because the navigation reloads the page.
let redirecting = false;

// Every backend request goes through here: prepends NEXT_PUBLIC_API_URL, sends
// JSON, attaches the session token when one exists, parses the body safely and
// throws the backend `message` on non-OK responses. On 401 the session is
// cleared and the browser returns to /signin.
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const url = `${apiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch (error) {
    if (error instanceof TypeError) throw new Error(NETWORK_ERROR_MESSAGE);
    throw error;
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
      // Full-page navigation is intentional (apiFetch has no router; the
      // reload wipes expired in-memory state). Browser only: no `window`
      // during SSR. The absolute URL satisfies
      // @next/next/no-location-assign-relative-destination.
      if (typeof window !== "undefined" && !redirecting) {
        redirecting = true;
        window.location.assign(new URL("/signin", window.location.origin).href);
      }
    }
    throw new ApiError(
      backendMessage(data) ??
        (response.status === 401
          ? "Your session has expired. Please sign in again."
          : "Request failed. Please try again."),
      response.status,
    );
  }

  return data as T;
}