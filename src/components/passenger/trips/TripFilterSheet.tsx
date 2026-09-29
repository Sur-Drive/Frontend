import {
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  useState,
} from "react";

import type {
  PassengerTripStatus,
} from "../../../types/passengerTrip";

export type TripFilterStatus =
  | "all"
  | PassengerTripStatus;

export interface TripFilters {
  status: TripFilterStatus;
  startDate: string;
  endDate: string;
}

type Props = {
  open: boolean;
  value: TripFilters;
  onClose: () => void;
  onApply: (
    filters: TripFilters,
  ) => void;
};

export default function TripFilterSheet({
  open,
  value,
  onClose,
  onApply,
}: Props) {
  const [
    filters,
    setFilters,
  ] = useState<TripFilters>(
    value,
  );

  const reset = () => {
    const resetValue: TripFilters = {
      status: "all",
      startDate: "",
      endDate: "",
    };

    setFilters(resetValue);
    onApply(resetValue);
    onClose();
  };

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
              z-[1100]
              bg-[#211927]/45
              backdrop-blur-[3px]
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
              damping: 28,
              stiffness: 280,
            }}
            className="
              fixed
              inset-x-0
              bottom-0
              z-[1200]
              rounded-t-[28px]
              bg-white
              px-5
              pb-[calc(24px+env(safe-area-inset-bottom))]
              pt-5

              lg:left-1/2
              lg:right-auto
              lg:w-[480px]
              lg:-translate-x-1/2
            "
          >
            <div className="flex items-center justify-between">
              <h2
                className="
                  text-[20px]
                  font-semibold
                  text-[#302B34]
                "
              >
                Filters
              </h2>

              <button
                type="button"
                onClick={onClose}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  bg-[#F2F0F3]
                  text-[#716A75]
                "
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-5 h-px bg-[#EEEAF0]" />

            <p
              className="
                text-[14px]
                font-semibold
                text-[#403A44]
              "
            >
              Status
            </p>

            <div className="mt-3 flex gap-2">
              {(
                [
                  "all",
                  "completed",
                  "cancelled",
                ] as TripFilterStatus[]
              ).map(
                (status) => {
                  const selected =
                    filters.status ===
                    status;

                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        setFilters(
                          (
                            previous,
                          ) => ({
                            ...previous,
                            status,
                          }),
                        )
                      }
                      className={`
                        rounded-full
                        border
                        px-5
                        py-2.5
                        text-[13px]
                        font-medium
                        capitalize

                        ${
                          selected
                            ? "border-[#7442AD] bg-[#7442AD] text-white"
                            : "border-[#E6E1E8] bg-white text-[#625C66]"
                        }
                      `}
                    >
                      {status}
                    </button>
                  );
                },
              )}
            </div>

            <p
              className="
                mt-6
                text-[14px]
                font-semibold
                text-[#403A44]
              "
            >
              Custom Dates
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <input
                type="date"
                value={
                  filters.startDate
                }
                onChange={(
                  event,
                ) =>
                  setFilters(
                    (
                      previous,
                    ) => ({
                      ...previous,
                      startDate:
                        event.target
                          .value,
                    }),
                  )
                }
                className="
                  h-[50px]
                  min-w-0
                  rounded-[12px]
                  border-0
                  bg-[#F5F3F5]
                  px-3
                  text-[14px]
                  outline-none
                "
              />

              <input
                type="date"
                value={
                  filters.endDate
                }
                onChange={(
                  event,
                ) =>
                  setFilters(
                    (
                      previous,
                    ) => ({
                      ...previous,
                      endDate:
                        event.target
                          .value,
                    }),
                  )
                }
                className="
                  h-[50px]
                  min-w-0
                  rounded-[12px]
                  border-0
                  bg-[#F5F3F5]
                  px-3
                  text-[14px]
                  outline-none
                "
              />
            </div>

            <motion.button
              type="button"
              whileTap={{
                scale: 0.98,
              }}
              onClick={() => {
                onApply(filters);
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
              onClick={reset}
              className="
                mt-3
                h-[52px]
                w-full
                rounded-[14px]
                border
                border-[#E9E4EC]
                text-[14px]
                font-semibold
                text-[#F05B4D]
              "
            >
              Reset
            </button>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}