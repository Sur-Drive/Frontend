import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Loader2 } from "lucide-react";
import { useLegalDocument } from "../../hooks/useLegal";
import type { LegalDocKind } from "../../api/legal";

type View = "home" | "terms" | "privacy";

/** Strip anything executable from API-supplied HTML before rendering it. */
function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc
    .querySelectorAll("script,style,iframe,object,embed,link,meta,form,base")
    .forEach((el) => el.remove());
  doc.body.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (
        name.startsWith("on") ||
        name === "style" ||
        ((name === "href" || name === "src") && value.startsWith("javascript:"))
      ) {
        el.removeAttribute(attr.name);
      }
    });
    if (el.tagName === "A") {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }
  });
  return doc.body.innerHTML;
}

function PlainText({ text }: { text: string }) {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
  return (
    <div className="flex flex-col gap-4">
      {paragraphs.map((paragraph, idx) => {
        const heading = paragraph.match(/^#{1,6}\s+(.*)$/);
        return heading ? (
          <h2 key={idx} className="mt-3 text-base sm:text-lg font-bold text-[#1F2937]">
            {heading[1]}
          </h2>
        ) : (
          <p
            key={idx}
            className="whitespace-pre-line text-sm sm:text-base leading-[1.7] text-[#4B5768]"
          >
            {paragraph}
          </p>
        );
      })}
    </div>
  );
}

function Rich({ text, isHtml }: { text: string; isHtml: boolean }) {
  if (!isHtml) return <PlainText text={text} />;
  return (
    <div
      className="legal-html"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
    />
  );
}

const LEGAL_HTML_CSS = `
.legal-html { font-size: 13px; line-height: 1.65; color: #4B5768; }
.legal-html h1, .legal-html h2, .legal-html h3 { color: #1F2937; font-weight: 700; margin: 20px 0 8px; }
.legal-html h1 { font-size: 18px; } .legal-html h2 { font-size: 16px; } .legal-html h3 { font-size: 14px; }
@media (min-width: 640px) {
  .legal-html { font-size: 15px; line-height: 1.7; }
  .legal-html h1 { font-size: 22px; } .legal-html h2 { font-size: 19px; } .legal-html h3 { font-size: 16px; }
}
.legal-html p { margin: 0 0 14px; }
.legal-html ul, .legal-html ol { margin: 0 0 14px; padding-left: 22px; }
.legal-html ul { list-style: disc; } .legal-html ol { list-style: decimal; }
.legal-html a { color: #2563EB; text-decoration: underline; }
`;

function LegalDocPage({
  kind,
  fallbackTitle,
  onBack,
}: {
  kind: LegalDocKind;
  fallbackTitle: string;
  onBack: () => void;
}) {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useLegalDocument(kind);

  const hasBody = !!data && (data.content.trim() || data.sections.length > 0);

  return (
    <div className="font-outfit flex h-full min-h-0 w-full flex-col bg-white">
      <style>{LEGAL_HTML_CSS}</style>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-50 shadow-md"
            >
              <ChevronLeft size={22} className="text-[#1F2937]" />
            </button>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2937]">
              {data?.title || fallbackTitle}
            </h1>
          </div>

          {isLoading && (
            <div className="mt-10 flex justify-center">
              <Loader2 size={28} className="animate-spin text-[#7B87B8]" />
            </div>
          )}

          {isError && (
            <div className="mt-10 rounded-2xl bg-gray-50 p-5 text-center">
              <p className="text-sm sm:text-base text-[#4B5768]">
                {(error as Error)?.message || "Couldn't load this document."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="mt-3 rounded-full bg-[#1F2937] px-5 py-2 text-xs sm:text-sm font-medium text-white disabled:opacity-60"
              >
                {isFetching ? "Retrying..." : "Try again"}
              </button>
            </div>
          )}

          {!isLoading && !isError && data && !hasBody && (
            <p className="mt-10 text-center text-sm sm:text-base text-[#7B87B8]">
              Nothing to show yet.
            </p>
          )}

          {data && hasBody && (
            <div className="mt-6">
              {data.updatedAt && !Number.isNaN(Date.parse(data.updatedAt)) && (
                <p className="mb-4 text-xs sm:text-sm text-[#9AA5B8]">
                  Last updated{" "}
                  {new Date(data.updatedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}

              {data.content.trim() && (
                <Rich text={data.content} isHtml={data.isHtml} />
              )}

              {data.sections.map((section, idx) => (
                <div key={idx} className="mt-6">
                  {section.title && (
                    <h2 className="mb-2 text-base sm:text-lg font-bold text-[#1F2937]">
                      {section.title}
                    </h2>
                  )}
                  <Rich
                    text={section.content}
                    isHtml={looksLikeHtml(section.content)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const looksLikeHtml = (s: string) => /<\/?[a-z][\s\S]*>/i.test(s);

export default function LegalPage({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<View>("home");

  if (view === "terms") {
    return (
      <LegalDocPage
        kind="terms"
        fallbackTitle="Terms & Conditions"
        onBack={() => setView("home")}
      />
    );
  }

  if (view === "privacy") {
    return (
      <LegalDocPage
        kind="privacy"
        fallbackTitle="Privacy policy"
        onBack={() => setView("home")}
      />
    );
  }

  return (
    <div className="font-outfit flex h-full min-h-0 w-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 shadow-md"
          >
            <ChevronLeft size={22} className="text-[#1F2937]" />
          </button>

          <h1 className="mt-6 text-xl sm:text-2xl font-extrabold text-[#1F2937]">
            Legals
          </h1>

          <div className="mt-5 divide-y divide-gray-100 rounded-3xl bg-white px-4 shadow-sm">
            <button
              type="button"
              onClick={() => setView("terms")}
              className="flex w-full items-center gap-3.5 py-4 text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F2F5]">
                <FileText size={18} className="text-[#1F2937]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-medium text-[#1F2937]">
                  Terms &amp; Conditions
                </p>
                <p className="text-xs sm:text-sm text-[#7B87B8]">
                  Read our terms &amp; conditions
                </p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-[#C7CCD6]" />
            </button>

            <button
              type="button"
              onClick={() => setView("privacy")}
              className="flex w-full items-center gap-3.5 py-4 text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F2F5]">
                <FileText size={18} className="text-[#1F2937]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-medium text-[#1F2937]">
                  Privacy policy
                </p>
                <p className="text-xs sm:text-sm text-[#7B87B8]">
                  Read our Privacy policy
                </p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-[#C7CCD6]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
