import {
  ChevronDown,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import type {
  SupportFAQ,
} from "../../../types/passengerSupport";

interface Props {
  faq: SupportFAQ;

  open: boolean;

  onToggle: () => void;
}

export default function FAQAccordion({
  faq,
  open,
  onToggle,
}: Props) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#EEEAF0] bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
      >
        <span className="text-[15px] font-medium text-[#302B34]">
          {faq.question}
        </span>

        <motion.span
          animate={{
            rotate:
              open
                ? 180
                : 0,
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F2EAFB] text-[#7442AD]"
        >
          <ChevronDown
            size={17}
          />
        </motion.span>
      </button>

      <AnimatePresence
        initial={false}
      >
        {open && (
          <motion.div
            initial={{
              height: 0,
              opacity: 0,
            }}
            animate={{
              height:
                "auto",
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
          >
            <p className="px-4 pb-4 pr-14 text-[13px] leading-5 text-[#817A85]">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}