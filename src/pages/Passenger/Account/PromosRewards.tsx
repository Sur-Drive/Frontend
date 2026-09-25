import {
  Check,
  Gift,
  TicketPercent,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import RideHeader from "../../../components/passenger/ride/RideHeader";
import { usePassengerRide } from "../../../context/PassengerRideContext";

type Promo = {
  id: string;
  code: string;
  title: string;
  description: string;
  expiry: string;
};

const availablePromos: Promo[] = [
  {
    id: "first-ride-20",
    code: "FIRST20",
    title: "20% OFF First Ride",
    description:
      "Valid for your very first ride. Capped at ₦1,000.",
    expiry: "Expires in 7 days",
  },
];

type MessageState =
  | {
      type: "success";
      message: string;
    }
  | {
      type: "error";
      message: string;
    }
  | null;

export default function PromosRewards() {
  const navigate = useNavigate();

  const {
    ride,
    setPromoCode,
  } = usePassengerRide();

  const [code, setCode] =
    useState("");

  const [message, setMessage] =
    useState<MessageState>(null);

  const [applying, setApplying] =
    useState(false);

  const activePromo = useMemo(
    () =>
      availablePromos.find(
        (promo) =>
          promo.code ===
          ride.promoCode,
      ),
    [ride.promoCode],
  );

  const handleApply = () => {
    const normalizedCode =
      code.trim().toUpperCase();

    if (!normalizedCode) {
      setMessage({
        type: "error",
        message:
          "Enter a promo code to continue.",
      });

      return;
    }

    setApplying(true);
    setMessage(null);

    /*
      TEMPORARY FRONTEND VALIDATION.

      Replace this with the promo validation
      endpoint when the backend is connected.
    */

    window.setTimeout(() => {
      const promo =
        availablePromos.find(
          (item) =>
            item.code ===
            normalizedCode,
        );

      if (!promo) {
        setApplying(false);

        setMessage({
          type: "error",
          message:
            "This promo code is invalid or has expired.",
        });

        return;
      }

      setPromoCode(promo.code);

      setCode("");

      setApplying(false);

      setMessage({
        type: "success",
        message:
          "Promo successfully applied.",
      });
    }, 650);
  };

  const removePromo = () => {
    setPromoCode(null);

    setMessage({
      type: "success",
      message:
        "Promo removed.",
    });
  };

  return (
    <div className="min-h-[100dvh] bg-white">
      {/* FIXED / STICKY HEADER */}

      <RideHeader
        title="Promos & Rewards"
        onBack={() =>
          navigate(
            "/passenger/account",
          )
        }
      />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-12 pt-5 sm:px-7">
        {/* PROMO INPUT */}

        <motion.section
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <h2 className="text-[16px] font-semibold text-[#302B34]">
            Have a Promo Code?
          </h2>

          <div className="mt-3 flex gap-3">
            <div className="relative min-w-0 flex-1">
              <TicketPercent
                size={18}
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-[#A69EAC]
                "
              />

              <input
                type="text"
                value={code}
                onChange={(
                  event,
                ) => {
                  setCode(
                    event.target.value.toUpperCase(),
                  );

                  if (message) {
                    setMessage(null);
                  }
                }}
                onKeyDown={(
                  event,
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    handleApply();
                  }
                }}
                placeholder="Enter Code here..."
                autoCapitalize="characters"
                className="
                  h-[56px]
                  w-full
                  rounded-[13px]
                  border
                  border-transparent
                  bg-[#F7F6F8]
                  pl-11
                  pr-4
                  text-[16px]
                  font-medium
                  uppercase
                  text-[#302B34]
                  outline-none
                  transition

                  placeholder:normal-case
                  placeholder:text-[#C3BDC6]

                  focus:border-[#B89CD2]
                  focus:bg-white
                  focus:ring-4
                  focus:ring-[#7442AD]/5
                "
              />
            </div>

            <motion.button
              type="button"
              whileTap={
                code.trim() &&
                !applying
                  ? {
                      scale: 0.96,
                    }
                  : undefined
              }
              disabled={
                !code.trim() ||
                applying
              }
              onClick={
                handleApply
              }
              className="
                h-[56px]
                min-w-[100px]
                rounded-[13px]
                bg-[#7442AD]
                px-5
                text-[16px]
                font-semibold
                text-white
                shadow-[0_8px_24px_rgba(116,66,173,0.22)]
                transition

                disabled:cursor-not-allowed
                disabled:opacity-45
              "
            >
              {applying
                ? "Applying..."
                : "Apply"}
            </motion.button>
          </div>

          {/* VALIDATION MESSAGE */}

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{
                  opacity: 0,
                  height: 0,
                  y: -5,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                }}
                className={`
                  mt-3 flex
                  items-center
                  gap-2
                  rounded-[12px]
                  px-3 py-2.5
                  text-[13px]
                  font-medium

                  ${
                    message.type ===
                    "success"
                      ? `
                        bg-[#ECF8F0]
                        text-[#348557]
                      `
                      : `
                        bg-[#FFF0EF]
                        text-[#D6534F]
                      `
                  }
                `}
              >
                {message.type ===
                "success" ? (
                  <Check
                    size={17}
                    strokeWidth={2.4}
                  />
                ) : (
                  <X
                    size={17}
                    strokeWidth={2.4}
                  />
                )}

                {message.message}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* ACTIVE PROMOS */}

        <section className="mt-7">
          <h2 className="text-[17px] font-semibold text-[#302B34]">
            Active Promos
          </h2>

          <div className="mt-3 space-y-3">
            {availablePromos.map(
              (promo, index) => {
                const isApplied =
                  activePromo?.id ===
                  promo.id;

                return (
                  <motion.div
                    key={promo.id}
                    initial={{
                      opacity: 0,
                      y: 14,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        index *
                        0.06,
                    }}
                    className={`
                      relative
                      overflow-hidden
                      rounded-[17px]
                      border
                      bg-white
                      p-4
                      shadow-[0_6px_25px_rgba(31,19,42,0.045)]

                      ${
                        isApplied
                          ? "border-[#B99BD5]"
                          : "border-[#F0EDF2]"
                      }
                    `}
                  >
                    {/* subtle accent */}

                    <div
                      className="
                        absolute
                        inset-y-0
                        left-0
                        w-[4px]
                        bg-[#7442AD]
                      "
                    />

                    <div className="flex items-start gap-3">
                      <motion.div
                        whileHover={{
                          rotate: -5,
                          scale: 1.04,
                        }}
                        className="
                          flex
                          h-11
                          w-11
                          shrink-0
                          items-center
                          justify-center
                          rounded-[12px]
                          bg-[#F0E8F8]
                          text-[#7442AD]
                        "
                      >
                        <TicketPercent
                          size={20}
                        />
                      </motion.div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-[16px] font-semibold text-[#302B34]">
                              {
                                promo.title
                              }
                            </h3>

                            <p className="mt-1 text-[13px] leading-5 text-[#817A85]">
                              {
                                promo.description
                              }
                            </p>
                          </div>

                          {isApplied && (
                            <motion.span
                              initial={{
                                opacity: 0,
                                scale: 0.8,
                              }}
                              animate={{
                                opacity: 1,
                                scale: 1,
                              }}
                              className="
                                shrink-0
                                rounded-full
                                bg-[#E7F7EC]
                                px-2.5
                                py-1
                                text-[13px]
                                font-semibold
                                text-[#32915A]
                              "
                            >
                              Applied
                            </motion.span>
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-3">
                          <p className="text-[13px] font-medium text-[#D59025]">
                            {
                              promo.expiry
                            }
                          </p>

                          {!isApplied ? (
                            <button
                              type="button"
                              onClick={() => {
                                setCode(
                                  promo.code,
                                );

                                setMessage(
                                  null,
                                );
                              }}
                              className="text-[13px] font-semibold text-[#7442AD]"
                            >
                              Use code
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={
                                removePromo
                              }
                              className="text-[13px] font-semibold text-[#D85A59]"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              },
            )}
          </div>
        </section>

        {/* EMPTY STATE EXAMPLE */}

        {availablePromos.length ===
          0 && (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="flex min-h-[360px] flex-col items-center justify-center px-5 text-center"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F2ECF8] text-[#7442AD]">
              <Gift size={28} />
            </span>

            <h3 className="mt-5 text-[18px] font-semibold text-[#302B34]">
              No active promos
            </h3>

            <p className="mt-2 max-w-[300px] text-[14px] leading-6 text-[#918B95]">
              New promotions and rewards will appear here when they're available.
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}