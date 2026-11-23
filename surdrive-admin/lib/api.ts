// ---------------------------------------------------------------------------
// apiFetch — tiny fetch wrapper for the SurDrive Admin backend.
// - Base URL from NEXT_PUBLIC_API_URL (falls back to http://localhost:3000).
// - Attaches `Authorization: Bearer <accessToken>` from the accessToken cookie.
// - Parses JSON and throws an ApiError on any non-2xx response.
// ---------------------------------------------------------------------------
import { getCookie } from './cookies';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown>;
  // throws 401 (or not) — kept simple; caller decides
};

export class ApiError extends Error {
  readonly status: number;
  /**
   * Field-keyed validation messages, when the backend sends an `errors` object
   * (e.g. { firstName: "..." }). Optional — most error responses only carry a
   * message, so callers must fall back to `message`.
   */
  readonly fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Tolerant reader for a validation-error map. Accepts either a string or an
 * array of strings per field, and returns undefined when there is nothing
 * usable — the caller then keeps its plain message.
 */
function extractFieldErrors(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;

  const fieldErrors: Record<string, string> = {};
  for (const [field, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string' && value) fieldErrors[field] = value;
    else if (Array.isArray(value) && typeof value[0] === 'string' && value[0]) {
      fieldErrors[field] = value[0];
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const accessToken = getCookie('accessToken');

  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const body =
    options.body && !(options.body instanceof FormData) && !(options.body instanceof Blob)
      ? JSON.stringify(options.body)
      : (options.body as BodyInit | undefined);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    body,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let fieldErrors: Record<string, string> | undefined;
    try {
      const data: unknown = await response.json();
      if (data && typeof data === 'object') {
        const body = data as { message?: unknown; errors?: unknown };
        if (typeof body.message === 'string') message = body.message;
        fieldErrors = extractFieldErrors(body.errors);
      }
    } catch {
      // non-JSON error body — keep the fallback message
    }
    throw new ApiError(message, response.status, fieldErrors);
  }

  // Handle empty 204/2xx bodies gracefully.
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}