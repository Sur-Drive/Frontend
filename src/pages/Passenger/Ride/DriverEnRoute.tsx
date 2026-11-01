"use client";

import {
  CarFront,
  ChevronRight,
  LoaderCircle,
  MessageCircle,
  Phone,
  Share2,
  UserRound,
  Wifi,
  WifiOff,
  RefreshCw,
  Navigation2,
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
import { getRideSocket } from "../../../lib/rideSocket";
import {
  useRideDriverDetails,
} from "../../../hooks/passenger/useRideDriverDetails";

/* =========================================================
   CONSTANTS
========================================================= */

const FALLBACK_POLL_INTERVAL = 5000;

const PASSENGER_TOKEN_KEY = "passenger_access_token";

/* =========================================================
   TYPES
========================================================= */

interface DriverLocation {
  lat: number;
  lng: number;
}

interface DriverLocationEvent {
  rideId?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  location?: {
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
  };
}

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

function parseDriverLocation(
  payload: DriverLocationEvent,
): DriverLocation | null {
  const lat =
    payload.location?.lat ??
    payload.location?.latitude ??
    payload.lat ??
    payload.latitude;

  const lng =
    payload.location?.lng ??
    payload.location?.longitude ??
    payload.lng ??
    payload.longitude;

  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return { lat, lng };
}

/* =========================================================
   COMPONENT
========================================================= */

export default function DriverEnRoute() {
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

  const [cancelling, setCancelling] = useState(false);

  const [refreshError, setRefreshError] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [token, setToken] = useState<string | null>(
    getPassengerToken,
  );

  const [driverLocation, setDriverLocation] =
    useState<DriverLocation | null>(null);

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
     AUTH TOKEN SYNC
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

      window.removeEventListener(
        "storage",
        syncToken,
      );
    };
  }, []);

  /* =======================================================
     HANDLE BACKEND STATUS

     Called by:
     - WebSocket
     - Fallback polling
     - Manual refresh
     - Cancellation checks
  ======================================================= */

  const handleStatus = useCallback(
    (response: PassengerRideResponse) => {
      if (
        navigatingRef.current ||
        !response?.id
      ) {
        return;
      }

      setBackendRide(response);

      if (response.status !== "cancelled") {
        storeActiveRide(response);
      }

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
          navigatingRef.current = true;

          setRideStatus("driver-assigned");

          navigate("/passenger/ride/driver-assigned", {
            replace: true,
          });
          return;

        case "driver_en_route":
          setRideStatus("driver-en-route");
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

          toast.error(
            "This ride has been cancelled.",
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
     WEBSOCKET STATUS UPDATES

     Uses the existing ride socket hook.

     The hook must emit:
     ride.subscribe { rideId }
  ======================================================= */

  const {
    connected,
    socketError,
  } = useRideSocket({
    rideId,
    token,
    onRideUpdate: handleStatus,
    enabled: Boolean(rideId && token),
  });

  /* =======================================================
     LIVE DRIVER LOCATION

     Listens for:
     driver.location_updated

     The event must belong to the active ride.
  ======================================================= */

  useEffect(() => {
    if (!rideId || !token) {
      return;
    }

    const socket = getRideSocket(token);

    const handleDriverLocation = (
      payload: DriverLocationEvent,
    ) => {
      if (
        !payload ||
        payload.rideId !== rideId
      ) {
        return;
      }

      const coordinates =
        parseDriverLocation(payload);

      if (!coordinates) {
        return;
      }

      setDriverLocation(coordinates);
    };

    socket.on(
      "driver.location_updated",
      handleDriverLocation,
    );

    return () => {
      socket.off(
        "driver.location_updated",
        handleDriverLocation,
      );
    };
  }, [rideId, token]);

  /* =======================================================
     FALLBACK POLLING

     Runs ONLY while WebSocket is disconnected.

     Automatically stops on connection.
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

        handleStatus(response);
      } catch (error) {
        if (active) {
          console.error(
            "DRIVER EN ROUTE FALLBACK POLLING ERROR:",
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
    handleStatus,
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

      handleStatus(response);
    } catch (error) {
      console.error(
        "DRIVER EN ROUTE REFRESH ERROR:",
        error,
      );

      setRefreshError(true);

      toast.error(
        "Unable to refresh ride status.",
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  /* =======================================================
     CANCEL RIDE
  ======================================================= */

  const handleCancel = async (
    reason: string,
    comment?: string,
  ) => {
    if (
      !rideId ||
      cancellingRef.current ||
      navigatingRef.current
    ) {
      return;
    }

    cancellingRef.current = true;

    setCancelling(true);

    try {
      const latest =
        await passengerRideApi.getRide(rideId);

      if (
        latest.status !== "driver_en_route"
      ) {
        setCancelOpen(false);

        handleStatus(latest);

        toast.info(
          "Your ride status has changed.",
        );

        return;
      }

      const finalReason = comment?.trim()
        ? `${reason}: ${comment.trim()}`
        : reason;

      const response =
        await passengerRideApi.cancelRide(
          rideId,
          finalReason,
        );

      if (response.status !== "cancelled") {
        setCancelOpen(false);

        handleStatus(response);

        toast.error(
          "Cancellation was not confirmed.",
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
      console.error(
        "DRIVER EN ROUTE CANCEL ERROR:",
        error,
      );

      try {
        const latest =
          await passengerRideApi.getRide(rideId);

        if (
          latest.status !== "driver_en_route"
        ) {
          setCancelOpen(false);

          handleStatus(latest);
          return;
        }
      } catch (refreshError) {
        console.error(
          "CANCEL STATUS REFRESH ERROR:",
          refreshError,
        );
      }

      toast.error(getErrorMessage(error));
    } finally {
      cancellingRef.current = false;

      if (mountedRef.current) {
        setCancelling(false);
      }
    }
  };

  /* =======================================================
     DRIVER ACTIONS
  ======================================================= */

  const openDriverChat = () => {
    if (!backendRide?.driverId) {
      toast.info(
        "Driver details are updating.",
      );
      return;
    }

    navigate("/passenger/ride/chat");
  };

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
     RESTORE LOCATIONS
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
     DRIVER DETAILS
  ======================================================= */

  const {
  driver: driverForCard,
  loading: driverLoading,
  error: driverError,
} = useRideDriverDetails(
  rideId,
  backendRide,
  ride.driver,
);

  // const backendDriver = backendRide?.driver;

  // const vehicle = backendRide?.vehicle;

  // const driverName =
  //   backendDriver?.fullName?.trim() ||
  //   [
  //     backendDriver?.firstName,
  //     backendDriver?.lastName,
  //   ]
  //     .filter(Boolean)
  //     .join(" ") ||
  //   "";

  // const driverForCard: RideDriver | null =
  //   backendDriver && driverName && vehicle
  //     ? {
  //         id:
  //           backendDriver.id ??
  //           backendRide?.driverId ??
  //           "",

  //         firstName: driverName,

  //         photo:
  //           backendDriver.profilePicture ?? "",

  //         rating:
  //           backendDriver.rating ?? 0,

  //         totalTrips:
  //           backendDriver.totalCompletedRides ?? 0,

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

  /* =======================================================
     DISPLAY DATA
  ======================================================= */

  const estimatedTripDuration =
    backendRide?.estimatedDurationMin;

  const isUsingFallback = !connected;

  const connectionLabel = cancelling
    ? "Cancelling ride..."
    : connected
      ? "Live driver updates connected"
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
        zoom={16}
        interactive
        showTraffic
      />

      {/* ===============================================
          HEADER
      =============================================== */}

      <RideMapHeader
        title="Driver En Route"
        subtitle={
          refreshError
            ? "Reconnecting to your ride..."
            : "Your driver is on the way"
        }
        showMore
      />

      {/* ===============================================
          BOTTOM SHEET
      =============================================== */}

      <RideBottomSheet>

        {/* STATUS */}

        <div className="rounded-[18px] bg-[#F3ECF9] p-4">

          <div className="flex items-start justify-between gap-3">

            <div>
              <h1 className="text-[17px] font-semibold text-[#302B34]">
                Your driver is on the way
              </h1>

              <p className="mt-1 text-[13px] leading-5 text-[#8F8994]">
                Please be ready at your pickup point.
              </p>
            </div>

            <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#7442AD]">
              En Route
            </span>

          </div>

          {/* ANIMATED PROGRESS */}

          <div className="mt-4 h-[5px] overflow-hidden rounded-full bg-white">

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "350%" }}
              transition={{
                duration: 1.7,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="h-full w-[30%] rounded-full bg-[#7442AD]"
            />

          </div>
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
            DRIVER CARD
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
          <p className="text-[14px] font-semibold text-[#302B34]">
            Your driver
          </p>

          <p className="mt-1 text-[12px] text-[#918B95]">
            {driverLoading
              ? "Loading driver details..."
              : driverError
                ? "Unable to load driver details"
                : "Driver details updating..."}
          </p>
        </div>

        {driverLoading && (
          <LoaderCircle
            size={18}
            className="animate-spin text-[#7442AD]"
          />
        )}
      </div>
    </div>
  )}
</div>

        {/* <div className="mt-4">

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
                    Your driver
                  </p>

                  <p className="mt-1 text-[12px] text-[#918B95]">
                    Driver details updating...
                  </p>

                </div>

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

              VEHICLE DETAILS

              <div className="mt-4 flex items-center gap-3 border-t border-[#F0EDF2] pt-3">

                <CarFront
                  size={19}
                  className="text-[#7442AD]"
                />

                <p className="text-[14px] font-semibold text-[#302B34]">
                  {[vehicle?.make, vehicle?.model]
                    .filter(Boolean)
                    .join(" ") ||
                    "Vehicle details updating"}
                </p>

              </div>

            </div>
          )}

        </div> */}

        {/* =========================================
            DRIVER LOCATION STATUS
        ========================================= */}

        {driverLocation && (
          <div className="mt-3 flex items-center gap-2 rounded-[12px] bg-[#F1F8F3] px-3 py-2.5">

            <Navigation2
              size={15}
              className="text-[#3C9A65]"
            />

            <p className="text-[12px] font-medium text-[#3C9A65]">
              Receiving live driver location updates
            </p>

          </div>
        )}

        {/* =========================================
            ESTIMATED TRIP DURATION
        ========================================= */}

        {typeof estimatedTripDuration === "number" && (
          <p className="mt-3 text-[12px] text-[#918B95]">
            Estimated trip duration:{" "}
            {Math.round(estimatedTripDuration)} min
          </p>
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

          <ChevronRight
            size={18}
            className="text-[#A49AAA]"
          />

        </motion.button>

        {/* =========================================
            CANCEL RIDE
        ========================================= */}

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => setCancelOpen(true)}
          disabled={cancelling}
          className="mt-4 flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#F35C43] text-[16px] font-semibold text-white disabled:opacity-60"
        >

          {cancelling && (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
          )}

          {cancelling
            ? "Cancelling..."
            : "Cancel Ride"}

        </motion.button>

      </RideBottomSheet>

      {/* ===============================================
          SHARE RIDE SHEET
      =============================================== */}

      <ShareRideSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        rideId={rideId}
        driver={ride.driver}
        pickup={pickup}
        destination={destination}
        eta={undefined}
      />

      {/* ===============================================
          CANCEL RIDE SHEET
      =============================================== */}

      <CancelRideSheet
        open={cancelOpen}
        onClose={() => {
          if (!cancelling) {
            setCancelOpen(false);
          }
        }}
        onConfirm={handleCancel}
      />

    </div>
  );
}


// import {
//   CarFront,
//   ChevronRight,
//   LoaderCircle,
//   MessageCircle,
//   Phone,
//   Share2,
//   UserRound,
// } from "lucide-react";
// import { motion } from "framer-motion";
// import { useCallback, useEffect, useRef, useState } from "react";
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

// export default function DriverEnRoute() {
//   const navigate = useNavigate();
//   const { ride, setRideStatus } = usePassengerRide();

//   const [backendRide, setBackendRide] =
//     useState<PassengerRideResponse | null>(
//       () => getStoredActiveRide(),
//     );

//   const [shareOpen, setShareOpen] = useState(false);
//   const [cancelOpen, setCancelOpen] = useState(false);
//   const [cancelling, setCancelling] = useState(false);
//   const [pollError, setPollError] = useState(false);

//   const cancellingRef = useRef(false);

//   const rideId =
//     backendRide?.id ?? getStoredActiveRideId();

//   const handleStatus = useCallback(
//     (response: PassengerRideResponse) => {
//       setBackendRide(response);
//       storeActiveRide(response);

//       switch (response.status) {
//         case "driver_assigned":
//           setRideStatus("driver-assigned");
//           navigate("/passenger/ride/driver-assigned", {
//             replace: true,
//           });
//           break;

//         case "driver_arrived":
//           setRideStatus("driver-arrived");
//           navigate("/passenger/ride/driver-arrived", {
//             replace: true,
//           });
//           break;

//         case "ride_started":
//         case "ride_in_progress":
//           setRideStatus("in-progress");
//           navigate("/passenger/ride/in-trip", {
//             replace: true,
//           });
//           break;

//         case "ride_completed":
//         case "payment_pending":
//         case "paid":
//         case "closed":
//           navigate("/passenger/ride/complete", {
//             replace: true,
//           });
//           break;

//         case "cancelled":
//           clearActiveRide();
//           setRideStatus("idle");
//           toast.error("This ride has been cancelled.");
//           navigate("/passenger/home", {
//             replace: true,
//           });
//           break;

//         case "no_drivers_found":
//           setRideStatus("searching");
//           navigate("/passenger/ride/searching", {
//             replace: true,
//           });
//           break;

//         default:
//           break;
//       }
//     },
//     [navigate, setRideStatus],
//   );

//   useEffect(() => {
//     if (!rideId) return;

//     let mounted = true;
//     let running = false;

//     const refresh = async () => {
//       if (running || cancellingRef.current) return;
//       running = true;

//       try {
//         const response =
//           await passengerRideApi.getRide(rideId);

//         if (!mounted || cancellingRef.current) return;

//         setPollError(false);
//         handleStatus(response);
//       } catch (error) {
//         if (mounted) {
//           setPollError(true);
//           console.error(
//             "DRIVER EN ROUTE POLLING ERROR:",
//             error,
//           );
//         }
//       } finally {
//         running = false;
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
//   }, [rideId, handleStatus]);

//   const handleCancel = async (
//     reason: string,
//     comment?: string,
//   ) => {
//     if (!rideId || cancellingRef.current) return;

//     cancellingRef.current = true;
//     setCancelling(true);

//     try {
//       const latest =
//         await passengerRideApi.getRide(rideId);

//       if (latest.status !== "driver_en_route") {
//         setCancelOpen(false);
//         handleStatus(latest);
//         toast.info(
//           "Your ride status has changed.",
//         );
//         return;
//       }

//       const finalReason = comment?.trim()
//         ? `${reason}: ${comment.trim()}`
//         : reason;

//       const response =
//         await passengerRideApi.cancelRide(
//           rideId,
//           finalReason,
//         );

//       if (response.status !== "cancelled") {
//         setCancelOpen(false);
//         handleStatus(response);
//         toast.error(
//           "Cancellation was not confirmed.",
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

//         if (latest.status !== "driver_en_route") {
//           setCancelOpen(false);
//           handleStatus(latest);
//           return;
//         }
//       } catch (refreshError) {
//         console.error(
//           "CANCEL STATUS REFRESH ERROR:",
//           refreshError,
//         );
//       }

//       toast.error(
//         "Unable to cancel ride. Please try again.",
//       );
//     } finally {
//       cancellingRef.current = false;
//       setCancelling(false);
//     }
//   };

//   if (!rideId) {
//     return <Navigate to="/passenger/home" replace />;
//   }

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
//     return <Navigate to="/passenger/home" replace />;
//   }

//   const center =
//     pickup.coordinates ?? destination.coordinates;

//   if (!center) {
//     return <Navigate to="/passenger/home" replace />;
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

//   const estimatedTripDuration =
//     backendRide?.estimatedDurationMin;

//   return (
//     <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
//       <PassengerMap
//         center={center}
//         pickup={pickup}
//         destination={destination}
//         zoom={16}
//         interactive
//         showTraffic
//       />

//       <RideMapHeader
//         title="Driver En Route"
//         subtitle={
//           pollError
//             ? "Reconnecting to your ride..."
//             : "Your driver is on the way"
//         }
//         showMore
//       />

//       <RideBottomSheet>
//         {/* STATUS */}
//         <div className="rounded-[18px] bg-[#F3ECF9] p-4">
//           <div className="flex items-start justify-between gap-3">
//             <div>
//               <h1 className="text-[17px] font-semibold text-[#302B34]">
//                 Your driver is on the way
//               </h1>

//               <p className="mt-1 text-[13px] leading-5 text-[#8F8994]">
//                 Please be ready at your pickup point.
//               </p>
//             </div>

//             <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#7442AD]">
//               En Route
//             </span>
//           </div>

//           {/* INDETERMINATE PROGRESS */}
//           <div className="mt-4 h-[5px] overflow-hidden rounded-full bg-white">
//             <motion.div
//               initial={{ x: "-100%" }}
//               animate={{ x: "350%" }}
//               transition={{
//                 duration: 1.7,
//                 repeat: Infinity,
//                 ease: "easeInOut",
//               }}
//               className="h-full w-[30%] rounded-full bg-[#7442AD]"
//             />
//           </div>
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

//         {/* DRIVER CARD */}
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
//                     Your driver
//                   </p>
//                   <p className="mt-1 text-[12px] text-[#918B95]">
//                     Driver details updating...
//                   </p>
//                 </div>

//                 <button
//                   type="button"
//                   onClick={openDriverChat}
//                   aria-label="Chat with driver"
//                   className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0E8F8] text-[#7442AD]"
//                 >
//                   <MessageCircle size={19} />
//                 </button>

//                 <button
//                   type="button"
//                   onClick={callDriver}
//                   aria-label="Call driver"
//                   className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7F7EC] text-[#2E9B61]"
//                 >
//                   <Phone size={18} />
//                 </button>
//               </div>

//               <div className="mt-4 flex items-center gap-3 border-t border-[#F0EDF2] pt-3">
//                 <CarFront
//                   size={19}
//                   className="text-[#7442AD]"
//                 />

//                 <p className="text-[14px] font-semibold text-[#302B34]">
//                   {[vehicle?.make, vehicle?.model]
//                     .filter(Boolean)
//                     .join(" ") ||
//                     "Vehicle details updating"}
//                 </p>
//               </div>
//             </div>
//           )}
//         </div>

//         {typeof estimatedTripDuration === "number" && (
//           <p className="mt-3 text-[12px] text-[#918B95]">
//             Estimated trip duration:{" "}
//             {Math.round(estimatedTripDuration)} min
//           </p>
//         )}

//         {/* SHARE */}
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

//           <ChevronRight
//             size={18}
//             className="text-[#A49AAA]"
//           />
//         </motion.button>

//         {/* CANCEL */}
//         <motion.button
//           type="button"
//           whileTap={{ scale: 0.98 }}
//           onClick={() => setCancelOpen(true)}
//           disabled={cancelling}
//           className="mt-4 flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#F35C43] text-[16px] font-semibold text-white disabled:opacity-60"
//         >
//           {cancelling && (
//             <LoaderCircle
//               size={18}
//               className="animate-spin"
//             />
//           )}
//           Cancel Ride
//         </motion.button>
//       </RideBottomSheet>

//       <ShareRideSheet
//         open={shareOpen}
//         onClose={() => setShareOpen(false)}
//         rideId={rideId}
//         driver={ride.driver}
//         pickup={pickup}
//         destination={destination}
//         eta={undefined}
//       />

//       <CancelRideSheet
//         open={cancelOpen}
//         onClose={() => {
//           if (!cancelling) setCancelOpen(false);
//         }}
//         onConfirm={handleCancel}
//       />
//     </div>
//   );
// }




