import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock3,
  CreditCard,
  LoaderCircle,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react";

import { AnimatePresence, motion } from "framer-motion";

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
} from "../../../api/passenger/rides";

import {
  getStoredActiveRide,
  getStoredActiveRideId,
  storeActiveRide,
} from "../../../utils/passengerActiveRide";

import { useRideSocket } from "../../../hooks/passenger/useRideSocket";

/* =====================================================
   CONFIG
===================================================== */

const POLL_INTERVAL = 5000;

const TOKEN_KEY = "passenger_access_token";

const RECEIPT_ROUTE = "/passenger/ride/receipt";

/* =====================================================
   TYPES
===================================================== */

type PaymentStage =
  | "checking"
  | "processing"
  | "action_required"
  | "failed"
  | "success";

type PaymentInfo = {
  stage: PaymentStage;
  title: string;
  description: string;
};

/*
  The existing ride response has a status field.

  A dedicated paymentStatus field may also be supplied
  by the backend. We read it defensively until its
  exact TypeScript contract is confirmed.
*/

type RideWithPayment = PassengerRideResponse & {
  paymentStatus?: string | null;
};

/* =====================================================
   HELPERS
===================================================== */

function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

function formatMoney(value: number): string {
  return `₦${value.toLocaleString("en-NG", {
    maximumFractionDigits: 2,
  })}`;
}

function normalizeStatus(
  status: string | null | undefined,
): string {
  return (status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getPaymentStage(
  ride: PassengerRideResponse | null,
): PaymentStage {
  if (!ride) {
    return "checking";
  }

  const response = ride as RideWithPayment;

  const rideStatus = normalizeStatus(response.status);

  const paymentStatus = normalizeStatus(
    response.paymentStatus,
  );

  /*
    A confirmed paid status takes priority.

    Do not treat "closed" as paid without a
    confirmed backend payment contract.
  */

  if (
    rideStatus === "paid" ||
    paymentStatus === "paid" ||
    paymentStatus === "success" ||
    paymentStatus === "successful"
  ) {
    return "success";
  }

  if (
    paymentStatus === "failed" ||
    paymentStatus === "declined" ||
    rideStatus === "payment_failed"
  ) {
    return "failed";
  }

  if (
    paymentStatus === "action_required" ||
    paymentStatus === "requires_action" ||
    rideStatus === "payment_action_required"
  ) {
    return "action_required";
  }

  if (
    rideStatus === "ride_completed" ||
    rideStatus === "payment_pending" ||
    rideStatus === "closed" ||
    paymentStatus === "pending" ||
    paymentStatus === "processing"
  ) {
    return "processing";
  }

  return "checking";
}

function getPaymentInfo(
  stage: PaymentStage,
): PaymentInfo {
  switch (stage) {
    case "processing":
      return {
        stage,
        title: "Processing Your Payment",
        description:
          "Your trip has ended. We're waiting for confirmation of your payment.",
      };

    case "action_required":
      return {
        stage,
        title: "Payment Authorization Required",
        description:
          "Your payment needs an additional authorization step. Please follow the instructions provided by SurDrive.",
      };

    case "failed":
      return {
        stage,
        title: "Payment Unsuccessful",
        description:
          "We couldn't confirm your payment. Check the latest status before trying again.",
      };

    case "success":
      return {
        stage,
        title: "Payment Successful!",
        description:
          "Your payment has been confirmed. Thank you for riding with SurDrive.",
      };

    default:
      return {
        stage: "checking",
        title: "Checking Your Payment",
        description:
          "We're retrieving your latest payment information.",
      };
  }
}

/* =====================================================
   COMPONENT
===================================================== */

export default function RidePayment() {
  const navigate = useNavigate();

  const [backendRide, setBackendRide] =
    useState<PassengerRideResponse | null>(
      () => getStoredActiveRide(),
    );

  const [token, setToken] =
    useState<string | null>(getToken);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [requestError, setRequestError] =
    useState(false);

  const mountedRef = useRef(true);

  const fetchingRef = useRef(false);

  const rideId =
    backendRide?.id ??
    getStoredActiveRideId();

  /* =====================================================
     TOKEN
  ===================================================== */

  useEffect(() => {
    mountedRef.current = true;

    const syncToken = () => {
      setToken(getToken());
    };

    window.addEventListener("storage", syncToken);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("storage", syncToken);
    };
  }, []);

  /* =====================================================
     BACKEND UPDATE HANDLER
  ===================================================== */

  const handleRideUpdate = useCallback(
    (response: PassengerRideResponse) => {
      if (!mountedRef.current || !response?.id) {
        return;
      }

      if (rideId && response.id !== rideId) {
        return;
      }

      setBackendRide(response);

      storeActiveRide(response);

      setRequestError(false);

      setLoading(false);
    },
    [rideId],
  );

  /* =====================================================
     WEBSOCKET
  ===================================================== */

  const {
    connected,
    socketError,
  } = useRideSocket({
    rideId,
    token,
    enabled: Boolean(rideId && token),
    onRideUpdate: handleRideUpdate,
  });

  /* =====================================================
     FETCH LATEST RIDE

     GET only — no duplicate payment initiation.
  ===================================================== */

  const refreshRide = useCallback(async () => {
    if (!rideId || fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;

    try {
      const response =
        await passengerRideApi.getRide(rideId);

      if (mountedRef.current) {
        handleRideUpdate(response);
      }
    } catch (error) {
      console.error("PAYMENT REFRESH ERROR:", error);

      if (mountedRef.current) {
        setRequestError(true);
        setLoading(false);
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [rideId, handleRideUpdate]);

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    if (!rideId) {
      setLoading(false);
      return;
    }

    void refreshRide();
  }, [rideId, refreshRide]);

  /* =====================================================
     FALLBACK POLLING

     Active only while WebSocket is disconnected.
  ===================================================== */

  useEffect(() => {
    if (!rideId || connected) {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshRide();
    }, POLL_INTERVAL);

    return () => {
      window.clearInterval(interval);
    };
  }, [rideId, connected, refreshRide]);

  /* =====================================================
     MANUAL REFRESH
  ===================================================== */

  const handleManualRefresh = async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    try {
      await refreshRide();
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  };

  /* =====================================================
     RIDE GUARD
  ===================================================== */

  if (!rideId) {
    return (
      <Navigate
        to="/passenger/home"
        replace
      />
    );
  }

  /* =====================================================
     DISPLAY DATA
  ===================================================== */

  const paymentStage = getPaymentStage(backendRide);

  const paymentInfo = getPaymentInfo(paymentStage);

  const isSuccess = paymentStage === "success";

  const isFailed = paymentStage === "failed";

  const isActionRequired =
    paymentStage === "action_required";

  const isProcessing =
    paymentStage === "processing";

  const amount =
    backendRide?.finalFare ??
    backendRide?.fareBreakdown?.total ??
    backendRide?.estimatedFare;

  const paymentMethod =
    backendRide?.paymentMethod;

  const statusColor = isSuccess
    ? "#36A665"
    : isFailed
      ? "#D75B5B"
      : "#7442AD";

  const connectionLabel = connected
    ? "Live payment updates"
    : requestError
      ? "Unable to refresh payment"
      : socketError
        ? "Using backup updates"
        : "Checking connection...";

  /* =====================================================
     CONTINUE
  ===================================================== */

  const continueToReceipt = () => {
    if (!isSuccess) {
      toast.error(
        "Your payment has not been confirmed yet.",
      );
      return;
    }

    navigate(RECEIPT_ROUTE);
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="min-h-[100dvh] bg-[#F8F7FA]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col bg-white">

        {/* HEADER */}

        <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-[#F1EDF3] px-5">
          <button
            type="button"
            onClick={() =>
              navigate("/passenger/ride/complete")
            }
            aria-label="Back to trip summary"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F5F8]"
          >
            <ArrowLeft
              size={20}
              className="text-[#302B34]"
            />
          </button>

          <h1 className="text-[17px] font-semibold text-[#302B34]">
            Trip Payment
          </h1>

          <div className="w-10" />
        </header>

        {/* MAIN CONTENT */}

        <main className="flex flex-col flex-1 px-6 pt-10 pb-8">

          {/* PAYMENT ANIMATION */}

          <div className="flex flex-col items-center text-center">

            <AnimatePresence mode="wait">

              <motion.div
                key={paymentStage}
                initial={{
                  opacity: 0,
                  scale: 0.8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.85,
                }}
                transition={{
                  duration: 0.3,
                }}
                className="relative flex h-[126px] w-[126px] items-center justify-center"
              >

                {!isSuccess && !isFailed && (
                  <motion.div
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 rounded-full border-[3px] border-[#F0E8F7] border-t-[#7442AD]"
                  />
                )}

                <div
                  className="flex h-[105px] w-[105px] items-center justify-center rounded-full"
                  style={{
                    backgroundColor: isSuccess
                      ? "#E4F7EA"
                      : isFailed
                        ? "#FFF0F0"
                        : "#F3ECF9",
                  }}
                >

                  {isSuccess ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 240,
                        damping: 16,
                      }}
                    >
                      <Check
                        size={45}
                        strokeWidth={3}
                        color="#36A665"
                      />
                    </motion.div>
                  ) : isFailed ? (
                    <AlertCircle
                      size={43}
                      color="#D75B5B"
                    />
                  ) : isProcessing ? (
                    <CreditCard
                      size={43}
                      color="#7442AD"
                    />
                  ) : isActionRequired ? (
                    <ShieldCheck
                      size={43}
                      color="#7442AD"
                    />
                  ) : (
                    <LoaderCircle
                      size={43}
                      color="#7442AD"
                      className="animate-spin"
                    />
                  )}

                </div>
              </motion.div>

            </AnimatePresence>

            <motion.h2
              key={`${paymentStage}-title`}
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mt-7 text-[25px] font-bold leading-tight text-[#302B34]"
            >
              {paymentInfo.title}
            </motion.h2>

            <p className="mt-3 max-w-[330px] text-[14px] leading-6 text-[#918B95]">
              {paymentInfo.description}
            </p>

          </div>

          {/* AMOUNT */}

          <div className="mt-10 rounded-[22px] bg-[#F7F5F9] px-5 py-6 text-center">

            <p className="text-[13px] font-medium text-[#918B95]">
              {backendRide?.finalFare != null
                ? "Final Trip Fare"
                : "Trip Fare"}
            </p>

            <p className="mt-2 text-[34px] font-bold tracking-tight text-[#302B34]">
              {typeof amount === "number"
                ? formatMoney(amount)
                : "—"}
            </p>

            <div className="mx-auto mt-4 h-px w-full bg-[#EAE5EE]" />

            <div className="flex items-center justify-between mt-4">

              <div className="flex items-center gap-2">
                <CreditCard
                  size={17}
                  className="text-[#7442AD]"
                />

                <span className="text-[13px] text-[#817A85]">
                  Payment Method
                </span>
              </div>

              <span className="text-[14px] font-semibold capitalize text-[#302B34]">
                {paymentMethod || "Online Payment"}
              </span>

            </div>

          </div>

          {/* STATUS */}

          <div className="mt-5 rounded-[17px] border border-[#EEEAF1] p-4">

            <div className="flex items-center justify-between gap-3">

              <div className="flex items-center gap-2">

                {isSuccess ? (
                  <Check
                    size={18}
                    className="text-[#36A665]"
                  />
                ) : isFailed ? (
                  <AlertCircle
                    size={18}
                    className="text-[#D75B5B]"
                  />
                ) : (
                  <Clock3
                    size={18}
                    className="text-[#7442AD]"
                  />
                )}

                <span className="text-[14px] font-medium text-[#302B34]">
                  Payment Status
                </span>

              </div>

              <span
                className="text-[13px] font-semibold"
                style={{
                  color: statusColor,
                }}
              >
                {isSuccess
                  ? "Successful"
                  : isFailed
                    ? "Failed"
                    : isActionRequired
                      ? "Action required"
                      : "Pending"}
              </span>

            </div>

            <div className="mt-4 h-px bg-[#EEEAF1]" />

            <div className="flex items-center gap-2 mt-4">

              <ShieldCheck
                size={18}
                className="text-[#7442AD]"
              />

              <p className="text-[12px] leading-5 text-[#918B95]">
                Payment confirmation is provided by SurDrive's
                secure backend.
              </p>

            </div>

          </div>

          {/* CONNECTION STATUS */}

          <div className="mt-5 flex items-center justify-between rounded-[13px] bg-[#FAF9FB] px-4 py-3">

            <div className="flex items-center gap-2">

              {connected ? (
                <Wifi
                  size={15}
                  className="text-[#36A665]"
                />
              ) : (
                <WifiOff
                  size={15}
                  className="text-[#D6A044]"
                />
              )}

              <span className="text-[12px] text-[#918B95]">
                {connectionLabel}
              </span>

            </div>

            <button
              type="button"
              onClick={() =>
                void handleManualRefresh()
              }
              disabled={refreshing}
              aria-label="Refresh payment status"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#7442AD] disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing ? "animate-spin" : ""
                }
              />
            </button>

          </div>

          {/* BOTTOM ACTIONS */}

          <div className="pt-10 mt-auto">

            {isSuccess ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={continueToReceipt}
                className="flex h-[56px] w-full items-center justify-center gap-2 rounded-[15px] bg-[#7442AD] text-[16px] font-semibold text-white"
              >
                <ReceiptText size={19} />
                View Receipt
              </motion.button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  void handleManualRefresh()
                }
                disabled={refreshing}
                className="flex h-[56px] w-full items-center justify-center gap-2 rounded-[15px] bg-[#7442AD] text-[16px] font-semibold text-white disabled:opacity-50"
              >
                {refreshing ? (
                  <>
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    Check Payment Status
                  </>
                )}
              </button>
            )}

            {!isSuccess && (
              <p className="mt-4 text-center text-[12px] leading-5 text-[#A19AA5]">
                Please don't initiate another payment while
                an existing transaction is being processed.
              </p>
            )}

          </div>

        </main>

      </div>
    </div>
  );
}