"use client";

import {
  CheckCircle2,
  ChevronRight,
  MapPin,
  ShieldCheck,
  Wifi,
  WifiOff,
  RefreshCw,
  UserRound,
  CarFront,
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
import DriverCard from "../../../components/passenger/ride/DriverCard";

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
import {
  useRideDriverDetails,
} from "../../../hooks/passenger/useRideDriverDetails";

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

/* =========================================================
   COMPONENT
========================================================= */

export default function DriverArrived() {
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

  const [token, setToken] = useState<string | null>(
    getPassengerToken,
  );

  const [refreshError, setRefreshError] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [initialLoading, setInitialLoading] = useState(
    () => !getStoredActiveRide(),
  );

  /* =======================================================
     REFS
  ======================================================= */

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
     HANDLE RIDE STATUS

     Backend is the source of truth.
  ======================================================= */

  const handleRideStatus = useCallback(
    (response: PassengerRideResponse) => {
      if (
        navigatingRef.current ||
        !response?.id
      ) {
        return;
      }

      setBackendRide(response);

      setInitialLoading(false);

      setRefreshError(false);

      if (response.status !== "cancelled") {
        storeActiveRide(response);
      }

      switch (response.status) {
        case "driver_arrived":
          setRideStatus("driver-arrived");
          return;

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
          navigatingRef.current = true;

          setRideStatus("driver-en-route");

          navigate("/passenger/ride/driver-en-route", {
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

          toast.error(
            response.cancellationReason ||
              "This ride has been cancelled.",
          );

          navigate("/passenger/home", {
            replace: true,
          });
          return;

        case "no_drivers_found":
          navigatingRef.current = true;

          clearActiveRide();

          setRideStatus("idle");

          toast.error(
            "This ride is no longer active.",
          );

          navigate("/passenger/home", {
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
     WEBSOCKET

     Uses the existing useRideSocket hook.
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

     Poll every five seconds only when
     the WebSocket is disconnected.
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
            "DRIVER ARRIVED FALLBACK POLLING ERROR:",
            error,
          );

          setRefreshError(true);

          setInitialLoading(false);
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
      isRefreshing ||
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

      handleRideStatus(response);
    } catch (error) {
      console.error(
        "DRIVER ARRIVED REFRESH ERROR:",
        error,
      );

      setRefreshError(true);

      toast.error(
        "Unable to refresh your ride status.",
      );
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
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
     RESTORE PICKUP AND DESTINATION

     Prefer backend data when restoring a ride
     after a browser refresh.
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

  if (!pickup?.coordinates) {
    if (initialLoading) {
      return (
        <div className="flex h-[100dvh] items-center justify-center bg-[#F4F4F4]">
          <div className="text-center">
            <RefreshCw
              size={28}
              className="mx-auto animate-spin text-[#7442AD]"
            />

            <p className="mt-4 text-[14px] text-[#918B95]">
              Restoring your ride details...
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
            Unable to load pickup location
          </h2>

          <p className="mt-2 text-[14px] leading-6 text-[#918B95]">
            Your ride is still saved. Please refresh
            the ride details to continue.
          </p>

          <button
            type="button"
            onClick={refreshRide}
            disabled={isRefreshing}
            className="mt-5 h-[48px] w-full rounded-[12px] bg-[#7442AD] text-[14px] font-semibold text-white disabled:opacity-60"
          >
            {isRefreshing
              ? "Refreshing..."
              : "Refresh Ride"}
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     DRIVER DETAILS

     Restore from backend when context is empty.
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

const vehicle = backendRide?.vehicle;

const vehicleName =
  [
    vehicle?.make,
    vehicle?.model,
  ]
    .filter(Boolean)
    .join(" ") ||
  vehicle?.category?.toUpperCase() ||
  "Vehicle details updating";

const plateNumber =
  vehicle?.plateNumber ??
  "Plate number unavailable";

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

  // const backendDriverForCard: RideDriver | null =
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

  // const driverForCard =
  //   backendDriverForCard ??
  //   ride.driver;

  // const vehicleName =
  //   [
  //     vehicle?.make,
  //     vehicle?.model,
  //   ]
  //     .filter(Boolean)
  //     .join(" ") ||
  //   "Vehicle details updating";

  const vehiclePlate =
    vehicle?.plateNumber ??
    vehicle?.registrationNumber ??
    "";

  const connectionLabel = connected
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
        center={pickup.coordinates}
        pickup={pickup}
        destination={destination}
        zoom={17}
      />

      {/* ===============================================
          HEADER
      =============================================== */}

      <RideMapHeader
        title="Driver Arrived"
        showMore
      />

      {/* ===============================================
          ARRIVAL NOTIFICATION
      =============================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: -16,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 220,
          damping: 20,
        }}
        className="absolute left-4 right-4 top-[90px] z-[500] mx-auto flex max-w-[520px] items-center gap-3 rounded-[18px] bg-[#2E9B61] px-4 py-3.5 text-white shadow-[0_10px_30px_rgba(30,120,70,0.22)]"
      >
        <CheckCircle2
          size={24}
          className="shrink-0"
        />

        <div>
          <p className="text-[16px] font-semibold">
            Your driver has arrived
          </p>

          <p className="mt-0.5 text-[13px] text-white/85">
            Meet your driver at the pickup point.
          </p>
        </div>
      </motion.div>

      {/* ===============================================
          BOTTOM SHEET
      =============================================== */}

      <RideBottomSheet>

        {/* HEADER */}

        <div className="text-center">
          <h1 className="text-[22px] font-semibold text-[#302B34]">
            Your ride is here!
          </h1>

          <p className="mx-auto mt-2 max-w-[360px] text-[14px] leading-6 text-[#918B95]">
            Check the driver and vehicle details
            before boarding.
          </p>
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

          {!connected && (
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
            DRIVER CARD
        ========================================= */}
        {/* <div className="mt-5">
  {driverForCard ? (
    <DriverCard
      driver={driverForCard}
      showActions={false}
    />
  ) : (
    <div className="flex items-center gap-3 rounded-[16px] border border-[#EEEAF1] bg-white p-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0E8F8] text-[#7442AD]">
        <UserRound size={23} />
      </div>

      <div className="flex-1">
        <p className="text-[14px] font-semibold text-[#302B34]">
          Your driver has arrived
        </p>

        <p className="mt-1 text-[12px] text-[#918B95]">
          {driverLoading
            ? "Loading driver information..."
            : driverError
              ? "Unable to load driver information"
              : "Driver information updating..."}
        </p>
      </div>

      {driverLoading && (
        <LoaderCircle
          size={18}
          className="animate-spin text-[#7442AD]"
        />
      )}
    </div>
  )}
</div> */}

{/* =========================================
    DRIVER & VEHICLE INFORMATION
========================================= */}

<div className="mt-5 space-y-3">

  {/* =======================================
      DRIVER DETAILS AVAILABLE
  ======================================= */}

  {driverForCard ? (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.3,
      }}
    >
      <DriverCard
        driver={driverForCard}
        showActions={false}
      />
    </motion.div>
  ) : (
    <>
      {/* =====================================
          DRIVER LOADING STATE
      ===================================== */}

      <div className="flex items-center gap-3 rounded-[16px] border border-[#EEEAF1] bg-white p-4">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F0E8F8] text-[#7442AD]">
          <UserRound size={23} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-[#302B34]">
            Your driver has arrived
          </p>

          <p className="mt-1 text-[12px] text-[#918B95]">
            {driverLoading
              ? "Loading driver information..."
              : driverError
                ? "Driver details are temporarily unavailable"
                : "Getting your driver details..."}
          </p>
        </div>

        {driverLoading && (
          <LoaderCircle
            size={18}
            className="shrink-0 animate-spin text-[#7442AD]"
          />
        )}

      </div>

      {/* =====================================
          VEHICLE DETAILS

          Show while driver information
          is unavailable.
      ===================================== */}

      {vehicle && (
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
            duration: 0.3,
          }}
          className="rounded-[16px] border border-[#EEEAF1] bg-white p-4"
        >

          <p className="text-[12px] font-semibold uppercase tracking-wider text-[#918B95]">
            Assigned vehicle
          </p>

          <div className="flex items-center justify-between gap-3 mt-3">

            <div className="flex items-center min-w-0 gap-2">

              <CarFront
                size={19}
                className="shrink-0 text-[#7442AD]"
              />

              <p className="truncate text-[15px] font-semibold text-[#302B34]">
                {vehicleName}
              </p>

            </div>

            {vehiclePlate && (
              <span className="shrink-0 rounded-lg bg-[#F3ECF9] px-3 py-2 text-[12px] font-bold text-[#7442AD]">
                {vehiclePlate}
              </span>
            )}

          </div>

          {vehicle.category && (
            <p className="mt-2 text-[12px] text-[#918B95]">
              {vehicle.category}
            </p>
          )}

        </motion.div>
      )}

    </>
  )}

</div>

        {/* =========================================
            ASSIGNED VEHICLE
        ========================================= */}

        {/* {vehicle && (
          <div className="mt-4 rounded-[16px] border border-[#EEEAF1] bg-white p-4">

            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#918B95]">
              Assigned vehicle
            </p>

            <div className="flex items-center justify-between gap-3 mt-2">

              <div className="flex items-center min-w-0 gap-2">

                <CarFront
                  size={19}
                  className="shrink-0 text-[#7442AD]"
                />

                <p className="truncate text-[15px] font-semibold text-[#302B34]">
                  {vehicleName}
                </p>

              </div>

              {vehiclePlate && (
                <span className="shrink-0 rounded-lg bg-[#F3ECF9] px-3 py-2 text-[13px] font-bold text-[#7442AD]">
                  {vehiclePlate}
                </span>
              )}

            </div>

            {vehicle.category && (
              <p className="mt-2 text-[12px] text-[#918B95]">
                {vehicle.category}
              </p>
            )}

          </div>
        )} */}

        {/* =========================================
            PICKUP POINT
        ========================================= */}

        <div className="mt-4 flex items-start gap-3 rounded-[16px] bg-[#F8F6FA] p-4">

          <MapPin
            size={19}
            className="mt-0.5 shrink-0 text-[#7442AD]"
          />

          <div>
            <p className="text-[12px] font-medium text-[#918B95]">
              Pickup point
            </p>

            <p className="mt-1 text-[15px] font-semibold text-[#302B34]">
              {pickup.label}
            </p>

            {pickup.address && (
              <p className="mt-1 text-[13px] leading-5 text-[#918B95]">
                {pickup.address}
              </p>
            )}
          </div>

        </div>

        {/* =========================================
            SAFETY NOTICE
        ========================================= */}

        <div className="mt-4 flex gap-3 rounded-[15px] bg-[#EFF8F2] p-4 text-[#397052]">

          <ShieldCheck
            size={21}
            className="shrink-0"
          />

          <p className="text-[13px] leading-5">
            Your driver must verify the pickup code
            before starting the trip.
          </p>

        </div>

        {/* =========================================
            VIEW PICKUP CODE
        ========================================= */}

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() =>
            navigate("/passenger/ride/verify")
          }
          className="mt-5 flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white shadow-[0_8px_25px_rgba(116,66,173,0.20)]"
        >
          View Pickup Code

          <ChevronRight size={19} />
        </motion.button>

      </RideBottomSheet>

    </div>
  );
}

// import { CheckCircle2, ChevronRight, MapPin, ShieldCheck } from "lucide-react";
// import { motion } from "framer-motion";
// import { useEffect, useState } from "react";
// import { Navigate, useNavigate } from "react-router-dom";
// import { toast } from "sonner";

// import PassengerMap from "../../../components/passenger/ride/PassengerMap";
// import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
// import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";
// import DriverCard from "../../../components/passenger/ride/DriverCard";
// import { usePassengerRide } from "../../../context/PassengerRideContext";
// import { passengerRideApi, type PassengerRideResponse } from "../../../api/passenger/rides";
// import {
//   clearActiveRide,
//   getStoredActiveRide,
//   getStoredActiveRideId,
//   storeActiveRide,
// } from "../../../utils/passengerActiveRide";

// export default function DriverArrived() {
//   const navigate = useNavigate();
//   const { ride, setRideStatus } = usePassengerRide();
//   const [backendRide, setBackendRide] = useState<PassengerRideResponse | null>(
//     () => getStoredActiveRide(),
//   );
//   const rideId = backendRide?.id ?? getStoredActiveRideId();

//   useEffect(() => {
//     if (!rideId) return;
//     let mounted = true;
//     let running = false;
//     let finished = false;

//     const refresh = async () => {
//       if (running || finished) return;
//       running = true;
//       try {
//         const response = await passengerRideApi.getRide(rideId);
//         if (!mounted) return;
//         setBackendRide(response);
//         storeActiveRide(response);
//         const status = response.status;
//         let next: string | null = null;

//         if (status === "ride_started" || status === "ride_in_progress") {
//           setRideStatus("in-progress");
//           next = "/passenger/ride/in-trip";
//         } else if (
//           status === "ride_completed" || status === "payment_pending" ||
//           status === "paid" || status === "closed"
//         ) {
//           next = "/passenger/ride/complete";
//         } else if (status === "driver_assigned" || status === "driver_en_route") {
//           next = "/passenger/ride/driver-en-route";
//         } else if (status === "cancelled" || String(status) === "no_drivers_found") {
//           clearActiveRide();
//           setRideStatus("idle");
//           toast.error(response.cancellationReason || "This ride is no longer active.");
//           next = "/passenger/home";
//         }
//         if (next) {
//           finished = true;
//           navigate(next, { replace: true });
//         }
//       } catch (error) {
//         if (mounted) console.error("DRIVER ARRIVED POLL ERROR:", error);
//       } finally {
//         running = false;
//       }
//     };

//     void refresh();
//     const interval = window.setInterval(() => void refresh(), 4000);
//     return () => {
//       mounted = false;
//       window.clearInterval(interval);
//     };
//   }, [rideId, navigate, setRideStatus]);

//   if (!rideId) return <Navigate to="/passenger/home" replace />;
//   if (!ride.pickup?.coordinates) return <Navigate to="/passenger/book-ride" replace />;

//   return (
//     <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
//       <PassengerMap
//         center={ride.pickup.coordinates}
//         pickup={ride.pickup}
//         destination={ride.destination}
//         zoom={17}
//       />
//       <RideMapHeader title="Driver Arrived" showMore />

//       <motion.div
//         initial={{ opacity: 0, y: -16 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ type: "spring", stiffness: 220, damping: 20 }}
//         className="absolute left-4 right-4 top-[90px] z-[500] mx-auto flex max-w-[520px] items-center gap-3 rounded-[18px] bg-[#2E9B61] px-4 py-3.5 text-white shadow-[0_10px_30px_rgba(30,120,70,0.22)]"
//       >
//         <CheckCircle2 size={24} className="shrink-0" />
//         <div>
//           <p className="text-[16px] font-semibold">Your driver has arrived</p>
//           <p className="mt-0.5 text-[13px] text-white/85">Meet your driver at the pickup point.</p>
//         </div>
//       </motion.div>

//       <RideBottomSheet>
//         <div className="text-center">
//           <h1 className="text-[22px] font-semibold text-[#302B34]">Your ride is here!</h1>
//           <p className="mx-auto mt-2 max-w-[360px] text-[14px] leading-6 text-[#918B95]">
//             Check the driver and vehicle details before boarding.
//           </p>
//         </div>

//         {ride.driver && (
//           <div className="mt-5">
//             <DriverCard driver={ride.driver} showActions={false} />
//           </div>
//         )}

//         {backendRide?.vehicle && (
//           <div className="mt-4 rounded-[16px] border border-[#EEEAF1] bg-white p-4">
//             <p className="text-[12px] font-semibold uppercase tracking-wider text-[#918B95]">Assigned vehicle</p>
//             <div className="flex items-center justify-between gap-3 mt-2">
//               <p className="text-[15px] font-semibold text-[#302B34]">
//                 {backendRide.vehicle.model} · {backendRide.vehicle.category}
//               </p>
//               <span className="rounded-lg bg-[#F3ECF9] px-3 py-2 text-[13px] font-bold text-[#7442AD]">
//                 {backendRide.vehicle.plateNumber}
//               </span>
//             </div>
//           </div>
//         )}

//         <div className="mt-4 flex items-start gap-3 rounded-[16px] bg-[#F8F6FA] p-4">
//           <MapPin size={19} className="mt-0.5 shrink-0 text-[#7442AD]" />
//           <div>
//             <p className="text-[12px] font-medium text-[#918B95]">Pickup point</p>
//             <p className="mt-1 text-[15px] font-semibold text-[#302B34]">{ride.pickup.label}</p>
//             {ride.pickup.address && (
//               <p className="mt-1 text-[13px] leading-5 text-[#918B95]">{ride.pickup.address}</p>
//             )}
//           </div>
//         </div>

//         <div className="mt-4 flex gap-3 rounded-[15px] bg-[#EFF8F2] p-4 text-[#397052]">
//           <ShieldCheck size={21} className="shrink-0" />
//           <p className="text-[13px] leading-5">
//             Your driver must verify the pickup code before starting the trip.
//           </p>
//         </div>

//         <motion.button
//           type="button"
//           whileTap={{ scale: 0.98 }}
//           onClick={() => navigate("/passenger/ride/verify")}
//           className="mt-5 flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white shadow-[0_8px_25px_rgba(116,66,173,0.20)]"
//         >
//           View Pickup Code <ChevronRight size={19} />
//         </motion.button>
//       </RideBottomSheet>
//     </div>
//   );
// }


