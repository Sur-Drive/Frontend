import {
  Building2,
  Check,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { motion } from "framer-motion";

import RideModalSheet from "./RideModalSheet";

import type {
  PaymentMethod,
} from "../../../types/passengerRide";

interface PaymentMethodSheetProps {
  open: boolean;
  onClose: () => void;
  selected: PaymentMethod | null;
  methods?: PaymentMethod[];
  onSelect: (method: PaymentMethod) => void;
}

type OnlinePaymentChannel = "card" | "transfer";

function getPaymentChannel(
  method: PaymentMethod,
): OnlinePaymentChannel | null {
  const value = `${method.id} ${method.type}`.toLowerCase();

  if (value.includes("transfer")) {
    return "transfer";
  }

  if (value.includes("card")) {
    return "card";
  }

  return null;
}

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "paystack-card",
    type: "card",
    label: "Pay with Card",
  },
  {
    id: "paystack-transfer",
    type: "card",
    label: "Bank Transfer",
  },
];

export default function PaymentMethodSheet({
  open,
  onClose,
  selected,
  methods = DEFAULT_PAYMENT_METHODS,
  onSelect,
}: PaymentMethodSheetProps) {
  const onlineMethods = methods.filter(
    (method) => getPaymentChannel(method) !== null,
  );

  return (
    <RideModalSheet
      open={open}
      onClose={onClose}
      title="Payment Method"
      description="Choose how you would like to pay for your ride."
    >
      <div className="space-y-3">
        {onlineMethods.map((method, index) => {
          const channel = getPaymentChannel(method);

          if (!channel) return null;

          const Icon =
            channel === "transfer"
              ? Building2
              : CreditCard;

          const active = selected?.id === method.id;

          const description =
            channel === "transfer"
              ? "Pay securely via bank transfer"
              : "Pay securely with your debit or credit card";

          return (
            <motion.button
              key={method.id}
              type="button"
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.05,
              }}
              whileTap={{
                scale: 0.985,
              }}
              onClick={() => {
                onSelect(method);
                onClose();
              }}
              className={`
                flex min-h-[78px] w-full
                items-center gap-3
                rounded-[16px] border
                p-4 text-left
                transition-all duration-200
                ${
                  active
                    ? "border-[#7442AD] bg-[#FBF8FE] shadow-[0_4px_16px_rgba(116,66,173,0.08)]"
                    : "border-[#ECE8EF] bg-white hover:border-[#D5C3E7]"
                }
              `}
            >
              <span
                className={`
                  flex h-12 w-12
                  shrink-0 items-center
                  justify-center rounded-[14px]
                  ${
                    active
                      ? "bg-[#7442AD] text-white"
                      : "bg-[#F1EAF7] text-[#7442AD]"
                  }
                `}
              >
                <Icon size={22} strokeWidth={1.8} />
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-[#302B34]">
                  {method.label}
                </p>

                <p className="mt-1 text-[12px] leading-5 text-[#96909A]">
                  {description}
                </p>

                {channel === "card" && (
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#7442AD]">
                    <LockKeyhole size={11} />
                    Secure checkout
                  </span>
                )}
              </div>

              <span
                className={`
                  flex h-6 w-6
                  shrink-0 items-center
                  justify-center rounded-full
                  border transition-colors
                  ${
                    active
                      ? "border-[#7442AD] bg-[#7442AD] text-white"
                      : "border-[#DAD4DF] bg-white"
                  }
                `}
              >
                {active && (
                  <Check size={14} strokeWidth={3} />
                )}
              </span>
            </motion.button>
          );
        })}
      </div>

      {onlineMethods.length === 0 && (
        <div className="rounded-[14px] bg-[#FFF7F2] p-4 text-[13px] text-[#A15B36]">
          No supported online payment method is available.
        </div>
      )}

      <div className="mt-5 rounded-[15px] border border-[#EDE5F4] bg-[#FAF7FD] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEE4F7] text-[#7442AD]">
            <ShieldCheck size={19} />
          </span>

          <div>
            <p className="text-[13px] font-semibold text-[#44354F]">
              Secure online payment
            </p>

            <p className="mt-1 text-[12px] leading-[19px] text-[#82788A]">
              Your final fare will be calculated when
              your trip ends. Payment will be processed
              securely through Paystack.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-[12px] text-[#96909A]">
        <LockKeyhole size={13} />
        <span>Secure payment powered by Paystack</span>
      </div>
    </RideModalSheet>
  );
}


