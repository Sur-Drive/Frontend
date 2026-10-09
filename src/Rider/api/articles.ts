import { driverFetch } from "./account";

export interface Article {
  /** The slug used in GET /articles/faq/:slug (e.g. "track-my-ride"). */
  slug: string;
  question: string;
  /** May be empty on the search endpoint; the detail endpoint has the full text. */
  answer: string;
  category?: string;
  raw: any;
}

// Plain text only: if the API sends HTML, keep the text and drop the tags.
function toPlainText(value: unknown): string {
  if (typeof value !== "string") return "";
  if (!/<\/?[a-z][\s\S]*>/i.test(value)) return value.trim();
  const doc = new DOMParser().parseFromString(value, "text/html");
  doc.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  doc.querySelectorAll("p,li,div").forEach((el) => el.append("\n"));
  return (doc.body.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeArticle(a: any): Article {
  const category =
    typeof a?.category === "string" ? a.category : a?.category?.name;
  return {
    slug: String(a?.slug ?? a?.id ?? a?._id ?? ""),
    question: toPlainText(a?.question ?? a?.title ?? ""),
    answer: toPlainText(
      a?.answer ?? a?.content ?? a?.body ?? a?.description ?? a?.text,
    ),
    category: category || undefined,
    raw: a,
  };
}

// The list may be a bare array or wrapped in data/articles/faqs/items/results.
function extractList(body: any): any[] {
  if (Array.isArray(body)) return body;
  const candidates = [
    body?.data,
    body?.articles,
    body?.faqs,
    body?.items,
    body?.results,
    body?.data?.articles,
    body?.data?.faqs,
    body?.data?.items,
    body?.data?.results,
  ];
  return candidates.find(Array.isArray) ?? [];
}

/** GET /articles/faq?q=cancel  (q is optional; omit it to list everything) */
export async function searchArticles(q?: string): Promise<Article[]> {
  const term = q?.trim();
  const body = await driverFetch(
    `/articles/faq${term ? `?q=${encodeURIComponent(term)}` : ""}`,
    "GET",
    "Failed to load articles",
  );
  return extractList(body)
    .map(normalizeArticle)
    .filter((a) => a.slug && a.question);
}

/** GET /articles/faq/:slug  (e.g. /articles/faq/track-my-ride) */
export async function getArticle(slug: string): Promise<Article> {
  const body = await driverFetch(
    `/articles/faq/${encodeURIComponent(slug)}`,
    "GET",
    "Failed to load this answer",
  );
  const a = body?.data ?? body?.article ?? body?.faq ?? body;
  return normalizeArticle({ ...a, slug: a?.slug ?? slug });
}
