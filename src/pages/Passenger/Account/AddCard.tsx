import {
  CreditCard,
  Delete,
} from "lucide-react";
import {
  motion,
} from "framer-motion";
import {
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import RideHeader from "../../../components/passenger/ride/RideHeader";

type ActiveField =
  | "card"
  | "expiry"
  | "cvv";

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

function formatCardNumber(value: string) {
  const numbers =
    onlyNumbers(value).slice(0, 16);

  return numbers
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value: string) {
  const numbers =
    onlyNumbers(value).slice(0, 4);

  if (numbers.length <= 2) {
    return numbers;
  }

  return `${numbers.slice(
    0,
    2,
  )}/${numbers.slice(2)}`;
}

export default function AddCard() {
  const navigate = useNavigate();

  const [cardNumber, setCardNumber] =
    useState("");

  const [expiry, setExpiry] =
    useState("");

  const [cvv, setCvv] =
    useState("");

  const [activeField, setActiveField] =
    useState<ActiveField>("card");

  const [submitting, setSubmitting] =
    useState(false);

  const cardRef =
    useRef<HTMLInputElement>(null);

  const expiryRef =
    useRef<HTMLInputElement>(null);

  const cvvRef =
    useRef<HTMLInputElement>(null);

  const isValid = useMemo(() => {
    return (
      onlyNumbers(cardNumber).length === 16 &&
      expiry.length === 5 &&
      cvv.length === 3
    );
  }, [
    cardNumber,
    expiry,
    cvv,
  ]);

  const focusField = (
    field: ActiveField,
  ) => {
    setActiveField(field);

    window.setTimeout(() => {
      if (field === "card") {
        cardRef.current?.focus();
      }

      if (field === "expiry") {
        expiryRef.current?.focus();
      }

      if (field === "cvv") {
        cvvRef.current?.focus();
      }
    }, 0);
  };

  const appendNumber = (
    number: string,
  ) => {
    if (activeField === "card") {
      const raw =
        onlyNumbers(cardNumber);

      if (raw.length >= 16) {
        focusField("expiry");
        return;
      }

      const next =
        formatCardNumber(
          raw + number,
        );

      setCardNumber(next);

      if (
        onlyNumbers(next).length ===
        16
      ) {
        focusField("expiry");
      }

      return;
    }

    if (activeField === "expiry") {
      const raw =
        onlyNumbers(expiry);

      if (raw.length >= 4) {
        focusField("cvv");
        return;
      }

      const next =
        formatExpiry(
          raw + number,
        );

      setExpiry(next);

      if (
        onlyNumbers(next).length ===
        4
      ) {
        focusField("cvv");
      }

      return;
    }

    if (cvv.length < 3) {
      setCvv(
        (previous) =>
          previous + number,
      );
    }
  };

  const removeNumber = () => {
    if (activeField === "card") {
      setCardNumber((previous) =>
        formatCardNumber(
          onlyNumbers(previous).slice(
            0,
            -1,
          ),
        ),
      );

      return;
    }

    if (activeField === "expiry") {
      setExpiry((previous) =>
        formatExpiry(
          onlyNumbers(previous).slice(
            0,
            -1,
          ),
        ),
      );

      return;
    }

    setCvv((previous) =>
      previous.slice(0, -1),
    );
  };

  const handleAddCard = () => {
    if (!isValid || submitting) {
      return;
    }

    setSubmitting(true);

    // Replace with the real card/payment API.
    window.setTimeout(() => {
      navigate(
        "/passenger/account/payment-methods",
        {
          replace: true,
        },
      );
    }, 900);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      <RideHeader
        title="Add Card"
        onBack={() =>
          navigate(
            "/passenger/account/payment-methods",
          )
        }
      />

      <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col px-5 pb-5 pt-5 sm:px-7">
        {/* CARD NUMBER */}

        <div
          onClick={() =>
            focusField("card")
          }
          className={`
            flex min-h-[58px]
            items-center gap-3
            rounded-[13px]
            border px-4
            transition

            ${
              activeField === "card"
                ? "border-[#B59AD0] bg-[#F8F6FA]"
                : "border-transparent bg-[#F6F5F6]"
            }
          `}
        >
          <CreditCard
            size={19}
            className="shrink-0 text-[#7442AD]"
          />

          <div className="min-w-0 flex-1">
            {cardNumber && (
              <p className="text-[13px] text-[#AAA4AE]">
                Card number
              </p>
            )}

            <input
              ref={cardRef}
              value={cardNumber}
              onFocus={() =>
                setActiveField(
                  "card",
                )
              }
              onChange={(event) =>
                setCardNumber(
                  formatCardNumber(
                    event.target
                      .value,
                  ),
                )
              }
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="Card number"
              className="w-full bg-transparent text-[16px] font-medium text-[#302B34] outline-none placeholder:text-[#C5C0C7]"
            />
          </div>
        </div>

        {/* EXPIRY + CVV */}

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div
            onClick={() =>
              focusField("expiry")
            }
            className={`
              flex min-h-[58px]
              items-center
              rounded-[13px]
              border px-4

              ${
                activeField ===
                "expiry"
                  ? "border-[#B59AD0] bg-[#F8F6FA]"
                  : "border-transparent bg-[#F6F5F6]"
              }
            `}
          >
            <div className="w-full">
              {expiry && (
                <p className="text-[13px] text-[#AAA4AE]">
                  Expiry date
                </p>
              )}

              <input
                ref={expiryRef}
                value={expiry}
                onFocus={() =>
                  setActiveField(
                    "expiry",
                  )
                }
                onChange={(
                  event,
                ) =>
                  setExpiry(
                    formatExpiry(
                      event.target
                        .value,
                    ),
                  )
                }
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="Expiry date"
                className="w-full bg-transparent text-[16px] font-medium text-[#302B34] outline-none placeholder:text-[#C5C0C7]"
              />
            </div>
          </div>

          <div
            onClick={() =>
              focusField("cvv")
            }
            className={`
              flex min-h-[58px]
              items-center
              rounded-[13px]
              border px-4

              ${
                activeField === "cvv"
                  ? "border-[#B59AD0] bg-[#F8F6FA]"
                  : "border-transparent bg-[#F6F5F6]"
              }
            `}
          >
            <div className="w-full">
              {cvv && (
                <p className="text-[13px] text-[#AAA4AE]">
                  CVV
                </p>
              )}

              <input
                ref={cvvRef}
                value={cvv}
                onFocus={() =>
                  setActiveField(
                    "cvv",
                  )
                }
                onChange={(
                  event,
                ) =>
                  setCvv(
                    onlyNumbers(
                      event.target
                        .value,
                    ).slice(0, 3),
                  )
                }
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="CVV"
                type="password"
                className="w-full bg-transparent text-[16px] font-medium text-[#302B34] outline-none placeholder:text-[#C5C0C7]"
              />
            </div>
          </div>
        </div>

        <p className="mt-4 text-[13px] leading-5 text-[#8F8994]">
          To verify this card, your bank may temporarily hold a small amount of money in your account.{" "}

          <button
            type="button"
            className="font-medium text-[#7442AD]"
          >
            Learn more
          </button>
        </p>

        <div className="flex-1" />

        <motion.button
          type="button"
          whileTap={
            isValid
              ? { scale: 0.98 }
              : undefined
          }
          disabled={
            !isValid ||
            submitting
          }
          onClick={
            handleAddCard
          }
          className="
            mb-3 h-[56px] w-full
            rounded-[13px]
            bg-[#7442AD]
            text-[16px]
            font-semibold
            text-white
            shadow-[0_8px_24px_rgba(116,66,173,0.22)]
            transition
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          {submitting
            ? "Adding card..."
            : "Add card"}
        </motion.button>
      </main>

      {/* FIGMA-STYLE DEVELOPMENT KEYPAD */}
      {/* <div className="border-t border-[#E2E3E7] bg-[#E4E7ED] px-5 pb-[calc(14px+env(safe-area-inset-bottom))] pt-4 md:hidden">
        <div className="mx-auto grid max-w-[420px] grid-cols-3 gap-2.5">
          {[
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
          ].map(
            (number) => (
              <motion.button
                key={number}
                type="button"
                whileTap={{
                  scale: 0.94,
                }}
                onClick={() =>
                  appendNumber(
                    number,
                  )
                }
                className="h-[45px] rounded-[7px] bg-white text-[16px] font-semibold text-[#22202A] shadow-sm"
              >
                {number}
              </motion.button>
            ),
          )}

          <div />

          <motion.button
            type="button"
            whileTap={{
              scale: 0.94,
            }}
            onClick={() =>
              appendNumber("0")
            }
            className="h-[45px] rounded-[7px] bg-white text-[16px] font-semibold text-[#22202A] shadow-sm"
          >
            0
          </motion.button>

          <motion.button
            type="button"
            whileTap={{
              scale: 0.94,
            }}
            onClick={
              removeNumber
            }
            className="flex h-[45px] items-center justify-center text-[#22202A]"
          >
            <Delete size={21} />
          </motion.button>
        </div>
      </div> */}
    </div>
  );
}