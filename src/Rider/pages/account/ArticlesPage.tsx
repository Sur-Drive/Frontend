import { useState } from "react";
import { ChevronLeft, Search, ChevronUp, ChevronDown } from "lucide-react";

interface Faq {
  key: string;
  question: string;
  answer: string;
}

const FAQS: Faq[] = [
  {
    key: "track",
    question: "How do I track my ride?",
    answer:
      "Tap the map to see your driver's live location and estimated arrival time.",
  },
  {
    key: "contact",
    question: "How do I contact my driver?",
    answer:
      "Open your active ride and tap the call or message icon next to your driver's name.",
  },
  {
    key: "stop",
    question: "Can I add a stop along the way?",
    answer:
      "Yes, tap \"Add stop\" on the ride screen before or during your trip.",
  },
  {
    key: "rate",
    question: "How do I rate my trip?",
    answer:
      "You'll be asked to rate your trip once it ends. You can also rate it later from Ride History.",
  },
  {
    key: "pickup",
    question: "Can I change my pickup location?",
    answer:
      "Yes, drag the pin on the map to a new spot before you confirm your ride request.",
  },
  {
    key: "stop2",
    question: "Can I add a stop along the way?",
    answer:
      "Yes, tap \"Add stop\" on the ride screen before or during your trip.",
  },
];

export default function ArticlesPage({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>("track");

  const filtered = FAQS.filter((f) =>
    f.question.toLowerCase().includes(query.trim().toLowerCase()),
  );

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

          <h1 className="mt-6 text-[28px] font-bold text-[#1F2937]">
            Articles
          </h1>
          <p className="mt-1.5 text-base text-[#9AA5B8]">
            Browse through our  support articles
          </p>

          <div className="mt-6 flex h-14 items-center gap-3 rounded-2xl bg-[#f4f4f3] px-4">
            <Search size={18} className="shrink-0 text-[#6E43A3]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help articles..."
              className="h-full w-full bg-transparent text-base text-[#1F2937] outline-none placeholder:text-gray-400"
            />
          </div>

          <h2 className="mb-3 mt-6 text-lg font-bold text-[#1F2937]">
            FAQ's
          </h2>

          <div className="flex flex-col gap-3">
            {filtered.map((f) => {
              const open = openKey === f.key;
              return (
                <div
                  key={f.key}
                  className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenKey(open ? null : f.key)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <span className="text-[16px] text-[#1F2937]">
                      {f.question}
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFE0FB]">
                      {open ? (
                        <ChevronUp size={16} className="text-[#6E43A3]" />
                      ) : (
                        <ChevronDown size={16} className="text-[#6E43A3]" />
                      )}
                    </span>
                  </button>
                  {open && (
                    <p className="mt-3 text-[14.5px] leading-relaxed text-[#7C86C9]">
                      {f.answer}
                    </p>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="mt-4 text-center text-sm text-[#9AA5B8]">
                No articles match "{query}".
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
