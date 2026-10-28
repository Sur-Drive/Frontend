import {
  Check,
  Clock3,
  MapPin,
  ReceiptText,
  Route,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  LoaderCircle,
  ChevronRight,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import { toast } from "sonner";

import PassengerMap from "../../../components/passenger/ride/PassengerMap";
import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";

import {
  passengerRideApi,
  type PassengerRideResponse,
} from "../../../api/passenger/rides";

import {
  clearActiveRide,
  getStoredActiveRide,
  getStoredActiveRideId,
  storeActiveRide,
} from "../../../utils/passengerActiveRide";

import {
  usePassengerRide,
} from "../../../context/PassengerRideContext";

import {
  useRideSocket,
} from "../../../hooks/passenger/useRideSocket";

/* =========================================================
   CONFIGURATION
========================================================= */

const FALLBACK_POLL_INTERVAL = 5000;

const TOKEN_KEY = "passenger_access_token";

const SUCCESS_KEY_PREFIX = "surdrive_trip_complete_seen_";

/*
  IMPORTANT:

  We have not confirmed the payment route yet.

  Set this to the actual payment route once
  we implement the Payment page.

  Example:
  const PAYMENT_ROUTE = "/passenger/ride/payment";
*/

// const PAYMENT_ROUTE: string | null = null;
const PAYMENT_ROUTE = "/passenger/ride/payment";

/* =========================================================
   TYPES
========================================================= */

type PaymentDisplayState =
  | "paid"
  | "pending"
  | "required"
  | "unknown";

/* =========================================================
   HELPERS
========================================================= */

function getPassengerToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function getSuccessStorageKey(rideId: string) {
  return `${SUCCESS_KEY_PREFIX}${rideId}`;
}

function hasSeenSuccess(rideId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    sessionStorage.getItem(
      getSuccessStorageKey(rideId),
    ) === "true"
  );
}

function markSuccessSeen(rideId: string) {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(
    getSuccessStorageKey(rideId),
    "true",
  );
}

function getPaymentDisplayState(
  response: PassengerRideResponse | null,
): PaymentDisplayState {
  if (!response) {
    return "unknown";
  }

  switch (response.status) {
    case "paid":
    case "closed":
      return "paid";

    case "payment_pending":
      return "pending";

    case "ride_completed":
      return "required";

    default:
      return "unknown";
  }
}

/* =========================================================
   COMPONENT
========================================================= */

