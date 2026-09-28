import {
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

export type NotificationFilterStatus =
  | "all"
  | "read"
  | "unread";

export interface NotificationFilters {
  status: NotificationFilterStatus;

  startDate: string;

  endDate: string;
}

type Props = {
  open: boolean;

  value: NotificationFilters;

  onChange: (
    filters: NotificationFilters,
  ) => void;

  onApply: () => void;

  onReset: () => void;

  onClose: () => void;
};

const statuses: {
  value: NotificationFilterStatus;
  label: string;
}[] = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "read",
    label: "Read",
  },
  {
    value: "unread",
    label: "Unread",
  },
];

export default function NotificationFilterSheet({
  open,
  value,
  onChange,
  onApply,
  onReset,
  onClose,
}: Props) {
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
            onClick={onClose}
            className="
              fixed
              inset-0
              z-[1000]
              bg-[#211927]/45
              backdrop-blur-[4px]
            "
          />

          <motion.section
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
              stiffness: 280,
              damping: 28,
            }}
            className="
              fixed
              inset-x-0
              bottom-0
              z-[1100]
              rounded-t-[28px]
              bg-white
              px-5
              pb-[calc(22px+env(safe-area-inset-bottom))]
              pt-5
              shadow-[0_-20px_60px_rgba(30,20,38,0.18)]

              sm:px-6

              lg:left-1/2
              lg:right-auto
              lg:w-[500px]
              lg:-translate-x-1/2
            "
          >
            {/* HEADER */}

            <div
              className="
                flex
                items-center
                justify-between
              "
            >
              <h2
                className="
                  text-[20px]
                  font-semibold
                  text-[#302B34]
                "
              >
                Filters
              </h2>

              <motion.button
                type="button"
                whileTap={{
                  scale: 0.9,
                }}
                onClick={onClose}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  bg-[#F1EFF2]
                  text-[#625C66]
                "
              >
                <X size={18} />
              </motion.button>
            </div>

            <div className="my-5 h-px bg-[#EEEAF0]" />

            {/* STATUS */}

            <div>
              <p
                className="
                  text-[15px]
                  font-semibold
                  text-[#302B34]
                "
              >
                Status
              </p>

              <div className="mt-3 flex flex-wrap gap-3">
                {statuses.map(
                  (status) => {
                    const active =
                      value.status ===
                      status.value;

                    return (
                      <motion.button
                        key={
                          status.value
                        }
                        type="button"
                        whileTap={{
                          scale: 0.95,
                        }}
                        onClick={() =>
                          onChange({
                            ...value,
                            status:
                              status.value,
                          })
                        }
                        className={`
                          min-w-[74px]
                          rounded-full
                          border
                          px-5
                          py-2.5
                          text-[14px]
                          font-medium
                          transition

                          ${
                            active
                              ? `
                                border-[#7442AD]
                                bg-[#7442AD]
                                text-white
                              `
                              : `
                                border-[#E4DFE7]
                                bg-white
                                text-[#4E4852]
                              `
                          }
                        `}
                      >
                        {
                          status.label
                        }
                      </motion.button>
                    );
                  },
                )}
              </div>
            </div>

            {/* DATES */}

            <div className="mt-5">
              <p
                className="
                  text-[15px]
                  font-semibold
                  text-[#302B34]
                "
              >
                Custom Dates
              </p>

              <div
                className="
                  mt-3
                  grid
                  grid-cols-2
                  gap-3
                "
              >
                <input
                  type="date"
                  value={
                    value.startDate
                  }
                  onChange={(
                    event,
                  ) =>
                    onChange({
                      ...value,
                      startDate:
                        event
                          .target
                          .value,
                    })
                  }
                  className="
                    h-[50px]
                    min-w-0
                    rounded-[12px]
                    border-0
                    bg-[#F5F4F5]
                    px-3
                    text-[14px]
                    text-[#625C66]
                    outline-none
                  "
                />

                <input
                  type="date"
                  value={
                    value.endDate
                  }
                  onChange={(
                    event,
                  ) =>
                    onChange({
                      ...value,
                      endDate:
                        event
                          .target
                          .value,
                    })
                  }
                  className="
                    h-[50px]
                    min-w-0
                    rounded-[12px]
                    border-0
                    bg-[#F5F4F5]
                    px-3
                    text-[14px]
                    text-[#625C66]
                    outline-none
                  "
                />
              </div>
            </div>

            {/* APPLY */}

            <motion.button
              type="button"
              whileTap={{
                scale: 0.98,
              }}
              onClick={onApply}
              className="
                mt-7
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

            {/* RESET */}

            <motion.button
              type="button"
              whileTap={{
                scale: 0.98,
              }}
              onClick={onReset}
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
                text-[#F05C4E]
              "
            >
              Reset
            </motion.button>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}