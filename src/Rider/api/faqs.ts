import { driverFetch } from "./account";

export interface RideDriverFaq {
  id: string;
  question: string;
  /** May be empty on the list endpoint; the detail endpoint has the full text. */
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

function normalizeFaq(f: any): RideDriverFaq {
  const category =
    typeof f?.category === "string" ? f.category : f?.category?.name;
  return {
    id: String(f?.id ?? f?._id ?? f?.faqId ?? ""),
    question: toPlainText(f?.question ?? f?.title ?? ""),
    answer: toPlainText(f?.answer ?? f?.content ?? f?.body ?? f?.description),
    category: category || undefined,
    raw: f,
  };
}

// The list may be a bare array or wrapped in data/faqs/items.
function extractList(body: any): any[] {
  if (Array.isArray(body)) return body;
  const candidates = [
    body?.data,
    body?.faqs,
    body?.items,
    body?.data?.faqs,
    body?.data?.items,
  ];
  return candidates.find(Array.isArray) ?? [];
}

/** GET /ride-drivers/faqs */
export async function getFaqs(): Promise<RideDriverFaq[]> {
  const body = await driverFetch(
    "/ride-drivers/faqs",
    "GET",
    "Failed to load FAQs",
  );
  return extractList(body)
    .map(normalizeFaq)
    .filter((f) => f.id && f.question);
}

/** GET /ride-drivers/faqs/:id */
export async function getFaq(id: string): Promise<RideDriverFaq> {
  const body = await driverFetch(
    `/ride-drivers/faqs/${encodeURIComponent(id)}`,
    "GET",
    "Failed to load this answer",
  );
  const f = body?.data ?? body?.faq ?? body;
  return normalizeFaq({ ...f, id: f?.id ?? f?._id ?? id });
}
