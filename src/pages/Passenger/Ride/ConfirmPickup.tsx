import {
  Banknote,
  Building2,
  ChevronRight,
  Clock3,
  CreditCard,
  LoaderCircle,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  ShieldCheck,
} from "lucide-react";

import { motion } from "framer-motion";

import {
  useMemo,
  useRef,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { toast } from "sonner";

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
  locationToBackendPoint,
  stopToBackendPoint,
  passengerRideApi,
  type BookRideRequest,
  type EstimateRideRequest,
  type EstimateRideResponse,
  type PassengerRideResponse,
} from "../../../api/passenger/rides";

import {
  useBookPassengerRide,
} from "../../../hooks/passenger/usePassengerRideBooking";

import {
  storeActiveRide,
} from "../../../utils/passengerActiveRide";

/* =========================================================
   CONSTANTS
========================================================= */

const RIDE_TYPES = [
  "economy",
  "comfort",
  "suv",
] as const;

type RideType = (typeof RIDE_TYPES)[number];

const ESTIMATE_STALE_TIME = 30_000;

/*
 * Only card checkout is currently confirmed by
 * the documented booking API.
 *
 * Bank transfer should be enabled once the backend
 * confirms how to request the Paystack transfer channel.
 */
// const SUPPORTED_PAYMENT_ID = "paystack-card";

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function validNumber(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function getEstimatedFare(
  response: EstimateRideResponse | undefined,
): number | null {
  if (!response) {
    return null;
  }

  if (validNumber(response.estimatedFare)) {
    return response.estimatedFare;
  }

  if (validNumber(response.fare?.total)) {
    return response.fare.total;
  }

  return null;
}

function isRideType(
  value: unknown,
): value is RideType {
  return RIDE_TYPES.some(
    (type) => type === value,
  );
}

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    error &&
    typeof error === "object"
  ) {
    const candidate = error as {
      message?: unknown;
      response?: {
        data?: {
          message?: unknown;
        };
      };
      data?: {
        message?: unknown;
      };
    };

    const message =
      candidate.response?.data?.message ??
      candidate.data?.message ??
      candidate.message;

    if (
      typeof message === "string" &&
      message.trim()
    ) {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(", ");
    }
  }

  return fallback;
}

function getRideRoute(
  status: PassengerRideResponse["status"],
): string {
  switch (status) {
    case "requested":
    case "searching":
    case "no_drivers_found":
      return "/passenger/ride/searching";

    case "driver_assigned":
      return "/passenger/ride/driver-assigned";

    case "driver_en_route":
      return "/passenger/ride/driver-en-route";

    case "driver_arrived":
      return "/passenger/ride/driver-arrived";

    case "ride_started":
    case "ride_in_progress":
      return "/passenger/ride/in-trip";

    case "ride_completed":
    case "payment_pending":
      return "/passenger/ride/complete";

    case "paid":
    case "closed":
      return "/passenger/ride/complete";

    case "cancelled":
      return "/passenger/home";

    default:
      return "/passenger/ride/searching";
  }
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ConfirmPickup() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const {
    ride,
    setRideStatus,
    setEstimatedFare,
  } = usePassengerRide();

  const booking = useBookPassengerRide();

  const bookingLock = useRef(false);

  /* =======================================================
     ROUTE DETAILS
  ======================================================= */

  const pickup = ride.pickup;

  const destination = ride.destination;

  const selectedRideType = isRideType(
    ride.selectedRide,
  )
    ? ride.selectedRide
    : null;

  const selectedOption = rideOptions.find(
    (option) =>
      option.id === selectedRideType,
  );

  const pickupCoordinates =
    pickup?.coordinates;

  const destinationCoordinates =
    destination?.coordinates;

  const center =
    pickupCoordinates ??
    destinationCoordinates;

  /* =======================================================
     PAYMENT VALIDATION
  ======================================================= */

  // const paymentMethod = ride.paymentMethod;

  // const isCardPayment =
  //   paymentMethod?.id === SUPPORTED_PAYMENT_ID &&
  //   paymentMethod.type === "card";

  // const isTransferPayment =
  //   paymentMethod?.id === "paystack-transfer";

  // const isSupportedPayment = isCardPayment;

  const paymentMethod = ride.paymentMethod;

const isCashPayment =
  paymentMethod?.id === "cash" &&
  paymentMethod.type === "cash";

const isCardPayment =
  paymentMethod?.id === "paystack-card" &&
  paymentMethod.type === "card";

const isSupportedPayment =
  isCashPayment || isCardPayment;

  /* =======================================================
     ESTIMATE QUERY KEY

     Must match the query key in SelectRide.
  ======================================================= */

  const routeKey = JSON.stringify({
    pickup: pickup
      ? {
          lat: pickup.coordinates?.lat,
          lng: pickup.coordinates?.lng,
          address: pickup.address,
        }
      : null,

    destination: destination
      ? {
          lat: destination.coordinates?.lat,
          lng: destination.coordinates?.lng,
          address: destination.address,
        }
      : null,

    stops: ride.stops.map((stop) => ({
      lat: stop.coordinates?.lat,
      lng: stop.coordinates?.lng,
      address: stop.address,
      savedPlaceId: stop.savedPlaceId,
    })),
  });

  /* =======================================================
     ESTIMATE PAYLOAD
  ======================================================= */

  const estimatePayload = useMemo<
    EstimateRideRequest | null
  >(() => {
    if (
      !pickup ||
      !destination ||
      !pickupCoordinates ||
      !destinationCoordinates ||
      !selectedRideType
    ) {
      return null;
    }

    try {
      return {
        pickup: locationToBackendPoint(pickup),

        dropoff: locationToBackendPoint(
          destination,
        ),

        ...(ride.stops.length > 0
          ? {
              stops: ride.stops.map(
                stopToBackendPoint,
              ),
            }
          : {}),

        rideType: selectedRideType,
      };
    } catch (error) {
      console.error(
        "INVALID RIDE DETAILS:",
        error,
      );

      return null;
    }

    // routeKey captures all route inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey, selectedRideType]);

  /* =======================================================
     FARE ESTIMATE

     Uses the same React Query cache as SelectRide.
  ======================================================= */

  const estimateQuery = useQuery({
    queryKey: [
      "passenger",
      "ride-estimate",
      routeKey,
      selectedRideType,
    ],

    queryFn: async () => {
      if (!estimatePayload) {
        throw new Error(
          "Ride details are incomplete.",
        );
      }

      return passengerRideApi.estimateRide(
        estimatePayload,
      );
    },

    enabled: Boolean(estimatePayload),

    staleTime: ESTIMATE_STALE_TIME,

    retry: 1,

    refetchOnWindowFocus: false,
  });

  const quote = estimateQuery.data;

  const quotedFare = getEstimatedFare(quote);

  const hasQuote =
    quotedFare !== null &&
    quotedFare >= 0;

  const isEstimating =
    estimateQuery.isPending &&
    estimateQuery.isFetching;

  const estimateFailed =
    estimateQuery.isError;

  const distanceKm =
    quote?.route?.distanceKm;

  const durationMin =
    quote?.route?.durationMin;

  /* =======================================================
     BOOKING VALIDATION
  ======================================================= */

  const canBook = Boolean(
    estimatePayload &&
      selectedRideType &&
      selectedOption &&
      hasQuote &&
      !estimateQuery.isFetching &&
      !booking.isPending &&
      isSupportedPayment,
  );

  /* =======================================================
     CONFIRM BOOKING
  ======================================================= */

  const confirm = async () => {
    if (bookingLock.current) {
      return;
    }

    if (!estimatePayload || !selectedRideType) {
      toast.error(
        "Please complete your ride details.",
      );

      return;
    }

    if (!isSupportedPayment) {
  toast.error(
    "Please select Cash or Card as your payment method.",
  );

  return;
}

    if (
      !hasQuote ||
      quotedFare === null ||
      estimateQuery.isFetching
    ) {
      toast.error(
        "Please wait for a valid fare estimate.",
      );

      return;
    }

    if (!canBook) {
      return;
    }

    bookingLock.current = true;

    try {
      /*
       * This is the actual backend booking request.
       *
       * Do not send:
       * - cash
       * - paystack-card
       * - paystack-transfer
       *
       * The documented API expects "card".
       */
      const selectedBackendPaymentMethod:
  "cash" | "card" = isCashPayment
    ? "cash"
    : "card";

const payload: BookRideRequest = {
  ...estimatePayload,
  paymentMethod: selectedBackendPaymentMethod,
};

      const response =
        await booking.mutateAsync(payload);

      if (!response?.id) {
        throw new Error(
          "Booking succeeded without a valid ride ID.",
        );
      }

      /*
       * Persist the ride using the same helper
       * consumed by the remaining ride screens.
       */
      storeActiveRide(response);

      /*
       * Cache the returned ride for subsequent
       * status checks.
       */
      queryClient.setQueryData(
        [
          "passenger",
          "ride",
          response.id,
        ],
        response,
      );

      if (
        validNumber(response.estimatedFare)
      ) {
        setEstimatedFare(
          response.estimatedFare,
        );
      } else {
        setEstimatedFare(quotedFare);
      }

      /*
       * Navigate according to the actual backend
       * status, not an assumed status.
       */
      const nextRoute = getRideRoute(
        response.status,
      );

      switch (response.status) {
        case "requested":
        case "searching":
        case "no_drivers_found":
          setRideStatus("searching");
          break;

        case "driver_assigned":
          setRideStatus("driver-assigned");
          break;

        case "driver_en_route":
          setRideStatus("driver-en-route");
          break;

        case "driver_arrived":
          setRideStatus("driver-arrived");
          break;

        case "ride_started":
        case "ride_in_progress":
          setRideStatus("in-progress");
          break;

        default:
          break;
      }

      navigate(nextRoute, {
        replace: true,
      });
    } catch (error) {
      console.error(
        "BOOK RIDE ERROR:",
        error,
      );

      toast.error(
        getErrorMessage(
          error,
          "Unable to book your ride. Please try again.",
        ),
      );
    } finally {
      bookingLock.current = false;
    }
  };

  /* =======================================================
     ROUTE GUARD

     Must remain after all hooks.
  ======================================================= */

  if (
    !pickup ||
    !destination ||
    !pickupCoordinates ||
    !destinationCoordinates ||
    !selectedRideType ||
    !center
  ) {
    return (
      <Navigate
        to="/passenger/book-ride"
        replace
      />
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
      {/* =================================================
          MAP
      ================================================= */}

      <PassengerMap
        center={center}
        pickup={pickup}
        destination={destination}
        zoom={16}
      />

      <RideMapHeader title="Confirm ride" />

      {/* =================================================
          BOTTOM SHEET
      ================================================= */}

      <RideBottomSheet>
        {/* ===============================================
            HEADING
        =============================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#302B34]">
            Confirm your ride
          </h1>

          <p className="mt-1 text-[13px] leading-5 text-[#99939D]">
            Review your pickup, destination and
            estimated fare before booking.
          </p>
        </motion.div>

        {/* ===============================================
            ROUTE SUMMARY
        =============================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.05,
          }}
          className="mt-5 rounded-[16px] bg-[#F7F5F8] p-4"
        >
          {/* PICKUP */}

          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDE4F6] text-[#7442AD]">
              <Navigation size={18} />
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-[#9A949E]">
                Pickup location
              </p>

              <p className="mt-1 truncate text-[15px] font-semibold text-[#302B34]">
                {pickup.label ||
                  pickup.address ||
                  "Pickup"}
              </p>

              {pickup.address &&
                pickup.address !== pickup.label && (
                  <p className="mt-1 truncate text-[12px] text-[#908A94]">
                    {pickup.address}
                  </p>
                )}
            </div>
          </div>

          {/* STOPS */}

          {ride.stops.map((stop, index) => (
            <div key={stop.id}>
              <div className="my-2 ml-5 h-4 border-l-2 border-dotted border-[#C9C2CF]" />

              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0ECF3] text-[#7442AD]">
                  <MapPin size={17} />
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-[#9A949E]">
                    Stop {index + 1}
                  </p>

                  <p className="mt-1 truncate text-[14px] font-semibold text-[#302B34]">
                    {stop.label ||
                      stop.address ||
                      "Additional stop"}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* DESTINATION */}

          <div className="my-2 ml-5 h-4 border-l-2 border-dotted border-[#C9C2CF]" />

          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEEAF0] text-[#7442AD]">
              <MapPin size={18} />
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-[#9A949E]">
                Dropoff location
              </p>

              <p className="mt-1 truncate text-[15px] font-semibold text-[#302B34]">
                {destination.label ||
                  destination.address ||
                  "Destination"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ===============================================
            RIDE DETAILS
        =============================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.1,
          }}
          className="mt-4 rounded-[16px] border border-[#EEEAF1] bg-white p-4"
        >
          <div className="flex items-start justify-between gap-3">
            {/* CATEGORY */}

            <div className="min-w-0">
              <p className="text-[12px] text-[#99939D]">
                Selected ride
              </p>

              <p className="mt-1 text-[17px] font-semibold text-[#302B34]">
                {selectedOption?.name ??
                  selectedRideType}
              </p>

              <p className="mt-1 text-[12px] text-[#96909A]">
                {selectedRideType === "suv"
                  ? "SUV"
                  : selectedRideType === "comfort"
                    ? "Comfort"
                    : "Economy"}{" "}
                category
              </p>
            </div>

            {/* FARE */}

            <div className="text-right">
              <p className="text-[12px] text-[#99939D]">
                Estimated fare
              </p>

              {isEstimating ? (
                <div className="mt-2 flex items-center justify-end gap-2 text-[#7442AD]">
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />

                  <span className="text-[12px]">
                    Calculating...
                  </span>
                </div>
              ) : hasQuote &&
                quotedFare !== null ? (
                <p className="mt-1 text-[21px] font-bold text-[#7442AD]">
                  {formatMoney(quotedFare)}
                </p>
              ) : (
                <p className="mt-1 text-[12px] text-[#99939D]">
                  Unavailable
                </p>
              )}
            </div>
          </div>

          {/* ESTIMATE ERROR */}

          {estimateFailed && (
            <div className="mt-4 rounded-[12px] bg-[#FFF5F2] p-3">
              <p className="text-[12px] leading-5 text-[#A34B35]">
                We couldn't calculate your fare.
                Please try again.
              </p>

              <button
                type="button"
                onClick={() =>
                  void estimateQuery.refetch()
                }
                className="mt-2 flex items-center gap-2 text-[12px] font-semibold text-[#7442AD]"
              >
                <RefreshCw size={14} />
                Retry estimate
              </button>
            </div>
          )}

          {/* DISTANCE & DURATION */}

          {(validNumber(distanceKm) ||
            validNumber(durationMin)) && (
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[#EEEAF0] pt-4">
              {validNumber(distanceKm) && (
                <span className="flex items-center gap-1.5 text-[12px] text-[#756F79]">
                  <Route size={15} />
                  {distanceKm.toFixed(1)} km
                </span>
              )}

              {validNumber(durationMin) && (
                <span className="flex items-center gap-1.5 text-[12px] text-[#756F79]">
                  <Clock3 size={15} />
                  {Math.round(durationMin)} min trip
                </span>
              )}
            </div>
          )}

          <div className="my-4 h-px bg-[#EEEAF0]" />

          {/* PAYMENT */}

          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2ECF8] text-[#7442AD]">
              {isCashPayment ? (
              <Banknote size={19} />
            ) : (
              <CreditCard size={19} />
            )}
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-[#99939D]">
                Payment method
              </p>

              <p className="mt-1 text-[14px] font-semibold text-[#302B34]">
                {paymentMethod?.label ??
                  "Not selected"}
              </p>

             <p className="mt-1 text-[11px] text-[#96909A]">
                {isCashPayment
                  ? "Pay your driver when the trip ends"
                  : "Secure card payment via Paystack"}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/passenger/ride/select")
              }
              className="flex items-center gap-1 text-[12px] font-semibold text-[#7442AD]"
            >
              Change
              <ChevronRight size={14} />
            </button>
          </div>

        </motion.div>

        {/* ===============================================
            PAYMENT INFORMATION
        =============================================== */}

        <div className="mt-4 rounded-[14px] bg-[#FAF8FC] px-4 py-3">
          <div className="flex items-start gap-3">
            <ShieldCheck
              size={18}
              className="mt-0.5 shrink-0 text-[#7442AD]"
            />

            <p className="text-[12px] leading-5 text-[#756F79]">
        {isCashPayment
          ? "This is an estimated fare. Your final fare will be calculated after your trip. Please pay the final amount directly to your driver."
          : "This is an estimated fare. Your final fare will be calculated after your trip. You will then complete your payment securely through Paystack."}
      </p>
          </div>
        </div>

        {/* ===============================================
            CONFIRM BUTTON
        =============================================== */}

        <motion.button
          type="button"
          disabled={!canBook}
          whileTap={
            canBook
              ? { scale: 0.98 }
              : undefined
          }
          onClick={confirm}
          className="
            mt-5 flex h-[56px] w-full
            items-center justify-center gap-2
            rounded-[14px] bg-[#7442AD]
            text-[16px] font-semibold text-white
            shadow-[0_10px_30px_rgba(116,66,173,0.24)]
            transition
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {booking.isPending ? (
            <>
              <LoaderCircle
                size={19}
                className="animate-spin"
              />
              Creating your ride...
            </>
          ) : estimateQuery.isFetching ? (
            <>
              <LoaderCircle
                size={19}
                className="animate-spin"
              />
              Checking fare...
            </>
          ) : (
            "Confirm ride"
          )}
        </motion.button>

        <p className="mt-3 text-center text-[11px] leading-5 text-[#A39CA8]">
          By confirming, SurDrive will begin
          searching for an available driver.
        </p>
      </RideBottomSheet>
    </div>
  );
}


// import { Banknote, Clock3, LoaderCircle, MapPin, Navigation, RefreshCw, Route } from "lucide-react";
// import { motion } from "framer-motion";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { Navigate, useNavigate } from "react-router-dom";
// import { toast } from "sonner";

// import PassengerMap from "../../../components/passenger/ride/PassengerMap";
// import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
// import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";
// import { usePassengerRide } from "../../../context/PassengerRideContext";
// import { rideOptions } from "../../../data/passengerRide";
// import {
//   locationToBackendPoint,
//   stopToBackendPoint,
//   type BookRideRequest,
//   type EstimateRideRequest,
//   type EstimateRideResponse,
// } from "../../../api/passenger/rides";
// import { useBookPassengerRide, useEstimatePassengerRide } from "../../../hooks/passenger/usePassengerRideBooking";


// function formatMoney(amount: number) {
//   return amount.toLocaleString("en-NG", {
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 2,
//   });
// }

// function getErrorMessage(error: unknown, fallback: string) {
//   if (error && typeof error === "object") {
//     const candidate = error as {
//       message?: unknown;
//       response?: { data?: { message?: unknown } };
//       data?: { message?: unknown };
//     };
//     const message =
//       candidate.response?.data?.message ??
//       candidate.data?.message ??
//       candidate.message;
//     if (typeof message === "string" && message.trim()) return message;
//     if (Array.isArray(message)) return message.join(", ");
//   }
//   return fallback;
// }

// function validNumber(value: unknown): value is number {
//   return typeof value === "number" && Number.isFinite(value);
// }

// type EstimateSnapshot = {
//   key: string;
//   response: EstimateRideResponse;
// };

// export default function ConfirmPickup() {
//   const navigate = useNavigate();
//   const { ride, setRideStatus, setEstimatedFare } = usePassengerRide();
//   const booking = useBookPassengerRide();
//   const estimate = useEstimatePassengerRide();

//   const [estimateSnapshot, setEstimateSnapshot] = useState<EstimateSnapshot | null>(null);
//   const [estimateErrorKey, setEstimateErrorKey] = useState<string | null>(null);
//   const [pendingEstimateKey, setPendingEstimateKey] = useState<string | null>(null);
//   const latestEstimateKey = useRef<string | null>(null);
//   const bookingLock = useRef(false);

//   // Only route/pricing inputs determine the estimate. Do not include estimatedFare
//   // here, because setEstimatedFare updates the context after a successful quote.
//   const estimateKey = JSON.stringify({
//     pickup: ride.pickup,
//     destination: ride.destination,
//     stops: ride.stops,
//     rideType: ride.selectedRide,
//   });

//   const estimatePayload = useMemo<EstimateRideRequest | null>(() => {
//     if (!ride.pickup || !ride.destination || !ride.selectedRide) return null;
//     try {
//       return {
//         pickup: locationToBackendPoint(ride.pickup),
//         dropoff: locationToBackendPoint(ride.destination),
//         ...(ride.stops.length
//           ? { stops: ride.stops.map(stopToBackendPoint) }
//           : {}),
//         rideType: ride.selectedRide,
//       };
//     } catch {
//       return null;
//     }
//     // The key captures all inputs, including stops and their coordinates.
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [estimateKey]);

//   const requestEstimate = (key: string, payload: EstimateRideRequest) => {
//     latestEstimateKey.current = key;
//     setEstimateErrorKey(null);
//     setPendingEstimateKey(key);

//     estimate.mutate(payload, {
//       onSuccess: (response) => {
//         if (latestEstimateKey.current !== key) return;
//         setPendingEstimateKey(null);
//         const fare = validNumber(response.estimatedFare)
//   ? response.estimatedFare
//   : response.fare?.total;
//         if (!validNumber(fare)) {
//           setEstimateErrorKey(key);
//           return;
//         }
//         setEstimateSnapshot({ key, response });
//         setEstimatedFare(fare);
//       },
//       onError: (error) => {
//         if (latestEstimateKey.current !== key) return;
//         console.error("FARE ESTIMATE ERROR:", error);
//         setPendingEstimateKey(null);
//         setEstimateErrorKey(key);
//       },
//     });
//   };

//   useEffect(() => {
//     latestEstimateKey.current = estimateKey;
//     if (!estimatePayload) {
//       setPendingEstimateKey(null);
//       return;
//     }
//     requestEstimate(estimateKey, estimatePayload);
//     // Run only when actual route/pricing inputs change.
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [estimateKey, estimatePayload]);

//     const supportedPaymentIds = [
//   "paystack-card",
//   "paystack-transfer",
// ] as const;

// const validPaymentMethod =
//   supportedPaymentIds.includes(
//     ride.paymentMethod?.id as
//       (typeof supportedPaymentIds)[number],
//   );

//   const quote = estimateSnapshot?.key === estimateKey
//     ? estimateSnapshot.response
//     : null;
//   const quotedFare = quote && validNumber(quote.estimatedFare)
//   ? quote.estimatedFare
//   : quote?.fare?.total;
//   const hasQuote = validNumber(quotedFare);
//   const isEstimating = pendingEstimateKey === estimateKey;
//   const estimateFailed = estimateErrorKey === estimateKey;
//   // const canBook = Boolean(estimatePayload && hasQuote && !isEstimating && !booking.isPending);
//   const canBook = Boolean(
//   estimatePayload &&
//   hasQuote &&
//   !isEstimating &&
//   !booking.isPending &&
//   validPaymentMethod,
// );
  
//   // const confirm = async () => {
//   //   if (bookingLock.current || !canBook || !estimatePayload || !ride.paymentMethod) return;
//   //   bookingLock.current = true;
//   //   try {
//   //     const payload: BookRideRequest = {
//   //       ...estimatePayload,
//   //       paymentMethod: ride.paymentMethod.type,
//   //     };
//   //     const response = await booking.mutateAsync(payload);
//   //     if (!response?.id) {
//   //       throw new Error("Ride booking response did not contain a ride ID.");
//   //     }
//   //     sessionStorage.setItem("surdrive_active_ride_id", response.id);
//   //     sessionStorage.setItem("surdrive_active_ride", JSON.stringify(response));
//   //     if (validNumber(response.estimatedFare)) {
//   //       setEstimatedFare(response.estimatedFare);
//   //     }
//   //     setRideStatus("searching");
//   //     navigate("/passenger/ride/searching", { replace: true });
//   //   } catch (error) {
//   //     console.error("BOOK RIDE ERROR:", error);
//   //     toast.error(getErrorMessage(error, "Unable to book your ride. Please try again."));
//   //   } finally {
//   //     bookingLock.current = false;
//   //   }
//   // };

//   const confirm = async () => {
//   if (bookingLock.current) return;

//   if (!canBook || !estimatePayload) {
//     toast.error(
//       "Please complete your ride details before booking.",
//     );
//     return;
//   }

//   if (!validPaymentMethod) {
//     toast.error(
//       "Please select a supported online payment method.",
//     );
//     return;
//   }

//   bookingLock.current = true;

//   try {
//     const payload: BookRideRequest = {
//       ...estimatePayload,
//       paymentMethod: "card",
//     };

//     const response = await booking.mutateAsync(payload);

//     if (!response?.id) {
//       throw new Error(
//         "Ride booking response did not contain a ride ID.",
//       );
//     }

//     sessionStorage.setItem(
//       "surdrive_active_ride_id",
//       response.id,
//     );

//     sessionStorage.setItem(
//       "surdrive_active_ride",
//       JSON.stringify(response),
//     );

//     if (validNumber(response.estimatedFare)) {
//       setEstimatedFare(response.estimatedFare);
//     }

//     setRideStatus("searching");

//     navigate("/passenger/ride/searching", {
//       replace: true,
//     });
//   } catch (error) {
//     console.error("BOOK RIDE ERROR:", error);

//     toast.error(
//       getErrorMessage(
//         error,
//         "Unable to book your ride. Please try again.",
//       ),
//     );
//   } finally {
//     bookingLock.current = false;
//   }
// };

//   // Hooks above are unconditional; guards belong below them.
//   if (!ride.pickup || !ride.destination || !ride.selectedRide) {
//     return <Navigate to="/passenger/book-ride" replace />;
//   }
//   const pickup = ride.pickup;
//   const destination = ride.destination;
//   const center = pickup.coordinates ?? destination.coordinates;
//   if (!center) return <Navigate to="/passenger/book-ride" replace />;
//   const option = rideOptions.find((item) => item.id === ride.selectedRide);

//   return (
//     <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
//       <PassengerMap center={center} pickup={pickup} destination={destination} zoom={16} />
//       <RideMapHeader title="Confirm ride" />

//       <RideBottomSheet>
//         <div>
//           <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#302B34]">
//             Confirm your ride
//           </h1>
//           <p className="mt-1 text-[14px] leading-5 text-[#99939D]">
//             Review your trip and estimated fare before we find your driver.
//           </p>
//         </div>

//         <div className="mt-5 rounded-[16px] bg-[#F7F5F8] p-4">
//           <div className="flex gap-3">
//             <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDE4F6] text-[#7442AD]">
//               <Navigation size={18} />
//             </span>
//             <div className="flex-1 min-w-0">
//               <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-[#9A949E]">Pickup</p>
//               <p className="mt-1 truncate text-[16px] font-semibold text-[#302B34]">
//                 {pickup.label || pickup.address || "Pickup"}
//               </p>
//               {pickup.address && pickup.address !== pickup.label && (
//                 <p className="mt-1 truncate text-[13px] text-[#908A94]">{pickup.address}</p>
//               )}
//             </div>
//           </div>

//           {ride.stops.map((stop, index) => (
//             <div key={stop.id}>
//               <div className="my-3 ml-5 h-4 border-l-2 border-dotted border-[#C9C2CF]" />
//               <div className="flex gap-3">
//                 <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0ECF3] text-[#7442AD]">
//                   <MapPin size={17} />
//                 </span>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-[#9A949E]">Stop {index + 1}</p>
//                   <p className="mt-1 truncate text-[15px] font-semibold text-[#302B34]">
//                     {stop.label || stop.address || "Stop"}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           ))}

//           <div className="my-3 ml-5 h-4 border-l-2 border-dotted border-[#C9C2CF]" />
//           <div className="flex gap-3">
//             <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFEDEF] text-[#302B34]">
//               <MapPin size={18} />
//             </span>
//             <div className="flex-1 min-w-0">
//               <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-[#9A949E]">Destination</p>
//               <p className="mt-1 truncate text-[16px] font-semibold text-[#302B34]">
//                 {destination.label || destination.address || "Destination"}
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="mt-4 rounded-[15px] border border-[#EEEAF1] bg-white p-4">
//           <div className="flex items-start justify-between gap-4">
//             <div className="min-w-0">
//               <p className="text-[13px] text-[#99939D]">Ride type</p>
//               <p className="mt-1 text-[17px] font-semibold text-[#302B34]">
//                 {option?.name ?? ride.selectedRide}
//               </p>
//             </div>
//             <div className="text-right">
//               <p className="text-[12px] text-[#99939D]">Estimated fare</p>
//               {isEstimating ? (
//                 <div className="mt-2 flex items-center justify-end gap-2 text-[#7442AD]">
//                   <LoaderCircle size={16} className="animate-spin" />
//                   <span className="text-[13px]">Calculating...</span>
//                 </div>
//               ) : hasQuote ? (
//                 <p className="mt-1 text-[21px] font-bold text-[#7442AD]">
//                   ₦{formatMoney(quotedFare)}
//                 </p>
//               ) : (
//                 <p className="mt-1 text-[13px] text-[#9A949E]">Unavailable</p>
//               )}
//             </div>
//           </div>

//           {estimateFailed && (
//             <div className="mt-3 rounded-xl bg-[#FFF5F2] px-3 py-3 text-[13px] text-[#A34B35]">
//               We couldn't calculate your fare right now.
//               {estimatePayload && (
//                 <button
//                   type="button"
//                   onClick={() => requestEstimate(estimateKey, estimatePayload)}
//                   className="mt-2 flex items-center gap-1 font-semibold text-[#7442AD]"
//                 >
//                   <RefreshCw size={14} /> Retry estimate
//                 </button>
//               )}
//             </div>
//           )}
          
// {quote?.route && (
//   <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-[#EEEAF0] pt-3 text-[13px] text-[#756F79]">
//     {validNumber(quote.route.distanceKm) && (
//       <span className="flex items-center gap-1.5">
//         <Route size={16} />
//         {quote.route.distanceKm.toFixed(1)} km
//       </span>
//     )}

//     {validNumber(quote.route.durationMin) && (
//       <span className="flex items-center gap-1.5">
//         <Clock3 size={16} />
//         {Math.round(quote.route.durationMin)} min
//       </span>
//     )}
//   </div>
// )}


//           <div className="my-4 h-px bg-[#EEEAF0]" />
//           <div className="flex items-center gap-2">
//             <Banknote size={18} className="text-[#7442AD]" />
//             <div>
//               <p className="text-[12px] text-[#99939D]">Payment</p>
//               <p className="mt-0.5 text-[14px] font-medium text-[#625C66]">
//                 {ride.paymentMethod.label}
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="mt-4 flex items-center gap-2 rounded-[14px] bg-[#FAF8FC] px-4 py-3 text-[#756F79]">
//           <Route size={16} className="shrink-0" />
//           <p className="text-[13px]">
//             {hasQuote
//               ? "This is an estimate. The final fare may change based on your trip."
//               : "A fare estimate is required before confirming your ride."}
//           </p>
//         </div>

//         <motion.button
//           type="button"
//           disabled={!canBook}
//           whileTap={canBook ? { scale: 0.98 } : undefined}
//           onClick={confirm}
//           className="mt-5 flex h-[56px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white shadow-[0_10px_30px_rgba(116,66,173,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
//         >
//           {booking.isPending ? (
//             <><LoaderCircle size={19} className="animate-spin" /> Creating ride...</>
//           ) : isEstimating ? (
//             <><LoaderCircle size={19} className="animate-spin" /> Calculating fare...</>
//           ) : (
//             "Confirm ride"
//           )}
//         </motion.button>
//       </RideBottomSheet>
//     </div>
//   );
// }




