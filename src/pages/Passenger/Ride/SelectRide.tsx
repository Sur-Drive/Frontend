"use client";

import {
  BadgePercent,
  Banknote,
  Building2,
  ChevronRight,
  Clock3,
  CreditCard,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Route,
  ShieldCheck,
} from "lucide-react";

import { motion } from "framer-motion";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  useQueries,
} from "@tanstack/react-query";

import { toast } from "sonner";

import PassengerMap from "../../../components/passenger/ride/PassengerMap";
import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";
import PaymentMethodSheet from "../../../components/passenger/ride/PaymentMethodSheet";
import PromoCodeSheet from "../../../components/passenger/ride/PromoCodeSheet";

import {
  rideOptions,
} from "../../../data/passengerRide";

import {
  usePassengerRide,
} from "../../../context/PassengerRideContext";

import {
  passengerRideApi,
  locationToBackendPoint,
  stopToBackendPoint,
  type EstimateRideRequest,
  type EstimateRideResponse,
} from "../../../api/passenger/rides";

import type {
  PaymentMethod,
} from "../../../types/passengerRide";

/* =========================================================
   CONSTANTS
========================================================= */

const BRAND_COLOR = "#7442AD";

const RIDE_TYPES = [
  "economy",
  "comfort",
  "suv",
] as const;

type RideType = (typeof RIDE_TYPES)[number];

const paymentMethods: PaymentMethod[] = [
  {
    id: "cash",
    type: "cash",
    label: "Pay with Cash",
  },
  {
    id: "paystack-card",
    type: "card",
    label: "Pay with Card",
  },
];

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

function isValidNumber(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function getEstimatedFare(
  estimate?: EstimateRideResponse,
): number | null {
  if (!estimate) {
    return null;
  }

  if (isValidNumber(estimate.estimatedFare)) {
    return estimate.estimatedFare;
  }

  if (isValidNumber(estimate.fare?.total)) {
    return estimate.fare.total;
  }

  return null;
}

function getEstimateDistance(
  estimate?: EstimateRideResponse,
): number | null {
  if (!estimate) {
    return null;
  }

  const distance = estimate.route?.distanceKm;

  return isValidNumber(distance)
    ? distance
    : null;
}

function getEstimateDuration(
  estimate?: EstimateRideResponse,
): number | null {
  if (!estimate) {
    return null;
  }

  const duration = estimate.route?.durationMin;

  return isValidNumber(duration)
    ? duration
    : null;
}

function isSupportedRideType(
  value: unknown,
): value is RideType {
  return RIDE_TYPES.some(
    (type) => type === value,
  );
}

function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unable to calculate ride fares.";
}

/* =========================================================
   COMPONENT
========================================================= */