// import {
//   Banknote,
//   Check,
//   CreditCard,
//   Plus,
//   WalletCards,
// } from "lucide-react";
// import { motion } from "framer-motion";

// import RideModalSheet from "./RideModalSheet";

// import type {
//   PaymentMethod,
// } from "../../../types/passengerRide";

// interface PaymentMethodSheetProps {
//   open: boolean;
//   onClose: () => void;
//   selected: PaymentMethod;
//   methods?: PaymentMethod[];
//   onSelect: (
//     method: PaymentMethod,
//   ) => void;
// }

// const getPaymentIcon = (
//   method: PaymentMethod,
// ) => {
//   const text =
//     `${method.id} ${method.label}`.toLowerCase();

//   if (text.includes("cash")) {
//     return Banknote;
//   }

//   if (
//     text.includes("wallet")
//   ) {
//     return WalletCards;
//   }

//   return CreditCard;
// };

// export default function PaymentMethodSheet({
//   open,
//   onClose,
//   selected,
//   methods = [],
//   onSelect,
// }: PaymentMethodSheetProps) {
//   return (
//     <RideModalSheet
//       open={open}
//       onClose={onClose}
//       title="Payment method"
//       description="Choose how you want to pay for this ride."
//     >
//       <div className="space-y-3">
//         {methods.map((method) => {
//           const Icon =
//             getPaymentIcon(method);

//           const active =
//             selected.id === method.id;

//           return (
//             <motion.button
//               key={method.id}
//               type="button"
//               whileTap={{
//                 scale: 0.985,
//               }}
//               onClick={() => {
//                 onSelect(method);
//                 onClose();
//               }}
//               className={`
//                 flex min-h-[68px] w-full
//                 items-center gap-3
//                 rounded-[16px] border
//                 p-4 text-left
//                 ${
//                   active
//                     ? `
//                       border-[#7442AD]
//                       bg-[#FBF8FE]
//                     `
//                     : `
//                       border-[#ECE8EF]
//                       bg-white
//                     `
//                 }
//               `}
//             >
//               <span
//                 className="
//                   flex h-11 w-11
//                   shrink-0 items-center
//                   justify-center rounded-full
//                   bg-[#F1EAF7]
//                   text-[#7442AD]
//                 "
//               >
//                 <Icon size={20} />
//               </span>

//               <div className="flex-1 min-w-0">
//                 <p className="truncate text-[15px] font-semibold text-[#302B34]">
//                   {method.label}
//                 </p>

//                 {"description" in method &&
//                   typeof method.description ===
//                     "string" && (
//                     <p className="mt-1 truncate text-[12px] text-[#96909A]">
//                       {method.description}
//                     </p>
//                   )}
//               </div>

//               {active && (
//                 <span
//                   className="
//                     flex h-6 w-6
//                     items-center justify-center
//                     rounded-full bg-[#7442AD]
//                     text-white
//                   "
//                 >
//                   <Check
//                     size={14}
//                     strokeWidth={3}
//                   />
//                 </span>
//               )}
//             </motion.button>
//           );
//         })}
//       </div>

//       <motion.button
//         type="button"
//         whileTap={{
//           scale: 0.98,
//         }}
//         className="
//           mt-4 flex h-[52px]
//           w-full items-center
//           justify-center gap-2
//           rounded-[14px]
//           bg-[#F2ECF8]
//           text-[15px] font-semibold
//           text-[#7442AD]
//         "
//       >
//         <Plus size={18} />
//         Add payment method
//       </motion.button>
//     </RideModalSheet>
//   );
// }