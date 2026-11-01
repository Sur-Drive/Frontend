import {
  Clock3,
  MapPin,
  Route,
  SearchX,
  Wifi,
  RefreshCw,
  LoaderCircle,
} from "lucide-react";

import { motion } from "framer-motion";

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
import CancelRideSheet from "../../../components/passenger/ride/CancelRideSheet";

import { usePassengerRide } from "../../../context/PassengerRideContext";

import {
  passengerRideApi,
  type PassengerRideResponse,
} from "../../../api/passenger/rides";

import {
  getStoredActiveRide,
  getStoredActiveRideId,
  storeActiveRide,
  clearActiveRide,
} from "../../../utils/passengerActiveRide";

import { useRideSocket } from "../../../hooks/passenger/useRideSocket";

/* =========================================================
   CONSTANTS
========================================================= */

const FALLBACK_POLL_INTERVAL = 5000;

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function validNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      response?: {
        data?: {
          message?: unknown;
        };
      };
    };

    const message =
      candidate.response?.data?.message ??
      candidate.message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(", ");
    }
  }

  return "Unable to cancel your ride. Please try again.";
}

function getNextRoute(
  status: PassengerRideResponse["status"],
): string | null {
  switch (status) {
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
      return "/passenger/ride/payment";

    case "paid":
    case "closed":
      return "/passenger/ride/receipt";

    case "cancelled":
      return "/passenger/home";

    default:
      return null;
  }
}

/* =========================================================
   COMPONENT
========================================================= */