export default function SelectRide() {
  const navigate = useNavigate();

  const {
    ride,
    selectRide,
    setRideStatus,
    setPaymentMethod,
    setPromoCode,
    setEstimatedFare,
  } = usePassengerRide();

  /* =======================================================
     LOCAL STATE
  ======================================================= */

  const [
    paymentSheetOpen,
    setPaymentSheetOpen,
  ] = useState(false);

  const [
    promoSheetOpen,
    setPromoSheetOpen,
  ] = useState(false);

  /* =======================================================
     LOCATION VALIDATION
  ======================================================= */

  const pickup = ride.pickup;

  const destination = ride.destination;

  const pickupCoordinates =
    pickup?.coordinates;

  const destinationCoordinates =
    destination?.coordinates;

  const hasValidLocations = Boolean(
    pickup &&
      destination &&
      pickupCoordinates &&
      destinationCoordinates,
  );

  const mapCenter =
    pickupCoordinates ??
    destinationCoordinates;

  /* =======================================================
     ESTIMATE PAYLOAD

     A new payload is created whenever:
     - pickup changes
     - destination changes
     - stops change

     Payment method does not affect the
     route estimate.
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

  const estimateBase = useMemo(() => {
    if (
      !pickup ||
      !destination ||
      !pickup.coordinates ||
      !destination.coordinates
    ) {
      return null;
    }

    try {
      return {
        pickup: locationToBackendPoint(pickup),

        dropoff: locationToBackendPoint(destination),

        ...(ride.stops.length > 0
          ? {
              stops: ride.stops.map(
                stopToBackendPoint,
              ),
            }
          : {}),
      };
    } catch (error) {
      console.error(
        "INVALID ESTIMATE LOCATIONS:",
        error,
      );

      return null;
    }

    // routeKey captures the actual route inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  /* =======================================================
     BACKEND FARE ESTIMATES

     Requests:
     economy
     comfort
     suv

     React Query handles:
     - caching
     - loading
     - errors
     - refetching
  ======================================================= */

  const estimateQueries = useQueries({
    queries: RIDE_TYPES.map((rideType) => {
      const payload: EstimateRideRequest | null =
        estimateBase
          ? {
              ...estimateBase,
              rideType,
            }
          : null;

      return {
        queryKey: [
          "passenger",
          "ride-estimate",
          routeKey,
          rideType,
        ],

        queryFn: async () => {
          if (!payload) {
            throw new Error(
              "Valid ride locations are required.",
            );
          }

          return passengerRideApi.estimateRide(
            payload,
          );
        },

        enabled: Boolean(payload),

        staleTime: 30_000,

        retry: 1,

        refetchOnWindowFocus: false,
      };
    }),
  });

  /* =======================================================
     ESTIMATE LOOKUP
  ======================================================= */

  const estimates = useMemo(() => {
    const result: Partial<
      Record<RideType, EstimateRideResponse>
    > = {};

    RIDE_TYPES.forEach((rideType, index) => {
      const response = estimateQueries[index].data;

      if (response) {
        result[rideType] = response;
      }
    });

    return result;
  }, [
    estimateQueries[0].data,
    estimateQueries[1].data,
    estimateQueries[2].data,
  ]);

  const isLoadingEstimates =
    estimateQueries.some(
      (query) => query.isPending && query.isFetching,
    );

  const isRefreshingEstimates =
    estimateQueries.some(
      (query) => query.isFetching,
    );

  const hasEstimateError =
    estimateQueries.some(
      (query) => query.isError,
    );

  const retryEstimates = () => {
    estimateQueries.forEach((query) => {
      if (query.isError) {
        void query.refetch();
      }
    });
  };

  /* =======================================================
     SELECTED RIDE
  ======================================================= */

  const selectedOption = rideOptions.find(
    (option) =>
      option.id === ride.selectedRide,
  );

  const selectedRideType =
    isSupportedRideType(ride.selectedRide)
      ? ride.selectedRide
      : null;

  const selectedEstimate = selectedRideType
    ? estimates[selectedRideType]
    : undefined;

  const selectedFare =
    getEstimatedFare(selectedEstimate);

  const selectedFareReady =
    selectedFare !== null &&
    selectedFare >= 0;

  const selectedEstimateQuery =
    selectedRideType
      ? estimateQueries[
          RIDE_TYPES.indexOf(selectedRideType)
        ]
      : null;

  const selectedEstimateLoading =
    selectedEstimateQuery?.isFetching ?? false;

  /* =======================================================
     PAYMENT VALIDATION
  ======================================================= */

  // const selectedPaymentSupported =
  //   paymentMethods.some(
  //     (method) =>
  //       method.id === ride.paymentMethod?.id,
  //   );
  const selectedPaymentSupported = paymentMethods.some(
  (method) =>
    method.id === ride.paymentMethod?.id &&
    method.type === ride.paymentMethod?.type,
);

  useEffect(() => {
    if (selectedPaymentSupported) {
      return;
    }

    setPaymentMethod(paymentMethods[0]);
  }, [
    selectedPaymentSupported,
    setPaymentMethod,
  ]);

  /* =======================================================
     SELECT RIDE
  ======================================================= */

  const handleSelectRide = (
    rideType: RideType,
  ) => {
    selectRide(rideType);

    const fare = getEstimatedFare(
      estimates[rideType],
    );

    if (fare !== null) {
      setEstimatedFare(fare);
    }
  };

  /* =======================================================
     CONTINUE
  ======================================================= */

  const canContinue = Boolean(
    hasValidLocations &&
      estimateBase &&
      selectedOption &&
      selectedFareReady &&
      !selectedEstimateLoading &&
      selectedPaymentSupported,
  );

  const handleContinue = () => {
    if (!hasValidLocations) {
      toast.error(
        "Please select valid pickup and destination locations.",
      );

      return;
    }

    if (!selectedOption || !selectedRideType) {
      toast.error(
        "Please select a ride category.",
      );

      return;
    }

    if (
      selectedFare === null ||
      !selectedFareReady
    ) {
      toast.error(
        "Please wait for your fare estimate.",
      );

      return;
    }

    if (!selectedPaymentSupported) {
      toast.error(
        "Please select an online payment method.",
      );

      return;
    }

    setEstimatedFare(selectedFare);

    setRideStatus("confirming");

    navigate("/passenger/ride/confirm");
  };

  /* =======================================================
     LOCATION GUARD

     Keep this AFTER all hooks.
  ======================================================= */

  if (!hasValidLocations || !mapCenter) {
    return (
      <Navigate
        to="/passenger/book-ride"
        replace
      />
    );
  }

  const pickupLabel =
    pickup?.label ||
    pickup?.address ||
    "Pickup location";

  const destinationLabel =
    destination?.label ||
    destination?.address ||
    "Destination";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
      {/* =================================================
          MAP
      ================================================= */}

      <PassengerMap
        center={mapCenter}
        pickup={pickup}
        destination={destination}
        zoom={14}
      />

      <RideMapHeader title="Choose a ride" />

      {/* =================================================
          BOTTOM SHEET
      ================================================= */}

      <RideBottomSheet>
        {/* ===============================================
            ROUTE SUMMARY
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
          className="mb-5 rounded-[16px] border border-[#EEEAF0] bg-[#FAF9FB] px-4 py-3"
        >
          {/* PICKUP */}

          <div className="flex items-start gap-3">
            <div className="mt-[5px] flex w-4 shrink-0 justify-center">
              <span className="h-[9px] w-[9px] rounded-full border-2 border-[#7442AD] bg-white" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[#99939D]">
                Pickup
              </p>

              <p className="mt-0.5 truncate text-[14px] font-semibold text-[#302B34]">
                {pickupLabel}
              </p>
            </div>
          </div>

          <div className="my-1 ml-[7px] h-4 w-px bg-[#D9D3DD]" />

          {/* DESTINATION */}

          <div className="flex items-start gap-3">
            <div className="mt-[4px] flex w-4 shrink-0 justify-center">
              <MapPin
                size={14}
                fill={BRAND_COLOR}
                className="text-[#7442AD]"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[#99939D]">
                Destination
              </p>

              <p className="mt-0.5 truncate text-[14px] font-semibold text-[#302B34]">
                {destinationLabel}
              </p>
            </div>
          </div>

          {/* STOPS */}

          {ride.stops.length > 0 && (
            <div className="mt-3 border-t border-[#EEEAF0] pt-3">
              <p className="text-[12px] font-medium text-[#99939D]">
                {ride.stops.length === 1
                  ? "1 additional stop"
                  : `${ride.stops.length} additional stops`}
              </p>

              <div className="mt-2 space-y-1.5">
                {ride.stops.map((stop, index) => (
                  <p
                    key={stop.id}
                    className="truncate text-[13px] text-[#625C66]"
                  >
                    {index + 1}.{" "}
                    {stop.label ||
                      stop.address ||
                      "Stop"}
                  </p>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* ===============================================
            HEADING
        =============================================== */}

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
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#302B34]">
                Choose your ride
              </h1>

              <p className="mt-1 text-[13px] text-[#99939D]">
                Select the ride that suits you.
              </p>
            </div>

            {isRefreshingEstimates && (
              <LoaderCircle
                size={20}
                className="animate-spin text-[#7442AD]"
              />
            )}
          </div>
        </motion.div>

        {/* ===============================================
            RIDE OPTIONS
        =============================================== */}

        <div className="mt-5 space-y-3">
          {rideOptions
            .filter((option) =>
              isSupportedRideType(option.id),
            )
            .map((option, index) => {
              const rideType =
                option.id as RideType;

              const estimate =
                estimates[rideType];

              const fare =
                getEstimatedFare(estimate);

              const distance =
                getEstimateDistance(estimate);

              const duration =
                getEstimateDuration(estimate);

              const query =
                estimateQueries[
                  RIDE_TYPES.indexOf(rideType)
                ];

              const isSelected =
                ride.selectedRide === rideType;

              const isLoading =
                query.isFetching;

              const hasError =
                query.isError;

              return (
                <motion.button
                  key={option.id}
                  type="button"
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.08 + index * 0.05,
                  }}
                  whileTap={{
                    scale: 0.985,
                  }}
                  onClick={() =>
                    handleSelectRide(rideType)
                  }
                  className={`
                    flex w-full items-center gap-3
                    rounded-[16px] border
                    px-3 py-4 text-left
                    transition-all duration-200
                    ${
                      isSelected
                        ? "border-[#7442AD] bg-[#FBF8FE] shadow-[0_4px_18px_rgba(116,66,173,0.08)]"
                        : "border-[#EEEAF0] bg-white"
                    }
                  `}
                >
                  {/* VEHICLE ICON */}

                  <div
                    className={`
                      flex h-[52px] w-[60px]
                      shrink-0 items-center
                      justify-center rounded-[12px]
                      ${
                        isSelected
                          ? "bg-[#EEE5F7]"
                          : "bg-[#F6F5F7]"
                      }
                    `}
                  >
                    <span className="text-[28px]">
                      {rideType === "suv"
                        ? "🚙"
                        : "🚘"}
                    </span>
                  </div>

                  {/* VEHICLE DETAILS */}

                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-[#302B34]">
                      {option.name}
                    </p>

                    <div className="flex flex-wrap items-center mt-1 gap-x-3 gap-y-1">
                      {duration !== null && (
                        <span className="flex items-center gap-1 text-[11px] text-[#88818D]">
                          <Clock3 size={12} />
                          {Math.round(duration)} min trip
                        </span>
                      )}

                      {distance !== null && (
                        <span className="flex items-center gap-1 text-[11px] text-[#88818D]">
                          <Route size={12} />
                          {distance.toFixed(1)} km
                        </span>
                      )}
                    </div>

                    {!isLoading &&
                      !hasError &&
                      fare !== null && (
                        <p className="mt-1 text-[11px] text-[#7442AD]">
                          Estimated fare
                        </p>
                      )}

                    {hasError && (
                      <p className="mt-1 text-[11px] text-[#D65C45]">
                        Estimate unavailable
                      </p>
                    )}
                  </div>

                  {/* PRICE */}

                  <div className="text-right shrink-0">
                    {isLoading ? (
                      <div className="flex items-center gap-1.5 text-[#7442AD]">
                        <LoaderCircle
                          size={15}
                          className="animate-spin"
                        />

                        <span className="text-[11px]">
                          Loading
                        </span>
                      </div>
                    ) : fare !== null ? (
                      <p className="text-[15px] font-bold text-[#302B34]">
                        {formatMoney(fare)}
                      </p>
                    ) : (
                      <p className="text-[12px] text-[#AAA4AE]">
                        Unavailable
                      </p>
                    )}

                    {isSelected && (
                      <span className="mt-1 inline-block rounded-full bg-[#EEE4F7] px-2 py-1 text-[10px] font-semibold text-[#7442AD]">
                        Selected
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
        </div>

        {/* ===============================================
            ESTIMATE ERROR
        =============================================== */}

        {hasEstimateError && (
          <div className="mt-4 rounded-[14px] border border-[#F6D8D2] bg-[#FFF7F5] p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[12px] leading-5 text-[#B65B49]">
                Some ride estimates could not be loaded.
                Please retry to see the latest prices.
              </p>

              <button
                type="button"
                onClick={retryEstimates}
                className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#7442AD]"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ===============================================
            ESTIMATE NOTE
        =============================================== */}

        <div className="mt-4 rounded-[12px] bg-[#FAF8FC] px-3 py-3">
          <p className="text-[12px] leading-5 text-[#8F8794]">
            Prices are estimated using your selected
            route and ride category. Your final fare
            may change based on the actual trip.
          </p>
        </div>

        <div className="my-5 h-px bg-[#EEEAF0]" />

        {/* ===============================================
            PAYMENT METHOD
        =============================================== */}

        <motion.button
          type="button"
          whileTap={{
            scale: 0.98,
          }}
          onClick={() =>
            setPaymentSheetOpen(true)
          }
          className="flex w-full items-center gap-3 rounded-[12px] py-2 text-left"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F2ECF8] text-[#7442AD]">
            {ride.paymentMethod?.type === "cash" ? (
            <Banknote size={20} />
          ) : (
            <CreditCard size={20} />
          )}
          </span>

          <span className="flex-1 min-w-0">
            <span className="block truncate text-[15px] font-semibold text-[#302B34]">
              {selectedPaymentSupported
                ? ride.paymentMethod.label
                : "Choose payment method"}
            </span>

            <span className="mt-1 block text-[12px] text-[#9C96A0]">
              {ride.paymentMethod?.type === "cash"
                ? "Pay your driver after the trip"
                : "Secure card payment via Paystack"}
            </span>
          </span>

          <ChevronRight
            size={18}
            className="text-[#AAA4AE]"
          />
        </motion.button>

        {/* ===============================================
            PROMO CODE
        =============================================== */}

        <motion.button
          type="button"
          whileTap={{
            scale: 0.98,
          }}
          onClick={() =>
            setPromoSheetOpen(true)
          }
          className="mt-3 flex w-full items-center gap-3 rounded-[12px] py-2 text-left"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F2ECF8] text-[#7442AD]">
            <BadgePercent size={20} />
          </span>

          <span className="flex-1 min-w-0">
            <span className="block truncate text-[15px] font-semibold text-[#302B34]">
              {ride.promoCode || "Promo / Voucher"}
            </span>

            <span className="mt-1 block text-[12px] text-[#9C96A0]">
              {ride.promoCode
                ? "Promo code applied"
                : "Add a promotional code"}
            </span>
          </span>

          <ChevronRight
            size={18}
            className="text-[#AAA4AE]"
          />
        </motion.button>

        {/* ===============================================
            SAFETY
        =============================================== */}

        <div className="mt-5 flex items-start gap-3 rounded-[14px] bg-[#F2F9F4] px-4 py-3 text-[#398458]">
          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0"
          />

          <p className="text-[12px] leading-5">
            Your safety matters. Every SurDrive ride
            includes trip sharing and safety features.
          </p>
        </div>

        {/* ===============================================
            CONTINUE BUTTON
        =============================================== */}

        <motion.button
          type="button"
          disabled={!canContinue}
          whileTap={
            canContinue
              ? { scale: 0.98 }
              : undefined
          }
          onClick={handleContinue}
          className="
            mt-5 flex h-[56px] w-full
            items-center justify-center gap-2
            rounded-[14px] bg-[#7442AD]
            text-[16px] font-semibold text-white
            shadow-[0_10px_28px_rgba(116,66,173,0.22)]
            transition
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          {selectedEstimateLoading ? (
            <>
              <LoaderCircle
                size={18}
                className="animate-spin"
              />

              Calculating fare...
            </>
          ) : selectedFareReady &&
            selectedOption ? (
            <>
              Continue •{" "}
              {formatMoney(selectedFare!)}
            </>
          ) : isLoadingEstimates ? (
            <>
              <LoaderCircle
                size={18}
                className="animate-spin"
              />

              Loading ride options...
            </>
          ) : (
            "Select a ride"
          )}
        </motion.button>

        <p className="mt-3 text-center text-[11px] leading-5 text-[#A39CA8]">
          You will review your trip before confirming
          your booking.
        </p>
      </RideBottomSheet>

      {/* =================================================
          PAYMENT SHEET
      ================================================= */}

      <PaymentMethodSheet
        open={paymentSheetOpen}
        onClose={() =>
          setPaymentSheetOpen(false)
        }
        selected={ride.paymentMethod}
        methods={paymentMethods}
        onSelect={(method) => {
          setPaymentMethod(method);
          setPaymentSheetOpen(false);
        }}
      />

      {/* =================================================
          PROMO SHEET
      ================================================= */}

      <PromoCodeSheet
        open={promoSheetOpen}
        onClose={() =>
          setPromoSheetOpen(false)
        }
        currentCode={ride.promoCode ?? ""}
        onApply={(code) => {
          setPromoCode(code);
          setPromoSheetOpen(false);
        }}
      />
    </div>
  );
}


// import {
//   BadgePercent,
//   Banknote,
//   CreditCard,
//   Building2,
//   ChevronRight,
//   MapPin,
//   ShieldCheck,
// } from "lucide-react";

// import {
//   motion,
// } from "framer-motion";

// import {
//   useEffect,
//   useMemo,
//   useState,
// } from "react";

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

// /**
//  * IMPORTANT:
//  *
//  * The backend currently documents:
//  *
//  * rideType:
//  * - economy
//  * - comfort
//  * - suv
//  *
//  * paymentMethod:
//  * - cash
//  * - card
//  * - wallet
//  *
//  * There is currently no documented
//  * fare-estimate endpoint in the supplied
//  * backend API collection.
//  *
//  * Therefore this screen selects the ride
//  * category/payment method but does NOT
//  * create the ride yet.
//  */

// // const paymentMethods: PaymentMethod[] = [
// //   {
// //     id: "card-4412",
// //     type: "card",
// //     label: "MasterCard •••• 4412",
// //   },

// //   {
// //     id: "cash",
// //     type: "cash",
// //     label: "Cash",
// //   },

// //   // Enable when the wallet flow is ready.
// //   //
// //   // {
// //   //   id: "surdrive-wallet",
// //   //   type: "wallet",
// //   //   label: "Sur-Drive Wallet",
// //   //   detail: "Wallet",
// //   // },
// // ];

// const paymentMethods: PaymentMethod[] = [
//   {
//     id: "paystack-card",
//     type: "card",
//     label: "Pay with Card",
//   },
//   {
//     id: "paystack-transfer",
//     type: "card",
//     label: "Bank Transfer",
//   },
// ];

// export default function SelectRide() {
//   const navigate =
//     useNavigate();

//   const {
//     ride,
//     selectRide,
//     setRideStatus,
//     setPaymentMethod,
//     setPromoCode,
//   } =
//     usePassengerRide();

//   const [
//     paymentSheetOpen,
//     setPaymentSheetOpen,
//   ] = useState(false);

//   const [
//     promoSheetOpen,
//     setPromoSheetOpen,
//   ] = useState(false);

//   /**
//    * The rider should never reach
//    * this page without both locations.
//    */
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

//   /**
//    * BookRide should already have
//    * resolved coordinates before
//    * navigating here.
//    *
//    * We intentionally don't use a
//    * hard-coded Lagos fallback.
//    */
//   const mapCenter =
//     pickup ??
//     destination;

//   /**
//    * Find the currently selected
//    * category from our UI definitions.
//    */
//   const selectedOption =
//     useMemo(
//       () =>
//         rideOptions.find(
//           (option) =>
//             option.id ===
//             ride.selectedRide,
//         ),
//       [
//         ride.selectedRide,
//       ],
//     );

//   /**
//    * If an old ride category remains
//    * in state but no longer exists in
//    * our supported UI options, clear
//    * nothing automatically here.
//    *
//    * The user simply needs to choose
//    * one of the available categories.
//    */

//   /**
//    * Ensure selected payment is still
//    * supported by this screen.
//    *
//    * This prevents stale wallet/card
//    * state from silently being sent
//    * later if that option is no longer
//    * available in the UI.
//    */
//   // const selectedPaymentSupported =
//   //   useMemo(
//   //     () =>
//   //       paymentMethods.some(
//   //         (method) =>
//   //           method.type ===
//   //             ride.paymentMethod
//   //               ?.type,
//   //       ),
//   //     [
//   //       ride.paymentMethod,
//   //     ],
//   //   );

//   // useEffect(() => {
//   //   if (
//   //     selectedPaymentSupported
//   //   ) {
//   //     return;
//   //   }

//   //   const fallback =
//   //     paymentMethods.find(
//   //       (method) =>
//   //         method.type ===
//   //         "cash",
//   //     );

//   //   if (fallback) {
//   //     setPaymentMethod(
//   //       fallback,
//   //     );
//   //   }
//   // }, [
//   //   selectedPaymentSupported,
//   //   setPaymentMethod,
//   // ]);
//   const selectedPaymentSupported = useMemo(() => {
//   return paymentMethods.some(
//     (method) =>
//       method.id === ride.paymentMethod?.id,
//   );
// }, [ride.paymentMethod]);

// useEffect(() => {
//   if (selectedPaymentSupported) {
//     return;
//   }

//   // Cash must never be selected as a fallback.
//   setPaymentMethod(paymentMethods[0]);
// }, [
//   selectedPaymentSupported,
//   setPaymentMethod,
// ]);

//   /**
//    * Continue to confirmation.
//    *
//    * DO NOT POST /rides/book here.
//    *
//    * Confirmation should be the final
//    * point where the rider reviews:
//    *
//    * pickup
//    * destination
//    * stops
//    * category
//    * payment method
//    *
//    * before creating the actual ride.
//    */
//   // const handleContinue =
//   //   () => {
//   //     if (!selectedOption) {
//   //       return;
//   //     }

//   //     setRideStatus(
//   //       "confirming",
//   //     );

//   //     navigate(
//   //       "/passenger/ride/confirm",
//   //     );
//   //   };
//   const handleContinue = () => {
//   if (!selectedOption) {
//     return;
//   }

//   if (!selectedPaymentSupported) {
//     return;
//   }

//   setRideStatus("confirming");

//   navigate("/passenger/ride/confirm");
// };

//   const pickupLabel =
//     ride.pickup.label ||
//     ride.pickup.address ||
//     "Pickup";

//   const destinationLabel =
//     ride.destination.label ||
//     ride.destination.address ||
//     "Destination";

//   return (
//     <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
//       {/* MAP */}

//       {mapCenter ? (
//         <PassengerMap
//           center={mapCenter}
//           pickup={
//             ride.pickup
//           }
//           destination={
//             ride.destination
//           }
//           zoom={14}
//         />
//       ) : (
//         <div className="absolute inset-0 bg-[#F1EFF2]" />
//       )}

//       {/* HEADER */}

//       <RideMapHeader
//         title="Choose a ride"
//       />

//       {/* BOTTOM SHEET */}

//       <RideBottomSheet>
//         {/* ROUTE SUMMARY */}

//         <motion.div
//           initial={{
//             opacity: 0,
//             y: 8,
//           }}
//           animate={{
//             opacity: 1,
//             y: 0,
//           }}
//           className="
//             mb-5
//             rounded-[16px]
//             border
//             border-[#EEEAF0]
//             bg-[#FAF9FB]
//             px-4
//             py-3
//           "
//         >
//           {/* PICKUP */}

//           <div className="flex items-start gap-3">
//             <div className="mt-[5px] flex w-4 shrink-0 justify-center">
//               <span className="h-[9px] w-[9px] rounded-full border-[2px] border-[#7442AD] bg-white" />
//             </div>

//             <div className="flex-1 min-w-0">
//               <p className="text-[12px] font-medium text-[#99939D]">
//                 Pickup
//               </p>

//               <p className="mt-0.5 truncate text-[14px] font-semibold text-[#302B34]">
//                 {
//                   pickupLabel
//                 }
//               </p>
//             </div>
//           </div>

//           {/* CONNECTOR */}

//           <div className="ml-[7px] my-1 h-4 w-px bg-[#D9D3DD]" />

//           {/* DESTINATION */}

//           <div className="flex items-start gap-3">
//             <div className="mt-[4px] flex w-4 shrink-0 justify-center">
//               <MapPin
//                 size={14}
//                 className="text-[#7442AD]"
//                 fill="#7442AD"
//               />
//             </div>

//             <div className="flex-1 min-w-0">
//               <p className="text-[12px] font-medium text-[#99939D]">
//                 Destination
//               </p>

//               <p className="mt-0.5 truncate text-[14px] font-semibold text-[#302B34]">
//                 {
//                   destinationLabel
//                 }
//               </p>
//             </div>
//           </div>

//           {/* STOPS */}

//           {ride.stops.length >
//             0 && (
//             <div className="mt-3 border-t border-[#EEEAF0] pt-3">
//               <p className="text-[12px] font-medium text-[#99939D]">
//                 {ride.stops
//                   .length === 1
//                   ? "1 stop"
//                   : `${ride.stops.length} stops`}
//               </p>

//               <div className="mt-1 space-y-1">
//                 {ride.stops.map(
//                   (
//                     stop,
//                     index,
//                   ) => (
//                     <p
//                       key={
//                         stop.id
//                       }
//                       className="truncate text-[13px] text-[#625C66]"
//                     >
//                       {index +
//                         1}
//                       .{" "}
//                       {stop.label ||
//                         stop.address ||
//                         "Stop"}
//                     </p>
//                   ),
//                 )}
//               </div>
//             </div>
//           )}
//         </motion.div>

//         {/* TITLE */}

//         <motion.div
//           initial={{
//             opacity: 0,
//             y: 8,
//           }}
//           animate={{
//             opacity: 1,
//             y: 0,
//           }}
//           transition={{
//             delay: 0.05,
//           }}
//         >
//           <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#302B34]">
//             Choose a ride
//           </h1>

//           <p className="mt-1 text-[14px] leading-5 text-[#99939D]">
//             Select the ride
//             that works best
//             for you.
//           </p>
//         </motion.div>

//         {/* RIDE OPTIONS */}

//         <div className="mt-5 space-y-2">
//           {rideOptions.map(
//             (
//               option,
//               index,
//             ) => (
//               <motion.div
//                 key={
//                   option.id
//                 }
//                 initial={{
//                   opacity: 0,
//                   y: 10,
//                 }}
//                 animate={{
//                   opacity: 1,
//                   y: 0,
//                 }}
//                 transition={{
//                   delay:
//                     0.08 +
//                     index *
//                       0.04,
//                 }}
//               >
//                 <RideOptionCard
//                   option={
//                     option
//                   }
//                   selected={
//                     ride.selectedRide ===
//                     option.id
//                   }
//                   onSelect={() =>
//                     selectRide(
//                       option.id,
//                     )
//                   }
//                 />
//               </motion.div>
//             ),
//           )}
//         </div>

//         {/* BACKEND FARE NOTE */}

//         <motion.div
//           initial={{
//             opacity: 0,
//           }}
//           animate={{
//             opacity: 1,
//           }}
//           transition={{
//             delay: 0.2,
//           }}
//           className="
//             mt-3
//             rounded-[12px]
//             bg-[#FAF8FC]
//             px-3
//             py-2.5
//           "
//         >
//           <p className="text-[12px] leading-5 text-[#8F8794]">
//             Final ride pricing
//             will be provided by
//             Sur-Drive when your
//             booking is processed.
//           </p>
//         </motion.div>

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
//           className="
//             flex
//             w-full
//             items-center
//             gap-3
//             rounded-[12px]
//             py-2
//             text-left
//           "
//         >
//           <span
//             className="
//               flex
//               h-10
//               w-10
//               shrink-0
//               items-center
//               justify-center
//               rounded-full
//               bg-[#F2ECF8]
//               text-[#7442AD]
//             "
//           >
//             {/* <Banknote
//               size={19}
//             /> */}
//             {ride.paymentMethod?.id === "paystack-transfer" ? (
//   <Building2 size={19} />
// ) : (
//   <CreditCard size={19} />
// )}
//           </span>

//           <span className="flex-1 min-w-0">
//             <span className="block truncate text-[15px] font-semibold text-[#302B34]">
//               {ride
//                 .paymentMethod
//                 ?.label ??
//                 "Choose payment method"}
//             </span>

//             <span className="mt-0.5 block text-[12px] text-[#9C96A0]">
//               Payment method
//             </span>
//           </span>

//           <ChevronRight
//             size={18}
//             className="shrink-0 text-[#AAA4AE]"
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
//           className="
//             mt-2
//             flex
//             w-full
//             items-center
//             gap-3
//             rounded-[12px]
//             py-2
//             text-left
//           "
//         >
//           <span
//             className="
//               flex
//               h-10
//               w-10
//               shrink-0
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

//           <span className="flex-1 min-w-0">
//             <span className="block truncate text-[15px] font-semibold text-[#302B34]">
//               {ride.promoCode
//                 ? ride.promoCode
//                 : "Promo code"}
//             </span>

//             <span className="mt-0.5 block text-[12px] text-[#9C96A0]">
//               {ride.promoCode
//                 ? "Promotion added"
//                 : "Add a promotion"}
//             </span>
//           </span>

//           <ChevronRight
//             size={18}
//             className="shrink-0 text-[#AAA4AE]"
//           />
//         </motion.button>

//         {/* SAFETY */}

//         <div
//           className="
//             mt-5
//             flex
//             items-start
//             gap-2.5
//             rounded-[12px]
//             bg-[#F2F9F4]
//             px-3
//             py-3
//             text-[#398458]
//           "
//         >
//           <ShieldCheck
//             size={18}
//             className="mt-[1px] shrink-0"
//           />

//           <p className="text-[13px] leading-5">
//             Every ride
//             includes Sur-Drive
//             safety features.
//           </p>
//         </div>

//         {/* CONTINUE */}

//         <motion.button
//           type="button"
//           // disabled={
//           //   !selectedOption ||
//           //   !ride.paymentMethod
//           // }
//           disabled={
//   !selectedOption ||
//   !selectedPaymentSupported
// }
//           whileTap={
//             selectedOption &&
//             ride.paymentMethod
//               ? {
//                   scale: 0.98,
//                 }
//               : undefined
//           }
//           onClick={
//             handleContinue
//           }
//           className="
//             mt-5
//             flex
//             h-[56px]
//             w-full
//             items-center
//             justify-center
//             rounded-[14px]
//             bg-[#7442AD]
//             text-[16px]
//             font-semibold
//             text-white
//             shadow-[0_10px_28px_rgba(116,66,173,0.22)]
//             transition
//             disabled:cursor-not-allowed
//             disabled:opacity-40
//           "
//         >
//           {selectedOption
//             ? `Choose ${selectedOption.name}`
//             : "Choose a ride"}
//         </motion.button>
//       </RideBottomSheet>

//       {/* PAYMENT SHEET */}

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
//         onSelect={(
//           method,
//         ) => {
//           setPaymentMethod(
//             method,
//           );

//           setPaymentSheetOpen(
//             false,
//           );
//         }}
//       />

//       {/* PROMO SHEET */}

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
//           ride.promoCode ??
//           ""
//         }
//         onApply={(
//           code,
//         ) => {
//           setPromoCode(
//             code,
//           );

//           setPromoSheetOpen(
//             false,
//           );
//         }}
//       />
//     </div>
//   );
// }