export default function TripComplete() {
  const navigate = useNavigate();

  const {
    ride,
    setRideStatus,
  } = usePassengerRide();

  /* =======================================================
     STATE
  ======================================================= */

  const [backendRide, setBackendRide] =
    useState<PassengerRideResponse | null>(
      () => getStoredActiveRide(),
    );

  const [token, setToken] =
    useState<string | null>(getPassengerToken);

  const [showSuccess, setShowSuccess] =
    useState(false);

  const [initialLoading, setInitialLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [refreshError, setRefreshError] =
    useState(false);

  const [rideConfirmed, setRideConfirmed] =
    useState(false);

  /* =======================================================
     REFS
  ======================================================= */

  const mountedRef = useRef(true);

  const navigatingRef = useRef(false);

  const pollingRef = useRef(false);

  const successInitializedRef = useRef(false);

  /* =======================================================
     RIDE ID
  ======================================================= */

  const rideId =
    backendRide?.id ??
    getStoredActiveRideId();

  /* =======================================================
     TOKEN SYNCHRONIZATION
  ======================================================= */

  useEffect(() => {
    mountedRef.current = true;

    const syncToken = () => {
      setToken(getPassengerToken());
    };

    syncToken();

    window.addEventListener(
      "storage",
      syncToken,
    );

    return () => {
      mountedRef.current = false;

      window.removeEventListener(
        "storage",
        syncToken,
      );
    };
  }, []);

  /* =======================================================
     SHOW SUCCESS ONCE PER RIDE

     Only after backend confirms completion.
  ======================================================= */

  const initializeSuccess = useCallback(
    (confirmedRideId: string) => {
      if (successInitializedRef.current) {
        return;
      }

      successInitializedRef.current = true;

      if (!hasSeenSuccess(confirmedRideId)) {
        setShowSuccess(true);

        markSuccessSeen(confirmedRideId);
      }
    },
    [],
  );

  /* =======================================================
     HANDLE BACKEND STATUS
  ======================================================= */

  const handleRideStatus = useCallback(
    (response: PassengerRideResponse) => {
      if (
        !response?.id ||
        navigatingRef.current ||
        !mountedRef.current
      ) {
        return;
      }

      setBackendRide(response);

      setInitialLoading(false);

      setRefreshError(false);

      const status = response.status;

      /*
        Completed rides must remain stored until
        payment, receipt, and rating are finished.
      */

      if (status !== "cancelled") {
        storeActiveRide(response);
      }

      switch (status) {
        /* -----------------------------------------------
           COMPLETED
        ----------------------------------------------- */

        case "ride_completed":
        case "payment_pending":
        case "paid":
        case "closed":
          setRideConfirmed(true);

          initializeSuccess(response.id);

          return;

        /* -----------------------------------------------
           STILL IN TRIP
        ----------------------------------------------- */

        case "ride_started":
        case "ride_in_progress":
          navigatingRef.current = true;

          navigate(
            "/passenger/ride/in-trip",
            { replace: true },
          );

          return;

        /* -----------------------------------------------
           DRIVER ARRIVED
        ----------------------------------------------- */

        case "driver_arrived":
          navigatingRef.current = true;

          setRideStatus("driver-arrived");

          navigate(
            "/passenger/ride/driver-arrived",
            { replace: true },
          );

          return;

        /* -----------------------------------------------
           DRIVER EN ROUTE
        ----------------------------------------------- */

        case "driver_en_route":
          navigatingRef.current = true;

          setRideStatus("driver-en-route");

          navigate(
            "/passenger/ride/driver-en-route",
            { replace: true },
          );

          return;

        /* -----------------------------------------------
           DRIVER ASSIGNED
        ----------------------------------------------- */

        case "driver_assigned":
          navigatingRef.current = true;

          setRideStatus("driver-assigned");

          navigate(
            "/passenger/ride/driver-assigned",
            { replace: true },
          );

          return;

        /* -----------------------------------------------
           SEARCHING
        ----------------------------------------------- */

        case "requested":
        case "searching":
          navigatingRef.current = true;

          setRideStatus("searching");

          navigate(
            "/passenger/ride/searching",
            { replace: true },
          );

          return;

        /* -----------------------------------------------
           CANCELLED
        ----------------------------------------------- */

        case "cancelled":
          navigatingRef.current = true;

          clearActiveRide();

          setRideStatus("idle");

          toast.error(
            "This ride has been cancelled.",
          );

          navigate(
            "/passenger/home",
            { replace: true },
          );

          return;

        default:
          return;
      }
    },
    [
      navigate,
      setRideStatus,
      initializeSuccess,
    ],
  );

  /* =======================================================
     WEBSOCKET

     Ride and payment updates.
  ======================================================= */

  const {
    connected,
    socketError,
  } = useRideSocket({
    rideId,
    token,
    onRideUpdate: handleRideStatus,
    enabled: Boolean(rideId && token),
  });

  /* =======================================================
     INITIAL BACKEND LOAD

     Validate completion before displaying success.
  ======================================================= */

  useEffect(() => {
    if (!rideId) {
      setInitialLoading(false);
      return;
    }

    let active = true;

    const initialize = async () => {
      try {
        const response =
          await passengerRideApi.getRide(rideId);

        if (!active) {
          return;
        }

        handleRideStatus(response);
      } catch (error) {
        if (active) {
          console.error(
            "TRIP COMPLETE INITIAL LOAD ERROR:",
            error,
          );

          setRefreshError(true);

          setInitialLoading(false);
        }
      }
    };

    void initialize();

    return () => {
      active = false;
    };
  }, [rideId, handleRideStatus]);

  /* =======================================================
     FALLBACK POLLING

     Only when WebSocket is disconnected.
  ======================================================= */

  useEffect(() => {
    if (
      !rideId ||
      connected ||
      navigatingRef.current
    ) {
      return;
    }

    let active = true;

    const pollRide = async () => {
      if (
        !active ||
        pollingRef.current ||
        navigatingRef.current
      ) {
        return;
      }

      pollingRef.current = true;

      try {
        const response =
          await passengerRideApi.getRide(rideId);

        if (
          !active ||
          navigatingRef.current
        ) {
          return;
        }

        handleRideStatus(response);
      } catch (error) {
        if (active) {
          console.error(
            "TRIP COMPLETE FALLBACK ERROR:",
            error,
          );

          setRefreshError(true);
        }
      } finally {
        pollingRef.current = false;
      }
    };

    void pollRide();

    const interval = window.setInterval(
      () => {
        void pollRide();
      },
      FALLBACK_POLL_INTERVAL,
    );

    return () => {
      active = false;

      window.clearInterval(interval);
    };
  }, [
    rideId,
    connected,
    handleRideStatus,
  ]);

  /* =======================================================
     MANUAL REFRESH
  ======================================================= */

  const refreshRide = async () => {
    if (
      !rideId ||
      refreshing ||
      navigatingRef.current
    ) {
      return;
    }

    setRefreshing(true);

    try {
      const response =
        await passengerRideApi.getRide(rideId);

      if (!navigatingRef.current) {
        handleRideStatus(response);
      }
    } catch (error) {
      console.error(
        "TRIP COMPLETE REFRESH ERROR:",
        error,
      );

      setRefreshError(true);

      toast.error(
        "Unable to refresh trip details.",
      );
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  };

  /* =======================================================
     CONTINUE TO PAYMENT

     Do not invent a route until confirmed.
  ======================================================= */

  const continueToPayment = () => {
    if (!rideConfirmed) {
      toast.error(
        "Waiting for trip completion confirmation.",
      );
      return;
    }

    if (!PAYMENT_ROUTE) {
      toast.info(
        "Payment screen is the next step. Its route has not been configured yet.",
      );
      return;
    }

    setShowSuccess(false);

    navigate(PAYMENT_ROUTE);
  };

  /* =======================================================
     ROUTE GUARD
  ======================================================= */

  if (!rideId) {
    return (
      <Navigate
        to="/passenger/home"
        replace
      />
    );
  }

  /* =======================================================
     REFRESH-SAFE DESTINATION
  ======================================================= */

  const destination =
    ride.destination ??
    (backendRide?.dropoff
      ? {
          label:
            backendRide.dropoff.address ||
            "Destination",

          address:
            backendRide.dropoff.address ||
            "",

          coordinates: {
            lat: backendRide.dropoff.lat,
            lng: backendRide.dropoff.lng,
          },
        }
      : null);

  const pickup =
    ride.pickup ??
    (backendRide?.pickup
      ? {
          label:
            backendRide.pickup.address ||
            "Pickup location",

          address:
            backendRide.pickup.address ||
            "",

          coordinates: {
            lat: backendRide.pickup.lat,
            lng: backendRide.pickup.lng,
          },
        }
      : null);

  const center =
    destination?.coordinates;

  /* =======================================================
     RESTORING DATA
  ======================================================= */

  if (!center || !destination) {
    if (initialLoading) {
      return (
        <div className="flex h-[100dvh] items-center justify-center bg-[#F4F4F4]">
          <div className="text-center">
            <LoaderCircle
              size={30}
              className="mx-auto animate-spin text-[#7442AD]"
            />

            <p className="mt-4 text-[14px] text-[#918B95]">
              Restoring your completed trip...
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#F4F4F4] px-6">
        <div className="w-full max-w-[360px] text-center">
          <MapPin
            size={30}
            className="mx-auto text-[#7442AD]"
          />

          <h2 className="mt-4 text-[18px] font-semibold text-[#302B34]">
            Unable to load trip details
          </h2>

          <p className="mt-2 text-[14px] leading-6 text-[#918B95]">
            Your completed ride is still saved.
            Refresh to restore its details.
          </p>

          <button
            type="button"
            onClick={() => void refreshRide()}
            disabled={refreshing}
            className="mt-5 h-[50px] w-full rounded-[13px] bg-[#7442AD] text-[15px] font-semibold text-white disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh Trip"}
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     BACKEND TRIP DETAILS
  ======================================================= */

  const finalFare =
    backendRide?.finalFare ??
    backendRide?.fareBreakdown?.total ??
    backendRide?.estimatedFare;

  const isFinalFare =
    backendRide?.finalFare != null;

  const duration =
    backendRide?.actualDurationMin ??
    backendRide?.estimatedDurationMin;

  const distance =
    backendRide?.actualDistanceKm ??
    backendRide?.estimatedDistanceKm;

  const paymentMethod =
    backendRide?.paymentMethod;

  const paymentState =
    getPaymentDisplayState(backendRide);

  const connectionLabel = connected
    ? "Live ride updates connected"
    : refreshError
      ? "Unable to refresh ride status"
      : socketError
        ? "Using backup connection"
        : "Connecting to live updates...";

  /* =======================================================
     PAYMENT BADGE
  ======================================================= */

  const paymentBadge = (() => {
    switch (paymentState) {
      case "paid":
        return {
          label: "Payment completed",
          bg: "bg-[#E8F8EE]",
          text: "text-[#2E9B61]",
          icon: CheckCircle2,
        };

      case "pending":
        return {
          label: "Payment pending",
          bg: "bg-[#FFF6E4]",
          text: "text-[#B9862C]",
          icon: Clock3,
        };

      case "required":
        return {
          label: "Payment to be confirmed",
          bg: "bg-[#F3ECF9]",
          text: "text-[#7442AD]",
          icon: CreditCard,
        };

      default:
        return {
          label: "Checking payment status",
          bg: "bg-[#F7F5F8]",
          text: "text-[#817A85]",
          icon: AlertCircle,
        };
    }
  })();

  const PaymentIcon =
    paymentBadge.icon;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">

      {/* ===============================================
          MAP
      =============================================== */}

      <PassengerMap
        center={center}
        pickup={pickup}
        destination={destination}
        zoom={16}
      />

      {/* ===============================================
          HEADER
      =============================================== */}

      <RideMapHeader
        title="Trip Complete"
      />

      {/* ===============================================
          BOTTOM SHEET
      =============================================== */}

      <RideBottomSheet>

        {/* SUCCESS ICON */}

        <div className="text-center">

          <motion.div
            initial={{
              scale: 0,
            }}
            animate={{
              scale: 1,
            }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 16,
            }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E4F7EA] text-[#36A665]"
          >
            <Check
              size={31}
              strokeWidth={3}
            />
          </motion.div>

          <h1 className="mt-4 text-[24px] font-semibold text-[#302B34]">
            You've Arrived!
          </h1>

          <p className="mt-1 text-[14px] text-[#918B95]">
            {destination.label}
          </p>

        </div>

        {/* =========================================
            CONNECTION STATUS
        ========================================= */}

        <div className="mt-5 flex items-center justify-between gap-3 rounded-[13px] bg-[#F8F7FA] px-3 py-2.5">

          <div className="flex items-center min-w-0 gap-2">

            {connected ? (
              <Wifi
                size={15}
                className="shrink-0 text-[#3C9A65]"
              />
            ) : (
              <WifiOff
                size={15}
                className={
                  refreshError
                    ? "shrink-0 text-[#D05B5B]"
                    : "shrink-0 text-[#D6A044]"
                }
              />
            )}

            <p
              className={`truncate text-[12px] font-medium ${
                connected
                  ? "text-[#3C9A65]"
                  : refreshError
                    ? "text-[#D05B5B]"
                    : "text-[#A18448]"
              }`}
            >
              {connectionLabel}
            </p>

          </div>

          {!connected && (
            <button
              type="button"
              onClick={() => void refreshRide()}
              disabled={refreshing}
              aria-label="Refresh trip status"
              className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#7442AD] shadow-sm disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
            </button>
          )}

        </div>

        {/* =========================================
            DURATION / DISTANCE
        ========================================= */}

        <div className="grid grid-cols-2 gap-3 mt-5">

          <div className="rounded-[15px] bg-[#F7F5F8] p-4">

            <Clock3
              size={18}
              className="text-[#7442AD]"
            />

            <p className="mt-3 text-[13px] text-[#918B95]">
              Duration
            </p>

            <p className="mt-1 text-[16px] font-semibold">
              {typeof duration === "number"
                ? `${Math.round(duration)} min`
                : "—"}
            </p>

          </div>

          <div className="rounded-[15px] bg-[#F7F5F8] p-4">

            <Route
              size={18}
              className="text-[#7442AD]"
            />

            <p className="mt-3 text-[13px] text-[#918B95]">
              Distance
            </p>

            <p className="mt-1 text-[16px] font-semibold">
              {typeof distance === "number"
                ? `${distance.toFixed(1)} km`
                : "—"}
            </p>

          </div>

        </div>

        {/* =========================================
            FARE SUMMARY
        ========================================= */}

        <div className="mt-4 rounded-[16px] border border-[#EEEAF1] bg-white p-4">

          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-2">

              <ReceiptText
                size={19}
                className="text-[#7442AD]"
              />

              <span className="text-[15px] font-medium">
                {isFinalFare
                  ? "Final Fare"
                  : "Estimated Fare"}
              </span>

            </div>

            <span className="text-[21px] font-bold">
              {typeof finalFare === "number"
                ? formatCurrency(finalFare)
                : "—"}
            </span>

          </div>

          {/* PAYMENT METHOD */}

          {paymentMethod && (
            <>
              <div className="my-4 h-px bg-[#EEEAF1]" />

              <div className="flex items-center justify-between">

                <span className="text-[13px] text-[#918B95]">
                  Payment Method
                </span>

                <span className="text-[14px] font-semibold capitalize">
                  {paymentMethod}
                </span>

              </div>
            </>
          )}

          {/* PAYMENT STATUS */}

          <div className="my-4 h-px bg-[#EEEAF1]" />

          <div className="flex items-center justify-between gap-3">

            <span className="text-[13px] text-[#918B95]">
              Payment Status
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${paymentBadge.bg} ${paymentBadge.text}`}
            >
              <PaymentIcon size={13} />

              {paymentBadge.label}
            </span>

          </div>

          {/* DESTINATION */}

          <div className="my-4 h-px bg-[#EEEAF1]" />

          <div className="flex items-start gap-2">

            <MapPin
              size={17}
              className="mt-0.5 shrink-0 text-[#7442AD]"
            />

            <div>

              <p className="text-[12px] text-[#96909A]">
                Destination
              </p>

              <p className="mt-1 text-[14px] font-medium">
                {destination.label}
              </p>

            </div>

          </div>

        </div>

        {/* =========================================
            CONTINUE TO PAYMENT
        ========================================= */}

        <motion.button
          type="button"
          whileTap={{
            scale: 0.98,
          }}
          onClick={continueToPayment}
          disabled={!rideConfirmed}
          className="mt-5 flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white disabled:opacity-50"
        >
          <CreditCard size={19} />

          Continue to Payment

          <ChevronRight size={19} />
        </motion.button>

      </RideBottomSheet>

      {/* ===============================================
          SUCCESS MODAL
      =============================================== */}

      <AnimatePresence>

        {showSuccess && rideConfirmed && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#211927]/45 px-5 backdrop-blur-[5px]"
          >

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              transition={{
                type: "spring",
                stiffness: 220,
                damping: 20,
              }}
              className="w-full max-w-[390px] rounded-[26px] bg-white px-6 py-8 text-center"
            >

              <motion.div
                initial={{
                  scale: 0,
                }}
                animate={{
                  scale: 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 230,
                  damping: 15,
                  delay: 0.1,
                }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E4F7EA] text-[#36A665]"
              >
                <Check
                  size={39}
                  strokeWidth={3}
                />
              </motion.div>

              <h2 className="mt-5 text-[23px] font-semibold text-[#302B34]">
                Trip Complete
              </h2>

              <p className="mt-2 text-[14px] leading-6 text-[#918B95]">
                You've arrived safely at your destination.
                We hope you enjoyed your Sur-Drive ride.
              </p>

              <motion.button
                type="button"
                whileTap={{
                  scale: 0.98,
                }}
                onClick={continueToPayment}
                className="mt-7 flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white"
              >
                Continue to Payment

                <ChevronRight size={19} />
              </motion.button>

              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="mt-3 h-[48px] w-full text-[15px] font-semibold text-[#817A85]"
              >
                View Trip Summary
              </button>

            </motion.div>

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}

// import {
//   Check,
//   Clock3,
//   MapPin,
//   ReceiptText,
//   Route,
// } from "lucide-react";

// import {
//   AnimatePresence,
//   motion,
// } from "framer-motion";

// import {
//   useEffect,
//   useState,
// } from "react";

// import {
//   Navigate,
//   useNavigate,
// } from "react-router-dom";

// import PassengerMap from "../../../components/passenger/ride/PassengerMap";
// import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
// import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";

// import {
//   passengerRideApi,
//   type PassengerRideResponse,
// } from "../../../api/passenger/rides";

// import {
//   getStoredActiveRide,
//   getStoredActiveRideId,
//   storeActiveRide,
// } from "../../../utils/passengerActiveRide";

// import {
//   usePassengerRide,
// } from "../../../context/PassengerRideContext";

// export default function TripComplete() {
//   const navigate = useNavigate();

//   const {
//     ride,
//   } = usePassengerRide();

//   const [
//     backendRide,
//     setBackendRide,
//   ] =
//     useState<PassengerRideResponse | null>(
//       () => getStoredActiveRide(),
//     );

//   const [
//     showSuccess,
//     setShowSuccess,
//   ] = useState(true);

//   const rideId =
//     backendRide?.id ??
//     getStoredActiveRideId();

//   useEffect(() => {
//     if (!rideId) {
//       return;
//     }

//     let mounted = true;

//     const load = async () => {
//       try {
//         const response =
//           await passengerRideApi.getRide(
//             rideId,
//           );

//         if (!mounted) {
//           return;
//         }

//         setBackendRide(response);
//         storeActiveRide(response);
//       } catch (error) {
//         console.error(
//           "COMPLETE RIDE LOAD ERROR:",
//           error,
//         );
//       }
//     };

//     load();

//     return () => {
//       mounted = false;
//     };
//   }, [rideId]);

//   if (!ride.destination) {
//     return (
//       <Navigate
//         to="/passenger/home"
//         replace
//       />
//     );
//   }

//   const center =
//     ride.destination.coordinates;

//   if (!center) {
//     return (
//       <Navigate
//         to="/passenger/home"
//         replace
//       />
//     );
//   }

//   const finalFare =
//     backendRide?.finalFare ??
//     backendRide?.fareBreakdown
//       ?.total ??
//     backendRide?.estimatedFare;

//   const duration =
//     backendRide?.actualDurationMin ??
//     backendRide?.estimatedDurationMin;

//   const distance =
//     backendRide?.actualDistanceKm ??
//     backendRide?.estimatedDistanceKm;

//   const paymentMethod =
//     backendRide?.paymentMethod;

//   const continueToRating =
//     () => {
//       setShowSuccess(false);

//       navigate(
//         "/passenger/ride/rate",
//       );
//     };

//   return (
//     <div className="relative h-[100dvh] overflow-hidden">
//       <PassengerMap
//         center={center}
//         destination={
//           ride.destination
//         }
//         zoom={16}
//       />

//       <RideMapHeader
//         title="Trip Complete"
//       />

//       <RideBottomSheet>
//         <div className="text-center">
//           <motion.div
//             initial={{
//               scale: 0,
//             }}
//             animate={{
//               scale: 1,
//             }}
//             transition={{
//               type: "spring",
//               stiffness: 220,
//               damping: 16,
//             }}
//             className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E4F7EA] text-[#36A665]"
//           >
//             <Check
//               size={31}
//               strokeWidth={3}
//             />
//           </motion.div>

//           <h1 className="mt-4 text-[24px] font-semibold">
//             You've Arrived!
//           </h1>

//           <p className="mt-1 text-[14px] text-[#918B95]">
//             {
//               ride.destination
//                 .label
//             }
//           </p>
//         </div>

//         <div className="grid grid-cols-2 gap-3 mt-6">
//           <div className="rounded-[15px] bg-[#F7F5F8] p-4">
//             <Clock3
//               size={18}
//               className="text-[#7442AD]"
//             />

//             <p className="mt-3 text-[13px] text-[#918B95]">
//               Duration
//             </p>

//             <p className="mt-1 text-[16px] font-semibold">
//               {typeof duration ===
//               "number"
//                 ? `${duration} min`
//                 : "—"}
//             </p>
//           </div>

//           <div className="rounded-[15px] bg-[#F7F5F8] p-4">
//             <Route
//               size={18}
//               className="text-[#7442AD]"
//             />

//             <p className="mt-3 text-[13px] text-[#918B95]">
//               Distance
//             </p>

//             <p className="mt-1 text-[16px] font-semibold">
//               {typeof distance ===
//               "number"
//                 ? `${distance.toFixed(
//                     1,
//                   )} km`
//                 : "—"}
//             </p>
//           </div>
//         </div>

//         <div className="mt-4 rounded-[16px] border border-[#EEEAF1] p-4">
//           <div className="flex items-center justify-between gap-4">
//             <div className="flex items-center gap-2">
//               <ReceiptText
//                 size={19}
//                 className="text-[#7442AD]"
//               />

//               <span className="text-[15px] font-medium">
//                 {backendRide?.finalFare !=
//                 null
//                   ? "Final Fare"
//                   : "Estimated Fare"}
//               </span>
//             </div>

//             <span className="text-[21px] font-bold">
//               {typeof finalFare ===
//               "number"
//                 ? `₦${finalFare.toLocaleString(
//                     "en-NG",
//                     {
//                       maximumFractionDigits: 2,
//                     },
//                   )}`
//                 : "—"}
//             </span>
//           </div>

//           {paymentMethod && (
//             <>
//               <div className="my-4 h-px bg-[#EEEAF1]" />

//               <div className="flex items-center justify-between">
//                 <span className="text-[13px] text-[#918B95]">
//                   Payment
//                 </span>

//                 <span className="text-[14px] font-semibold capitalize">
//                   {paymentMethod}
//                 </span>
//               </div>
//             </>
//           )}

//           <div className="my-4 h-px bg-[#EEEAF1]" />

//           <div className="flex items-start gap-2">
//             <MapPin
//               size={17}
//               className="mt-0.5 shrink-0 text-[#7442AD]"
//             />

//             <div>
//               <p className="text-[12px] text-[#96909A]">
//                 Destination
//               </p>

//               <p className="mt-1 text-[14px] font-medium">
//                 {
//                   ride.destination
//                     .label
//                 }
//               </p>
//             </div>
//           </div>
//         </div>

//         <button
//           type="button"
//           onClick={() =>
//             setShowSuccess(true)
//           }
//           className="mt-5 h-[54px] w-full rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white"
//         >
//           Continue
//         </button>
//       </RideBottomSheet>

//       <AnimatePresence>
//         {showSuccess && (
//           <motion.div
//             initial={{
//               opacity: 0,
//             }}
//             animate={{
//               opacity: 1,
//             }}
//             exit={{
//               opacity: 0,
//             }}
//             className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#211927]/45 px-5 backdrop-blur-[5px]"
//           >
//             <motion.div
//               initial={{
//                 opacity: 0,
//                 scale: 0.9,
//                 y: 20,
//               }}
//               animate={{
//                 opacity: 1,
//                 scale: 1,
//                 y: 0,
//               }}
//               className="w-full max-w-[390px] rounded-[26px] bg-white px-6 py-8 text-center"
//             >
//               <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E4F7EA] text-[#36A665]">
//                 <Check
//                   size={39}
//                   strokeWidth={3}
//                 />
//               </div>

//               <h2 className="mt-5 text-[23px] font-semibold text-[#302B34]">
//                 Trip Complete
//               </h2>

//               <p className="mt-2 text-[14px] leading-6 text-[#918B95]">
//                 We hope you enjoyed
//                 your Sur-Drive ride.
//               </p>

//               <motion.button
//                 type="button"
//                 whileTap={{
//                   scale: 0.98,
//                 }}
//                 onClick={
//                   continueToRating
//                 }
//                 className="mt-7 h-[54px] w-full rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white"
//               >
//                 Rate Driver
//               </motion.button>

//               <button
//                 type="button"
//                 onClick={() =>
//                   navigate(
//                     "/passenger/home",
//                     {
//                       replace: true,
//                     },
//                   )
//                 }
//                 className="mt-3 h-[48px] w-full text-[15px] font-semibold text-[#817A85]"
//               >
//                 Not Now
//               </button>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// import {
//   Check,
//   Clock3,
//   MapPin,
//   ReceiptText,
//   Route,
// } from "lucide-react";
// import {
//   AnimatePresence,
//   motion,
// } from "framer-motion";
// import { Navigate, useNavigate } from "react-router-dom";
// import { useState } from "react";

// import PassengerMap from "../../../components/passenger/ride/PassengerMap";
// import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
// import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";

// import { usePassengerRide } from "../../../context/PassengerRideContext";

// export default function TripComplete() {
//   const navigate = useNavigate();

//   const {
//     ride,
//     completeRide,
//   } = usePassengerRide();

//   const [showSuccess, setShowSuccess] =
//     useState(true);

//   if (!ride.destination) {
//     return <Navigate to="/passenger/home" replace />;
//   }

//   const center =
//     ride.destination.coordinates ?? {
//       lat: 6.5244,
//       lng: 3.3792,
//     };

//   const finalFare =
//     ride.finalFare ??
//     ride.estimatedFare ??
//     0;

//   const continueToRating = () => {
//     completeRide(finalFare);
//     setShowSuccess(false);

//     navigate("/passenger/ride/rate");
//   };

//   return (
//     <div className="relative h-[100dvh] overflow-hidden">
//       <PassengerMap
//         center={center}
//         destination={ride.destination}
//         zoom={16}
//       />

//       <RideMapHeader
//         title="Trip Complete"
//       />

//       <RideBottomSheet>
//         <div className="text-center">
//           <motion.div
//             initial={{ scale: 0 }}
//             animate={{ scale: 1 }}
//             transition={{
//               type: "spring",
//               stiffness: 220,
//               damping: 16,
//             }}
//             className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E4F7EA] text-[#36A665]"
//           >
//             <Check
//               size={31}
//               strokeWidth={3}
//             />
//           </motion.div>

//           <h1 className="mt-4 text-[24px] font-semibold">
//             You've Arrived!
//           </h1>

//           <p className="mt-1 text-[14px] text-[#918B95]">
//             {ride.destination.label}
//           </p>
//         </div>

//         <div className="grid grid-cols-2 gap-3 mt-6">
//           <div className="rounded-[15px] bg-[#F7F5F8] p-4">
//             <Clock3
//               size={18}
//               className="text-[#7442AD]"
//             />

//             <p className="mt-3 text-[12px] text-[#918B95]">
//               Duration
//             </p>

//             <p className="mt-1 text-[16px] font-semibold">
//               {ride.duration ?? "25 mins"}
//             </p>
//           </div>

//           <div className="rounded-[15px] bg-[#F7F5F8] p-4">
//             <Route
//               size={18}
//               className="text-[#7442AD]"
//             />

//             <p className="mt-3 text-[12px] text-[#918B95]">
//               Distance
//             </p>

//             <p className="mt-1 text-[16px] font-semibold">
//               {ride.distance ?? "12.3 km"}
//             </p>
//           </div>
//         </div>

//         <div className="mt-4 rounded-[16px] border border-[#EEEAF1] p-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <ReceiptText
//                 size={19}
//                 className="text-[#7442AD]"
//               />

//               <span className="text-[15px] font-medium">
//                 Final Fare
//               </span>
//             </div>

//             <span className="text-[21px] font-bold">
//               ₦{finalFare.toLocaleString()}
//             </span>
//           </div>

//           <div className="my-4 h-px bg-[#EEEAF1]" />

//           <div className="flex items-start gap-2">
//             <MapPin
//               size={17}
//               className="mt-0.5 shrink-0 text-[#7442AD]"
//             />

//             <div>
//               <p className="text-[12px] text-[#96909A]">
//                 Destination
//               </p>

//               <p className="mt-1 text-[14px] font-medium">
//                 {ride.destination.label}
//               </p>
//             </div>
//           </div>
//         </div>

//         <button
//           type="button"
//           onClick={() => setShowSuccess(true)}
//           className="mt-5 h-[54px] w-full rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white"
//         >
//           View Ride Info
//         </button>
//       </RideBottomSheet>

//       <AnimatePresence>
//         {showSuccess && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#211927]/45 px-5 backdrop-blur-[5px]"
//           >
//             <motion.div
//               initial={{
//                 opacity: 0,
//                 scale: 0.88,
//                 y: 25,
//               }}
//               animate={{
//                 opacity: 1,
//                 scale: 1,
//                 y: 0,
//               }}
//               exit={{
//                 opacity: 0,
//                 scale: 0.94,
//               }}
//               transition={{
//                 type: "spring",
//                 stiffness: 260,
//                 damping: 22,
//               }}
//               className="w-full max-w-[390px] rounded-[26px] bg-white px-6 py-8 text-center shadow-[0_30px_90px_rgba(20,12,25,0.25)]"
//             >
//               <motion.div
//                 initial={{ scale: 0 }}
//                 animate={{ scale: 1 }}
//                 transition={{
//                   delay: 0.1,
//                   type: "spring",
//                   stiffness: 250,
//                   damping: 15,
//                 }}
//                 className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E4F7EA] text-[#36A665]"
//               >
//                 <Check
//                   size={39}
//                   strokeWidth={3}
//                 />
//               </motion.div>

//               <h2 className="mt-5 text-[23px] font-semibold text-[#302B34]">
//                 Success Your Ride
//               </h2>

//               <p className="mt-2 text-[14px] text-[#918B95]">
//                 We hope you enjoyed your ride.
//               </p>

//               <motion.button
//                 type="button"
//                 whileTap={{ scale: 0.98 }}
//                 onClick={continueToRating}
//                 className="mt-7 h-[54px] w-full rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white"
//               >
//                 Rate Driver
//               </motion.button>

//               <button
//                 type="button"
//                 onClick={() => setShowSuccess(false)}
//                 className="mt-3 h-[48px] w-full text-[15px] font-semibold text-[#817A85]"
//               >
//                 Not Now
//               </button>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }