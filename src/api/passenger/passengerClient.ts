import {
  passengerSession,
} from "./passengerSession";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

if (!API_BASE_URL) {
  throw new Error(
    "VITE_API_URL is missing. Add it to your .env file.",
  );
}

/* =========================================================
   TYPES
========================================================= */

export type PassengerAuthMode =
  | "none"
  | "temp"
  | "access"
  | "refresh";

export interface PassengerRequestOptions {
  params?: Record<
    string,
    | string
    | number
    | boolean
    | undefined
    | null
  >;

  data?: unknown;

  /**
   * Explicit token override.
   *
   * Mainly useful internally when retrying a request
   * after refreshing the access token.
   */
  token?: string | null;

  /**
   * Preferred new API.
   */
  authMode?: PassengerAuthMode;

  /**
   * Kept for compatibility with existing passenger API files.
   *
   * skipAuth=true is equivalent to authMode="none".
   */
  skipAuth?: boolean;

  retry?: boolean;
}

/* =========================================================
   API ERROR
========================================================= */

export class PassengerApiError extends Error {
  status: number;
  body: unknown;

  constructor(
    message: string,
    status: number,
    body: unknown,
  ) {
    super(message);

    this.name = "PassengerApiError";
    this.status = status;
    this.body = body;
  }
}

/* =========================================================
   URL
========================================================= */

function buildUrl(
  path: string,
  params?: PassengerRequestOptions["params"],
) {
  const normalizedPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  const url = new URL(
    `${API_BASE_URL}${normalizedPath}`,
  );

  if (params) {
    Object.entries(params).forEach(
      ([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          url.searchParams.set(
            key,
            String(value),
          );
        }
      },
    );
  }

  return url.toString();
}

/* =========================================================
   RESPONSE HELPERS
========================================================= */

function extractErrorMessage(
  body: unknown,
  status: number,
) {
  if (
    body &&
    typeof body === "object"
  ) {
    const record =
      body as Record<
        string,
        unknown
      >;

    const message =
      record.message ??
      record.error ??
      record.detail;

    if (Array.isArray(message)) {
      return message
        .map(String)
        .join("; ");
    }

    if (
      typeof message === "string"
    ) {
      return message;
    }
  }

  if (
    typeof body === "string" &&
    body.trim()
  ) {
    return body;
  }

  return `Request failed with status ${status}`;
}

async function parseBody(
  response: Response,
): Promise<unknown> {
  const text =
    await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/* =========================================================
   TOKEN HELPERS
========================================================= */

function resolveAuthMode(
  options: PassengerRequestOptions,
): PassengerAuthMode {
  if (options.skipAuth) {
    return "none";
  }

  return (
    options.authMode ??
    "access"
  );
}

function resolveToken(
  authMode: PassengerAuthMode,
): string | null {
  switch (authMode) {
    case "none":
      return null;

    case "temp":
      return passengerSession.getTempToken();

    case "refresh":
      return passengerSession.getRefreshToken();

    case "access":
    default:
      return passengerSession.getAccessToken();
  }
}

function getString(
  value: unknown,
): string | null {
  return typeof value === "string" &&
    value.trim()
    ? value
    : null;
}

function getNestedObject(
  value: unknown,
): Record<string, unknown> | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  return value as Record<
    string,
    unknown
  >;
}

function extractRefreshTokens(
  body: unknown,
) {
  const root =
    getNestedObject(body);

  const data =
    getNestedObject(
      root?.data,
    );

  const rootTokens =
    getNestedObject(
      root?.tokens,
    );

  const dataTokens =
    getNestedObject(
      data?.tokens,
    );

  const user =
    getNestedObject(
      root?.user,
    );

  const dataUser =
    getNestedObject(
      data?.user,
    );

  const accessToken =
    getString(
      rootTokens?.accessToken,
    ) ??
    getString(
      dataTokens?.accessToken,
    ) ??
    getString(
      root?.accessToken,
    ) ??
    getString(
      data?.accessToken,
    ) ??
    getString(
      root?.token,
    ) ??
    getString(
      data?.token,
    ) ??
    getString(
      user?.accessToken,
    ) ??
    getString(
      dataUser?.accessToken,
    );

  const refreshToken =
    getString(
      rootTokens?.refreshToken,
    ) ??
    getString(
      dataTokens?.refreshToken,
    ) ??
    getString(
      root?.refreshToken,
    ) ??
    getString(
      data?.refreshToken,
    );

  return {
    accessToken,
    refreshToken,
  };
}

/* =========================================================
   REFRESH
========================================================= */

let refreshPromise:
  | Promise<string | null>
  | null = null;

async function refreshAccessToken(): Promise<
  string | null
