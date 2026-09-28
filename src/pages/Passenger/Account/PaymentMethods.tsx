import {
  Banknote,
  ChevronRight,
  CreditCard,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import RideHeader from "../../../components/passenger/ride/RideHeader";
import { usePassengerRide } from "../../../context/PassengerRideContext";

import type { PaymentMethod } from "../../../types/passengerRide";

const methods: PaymentMethod[] = [
  {
    id: "mastercard-7832",
    type: "card",
    label: "Mastercard •••• 7832",
    detail: "Exp 09/28",
  },
  {
    id: "visa-4521",
    type: "card",
    label: "Visa •••• 4521",
    detail: "Expires 12/27",
  },
  {
    id: "cash",
    type: "cash",
    label: "Cash",
    detail: "Paid Driver directly",
  },
];

function PaymentIcon({
  method,
}: {
  method: PaymentMethod;
}) {
  if (method.type === "cash") {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#EDF8EF] text-[#28A45D]">
        <Banknote size={21} />
      </span>
    );
  }

  const mastercard =
    method.label.toLowerCase().includes("mastercard");

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#F7F5F8]">
      {mastercard ? (
        <span className="relative flex h-6 w-8 items-center justify-center">
          <span className="absolute left-[3px] h-[18px] w-[18px] rounded-full bg-[#EA001B]" />
          <span className="absolute right-[3px] h-[18px] w-[18px] rounded-full bg-[#FF9900]/90" />

          <span className="relative z-10 text-[8px] font-bold text-white">
            MC
          </span>
        </span>
      ) : (
        <span className="text-[13px] font-extrabold italic text-[#1677C8]">
          VISA
        </span>
      )}
    </span>
  );
}

export default function PaymentMethods() {
  const navigate = useNavigate();

  const {
    ride,
    setPaymentMethod,
  } = usePassengerRide();

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFB]">
      <RideHeader
        title="Payment Methods"
        onBack={() =>
          navigate("/passenger/account")
        }
      />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-12 pt-5 sm:px-7">
        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="overflow-hidden rounded-[18px] bg-white shadow-[0_5px_25px_rgba(31,19,42,0.04)]"
        >
          {methods.map((method) => {
            const selected =
              ride.paymentMethod.id === method.id;

            return (
              <motion.button
                key={method.id}
                type="button"
                whileTap={{
                  scale: 0.99,
                }}
                onClick={() =>
                  setPaymentMethod(method)
                }
                className="flex min-h-[72px] w-full items-center gap-3 border-b border-[#EEEAF1] px-4 py-3 text-left last:border-b-0"
              >
                <PaymentIcon method={method} />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-[#302B34]">
                    {method.label}
                  </span>

                  {method.detail && (
                    <span className="mt-0.5 block text-[13px] text-[#8F7BA7]">
                      {method.detail}
                    </span>
                  )}
                </span>

                <span
                  className={`
                    flex h-[18px] w-[18px]
                    items-center justify-center
                    rounded-full border

                    ${
                      selected
                        ? "border-[#7442AD] bg-[#7442AD]"
                        : "border-[#D7D1DA] bg-white"
                    }
                  `}
                >
                  {selected && (
                    <span className="h-[6px] w-[6px] rounded-full bg-white" />
                  )}
                </span>
              </motion.button>
            );
          })}

          <motion.button
            type="button"
            whileTap={{
              scale: 0.99,
            }}
            onClick={() =>
              navigate(
                "/passenger/account/payment-methods/add-card",
              )
            }
            className="flex min-h-[72px] w-full items-center gap-3 px-4 py-3 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#F6F4F7] text-[#77717B]">
              <Plus size={20} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-[#302B34]">
                Add Card
              </span>

              <span className="mt-0.5 block text-[13px] text-[#8F7BA7]">
                Add Debit/credit Card
              </span>
            </span>

            <ChevronRight
              size={19}
              className="text-[#AAA4AE]"
            />
          </motion.button>
        </motion.div>

        <div className="mt-5 flex gap-3 rounded-[15px] bg-[#F3EDF9] p-4">
          <CreditCard
            size={20}
            className="mt-0.5 shrink-0 text-[#7442AD]"
          />

          <p className="text-[13px] leading-5 text-[#756E79]">
            Your saved payment methods can be used when booking a Sur-Drive ride.
          </p>
        </div>
      </main>
    </div>
  );
}