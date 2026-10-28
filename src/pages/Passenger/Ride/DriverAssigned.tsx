"use client";

import {
  Clock3,
  LoaderCircle,
  MessageCircle,
  Phone,
  Share2,
  UserRound,
  CarFront,
  Wifi,
  WifiOff,
  RefreshCw,
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
import DriverCard from "../../../components/passenger/ride/DriverCard";
import ShareRideSheet from "../../../components/passenger/ride/ShareRideSheet";
import CancelRideSheet from "../../../components/passenger/ride/CancelRideSheet";

import { usePassengerRide } from "../../../context/PassengerRideContext";

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

import type { RideDriver } from "../../../types/passengerRide";

import { useRideSocket } from "../../../hooks/passenger/useRideSocket";

/* =========================================================
   CONSTANTS
========================================================= */

const FALLBACK_POLL_INTERVAL = 5000;

const PASSENGER_TOKEN_KEY = "passenger_access_token";

/* =========================================================
   HELPERS
========================================================= */

function getPassengerToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(PASSENGER_TOKEN_KEY);
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getErrorMessage(error: unknown): string {
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

  return "Unable to complete this action. Please try again.";
}

/* =========================================================
   COMPONENT
========================================================= */

export default function DriverAssigned() {
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

  const [shareOpen, setShareOpen] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);

  const [isCancelling, setIsCancelling] = useState(false);

  const [loading, setLoading] = useState(false);

  const [refreshError, setRefreshError] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [token, setToken] = useState<string | null>(
    getPassengerToken,
  );

  /* =======================================================
     REFS
  ======================================================= */

  const cancellingRef = useRef(false);

  const navigatingRef = useRef(false);

  const pollingRef = useRef(false);

  const mountedRef = useRef(true);

  /* =======================================================
     RIDE ID
  ======================================================= */

  const rideId =
    backendRide?.id ??
    getStoredActiveRideId();

  /* =======================================================
     TOKEN SYNC

     Uses the existing passenger access token.

     If another tab updates the token, this component
     picks up the new value.
  ======================================================= */

  useEffect(() => {
    mountedRef.current = true;

    const syncToken = () => {
      setToken(getPassengerToken());
    };

    syncToken();

    window.addEventListener("storage", syncToken);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("storage", syncToken);
    };
  }, []);

  /* =======================================================
     HANDLE BACKEND RIDE STATUS

     The backend remains the source of truth.

     Called by:
     - WebSocket updates
     - Fallback polling
     - Manual refresh
     - Cancellation status checks
  ======================================================= */

  const handleRideStatus = useCallback(
    (response: PassengerRideResponse) => {
      if (navigatingRef.current) {
        return;
      }

      if (!response?.id) {
        return;
      }

      /*
       * Update the local ride information.
       */
      setBackendRide(response);

      /*
       * Keep the active ride available after
       * a page refresh or navigation.
       */
      if (response.status !== "cancelled") {
        storeActiveRide(response);
      }

      /*
       * Navigate according to backend status.
       */
      switch (response.status) {
        case "requested":
        case "searching":
          navigatingRef.current = true;

          setRideStatus("searching");

          navigate("/passenger/ride/searching", {
            replace: true,
          });
          return;

        case "driver_assigned":
          setRideStatus("driver-assigned");
          return;

        case "driver_en_route":
          navigatingRef.current = true;

          setRideStatus("driver-en-route");

          navigate("/passenger/ride/driver-en-route", {
            replace: true,
          });
          return;

        case "driver_arrived":
          navigatingRef.current = true;

          setRideStatus("driver-arrived");

          navigate("/passenger/ride/driver-arrived", {
            replace: true,
          });
          return;

        case "ride_started":
        case "ride_in_progress":
          navigatingRef.current = true;

          navigate("/passenger/ride/in-trip", {
            replace: true,
          });
          return;

        case "ride_completed":
        case "payment_pending":
        case "paid":
        case "closed":
          navigatingRef.current = true;

          navigate("/passenger/ride/complete", {
            replace: true,
          });
          return;

        case "cancelled":
          navigatingRef.current = true;

          clearActiveRide();

          setRideStatus("idle");

          setCancelOpen(false);

          toast.info(
            response.cancellationReason ||
              "Your ride has been cancelled.",
          );

          navigate("/passenger/home", {
            replace: true,
          });
          return;

        case "no_drivers_found":
          navigatingRef.current = true;

          setRideStatus("searching");

          navigate("/passenger/ride/searching", {
            replace: true,
          });
          return;

        default:
          return;
      }
    },
    [navigate, setRideStatus],
  );

  /* =======================================================
     WEBSOCKET CONNECTION

     Primary connection:
     Socket.IO namespace /rides

     Authentication:
     passenger_access_token

     Subscription:
     ride.subscribe { rideId }
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

     Polling starts when WebSocket is unavailable.

     Polling stops when WebSocket connects.

     Interval: 5 seconds.
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
            "DRIVER ASSIGNED FALLBACK POLLING ERROR:",
            error,
          );

          setRefreshError(true);
        }
      } finally {
        pollingRef.current = false;
      }
    };

    /*
     * Fetch immediately while the socket
     * is disconnected.
     */
    void pollRide();

    /*
     * Continue every five seconds until
     * the WebSocket reconnects.
     */
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

      if (navigatingRef.current) {
        return;
      }

      setRefreshError(false);

      handleRideStatus(response);
    } catch (error) {
      console.error(
        "DRIVER ASSIGNED MANUAL REFRESH ERROR:",
        error,
      );

      setRefreshError(true);

      toast.error(
        "Unable to refresh ride details.",
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  /* =======================================================
     CANCEL RIDE

     Backend decides whether cancellation
     is allowed and what fee applies.
  ======================================================= */

  const handleCancel = async (
    reason: string,
    _comment?: string,
  ) => {
    if (
      !rideId ||
      cancellingRef.current ||
      navigatingRef.current
    ) {
      return;
    }

    cancellingRef.current = true;

    setIsCancelling(true);

    try {
      /*
       * Check the latest ride status before
       * submitting cancellation.
       */
      const latest =
        await passengerRideApi.getRide(rideId);

      if (
        latest.status !== "driver_assigned" &&
        latest.status !== "driver_en_route"
      ) {
        setCancelOpen(false);

        handleRideStatus(latest);

        toast.info(
          "Your ride status has changed.",
        );

        return;
      }

      /*
       * Submit cancellation to backend.
       */
      const response =
        await passengerRideApi.cancelRide(
          rideId,
          reason,
        );

      /*
       * If the backend returned a different
       * status, handle that instead.
       */
      if (response.status !== "cancelled") {
        setCancelOpen(false);

        handleRideStatus(response);

        toast.info(
          "Your ride status changed before cancellation.",
        );

        return;
      }

      /*
       * Cancellation confirmed.
       */
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
      console.error(
        "DRIVER ASSIGNED CANCEL ERROR:",
        error,
      );

      /*
       * Cancellation might have succeeded
       * even if the request timed out.

       * Recheck the backend before reporting
       * failure.
       */
      try {
        const latest =
          await passengerRideApi.getRide(rideId);

        if (
          latest.status !== "driver_assigned" &&
          latest.status !== "driver_en_route"
        ) {
          setCancelOpen(false);

          handleRideStatus(latest);
          return;
        }
      } catch (refreshError) {
        console.error(
          "CANCELLATION STATUS RECHECK ERROR:",
          refreshError,
        );
      }

      toast.error(getErrorMessage(error));
    } finally {
      cancellingRef.current = false;

      if (mountedRef.current) {
        setIsCancelling(false);
      }
    }
  };

  /* =======================================================
     CHAT WITH DRIVER
  ======================================================= */

  const openDriverChat = () => {
    if (!backendRide?.driverId) {
      toast.info(
        "Driver details are still updating.",
      );
      return;
    }

    navigate("/passenger/ride/chat");
  };

  /* =======================================================
     CALL DRIVER
  ======================================================= */

  const callDriver = () => {
    const phone =
      backendRide?.driver?.phoneNumber;

    if (!phone) {
      toast.info(
        "Driver calling is not available yet.",
      );
      return;
    }

    window.location.href = `tel:${phone}`;
  };

  /* =======================================================
     ROUTE GUARDS
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
     RESTORE PICKUP AND DESTINATION

     Prefer context values.

     Use backend values after refresh.
  ======================================================= */

  const pickup =
    ride.pickup ??
    (backendRide?.pickup
      ? {
          label: backendRide.pickup.address,
          address: backendRide.pickup.address,
          coordinates: {
            lat: backendRide.pickup.lat,
            lng: backendRide.pickup.lng,
          },
        }
      : null);

  const destination =
    ride.destination ??
    (backendRide?.dropoff
      ? {
          label: backendRide.dropoff.address,
          address: backendRide.dropoff.address,
          coordinates: {
            lat: backendRide.dropoff.lat,
            lng: backendRide.dropoff.lng,
          },
        }
      : null);

  if (!pickup || !destination) {
    return (
      <Navigate
        to="/passenger/home"
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
        to="/passenger/home"
        replace
      />
    );
  }

  /* =======================================================
     DRIVER AND VEHICLE DATA
  ======================================================= */

  const backendDriver = backendRide?.driver;

  const vehicle = backendRide?.vehicle;

  const driverName =
    backendDriver?.fullName?.trim() ||
    [
      backendDriver?.firstName,
      backendDriver?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    "";

  const driverForCard: RideDriver | null =
    backendDriver && driverName && vehicle
      ? {
          id:
            backendDriver.id ??
            backendRide?.driverId ??
            "",

          firstName: driverName,

          photo:
            backendDriver.profilePicture ?? "",

          rating:
            backendDriver.rating ?? 0,

          totalTrips:
            backendDriver.totalCompletedRides ?? 0,

          vehicle: {
            make: vehicle.make ?? "",
            model: vehicle.model ?? "",
            color: vehicle.color ?? "",
            plateNumber:
              vehicle.plateNumber ??
              vehicle.registrationNumber ??
              "",
          },
        }
      : null;

  /* =======================================================
     DISPLAY DATA
  ======================================================= */

  const eta =
    backendRide?.estimatedDurationMin;

  const isUsingFallback = !connected;

  const connectionLabel = isCancelling
    ? "Cancelling ride..."
    : connected
      ? "Live ride updates connected"
      : refreshError
        ? "Unable to refresh ride status"
        : socketError
          ? "Using backup connection"
          : "Connecting to live updates...";

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
      />

      {/* ===============================================
          HEADER
      =============================================== */}

      <RideMapHeader
        title="Driver Assigned"
        showMore
      />

      {/* ===============================================
          BOTTOM SHEET
      =============================================== */}

      <RideBottomSheet>

        {/* DRAG HANDLE */}

        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[#E0DCE4]" />

        {/* =========================================
            TITLE
        ========================================= */}

        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-semibold text-[#302B34]">
              Driver Assigned
            </h1>

            <p className="mt-1 text-[13px] text-[#928C96]">
              Your driver has accepted your ride.
            </p>
          </div>

          {(loading || isRefreshing) && (
            <LoaderCircle
              size={19}
              className="animate-spin text-[#7442AD]"
            />
          )}
        </div>

        {/* =========================================
            CONNECTION STATUS
        ========================================= */}

        <div className="mt-4 flex items-center justify-between rounded-[13px] bg-[#F8F7FA] px-3 py-2.5">

          <div className="flex items-center min-w-0 gap-2">

            {connected ? (
              <Wifi
                size={16}
                className="shrink-0 text-[#3C9A65]"
              />
            ) : (
              <WifiOff
                size={16}
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

          {isUsingFallback && (
            <button
              type="button"
              onClick={refreshRide}
              disabled={isRefreshing}
              aria-label="Refresh ride status"
              className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#7442AD] shadow-sm disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  isRefreshing
                    ? "animate-spin"
                    : ""
                }
              />
            </button>
          )}

        </div>

        {/* =========================================
            ROUTE SUMMARY
        ========================================= */}

        <div className="mt-4 rounded-[16px] bg-[#FAF9FB] p-4">

          <div className="flex gap-3">

            <div className="flex flex-col items-center pt-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E9AF27]" />
              <span className="my-1 h-8 w-px bg-[#D9D2E0]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#7442AD]" />
            </div>

            <div className="flex-1 min-w-0">

              <p className="truncate text-[13px] font-medium text-[#302B34]">
                {pickup.label}
              </p>

              <p className="my-3 text-[12px] text-[#A29BA6]">
                Add Stop
              </p>

              <p className="truncate text-[13px] font-medium text-[#302B34]">
                {destination.label}
              </p>

            </div>
          </div>

        </div>

        {/* =========================================
            DRIVER AND VEHICLE
        ========================================= */}

        <div className="mt-4">

          {driverForCard ? (
            <DriverCard
              driver={driverForCard}
              onChat={openDriverChat}
              onCall={callDriver}
            />
          ) : (

            <div className="rounded-[18px] border border-[#EEEAF1] bg-white p-4">

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0E8F8] text-[#7442AD]">
                  <UserRound size={23} />
                </div>

                <div className="flex-1 min-w-0">

                  <p className="text-[15px] font-semibold text-[#302B34]">
                    Driver assigned
                  </p>

                  <p className="mt-1 text-[12px] text-[#918B95]">
                    Driver profile is updating...
                  </p>

                </div>

                <div className="flex gap-2">

                  <button
                    type="button"
                    onClick={openDriverChat}
                    aria-label="Chat with driver"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0E8F8] text-[#7442AD]"
                  >
                    <MessageCircle size={19} />
                  </button>

                  <button
                    type="button"
                    onClick={callDriver}
                    aria-label="Call driver"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7F7EC] text-[#2E9B61]"
                  >
                    <Phone size={18} />
                  </button>

                </div>
              </div>

              {/* VEHICLE DETAILS */}

              <div className="mt-4 flex items-center gap-3 border-t border-[#F0EDF2] pt-3">

                <CarFront
                  size={19}
                  className="text-[#7442AD]"
                />

                <div className="min-w-0">

                  <p className="text-[14px] font-semibold text-[#302B34]">
                    {[vehicle?.make, vehicle?.model]
                      .filter(Boolean)
                      .join(" ") ||
                      "Vehicle details updating"}
                  </p>

                  {(vehicle?.plateNumber ||
                    vehicle?.registrationNumber) && (
                    <p className="mt-1 text-[12px] text-[#928C96]">
                      {vehicle.plateNumber ||
                        vehicle.registrationNumber}
                    </p>
                  )}

                </div>
              </div>

            </div>
          )}

        </div>

        {/* =========================================
            ESTIMATED TRIP DURATION
        ========================================= */}

        {typeof eta === "number" && (
          <div className="mt-3 flex items-center gap-2 text-[12px] text-[#918B95]">

            <Clock3
              size={15}
              className="text-[#7442AD]"
            />

            Estimated trip duration:{" "}
            {Math.round(eta)} min

          </div>
        )}

        {/* =========================================
            SHARE TRIP
        ========================================= */}

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => setShareOpen(true)}
          className="mt-4 flex h-[50px] w-full items-center justify-between rounded-[13px] bg-[#F8F7F9] px-4 text-[14px] font-semibold text-[#302B34]"
        >

          <span className="flex items-center gap-2">

            <Share2
              size={17}
              className="text-[#7442AD]"
            />

            Share Trip Live Status

          </span>

          <span className="text-[#A49AAA]">
            ›
          </span>

        </motion.button>

        {/* =========================================
            CANCEL RIDE
        ========================================= */}

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => setCancelOpen(true)}
          disabled={isCancelling}
          className="mt-4 flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#F35C43] text-[16px] font-semibold text-white disabled:opacity-60"
        >

          {isCancelling && (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
          )}

          {isCancelling
            ? "Cancelling..."
            : "Cancel Ride"}

        </motion.button>

      </RideBottomSheet>

      {/* ===============================================
          SHARE RIDE SHEET
      =============================================== */}

      {rideId && (
        <ShareRideSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          rideId={rideId}
          driver={ride.driver}
          pickup={pickup}
          destination={destination}
          eta={
            typeof eta === "number"
              ? `${Math.round(eta)} min`
              : undefined
          }
        />
      )}

      {/* ===============================================
          CANCEL RIDE SHEET
      =============================================== */}

      <CancelRideSheet
        open={cancelOpen}
        onClose={() => {
          if (!isCancelling) {
            setCancelOpen(false);
          }
        }}
        onConfirm={handleCancel}
      />

    </div>
  );
}


// "use client";

// import {
//   Clock3,
//   LoaderCircle,
//   MessageCircle,
//   Phone,
//   Share2,
//   UserRound,
//   CarFront,
// } from "lucide-react";
// import { motion } from "framer-motion";
// import { useEffect, useRef, useState } from "react";
// import { Navigate, useNavigate } from "react-router-dom";
// import { toast } from "sonner";

// import PassengerMap from "../../../components/passenger/ride/PassengerMap";
// import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
// import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";
// import DriverCard from "../../../components/passenger/ride/DriverCard";
// import ShareRideSheet from "../../../components/passenger/ride/ShareRideSheet";
// import CancelRideSheet from "../../../components/passenger/ride/CancelRideSheet";

// import { usePassengerRide } from "../../../context/PassengerRideContext";
// import {
//   passengerRideApi,
//   type PassengerRideResponse,
// } from "../../../api/passenger/rides";
// import {
//   clearActiveRide,
//   getStoredActiveRide,
//   getStoredActiveRideId,
//   storeActiveRide,
// } from "../../../utils/passengerActiveRide";
// import type { RideDriver } from "../../../types/passengerRide";

// const POLL_INTERVAL = 4000;

// export default function DriverAssigned() {
//   const navigate = useNavigate();
//   const { ride, setRideStatus } = usePassengerRide();

//   const [backendRide, setBackendRide] =
//     useState<PassengerRideResponse | null>(
//       () => getStoredActiveRide(),
//     );

//   const [shareOpen, setShareOpen] = useState(false);
//   const [cancelOpen, setCancelOpen] = useState(false);
//   const [isCancelling, setIsCancelling] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const cancellingRef = useRef(false);

//   const rideId =
//     backendRide?.id ?? getStoredActiveRideId();

//   const handleRideStatus = (
//     response: PassengerRideResponse,
//   ) => {
//     setBackendRide(response);
//     storeActiveRide(response);

//     switch (response.status) {
//       case "requested":
//       case "searching":
//         setRideStatus("searching");
//         navigate("/passenger/ride/searching", {
//           replace: true,
//         });
//         return;

//       case "driver_en_route":
//         setRideStatus("driver-en-route");
//         navigate("/passenger/ride/driver-en-route", {
//           replace: true,
//         });
//         return;

//       case "driver_arrived":
//         setRideStatus("driver-arrived");
//         navigate("/passenger/ride/driver-arrived", {
//           replace: true,
//         });
//         return;

//       case "ride_started":
//       case "ride_in_progress":
//         setRideStatus("in-progress");
//         navigate("/passenger/ride/in-trip", {
//           replace: true,
//         });
//         return;

//       case "ride_completed":
//       case "payment_pending":
//       case "paid":
//       case "closed":
//         navigate("/passenger/ride/complete", {
//           replace: true,
//         });
//         return;

//       case "cancelled":
//         clearActiveRide();
//         setRideStatus("idle");
//         navigate("/passenger/home", {
//           replace: true,
//         });
//         return;

//       case "no_drivers_found":
//         setRideStatus("searching");
//         navigate("/passenger/ride/searching", {
//           replace: true,
//         });
//         return;

//       default:
//         return;
//     }
//   };

//   useEffect(() => {
//     if (!rideId) return;

//     let mounted = true;
//     let running = false;

//     const refresh = async () => {
//       if (running || cancellingRef.current) return;

//       running = true;

//       try {
//         setLoading(true);

//         const response =
//           await passengerRideApi.getRide(rideId);

//         if (!mounted || cancellingRef.current) return;

//         handleRideStatus(response);
//       } catch (error) {
//         if (mounted) {
//           console.error(
//             "DRIVER ASSIGNED POLLING ERROR:",
//             error,
//           );
//         }
//       } finally {
//         running = false;
//         if (mounted) setLoading(false);
//       }
//     };

//     void refresh();

//     const interval = window.setInterval(
//       refresh,
//       POLL_INTERVAL,
//     );

//     return () => {
//       mounted = false;
//       window.clearInterval(interval);
//     };
//     // handleRideStatus reads stable navigation/context setters.
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [rideId, navigate, setRideStatus]);

//   const handleCancel = async (
//     reason: string,
//     _comment?: string,
//   ) => {
//     if (!rideId || cancellingRef.current) return;

//     cancellingRef.current = true;
//     setIsCancelling(true);

//     try {
//       const latest =
//         await passengerRideApi.getRide(rideId);

//       if (
//         latest.status !== "driver_assigned" &&
//         latest.status !== "driver_en_route"
//       ) {
//         setCancelOpen(false);
//         handleRideStatus(latest);
//         return;
//       }

//       const response =
//         await passengerRideApi.cancelRide(
//           rideId,
//           reason,
//         );

//       if (response.status !== "cancelled") {
//         setCancelOpen(false);
//         handleRideStatus(response);
//         toast.info(
//           "Your ride status changed before cancellation.",
//         );
//         return;
//       }

//       clearActiveRide();
//       setCancelOpen(false);
//       setRideStatus("idle");

//       toast.success(
//         response.cancellationFee > 0
//           ? `Ride cancelled. Fee: ₦${response.cancellationFee.toLocaleString("en-NG")}`
//           : "Ride cancelled successfully.",
//       );

//       navigate("/passenger/home", {
//         replace: true,
//       });
//     } catch (error) {
//       console.error("CANCEL RIDE ERROR:", error);

//       try {
//         const latest =
//           await passengerRideApi.getRide(rideId);

//         if (latest.status !== "driver_assigned") {
//           setCancelOpen(false);
//           handleRideStatus(latest);
//           return;
//         }
//       } catch (refreshError) {
//         console.error(
//           "CANCEL STATUS REFRESH ERROR:",
//           refreshError,
//         );
//       }

//       toast.error(
//         "Unable to cancel the ride. Please try again.",
//       );
//     } finally {
//       cancellingRef.current = false;
//       setIsCancelling(false);
//     }
//   };

//   if (!rideId) {
//     return (
//       <Navigate to="/passenger/home" replace />
//     );
//   }

//   // Prefer the ride context; use backend coordinates
//   // when the screen is refreshed.
//   const pickup =
//     ride.pickup ??
//     (backendRide?.pickup
//       ? {
//           label: backendRide.pickup.address,
//           address: backendRide.pickup.address,
//           coordinates: {
//             lat: backendRide.pickup.lat,
//             lng: backendRide.pickup.lng,
//           },
//         }
//       : null);

//   const destination =
//     ride.destination ??
//     (backendRide?.dropoff
//       ? {
//           label: backendRide.dropoff.address,
//           address: backendRide.dropoff.address,
//           coordinates: {
//             lat: backendRide.dropoff.lat,
//             lng: backendRide.dropoff.lng,
//           },
//         }
//       : null);

//   if (!pickup || !destination) {
//     return (
//       <Navigate to="/passenger/home" replace />
//     );
//   }

//   const center =
//     pickup.coordinates ??
//     destination.coordinates;

//   if (!center) {
//     return (
//       <Navigate to="/passenger/home" replace />
//     );
//   }


//   const backendDriver = backendRide?.driver;
// const vehicle = backendRide?.vehicle;

// const driverName =
//   backendDriver?.fullName?.trim() ||
//   [backendDriver?.firstName, backendDriver?.lastName]
//     .filter(Boolean)
//     .join(" ") ||
//   "";

// const driverForCard: RideDriver | null =
//   backendDriver && driverName && vehicle
//     ? {
//         id: backendDriver.id ?? backendRide?.driverId ?? "",
//         firstName: driverName,
//         photo: backendDriver.profilePicture ?? "",
//         rating: backendDriver.rating ?? 0,
//         totalTrips: backendDriver.totalCompletedRides ?? 0,
//         vehicle: {
//           make: vehicle.make ?? "",
//           model: vehicle.model ?? "",
//           color: vehicle.color ?? "",
//           plateNumber:
//             vehicle.plateNumber ??
//             vehicle.registrationNumber ??
//             "",
//         },
//       }
//     : null;

//   const openDriverChat = () => {
//     if (!backendRide?.driverId) {
//       toast.info("Driver details are updating.");
//       return;
//     }

//     navigate("/passenger/ride/chat");
//   };

//   const callDriver = () => {
//     const phone = backendDriver?.phoneNumber;

//     if (!phone) {
//       toast.info(
//         "Driver calling is not available yet.",
//       );
//       return;
//     }

//     window.location.href = `tel:${phone}`;
//   };

//   const eta = backendRide?.estimatedDurationMin;

//   return (
//     <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
//       <PassengerMap
//         center={center}
//         pickup={pickup}
//         destination={destination}
//         zoom={15}
//       />

//       <RideMapHeader
//         title="Driver Assigned"
//         showMore
//       />

//       <RideBottomSheet>
//         <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[#E0DCE4]" />

//         <div className="flex items-start justify-between gap-3">
//           <div>
//             <h1 className="text-[20px] font-semibold text-[#302B34]">
//               Driver Assigned
//             </h1>

//             <p className="mt-1 text-[13px] text-[#928C96]">
//               Your driver has accepted your ride.
//             </p>
//           </div>

//           {loading && (
//             <LoaderCircle
//               size={19}
//               className="animate-spin text-[#7442AD]"
//             />
//           )}
//         </div>

//         {/* ROUTE SUMMARY */}
//         <div className="mt-4 rounded-[16px] bg-[#FAF9FB] p-4">
//           <div className="flex gap-3">
//             <div className="flex flex-col items-center pt-1">
//               <span className="h-2.5 w-2.5 rounded-full bg-[#E9AF27]" />
//               <span className="my-1 h-8 w-px bg-[#D9D2E0]" />
//               <span className="h-2.5 w-2.5 rounded-full bg-[#7442AD]" />
//             </div>

//             <div className="flex-1 min-w-0">
//               <p className="truncate text-[13px] font-medium text-[#302B34]">
//                 {pickup.label}
//               </p>

//               <p className="my-3 text-[12px] text-[#A29BA6]">
//                 Add Stop
//               </p>

//               <p className="truncate text-[13px] font-medium text-[#302B34]">
//                 {destination.label}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* DRIVER AND VEHICLE */}
//         <div className="mt-4">
//           {driverForCard ? (
//             <DriverCard
//               driver={driverForCard}
//               onChat={openDriverChat}
//               onCall={callDriver}
//             />
//           ) : (
//             <div className="rounded-[18px] border border-[#EEEAF1] bg-white p-4">
//               <div className="flex items-center gap-3">
//                 <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0E8F8] text-[#7442AD]">
//                   <UserRound size={23} />
//                 </div>

//                 <div className="flex-1 min-w-0">
//                   <p className="text-[15px] font-semibold text-[#302B34]">
//                     Driver assigned
//                   </p>
//                   <p className="mt-1 text-[12px] text-[#918B95]">
//                     Driver profile is updating...
//                   </p>
//                 </div>

//                 <div className="flex gap-2">
//                   <button
//                     type="button"
//                     onClick={openDriverChat}
//                     aria-label="Chat with driver"
//                     className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0E8F8] text-[#7442AD]"
//                   >
//                     <MessageCircle size={19} />
//                   </button>

//                   <button
//                     type="button"
//                     onClick={callDriver}
//                     aria-label="Call driver"
//                     className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7F7EC] text-[#2E9B61]"
//                   >
//                     <Phone size={18} />
//                   </button>
//                 </div>
//               </div>

//               <div className="mt-4 flex items-center gap-3 border-t border-[#F0EDF2] pt-3">
//                 <CarFront
//                   size={19}
//                   className="text-[#7442AD]"
//                 />
//                 <div className="min-w-0">
//                   <p className="text-[14px] font-semibold text-[#302B34]">
//                     {[vehicle?.make, vehicle?.model]
//                       .filter(Boolean)
//                       .join(" ") ||
//                       "Vehicle details updating"}
//                   </p>

//                   {vehicle?.plateNumber && (
//                     <p className="mt-1 text-[12px] text-[#928C96]">
//                       {vehicle.plateNumber}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* ETA */}
//         {typeof eta === "number" && (
//           <div className="mt-3 flex items-center gap-2 text-[12px] text-[#918B95]">
//             <Clock3
//               size={15}
//               className="text-[#7442AD]"
//             />
//             Estimated trip duration: {Math.round(eta)} min
//           </div>
//         )}

//         {/* SHARE TRIP */}
//         <motion.button
//           type="button"
//           whileTap={{ scale: 0.98 }}
//           onClick={() => setShareOpen(true)}
//           className="mt-4 flex h-[50px] w-full items-center justify-between rounded-[13px] bg-[#F8F7F9] px-4 text-[14px] font-semibold text-[#302B34]"
//         >
//           <span className="flex items-center gap-2">
//             <Share2
//               size={17}
//               className="text-[#7442AD]"
//             />
//             Share Trip Live Status
//           </span>
//           <span className="text-[#A49AAA]">›</span>
//         </motion.button>

//         {/* CANCEL */}
//         <motion.button
//           type="button"
//           whileTap={{ scale: 0.98 }}
//           onClick={() => setCancelOpen(true)}
//           disabled={isCancelling}
//           className="mt-4 flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#F35C43] text-[16px] font-semibold text-white disabled:opacity-60"
//         >
//           {isCancelling && (
//             <LoaderCircle
//               size={18}
//               className="animate-spin"
//             />
//           )}
//           Cancel Ride
//         </motion.button>
//       </RideBottomSheet>

//       {rideId && (
//         <ShareRideSheet
//           open={shareOpen}
//           onClose={() => setShareOpen(false)}
//           rideId={rideId}
//           driver={ride.driver}
//           pickup={pickup}
//           destination={destination}
//           eta={
//             typeof eta === "number"
//               ? `${Math.round(eta)} min`
//               : undefined
//           }
//         />
//       )}

//       <CancelRideSheet
//         open={cancelOpen}
//         onClose={() => {
//           if (!isCancelling) setCancelOpen(false);
//         }}
//         onConfirm={handleCancel}
//       />
//     </div>
//   );
// }




