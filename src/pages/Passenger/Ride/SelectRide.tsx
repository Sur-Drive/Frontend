import {
  BadgePercent,
  Banknote,
  ChevronRight,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

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

/**
 * IMPORTANT:
 *
 * The backend currently documents:
 *
 * rideType:
 * - economy
 * - comfort
 * - suv
 *
 * paymentMethod:
 * - cash
 * - card
 * - wallet
 *
 * There is currently no documented
 * fare-estimate endpoint in the supplied
 * backend API collection.
 *
 * Therefore this screen selects the ride
 * category/payment method but does NOT
 * create the ride yet.
 */

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

  // Enable when the wallet flow is ready.
  //
  // {
  //   id: "surdrive-wallet",
  //   type: "wallet",
  //   label: "Sur-Drive Wallet",
  //   detail: "Wallet",
  // },
];

export default function SelectRide() {
  const navigate =
    useNavigate();

  const {
    ride,
    selectRide,
    setRideStatus,
    setPaymentMethod,
    setPromoCode,
  } =
    usePassengerRide();

  const [
    paymentSheetOpen,
    setPaymentSheetOpen,
  ] = useState(false);

  const [
    promoSheetOpen,
    setPromoSheetOpen,
  ] = useState(false);

  /**
   * The rider should never reach
   * this page without both locations.
   */
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

  /**
   * BookRide should already have
   * resolved coordinates before
   * navigating here.
   *
   * We intentionally don't use a
   * hard-coded Lagos fallback.
   */
  const mapCenter =
    pickup ??
    destination;

  /**
   * Find the currently selected
   * category from our UI definitions.
   */
  const selectedOption =
    useMemo(
      () =>
        rideOptions.find(
          (option) =>
            option.id ===
            ride.selectedRide,
        ),
      [
        ride.selectedRide,
      ],
    );

  /**
   * If an old ride category remains
   * in state but no longer exists in
   * our supported UI options, clear
   * nothing automatically here.
   *
   * The user simply needs to choose
   * one of the available categories.
   */

  /**
   * Ensure selected payment is still
   * supported by this screen.
   *
   * This prevents stale wallet/card
   * state from silently being sent
   * later if that option is no longer
   * available in the UI.
   */
  const selectedPaymentSupported =
    useMemo(
      () =>
        paymentMethods.some(
          (method) =>
            method.type ===
              ride.paymentMethod
                ?.type,
        ),
      [
        ride.paymentMethod,
      ],
    );

  useEffect(() => {
    if (
      selectedPaymentSupported
    ) {
      return;
    }

    const fallback =
      paymentMethods.find(
        (method) =>
          method.type ===
          "cash",
      );

    if (fallback) {
      setPaymentMethod(
        fallback,
      );
    }
  }, [
    selectedPaymentSupported,
    setPaymentMethod,
  ]);

  /**
   * Continue to confirmation.
   *
   * DO NOT POST /rides/book here.
   *
   * Confirmation should be the final
   * point where the rider reviews:
   *
   * pickup
   * destination
   * stops
   * category
   * payment method
   *
   * before creating the actual ride.
   */
  const handleContinue =
    () => {
      if (!selectedOption) {
        return;
      }

      setRideStatus(
        "confirming",
      );

      navigate(
        "/passenger/ride/confirm",
      );
    };

  const pickupLabel =
    ride.pickup.label ||
    ride.pickup.address ||
    "Pickup";

  const destinationLabel =
    ride.destination.label ||
    ride.destination.address ||
    "Destination";

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
      {/* MAP */}

      {mapCenter ? (
        <PassengerMap
          center={mapCenter}
          pickup={
            ride.pickup
          }
          destination={
            ride.destination
          }
          zoom={14}
        />
      ) : (
        <div className="absolute inset-0 bg-[#F1EFF2]" />
      )}

      {/* HEADER */}

      <RideMapHeader
        title="Choose a ride"
      />

      {/* BOTTOM SHEET */}

      <RideBottomSheet>
        {/* ROUTE SUMMARY */}

        <motion.div
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="
            mb-5
            rounded-[16px]
            border
            border-[#EEEAF0]
            bg-[#FAF9FB]
            px-4
            py-3
          "
        >
          {/* PICKUP */}

          <div className="flex items-start gap-3">
            <div className="mt-[5px] flex w-4 shrink-0 justify-center">
              <span className="h-[9px] w-[9px] rounded-full border-[2px] border-[#7442AD] bg-white" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[#99939D]">
                Pickup
              </p>

              <p className="mt-0.5 truncate text-[14px] font-semibold text-[#302B34]">
                {
                  pickupLabel
                }
              </p>
            </div>
          </div>

          {/* CONNECTOR */}

          <div className="ml-[7px] my-1 h-4 w-px bg-[#D9D3DD]" />

          {/* DESTINATION */}

          <div className="flex items-start gap-3">
            <div className="mt-[4px] flex w-4 shrink-0 justify-center">
              <MapPin
                size={14}
                className="text-[#7442AD]"
                fill="#7442AD"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[#99939D]">
                Destination
              </p>

              <p className="mt-0.5 truncate text-[14px] font-semibold text-[#302B34]">
                {
                  destinationLabel
                }
              </p>
            </div>
          </div>

          {/* STOPS */}

          {ride.stops.length >
            0 && (
            <div className="mt-3 border-t border-[#EEEAF0] pt-3">
              <p className="text-[12px] font-medium text-[#99939D]">
                {ride.stops
                  .length === 1
                  ? "1 stop"
                  : `${ride.stops.length} stops`}
              </p>

              <div className="mt-1 space-y-1">
                {ride.stops.map(
                  (
                    stop,
                    index,
                  ) => (
                    <p
                      key={
                        stop.id
                      }
                      className="truncate text-[13px] text-[#625C66]"
                    >
                      {index +
                        1}
                      .{" "}
                      {stop.label ||
                        stop.address ||
                        "Stop"}
                    </p>
                  ),
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* TITLE */}

        <motion.div
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.05,
          }}
        >
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#302B34]">
            Choose a ride
          </h1>

          <p className="mt-1 text-[14px] leading-5 text-[#99939D]">
            Select the ride
            that works best
            for you.
          </p>
        </motion.div>

        {/* RIDE OPTIONS */}

        <div className="mt-5 space-y-2">
          {rideOptions.map(
            (
              option,
              index,
            ) => (
              <motion.div
                key={
                  option.id
                }
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay:
                    0.08 +
                    index *
                      0.04,
                }}
              >
                <RideOptionCard
                  option={
                    option
                  }
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
              </motion.div>
            ),
          )}
        </div>

        {/* BACKEND FARE NOTE */}

        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            delay: 0.2,
          }}
          className="
            mt-3
            rounded-[12px]
            bg-[#FAF8FC]
            px-3
            py-2.5
          "
        >
          <p className="text-[12px] leading-5 text-[#8F8794]">
            Final ride pricing
            will be provided by
            Sur-Drive when your
            booking is processed.
          </p>
        </motion.div>

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
          className="
            flex
            w-full
            items-center
            gap-3
            rounded-[12px]
            py-2
            text-left
          "
        >
          <span
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#F2ECF8]
              text-[#7442AD]
            "
          >
            <Banknote
              size={19}
            />
          </span>

          <span className="flex-1 min-w-0">
            <span className="block truncate text-[15px] font-semibold text-[#302B34]">
              {ride
                .paymentMethod
                ?.label ??
                "Choose payment method"}
            </span>

            <span className="mt-0.5 block text-[12px] text-[#9C96A0]">
              Payment method
            </span>
          </span>

          <ChevronRight
            size={18}
            className="shrink-0 text-[#AAA4AE]"
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
          className="
            mt-2
            flex
            w-full
            items-center
            gap-3
            rounded-[12px]
            py-2
            text-left
          "
        >
          <span
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#F2ECF8]
              text-[#7442AD]
            "
          >
            <BadgePercent
              size={19}
            />
          </span>

          <span className="flex-1 min-w-0">
            <span className="block truncate text-[15px] font-semibold text-[#302B34]">
              {ride.promoCode
                ? ride.promoCode
                : "Promo code"}
            </span>

            <span className="mt-0.5 block text-[12px] text-[#9C96A0]">
              {ride.promoCode
                ? "Promotion added"
                : "Add a promotion"}
            </span>
          </span>

          <ChevronRight
            size={18}
            className="shrink-0 text-[#AAA4AE]"
          />
        </motion.button>

        {/* SAFETY */}

        <div
          className="
            mt-5
            flex
            items-start
            gap-2.5
            rounded-[12px]
            bg-[#F2F9F4]
            px-3
            py-3
            text-[#398458]
          "
        >
          <ShieldCheck
            size={18}
            className="mt-[1px] shrink-0"
          />

          <p className="text-[13px] leading-5">
            Every ride
            includes Sur-Drive
            safety features.
          </p>
        </div>

        {/* CONTINUE */}

        <motion.button
          type="button"
          disabled={
            !selectedOption ||
            !ride.paymentMethod
          }
          whileTap={
            selectedOption &&
            ride.paymentMethod
              ? {
                  scale: 0.98,
                }
              : undefined
          }
          onClick={
            handleContinue
          }
          className="
            mt-5
            flex
            h-[56px]
            w-full
            items-center
            justify-center
            rounded-[14px]
            bg-[#7442AD]
            text-[16px]
            font-semibold
            text-white
            shadow-[0_10px_28px_rgba(116,66,173,0.22)]
            transition
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          {selectedOption
            ? `Choose ${selectedOption.name}`
            : "Choose a ride"}
        </motion.button>
      </RideBottomSheet>

      {/* PAYMENT SHEET */}

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
        onSelect={(
          method,
        ) => {
          setPaymentMethod(
            method,
          );

          setPaymentSheetOpen(
            false,
          );
        }}
      />

      {/* PROMO SHEET */}

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
          ride.promoCode ??
          ""
        }
        onApply={(
          code,
        ) => {
          setPromoCode(
            code,
          );

          setPromoSheetOpen(
            false,
          );
        }}
      />
    </div>
  );
}

// import {
//   BadgePercent,
//   Banknote,
//   ChevronRight,
//   ShieldCheck,
// } from "lucide-react";

// import { motion } from "framer-motion";
// import { useState } from "react";
// import {
//   Navigate,
//   useNavigate,
// } from "react-router-dom";

// import PassengerMap from "../../../components/passenger/ride/PassengerMap";
// import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
// import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";
// import RideOptionCard from "../../../components/passenger/ride/RideOptionCard";
// import PaymentMethodSheet from "../../../components/passenger/ride/PaymentMethodSheet";
// import PromoCodeSheet from "../../../components/passenger/ride/PromoCodeSheet";

// import {
//   rideOptions,
// } from "../../../data/passengerRide";

// import {
//   usePassengerRide,
// } from "../../../context/PassengerRideContext";

// import type {
//   PaymentMethod,
// } from "../../../types/passengerRide";

// const paymentMethods: PaymentMethod[] = [
//   {
//     id: "card-4412",
//     type: "card",
//     label: "MasterCard •••• 4412",
//   },
//   {
//     id: "cash",
//     type: "cash",
//     label: "Cash",
//   },
// //   {
// //   id: "surdrive-wallet",
// //   type: "wallet",
// //   label: "Sur-Drive Wallet",
// //   detail: "₦24,500 available",
// // }
// ];

// export default function SelectRide() {
//   const navigate = useNavigate();

//   const {
//     ride,
//     selectRide,
//     setEstimatedFare,
//     setRideStatus,

//     // Rename these two ONLY if your context
//     // currently uses different names.
//     setPaymentMethod,
//     setPromoCode,
//   } = usePassengerRide();

//   const [
//     paymentSheetOpen,
//     setPaymentSheetOpen,
//   ] = useState(false);

//   const [
//     promoSheetOpen,
//     setPromoSheetOpen,
//   ] = useState(false);

//   if (
//     !ride.pickup ||
//     !ride.destination
//   ) {
//     return (
//       <Navigate
//         to="/passenger/book-ride"
//         replace
//       />
//     );
//   }

//   const pickup =
//     ride.pickup.coordinates;

//   const destination =
//     ride.destination.coordinates;

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

//     // setEstimatedFare(
//     //   selectedOption.price,
//     // );

//     setRideStatus("confirming");

//     navigate(
//       "/passenger/ride/confirm",
//     );
//   };

//   return (
//     <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
//       <PassengerMap
//         center={center}
//         pickup={ride.pickup}
//         destination={
//           ride.destination
//         }
//         zoom={14}
//       />

//       <RideMapHeader
//         title="Choose a ride"
//       />

//       <RideBottomSheet>
//         <div>
//           <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#302B34]">
//             Choose a ride
//           </h1>

//           <p className="mt-1 text-[14px] text-[#99939D]">
//             Recommended rides near you
//           </p>
//         </div>

//         {/* RIDE OPTIONS */}

//         <div className="mt-5 space-y-2">
//           {rideOptions.map(
//             (option) => (
//               <RideOptionCard
//                 key={option.id}
//                 option={option}
//                 selected={
//                   ride.selectedRide ===
//                   option.id
//                 }
//                 onSelect={() =>
//                   selectRide(
//                     option.id,
//                   )
//                 }
//               />
//             ),
//           )}
//         </div>

//         <div className="my-5 h-px bg-[#EEEAF0]" />

//         {/* PAYMENT */}

//         <motion.button
//           type="button"
//           whileTap={{
//             scale: 0.98,
//           }}
//           onClick={() =>
//             setPaymentSheetOpen(
//               true,
//             )
//           }
//           className="flex items-center w-full gap-3 py-2 text-left"
//         >
//           <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2ECF8] text-[#7442AD]">
//             <Banknote size={19} />
//           </span>

//           <span className="flex-1 min-w-0">
//             <span className="block truncate text-[15px] font-semibold text-[#302B34]">
//               {
//                 ride.paymentMethod
//                   .label
//               }
//             </span>

//             <span className="text-[12px] text-[#9C96A0]">
//               Payment method
//             </span>
//           </span>

//           <ChevronRight
//             size={18}
//             className="text-[#AAA4AE]"
//           />
//         </motion.button>

//         {/* PROMO */}

//         <motion.button
//           type="button"
//           whileTap={{
//             scale: 0.98,
//           }}
//           onClick={() =>
//             setPromoSheetOpen(
//               true,
//             )
//           }
//           className="flex items-center w-full gap-3 py-2 mt-2 text-left"
//         >
//           <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2ECF8] text-[#7442AD]">
//             <BadgePercent
//               size={19}
//             />
//           </span>

//           <span className="flex-1 min-w-0">
//             <span className="block text-[15px] font-semibold text-[#302B34]">
//               {ride.promoCode
//                 ? ride.promoCode
//                 : "Promo code"}
//             </span>

//             <span className="text-[12px] text-[#9C96A0]">
//               {ride.promoCode
//                 ? "Promotion applied"
//                 : "Add a promotion"}
//             </span>
//           </span>

//           <ChevronRight
//             size={18}
//             className="text-[#AAA4AE]"
//           />
//         </motion.button>

//         {/* SAFETY */}

//         <div className="mt-5 flex items-center gap-2 rounded-[12px] bg-[#F2F9F4] px-3 py-2.5 text-[#398458]">
//           <ShieldCheck
//             size={17}
//           />

//           <p className="text-[12px]">
//             Every ride includes
//             Sur-Drive safety
//             features.
//           </p>
//         </div>

//         <motion.button
//           type="button"
//           disabled={
//             !selectedOption
//           }
//           whileTap={
//             selectedOption
//               ? {
//                   scale: 0.98,
//                 }
//               : undefined
//           }
//           onClick={
//             handleContinue
//           }
//           className="mt-5 flex h-[56px] w-full items-center justify-center rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white shadow-[0_10px_28px_rgba(116,66,173,0.22)] disabled:cursor-not-allowed disabled:opacity-40"
//         >
//           {selectedOption
//             ? `Choose ${selectedOption.name}`
//             : "Choose a ride"}
//         </motion.button>
//       </RideBottomSheet>

//       <PaymentMethodSheet
//         open={
//           paymentSheetOpen
//         }
//         onClose={() =>
//           setPaymentSheetOpen(
//             false,
//           )
//         }
//         selected={
//           ride.paymentMethod
//         }
//         methods={
//           paymentMethods
//         }
//         onSelect={
//           setPaymentMethod
//         }
//       />

//       <PromoCodeSheet
//         open={
//           promoSheetOpen
//         }
//         onClose={() =>
//           setPromoSheetOpen(
//             false,
//           )
//         }
//         currentCode={
//           ride.promoCode ?? ""
//         }
//         onApply={
//           setPromoCode
//         }
//       />
//     </div>
//   );
// }

