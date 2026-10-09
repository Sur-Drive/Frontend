import {
  Clock3,
  MapPin,
  Route,
  Wifi,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "sonner";

import PassengerMap from "../../../components/passenger/ride/PassengerMap";
import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";
import CancelRideSheet from "../../../components/passenger/ride/CancelRideSheet";

import {
  usePassengerRide,
} from "../../../context/PassengerRideContext";

import {
  passengerRideApi,
} from "../../../api/passenger/rides";

import type {
  PassengerRideResponse,
} from "../../../api/passenger/rides";

/* =========================================================
   STORAGE
========================================================= */

const ACTIVE_RIDE_KEY =
  "surdrive_active_ride";

const ACTIVE_RIDE_ID_KEY =
  "surdrive_active_ride_id";

/* =========================================================
   HELPERS
========================================================= */

function getStoredRide():
  PassengerRideResponse | null {
  try {
    const raw =
      sessionStorage.getItem(
        ACTIVE_RIDE_KEY,
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(
      raw,
    ) as PassengerRideResponse;
  } catch {
    return null;
  }
}

function saveActiveRide(
  ride: PassengerRideResponse,
) {
  sessionStorage.setItem(
    ACTIVE_RIDE_KEY,
    JSON.stringify(ride),
  );

  sessionStorage.setItem(
    ACTIVE_RIDE_ID_KEY,
    ride.id,
  );
}

function clearActiveRide() {
  sessionStorage.removeItem(
    ACTIVE_RIDE_KEY,
  );

  sessionStorage.removeItem(
    ACTIVE_RIDE_ID_KEY,
  );
}

function formatMoney(
  amount: number,
) {
  return amount.toLocaleString(
    "en-NG",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  );
}

function getErrorMessage(
  error: unknown,
) {
  if (
    error &&
    typeof error === "object"
  ) {
    const candidate =
      error as {
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

    const backendMessage =
      candidate.response?.data
        ?.message ??
      candidate.data?.message ??
      candidate.message;

    if (
      typeof backendMessage ===
      "string"
    ) {
      return backendMessage;
    }

    if (
      Array.isArray(
        backendMessage,
      )
    ) {
      return backendMessage.join(
        ", ",
      );
    }
  }

  return "Unable to cancel your ride. Please try again.";
}

/* =========================================================
   PAGE
========================================================= */

export default function SearchingDriver() {
  const navigate =
    useNavigate();

  const {
    ride,
    setRideStatus,
    setEstimatedFare,
  } =
    usePassengerRide();

  /* =======================================================
     STATE
  ======================================================= */

  const [
    cancelOpen,
    setCancelOpen,
  ] = useState(false);

  const [
    isCancelling,
    setIsCancelling,
  ] = useState(false);

  const [
    backendRide,
    setBackendRide,
  ] =
    useState<PassengerRideResponse | null>(
      () => getStoredRide(),
    );

  const [
    pollError,
    setPollError,
  ] = useState(false);

  const [
    stopPolling,
    setStopPolling,
  ] = useState(false);

  /* =======================================================
     ACTIVE RIDE ID
  ======================================================= */

  const rideId =
    backendRide?.id ??
    sessionStorage.getItem(
      ACTIVE_RIDE_ID_KEY,
    );

  /* =======================================================
     POLL REAL RIDE STATUS
  ======================================================= */

  useEffect(() => {
    if (
      !rideId ||
      stopPolling
    ) {
      return;
    }

    let mounted = true;

    let running = false;

    const checkRide =
      async () => {
        if (running) {
          return;
        }

        running = true;

        try {
          const response =
            await passengerRideApi.getRide(
              rideId,
            );

          if (!mounted) {
            return;
          }

          console.log(
            "ACTIVE RIDE:",
            response,
          );

          setPollError(false);

          setBackendRide(
            response,
          );

          saveActiveRide(
            response,
          );

          if (
            typeof response.estimatedFare ===
            "number"
          ) {
            setEstimatedFare(
              response.estimatedFare,
            );
          }

          /* ===============================================
             STILL SEARCHING
          =============================================== */

          if (
            response.status ===
              "requested" ||
            response.status ===
              "searching"
          ) {
            return;
          }

          /* ===============================================
             DRIVER ASSIGNED
          =============================================== */

          if (
            response.status ===
            "driver_assigned"
          ) {
            setStopPolling(true);

            setRideStatus(
              "driver-assigned",
            );

            navigate(
              "/passenger/ride/driver-assigned",
              {
                replace: true,
              },
            );

            return;
          }

          /* ===============================================
             DRIVER EN ROUTE
          =============================================== */

          if (
            response.status ===
            "driver_en_route"
          ) {
            setStopPolling(true);

            setRideStatus(
              "driver-en-route",
            );

            navigate(
              "/passenger/ride/driver-en-route",
              {
                replace: true,
              },
            );

            return;
          }

          /* ===============================================
             DRIVER ARRIVED
          =============================================== */

          if (
            response.status ===
            "driver_arrived"
          ) {
            setStopPolling(true);

            setRideStatus(
              "driver-arrived",
            );

            navigate(
              "/passenger/ride/driver-arrived",
              {
                replace: true,
              },
            );

            return;
          }

          /* ===============================================
             RIDE STARTED / IN PROGRESS

             Use a status that actually exists in your
             frontend RideStatus union.

             Earlier "in-trip" caused your TypeScript error,
             so we do NOT introduce it here.
          =============================================== */

          if (
            response.status ===
              "ride_started" ||
            response.status ===
              "ride_in_progress"
          ) {
            setStopPolling(true);

            /*
             * Navigate to your trip page.
             *
             * Do not call:
             *
             * setRideStatus("in-trip")
             *
             * because "in-trip" is not currently part of
             * your RideStatus type.
             */

            navigate(
              "/passenger/ride/in-trip",
              {
                replace: true,
              },
            );

            return;
          }

          /* ===============================================
             RIDE COMPLETED
          =============================================== */

          if (
            response.status ===
              "ride_completed" ||
            response.status ===
              "payment_pending" ||
            response.status ===
              "paid" ||
            response.status ===
              "closed"
          ) {
            setStopPolling(true);

            navigate(
              "/passenger/ride/complete",
              {
                replace: true,
              },
            );

            return;
          }

          /* ===============================================
             CANCELLED
          =============================================== */

          if (
            response.status ===
            "cancelled"
          ) {
            setStopPolling(true);

            clearActiveRide();

            setRideStatus(
              "idle",
            );

            toast.info(
              response.cancellationReason ||
                "This ride has been cancelled.",
            );

            navigate(
              "/passenger/home",
              {
                replace: true,
              },
            );
          }
        } catch (error) {
          console.error(
            "GET RIDE ERROR:",
            error,
          );

          if (mounted) {
            setPollError(
              true,
            );
          }
        } finally {
          running = false;
        }
      };

    /*
     * Check immediately instead of
     * waiting five seconds.
     */
    void checkRide();

    const interval =
      window.setInterval(
        () => {
          void checkRide();
        },
        5000,
      );

    return () => {
      mounted = false;

      window.clearInterval(
        interval,
      );
    };
  }, [
    rideId,
    stopPolling,
    navigate,
    setRideStatus,
    setEstimatedFare,
  ]);

  /* =======================================================
     CANCEL
  ======================================================= */

  const requestCancel = () => {
    if (isCancelling) {
      return;
    }

    setCancelOpen(true);
  };

  const confirmCancel =
    async (
      reason: string,
      comment?: string,
    ) => {
      if (
        !rideId ||
        isCancelling
      ) {
        return;
      }

      setIsCancelling(true);

      /*
       * Prevent the polling request from moving us to
       * another ride screen while cancellation is being
       * processed.
       */
      setStopPolling(true);

      try {
        /*
         * Your current API method accepts only:
         *
         * cancelRide(rideId, reason)
         *
         * We therefore do NOT send `comment` until the
         * backend cancellation DTO confirms that it accepts
         * a comment field.
         */
        console.log(
          "CANCELLING RIDE:",
          {
            rideId,
            reason,
            comment,
          },
        );

        const response =
          await passengerRideApi.cancelRide(
            rideId,
            reason,
          );

        console.log(
          "CANCEL RIDE RESPONSE:",
          response,
        );

        /*
         * The backend should normally return the ride with
         * status "cancelled".
         *
         * Save the response momentarily so debugging remains
         * easy before clearing active ride state.
         */
        setBackendRide(
          response,
        );

        /*
         * If the backend returns another status, don't lie
         * to the UI and claim cancellation succeeded.
         */
        if (
          response.status !==
          "cancelled"
        ) {
          throw new Error(
            `Cancellation was not confirmed. Current ride status: ${response.status}`,
          );
        }

        setCancelOpen(false);

        clearActiveRide();

        setRideStatus(
          "idle",
        );

        toast.success(
          response.cancellationFee > 0
            ? `Ride cancelled. Cancellation fee: ₦${formatMoney(
                response.cancellationFee,
              )}`
            : "Ride cancelled successfully.",
        );

        navigate(
          "/passenger/home",
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          "CANCEL RIDE ERROR:",
          error,
        );

        /*
         * Resume polling because the server did not
         * successfully confirm cancellation.
         */
        setStopPolling(false);

        toast.error(
          getErrorMessage(
            error,
          ),
        );
      } finally {
        setIsCancelling(
          false,
        );
      }
    };

  /* =======================================================
     GUARDS
  ======================================================= */

  if (
    !ride.pickup ||
    !ride.destination
  ) {
    return (
      <Navigate
        to="/passenger/book-ride"
        replace
      />
    );
  }

  if (!rideId) {
    return (
      <Navigate
        to="/passenger/book-ride"
        replace
      />
    );
  }

  const center =
    ride.pickup.coordinates ??
    ride.destination.coordinates;

  /*
   * Important:
   * no fake Lagos fallback.
   *
   * If neither ride location has coordinates, return to
   * booking rather than pretending the user is somewhere
   * else.
   */
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
    backendRide?.pickup
      ?.address ||
    ride.pickup.address ||
    ride.pickup.label;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
      {/* ===============================================
          MAP
      =============================================== */}

      <PassengerMap
        center={center}
        pickup={ride.pickup}
        destination={
          ride.destination
        }
        zoom={15}
        interactive
      />

      {/* ===============================================
          HEADER
      =============================================== */}

      <RideMapHeader
        title="Finding a driver"
        onBack={
          requestCancel
        }
      />

      {/* ===============================================
          RADAR
      =============================================== */}

      <div className="pointer-events-none absolute left-1/2 top-[35%] z-[300] -translate-x-1/2 -translate-y-1/2">
        {[0, 0.65, 1.3].map(
          (delay) => (
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
                repeat:
                  Infinity,
                delay,
                ease:
                  "easeOut",
              }}
              className="absolute left-1/2 top-1/2 h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#7442AD] bg-[#7442AD]/10"
            />
          ),
        )}

        <motion.div
          animate={{
            scale: [
              1,
              1.18,
              1,
            ],
          }}
          transition={{
            duration: 1.5,
            repeat:
              Infinity,
            ease:
              "easeInOut",
          }}
          className="absolute left-1/2 top-1/2 h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7442AD]/10"
        />

        <motion.div
          animate={{
            scale: [
              1,
              1.08,
              1,
            ],
          }}
          transition={{
            duration: 1.4,
            repeat:
              Infinity,
          }}
          className="relative flex h-[62px] w-[62px] items-center justify-center rounded-full border-[5px] border-white bg-[#7442AD] shadow-[0_10px_35px_rgba(116,66,173,0.35)]"
        >
          <div className="h-[13px] w-[13px] rounded-full bg-white" />
        </motion.div>
      </div>

      {/* ===============================================
          BOTTOM SHEET
      =============================================== */}

      <RideBottomSheet>
        <div className="text-center">
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 1.25,
              repeat:
                Infinity,
              ease:
                "linear",
            }}
            className="mx-auto h-[46px] w-[46px] rounded-full border-[4px] border-[#EEE5F5] border-t-[#7442AD]"
          />

          <h1 className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-[#302B34]">
            Finding your
            driver...
          </h1>

          <p className="mx-auto mt-2 max-w-[350px] text-[14px] leading-6 text-[#938D97]">
            We're connecting
            you with an
            available Sur-Drive
            driver nearby.
          </p>
        </div>

        {/* =============================================
            PROGRESS
        ============================================= */}

        <div className="mt-6">
          <div className="h-[5px] overflow-hidden rounded-full bg-[#EEE8F2]">
            <motion.div
              initial={{
                x: "-100%",
              }}
              animate={{
                x: "350%",
              }}
              transition={{
                duration: 1.5,
                repeat:
                  Infinity,
                ease:
                  "easeInOut",
              }}
              className="h-full w-[30%] rounded-full bg-[#7442AD]"
            />
          </div>
        </div>

        {/* =============================================
            RIDE SUMMARY
        ============================================= */}

        <div className="mt-6 rounded-[17px] bg-[#F8F6F9] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#8F8994]">
              Estimated fare
            </span>

            <span className="text-[17px] font-semibold text-[#302B34]">
              {typeof estimatedFare ===
              "number"
                ? `₦${formatMoney(
                    estimatedFare,
                  )}`
                : "—"}
            </span>
          </div>

          {(typeof estimatedDuration ===
            "number" ||
            typeof estimatedDistance ===
              "number") && (
            <>
              <div className="my-4 h-px bg-[#EDE8EF]" />

              <div className="flex items-center gap-5">
                {typeof estimatedDuration ===
                  "number" && (
                  <div className="flex items-center gap-2 text-[#625C66]">
                    <Clock3
                      size={
                        16
                      }
                    />

                    <span className="text-[13px]">
                      {
                        estimatedDuration
                      }{" "}
                      min
                    </span>
                  </div>
                )}

                {typeof estimatedDistance ===
                  "number" && (
                  <div className="flex items-center gap-2 text-[#625C66]">
                    <Route
                      size={
                        16
                      }
                    />

                    <span className="text-[13px]">
                      {estimatedDistance.toFixed(
                        1,
                      )}{" "}
                      km
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
                Pickup
              </p>

              <p className="mt-1 truncate text-[14px] font-medium text-[#4E4852]">
                {
                  pickupAddress
                }
              </p>
            </div>
          </div>
        </div>

        {/* =============================================
            LIVE STATUS
        ============================================= */}

        <div className="flex items-center justify-center gap-2 mt-3">
          <Wifi
            size={14}
            className={
              pollError
                ? "text-[#D05B5B]"
                : "text-[#5B9B72]"
            }
          />

          <p
            className={`text-[12px] ${
              pollError
                ? "text-[#D05B5B]"
                : "text-[#AAA3AD]"
            }`}
          >
            {pollError
              ? "Reconnecting to ride status..."
              : isCancelling
                ? "Cancelling ride..."
                : "Live ride status"}
          </p>
        </div>

        {/* =============================================
            CANCEL BUTTON
        ============================================= */}

        <motion.button
          type="button"
          disabled={
            isCancelling
          }
          whileTap={
            !isCancelling
              ? {
                  scale: 0.98,
                }
              : undefined
          }
          onClick={
            requestCancel
          }
          className="mt-5 h-[54px] w-full rounded-[14px] border border-[#E1D9E7] bg-white text-[16px] font-semibold text-[#7442AD] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCancelling
            ? "Cancelling..."
            : "Cancel Ride"}
        </motion.button>
      </RideBottomSheet>

      {/* ===============================================
          CANCEL SHEET
      =============================================== */}

      <CancelRideSheet
        open={
          cancelOpen
        }
        onClose={() => {
          if (
            !isCancelling
          ) {
            setCancelOpen(
              false,
            );
          }
        }}
        onConfirm={
          confirmCancel
        }
      />
    </div>
  );
}


