"use client";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  WifiOff,
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

import {
  passengerRideApi,
  type PassengerRideResponse,
  type PickupDetailsResponse,
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
import { useRideDriverDetails } from
  "../../../hooks/passenger/useRideDriverDetails";

/* =========================================================
   CONFIG
========================================================= */

const FALLBACK_POLL_INTERVAL = 5000;

const PICKUP_DETAILS_INTERVAL = 5000;

const TOKEN_KEY = "passenger_access_token";

/* =========================================================
   TYPES
========================================================= */

type VerificationStage =
  | "ready"
  | "verifying"
  | "verified";

/* =========================================================
   HELPERS
========================================================= */

function getPassengerToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

// function extractPickupCode(
//   details: PickupDetailsResponse | null,
// ): string | null {
//   if (!details) {
//     return null;
//   }

//   const value =
//     details.pickupCode ??
//     details.code ??
//     details.verificationCode ??
//     details.pin;

//   if (
//     typeof value === "string" ||
//     typeof value === "number"
//   ) {
//     return String(value);
//   }

//   return null;
// }

function extractPickupCode(
  details: PickupDetailsResponse | null,
): string | null {
  if (!details) return null;

  // Pickup code is optional.
  if (details.pickupCodeRequired !== true) {
    return null;
  }

  const code = details.pickupCode;

  if (typeof code === "string" && code.trim()) {
    return code.trim();
  }

  return null;
}


function getDriverInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/* =========================================================
   COMPONENT
========================================================= */

export default function VerifyRide() {
  const navigate = useNavigate();

  const {
    ride,
    setRideStatus,
    setVerificationCode,
  } = usePassengerRide();

  /* =======================================================
     STATE
  ======================================================= */

  const [backendRide, setBackendRide] =
    useState<PassengerRideResponse | null>(
      () => getStoredActiveRide(),
    );

  const [details, setDetails] =
    useState<PickupDetailsResponse | null>(null);

  const [token, setToken] =
    useState<string | null>(getPassengerToken);

  const [loading, setLoading] = useState(true);

  const [detailsError, setDetailsError] =
    useState(false);

  const [rideError, setRideError] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [stage, setStage] =
    useState<VerificationStage>("ready");

  const [confirmed, setConfirmed] =
    useState(false);

  /* =======================================================
     REFS
  ======================================================= */

  const navigatingRef = useRef(false);

  const rideRequestRef = useRef(false);

  const detailsRequestRef = useRef(false);

  const mountedRef = useRef(true);

  /* =======================================================
     ACTIVE RIDE
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

  const code = extractPickupCode(details);

  const verified =
    details?.pickupCodeVerified === true;

  const locked =
    details?.pickupCodeLocked === true;

    useEffect(() => {
  if (
    details?.pickupCodeRequired === false &&
    backendRide?.status === "driver_arrived" &&
    !navigatingRef.current
  ) {
    navigate("/passenger/ride/driver-arrived", {
      replace: true,
    });
  }
}, [
  details?.pickupCodeRequired,
  backendRide?.status,
  navigate,
]);

  /* =======================================================
     TOKEN SYNC
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

      setRideError(false);

      if (response.status !== "cancelled") {
        storeActiveRide(response);
      }

      switch (response.status) {
        case "driver_arrived":
          setRideStatus("driver-arrived");
          return;

        case "ride_started":
        case "ride_in_progress":
          navigatingRef.current = true;

          navigate(
            "/passenger/ride/in-trip",
            { replace: true },
          );
          return;

        case "ride_completed":
        case "payment_pending":
        case "paid":
        case "closed":
          navigatingRef.current = true;

          navigate(
            "/passenger/ride/complete",
            { replace: true },
          );
          return;

        case "driver_assigned":
          navigatingRef.current = true;

          setRideStatus("driver-assigned");

          navigate(
            "/passenger/ride/driver-assigned",
            { replace: true },
          );
          return;

        case "driver_en_route":
          navigatingRef.current = true;

          setRideStatus("driver-en-route");

          navigate(
            "/passenger/ride/driver-en-route",
            { replace: true },
          );
          return;

        case "requested":
        case "searching":
          navigatingRef.current = true;

          setRideStatus("searching");

          navigate(
            "/passenger/ride/searching",
            { replace: true },
          );
          return;

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

        case "no_drivers_found":
          navigatingRef.current = true;

          clearActiveRide();

          setRideStatus("idle");

          toast.error(
            "This ride is no longer active.",
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
    [navigate, setRideStatus],
  );

  /* =======================================================
     WEBSOCKET

     Receives ride status changes.
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
     FETCH PICKUP DETAILS

     Verification state is always read from backend.
  ======================================================= */

  const fetchPickupDetails = useCallback(
    async () => {
      if (
        !rideId ||
        detailsRequestRef.current ||
        navigatingRef.current
      ) {
        return;
      }

      detailsRequestRef.current = true;

      try {
        const response =
          await passengerRideApi.getPickupDetails(
            rideId,
          );

        if (
          !mountedRef.current ||
          navigatingRef.current
        ) {
          return;
        }

        setDetails(response);

        setDetailsError(false);

        const nextCode =
          extractPickupCode(response);

        if (nextCode) {
          setVerificationCode(nextCode);
        }

        if (
          response.pickupCodeVerified === true
        ) {
          setStage("verified");
        }
      } catch (error) {
        if (mountedRef.current) {
          console.error(
            "PICKUP DETAILS ERROR:",
            error,
          );

          setDetailsError(true);
        }
      } finally {
        detailsRequestRef.current = false;

        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [rideId, setVerificationCode],
  );

  /* =======================================================
     INITIAL LOAD

     Restore both ride and PIN after refresh.
  ======================================================= */

  useEffect(() => {
    if (!rideId) {
      return;
    }

    let active = true;

    const initialize = async () => {
      try {
        const response =
          await passengerRideApi.getRide(
            rideId,
          );

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
            "VERIFY RIDE INITIAL LOAD ERROR:",
            error,
          );

          setRideError(true);
        }
      }

      if (active) {
        await fetchPickupDetails();
      }
    };

    void initialize();

    return () => {
      active = false;
    };
  }, [
    rideId,
    handleRideStatus,
    fetchPickupDetails,
  ]);

  /* =======================================================
     FALLBACK RIDE POLLING

     Runs only when WebSocket is disconnected.
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

    const refreshRide = async () => {
      if (
        !active ||
        rideRequestRef.current ||
        navigatingRef.current
      ) {
        return;
      }

      rideRequestRef.current = true;

      try {
        const response =
          await passengerRideApi.getRide(
            rideId,
          );

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
            "VERIFY RIDE FALLBACK ERROR:",
            error,
          );

          setRideError(true);
        }
      } finally {
        rideRequestRef.current = false;
      }
    };

    void refreshRide();

    const interval = window.setInterval(
      () => {
        void refreshRide();
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
     PICKUP VERIFICATION POLLING

     Separate from ride polling.

     Required because the backend may update
     pickupCodeVerified without emitting a socket event.
  ======================================================= */

  useEffect(() => {
    if (
      !rideId ||
      verified ||
      navigatingRef.current
    ) {
      return;
    }

    const interval = window.setInterval(
      () => {
        void fetchPickupDetails();
      },
      PICKUP_DETAILS_INTERVAL,
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [
    rideId,
    verified,
    fetchPickupDetails,
  ]);

  /* =======================================================
     SYNC VERIFIED STATE
  ======================================================= */

  useEffect(() => {
    if (verified) {
      setStage("verified");
    }
  }, [verified]);

  /* =======================================================
     CONFIRM PIN SHARED

     Does NOT start the trip.

     Driver verifies PIN through backend.
  ======================================================= */

  const confirmAndWait = () => {
    if (!code) {
      toast.error(
        "Pickup code is not available yet.",
      );
      return;
    }

    if (locked) {
      toast.error(
        "This pickup code is locked.",
      );
      return;
    }

    setConfirmed(true);

    setStage("verifying");

    void fetchPickupDetails();
  };

  /* =======================================================
     MANUAL REFRESH
  ======================================================= */

  const refreshVerification = async () => {
    if (
      !rideId ||
      refreshing ||
      navigatingRef.current
    ) {
      return;
    }

    setRefreshing(true);

    try {
      const [rideResponse] =
        await Promise.all([
          passengerRideApi.getRide(rideId),
          fetchPickupDetails(),
        ]);

      if (!navigatingRef.current) {
        handleRideStatus(rideResponse);
      }
    } catch (error) {
      console.error(
        "VERIFY RIDE REFRESH ERROR:",
        error,
      );

      toast.error(
        "Unable to refresh verification.",
      );
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  };

  /* =======================================================
     REGENERATE PIN
  ======================================================= */

  const regenerateCode = async () => {
    if (
      !rideId ||
      refreshing ||
      verified ||
      locked ||
      navigatingRef.current
    ) {
      return;
    }

    setRefreshing(true);

    try {
      const response =
        await passengerRideApi.regeneratePickupCode(
          rideId,
        );

      if (
        !mountedRef.current ||
        navigatingRef.current
      ) {
        return;
      }

      setDetails(response);

      const nextCode =
        extractPickupCode(response);

      if (nextCode) {
        setVerificationCode(nextCode);
      }

      setConfirmed(false);

      setStage("ready");

      toast.success(
        "Pickup code refreshed.",
      );
    } catch (error) {
      console.error(
        "REGENERATE PICKUP CODE ERROR:",
        error,
      );

      toast.error(
        "Unable to regenerate pickup code.",
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
   DRIVER DETAILS

   Use the same backend-backed driver information
   as Driver Arrived, Driver En Route, and In Trip.
======================================================= */

const driverName =
  driverForCard?.firstName ||
  "Your driver";

const driverPhoto =
  driverForCard?.photo || "";

const driverInitials =
  getDriverInitials(driverName);

const vehicleName =
  [
    driverForCard?.vehicle?.color,
    driverForCard?.vehicle?.make,
    driverForCard?.vehicle?.model,
  ]
    .filter(Boolean)
    .join(" ") ||
  "Vehicle details updating";

const vehiclePlate =
  driverForCard?.vehicle?.plateNumber ||
  "";

const vehicleSubtitle = vehiclePlate
  ? `${vehicleName} · ${vehiclePlate}`
  : vehicleName;

  /* =======================================================
     DRIVER DETAILS

     Restore from backend after refresh.
  ======================================================= */

  // const backendDriver =
  //   backendRide?.driver;

  // const vehicle =
  //   backendRide?.vehicle;

  // const driverName =
  //   backendDriver?.fullName?.trim() ||
  //   [
  //     backendDriver?.firstName,
  //     backendDriver?.lastName,
  //   ]
  //     .filter(Boolean)
  //     .join(" ") ||
  //   ride.driver?.firstName ||
  //   "Your driver";

  // const driverPhoto =
  //   backendDriver?.profilePicture ||
  //   ride.driver?.photo ||
  //   "";

  // const driverInitials =
  //   getDriverInitials(driverName);

  // const vehicleName =
  //   [
  //     vehicle?.color,
  //     vehicle?.make,
  //     vehicle?.model,
  //   ]
  //     .filter(Boolean)
  //     .join(" ") ||
  //   [
  //     ride.driver?.vehicle?.color,
  //     ride.driver?.vehicle?.make,
  //     ride.driver?.vehicle?.model,
  //   ]
  //     .filter(Boolean)
  //     .join(" ") ||
  //   "Vehicle details updating";

  // const vehiclePlate =
  //   vehicle?.plateNumber ??
  //   vehicle?.registrationNumber ??
  //   ride.driver?.vehicle?.plateNumber ??
  //   "";

  // const vehicleSubtitle =
  //   vehiclePlate
  //     ? `${vehicleName} · ${vehiclePlate}`
  //     : vehicleName;

  const currentStage: VerificationStage =
    verified
      ? "verified"
      : stage;

  const isReady =
    currentStage === "ready";

  const isVerifying =
    currentStage === "verifying";

  const isVerified =
    currentStage === "verified";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-[100dvh] bg-white text-[#302B34]">

      <main className="mx-auto flex min-h-[100dvh] w-full max-w-[520px] flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-6 sm:px-7">

        {/* =========================================
            HEADER
        ========================================= */}

        <div className="relative flex h-[50px] items-center justify-center">

          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#302B34] shadow-[0_4px_18px_rgba(0,0,0,0.06)]"
          >
            <ArrowLeft size={20} />
          </button>

          <h1 className="text-[17px] font-semibold">
            Verify Your Ride
          </h1>

        </div>

        {/* =========================================
            DRIVER PROFILE
        ========================================= */}

        {/* <div className="flex flex-col items-center mt-5 text-center">

          <div className="flex h-[82px] w-[82px] items-center justify-center overflow-hidden rounded-full border-[2px] border-[#E9AF27] bg-[#F3ECF9]">

            {driverPhoto ? (
              <img
                src={driverPhoto}
                alt={driverName}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-[23px] font-semibold text-[#7442AD]">
                {driverInitials}
              </span>
            )}

          </div>

          <h2 className="mt-3 text-[17px] font-semibold text-[#302B34]">
            {driverName}
          </h2>

          <p className="mt-1 max-w-full truncate text-[12px] text-[#777080]">
            {vehicleSubtitle}
          </p>

        </div> */}
        {/* =========================================
    DRIVER PROFILE
========================================= */}

<div className="flex flex-col items-center mt-5 text-center">

  <div className="flex h-[82px] w-[82px] items-center justify-center overflow-hidden rounded-full border-[2px] border-[#E9AF27] bg-[#F3ECF9]">

    {driverPhoto ? (
      <img
        src={driverPhoto}
        alt={driverName}
        className="object-cover w-full h-full"
      />
    ) : driverLoading && !driverForCard ? (
      <LoaderCircle
        size={25}
        className="animate-spin text-[#7442AD]"
      />
    ) : (
      <span className="text-[23px] font-semibold text-[#7442AD]">
        {driverInitials}
      </span>
    )}

  </div>

  <h2 className="mt-3 text-[17px] font-semibold text-[#302B34]">
    {driverLoading && !driverForCard
      ? "Loading driver details..."
      : driverName}
  </h2>

  <p className="mt-1 max-w-full truncate text-[12px] text-[#777080]">
    {vehicleSubtitle}
  </p>

  {driverError && !driverForCard && (
    <p className="mt-2 text-[11px] text-[#B9862C]">
      Driver information is temporarily unavailable.
    </p>
  )}

</div>

        {/* =========================================
            CONNECTION NOTICE

            Only shown if updates fail.
        ========================================= */}

        {(rideError || detailsError) && (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-[12px] bg-[#FFF6E4] px-3 py-2.5">

            <div className="flex items-center gap-2">

              <WifiOff
                size={16}
                className="shrink-0 text-[#B9862C]"
              />

              <p className="text-[12px] text-[#946E2C]">
                {connected
                  ? "Unable to refresh verification status."
                  : "Connection interrupted. Retrying automatically."}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                void refreshVerification()
              }
              disabled={refreshing}
              className="shrink-0 text-[#7442AD] disabled:opacity-50"
              aria-label="Retry verification refresh"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
            </button>

          </div>
        )}

        {/* =========================================
            VERIFICATION CONTENT
        ========================================= */}

        <AnimatePresence mode="wait">

          {/* =====================================
              LOADING
          ===================================== */}

          {loading && !details ? (

            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 mt-12"
            >

              <LoaderCircle
                size={32}
                className="animate-spin text-[#7442AD]"
              />

              <p className="text-[13px] text-[#918B95]">
                Loading your secure pickup PIN...
              </p>

            </motion.div>

          ) : isReady ? (

            /* =====================================
                READY STATE
            ===================================== */

            <motion.div
              key="ready"
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              className="mt-7"
            >

              <p className="text-center text-[12px] font-bold uppercase tracking-[0.04em] text-[#7442AD]">
                Share this PIN to start trip
              </p>

              {/* PIN DIGITS */}

              <div className="mt-3 flex justify-center gap-2.5">

                {code ? (
                  code.split("").map(
                    (digit, index) => (
                      <motion.div
                        key={`${index}-${digit}`}
                        initial={{
                          opacity: 0,
                          y: 8,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay: index * 0.05,
                        }}
                        className="flex h-[60px] min-w-0 flex-1 max-w-[70px] items-center justify-center rounded-[12px] bg-[#F0E8F7] text-[28px] font-bold text-[#7442AD]"
                      >
                        {digit}
                      </motion.div>
                    ),
                  )
                ) : (
                  <div className="w-full rounded-[12px] bg-[#FFF6E4] p-4 text-center text-[13px] text-[#946E2C]">
                    Pickup PIN unavailable.
                    Please refresh and try again.
                  </div>
                )}

              </div>

              <p className="mt-4 text-center text-[12px] leading-5 text-[#777080]">
                Do not board if the vehicle model,
                plate number, or driver does not match.
              </p>

              {/* SAFETY NOTICE */}

              <div className="mt-6 flex items-center gap-3 rounded-[13px] bg-[#F8F3E7] p-4">

                <ShieldCheck
                  size={19}
                  className="shrink-0 text-[#E9AF27]"
                />

                <p className="text-[12px] leading-5 text-[#B98A34]">
                  This verification ensures you are
                  boarding the correct SUR-DRIVE
                  licensed vehicle.
                </p>

              </div>

              {locked && (
                <div className="mt-4 flex items-start gap-2 rounded-[12px] bg-[#FFF0ED] p-3 text-[#BD5949]">

                  <AlertTriangle
                    size={17}
                    className="mt-0.5 shrink-0"
                  />

                  <p className="text-[12px] leading-5">
                    This pickup PIN is locked.
                    Contact support for assistance.
                  </p>

                </div>
              )}

              {/* REGENERATE */}

              {!locked && (
                <button
                  type="button"
                  onClick={() =>
                    void regenerateCode()
                  }
                  disabled={refreshing}
                  className="mx-auto mt-5 flex items-center gap-2 text-[13px] font-medium text-[#7442AD] disabled:opacity-50"
                >

                  <RefreshCw
                    size={15}
                    className={
                      refreshing
                        ? "animate-spin"
                        : ""
                    }
                  />

                  Regenerate PIN

                </button>
              )}

            </motion.div>

          ) : isVerifying ? (

            /* =====================================
                VERIFYING STATE
            ===================================== */

            <motion.div
              key="verifying"
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              className="flex flex-col items-center mt-10 text-center"
            >

              {/* ANIMATED VERIFICATION ICON */}

              <div className="relative flex h-[92px] w-[92px] items-center justify-center">

                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 rounded-full border-[8px] border-[#F0E8F7] border-t-[#7442AD]"
                />

                <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-[#E9DCF4]">

                  <div className="flex h-[43px] w-[43px] items-center justify-center rounded-full bg-[#7442AD] text-white">
                    <RefreshCw
                      size={20}
                      className="animate-spin"
                    />
                  </div>

                </div>

              </div>

              <p className="mt-5 text-[15px] font-semibold text-[#7442AD]">
                Verifying your code...
              </p>

              <p className="mt-1 text-[12px] text-[#777080]">
                Waiting for {driverName} to enter the PIN.
              </p>

              {/* DISABLED PIN */}

              <p className="mt-8 text-[11px] font-medium uppercase tracking-wide text-[#B1A7BA]">
                PIN shared with driver
              </p>

              <div className="mt-3 flex w-full justify-center gap-2.5">

                {code?.split("").map(
                  (digit, index) => (
                    <div
                      key={`${index}-${digit}`}
                      className="flex h-[54px] min-w-0 flex-1 max-w-[70px] items-center justify-center rounded-[11px] bg-[#F6F3F9] text-[25px] font-bold text-[#C9B7DB]"
                    >
                      {digit}
                    </div>
                  ),
                )}

              </div>

              {/* SAFETY NOTICE */}

              <div className="mt-8 flex w-full items-center gap-3 rounded-[13px] bg-[#F8F3E7] p-4 text-left">

                <ShieldCheck
                  size={19}
                  className="shrink-0 text-[#E9AF27]"
                />

                <p className="text-[12px] leading-5 text-[#B98A34]">
                  This verification ensures you are
                  boarding the correct SUR-DRIVE
                  licensed vehicle.
                </p>

              </div>

            </motion.div>

          ) : (

            /* =====================================
                VERIFIED STATE
            ===================================== */

            <motion.div
              key="verified"
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="flex flex-col items-center mt-10 text-center"
            >

              {/* VERIFIED ICON */}

              <div className="flex h-[92px] w-[92px] items-center justify-center rounded-full bg-[#F0E8F7]">

                <div className="flex h-[67px] w-[67px] items-center justify-center rounded-full bg-[#E3D2F1]">

                  <motion.div
                    initial={{
                      scale: 0.5,
                    }}
                    animate={{
                      scale: 1,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 18,
                    }}
                    className="flex h-[47px] w-[47px] items-center justify-center rounded-full bg-[#7442AD] text-white"
                  >

                    <Check
                      size={26}
                      strokeWidth={2.5}
                    />

                  </motion.div>

                </div>

              </div>

              <p className="mt-5 text-[15px] font-semibold text-[#7442AD]">
                Code Verified!
              </p>

              <p className="mt-1 text-[12px] text-[#777080]">
                Your ride has been confirmed.
              </p>

              {/* VERIFIED PIN */}

              <p className="mt-8 text-[11px] font-medium uppercase tracking-wide text-[#B1A7BA]">
                PIN shared with driver
              </p>

              <div className="mt-3 flex w-full justify-center gap-2.5">

                {code?.split("").map(
                  (digit, index) => (
                    <div
                      key={`${index}-${digit}`}
                      className="flex h-[54px] min-w-0 flex-1 max-w-[70px] items-center justify-center rounded-[11px] bg-[#F6F3F9] text-[25px] font-bold text-[#C9B7DB]"
                    >
                      {digit}
                    </div>
                  ),
                )}

              </div>

              {/* SAFETY NOTICE */}

              <div className="mt-8 flex w-full items-center gap-3 rounded-[13px] bg-[#F8F3E7] p-4 text-left">

                <ShieldCheck
                  size={19}
                  className="shrink-0 text-[#E9AF27]"
                />

                <p className="text-[12px] leading-5 text-[#B98A34]">
                  This verification ensures you are
                  boarding the correct SUR-DRIVE
                  licensed vehicle.
                </p>

              </div>

            </motion.div>

          )}

        </AnimatePresence>

        {/* =========================================
            BOTTOM ACTION
        ========================================= */}

        <div className="pt-8 mt-auto">

          {isReady ? (

            <motion.button
              type="button"
              whileTap={{
                scale: 0.98,
              }}
              onClick={confirmAndWait}
              disabled={
                !code ||
                locked ||
                loading
              }
              className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#7442AD] text-[15px] font-semibold text-white shadow-[0_6px_15px_rgba(116,66,173,0.24)] disabled:opacity-50"
            >
              {/* Confirm & Start Trip */}
              I've Shared My Code
            </motion.button>

          ) : isVerifying ? (

            <div className="flex h-[54px] items-center justify-center gap-2 rounded-[13px] bg-[#7442AD] text-[14px] font-semibold text-white">

              <LoaderCircle
                size={19}
                className="animate-spin"
              />

              Waiting for driver verification

            </div>

          ) : (

            <div className="flex h-[54px] items-center justify-center gap-2 rounded-[13px] bg-[#7442AD] text-[14px] font-semibold text-white">

              <CheckCircle2 size={19} />

              Verified — waiting for trip to start

            </div>

          )}

        </div>

        {/* OPTIONAL CONNECTION DETAIL */}

        {!connected && socketError && (
          <p className="mt-3 text-center text-[11px] text-[#A39AAA]">
            Live connection unavailable.
            Backup updates are active.
          </p>
        )}

      </main>

    </div>
  );
}

