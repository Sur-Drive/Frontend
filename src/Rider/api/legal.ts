const API_BASE = "https://backend-production-01de.up.railway.app";

export type LegalDocKind = "terms" | "privacy";

const ENDPOINTS: Record<LegalDocKind, string> = {
  terms: "/terms-and-conditions",
  privacy: "/privacy-policy",
};

export interface LegalSection {
  title?: string;
  content: string;
}

export interface LegalDocument {
  title?: string;
  updatedAt?: string;
  /** Body text or HTML (see isHtml). Empty when the API sent sections only. */
  content: string;
  isHtml: boolean;
  sections: LegalSection[];
  /** Whatever the API returned, untouched. */
  raw: any;
}

const looksLikeHtml = (s: string) => /<\/?[a-z][\s\S]*>/i.test(s);

function pickString(obj: any, keys: string[]): string | undefined {
  for (const k of keys) {
    if (typeof obj?.[k] === "string" && obj[k].trim()) return obj[k];
  }
  return undefined;
}

function normalize(body: any): LegalDocument {
  if (typeof body === "string") {
    return {
      content: body,
      isHtml: looksLikeHtml(body),
      sections: [],
      raw: body,
    };
  }

  const root = body?.data ?? body?.result ?? body?.payload ?? body ?? {};

  if (typeof root === "string") {
    return {
      content: root,
      isHtml: looksLikeHtml(root),
      sections: [],
      raw: body,
    };
  }

  const content =
    pickString(root, [
      "content",
      "body",
      "text",
      "html",
      "description",
      "termsAndConditions",
      "terms",
      "privacyPolicy",
      "privacy",
      "policy",
    ]) ?? "";

  const rawSections = Array.isArray(root?.sections) ? root.sections : [];
  const sections: LegalSection[] = rawSections
    .map((s: any) => ({
      title: pickString(s, ["title", "heading", "name"]),
      content: pickString(s, ["content", "body", "text", "description"]) ?? "",
    }))
    .filter((s: LegalSection) => s.title || s.content);

  return {
    title: pickString(root, ["title", "name"]),
    updatedAt: pickString(root, [
      "updatedAt",
      "lastUpdated",
      "effectiveDate",
      "createdAt",
    ]),
    content,
    isHtml:
      looksLikeHtml(content) || sections.some((s) => looksLikeHtml(s.content)),
    sections,
    raw: body,
  };
}

export async function getLegalDocument(
  kind: LegalDocKind,
): Promise<LegalDocument> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}${ENDPOINTS[kind]}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const text = await res.text();
  let body: any;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = text; // plain text / HTML response
  }

  console.log(`[legal] GET ${ENDPOINTS[kind]}`, { status: res.status, body });

  if (!res.ok) {
    throw new Error(
      (typeof body === "object" && (body?.message || body?.error)) ||
        `Failed to load (${res.status})`,
    );
  }

  return normalize(body);
}
