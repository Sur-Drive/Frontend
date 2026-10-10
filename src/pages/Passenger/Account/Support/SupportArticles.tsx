import {
  AlertCircle,
  BookOpenText,
  LoaderCircle,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { motion } from "framer-motion";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import RideHeader from "../../../../components/passenger/ride/RideHeader";
import FAQAccordion from "../../../../components/passenger/support/FAQAccordion";

import { usePassengerFAQs } from "../../../../hooks/passenger/usePassengerSafetyArticles";

// ======================================================
// TYPES
// ======================================================

type FAQArticle = {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
};

type FAQCategory = {
  id: string;
  title: string;
  articles: FAQArticle[];
};

// Category names for search results.
// The category IDs come from your backend.

const CATEGORY_TITLES: Record<string, string> = {
  rides: "Rides",
  payments: "Payments",
  safety: "Safety",
  account: "Account",
};

// ======================================================
// TYPE GUARDS
// ======================================================

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

// ======================================================
// NORMALIZE ARTICLE
// ======================================================

function normalizeArticle(
  value: unknown,
  fallbackCategory = "",
): FAQArticle | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = value.id;
  const question = value.question;
  const answer = value.answer;

  if (
    typeof id !== "string" ||
    typeof question !== "string" ||
    typeof answer !== "string"
  ) {
    return null;
  }

  const category =
    typeof value.category === "string"
      ? value.category
      : fallbackCategory;

  const tags: string[] = Array.isArray(value.tags)
    ? value.tags.filter(
        (tag: unknown): tag is string =>
          typeof tag === "string",
      )
    : [];

  return {
    id,
    question,
    answer,
    category,
    tags,
  };
}

// ======================================================
// NORMALIZE BACKEND RESPONSE
// ======================================================