export default function SearchingDriver() {
  const navigate = useNavigate();

  const {
    ride,
    setRideStatus,
    setEstimatedFare,
  } = usePassengerRide();

  /* =======================================================
     STATE
  ======================================================= */

  const [backendRide, setBackendRide] =
    useState<PassengerRideResponse | null>(
      () => getStoredActiveRide(),
    );

  const [cancelOpen, setCancelOpen] = useState(false);

  const [isCancelling, setIsCancelling] = useState(false);

  const [refreshError, setRefreshError] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [noDriversFound, setNoDriversFound] = useState(
    () =>
      getStoredActiveRide()?.status ===
      "no_drivers_found",
  );

  const cancellingRef = useRef(false);

  const navigatingRef = useRef(false);

  const pollingRef = useRef(false);

  const rideId =
    backendRide?.id ??
    getStoredActiveRideId();

  /*
   * IMPORTANT:
   * Replace this with the JWT from your existing
   * authentication context or token utility.
   *
   * Do not introduce a second authentication system.
   */
  const token = localStorage.getItem("passenger_access_token");

  /* =======================================================
     HANDLE BACKEND STATUS
  ======================================================= */

  const handleRideStatus = useCallback(
    (response: PassengerRideResponse) => {
      if (navigatingRef.current) {
        return;
      }

      setBackendRide(response);

      if (response.status !== "cancelled") {
        storeActiveRide(response);
      }

      if (validNumber(response.estimatedFare)) {
        setEstimatedFare(response.estimatedFare);
      }

      if (response.status === "no_drivers_found") {
        setNoDriversFound(true);
        setCancelOpen(false);
        return;
      }

      setNoDriversFound(false);

      if (
        response.status === "requested" ||
        response.status === "searching"
      ) {
        setRideStatus("searching");
        return;
      }

      const nextRoute = getNextRoute(response.status);

      if (!nextRoute) {
        return;
      }

      navigatingRef.current = true;

      setCancelOpen(false);

      switch (response.status) {
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

        case "cancelled":
          clearActiveRide();
          setRideStatus("idle");

          toast.info(
            response.cancellationReason ||
              "Your ride has been cancelled.",
          );
          break;

        default:
          break;
      }

      navigate(nextRoute, {
        replace: true,
      });
    },
    [navigate, setRideStatus, setEstimatedFare],
  );

  /* =======================================================
     WEBSOCKET CONNECTION
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
     FALLBACK POLLING

     Only runs when:
     - WebSocket is disconnected
     - Ride is still searching
     - Passenger is not cancelling
     - Navigation is not underway

     Stops automatically when WebSocket reconnects.
  ======================================================= */

  useEffect(() => {
    if (
      !rideId ||
      connected ||
      noDriversFound ||
      navigatingRef.current
    ) {
      return;
    }

    let active = true;

    const pollRide = async () => {
      if (
        !active ||
        pollingRef.current ||
        cancellingRef.current ||
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
          cancellingRef.current ||
          navigatingRef.current
        ) {
          return;
        }

        setRefreshError(false);

        handleRideStatus(response);
      } catch (error) {
        if (active) {
          console.error(
            "FALLBACK RIDE POLLING ERROR:",
            error,
          );

          setRefreshError(true);
        }
      } finally {
        pollingRef.current = false;
      }
    };

    // Load immediately if WebSocket is unavailable.
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
    noDriversFound,
    handleRideStatus,
  ]);

  /* =======================================================
     MANUAL REFRESH
  ======================================================= */

  const refreshRide = async () => {
    if (
      !rideId ||
      isRefreshing ||
      cancellingRef.current ||
      navigatingRef.current
    ) {
      return;
    }

    setIsRefreshing(true);

    try {
      const response =
        await passengerRideApi.getRide(rideId);

      setRefreshError(false);

      handleRideStatus(response);
    } catch (error) {
      console.error(
        "MANUAL RIDE REFRESH ERROR:",
        error,
      );

      setRefreshError(true);

      toast.error(
        "Unable to refresh your ride status.",
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  /* =======================================================
     CANCEL RIDE
  ======================================================= */

  const requestCancel = () => {
    if (
      isCancelling ||
      noDriversFound ||
      navigatingRef.current
    ) {
      return;
    }

    setCancelOpen(true);
  };

  const confirmCancel = async (
    reason: string,
    _comment?: string,
  ) => {
    if (
      !rideId ||
      cancellingRef.current ||
      noDriversFound
    ) {
      return;
    }

    cancellingRef.current = true;

    setIsCancelling(true);

    try {
      const latest =
        await passengerRideApi.getRide(rideId);

      if (
        latest.status !== "requested" &&
        latest.status !== "searching"
      ) {
        setCancelOpen(false);

        handleRideStatus(latest);

        toast.info(
          latest.status === "no_drivers_found"
            ? "No drivers are currently available."
            : "Your ride status has changed.",
        );

        return;
      }

      const response =
        await passengerRideApi.cancelRide(
          rideId,
          reason,
        );

      if (response.status !== "cancelled") {
        setCancelOpen(false);

        handleRideStatus(response);

        toast.info(
          "Your ride status changed before cancellation.",
        );

        return;
      }

      navigatingRef.current = true;

      clearActiveRide();

      setCancelOpen(false);

      setRideStatus("idle");

      toast.success(
        response.cancellationFee > 0
          ? `Ride cancelled. Fee: ${formatMoney(
              response.cancellationFee,
            )}`
          : "Ride cancelled successfully.",
      );

      navigate("/passenger/home", {
        replace: true,
      });
    } catch (error) {
      console.error("CANCEL RIDE ERROR:", error);

      try {
        const latest =
          await passengerRideApi.getRide(rideId);

        if (
          latest.status !== "requested" &&
          latest.status !== "searching"
        ) {
          setCancelOpen(false);

          handleRideStatus(latest);
          return;
        }
      } catch (refreshError) {
        console.error(
          "CANCELLATION RECHECK ERROR:",
          refreshError,
        );
      }

      toast.error(getErrorMessage(error));
    } finally {
      cancellingRef.current = false;
      setIsCancelling(false);
    }
  };

  /* =======================================================
     NO DRIVERS FOUND ACTIONS
  ======================================================= */

  const goHome = () => {
    if (!noDriversFound) return;

    navigatingRef.current = true;

    clearActiveRide();

    setRideStatus("idle");

    navigate("/passenger/home", {
      replace: true,
    });
  };

  const tryAnotherRide = () => {
    if (!noDriversFound) return;

    navigatingRef.current = true;

    clearActiveRide();

    setRideStatus("selecting");

    navigate("/passenger/ride/select", {
      replace: true,
    });
  };

  /* =======================================================
     RESTORE LOCATIONS AFTER REFRESH
  ======================================================= */

  const storedPickup = backendRide?.pickup;

  const storedDestination = backendRide?.dropoff;

  const pickup =
    ride.pickup ??
    (storedPickup
      ? {
          label: storedPickup.address,
          address: storedPickup.address,
          coordinates: {
            lat: storedPickup.lat,
            lng: storedPickup.lng,
          },
        }
      : null);

  const destination =
    ride.destination ??
    (storedDestination
      ? {
          label: storedDestination.address,
          address: storedDestination.address,
          coordinates: {
            lat: storedDestination.lat,
            lng: storedDestination.lng,
          },
        }
      : null);

  /* =======================================================
     ROUTE GUARDS
  ======================================================= */

  if (!rideId) {
    return (
      <Navigate
        to="/passenger/book-ride"
        replace
      />
    );
  }

  if (!pickup || !destination) {
    return (
      <Navigate
        to="/passenger/book-ride"
        replace
      />
    );
  }

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
     DISPLAY DATA
  ======================================================= */

  const estimatedFare =
    backendRide?.estimatedFare;

  const estimatedDuration =
    backendRide?.estimatedDurationMin;

  const estimatedDistance =
    backendRide?.estimatedDistanceKm;

  const pickupAddress =
    backendRide?.pickup?.address ||
    pickup.address ||
    pickup.label;

  const isUsingFallback = !connected;

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
        zoom={15}
        interactive
      />

      <RideMapHeader
        title={
          noDriversFound
            ? "No drivers available"
            : "Finding a driver"
        }
        onBack={
          noDriversFound
            ? goHome
            : requestCancel
        }
      />

      {/* ===============================================
          SEARCH RADAR
      =============================================== */}

      {!noDriversFound && (
        <div className="pointer-events-none absolute left-1/2 top-[35%] z-[300] -translate-x-1/2 -translate-y-1/2">
          {[0, 0.65, 1.3].map((delay) => (
            <motion.div
              key={delay}
              initial={{
                scale: 0.6,
                opacity: 0.5,
              }}
              animate={{
                scale: 4.8,
                opacity: 0,
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay,
                ease: "easeOut",
              }}
              className="absolute left-1/2 top-1/2 h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#7442AD] bg-[#7442AD]/10"
            />
          ))}

          <motion.div
            animate={{
              scale: [1, 1.18, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute left-1/2 top-1/2 h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7442AD]/10"
          />

          <motion.div
            animate={{
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
            }}
            className="relative flex h-[62px] w-[62px] items-center justify-center rounded-full border-[5px] border-white bg-[#7442AD] shadow-[0_10px_35px_rgba(116,66,173,0.35)]"
          >
            <div className="h-[13px] w-[13px] rounded-full bg-white" />
          </motion.div>
        </div>
      )}

      {/* ===============================================
          BOTTOM SHEET
      =============================================== */}

      <RideBottomSheet>
        {noDriversFound ? (
          /* =============================================
             NO DRIVERS FOUND
          ============================================= */

          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F3EDF8] text-[#7442AD]">
              <SearchX size={30} />
            </div>

            <h1 className="mt-5 text-[22px] font-semibold text-[#302B34]">
              No drivers available
            </h1>

            <p className="mt-2 text-[14px] leading-6 text-[#938D97]">
              We couldn't find an available driver nearby.
              You can try another ride or return home.
            </p>

            <div className="mt-6 rounded-[17px] bg-[#F8F6F9] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#8F8994]">
                  Estimated fare
                </span>

                <span className="text-[18px] font-semibold text-[#302B34]">
                  {validNumber(estimatedFare)
                    ? formatMoney(estimatedFare)
                    : "—"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={tryAnotherRide}
              className="mt-6 h-[54px] w-full rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white"
            >
              Try another ride
            </button>

            <button
              type="button"
              onClick={goHome}
              className="mt-3 h-[54px] w-full rounded-[14px] border border-[#E1D9E7] bg-white text-[16px] font-semibold text-[#7442AD]"
            >
              Back to home
            </button>
          </div>
        ) : (
          <>
            {/* =========================================
                SEARCHING STATE
            ========================================= */}

            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1.25,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="mx-auto h-[46px] w-[46px] rounded-full border-[4px] border-[#EEE5F5] border-t-[#7442AD]"
              />

              <h1 className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-[#302B34]">
                Finding your driver...
              </h1>

              <p className="mx-auto mt-2 max-w-[350px] text-[14px] leading-6 text-[#938D97]">
                We're connecting you with an available
                SurDrive driver nearby.
              </p>
            </div>

            {/* =========================================
                ANIMATED PROGRESS
            ========================================= */}

            <div className="mt-6">
              <div className="h-[5px] overflow-hidden rounded-full bg-[#EEE8F2]">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "350%" }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="h-full w-[30%] rounded-full bg-[#7442AD]"
                />
              </div>
            </div>

            {/* =========================================
                RIDE SUMMARY
            ========================================= */}

            <div className="mt-6 rounded-[17px] bg-[#F8F6F9] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#8F8994]">
                  Estimated fare
                </span>

                <span className="text-[17px] font-semibold text-[#302B34]">
                  {validNumber(estimatedFare)
                    ? formatMoney(estimatedFare)
                    : "—"}
                </span>
              </div>

              {(validNumber(estimatedDuration) ||
                validNumber(estimatedDistance)) && (
                <>
                  <div className="my-4 h-px bg-[#EDE8EF]" />

                  <div className="flex items-center gap-5">
                    {validNumber(estimatedDuration) && (
                      <div className="flex items-center gap-2 text-[#625C66]">
                        <Clock3 size={16} />

                        <span className="text-[13px]">
                          {Math.round(estimatedDuration)} min trip
                        </span>
                      </div>
                    )}

                    {validNumber(estimatedDistance) && (
                      <div className="flex items-center gap-2 text-[#625C66]">
                        <Route size={16} />

                        <span className="text-[13px]">
                          {estimatedDistance.toFixed(1)} km
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="my-4 h-px bg-[#EDE8EF]" />

              <div className="flex items-start gap-2">
                <MapPin
                  size={16}
                  className="mt-[2px] shrink-0 text-[#7442AD]"
                />

                <div className="min-w-0 text-left">
                  <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#AAA3AD]">
                    Pickup location
                  </p>

                  <p className="mt-1 truncate text-[14px] font-medium text-[#4E4852]">
                    {pickupAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* =========================================
                LIVE CONNECTION STATUS
            ========================================= */}

            <div className="flex items-center justify-center gap-2 mt-4">
              <Wifi
                size={14}
                className={
                  connected
                    ? "text-[#5B9B72]"
                    : refreshError
                      ? "text-[#D05B5B]"
                      : "text-[#D6A044]"
                }
              />

              <p
                className={`text-[12px] ${
                  connected
                    ? "text-[#5B9B72]"
                    : refreshError
                      ? "text-[#D05B5B]"
                      : "text-[#A18448]"
                }`}
              >
                {isCancelling
                  ? "Cancelling ride..."
                  : connected
                    ? "Connected to live ride updates"
                    : refreshError
                      ? "Unable to refresh ride status"
                      : socketError
                        ? "Using automatic backup connection"
                        : "Connecting to live updates..."}
              </p>
            </div>

            {/* =========================================
                MANUAL REFRESH
            ========================================= */}

            {isUsingFallback && (
              <button
                type="button"
                onClick={refreshRide}
                disabled={isRefreshing}
                className="mx-auto mt-3 flex items-center gap-2 text-[12px] font-semibold text-[#7442AD] disabled:opacity-50"
              >
                {isRefreshing ? (
                  <LoaderCircle
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <RefreshCw size={14} />
                )}

                Refresh ride status
              </button>
            )}

            {/* =========================================
                CANCEL BUTTON
            ========================================= */}

            <motion.button
              type="button"
              disabled={isCancelling}
              whileTap={
                !isCancelling
                  ? { scale: 0.98 }
                  : undefined
              }
              onClick={requestCancel}
              className="mt-5 h-[54px] w-full rounded-[14px] bg-[#F45B42] text-[16px] font-semibold text-white shadow-[0_6px_18px_rgba(244,91,66,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCancelling
                ? "Cancelling..."
                : "Cancel Ride"}
            </motion.button>
          </>
        )}
      </RideBottomSheet>

      {/* ===============================================
          CANCEL MODAL
      =============================================== */}

      <CancelRideSheet
        open={cancelOpen && !noDriversFound}
        onClose={() => {
          if (!isCancelling) {
            setCancelOpen(false);
          }
        }}
        onConfirm={confirmCancel}
      />
    </div>
  );
}

// import {
//   Clock3,
//   MapPin,
//   Route,
//   SearchX,
//   Wifi,
// } from "lucide-react";

// import {
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

// import {
//   toast,
// } from "sonner";

// import PassengerMap from "../../../components/passenger/ride/PassengerMap";
// import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
// import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";
// import CancelRideSheet from "../../../components/passenger/ride/CancelRideSheet";

// import {
//   usePassengerRide,
// } from "../../../context/PassengerRideContext";

// import {
//   passengerRideApi,
// } from "../../../api/passenger/rides";

// import type {
//   PassengerRideResponse,
// } from "../../../api/passenger/rides";

// /* =========================================================
//    STORAGE
// ========================================================= */

// const ACTIVE_RIDE_KEY =
//   "surdrive_active_ride";

// const ACTIVE_RIDE_ID_KEY =
//   "surdrive_active_ride_id";

// /* =========================================================
//    HELPERS
// ========================================================= */

// function getStoredRide():
//   PassengerRideResponse | null {
//   try {
//     const raw =
//       sessionStorage.getItem(
//         ACTIVE_RIDE_KEY,
//       );

//     if (!raw) {
//       return null;
//     }

//     return JSON.parse(
//       raw,
//     ) as PassengerRideResponse;
//   } catch {
//     return null;
//   }
// }

// function saveActiveRide(
//   ride: PassengerRideResponse,
// ) {
//   sessionStorage.setItem(
//     ACTIVE_RIDE_KEY,
//     JSON.stringify(ride),
//   );

//   sessionStorage.setItem(
//     ACTIVE_RIDE_ID_KEY,
//     ride.id,
//   );
// }

// function clearActiveRide() {
//   sessionStorage.removeItem(
//     ACTIVE_RIDE_KEY,
//   );

//   sessionStorage.removeItem(
//     ACTIVE_RIDE_ID_KEY,
//   );
// }

// function formatMoney(
//   amount: number,
// ) {
//   return amount.toLocaleString(
//     "en-NG",
//     {
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 2,
//     },
//   );
// }

// function getErrorMessage(
//   error: unknown,
// ) {
//   if (
//     error &&
//     typeof error === "object"
//   ) {
//     const candidate =
//       error as {
//         message?: unknown;

//         response?: {
//           data?: {
//             message?: unknown;
//           };
//         };

//         data?: {
//           message?: unknown;
//         };
//       };

//     const backendMessage =
//       candidate.response?.data
//         ?.message ??
//       candidate.data?.message ??
//       candidate.message;

//     if (
//       typeof backendMessage ===
//       "string"
//     ) {
//       return backendMessage;
//     }

//     if (
//       Array.isArray(
//         backendMessage,
//       )
//     ) {
//       return backendMessage.join(
//         ", ",
//       );
//     }
//   }

//   return "Unable to cancel your ride. Please try again.";
// }

// /* =========================================================
//    PAGE
// ========================================================= */

// export default function SearchingDriver() {
//   const navigate =
//     useNavigate();

//   const {
//     ride,
//     setRideStatus,
//     setEstimatedFare,
//   } =
//     usePassengerRide();

//   /* =======================================================
//      STATE
//   ======================================================= */

//   const [
//     cancelOpen,
//     setCancelOpen,
//   ] = useState(false);

//   const [
//     isCancelling,
//     setIsCancelling,
//   ] = useState(false);

//   const [
//     backendRide,
//     setBackendRide,
//   ] =
//     useState<PassengerRideResponse | null>(
//       () => getStoredRide(),
//     );

//   const [
//     pollError,
//     setPollError,
//   ] = useState(false);

//   const [
//     stopPolling,
//     setStopPolling,
//   ] = useState(false);

//   const [noDriversFound, setNoDriversFound] = useState(
//   () => getStoredRide()?.status === "no_drivers_found"
// );


//   /* =======================================================
//      ACTIVE RIDE ID
//   ======================================================= */

//   const rideId =
//     backendRide?.id ??
//     sessionStorage.getItem(
//       ACTIVE_RIDE_ID_KEY,
//     );

//   /* =======================================================
//      POLL REAL RIDE STATUS
//   ======================================================= */

//     useEffect(() => {
//   if (!rideId || stopPolling || noDriversFound) {
//     return;
//   }

//     let mounted = true;

//     let running = false;

//     const checkRide =
//       async () => {
//         if (running) {
//           return;
//         }

//         running = true;

//         try {
//           const response =
//             await passengerRideApi.getRide(
//               rideId,
//             );

//           if (!mounted) {
//             return;
//           }

//           console.log(
//             "ACTIVE RIDE:",
//             response,
//           );

//           setPollError(false);

//           setBackendRide(
//             response,
//           );

//           saveActiveRide(
//             response,
//           );

//           if (response.status === "no_drivers_found") {
//   setNoDriversFound(true);
//   setStopPolling(true);
//   setCancelOpen(false);
//   return;
// }

//           if (
//             typeof response.estimatedFare ===
//             "number"
//           ) {
//             setEstimatedFare(
//               response.estimatedFare,
//             );
//           }

//           /* ===============================================
//              STILL SEARCHING
//           =============================================== */

//           if (
//             response.status ===
//               "requested" ||
//             response.status ===
//               "searching"
//           ) {
//             return;
//           }

//           /* ===============================================
//              DRIVER ASSIGNED
//           =============================================== */

//           if (
//             response.status ===
//             "driver_assigned"
//           ) {
//             setStopPolling(true);

//             setRideStatus(
//               "driver-assigned",
//             );

//             navigate(
//               "/passenger/ride/driver-assigned",
//               {
//                 replace: true,
//               },
//             );

//             return;
//           }

//           /* ===============================================
//              DRIVER EN ROUTE
//           =============================================== */

//           if (
//             response.status ===
//             "driver_en_route"
//           ) {
//             setStopPolling(true);

//             setRideStatus(
//               "driver-en-route",
//             );

//             navigate(
//               "/passenger/ride/driver-en-route",
//               {
//                 replace: true,
//               },
//             );

//             return;
//           }

//           /* ===============================================
//              DRIVER ARRIVED
//           =============================================== */

//           if (
//             response.status ===
//             "driver_arrived"
//           ) {
//             setStopPolling(true);

//             setRideStatus(
//               "driver-arrived",
//             );

//             navigate(
//               "/passenger/ride/driver-arrived",
//               {
//                 replace: true,
//               },
//             );

//             return;
//           }

//           /* ===============================================
//              RIDE STARTED / IN PROGRESS

//              Use a status that actually exists in your
//              frontend RideStatus union.

//              Earlier "in-trip" caused your TypeScript error,
//              so we do NOT introduce it here.
//           =============================================== */

//           if (
//             response.status ===
//               "ride_started" ||
//             response.status ===
//               "ride_in_progress"
//           ) {
//             setStopPolling(true);

//             /*
//              * Navigate to your trip page.
//              *
//              * Do not call:
//              *
//              * setRideStatus("in-trip")
//              *
//              * because "in-trip" is not currently part of
//              * your RideStatus type.
//              */

//             navigate(
//               "/passenger/ride/in-trip",
//               {
//                 replace: true,
//               },
//             );

//             return;
//           }

//           /* ===============================================
//              RIDE COMPLETED
//           =============================================== */

//           if (
//             response.status ===
//               "ride_completed" ||
//             response.status ===
//               "payment_pending" ||
//             response.status ===
//               "paid" ||
//             response.status ===
//               "closed"
//           ) {
//             setStopPolling(true);

//             navigate(
//               "/passenger/ride/complete",
//               {
//                 replace: true,
//               },
//             );

//             return;
//           }

//           /* ===============================================
//              CANCELLED
//           =============================================== */

//           if (
//             response.status ===
//             "cancelled"
//           ) {
//             setStopPolling(true);

//             clearActiveRide();

//             setRideStatus(
//               "idle",
//             );

//             toast.info(
//               response.cancellationReason ||
//                 "This ride has been cancelled.",
//             );

//             navigate(
//               "/passenger/home",
//               {
//                 replace: true,
//               },
//             );
//           }
//         } catch (error) {
//           console.error(
//             "GET RIDE ERROR:",
//             error,
//           );

//           if (mounted) {
//             setPollError(
//               true,
//             );
//           }
//         } finally {
//           running = false;
//         }
//       };

//     /*
//      * Check immediately instead of
//      * waiting five seconds.
//      */
//     void checkRide();

//     const interval =
//       window.setInterval(
//         () => {
//           void checkRide();
//         },
//         5000,
//       );

//     return () => {
//       mounted = false;

//       window.clearInterval(
//         interval,
//       );
//     };
//   }, [
//     rideId,
//     stopPolling,
//     navigate,
//     setRideStatus,
//     setEstimatedFare,
//   ]);

//   /* =======================================================
//      CANCEL
//   ======================================================= */

//  const requestCancel = () => {
//   if (noDriversFound) {
//     goHome();
//     return;
//   }

//   if (isCancelling) return;

//   setCancelOpen(true);
// };


// const confirmCancel = async (
//   reason: string,
//   comment?: string,
// ) => {
//   if (!rideId || isCancelling || noDriversFound) {
//     return;
//   }

//   setIsCancelling(true);
//   setStopPolling(true);

//   const handleNoDriversFound = (
//     latestRide: PassengerRideResponse,
//   ) => {
//     if (latestRide.status !== "no_drivers_found") {
//       return false;
//     }

//     setBackendRide(latestRide);
//     saveActiveRide(latestRide);

//     if (typeof latestRide.estimatedFare === "number") {
//       setEstimatedFare(latestRide.estimatedFare);
//     }

//     setNoDriversFound(true);
//     setStopPolling(true);
//     setCancelOpen(false);

//     return true;
//   };

//   try {
//     // Check the current backend status before cancellation.
//     const latestRide = await passengerRideApi.getRide(rideId);

//     if (handleNoDriversFound(latestRide)) {
//       return;
//     }

//     // Do not attempt cancellation if the ride has
//     // already moved out of the searching stage.
//     if (
//       latestRide.status !== "requested" &&
//       latestRide.status !== "searching"
//     ) {
//       setBackendRide(latestRide);
//       saveActiveRide(latestRide);
//       setCancelOpen(false);
//       setStopPolling(false);

//       toast.info(
//         "Your ride status has changed. Updating ride details...",
//       );

//       return;
//     }

//     console.log("CANCELLING RIDE:", {
//       rideId,
//       reason,
//       comment,
//     });

//     const response = await passengerRideApi.cancelRide(
//       rideId,
//       reason,
//     );

//     if (handleNoDriversFound(response)) {
//       return;
//     }

//     if (response.status !== "cancelled") {
//       throw new Error(
//         `Cancellation was not confirmed. Current ride status: ${response.status}`,
//       );
//     }

//     setBackendRide(response);
//     setCancelOpen(false);
//     clearActiveRide();
//     setRideStatus("idle");

//     toast.success(
//       response.cancellationFee > 0
//         ? `Ride cancelled. Cancellation fee: ₦${formatMoney(
//             response.cancellationFee,
//           )}`
//         : "Ride cancelled successfully.",
//     );

//     navigate("/passenger/home", {
//       replace: true,
//     });
//   } catch (error) {
//     console.error("CANCEL RIDE ERROR:", error);

//     // The backend might have changed the ride to
//     // no_drivers_found during the cancellation request.
//     try {
//       const latestRide = await passengerRideApi.getRide(rideId);

//       if (handleNoDriversFound(latestRide)) {
//         return;
//       }

//       // Let the normal polling logic process any
//       // other updated status.
//       setBackendRide(latestRide);
//       saveActiveRide(latestRide);
//     } catch (refreshError) {
//       console.error(
//         "RIDE STATUS REFRESH ERROR:",
//         refreshError,
//       );
//     }

//     setStopPolling(false);

//     toast.error(getErrorMessage(error));
//   } finally {
//     setIsCancelling(false);
//   }
// };


//     const goHome = () => {
//   clearActiveRide();
//   setRideStatus("idle");

//   navigate("/passenger/home", {
//     replace: true,
//   });
// };

// const tryAnotherRide = () => {
//   clearActiveRide();
//   setRideStatus("selecting");

//   navigate("/passenger/ride/select", {
//     replace: true,
//   });
// };

//   /* =======================================================
//      GUARDS
//   ======================================================= */

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

//   if (!rideId) {
//     return (
//       <Navigate
//         to="/passenger/book-ride"
//         replace
//       />
//     );
//   }

//   const center =
//     ride.pickup.coordinates ??
//     ride.destination.coordinates;

//   /*
//    * Important:
//    * no fake Lagos fallback.
//    *
//    * If neither ride location has coordinates, return to
//    * booking rather than pretending the user is somewhere
//    * else.
//    */
//   if (!center) {
//     return (
//       <Navigate
//         to="/passenger/book-ride"
//         replace
//       />
//     );
//   }

//   /* =======================================================
//      DISPLAY DATA
//   ======================================================= */

//   const estimatedFare =
//     backendRide?.estimatedFare;

//   const estimatedDuration =
//     backendRide?.estimatedDurationMin;

//   const estimatedDistance =
//     backendRide?.estimatedDistanceKm;

//   const pickupAddress =
//     backendRide?.pickup
//       ?.address ||
//     ride.pickup.address ||
//     ride.pickup.label;

//   /* =======================================================
//      UI
//   ======================================================= */

//   return (
//     <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
//       {/* ===============================================
//           MAP
//       =============================================== */}

//       <PassengerMap
//         center={center}
//         pickup={ride.pickup}
//         destination={
//           ride.destination
//         }
//         zoom={15}
//         interactive
//       />

//       {/* ===============================================
//           HEADER
//       =============================================== */}

//       <RideMapHeader
//   title={noDriversFound ? "No drivers available" : "Finding a driver"}
//   onBack={noDriversFound ? goHome : requestCancel}
// />

//       {/* ===============================================
//           RADAR
//       =============================================== */}
// {!noDriversFound && (
//       <div className="pointer-events-none absolute left-1/2 top-[35%] z-[300] -translate-x-1/2 -translate-y-1/2">
//         {[0, 0.65, 1.3].map(
//           (delay) => (
//             <motion.div
//               key={delay}
//               initial={{
//                 scale: 0.6,
//                 opacity: 0.5,
//               }}
//               animate={{
//                 scale: 4.8,
//                 opacity: 0,
//               }}
//               transition={{
//                 duration: 2.2,
//                 repeat:
//                   Infinity,
//                 delay,
//                 ease:
//                   "easeOut",
//               }}
//               className="absolute left-1/2 top-1/2 h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#7442AD] bg-[#7442AD]/10"
//             />
//           ),
//         )}

//         <motion.div
//           animate={{
//             scale: [
//               1,
//               1.18,
//               1,
//             ],
//           }}
//           transition={{
//             duration: 1.5,
//             repeat:
//               Infinity,
//             ease:
//               "easeInOut",
//           }}
//           className="absolute left-1/2 top-1/2 h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7442AD]/10"
//         />

//         <motion.div
//           animate={{
//             scale: [
//               1,
//               1.08,
//               1,
//             ],
//           }}
//           transition={{
//             duration: 1.4,
//             repeat:
//               Infinity,
//           }}
//           className="relative flex h-[62px] w-[62px] items-center justify-center rounded-full border-[5px] border-white bg-[#7442AD] shadow-[0_10px_35px_rgba(116,66,173,0.35)]"
//         >
//           <div className="h-[13px] w-[13px] rounded-full bg-white" />
//         </motion.div>
//       </div>
// )}

//       {/* ===============================================
//           BOTTOM SHEET
//       =============================================== */}

//       <RideBottomSheet>
//          {noDriversFound ? (
//     <div className="text-center">
//       <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F3EDF8] text-[#7442AD]">
//         <SearchX size={30} />
//       </div>

//       <h1 className="mt-5 text-[22px] font-semibold text-[#302B34]">
//         No drivers available
//       </h1>

//       <p className="mt-2 text-[14px] leading-6 text-[#938D97]">
//         We couldn't find an available driver nearby.
//         Please try another ride or come back later.
//       </p>

//       <div className="mt-6 rounded-[17px] bg-[#F8F6F9] p-4">
//         <div className="flex items-center justify-between">
//           <span className="text-[14px] text-[#8F8994]">
//             Estimated fare
//           </span>

//           <span className="text-[18px] font-semibold text-[#302B34]">
//             {typeof estimatedFare === "number"
//               ? `₦${formatMoney(estimatedFare)}`
//               : "—"}
//           </span>
//         </div>
//       </div>

//       <button
//         type="button"
//         onClick={tryAnotherRide}
//         className="mt-6 h-[54px] w-full rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white"
//       >
//         Try another ride
//       </button>

//       <button
//         type="button"
//         onClick={goHome}
//         className="mt-3 h-[54px] w-full rounded-[14px] border border-[#E1D9E7] bg-white text-[16px] font-semibold text-[#7442AD]"
//       >
//         Back to home
//       </button>
//     </div>
//   ) : (
//     <>
//         <div className="text-center">
//           <motion.div
//             animate={{
//               rotate: 360,
//             }}
//             transition={{
//               duration: 1.25,
//               repeat:
//                 Infinity,
//               ease:
//                 "linear",
//             }}
//             className="mx-auto h-[46px] w-[46px] rounded-full border-[4px] border-[#EEE5F5] border-t-[#7442AD]"
//           />

//           <h1 className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-[#302B34]">
//             Finding your
//             driver...
//           </h1>

//           <p className="mx-auto mt-2 max-w-[350px] text-[14px] leading-6 text-[#938D97]">
//             We're connecting
//             you with an
//             available Sur-Drive
//             driver nearby.
//           </p>
//         </div>

//         {/* =============================================
//             PROGRESS
//         ============================================= */}

//         <div className="mt-6">
//           <div className="h-[5px] overflow-hidden rounded-full bg-[#EEE8F2]">
//             <motion.div
//               initial={{
//                 x: "-100%",
//               }}
//               animate={{
//                 x: "350%",
//               }}
//               transition={{
//                 duration: 1.5,
//                 repeat:
//                   Infinity,
//                 ease:
//                   "easeInOut",
//               }}
//               className="h-full w-[30%] rounded-full bg-[#7442AD]"
//             />
//           </div>
//         </div>

//         {/* =============================================
//             RIDE SUMMARY
//         ============================================= */}

//         <div className="mt-6 rounded-[17px] bg-[#F8F6F9] p-4">
//           <div className="flex items-center justify-between">
//             <span className="text-[14px] text-[#8F8994]">
//               Estimated fare
//             </span>

//             <span className="text-[17px] font-semibold text-[#302B34]">
//               {typeof estimatedFare ===
//               "number"
//                 ? `₦${formatMoney(
//                     estimatedFare,
//                   )}`
//                 : "—"}
//             </span>
//           </div>

//           {(typeof estimatedDuration ===
//             "number" ||
//             typeof estimatedDistance ===
//               "number") && (
//             <>
//               <div className="my-4 h-px bg-[#EDE8EF]" />

//               <div className="flex items-center gap-5">
//                 {typeof estimatedDuration ===
//                   "number" && (
//                   <div className="flex items-center gap-2 text-[#625C66]">
//                     <Clock3
//                       size={
//                         16
//                       }
//                     />

//                     <span className="text-[13px]">
//                       {
//                         estimatedDuration
//                       }{" "}
//                       min
//                     </span>
//                   </div>
//                 )}

//                 {typeof estimatedDistance ===
//                   "number" && (
//                   <div className="flex items-center gap-2 text-[#625C66]">
//                     <Route
//                       size={
//                         16
//                       }
//                     />

//                     <span className="text-[13px]">
//                       {estimatedDistance.toFixed(
//                         1,
//                       )}{" "}
//                       km
//                     </span>
//                   </div>
//                 )}
//               </div>
//             </>
//           )}

//           <div className="my-4 h-px bg-[#EDE8EF]" />

//           <div className="flex items-start gap-2">
//             <MapPin
//               size={16}
//               className="mt-[2px] shrink-0 text-[#7442AD]"
//             />

//             <div className="min-w-0 text-left">
//               <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#AAA3AD]">
//                 Pickup
//               </p>

//               <p className="mt-1 truncate text-[14px] font-medium text-[#4E4852]">
//                 {
//                   pickupAddress
//                 }
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* =============================================
//             LIVE STATUS
//         ============================================= */}

//         <div className="flex items-center justify-center gap-2 mt-3">
//           <Wifi
//             size={14}
//             className={
//               pollError
//                 ? "text-[#D05B5B]"
//                 : "text-[#5B9B72]"
//             }
//           />

//           <p
//             className={`text-[12px] ${
//               pollError
//                 ? "text-[#D05B5B]"
//                 : "text-[#AAA3AD]"
//             }`}
//           >
//             {pollError
//               ? "Reconnecting to ride status..."
//               : isCancelling
//                 ? "Cancelling ride..."
//                 : "Live ride status"}
//           </p>
//         </div>

//         {/* =============================================
//             CANCEL BUTTON
//         ============================================= */}

//         <motion.button
//           type="button"
//           disabled={
//             isCancelling
//           }
//           whileTap={
//             !isCancelling
//               ? {
//                   scale: 0.98,
//                 }
//               : undefined
//           }
//           onClick={
//             requestCancel
//           }
//           className="mt-5 h-[54px] w-full rounded-[14px] border border-[#E1D9E7] bg-white text-[16px] font-semibold text-[#7442AD] disabled:cursor-not-allowed disabled:opacity-50"
//         >
//           {isCancelling
//             ? "Cancelling..."
//             : "Cancel Ride"}
//         </motion.button>
//         </>
//   )}
//       </RideBottomSheet>

//       {/* ===============================================
//           CANCEL SHEET
//       =============================================== */}

//       <CancelRideSheet
//         open={
//           cancelOpen && !noDriversFound
//         }
//         onClose={() => {
//           if (
//             !isCancelling
//           ) {
//             setCancelOpen(
//               false,
//             );
//           }
//         }}
//         onConfirm={
//           confirmCancel
//         }
//       />
//     </div>
//   );
// }


