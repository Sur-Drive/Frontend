import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, ChevronLeft, LoaderCircle, RefreshCw } from "lucide-react";

import { getLegalDocument, type LegalDocKind } from "../api/legal";

const TABS: { kind: LegalDocKind; label: string }[] = [
  { kind: "privacy", label: "Privacy Policy" },
  { kind: "terms", label: "Terms & Conditions" },
];

/** Strip anything executable from backend HTML and open external links safely. */
function prepareHtml(html: string): string {
  if (!html.trim()) return "";
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc
      .querySelectorAll("script, style, iframe, object, embed, link, meta")
      .forEach((el) => el.remove());

    doc.body.querySelectorAll("*").forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim().toLowerCase();
        if (
          name.startsWith("on") ||
          ((name === "href" || name === "src") && value.startsWith("javascript:"))
        ) {
          el.removeAttribute(attr.name);
        }
      });
    });

    doc.body.querySelectorAll("a").forEach((link) => {
      if (link.getAttribute("href")?.startsWith("http")) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    });

    return doc.body.innerHTML;
  } catch {
    return "";
  }
}

const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const active: LegalDocKind =
    searchParams.get("tab") === "terms" ? "terms" : "privacy";

  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (kind: LegalDocKind, signal?: AbortSignal) => {
      try {
        setLoading(true);
        setError(null);
        setHtml(await getLegalDocument(kind, signal));
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setHtml("");
        setError(
          err instanceof Error && err.message
            ? err.message
            : "We couldn't load this document. Please try again.",
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(active, controller.signal);
    return () => controller.abort();
  }, [active, load]);

  const content = useMemo(() => prepareHtml(html), [html]);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#F8F7FA]">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 border-b border-[#EEEAF1] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <button
            type="button"
            aria-label="Go back"
            onClick={goBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2b0f3a] text-white transition active:scale-95 sm:h-11 sm:w-11"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <h1 className="truncate text-lg font-extrabold leading-tight text-[#161221] sm:text-2xl">
            Terms &amp; privacy
          </h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-12 pt-5 sm:px-6 sm:pt-8">
        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Legal documents"
          className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-[#ECE8EF] p-1 sm:mb-6 sm:inline-grid sm:min-w-[420px]"
        >
          {TABS.map(({ kind, label }) => {
            const selected = kind === active;
            return (
              <button
                key={kind}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() =>
                  setSearchParams(kind === "privacy" ? {} : { tab: kind }, {
                    replace: true,
                  })
                }
                className={`rounded-full px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  selected
                    ? "bg-white text-[#7442AD] shadow-sm"
                    : "text-[#6B6470] hover:text-[#302B34]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F1EAF8] text-[#7442AD]">
              <LoaderCircle size={25} className="animate-spin" />
            </div>
            <p className="mt-4 text-sm font-medium text-[#625B66]">
              Loading {active === "privacy" ? "privacy policy" : "terms"}…
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex min-h-[50vh] flex-col items-center justify-center px-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF1F1] text-[#C62828]">
              <AlertCircle size={25} />
            </div>
            <h2 className="mt-4 text-base font-semibold text-[#302B34] sm:text-lg">
              Unable to load document
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#96909A]">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void load(active)}
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#7442AD] px-5 text-sm font-semibold text-white transition hover:bg-[#65379A] active:scale-[0.98]"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && !content && (
          <div className="flex min-h-[50vh] items-center justify-center px-4 text-center">
            <p className="max-w-xs text-sm leading-6 text-[#96909A]">
              This document is currently unavailable.
            </p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && content && (
          <article
            className="legal-document overflow-hidden rounded-3xl border border-[#ECE8EF] bg-white px-5 py-6 shadow-[0_12px_45px_rgba(44,30,58,0.055)] sm:px-8 sm:py-8 md:px-10"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </main>
    </div>
  );
};

export default PrivacyPage;
