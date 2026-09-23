import {
  BadgePercent,
  Banknote,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import PassengerMap from "../../../components/passenger/ride/PassengerMap";
import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";
import RideOptionCard from "../../../components/passenger/ride/RideOptionCard";
import PaymentMethodSheet from "../../../components/passenger/ride/PaymentMethodSheet";
import PromoCodeSheet from "../../../components/passenger/ride/PromoCodeSheet";

import {
  rideOptions,
} from "../../../data/passengerRide";

import {
  usePassengerRide,
} from "../../../context/PassengerRideContext";

import type {
  PaymentMethod,
} from "../../../types/passengerRide";

const paymentMethods: PaymentMethod[] = [
  {
    id: "card-4412",
    type: "card",
    label: "MasterCard •••• 4412",
  },
  {
    id: "cash",
    type: "cash",
    label: "Cash",
  },
//   {
//   id: "surdrive-wallet",
//   type: "wallet",
//   label: "Sur-Drive Wallet",
//   detail: "₦24,500 available",
// }
];

export default function SelectRide() {
  const navigate = useNavigate();

  const {
    ride,
    selectRide,
    setEstimatedFare,
    setRideStatus,

    // Rename these two ONLY if your context
    // currently uses different names.
    setPaymentMethod,
    setPromoCode,
  } = usePassengerRide();

  const [
    paymentSheetOpen,
    setPaymentSheetOpen,
  ] = useState(false);

  const [
    promoSheetOpen,
    setPromoSheetOpen,
  ] = useState(false);

  if (
    !ride.pickup ||
    !ride.destination
  ) {
    return (
      <Navigate
        to="/passenger/book-ride"
        replace
      />
    );
  }

  const pickup =
    ride.pickup.coordinates;

  const destination =
    ride.destination.coordinates;

  const center =
    pickup ??
    destination ?? {
      lat: 6.5244,
      lng: 3.3792,
    };

  const selectedOption =
    rideOptions.find(
      (option) =>
        option.id ===
        ride.selectedRide,
    );

  const handleContinue = () => {
    if (!selectedOption) {
      return;
    }

    setEstimatedFare(
      selectedOption.price,
    );

    setRideStatus("confirming");

    navigate(
      "/passenger/ride/confirm",
    );
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
      <PassengerMap
        center={center}
        pickup={ride.pickup}
        destination={
          ride.destination
        }
        zoom={14}
      />

      <RideMapHeader
        title="Choose a ride"
      />

      <RideBottomSheet>
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#302B34]">
            Choose a ride
          </h1>

          <p className="mt-1 text-[14px] text-[#99939D]">
            Recommended rides near you
          </p>
        </div>

        {/* RIDE OPTIONS */}

        <div className="mt-5 space-y-2">
          {rideOptions.map(
            (option) => (
              <RideOptionCard
                key={option.id}
                option={option}
                selected={
                  ride.selectedRide ===
                  option.id
                }
                onSelect={() =>
                  selectRide(
                    option.id,
                  )
                }
              />
            ),
          )}
        </div>

        <div className="my-5 h-px bg-[#EEEAF0]" />

        {/* PAYMENT */}

        <motion.button
          type="button"
          whileTap={{
            scale: 0.98,
          }}
          onClick={() =>
            setPaymentSheetOpen(
              true,
            )
          }
          className="flex w-full items-center gap-3 py-2 text-left"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2ECF8] text-[#7442AD]">
            <Banknote size={19} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold text-[#302B34]">
              {
                ride.paymentMethod
                  .label
              }
            </span>

            <span className="text-[12px] text-[#9C96A0]">
              Payment method
            </span>
          </span>

          <ChevronRight
            size={18}
            className="text-[#AAA4AE]"
          />
        </motion.button>

        {/* PROMO */}

        <motion.button
          type="button"
          whileTap={{
            scale: 0.98,
          }}
          onClick={() =>
            setPromoSheetOpen(
              true,
            )
          }
          className="mt-2 flex w-full items-center gap-3 py-2 text-left"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2ECF8] text-[#7442AD]">
            <BadgePercent
              size={19}
            />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-[#302B34]">
              {ride.promoCode
                ? ride.promoCode
                : "Promo code"}
            </span>

            <span className="text-[12px] text-[#9C96A0]">
              {ride.promoCode
                ? "Promotion applied"
                : "Add a promotion"}
            </span>
          </span>

          <ChevronRight
            size={18}
            className="text-[#AAA4AE]"
          />
        </motion.button>

        {/* SAFETY */}

        <div className="mt-5 flex items-center gap-2 rounded-[12px] bg-[#F2F9F4] px-3 py-2.5 text-[#398458]">
          <ShieldCheck
            size={17}
          />

          <p className="text-[12px]">
            Every ride includes
            Sur-Drive safety
            features.
          </p>
        </div>

        <motion.button
          type="button"
          disabled={
            !selectedOption
          }
          whileTap={
            selectedOption
              ? {
                  scale: 0.98,
                }
              : undefined
          }
          onClick={
            handleContinue
          }
          className="mt-5 flex h-[56px] w-full items-center justify-center rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white shadow-[0_10px_28px_rgba(116,66,173,0.22)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {selectedOption
            ? `Choose ${selectedOption.name}`
            : "Choose a ride"}
        </motion.button>
      </RideBottomSheet>

      <PaymentMethodSheet
        open={
          paymentSheetOpen
        }
        onClose={() =>
          setPaymentSheetOpen(
            false,
          )
        }
        selected={
          ride.paymentMethod
        }
        methods={
          paymentMethods
        }
        onSelect={
          setPaymentMethod
        }
      />

      <PromoCodeSheet
        open={
          promoSheetOpen
        }
        onClose={() =>
          setPromoSheetOpen(
            false,
          )
        }
        currentCode={
          ride.promoCode ?? ""
        }
        onApply={
          setPromoCode
        }
      />
    </div>
  );
}

// import {
//   BadgePercent,
//   Banknote,
//   ChevronRight,
//   ShieldCheck,
//   Users,
// } from "lucide-react";

// import { motion } from "framer-motion";

// import { useNavigate } from "react-router-dom";

// import PassengerMap from "../../../components/passenger/ride/PassengerMap";

// import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";

// import { rideOptions } from "../../../data/passengerRide";

// import { usePassengerRide } from "../../../context/PassengerRideContext";

// export default function SelectRide() {
//   const navigate = useNavigate();

//   const {
//     ride,
//     selectRide,
//     setEstimatedFare,
//     setRideStatus,
//   } = usePassengerRide();

//   const pickup =
//     ride.pickup?.coordinates;

//   const destination =
//     ride.destination?.coordinates;

//   const center =
//     pickup ??
//     destination ?? {
//       lat: 6.5244,
//       lng: 3.3792,
//     };

//   const selectedOption =
//     rideOptions.find(
//       (option) =>
//         option.id ===
//         ride.selectedRide,
//     );

//   const handleContinue = () => {
//     if (!selectedOption) {
//       return;
//     }

//     setEstimatedFare(
//       selectedOption.price,
//     );

//     setRideStatus("confirming");

//     navigate(
//       "/passenger/ride/confirm",
//     );
//   };

//   return (
//     <div
//       className="
//         relative h-[100dvh]
//         overflow-hidden
//         bg-[#F4F4F4]
//       "
//     >
//       <PassengerMap
//         center={center}
//         pickup={ride.pickup}
//         destination={
//           ride.destination
//         }
//         zoom={14}
//       />

//       <motion.button
//         type="button"
//         whileTap={{ scale: 0.9 }}
//         onClick={() => navigate(-1)}
//         className="
//           absolute left-4 top-5
//           z-[700]
//           flex h-11 w-11
//           items-center
//           justify-center
//           rounded-full
//           bg-white
//           text-[24px]
//           shadow-[0_6px_22px_rgba(0,0,0,0.12)]
//         "
//       >
//         ‹
//       </motion.button>

//       <RideBottomSheet>
//         <div>
//           <h1
//             className="
//               text-[22px]
//               font-semibold
//               tracking-[-0.02em]
//               text-[#302B34]
//             "
//           >
//             Choose a ride
//           </h1>

//           <p
//             className="
//               mt-1 text-[14px]
//               text-[#99939D]
//             "
//           >
//             Recommended rides near you
//           </p>
//         </div>

//         <div className="mt-5 space-y-2">
//           {rideOptions.map(
//             (option, index) => {
//               const selected =
//                 ride.selectedRide ===
//                 option.id;

//               return (
//                 <motion.button
//                   key={option.id}
//                   type="button"
//                   initial={{
//                     opacity: 0,
//                     x: 25,
//                   }}
//                   animate={{
//                     opacity: 1,
//                     x: 0,
//                   }}
//                   transition={{
//                     delay:
//                       index * 0.07,
//                   }}
//                   whileTap={{
//                     scale: 0.985,
//                   }}
//                   onClick={() =>
//                     selectRide(
//                       option.id,
//                     )
//                   }
//                   className={`
//                     flex w-full
//                     items-center
//                     rounded-[16px]
//                     border-2
//                     px-3 py-3
//                     text-left
//                     transition-all

//                     ${
//                       selected
//                         ? `
//                           border-[#7442AD]
//                           bg-[#FBF8FD]
//                           shadow-[0_6px_22px_rgba(116,66,173,0.08)]
//                         `
//                         : `
//                           border-transparent
//                           bg-white
//                           hover:bg-[#FAF9FB]
//                         `
//                     }
//                   `}
//                 >
//                   <div
//                     className="
//                       flex h-[62px]
//                       w-[82px]
//                       shrink-0
//                       items-center
//                       justify-center
//                       rounded-[13px]
//                       bg-[#F4F1F6]
//                     "
//                   >
//                     <span
//                       className="
//                         text-[28px]
//                       "
//                     >
//                       🚙
//                     </span>
//                   </div>

//                   <div
//                     className="
//                       ml-3
//                       min-w-0 flex-1
//                     "
//                   >
//                     <div
//                       className="
//                         flex items-center
//                         gap-2
//                       "
//                     >
//                       <h3
//                         className="
//                           text-[16px]
//                           font-semibold
//                           text-[#302B34]
//                         "
//                       >
//                         {option.name}
//                       </h3>

//                       <span
//                         className="
//                           flex items-center
//                           gap-1
//                           text-[12px]
//                           text-[#7F7982]
//                         "
//                       >
//                         <Users
//                           size={13}
//                         />

//                         {option.seats}
//                       </span>
//                     </div>

//                     <p
//                       className="
//                         mt-1
//                         truncate
//                         text-[12px]
//                         text-[#9A949E]
//                       "
//                     >
//                       {
//                         option.description
//                       }
//                     </p>

//                     <p
//                       className="
//                         mt-1 text-[12px]
//                         font-medium
//                         text-[#7442AD]
//                       "
//                     >
//                       {option.eta} away
//                     </p>
//                   </div>

//                   <div className="ml-2 text-right">
//                     <p
//                       className="
//                         text-[16px]
//                         font-semibold
//                         text-[#302B34]
//                       "
//                     >
//                       ₦
//                       {option.price.toLocaleString()}
//                     </p>

//                     {option.originalPrice && (
//                       <p
//                         className="
//                           text-[11px]
//                           text-[#A7A1AA]
//                           line-through
//                         "
//                       >
//                         ₦
//                         {option.originalPrice.toLocaleString()}
//                       </p>
//                     )}
//                   </div>
//                 </motion.button>
//               );
//             },
//           )}
//         </div>

//         <div
//           className="
//             my-5 h-px
//             bg-[#EEEAF0]
//           "
//         />

//         <motion.button
//           type="button"
//           whileTap={{ scale: 0.98 }}
//           className="
//             flex w-full
//             items-center gap-3
//             py-2 text-left
//           "
//         >
//           <span
//             className="
//               flex h-10 w-10
//               items-center
//               justify-center
//               rounded-full
//               bg-[#F2ECF8]
//               text-[#7442AD]
//             "
//           >
//             <Banknote size={19} />
//           </span>

//           <span className="flex-1">
//             <span
//               className="
//                 block text-[15px]
//                 font-semibold
//               "
//             >
//               {
//                 ride.paymentMethod
//                   .label
//               }
//             </span>

//             <span
//               className="
//                 text-[12px]
//                 text-[#9C96A0]
//               "
//             >
//               Payment method
//             </span>
//           </span>

//           <ChevronRight
//             size={18}
//             className="
//               text-[#AAA4AE]
//             "
//           />
//         </motion.button>

//         <motion.button
//           type="button"
//           whileTap={{ scale: 0.98 }}
//           className="
//             mt-2 flex w-full
//             items-center gap-3
//             py-2 text-left
//           "
//         >
//           <span
//             className="
//               flex h-10 w-10
//               items-center
//               justify-center
//               rounded-full
//               bg-[#F2ECF8]
//               text-[#7442AD]
//             "
//           >
//             <BadgePercent
//               size={19}
//             />
//           </span>

//           <span className="flex-1">
//             <span
//               className="
//                 block text-[15px]
//                 font-semibold
//               "
//             >
//               Promo code
//             </span>

//             <span
//               className="
//                 text-[12px]
//                 text-[#9C96A0]
//               "
//             >
//               Add a promotion
//             </span>
//           </span>

//           <ChevronRight
//             size={18}
//             className="
//               text-[#AAA4AE]
//             "
//           />
//         </motion.button>

//         <div
//           className="
//             mt-5 flex
//             items-center gap-2
//             rounded-[12px]
//             bg-[#F2F9F4]
//             px-3 py-2.5
//             text-[#398458]
//           "
//         >
//           <ShieldCheck
//             size={17}
//           />

//           <p className="text-[12px]">
//             Every ride includes
//             Sur-Drive safety features.
//           </p>
//         </div>

//         <motion.button
//           type="button"
//           disabled={!selectedOption}
//           whileTap={
//             selectedOption
//               ? { scale: 0.98 }
//               : undefined
//           }
//           onClick={handleContinue}
//           className="
//             mt-5 flex h-[56px]
//             w-full items-center
//             justify-center
//             rounded-[14px]
//             bg-[#7442AD]
//             text-[16px]
//             font-semibold
//             text-white
//             shadow-[0_10px_28px_rgba(116,66,173,0.22)]
//             transition-opacity
//             disabled:cursor-not-allowed
//             disabled:opacity-40
//           "
//         >
//           {selectedOption
//             ? `Choose ${selectedOption.name}`
//             : "Choose a ride"}
//         </motion.button>
//       </RideBottomSheet>
//     </div>
//   );
// }