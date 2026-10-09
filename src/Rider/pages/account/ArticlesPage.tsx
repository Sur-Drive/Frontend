import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Search,
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
import type { Article } from "../../api/articles";
import { useArticle, useArticles } from "../../hooks/useArticles";

/** One FAQ row. Opening it loads GET /articles/faq/:slug for the answer. */
function FaqItem({
  faq,
  open,
  onToggle,
}: {
  faq: Article;
  open: boolean;
  onToggle: () => void;
}) {
  const detail = useArticle(open ? faq.slug : null);
  // Show whatever the list already had while the detail request runs.
  const answer = detail.data?.answer || faq.answer;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-[14px] sm:text-[16px] text-[#1F2937]">{faq.question}</span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFE0FB]">
          {open ? (
            <ChevronUp size={16} className="text-[#6E43A3]" />
          ) : (
            <ChevronDown size={16} className="text-[#6E43A3]" />
          )}
        </span>
      </button>

      {open && (
        <div className="mt-3">
          {answer ? (
            <p className="whitespace-pre-line text-[12.5px] sm:text-[14.5px] leading-relaxed text-[#7C86C9]">
              {answer}
            </p>
          ) : detail.isLoading ? (
            <Loader2 size={18} className="animate-spin text-[#6E43A3]" />
          ) : detail.isError ? (
            <p className="text-[12.5px] sm:text-[14px] text-red-500">
              {detail.error instanceof Error
                ? detail.error.message
                : "Couldn't load this answer."}
            </p>
          ) : (
            <p className="text-[12.5px] sm:text-[14px] text-[#9AA5B8]">No answer available yet.</p>
          )}
        </div>
      )}
    </div>
  );
}


export default function ArticlesPage({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  // Wait for a pause in typing, then GET /articles/faq?q=<text>
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 350);
    return () => window.clearTimeout(t);
  }, [query]);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useArticles(debounced);

  const filtered = data ?? [];

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

          <h1 className="mt-6 text-[22px] sm:text-[28px] font-bold text-[#1F2937]">
            Articles
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-[#9AA5B8]">
            Browse through our  support articles
          </p>

          <div className="mt-6 flex h-14 items-center gap-3 rounded-2xl bg-[#f4f4f3] px-4">
            <Search size={18} className="shrink-0 text-[#6E43A3]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help articles..."
              className="h-full w-full bg-transparent text-sm sm:text-base text-[#1F2937] outline-none placeholder:text-gray-400"
            />
          </div>

          <h2 className="mb-3 mt-6 text-[15px] sm:text-lg font-bold text-[#1F2937]">
            FAQ's
          </h2>

          {isLoading && (
            <div className="mt-8 flex justify-center">
              <Loader2 size={28} className="animate-spin text-[#6E43A3]" />
            </div>
          )}

          {isError && (
            <div className="rounded-2xl bg-gray-50 p-5 text-center">
              <p className="text-[13px] sm:text-[15px] text-[#4B5768]">
                {error instanceof Error
                  ? error.message
                  : "Couldn't load the FAQs."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="mt-3 rounded-full bg-[#1F2937] px-5 py-2 text-[12.5px] sm:text-[14px] font-medium text-white disabled:opacity-60"
              >
                {isFetching ? "Retrying..." : "Try again"}
              </button>
            </div>
          )}

          {!isLoading && !isError && (
            <div className="flex flex-col gap-3">
              {filtered.map((f) => (
                <FaqItem
                  key={f.slug}
                  faq={f}
                  open={openId === f.slug}
                  onToggle={() => setOpenId(openId === f.slug ? null : f.slug)}
                />
              ))}
              {filtered.length === 0 && (
                <p className="mt-4 text-center text-[13px] sm:text-sm text-[#9AA5B8]">
                  {query.trim()
                    ? `No articles match "${query}".`
                    : "No FAQs yet."}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
