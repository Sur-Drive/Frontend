import {
  Banknote,
  Clock3,
  LoaderCircle,
  MapPin,
  Navigation,
  Route,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useState,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "sonner";

import PassengerMap from "../../../components/passenger/ride/PassengerMap";
import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";

import {
  usePassengerRide,
} from "../../../context/PassengerRideContext";

import {
  rideOptions,
} from "../../../data/passengerRide";

import {
  passengerRideApi,
} from "../../../api/passenger/rides";

/* =========================================================
   TYPES
========================================================= */

type BackendRidePoint =
  | {
      lat: number;
      lng: number;
    }
  | {
      address: string;
    }
  | {
      savedPlaceId: string;
    };

type RidePointLike = {
  coordinates?: {
    lat: number;
    lng: number;
  } | null;

  address?: string | null;

  savedPlaceId?: string | null;
};

type BackendRideLocation = {
  lat: number;
  lng: number;
  address: string;
};

type FareBreakdown = {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  bookingFee: number;
  surgeMultiplier: number;
  surgeCharge: number;
  waitingFee: number;
  waitingMinutes: number;
  waitingGraceMin: number;
  cancellationFee: number;
  approvedFees: number;
  discount: number;
  promoDiscount: number;
  subtotal: number;
  total: number;
  isEstimate: boolean;
};

export type BookedRideResponse = {
  id: string;

  riderId: string;

  driverId: string | null;

  status:
    | "requested"
    | "searching"
    | "driver_assigned"
    | "driver_en_route"
    | "driver_arrived"
    | "ride_started"
    | "ride_in_progress"
    | "ride_completed"
    | "payment_pending"
    | "paid"
    | "closed"
    | "cancelled";

  rideType:
    | "economy"
    | "comfort"
    | "suv";

  paymentMethod:
    | "cash"
    | "card"
    | "wallet";

  pickup: BackendRideLocation;

  dropoff: BackendRideLocation;

  stops: BackendRideLocation[];

  vehicle: unknown | null;

  estimatedDistanceKm: number;

  estimatedDurationMin: number;

  actualDistanceKm: number | null;

  actualDurationMin: number | null;

  estimatedFare: number;

  finalFare: number | null;

  cancellationFee: number;

  cancellationReason: string | null;

  cancelledBy: string | null;

  promoCode: string | null;

  promoDiscount: number;

  pricingVersion: string;

  fareBreakdown: FareBreakdown;

  timestamps: {
    requestedAt: string | null;
    searchingAt: string | null;
    driverAssignedAt: string | null;
    driverArrivedAt: string | null;
    rideStartedAt: string | null;
    rideCompletedAt: string | null;
    paidAt: string | null;
    cancelledAt: string | null;
  };

  createdAt: string;

  updatedAt: string;
};

/* =========================================================
   HELPERS
========================================================= */

function toBackendRidePoint(
  location: RidePointLike,
): BackendRidePoint {
  if (
    location.savedPlaceId
  ) {
    return {
      savedPlaceId:
        location.savedPlaceId,
    };
  }

  if (
    location.coordinates &&
    Number.isFinite(
      location.coordinates.lat,
    ) &&
    Number.isFinite(
      location.coordinates.lng,
    )
  ) {
    return {
      lat:
        location.coordinates.lat,

      lng:
        location.coordinates.lng,
    };
  }

  if (
    location.address?.trim()
  ) {
    return {
      address:
        location.address.trim(),
    };
  }

  throw new Error(
    "Location does not contain coordinates, an address, or a saved place ID.",
  );
}

function formatMoney(
  amount: number,
) {
  return amount.toLocaleString(
    "en-NG",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function ConfirmPickup() {
  const navigate =
    useNavigate();

  const {
    ride,
    setRideStatus,
    setEstimatedFare,
  } =
    usePassengerRide();

  const [
    isBooking,
    setIsBooking,
  ] = useState(false);

  /* =======================================================
     GUARD
  ======================================================= */

  if (
    !ride.pickup ||
    !ride.destination ||
    !ride.selectedRide
  ) {
    return (
      <Navigate
        to="/passenger/book-ride"
        replace
      />
    );
  }

  const pickup =
    ride.pickup;

  const destination =
    ride.destination;

  const selectedRide =
    ride.selectedRide;

  const option =
    rideOptions.find(
      (item) =>
        item.id ===
        selectedRide,
    );

  const center =
    pickup.coordinates ??
    destination.coordinates;

  if (!center) {
    return (
      <Navigate
        to="/passenger/book-ride"
        replace
      />
    );
  }

  /* =======================================================
     BOOK
  ======================================================= */

  const confirm =
    async () => {
      if (isBooking) {
        return;
      }

      try {
        setIsBooking(true);

        const pickupPoint =
          toBackendRidePoint(
            pickup,
          );

        const dropoffPoint =
          toBackendRidePoint(
            destination,
          );

        const stops =
          ride.stops.length > 0
            ? ride.stops.map(
                (stop) =>
                  toBackendRidePoint(
                    stop,
                  ),
              )
            : undefined;

        const payload = {
          pickup:
            pickupPoint,

          dropoff:
            dropoffPoint,

          ...(stops
            ? {
                stops,
              }
            : {}),

          rideType:
            selectedRide,

          paymentMethod:
            ride.paymentMethod
              .type,
        };

        console.log(
          "BOOK RIDE PAYLOAD:",
          payload,
        );

        const rawResponse =
          await passengerRideApi.bookRide(
            payload,
          );

        const response =
          rawResponse as BookedRideResponse;

        console.log(
          "BOOK RIDE RESPONSE:",
          response,
        );

        if (!response?.id) {
          throw new Error(
            "Ride booking response did not contain a ride ID.",
          );
        }

        /**
         * Keep active backend ride
         * available across route changes
         * and page refreshes.
         */
        sessionStorage.setItem(
          "surdrive_active_ride_id",
          response.id,
        );

        sessionStorage.setItem(
          "surdrive_active_ride",
          JSON.stringify(
            response,
          ),
        );

        /**
         * Backend now gives us the
         * authoritative estimated fare.
         */
        if (
          typeof response.estimatedFare ===
            "number" &&
          Number.isFinite(
            response.estimatedFare,
          )
        ) {
          setEstimatedFare(
            response.estimatedFare,
          );
        }

        setRideStatus(
          "searching",
        );

        navigate(
          "/passenger/ride/searching",
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          "BOOK RIDE ERROR:",
          error,
        );

        toast.error(
          "Unable to book your ride. Please try again.",
        );
      } finally {
        setIsBooking(false);
      }
    };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
      <PassengerMap
        center={center}
        pickup={pickup}
        destination={
          destination
        }
        zoom={16}
      />

      <RideMapHeader
        title="Confirm ride"
      />

      <RideBottomSheet>
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#302B34]">
            Confirm your ride
          </h1>

          <p className="mt-1 text-[14px] leading-5 text-[#99939D]">
            Review your trip
            details before we
            start searching for
            a driver.
          </p>
        </div>

        {/* ROUTE */}

        <div className="mt-5 rounded-[16px] bg-[#F7F5F8] p-4">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDE4F6] text-[#7442AD]">
              <Navigation
                size={18}
              />
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-[#9A949E]">
                Pickup
              </p>

              <p className="mt-1 truncate text-[16px] font-semibold text-[#302B34]">
                {pickup.label ||
                  pickup.address ||
                  "Pickup"}
              </p>

              {pickup.address &&
                pickup.address !==
                  pickup.label && (
                  <p className="mt-1 truncate text-[13px] text-[#908A94]">
                    {
                      pickup.address
                    }
                  </p>
                )}
            </div>
          </div>

          {/* STOPS */}

          {ride.stops.map(
            (
              stop,
              index,
            ) => (
              <div
                key={
                  stop.id
                }
              >
                <div className="my-3 ml-5 h-4 border-l-2 border-dotted border-[#C9C2CF]" />

                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0ECF3] text-[#7442AD]">
                    <MapPin
                      size={17}
                    />
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-[#9A949E]">
                      Stop{" "}
                      {index +
                        1}
                    </p>

                    <p className="mt-1 truncate text-[15px] font-semibold text-[#302B34]">
                      {stop.label ||
                        stop.address ||
                        "Stop"}
                    </p>
                  </div>
                </div>
              </div>
            ),
          )}

          <div className="my-3 ml-5 h-4 border-l-2 border-dotted border-[#C9C2CF]" />

          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFEDEF] text-[#302B34]">
              <MapPin
                size={18}
              />
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-[#9A949E]">
                Destination
              </p>

              <p className="mt-1 truncate text-[16px] font-semibold text-[#302B34]">
                {destination.label ||
                  destination.address ||
                  "Destination"}
              </p>
            </div>
          </div>
        </div>

        {/* RIDE */}

        <div className="mt-4 rounded-[15px] border border-[#EEEAF1] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] text-[#99939D]">
                Ride type
              </p>

              <p className="mt-1 text-[17px] font-semibold text-[#302B34]">
                {option?.name ??
                  selectedRide}
              </p>
            </div>

            {typeof ride.estimatedFare ===
              "number" && (
              <div className="text-right">
                <p className="text-[12px] text-[#99939D]">
                  Estimated fare
                </p>

                <p className="mt-1 text-[18px] font-semibold text-[#302B34]">
                  ₦
                  {formatMoney(
                    ride.estimatedFare,
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="my-4 h-px bg-[#EEEAF0]" />

          <div className="flex items-center gap-2">
            <Banknote
              size={18}
              className="text-[#7442AD]"
            />

            <div>
              <p className="text-[12px] text-[#99939D]">
                Payment
              </p>

              <p className="mt-0.5 text-[14px] font-medium text-[#625C66]">
                {
                  ride
                    .paymentMethod
                    .label
                }
              </p>
            </div>
          </div>
        </div>

        {/* INFO */}

        <div className="mt-4 flex items-center gap-5 rounded-[14px] bg-[#FAF8FC] px-4 py-3">
          <div className="flex items-center gap-2 text-[#756F79]">
            <Route
              size={16}
            />

            <span className="text-[13px]">
              Fare calculated
              after confirmation
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1 text-[#756F79]">
            <Clock3
              size={15}
            />

            <span className="text-[13px]">
              Live estimate
            </span>
          </div>
        </div>

        <motion.button
          type="button"
          disabled={
            isBooking
          }
          whileTap={
            isBooking
              ? undefined
              : {
                  scale: 0.98,
                }
          }
          onClick={confirm}
          className="mt-5 flex h-[56px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white shadow-[0_10px_30px_rgba(116,66,173,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBooking ? (
            <>
              <LoaderCircle
                size={19}
                className="animate-spin"
              />

              Creating ride...
            </>
          ) : (
            "Confirm ride"
          )}
        </motion.button>
      </RideBottomSheet>
    </div>
  );
}

// import {
//   Banknote,
//   MapPin,
//   Navigation,
// } from "lucide-react";
// import { motion } from "framer-motion";
// import { Navigate, useNavigate } from "react-router-dom";

// import PassengerMap from "../../../components/passenger/ride/PassengerMap";
// import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
// import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";

// import { usePassengerRide } from "../../../context/PassengerRideContext";
// import { rideOptions } from "../../../data/passengerRide";

// export default function ConfirmPickup() {
//   const navigate = useNavigate();

//   const {
//     ride,
//     setRideStatus,
//   } = usePassengerRide();

//   if (!ride.pickup || !ride.destination || !ride.selectedRide) {
//     return <Navigate to="/passenger/book-ride" replace />;
//   }

//   const option = rideOptions.find(
//     (item) => item.id === ride.selectedRide,
//   );

//   const center =
//     ride.pickup.coordinates ??
//     ride.destination.coordinates ?? {
//       lat: 6.5244,
//       lng: 3.3792,
//     };

//   const confirm = () => {
//     setRideStatus("searching");
//     navigate("/passenger/ride/searching");
//   };

//   return (
//     <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
//       <PassengerMap
//         center={center}
//         pickup={ride.pickup}
//         destination={ride.destination}
//         zoom={16}
//       />

//       <RideMapHeader title="Confirm pickup" />

//       <RideBottomSheet>
//         <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#302B34]">
//           Confirm your pickup
//         </h1>

//         <p className="mt-1 text-[14px] text-[#99939D]">
//           Make sure the pickup point is correct.
//         </p>

//         <div className="mt-5 rounded-[16px] bg-[#F7F5F8] p-4">
//           <div className="flex gap-3">
//             <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDE4F6] text-[#7442AD]">
//               <Navigation size={18} />
//             </span>

//             <div className="min-w-0">
//               <p className="text-[12px] font-medium text-[#9A949E]">
//                 PICKUP
//               </p>

//               <p className="mt-1 truncate text-[16px] font-semibold text-[#302B34]">
//                 {ride.pickup.label}
//               </p>

//               {ride.pickup.address && (
//                 <p className="mt-1 truncate text-[13px] text-[#908A94]">
//                   {ride.pickup.address}
//                 </p>
//               )}
//             </div>
//           </div>

//           <div className="my-4 ml-5 h-5 border-l-2 border-dotted border-[#C9C2CF]" />

//           <div className="flex gap-3">
//             <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFEDEF] text-[#302B34]">
//               <MapPin size={18} />
//             </span>

//             <div className="min-w-0">
//               <p className="text-[12px] font-medium text-[#9A949E]">
//                 DESTINATION
//               </p>

//               <p className="mt-1 truncate text-[16px] font-semibold text-[#302B34]">
//                 {ride.destination.label}
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="mt-4 flex items-center justify-between rounded-[15px] border border-[#EEEAF1] p-4">
//           <div>
//             <p className="text-[13px] text-[#99939D]">
//               {option?.name}
//             </p>

//             <p className="mt-1 text-[18px] font-semibold text-[#302B34]">
//               ₦{(ride.estimatedFare ?? option?.price ?? 0).toLocaleString()}
//             </p>
//           </div>

//           <div className="flex items-center gap-2 text-[14px] text-[#625C66]">
//             <Banknote size={18} />
//             {ride.paymentMethod.label}
//           </div>
//         </div>

//         <motion.button
//           type="button"
//           whileTap={{ scale: 0.98 }}
//           onClick={confirm}
//           className="mt-5 flex h-[56px] w-full items-center justify-center rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white shadow-[0_10px_30px_rgba(116,66,173,0.24)]"
//         >
//           Confirm Order
//         </motion.button>
//       </RideBottomSheet>
//     </div>
//   );
// }