import {
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  useEffect,
  useState,
} from "react";

import type {
  TicketFilters,
} from "../../../types/passengerSupport";

interface Props {
  open: boolean;

  filters:
    TicketFilters;

  onClose:
    () => void;

  onApply: (
    filters:
      TicketFilters,
  ) => void;

  onReset:
    () => void;
}

const statusOptions = [
  "all",
  "open",
  "closed",
] as const;

const priorityOptions = [
  "all",
  "low",
  "medium",
  "high",
] as const;

export default function TicketFiltersSheet({
  open,
  filters,
  onClose,
  onApply,
  onReset,
}: Props) {
  const [
    localFilters,
    setLocalFilters,
  ] =
    useState<TicketFilters>(
      filters,
    );

  useEffect(() => {
    if (open) {
      setLocalFilters(
        filters,
      );
    }
  }, [
    open,
    filters,
  ]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close filters"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={
              onClose
            }
            className="fixed inset-0 z-[200] bg-black/35 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{
              y: "100%",
            }}
            animate={{
              y: 0,
            }}
            exit={{
              y: "100%",
            }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 28,
            }}
            className="
              fixed
              inset-x-0
              bottom-0
              z-[210]
              rounded-t-[28px]
              bg-white
              px-5
              pb-[calc(20px+env(safe-area-inset-bottom))]
              pt-3
              shadow-[0_-15px_50px_rgba(20,12,30,0.14)]

              md:left-1/2
              md:right-auto
              md:w-[520px]
              md:-translate-x-1/2
            "
          >
            <div className="mx-auto h-1 w-12 rounded-full bg-[#D7D2DA]" />

            <div className="mt-5 flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-[#302B34]">
                Filters
              </h2>

              <button
                type="button"
                onClick={
                  onClose
                }
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F3F5] text-[#625C66]"
              >
                <X
                  size={17}
                />
              </button>
            </div>

            {/* STATUS */}

            <div className="mt-6">
              <p className="text-[14px] font-semibold text-[#302B34]">
                Status
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {statusOptions.map(
                  (
                    status,
                  ) => {
                    const selected =
                      localFilters.status ===
                      status;

                    return (
                      <button
                        key={
                          status
                        }
                        type="button"
                        onClick={() =>
                          setLocalFilters(
                            (
                              previous,
                            ) => ({
                              ...previous,
                              status,
                            }),
                          )
                        }
                        className={`
                          min-w-[68px]
                          rounded-full
                          border
                          px-4
                          py-2
                          text-[13px]
                          font-medium
                          capitalize
                          transition

                          ${
                            selected
                              ? `
                                border-[#7442AD]
                                bg-[#7442AD]
                                text-white
                              `
                              : `
                                border-[#E3DEE6]
                                bg-white
                                text-[#625C66]
                              `
                          }
                        `}
                      >
                        {status}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            {/* PRIORITY */}

            <div className="mt-5">
              <p className="text-[14px] font-semibold text-[#302B34]">
                Priority
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {priorityOptions.map(
                  (
                    priority,
                  ) => {
                    const selected =
                      localFilters.priority ===
                      priority;

                    return (
                      <button
                        key={
                          priority
                        }
                        type="button"
                        onClick={() =>
                          setLocalFilters(
                            (
                              previous,
                            ) => ({
                              ...previous,
                              priority,
                            }),
                          )
                        }
                        className={`
                          min-w-[68px]
                          rounded-full
                          border
                          px-4
                          py-2
                          text-[13px]
                          font-medium
                          capitalize
                          transition

                          ${
                            selected
                              ? `
                                border-[#7442AD]
                                bg-[#7442AD]
                                text-white
                              `
                              : `
                                border-[#E3DEE6]
                                bg-white
                                text-[#625C66]
                              `
                          }
                        `}
                      >
                        {priority}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            {/* DATES */}

            <div className="mt-5">
              <p className="text-[14px] font-semibold text-[#302B34]">
                Custom Dates
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={
                    localFilters.startDate ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setLocalFilters(
                      (
                        previous,
                      ) => ({
                        ...previous,

                        startDate:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  className="
                    h-[52px]
                    min-w-0
                    rounded-[12px]
                    border-0
                    bg-[#F5F4F5]
                    px-3
                    text-[13px]
                    text-[#625C66]
                    outline-none
                  "
                />

                <input
                  type="date"
                  value={
                    localFilters.endDate ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setLocalFilters(
                      (
                        previous,
                      ) => ({
                        ...previous,

                        endDate:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  className="
                    h-[52px]
                    min-w-0
                    rounded-[12px]
                    border-0
                    bg-[#F5F4F5]
                    px-3
                    text-[13px]
                    text-[#625C66]
                    outline-none
                  "
                />
              </div>
            </div>

            <motion.button
              type="button"
              whileTap={{
                scale:
                  0.98,
              }}
              onClick={() => {
                onApply(
                  localFilters,
                );

                onClose();
              }}
              className="
                mt-6
                h-[56px]
                w-full
                rounded-[14px]
                bg-[#7442AD]
                text-[16px]
                font-semibold
                text-white
              "
            >
              Apply
            </motion.button>

            <button
              type="button"
              onClick={() => {
                onReset();

                setLocalFilters({
                  status:
                    "all",
                  priority:
                    "all",
                });
              }}
              className="
                mt-3
                h-[54px]
                w-full
                rounded-[14px]
                border
                border-[#E5E0E8]
                bg-white
                text-[15px]
                font-semibold
                text-[#E25353]
              "
            >
              Reset
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}