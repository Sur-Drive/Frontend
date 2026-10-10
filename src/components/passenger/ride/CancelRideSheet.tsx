import {
  AlertTriangle,
  Check,
  LoaderCircle,
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

import RideModalSheet from "./RideModalSheet";

/* =========================================================
   REASONS
========================================================= */

const reasons = [
  "Driver is taking too long",
  "I changed my mind",
  "Wrong pickup location",
  "Driver asked me to cancel",
  "I found another ride",
  "Driver asked for extra payment",
  "Other",
];

/* =========================================================
   PROPS
========================================================= */

interface CancelRideSheetProps {
  open: boolean;

  onClose: () => void;

  onConfirm: (
    reason: string,
    comment?: string,
  ) =>
    | void
    | Promise<void>;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function CancelRideSheet({
  open,
  onClose,
  onConfirm,
}: CancelRideSheetProps) {
  const [
    step,
    setStep,
  ] =
    useState<
      "confirm" | "reason"
    >("confirm");

  const [
    reason,
    setReason,
  ] = useState("");

  const [
    comment,
    setComment,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  /* =======================================================
     RESET
  ======================================================= */

  useEffect(() => {
    if (!open) {
      setStep(
        "confirm",
      );

      setReason("");

      setComment("");

      setSubmitting(
        false,
      );
    }
  }, [open]);

  /* =======================================================
     CLOSE
  ======================================================= */

  const handleClose = () => {
    if (submitting) {
      return;
    }

    onClose();
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const finish =
    async () => {
      if (
        !reason ||
        submitting
      ) {
        return;
      }

      setSubmitting(true);

      try {
        await onConfirm(
          reason,
          comment.trim() ||
            undefined,
        );

        /*
         * Do NOT automatically close here.
         *
         * The parent page controls the sheet after the
         * backend cancellation succeeds.
         *
         * If cancellation succeeds, SearchingDriver
         * navigates away.
         *
         * If it fails, the sheet remains available.
         */
      } finally {
        setSubmitting(
          false,
        );
      }
    };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <RideModalSheet
      open={open}
      onClose={
        handleClose
      }
    >
      <AnimatePresence mode="wait">
        {step ===
        "confirm" ? (
          <motion.div
            key="confirm"
            initial={{
              opacity: 0,
              x: -12,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -12,
            }}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF0EF] text-[#E45B57]">
              <AlertTriangle
                size={29}
              />
            </div>

            <div className="mt-5 text-center">
              <h2 className="text-[22px] font-semibold text-[#302B34]">
                Are you sure?
              </h2>

              <p className="mx-auto mt-2 max-w-[360px] text-[14px] leading-6 text-[#918B95]">
                Cancelling may
                delay your
                journey. If your
                driver is already
                on the way, a
                cancellation
                policy may apply.
              </p>
            </div>

            <motion.button
              type="button"
              whileTap={{
                scale: 0.98,
              }}
              onClick={() =>
                setStep(
                  "reason",
                )
              }
              className="mt-7 h-[54px] w-full rounded-[14px] bg-[#E45652] text-[16px] font-semibold text-white"
            >
              Cancel Ride
            </motion.button>

            <button
              type="button"
              onClick={
                handleClose
              }
              className="mt-3 h-[50px] w-full rounded-[14px] bg-[#F4EFF8] text-[15px] font-semibold text-[#7442AD]"
            >
              Wait for Driver
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="reason"
            initial={{
              opacity: 0,
              x: 15,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
            }}
          >
            {/* HEADER */}

            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[21px] font-semibold text-[#302B34]">
                  Why are you
                  cancelling?
                </h2>

                <p className="mt-1 text-[14px] text-[#918B95]">
                  This helps us
                  improve your
                  experience.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  submitting
                }
                onClick={
                  handleClose
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F2F7] text-[#77717C] disabled:opacity-40"
              >
                <X
                  size={19}
                />
              </button>
            </div>

            {/* REASONS */}

            <div className="mt-5 space-y-2">
              {reasons.map(
                (item) => {
                  const active =
                    reason ===
                    item;

                  return (
                    <motion.button
                      key={
                        item
                      }
                      type="button"
                      disabled={
                        submitting
                      }
                      whileTap={
                        !submitting
                          ? {
                              scale: 0.99,
                            }
                          : undefined
                      }
                      onClick={() =>
                        setReason(
                          item,
                        )
                      }
                      className={`
                        flex min-h-[52px]
                        w-full items-center
                        justify-between
                        rounded-[14px]
                        border px-4
                        text-left text-[14px]
                        font-medium
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                        ${
                          active
                            ? `
                              border-[#7442AD]
                              bg-[#FBF8FE]
                              text-[#7442AD]
                            `
                            : `
                              border-[#ECE8EF]
                              bg-white
                              text-[#4D4751]
                            `
                        }
                      `}
                    >
                      {
                        item
                      }

                      {active && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7442AD] text-white">
                          <Check
                            size={
                              12
                            }
                            strokeWidth={
                              3
                            }
                          />
                        </span>
                      )}
                    </motion.button>
                  );
                },
              )}
            </div>

            {/* OTHER */}

            {reason ===
              "Other" && (
              <motion.textarea
                initial={{
                  opacity: 0,
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  height: 110,
                }}
                disabled={
                  submitting
                }
                value={
                  comment
                }
                onChange={(
                  event,
                ) =>
                  setComment(
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Tell us what happened..."
                className="mt-4 w-full resize-none rounded-[15px] border border-[#E5E0E8] p-4 text-[16px] outline-none focus:border-[#7442AD] disabled:opacity-60"
              />
            )}

            {/* SUBMIT */}

            <motion.button
              type="button"
              disabled={
                !reason ||
                submitting
              }
              whileTap={
                reason &&
                !submitting
                  ? {
                      scale: 0.98,
                    }
                  : undefined
              }
              onClick={() => {
                void finish();
              }}
              className="mt-6 flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                  />

                  Cancelling...
                </>
              ) : (
                "Done"
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </RideModalSheet>
  );
}