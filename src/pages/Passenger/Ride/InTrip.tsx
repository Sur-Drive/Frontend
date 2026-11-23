import {
  Clock3,
  MapPin,
  Route,
  Share2,
  ShieldCheck,
  Wifi,
  WifiOff,
  RefreshCw,
  LoaderCircle,
  UserRound,
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
import ShareRideSheet from "../../../components/passenger/ride/ShareRideSheet";

import {
  usePassengerRide,
} from "../../../context/PassengerRideContext";

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
  useRideSocket,
} from "../../../hooks/passenger/useRideSocket";
import DriverCard from "../../../components/passenger/ride/DriverCard";

import {
  useRideDriverDetails,
} from "../../../hooks/passenger/useRideDriverDetails";
import { useDriverJourney } from "../../../hooks/passenger/useDriverJourney";

/* =========================================================
   CONFIGURATION
========================================================= */

const FALLBACK_POLL_INTERVAL = 5000;

const TOKEN_KEY = "passenger_access_token";

/* =========================================================
   HELPERS
========================================================= */

function getPassengerToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

function formatCurrency(value: number): string {
  return `₦${value.toLocaleString("en-NG", {
    maximumFractionDigits: 2,
  })}`;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function InTrip() {
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

  const [shareOpen, setShareOpen] = useState(false);

  const [pollError, setPollError] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);

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

    const {
  driver: driverForCard,
  loading: driverLoading,
  error: driverError,
} = useRideDriverDetails(
  rideId,
  backendRide,
  ride.driver,
);

const dropoffPoint = backendRide?.dropoff
  ? {
      lat: backendRide.dropoff.lat,
      lng: backendRide.dropoff.lng,
    }
  : null;

const journey = useDriverJourney({
  rideId,
  driverId: backendRide?.driverId,
  token,
  destination: dropoffPoint,
  phase: "in-trip",
});

  /* =======================================================
     TOKEN SYNCHRONIZATION
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

     Backend remains the source of truth.
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

      setPollError(false);

      setInitialLoading(false);

      if (response.status !== "cancelled") {
        storeActiveRide(response);
      }

      switch (response.status) {
        /* -----------------------------------------------
           TRIP ACTIVE
        ----------------------------------------------- */

        case "ride_started":
        case "ride_in_progress":
          return;

        /* -----------------------------------------------
           TRIP COMPLETED
        ----------------------------------------------- */

        case "ride_completed":
        case "payment_pending":
        case "paid":
        case "closed":
          navigatingRef.current = true;

          navigate("/passenger/ride/complete", {
            replace: true,
          });

          return;

        /* -----------------------------------------------
           DRIVER ARRIVED
        ----------------------------------------------- */

        case "driver_arrived":
          navigatingRef.current = true;

          setRideStatus("driver-arrived");

          navigate("/passenger/ride/driver-arrived", {
            replace: true,
          });

          return;

        /* -----------------------------------------------
           DRIVER EN ROUTE
        ----------------------------------------------- */

        case "driver_en_route":
          navigatingRef.current = true;

          setRideStatus("driver-en-route");

          navigate("/passenger/ride/driver-en-route", {
            replace: true,
          });

          return;

        /* -----------------------------------------------
           DRIVER ASSIGNED
        ----------------------------------------------- */

        case "driver_assigned":
          navigatingRef.current = true;

          setRideStatus("driver-assigned");

          navigate("/passenger/ride/driver-assigned", {
            replace: true,
          });

          return;

        /* -----------------------------------------------
           SEARCHING
        ----------------------------------------------- */

        case "requested":
        case "searching":
          navigatingRef.current = true;

          setRideStatus("searching");

          navigate("/passenger/ride/searching", {
            replace: true,
          });

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
     WEBSOCKET INTEGRATION

     Existing useRideSocket hook handles:
     - Connection
     - Ride subscription
     - Reconnection
     - Ride updates
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
     INITIAL BACKEND REFRESH

     Always validate the ride on page entry.
  ======================================================= */

  useEffect(() => {
    if (!rideId) {
      setInitialLoading(false);
      return;
    }

    let active = true;

    const initializeRide = async () => {
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
            "IN TRIP INITIAL LOAD ERROR:",
            error,
          );

          setPollError(true);
          setInitialLoading(false);
        }
      }
    };

    void initializeRide();

    return () => {
      active = false;
    };
  }, [rideId, handleRideStatus]);

  /* =======================================================
     FALLBACK POLLING

     Only active while WebSocket is disconnected.
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
            "IN TRIP FALLBACK ERROR:",
            error,
          );

          setPollError(true);
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
        "IN TRIP MANUAL REFRESH ERROR:",
        error,
      );

      setPollError(true);

      toast.error(
        "Unable to refresh your trip.",
      );
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
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
     REFRESH-SAFE LOCATIONS

     Restore from backend if React context resets.
  ======================================================= */

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

  const center =
    destination?.coordinates ??
    pickup?.coordinates;

  /* =======================================================
     LOADING / RESTORE STATES
  ======================================================= */

  if (!center || !destination || !pickup) {
    if (initialLoading) {
      return (
        <div className="flex h-[100dvh] items-center justify-center bg-[#F4F4F4]">
          <div className="text-center">
            <LoaderCircle
              size={30}
              className="mx-auto animate-spin text-[#7442AD]"
            />

            <p className="mt-4 text-[14px] text-[#918B95]">
              Restoring your trip...
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#F4F4F4] px-6">
        <div className="w-full max-w-[360px] text-center">
          <MapPin
            size={32}
            className="mx-auto text-[#7442AD]"
          />

          <h2 className="mt-4 text-[18px] font-semibold text-[#302B34]">
            Unable to load trip location
          </h2>

          <p className="mt-2 text-[14px] leading-6 text-[#918B95]">
            Your trip is still saved. Please refresh
            to restore the latest ride information.
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
     TRIP INFORMATION
  ======================================================= */

  const duration =
    backendRide?.actualDurationMin ??
    backendRide?.estimatedDurationMin;

  const distance =
    backendRide?.actualDistanceKm ??
    backendRide?.estimatedDistanceKm;

  const fare =
    backendRide?.finalFare ??
    backendRide?.fareBreakdown?.total ??
    backendRide?.estimatedFare;

  const isFinalFare =
    backendRide?.finalFare != null;

  const connectionLabel = connected
    ? "Live trip updates connected"
    : pollError
      ? "Unable to refresh trip status"
      : socketError
        ? "Using backup connection"
        : "Connecting to live updates...";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">

      {/* ===============================================
          LIVE MAP
      =============================================== */}

      {/* <PassengerMap
        center={center}
        pickup={pickup}
        destination={destination}
        zoom={15}
        interactive
        followMode
        showTraffic
        puckMode="driving"
      /> */}
      <PassengerMap
  center={journey.car ?? dropoffPoint!}
  pickup={pickup}
  destination={destination}
  driverCar={journey.car}
  routePoints={journey.route?.points ?? []}
  fitRoute={Boolean(journey.route)}
  trackDriver
  interactive
  showTraffic
/>

      {/* ===============================================
          MAP HEADER
      =============================================== */}

      <RideMapHeader
        title="Trip in Progress"
        subtitle={
          connected
            ? "Live trip status"
            : "Updating trip status..."
        }
        showMore
      />


      {/* ===============================================
          BOTTOM SHEET
      =============================================== */}

      <RideBottomSheet>

        {/* LIVE STATUS */}

        <div className="flex items-center gap-2">
          <motion.span
            animate={{
              scale: [1, 1.25, 1],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
            }}
            className="h-2.5 w-2.5 rounded-full bg-[#2E9B61]"
          />

          <p className="text-[16px] font-semibold text-[#302B34]">
            You're on your way
          </p>
        </div>

        <p className="mt-1 text-[13px] text-[#918B95]">
          Your trip is currently in progress.
        </p>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
    On your way to your destination
  </p>

  <p className="mt-2 text-2xl font-semibold text-[#7442AD]">
    {journey.etaMinutes != null
      ? `${Math.ceil(journey.etaMinutes)} min remaining`
      : "Calculating arrival"}
  </p>

  {journey.distanceKm != null && (
    <p className="mt-1 text-sm text-gray-500">
      {journey.distanceKm.toFixed(1)} km remaining
    </p>
  )}
</div>

        {/* =========================================
            DESTINATION
        ========================================= */}

        <div className="mt-5 rounded-[17px] bg-[#F7F5F8] p-4">

          <div className="flex items-start gap-3">

            <MapPin
              size={19}
              className="mt-0.5 shrink-0 text-[#7442AD]"
            />

            <div className="min-w-0">

              <p className="text-[12px] uppercase tracking-[0.07em] text-[#A19AA5]">
                Destination
              </p>

              <p className="mt-1 text-[15px] font-semibold leading-5 text-[#302B34]">
                {destination.label}
              </p>

              {destination.address && (
                <p className="mt-1 text-[13px] leading-5 text-[#918B95]">
                  {destination.address}
                </p>
              )}

            </div>

          </div>

        </div>

        {/* =========================================
            DURATION / DISTANCE
        ========================================= */}

        <div className="grid grid-cols-2 gap-3 mt-4">

          <div className="rounded-[15px] border border-[#EEEAF1] bg-white p-4">

            <Clock3
              size={18}
              className="text-[#7442AD]"
            />

            <p className="mt-3 text-[13px] text-[#918B95]">
              Duration
            </p>

            <p className="mt-1 text-[16px] font-semibold text-[#302B34]">
              {typeof duration === "number"
                ? `${duration} min`
                : "—"}
            </p>

          </div>

          <div className="rounded-[15px] border border-[#EEEAF1] bg-white p-4">

            <Route
              size={18}
              className="text-[#7442AD]"
            />

            <p className="mt-3 text-[13px] text-[#918B95]">
              Distance
            </p>

            <p className="mt-1 text-[16px] font-semibold text-[#302B34]">
              {typeof distance === "number"
                ? `${distance.toFixed(1)} km`
                : "—"}
            </p>

          </div>

        </div>

        {/* =========================================
            DRIVER DETAILS
        ========================================= */}

        <div className="mt-4">
          {driverForCard ? (
            <DriverCard
              driver={driverForCard}
              showActions={false}
            />
          ) : (
            <div className="rounded-[16px] border border-[#EEEAF1] bg-white p-4">
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

        {/* =========================================
            FARE
        ========================================= */}

        {typeof fare === "number" && (
          <div className="mt-4 flex items-center justify-between rounded-[15px] bg-[#F3ECF9] p-4">

            <span className="text-[14px] text-[#756E79]">
              {isFinalFare
                ? "Final fare"
                : "Estimated fare"}
            </span>

            <span className="text-[19px] font-bold text-[#302B34]">
              {formatCurrency(fare)}
            </span>

          </div>
        )}


        {/* =========================================
            SAFETY ACTIONS
        ========================================= */}

        <div className="grid grid-cols-2 gap-3 mt-4">

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() =>
              navigate("/passenger/ride/safety")
            }
            className="flex h-[52px] items-center justify-center gap-2 rounded-[13px] bg-[#F3ECF9] text-[15px] font-semibold text-[#7442AD]"
          >
            <ShieldCheck size={19} />
            Safety
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => setShareOpen(true)}
            className="flex h-[52px] items-center justify-center gap-2 rounded-[13px] bg-[#F3ECF9] text-[15px] font-semibold text-[#7442AD]"
          >
            <Share2 size={19} />
            Share Trip
          </motion.button>

        </div>

        {/* =========================================
            CONNECTION STATUS
        ========================================= */}

        <div className="mt-4 flex items-center justify-between gap-3 rounded-[13px] bg-[#F8F7FA] px-3 py-2.5">

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
                  pollError
                    ? "shrink-0 text-[#D05B5B]"
                    : "shrink-0 text-[#D6A044]"
                }
              />
            )}

            <p
              className={`truncate text-[12px] font-medium ${
                connected
                  ? "text-[#3C9A65]"
                  : pollError
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

      </RideBottomSheet>

      {/* ===============================================
          SHARE RIDE
      =============================================== */}

      <ShareRideSheet
  open={shareOpen}
  onClose={() => setShareOpen(false)}
  rideId={rideId}
  driver={driverForCard ?? ride.driver}
  pickup={pickup}
  destination={destination}
  eta={
    typeof duration === "number"
      ? `${duration} min`
      : undefined
  }
/>

    </div>
  );
}

