import {
  Check,
  Download,
  Mail,
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
  PassengerTrip,
} from "../../../types/passengerTrip";

type Props = {
  open: boolean;

  trip: PassengerTrip;

  onClose: () => void;
};

export default function ReceiptSheet({
  open,
  trip,
  onClose,
}: Props) {
  const [
    downloading,
    setDownloading,
  ] = useState(false);

  const [
    emailed,
    setEmailed,
  ] = useState(false);

  /*
   * FRONTEND PREVIEW.
   *
   * Replace this with the backend
   * receipt PDF endpoint later.
   */
  const downloadReceipt = () => {
    setDownloading(true);

    window.setTimeout(() => {
      setDownloading(false);

      console.log(
        "Download receipt:",
        trip.id,
      );
    }, 900);
  };

  /*
   * FRONTEND PREVIEW.
   *
   * Replace with the resend-receipt
   * endpoint later.
   */
  const resendReceipt = () => {
    setEmailed(true);

    window.setTimeout(() => {
      setEmailed(false);
    }, 1800);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* BACKDROP */}

          <motion.button
            type="button"
            aria-label="Close receipt"
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
              backdrop-blur-[4px]
            "
          />

          {/* SHEET */}

          <motion.section
            initial={{
              y: "100%",
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: "100%",
              opacity: 0,
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
              z-[1200]
              rounded-t-[28px]
              bg-white
              px-5
              pb-[calc(22px+env(safe-area-inset-bottom))]
              pt-5
              shadow-[0_-20px_60px_rgba(30,20,38,0.18)]

              sm:px-6

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
                Get Receipt
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
                  text-[#6F6873]
                "
              >
                <X size={18} />
              </motion.button>
            </div>

            <div className="my-5 h-px bg-[#EEEAF0]" />

            <motion.button
              type="button"
              disabled={
                downloading
              }
              whileTap={{
                scale: 0.98,
              }}
              onClick={
                downloadReceipt
              }
              className="
                flex
                h-[56px]
                w-full
                items-center
                justify-center
                gap-2
                rounded-[14px]
                bg-[#7442AD]
                text-[15px]
                font-semibold
                text-white
                disabled:opacity-70
              "
            >
              <Download
                size={18}
              />

              {downloading
                ? "Preparing Receipt..."
                : "Download Receipt"}
            </motion.button>

            <motion.button
              type="button"
              whileTap={{
                scale: 0.98,
              }}
              onClick={
                resendReceipt
              }
              className="
                mt-3
                flex
                h-[54px]
                w-full
                items-center
                justify-center
                gap-2
                rounded-[14px]
                border
                border-[#E7E1EA]
                bg-white
                text-[15px]
                font-semibold
                text-[#7442AD]
              "
            >
              {emailed ? (
                <>
                  <Check
                    size={18}
                  />

                  Receipt Sent
                </>
              ) : (
                <>
                  <Mail
                    size={18}
                  />

                  Resend Receipt
                  to mail
                </>
              )}
            </motion.button>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}