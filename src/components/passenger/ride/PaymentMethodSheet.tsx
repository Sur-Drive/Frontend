import {
  Banknote,
  Check,
  CreditCard,
  Plus,
  WalletCards,
} from "lucide-react";
import { motion } from "framer-motion";

import RideModalSheet from "./RideModalSheet";

import type {
  PaymentMethod,
} from "../../../types/passengerRide";

interface PaymentMethodSheetProps {
  open: boolean;
  onClose: () => void;
  selected: PaymentMethod;
  methods?: PaymentMethod[];
  onSelect: (
    method: PaymentMethod,
  ) => void;
}

const getPaymentIcon = (
  method: PaymentMethod,
) => {
  const text =
    `${method.id} ${method.label}`.toLowerCase();

  if (text.includes("cash")) {
    return Banknote;
  }

  if (
    text.includes("wallet")
  ) {
    return WalletCards;
  }

  return CreditCard;
};

export default function PaymentMethodSheet({
  open,
  onClose,
  selected,
  methods = [],
  onSelect,
}: PaymentMethodSheetProps) {
  return (
    <RideModalSheet
      open={open}
      onClose={onClose}
      title="Payment method"
      description="Choose how you want to pay for this ride."
    >
      <div className="space-y-3">
        {methods.map((method) => {
          const Icon =
            getPaymentIcon(method);

          const active =
            selected.id === method.id;

          return (
            <motion.button
              key={method.id}
              type="button"
              whileTap={{
                scale: 0.985,
              }}
              onClick={() => {
                onSelect(method);
                onClose();
              }}
              className={`
                flex min-h-[68px] w-full
                items-center gap-3
                rounded-[16px] border
                p-4 text-left
                ${
                  active
                    ? `
                      border-[#7442AD]
                      bg-[#FBF8FE]
                    `
                    : `
                      border-[#ECE8EF]
                      bg-white
                    `
                }
              `}
            >
              <span
                className="
                  flex h-11 w-11
                  shrink-0 items-center
                  justify-center rounded-full
                  bg-[#F1EAF7]
                  text-[#7442AD]
                "
              >
                <Icon size={20} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-[#302B34]">
                  {method.label}
                </p>

                {"description" in method &&
                  typeof method.description ===
                    "string" && (
                    <p className="mt-1 truncate text-[12px] text-[#96909A]">
                      {method.description}
                    </p>
                  )}
              </div>

              {active && (
                <span
                  className="
                    flex h-6 w-6
                    items-center justify-center
                    rounded-full bg-[#7442AD]
                    text-white
                  "
                >
                  <Check
                    size={14}
                    strokeWidth={3}
                  />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <motion.button
        type="button"
        whileTap={{
          scale: 0.98,
        }}
        className="
          mt-4 flex h-[52px]
          w-full items-center
          justify-center gap-2
          rounded-[14px]
          bg-[#F2ECF8]
          text-[15px] font-semibold
          text-[#7442AD]
        "
      >
        <Plus size={18} />
        Add payment method
      </motion.button>
    </RideModalSheet>
  );
}