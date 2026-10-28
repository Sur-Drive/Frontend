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

function extractPickupCode(
  details: PickupDetailsResponse | null,
): string | null {
  if (!details) {
    return null;
  }

  const value =
    details.pickupCode ??
    details.code ??
    details.verificationCode ??
    details.pin;

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
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

  const code = extractPickupCode(details);

  const verified =
    details?.pickupCodeVerified === true;

  const locked =
    details?.pickupCodeLocked === true;

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

     Restore from backend after refresh.
  ======================================================= */

  const backendDriver =
    backendRide?.driver;

  const vehicle =
    backendRide?.vehicle;

  const driverName =
    backendDriver?.fullName?.trim() ||
    [
      backendDriver?.firstName,
      backendDriver?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    ride.driver?.firstName ||
    "Your driver";

  const driverPhoto =
    backendDriver?.profilePicture ||
    ride.driver?.photo ||
    "";

  const driverInitials =
    getDriverInitials(driverName);

  const vehicleName =
    [
      vehicle?.color,
      vehicle?.make,
      vehicle?.model,
    ]
      .filter(Boolean)
      .join(" ") ||
    [
      ride.driver?.vehicle?.color,
      ride.driver?.vehicle?.make,
      ride.driver?.vehicle?.model,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Vehicle details updating";

  const vehiclePlate =
    vehicle?.plateNumber ??
    vehicle?.registrationNumber ??
    ride.driver?.vehicle?.plateNumber ??
    "";

  const vehicleSubtitle =
    vehiclePlate
      ? `${vehicleName} · ${vehiclePlate}`
      : vehicleName;

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

        <div className="flex flex-col items-center mt-5 text-center">

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
              Confirm & Start Trip
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

// import { AlertTriangle, Check, LoaderCircle, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
// import { AnimatePresence, motion } from "framer-motion";
// import { useEffect, useState } from "react";
// import { Navigate, useNavigate } from "react-router-dom";
// import { toast } from "sonner";

// import RideHeader from "../../../components/passenger/ride/RideHeader";
// import DriverCard from "../../../components/passenger/ride/DriverCard";
// import { usePassengerRide } from "../../../context/PassengerRideContext";
// import {
//   passengerRideApi,
//   type PassengerRideResponse,
//   type PickupDetailsResponse,
// } from "../../../api/passenger/rides";
// import {
//   clearActiveRide,
//   getStoredActiveRide,
//   getStoredActiveRideId,
//   storeActiveRide,
// } from "../../../utils/passengerActiveRide";

// function extractPickupCode(details: PickupDetailsResponse | null): string | null {
//   if (!details) return null;
//   const value = details.pickupCode ?? details.code ?? details.verificationCode ?? details.pin;
//   return typeof value === "string" || typeof value === "number" ? String(value) : null;
// }

// export default function VerifyRide() {
//   const navigate = useNavigate();
//   const { ride, setRideStatus, setVerificationCode } = usePassengerRide();
//   const [backendRide, setBackendRide] = useState<PassengerRideResponse | null>(
//     () => getStoredActiveRide(),
//   );
//   const [details, setDetails] = useState<PickupDetailsResponse | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [regenerating, setRegenerating] = useState(false);
//   const [error, setError] = useState(false);
//   const rideId = backendRide?.id ?? getStoredActiveRideId();
//   const code = extractPickupCode(details);
//   const verified = details?.pickupCodeVerified === true;
//   const locked = details?.pickupCodeLocked === true;

//   useEffect(() => {
//     if (!rideId) return;
//     let mounted = true;
//     let running = false;
//     let finished = false;

//     const refresh = async () => {
//       if (running || finished) return;
//       running = true;
//       try {
//         const [rideResponse, pickupResponse] = await Promise.all([
//           passengerRideApi.getRide(rideId),
//           passengerRideApi.getPickupDetails(rideId),
//         ]);
//         if (!mounted) return;
//         setBackendRide(rideResponse);
//         storeActiveRide(rideResponse);
//         setDetails(pickupResponse);
//         setError(false);
//         if (pickupResponse.pickupCode != null) {
//           setVerificationCode(String(pickupResponse.pickupCode));
//         }

//         const status = rideResponse.status;
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
//           toast.error(rideResponse.cancellationReason || "This ride is no longer active.");
//           next = "/passenger/home";
//         }
//         if (next) {
//           finished = true;
//           navigate(next, { replace: true });
//         }
//       } catch (err) {
//         if (mounted) {
//           console.error("PICKUP VERIFICATION LOAD ERROR:", err);
//           setError(true);
//         }
//       } finally {
//         if (mounted) setLoading(false);
//         running = false;
//       }
//     };

//     void refresh();
//     const interval = window.setInterval(() => void refresh(), 4000);
//     return () => {
//       mounted = false;
//       window.clearInterval(interval);
//     };
//   }, [rideId, navigate, setRideStatus, setVerificationCode]);

//   const regenerateCode = async () => {
//     if (!rideId || regenerating || verified || locked) return;
//     setRegenerating(true);
//     try {
//       const response = await passengerRideApi.regeneratePickupCode(rideId);
//       setDetails(response);
//       const nextCode = extractPickupCode(response);
//       if (nextCode) setVerificationCode(nextCode);
//       toast.success("Pickup code refreshed.");
//     } catch (err) {
//       console.error("REGENERATE PICKUP CODE ERROR:", err);
//       toast.error("Unable to regenerate pickup code.");
//     } finally {
//       setRegenerating(false);
//     }
//   };

//   if (!rideId) return <Navigate to="/passenger/home" replace />;

//   return (
//     <div className="min-h-[100dvh] bg-white text-[#302B34]">
//       <RideHeader title="Verify Your Ride" />
//       <main className="mx-auto flex min-h-[calc(100dvh-64px)] w-full max-w-[520px] flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-5 sm:px-7">
//         <motion.div
//           initial={{ opacity: 0, y: 12 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="text-center"
//         >
//           <span className="mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#F0E8F8] text-[#7442AD]">
//             {verified ? <Check size={34} /> : <LockKeyhole size={30} />}
//           </span>
//           <h1 className="mt-4 text-[23px] font-semibold">
//             {verified ? "Pickup code verified!" : "Share your pickup PIN"}
//           </h1>
//           <p className="mx-auto mt-2 max-w-[380px] text-[14px] leading-6 text-[#918B95]">
//             {verified
//               ? "Your driver has verified the code. Waiting for the trip to begin."
//               : "Only share this PIN with the driver assigned to your ride. The driver enters it to verify pickup."}
//           </p>
//         </motion.div>

//         {ride.driver && (
//           <div className="mt-6">
//             <DriverCard driver={ride.driver} showActions={false} />
//           </div>
//         )}

//         {backendRide?.vehicle && (
//           <div className="mt-4 flex items-center justify-between gap-3 rounded-[15px] bg-[#F8F6FA] p-4">
//             <div>
//               <p className="text-[12px] text-[#918B95]">Vehicle</p>
//               <p className="mt-1 text-[15px] font-semibold">{backendRide.vehicle.model}</p>
//             </div>
//             <span className="rounded-lg border border-[#E5DCEB] bg-white px-3 py-2 text-[14px] font-bold">
//               {backendRide.vehicle.plateNumber}
//             </span>
//           </div>
//         )}

//         <AnimatePresence mode="wait">
//           {loading && !details ? (
//             <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 mt-9">
//               <LoaderCircle size={32} className="animate-spin text-[#7442AD]" />
//               <p className="text-[14px] text-[#918B95]">Loading your secure pickup code...</p>
//             </motion.div>
//           ) : verified ? (
//             <motion.div key="verified" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 text-center">
//               <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E5F7EC] text-[#2E9B61]">
//                 <Check size={32} strokeWidth={3} />
//               </div>
//               <p className="mt-4 text-[16px] font-semibold text-[#2E9B61]">Code verified by driver</p>
//             </motion.div>
//           ) : (
//             <motion.div key="code" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-center">
//               <p className="text-[12px] font-bold uppercase tracking-widest text-[#7442AD]">Your pickup code</p>
//               {code ? (
//                 <div className="mt-4 flex justify-center gap-2.5">
//                   {code.split("").map((digit, index) => (
//                     <motion.div
//                       key={`${index}-${digit}`}
//                       initial={{ opacity: 0, y: 10 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       transition={{ delay: index * 0.05 }}
//                       className="flex h-[60px] min-w-0 flex-1 max-w-[68px] items-center justify-center rounded-[12px] bg-[#F0E8F7] text-[26px] font-bold text-[#7442AD]"
//                     >
//                       {digit}
//                     </motion.div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="mt-4 rounded-[14px] bg-[#FFF6E4] p-4 text-[14px] text-[#7A5A1E]">
//                   Pickup code unavailable. Please try again shortly.
//                 </div>
//               )}
//               {locked && (
//                 <p className="mt-3 text-[13px] font-medium text-[#C25A3C]">This pickup code is locked. Contact support for assistance.</p>
//               )}
//               <p className="mt-4 text-[13px] text-[#918B95]">
//                 Waiting for your driver to verify the code.
//               </p>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {error && (
//           <p className="mt-4 text-center text-[13px] text-[#C25A3C]">
//             Unable to refresh pickup status. Retrying automatically.
//           </p>
//         )}

//         {!verified && !loading && (
//           <motion.button
//             type="button"
//             whileTap={{ scale: 0.98 }}
//             onClick={() => void regenerateCode()}
//             disabled={regenerating || locked}
//             className="mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#F0E8F8] text-[15px] font-semibold text-[#7442AD] disabled:opacity-50"
//           >
//             {regenerating ? <LoaderCircle size={18} className="animate-spin" /> : <RefreshCw size={18} />}
//             Regenerate Code
//           </motion.button>
//         )}

//         <div className="mt-6 flex gap-3 rounded-[16px] bg-[#FFF6E4] p-4 text-[#7A5A1E]">
//           <AlertTriangle size={20} className="mt-0.5 shrink-0" />
//           <p className="text-[13px] leading-5">
//             Do not board if the driver or vehicle details do not match your booking.
//           </p>
//         </div>
//         <div className="mt-3 flex gap-3 rounded-[16px] bg-[#F0F7F2] p-4 text-[#397052]">
//           <ShieldCheck size={20} className="shrink-0" />
//           <p className="text-[13px] leading-5">
//             The trip starts only after the driver completes the required verification and the backend confirms the ride has started.
//           </p>
//         </div>

//         <div className="mt-auto pt-7">
//           <div className="flex h-[54px] items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[15px] font-semibold text-white">
//             {verified ? <Check size={19} /> : <LoaderCircle size={19} className="animate-spin" />}
//             {verified ? "Verified — waiting for trip to start" : "Waiting for driver verification"}
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }


// import {
//     AlertTriangle,
//   Check,
//   LockKeyhole,
//   ShieldCheck,
// } from "lucide-react";

// import {
//   AnimatePresence,
//   motion,
// } from "framer-motion";

// import {
//   Navigate,
//   useNavigate,
// } from "react-router-dom";

// import {
//   useEffect,
//   useRef,
//   useState,
// } from "react";

// import RideHeader from "../../../components/passenger/ride/RideHeader";

// import {
//   usePassengerRide,
// } from "../../../context/PassengerRideContext";

// import {
//   mockAssignedDriver,
// } from "../../../data/passengerRide";
// import DriverCard from "../../../components/passenger/ride/DriverCard";

// type VerificationState =
//   | "ready"
//   | "verifying"
//   | "verified";

// export default function VerifyRide() {
//   const navigate = useNavigate();

//   const {
//     ride,
//     setVerificationCode,
//     setRideStatus,
//   } = usePassengerRide();

//   const [
//     state,
//     setState,
//   ] =
//     useState<VerificationState>(
//       "ready",
//     );

//   const verificationTimer =
//     useRef<number | null>(null);

//   if (!ride.pickup) {
//     return (
//       <Navigate
//         to="/passenger/home"
//         replace
//       />
//     );
//   }

//   const driver =
//     ride.driver ??
//     mockAssignedDriver;

//   const pin =
//     ride.verificationCode ??
//     "4829";

//   const verify = () => {
//     setVerificationCode(pin);

//     setState("verifying");

//     verificationTimer.current =
//       window.setTimeout(() => {
//         setState("verified");
//       }, 1800);
//   };

//   useEffect(() => {
//     return () => {
//       if (
//         verificationTimer.current
//       ) {
//         window.clearTimeout(
//           verificationTimer.current,
//         );
//       }
//     };
//   }, []);

//   const startTrip = () => {
//     setRideStatus(
//       "in-progress",
//     );

//     navigate(
//       "/passenger/ride/trip",
//     );
//   };

//  const vehicleText = `${driver.vehicle.color} ${driver.vehicle.make} ${driver.vehicle.model} • ${driver.vehicle.plateNumber}`;

//   return (
//     <div className="min-h-[100dvh] bg-white text-[#302B34]">
//       <RideHeader
//         title="Verify Your Ride"
//       />

//       <main
//         className="
//           mx-auto
//           flex
//           min-h-[calc(100dvh-64px)]
//           w-full
//           max-w-[520px]
//           flex-col
//           px-5
//           pb-[max(20px,env(safe-area-inset-bottom))]
//           pt-4
//           sm:px-7
//         "
//       >
//         {/* ========================================
//             DRIVER
//         ======================================== */}

//         <section className="text-center">
//           <motion.div
//             initial={{
//               opacity: 0,
//               scale: 0.9,
//             }}
//             animate={{
//               opacity: 1,
//               scale: 1,
//             }}
//             transition={{
//               type: "spring",
//               stiffness: 220,
//               damping: 20,
//             }}
//             className="
//               mx-auto
//               h-[76px]
//               w-[76px]
//               overflow-hidden
//               rounded-full
//               border-[2px]
//               border-[#E5B62D]
//               bg-[#F2F0F4]
//               shadow-[0_5px_18px_rgba(30,20,38,0.10)]
//             "
//           >
//            {driver.photo ? (
//             <img
//                 src={driver.photo}
//                 alt={driver.firstName}
//                 className="object-cover w-full h-full"
//             />
//             ) : (
//               <div className="flex h-full w-full items-center justify-center bg-[#EDE7F2] text-[25px] font-bold text-[#7442AD]">
//                 {driver.firstName
//                   .charAt(0)
//                   .toUpperCase()}
//               </div>
//             )}
//           </motion.div>

         
//         </section>

//         {/* ========================================
//             STATE CONTENT
//         ======================================== */}

//         <div className="mt-5">
//           <AnimatePresence
//             mode="wait"
//             initial={false}
//           >
//             {/* ====================================
//                 READY
//             ==================================== */}

//             {state ===
//               "ready" && (
//               <motion.section
//                 key="ready"
//                 initial={{
//                   opacity: 0,
//                   y: 8,
//                 }}
//                 animate={{
//                   opacity: 1,
//                   y: 0,
//                 }}
//                 exit={{
//                   opacity: 0,
//                   y: -8,
//                 }}
//                 transition={{
//                   duration: 0.2,
//                 }}
//                 className="text-center"
//               >
//                  <DriverCard
//                 driver={driver}
//                 showActions={false}
//               />
//                 <p
//                   className="
//                     text-[13px] mt-4
//                     font-bold
//                     uppercase
//                     tracking-[0.02em]
//                     text-[#7442AD]
//                   "
//                 >
//                   Share this PIN
//                   to start trip
//                 </p>

//                 <PinBoxes
//                   pin={pin}
//                   active
//                 />

//                 <div className="mt-8 flex gap-3 rounded-[16px] bg-[#FFF6E4] p-4 text-[#7A5A1E]">
//                  <AlertTriangle
//                    size={21}
//                    className="mt-0.5 shrink-0"
//                  />

//                  <p className="text-[13px] leading-5">
//                      Do not board if
//                   the vehicle
//                   model, plate
//                   number, or
//                   driver does not
//                   match.
//                  </p>
//                </div>
//               </motion.section>
//             )}

//             {/* ====================================
//                 VERIFYING
//             ==================================== */}

//             {state ===
//               "verifying" && (
//               <motion.section
//                 key="verifying"
//                 initial={{
//                   opacity: 0,
//                 }}
//                 animate={{
//                   opacity: 1,
//                 }}
//                 exit={{
//                   opacity: 0,
//                 }}
//                 className="text-center"
//               >
//                 <VerificationLoader />

//                 <h2
//                   className="
//                     mt-5
//                     text-[17px]
//                     font-semibold
//                     text-[#7442AD]
//                   "
//                 >
//                   Verifying your
//                   code...
//                 </h2>

//                 <p
//                   className="
//                     mt-1.5
//                     text-[15px]
//                     text-[#625C66]
//                   "
//                 >
//                   Waiting for{" "}
//                   {
//                     driver.firstName
//                   }{" "}
//                   to enter the PIN.
//                 </p>

//                 <p
//                   className="
//                     mt-7
//                     text-[13px]
//                     font-semibold
//                     uppercase
//                     tracking-[0.04em]
//                     text-[#AAA3AD]
//                   "
//                 >
//                   PIN shared with
//                   driver
//                 </p>

//                 <PinBoxes
//                   pin={pin}
//                   active={false}
//                 />
//               </motion.section>
//             )}

//             {/* ====================================
//                 VERIFIED
//             ==================================== */}

//             {state ===
//               "verified" && (
//               <motion.section
//                 key="verified"
//                 initial={{
//                   opacity: 0,
//                   scale: 0.96,
//                 }}
//                 animate={{
//                   opacity: 1,
//                   scale: 1,
//                 }}
//                 exit={{
//                   opacity: 0,
//                 }}
//                 transition={{
//                   duration: 0.25,
//                 }}
//                 className="text-center"
//               >
//                 <VerifiedIcon />

//                 <h2
//                   className="
//                     mt-5
//                     text-[17px]
//                     font-semibold
//                     text-[#7442AD]
//                   "
//                 >
//                   Code Verified!
//                 </h2>

//                 <p
//                   className="
//                     mt-1.5
//                     text-[15px]
//                     text-[#625C66]
//                   "
//                 >
//                   Your ride has
//                   been confirmed.
//                 </p>

//                 <p
//                   className="
//                     mt-7
//                     text-[13px]
//                     font-semibold
//                     uppercase
//                     tracking-[0.04em]
//                     text-[#AAA3AD]
//                   "
//                 >
//                   PIN shared with
//                   driver
//                 </p>

//                 <PinBoxes
//                   pin={pin}
//                   active={false}
//                 />
//               </motion.section>
//             )}
//           </AnimatePresence>
//         </div>

//         {/* ========================================
//             VERIFICATION INFO
//         ======================================== */}
//         <div className="mt-4 flex gap-3 rounded-[16px] bg-[#F0F7F2] p-4 text-[#397052]">
//                  <ShieldCheck
//                    size={21}
//                    className="shrink-0"
//                  />

//                  <p className="text-[13px] leading-5">
//                     This verification
//             ensures you are
//             boarding the correct
//             SUR-DRIVE licensed
//             vehicle.
//                  </p>
//                </div>


//         {/* ========================================
//             BOTTOM ACTION
//         ======================================== */}

//         <div className="mt-auto pt-7">
//           <AnimatePresence
//             mode="wait"
//           >
//             {state ===
//               "ready" && (
//               <motion.button
//                 key="verify-button"
//                 type="button"
//                 initial={{
//                   opacity: 0,
//                   y: 10,
//                 }}
//                 animate={{
//                   opacity: 1,
//                   y: 0,
//                 }}
//                 exit={{
//                   opacity: 0,
//                   y: 8,
//                 }}
//                 whileTap={{
//                   scale: 0.985,
//                 }}
//                 onClick={verify}
//                 className="
//                   h-[54px]
//                   w-full
//                   rounded-[9px]
//                   bg-[#7442AD]
//                   text-[15px]
//                   font-semibold
//                   text-white
//                   shadow-[0_8px_18px_rgba(116,66,173,0.22)]
//                 "
//               >
//                 Confirm & Start
//                 Trip
//               </motion.button>
//             )}

//             {state ===
//               "verified" && (
//               <motion.button
//                 key="start-button"
//                 type="button"
//                 initial={{
//                   opacity: 0,
//                   y: 10,
//                 }}
//                 animate={{
//                   opacity: 1,
//                   y: 0,
//                 }}
//                 exit={{
//                   opacity: 0,
//                 }}
//                 whileTap={{
//                   scale: 0.985,
//                 }}
//                 onClick={
//                   startTrip
//                 }
//                 className="
//                   h-[54px]
//                   w-full
//                   rounded-[9px]
//                   bg-[#7442AD]
//                   text-[16px]
//                   font-semibold
//                   text-white
//                   shadow-[0_8px_18px_rgba(116,66,173,0.22)]
//                 "
//               >
//                 Start Trip
//               </motion.button>
//             )}
//           </AnimatePresence>
//         </div>
//       </main>
//     </div>
//   );
// }

// /* ==========================================
//    PIN BOXES
// ========================================== */

// function PinBoxes({
//   pin,
//   active,
// }: {
//   pin: string;
//   active: boolean;
// }) {
//   return (
//     <div className="mt-3 flex justify-center gap-2.5">
//       {pin
//         .split("")
//         .map(
//           (
//             number,
//             index,
//           ) => (
//             <motion.div
//               key={`${number}-${index}`}
//               initial={{
//                 opacity: 0,
//                 y: 6,
//               }}
//               animate={{
//                 opacity: 1,
//                 y: 0,
//               }}
//               transition={{
//                 delay:
//                   index *
//                   0.04,
//               }}
//               className={`
//                 flex
//                 h-[48px]
//                 w-[58px]
//                 items-center
//                 justify-center
//                 rounded-[10px]
//                 text-[24px]
//                 font-bold

//                 ${
//                   active
//                     ? `
//                       bg-[#F0E8F7]
//                       text-[#7442AD]
//                     `
//                     : `
//                       bg-[#F6F1F8]
//                       text-[#C6AED9]
//                     `
//                 }
//               `}
//             >
//               {number}
//             </motion.div>
//           ),
//         )}
//     </div>
//   );
// }

// /* ==========================================
//    VERIFYING ANIMATION
// ========================================== */

// function VerificationLoader() {
//   return (
//     <div
//       className="
//         relative
//         mx-auto
//         flex
//         h-[78px]
//         w-[78px]
//         items-center
//         justify-center
//       "
//     >
//       <motion.span
//         animate={{
//           scale: [
//             0.9,
//             1.2,
//             0.9,
//           ],
//           opacity: [
//             0.45,
//             0.1,
//             0.45,
//           ],
//         }}
//         transition={{
//           duration: 1.7,
//           repeat: Infinity,
//           ease: "easeInOut",
//         }}
//         className="
//           absolute
//           inset-0
//           rounded-full
//           bg-[#EEE5F6]
//         "
//       />

//       <motion.span
//         animate={{
//           scale: [
//             0.92,
//             1.08,
//             0.92,
//           ],
//         }}
//         transition={{
//           duration: 1.3,
//           repeat: Infinity,
//           ease: "easeInOut",
//         }}
//         className="
//           absolute
//           inset-[10px]
//           rounded-full
//           bg-[#DFD0ED]
//         "
//       />

//       <motion.div
//         animate={{
//           rotate: 360,
//         }}
//         transition={{
//           duration: 1.4,
//           repeat: Infinity,
//           ease: "linear",
//         }}
//         className="
//           relative
//           flex
//           h-[44px]
//           w-[44px]
//           items-center
//           justify-center
//           rounded-full
//           bg-[#7442AD]
//           text-white
//           shadow-[0_5px_16px_rgba(116,66,173,0.28)]
//         "
//       >
//         <LockKeyhole
//           size={18}
//           strokeWidth={2.2}
//         />
//       </motion.div>
//     </div>
//   );
// }

// /* ==========================================
//    VERIFIED ANIMATION
// ========================================== */

// function VerifiedIcon() {
//   return (
//     <div
//       className="
//         relative
//         mx-auto
//         flex
//         h-[78px]
//         w-[78px]
//         items-center
//         justify-center
//       "
//     >
//       <motion.div
//         initial={{
//           scale: 0.4,
//           opacity: 0,
//         }}
//         animate={{
//           scale: 1,
//           opacity: 1,
//         }}
//         transition={{
//           type: "spring",
//           stiffness: 230,
//           damping: 16,
//         }}
//         className="
//           absolute
//           inset-0
//           rounded-full
//           bg-[#EEE5F6]
//         "
//       />

//       <motion.div
//         initial={{
//           scale: 0.5,
//         }}
//         animate={{
//           scale: 1,
//         }}
//         transition={{
//           delay: 0.06,
//           type: "spring",
//           stiffness: 250,
//           damping: 17,
//         }}
//         className="
//           absolute
//           inset-[10px]
//           rounded-full
//           bg-[#DFD0ED]
//         "
//       />

//       <motion.div
//         initial={{
//           scale: 0,
//           rotate: -30,
//         }}
//         animate={{
//           scale: 1,
//           rotate: 0,
//         }}
//         transition={{
//           delay: 0.12,
//           type: "spring",
//           stiffness: 300,
//           damping: 16,
//         }}
//         className="
//           relative
//           flex
//           h-[44px]
//           w-[44px]
//           items-center
//           justify-center
//           rounded-full
//           bg-[#7442AD]
//           text-white
//         "
//       >
//         <Check
//           size={21}
//           strokeWidth={3}
//         />
//       </motion.div>
//     </div>
//   );
// }

// import {
//   AlertTriangle,
//   Check,
//   ShieldCheck,
// } from "lucide-react";
// import {
//   AnimatePresence,
//   motion,
// } from "framer-motion";
// import { Navigate, useNavigate } from "react-router-dom";
// import { useState } from "react";

// import RideHeader from "../../../components/passenger/ride/RideHeader";
// import DriverCard from "../../../components/passenger/ride/DriverCard";

// import { usePassengerRide } from "../../../context/PassengerRideContext";
// import { mockAssignedDriver } from "../../../data/passengerRide";

// type VerificationState =
//   | "ready"
//   | "verifying"
//   | "verified";

// export default function VerifyRide() {
//   const navigate = useNavigate();

//   const {
//     ride,
//     setVerificationCode,
//     setRideStatus,
//   } = usePassengerRide();

//   const [state, setState] =
//     useState<VerificationState>("ready");

//   if (!ride.pickup) {
//     return <Navigate to="/passenger/home" replace />;
//   }

//   const driver =
//     ride.driver ?? mockAssignedDriver;

//   const pin =
//     ride.verificationCode ?? "4829";

//   const verify = () => {
//     setVerificationCode(pin);
//     setState("verifying");

//     // UI preview only.
//     window.setTimeout(() => {
//       setState("verified");
//     }, 1800);
//   };

//   const startTrip = () => {
//     setRideStatus("in-progress");

//     navigate("/passenger/ride/trip");
//   };

//   return (
//     <div className="min-h-[100dvh] bg-white">
//       <RideHeader title="Verify Your Ride" />

//       <main className="mx-auto w-full max-w-[680px] px-5 pb-12 pt-6 sm:px-7">
//         <AnimatePresence mode="wait">
//           {state === "ready" && (
//             <motion.div
//               key="ready"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -15 }}
//             >
//               <DriverCard
//                 driver={driver}
//                 showActions={false}
//               />

//               <div className="mt-8 text-center">
//                 <p className="text-[14px] text-[#918B95]">
//                   Your verification PIN
//                 </p>

//                 <div className="flex justify-center gap-3 mt-4">
//                   {pin.split("").map((number, index) => (
//                     <motion.div
//                       key={`${number}-${index}`}
//                       initial={{
//                         opacity: 0,
//                         y: 12,
//                       }}
//                       animate={{
//                         opacity: 1,
//                         y: 0,
//                       }}
//                       transition={{
//                         delay: index * 0.08,
//                       }}
//                       className="flex h-[62px] w-[56px] items-center justify-center rounded-[14px] bg-[#F1EAF7] text-[26px] font-bold text-[#7442AD]"
//                     >
//                       {number}
//                     </motion.div>
//                   ))}
//                 </div>

//                 <p className="mx-auto mt-4 max-w-[360px] text-[14px] leading-6 text-[#918B95]">
//                   Give this PIN to your driver before the trip begins.
//                 </p>
//               </div>

//               <div className="mt-8 flex gap-3 rounded-[16px] bg-[#FFF6E4] p-4 text-[#7A5A1E]">
//                 <AlertTriangle
//                   size={21}
//                   className="mt-0.5 shrink-0"
//                 />

//                 <p className="text-[13px] leading-5">
//                   Do not enter the vehicle if the driver, vehicle model or plate number does not match the information shown here.
//                 </p>
//               </div>

//               <div className="mt-4 flex gap-3 rounded-[16px] bg-[#F0F7F2] p-4 text-[#397052]">
//                 <ShieldCheck
//                   size={21}
//                   className="shrink-0"
//                 />

//                 <p className="text-[13px] leading-5">
//                   Ride verification helps ensure you enter the correct vehicle.
//                 </p>
//               </div>

//               <motion.button
//                 type="button"
//                 whileTap={{ scale: 0.98 }}
//                 onClick={verify}
//                 className="mt-8 h-[56px] w-full rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white"
//               >
//                 Confirm & Start Trip
//               </motion.button>
//             </motion.div>
//           )}

//           {state === "verifying" && (
//             <motion.div
//               key="verifying"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="flex min-h-[65dvh] flex-col items-center justify-center text-center"
//             >
//               <div className="relative flex h-[130px] w-[130px] items-center justify-center">
//                 {[1, 2, 3].map((item) => (
//                   <motion.div
//                     key={item}
//                     animate={{
//                       scale: [0.7, 1.5],
//                       opacity: [0.35, 0],
//                     }}
//                     transition={{
//                       duration: 1.8,
//                       repeat: Infinity,
//                       delay: item * 0.35,
//                     }}
//                     className="absolute h-20 w-20 rounded-full border border-[#7442AD]"
//                   />
//                 ))}

//                 <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#7442AD] text-[24px] font-bold text-white">
//                   {pin}
//                 </div>
//               </div>

//               <h2 className="mt-7 text-[22px] font-semibold">
//                 Verifying your code...
//               </h2>

//               <p className="mt-2 text-[14px] text-[#918B95]">
//                 Waiting for {driver.firstName} to enter the PIN.
//               </p>
//             </motion.div>
//           )}

//           {state === "verified" && (
//             <motion.div
//               key="verified"
//               initial={{ opacity: 0, scale: 0.92 }}
//               animate={{ opacity: 1, scale: 1 }}
//               className="flex min-h-[65dvh] flex-col items-center justify-center text-center"
//             >
//               <motion.div
//                 initial={{ scale: 0 }}
//                 animate={{ scale: 1 }}
//                 transition={{
//                   type: "spring",
//                   stiffness: 240,
//                   damping: 15,
//                 }}
//                 className="flex h-24 w-24 items-center justify-center rounded-full bg-[#7442AD] text-white shadow-[0_15px_45px_rgba(116,66,173,0.28)]"
//               >
//                 <Check size={45} strokeWidth={3} />
//               </motion.div>

//               <h2 className="mt-7 text-[24px] font-semibold">
//                 Code Verified!
//               </h2>

//               <p className="mt-2 text-[15px] text-[#918B95]">
//                 Your ride has been confirmed.
//               </p>

//               <motion.button
//                 type="button"
//                 whileTap={{ scale: 0.98 }}
//                 onClick={startTrip}
//                 className="mt-9 h-[56px] w-full max-w-[420px] rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white"
//               >
//                 Start Trip
//               </motion.button>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </main>
//     </div>
//   );
// }