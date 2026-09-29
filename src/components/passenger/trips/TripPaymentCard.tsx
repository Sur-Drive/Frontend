import {
  Banknote,
  CreditCard,
  ReceiptText,
  WalletCards,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import type {
  PassengerTrip,
} from "../../../types/passengerTrip";

type Props = {
  trip: PassengerTrip;

  onGetReceipt?: () => void;
};

const formatCurrency = (
  value: number,
) =>
  `₦${value.toLocaleString(
    "en-NG",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`;

export default function TripPaymentCard({
  trip,
  onGetReceipt,
}: Props) {
  const {
    payment,
    status,
  } = trip;

  const PaymentIcon =
    payment.method.type ===
    "card"
      ? CreditCard
      : payment.method.type ===
          "wallet"
        ? WalletCards
        : Banknote;

  return (
    <section
      className="
        rounded-[20px]
        border
        border-[#F0EDF2]
        bg-white
        p-5
        shadow-[0_5px_25px_rgba(30,20,38,0.04)]
      "
    >
      <h2
        className="
          text-[18px]
          font-semibold
          text-[#302B34]
        "
      >
        Payment
      </h2>

      <div className="mt-5 space-y-3">
        {status ===
          "completed" && (
          <>
            <PaymentRow
              label="Fare"
              value={formatCurrency(
                payment.fare,
              )}
            />

            {payment.bookingFee !==
              undefined && (
              <PaymentRow
                label="Booking Fee"
                value={formatCurrency(
                  payment.bookingFee,
                )}
              />
            )}
          </>
        )}

        {status ===
          "cancelled" && (
          <PaymentRow
            label="Cancellation Fee"
            value={formatCurrency(
              payment.cancellationFee ??
                0,
            )}
          />
        )}

        <div className="h-px bg-[#EDE9EF]" />

        <PaymentRow
          label="Total"
          value={formatCurrency(
            payment.total,
          )}
          strong
        />
      </div>

      {/* PAYMENT METHOD */}

      <div
        className="
          mt-5
          flex
          items-center
          gap-3
          border-t
          border-[#EEEAF0]
          pt-5
        "
      >
        <span
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-[11px]

            ${
              payment.method.type ===
              "cash"
                ? "bg-[#EAF8EF] text-[#32A75C]"
                : "bg-[#F2ECF8] text-[#7442AD]"
            }
          `}
        >
          <PaymentIcon
            size={20}
          />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className="
              truncate
              text-[15px]
              font-semibold
              text-[#302B34]
            "
          >
            {
              payment.method
                .label
            }
          </p>

          {payment.method
            .detail && (
            <p
              className="
                mt-1
                text-[13px]
                text-[#96909A]
              "
            >
              {
                payment.method
                  .detail
              }
            </p>
          )}
        </div>
      </div>

      {status ===
        "completed" &&
        onGetReceipt && (
          <motion.button
            type="button"
            whileTap={{
              scale: 0.98,
            }}
            onClick={
              onGetReceipt
            }
            className="
              mt-5
              flex
              h-[54px]
              w-full
              items-center
              justify-center
              gap-2
              rounded-[14px]
              bg-[#7442AD]
              text-[15px]
              font-semibold
              text-white
            "
          >
            <ReceiptText
              size={18}
            />

            Get Receipt
          </motion.button>
        )}
    </section>
  );
}

function PaymentRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={`
          text-[14px]

          ${
            strong
              ? "font-semibold text-[#302B34]"
              : "text-[#625C66]"
          }
        `}
      >
        {label}
      </span>

      <span
        className={`
          text-right
          text-[14px]

          ${
            strong
              ? "font-bold text-[#302B34]"
              : "font-medium text-[#302B34]"
          }
        `}
      >
        {value}
      </span>
    </div>
  );
}