> {
  const refreshToken =
    passengerSession.getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response =
          await fetch(
            buildUrl(
              "/riders/refresh",
            ),
            {
              method: "POST",

              headers: {
                Accept:
                  "application/json",

                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${refreshToken}`,
              },

              body:
                JSON.stringify({}),
            },
          );

        const body =
          await parseBody(
            response,
          );

        if (!response.ok) {
          passengerSession.clear();

          window.dispatchEvent(
            new Event(
              "passenger:unauthorized",
            ),
          );

          return null;
        }

        const tokens =
          extractRefreshTokens(
            body,
          );

        if (!tokens.accessToken) {
          passengerSession.clear();

          window.dispatchEvent(
            new Event(
              "passenger:unauthorized",
            ),
          );

          return null;
        }

        passengerSession.setTokens(
          tokens.accessToken,
          tokens.refreshToken,
        );

        return tokens.accessToken;
      } catch (error) {
        console.error(
          "[Passenger API] Refresh failed:",
          error,
        );

        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

/* =========================================================
   REQUEST
========================================================= */

async function request<T>(
  method: string,
  path: string,
  options: PassengerRequestOptions = {},
): Promise<T> {
  const url = buildUrl(
    path,
    options.params,
  );

  const authMode =
    resolveAuthMode(options);

  const isFormData =
    options.data instanceof
    FormData;

  let requestBody:
    | BodyInit
    | undefined;

  if (
    options.data !== undefined
  ) {
    if (
      options.data instanceof
      FormData
    ) {
      requestBody =
        options.data;
    } else {
      requestBody =
        JSON.stringify(
          options.data,
        );
    }
  }

  const resolvedToken =
    options.token !== undefined
      ? options.token
      : resolveToken(authMode);

  const headers =
    new Headers();

  headers.set(
    "Accept",
    "application/json",
  );

  if (!isFormData) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  if (
    authMode !== "none" &&
    resolvedToken
  ) {
    headers.set(
      "Authorization",
      `Bearer ${resolvedToken}`,
    );
  }

  let response: Response;

  try {
    response = await fetch(
      url,
      {
        method,
        headers,
        body: requestBody,
      },
    );
  } catch (error) {
    throw new PassengerApiError(
      "Unable to connect to the server. Please check your internet connection and try again.",
      0,
      error,
    );
  }

  /*
   * Only normal ACCESS-token requests should attempt
   * refresh.
   *
   * An onboarding/temp token must NEVER be replaced by
   * the normal refresh flow.
   */
  const canAttemptRefresh =
    response.status === 401 &&
    !options.retry &&
    authMode !== "none" &&
    authMode !== "temp" &&
    authMode !== "refresh" &&
    Boolean(
      passengerSession.getRefreshToken(),
    );

  if (canAttemptRefresh) {
    const refreshedToken =
      await refreshAccessToken();

    if (refreshedToken) {
      return request<T>(
        method,
        path,
        {
          ...options,

          authMode:
            "access",

          token:
            refreshedToken,

          retry:
            true,
        },
      );
    }
  }

  const body =
    await parseBody(response);

  if (!response.ok) {
    /*
     * Don't wipe the entire passenger session when an
     * onboarding token fails.
     *
     * The UI needs to decide whether to send the user
     * back through OTP.
     */
    if (
      response.status === 401 &&
      authMode === "temp"
    ) {
      passengerSession.removeTempToken();
    }

    /*
     * For a normal authenticated session, a 401 after
     * retry means the session is no longer usable.
     */
    if (
      response.status === 401 &&
      options.retry &&
      authMode !== "temp"
    ) {
      passengerSession.clear();

      window.dispatchEvent(
        new Event(
          "passenger:unauthorized",
        ),
      );
    }

    throw new PassengerApiError(
      extractErrorMessage(
        body,
        response.status,
      ),
      response.status,
      body,
    );
  }

  return body as T;
}

/* =========================================================
   PUBLIC CLIENT
========================================================= */

export const passengerApi = {
  get<T>(
    path: string,
    options?: PassengerRequestOptions,
  ) {
    return request<T>(
      "GET",
      path,
      options,
    );
  },

  post<T>(
    path: string,
    data?: unknown,
    options?: Omit<
      PassengerRequestOptions,
      "data"
    >,
  ) {
    return request<T>(
      "POST",
      path,
      {
        ...options,
        data,
      },
    );
  },

  patch<T>(
    path: string,
    data?: unknown,
    options?: Omit<
      PassengerRequestOptions,
      "data"
    >,
  ) {
    return request<T>(
      "PATCH",
      path,
      {
        ...options,
        data,
      },
    );
  },

  put<T>(
    path: string,
    data?: unknown,
    options?: Omit<
      PassengerRequestOptions,
      "data"
    >,
  ) {
    return request<T>(
      "PUT",
      path,
      {
        ...options,
        data,
      },
    );
  },

  delete<T>(
    path: string,
    data?: unknown,
    options?: Omit<
      PassengerRequestOptions,
      "data"
    >,
  ) {
    return request<T>(
      "DELETE",
      path,
      {
        ...options,
        data,
      },
    );
  },
};