function normalizeFAQs(
  response: unknown,
): FAQCategory[] {
  if (!isRecord(response)) {
    return [];
  }

  // Supports API responses wrapped in { data: ... }
  // as well as direct JSON responses.

  const payload: Record<string, unknown> =
    isRecord(response.data)
      ? response.data
      : response;

  // --------------------------------------------------
  // FORMAT 1: GET /articles/faq
  //
  // {
  //   categories: [
  //     {
  //       id: "rides",
  //       title: "Rides",
  //       articles: [...]
  //     }
  //   ],
  //   total: 18
  // }
  // --------------------------------------------------

  if (Array.isArray(payload.categories)) {
    const categories: FAQCategory[] = [];

    for (const rawCategory of payload.categories) {
      if (!isRecord(rawCategory)) {
        continue;
      }

      const categoryId = rawCategory.id;
      const categoryTitle = rawCategory.title;

      if (
        typeof categoryId !== "string" ||
        typeof categoryTitle !== "string" ||
        !Array.isArray(rawCategory.articles)
      ) {
        continue;
      }

      const articles: FAQArticle[] = [];

      for (const rawArticle of rawCategory.articles) {
        const article = normalizeArticle(
          rawArticle,
          categoryId,
        );

        if (article) {
          articles.push(article);
        }
      }

      if (articles.length > 0) {
        categories.push({
          id: categoryId,
          title: categoryTitle,
          articles,
        });
      }
    }

    return categories;
  }

  // --------------------------------------------------
  // FORMAT 2: GET /articles/faq?q=track
  //
  // {
  //   results: [
  //     {
  //       id: "track-my-ride",
  //       question: "...",
  //       answer: "...",
  //       category: "rides",
  //       tags: [...]
  //     }
  //   ],
  //   total: 2
  // }
  // --------------------------------------------------

  if (Array.isArray(payload.results)) {
    const grouped = new Map<string, FAQArticle[]>();

    for (const rawArticle of payload.results) {
      const article = normalizeArticle(rawArticle);

      if (!article) {
        continue;
      }

      const categoryId = article.category || "general";

      const existingArticles =
        grouped.get(categoryId) ?? [];

      existingArticles.push(article);

      grouped.set(categoryId, existingArticles);
    }

    const categories: FAQCategory[] = [];

    for (const [categoryId, articles] of grouped) {
      categories.push({
        id: categoryId,
        title:
          CATEGORY_TITLES[categoryId] ??
          categoryId
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (letter) =>
              letter.toUpperCase(),
            ),
        articles,
      });
    }

    return categories;
  }

  return [];
}

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function SupportArticles() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [openId, setOpenId] =
    useState<string | null>(null);

  // --------------------------------------------------
  // DEBOUNCE SEARCH
  // --------------------------------------------------

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [search]);

  // --------------------------------------------------
  // FETCH ARTICLES
  //
  // Empty query:
  // GET /articles/faq
  //
  // Search:
  // GET /articles/faq?q=track
  // --------------------------------------------------

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = usePassengerFAQs(debouncedSearch);

  // --------------------------------------------------
  // NORMALIZE RESPONSE
  // --------------------------------------------------

  const categories = useMemo(
    () => normalizeFAQs(data),
    [data],
  );

  // The backend already performs search filtering.
  // Do not filter the search results again locally.

  const visibleCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.articles.length > 0,
      ),
    [categories],
  );

  // --------------------------------------------------
  // ARTICLE COUNT
  // --------------------------------------------------

  const totalArticles = useMemo(
    () =>
      visibleCategories.reduce(
        (total, category) =>
          total + category.articles.length,
        0,
      ),
    [visibleCategories],
  );

  // --------------------------------------------------
  // SEARCH STATUS
  // --------------------------------------------------

  const isWaitingForDebounce =
    search.trim() !== debouncedSearch;

  const isSearching =
    isWaitingForDebounce || isFetching;

  const showLoading =
    isLoading ||
    isWaitingForDebounce ||
    (isFetching && debouncedSearch.length > 0);

  // --------------------------------------------------
  // CLEAR SEARCH
  // --------------------------------------------------

  const clearSearch = () => {
    setSearch("");
    setDebouncedSearch("");
    setOpenId(null);
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="min-h-[100dvh] bg-[#F8F7F9]">
      <RideHeader
        title=""
        onBack={() =>
          navigate("/passenger/account/support")
        }
      />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-12 pt-2 sm:px-7">
        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.35,
          }}
        >
          {/* ========================================
              HEADER
          ======================================== */}

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-[#302B34]">
                Help Articles
              </h1>

              <p className="mt-1 text-[14px] leading-6 text-[#918B95]">
                Find answers to common questions
                about Sur-Drive.
              </p>
            </div>

            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#EEE5F7] text-[#7442AD]">
              <BookOpenText size={21} />
            </span>
          </div>

          {/* ========================================
              SEARCH INPUT
          ======================================== */}

          <div className="mt-6">
            <div
              className="
                flex h-[54px] items-center gap-3
                rounded-[13px] bg-[#F0EFF1] px-4
                transition-all
                focus-within:bg-white
                focus-within:ring-2
                focus-within:ring-[#7442AD]/20
              "
            >
              <Search
                size={19}
                className="shrink-0 text-[#71678A]"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setOpenId(null);
                }}
                placeholder="Search help articles..."
                aria-label="Search help articles"
                className="
                  min-w-0 flex-1 bg-transparent
                  text-[16px] text-[#302B34]
                  outline-none
                  placeholder:text-[#AAA4AE]
                "
              />

              {isSearching ? (
                <LoaderCircle
                  size={17}
                  className="shrink-0 animate-spin text-[#7442AD]"
                />
              ) : search ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="
                    flex h-7 w-7 shrink-0
                    items-center justify-center
                    rounded-full text-[#81798B]
                    hover:bg-[#E5E0E9]
                  "
                >
                  <X size={17} />
                </button>
              ) : null}
            </div>
          </div>

          {/* ========================================
              CONTENT
          ======================================== */}

          {showLoading ? (
            // --------------------------------------
            // LOADING STATE
            // --------------------------------------

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 mt-10 "
            >
              <LoaderCircle
                size={28}
                className="animate-spin text-[#7442AD]"
              />

              <p className="mt-4 text-[14px] text-[#918B95]">
                {search.trim()
                  ? "Searching help articles..."
                  : "Loading help articles..."}
              </p>
            </motion.div>
          ) : isError ? (
            // --------------------------------------
            // ERROR STATE
            // --------------------------------------

            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="
                mt-8 rounded-[18px]
                bg-white px-5 py-12 text-center
              "
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF0EF]">
                <AlertCircle
                  size={26}
                  className="text-[#D75B58]"
                />
              </span>

              <h3 className="mt-4 text-[17px] font-semibold text-[#302B34]">
                Unable to load articles
              </h3>

              <p className="mx-auto mt-2 max-w-[300px] text-[14px] leading-6 text-[#918B95]">
                {error instanceof Error
                  ? error.message
                  : "Please check your connection and try again."}
              </p>

              <button
                type="button"
                onClick={() => {
                  void refetch();
                }}
                className="
                  mx-auto mt-5 flex h-11
                  items-center justify-center gap-2
                  rounded-xl bg-[#7442AD] px-5
                  text-[14px] font-semibold text-white
                  transition hover:bg-[#623497]
                "
              >
                <RefreshCw size={16} />
                Try again
              </button>
            </motion.div>
          ) : totalArticles > 0 ? (
            // --------------------------------------
            // ARTICLE RESULTS
            // --------------------------------------

            <div className="mt-7">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h2 className="text-[16px] font-semibold text-[#302B34]">
                  {debouncedSearch
                    ? "Search Results"
                    : "Frequently Asked Questions"}
                </h2>

                <span className="shrink-0 rounded-full bg-[#EEE8F4] px-3 py-1 text-[12px] font-semibold text-[#7442AD]">
                  {totalArticles}{" "}
                  {totalArticles === 1
                    ? "article"
                    : "articles"}
                </span>
              </div>

              {/* SEARCH QUERY LABEL */}

              {debouncedSearch && (
                <p className="mb-5 text-[14px] text-[#918B95]">
                  Showing results for{" "}
                  <span className="font-semibold text-[#7442AD]">
                    "{debouncedSearch}"
                  </span>
                </p>
              )}

              {/* CATEGORY SECTIONS */}

              <div className="space-y-7">
                {visibleCategories.map(
                  (category, index) => (
                    <motion.section
                      key={category.id}
                      initial={{
                        opacity: 0,
                        y: 12,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.3,
                        delay: Math.min(
                          index * 0.06,
                          0.25,
                        ),
                      }}
                    >
                      {/* CATEGORY HEADING */}

                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[15px] font-semibold text-[#7442AD]">
                          {category.title}
                        </h3>

                        <span className="text-[12px] text-[#A39AA9]">
                          {category.articles.length}
                        </span>
                      </div>

                      {/* FAQ ACCORDIONS */}

                      <div className="space-y-3">
                        {category.articles.map(
                          (article) => (
                            <FAQAccordion
                              key={article.id}
                              faq={article}
                              open={
                                openId === article.id
                              }
                              onToggle={() =>
                                setOpenId(
                                  (previous) =>
                                    previous === article.id
                                      ? null
                                      : article.id,
                                )
                              }
                            />
                          ),
                        )}
                      </div>
                    </motion.section>
                  ),
                )}
              </div>
            </div>
          ) : (
            // --------------------------------------
            // EMPTY STATE
            // --------------------------------------

            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="py-20 text-center"
            >
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EEE8F4]">
                <Search
                  size={28}
                  className="text-[#A08BB5]"
                />
              </span>

              <h3 className="mt-5 text-[17px] font-semibold text-[#302B34]">
                No articles found
              </h3>

              <p className="mx-auto mt-2 max-w-[300px] text-[14px] leading-6 text-[#918B95]">
                {debouncedSearch
                  ? `We couldn't find any articles matching "${debouncedSearch}". Try another search term.`
                  : "There are no support articles available yet."}
              </p>

              {debouncedSearch && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="mt-5 text-[14px] font-semibold text-[#7442AD]"
                >
                  Clear search
                </button>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

