const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://backend-production-01de.up.railway.app";

export type LegalDocKind = "privacy" | "terms";

const ENDPOINTS: Record<LegalDocKind, string> = {
  privacy: "/privacy-policy",
  terms: "/terms-and-conditions",
};

const CONTENT_KEYS = [
  "content",
  "html",
  "body",
  "text",
  "description",
  "privacyPolicy",
  "termsAndConditions",
];

function extractHtml(body: unknown): string {
  if (typeof body === "string") return body;

  const root = (body as any)?.data ?? (body as any)?.result ?? body;
  if (typeof root === "string") return root;

  for (const key of CONTENT_KEYS) {
    const value = (root as any)?.[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

/**
 * Public endpoints (no auth needed). The API returns a full HTML document,
 * but a JSON wrapper like { data: { content } } is handled too.
 */
export async function getLegalDocument(
  kind: LegalDocKind,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${API_URL}${ENDPOINTS[kind]}`, {
    method: "GET",
    headers: { Accept: "text/html, application/json" },
    signal,
  });

  const text = await res.text();

  if (!res.ok) {
    let message = `Failed to load (${res.status})`;
    try {
      const parsed = JSON.parse(text);
      message = parsed?.message || parsed?.error || message;
    } catch {
      /* not JSON — keep default message */
    }
    throw new Error(message);
  }

  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* plain HTML */
  }

  return extractHtml(body);
}
