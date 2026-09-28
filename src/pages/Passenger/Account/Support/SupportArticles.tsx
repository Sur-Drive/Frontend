import {
  Search,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import RideHeader from "../../../../components/passenger/ride/RideHeader";

import FAQAccordion from "../../../../components/passenger/support/FAQAccordion";

import {
  supportFAQs,
} from "../../../../data/passengerSupport";

export default function SupportArticles() {
  const navigate =
    useNavigate();

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    openId,
    setOpenId,
  ] =
    useState<
      string | null
    >(
      supportFAQs[0]
        ?.id ?? null,
    );

  const filteredFAQs =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return supportFAQs;
      }

      return supportFAQs.filter(
        (faq) =>
          faq.question
            .toLowerCase()
            .includes(
              query,
            ) ||
          faq.answer
            .toLowerCase()
            .includes(
              query,
            ),
      );
    }, [search]);

  return (
    <div className="min-h-[100dvh] bg-[#F8F7F9]">
      <RideHeader
        title=""
        onBack={() =>
          navigate(
            "/passenger/account/support",
          )
        }
      />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-12 pt-2 sm:px-7">
        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <h1 className="text-[22px] font-semibold text-[#302B34]">
            Articles
          </h1>

          <p className="mt-1 text-[14px] text-[#918B95]">
            Browse through our
            support articles
          </p>

          <label
            className="
              mt-6
              flex
              h-[54px]
              items-center
              gap-3
              rounded-[13px]
              bg-[#F0EFF1]
              px-4
              focus-within:ring-2
              focus-within:ring-[#7442AD]/15
            "
          >
            <Search
              size={19}
              className="text-[#71678A]"
            />

            <input
              type="search"
              value={
                search
              }
              onChange={(
                event,
              ) =>
                setSearch(
                  event
                    .target
                    .value,
                )
              }
              placeholder="Search help articles..."
              className="
                min-w-0
                flex-1
                bg-transparent
                text-[16px]
                text-[#302B34]
                outline-none
                placeholder:text-[#AAA4AE]
              "
            />
          </label>

          <h2 className="mt-6 text-[15px] font-semibold text-[#302B34]">
            FAQ&apos;s
          </h2>

          {filteredFAQs.length >
          0 ? (
            <div className="mt-3 space-y-3">
              {filteredFAQs.map(
                (faq) => (
                  <FAQAccordion
                    key={
                      faq.id
                    }
                    faq={
                      faq
                    }
                    open={
                      openId ===
                      faq.id
                    }
                    onToggle={() =>
                      setOpenId(
                        (
                          previous,
                        ) =>
                          previous ===
                          faq.id
                            ? null
                            : faq.id,
                      )
                    }
                  />
                ),
              )}
            </div>
          ) : (
            <div className="py-20 text-center">
              <Search
                size={42}
                className="mx-auto text-[#B2A8BA]"
              />

              <h3 className="mt-4 text-[17px] font-semibold text-[#302B34]">
                No articles
                found
              </h3>

              <p className="mx-auto mt-2 max-w-[300px] text-[14px] leading-6 text-[#918B95]">
                Try searching
                with another
                word or phrase.
              </p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}