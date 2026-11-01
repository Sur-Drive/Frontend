"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  CreditCard,
  Download,
  MapPin,
  ReceiptText,
  Route,
  Share2,
  ShieldCheck,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  passengerRideApi,
  type PassengerRideResponse,
} from "../../../api/passenger/rides";

import {
  passengerPaymentApi,
  type RidePaymentState,
} from "../../../api/passenger/payment";

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
const RATE_ROUTE = "/passenger/ride/rate";
const PAYMENT_ROUTE = "/passenger/ride/payment";
const HOME_ROUTE = "/passenger/home";
const TOKEN_KEY = "passenger_access_token";

/* =====================================================
   TYPES
===================================================== */

type ReceiptRide = PassengerRideResponse & {
  paymentStatus?: string | null;
  paymentReference?: string | null;
  transactionReference?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
  fareBreakdown?: PassengerRideResponse["fareBreakdown"] & {
    baseFare?: number;
    distanceFare?: number;
    timeFare?: number;
    serviceFee?: number;
    discount?: number;
  };
};

/* =====================================================
   HELPERS
===================================================== */

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function formatMoney(amount: number) {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getLocationLabel(
  location: unknown,
  fallback: string,
) {
  if (!location || typeof location !== "object") {
    return fallback;
  }

  const record = location as Record<string, unknown>;

  if (typeof record.label === "string" && record.label) {
    return record.label;
  }

  if (typeof record.address === "string" && record.address) {
    return record.address;
  }

  return fallback;
}

/* =====================================================
   COMPONENT
===================================================== */

export default function TripReceipt() {
  const navigate = useNavigate();

  const [backendRide, setBackendRide] =
    useState<PassengerRideResponse | null>(
      () => getStoredActiveRide(),
    );

  const [payment, setPayment] =
    useState<RidePaymentState | null>(null);

  const [paymentChecked, setPaymentChecked] =
    useState(false);

  const [token, setToken] =
    useState<string | null>(getToken);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestError, setRequestError] = useState(false);
  const [continuing, setContinuing] = useState(false);

  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);

  const rideId =
    backendRide?.id ?? getStoredActiveRideId();

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
     UPDATE RIDE
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
    },
    [rideId],
  );

  /* =====================================================
     SOCKET
  ===================================================== */

  const { connected } = useRideSocket({
    rideId,
    token,
    enabled: Boolean(rideId && token),
    onRideUpdate: handleRideUpdate,
  });

  /* =====================================================
     REFRESH RIDE + PAYMENT

     Payment endpoint is authoritative.
  ===================================================== */

  const refreshReceipt = useCallback(async () => {
    if (!rideId || fetchingRef.current) return;

    fetchingRef.current = true;

    try {
      const [rideResult, paymentResult] =
        await Promise.allSettled([
          passengerRideApi.getRide(rideId),
          passengerPaymentApi.getPayment(rideId),
        ]);

      if (!mountedRef.current) return;

      if (rideResult.status === "fulfilled") {
        handleRideUpdate(rideResult.value);
      } else {
        console.error(
          "RECEIPT RIDE ERROR:",
          rideResult.reason,
        );
      }

      if (paymentResult.status === "fulfilled") {
        setPayment(paymentResult.value);
        setPaymentChecked(true);
      } else {
        console.error(
          "RECEIPT PAYMENT ERROR:",
          paymentResult.reason,
        );

        setPaymentChecked(false);
      }

      setRequestError(
        rideResult.status === "rejected" ||
          paymentResult.status === "rejected",
      );
    } finally {
      fetchingRef.current = false;

      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [rideId, handleRideUpdate]);

  /* =====================================================
     LOAD ON MOUNT
  ===================================================== */

  useEffect(() => {
    void refreshReceipt();
  }, [refreshReceipt]);

  /* =====================================================
     FALLBACK POLLING

     Poll while socket is disconnected.
  ===================================================== */

  useEffect(() => {
    if (!rideId || connected) return;

    const interval = window.setInterval(() => {
      void refreshReceipt();
    }, POLL_INTERVAL);

    return () => window.clearInterval(interval);
  }, [rideId, connected, refreshReceipt]);

  /* =====================================================
     REFRESH ON APP RESUME
  ===================================================== */

  useEffect(() => {
    if (!rideId) return;

    const handleFocus = () => {
      void refreshReceipt();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshReceipt();
      }
    };

    window.addEventListener("focus", handleFocus);

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.removeEventListener("focus", handleFocus);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [rideId, refreshReceipt]);

  /* =====================================================
     MANUAL REFRESH
  ===================================================== */

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await refreshReceipt();
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  };

  /* =====================================================
     PAYMENT CONFIRMATION

     Do not infer success from ride.status.
  ===================================================== */

  const paid =
    paymentChecked &&
    payment?.paid === true;

  /* =====================================================
     RECEIPT DETAILS
  ===================================================== */

  const receiptRide =
    backendRide as ReceiptRide | null;

  const finalFare =
    payment?.amount ??
    receiptRide?.finalFare ??
    receiptRide?.fareBreakdown?.total ??
    receiptRide?.estimatedFare;

  const duration =
    receiptRide?.actualDurationMin ??
    receiptRide?.estimatedDurationMin;

  const distance =
    receiptRide?.actualDistanceKm ??
    receiptRide?.estimatedDistanceKm;

  const pickupLabel = getLocationLabel(
    receiptRide?.pickup,
    "Pickup location",
  );

  const destinationLabel = getLocationLabel(
    receiptRide?.dropoff,
    "Destination",
  );

  const paymentMethod =
    payment?.bookedMethod ??
    receiptRide?.paymentMethod ??
    "Online payment";

  const reference =
    receiptRide?.transactionReference ??
    receiptRide?.paymentReference ??
    null;

  const receiptDate =
    receiptRide?.completedAt ??
    receiptRide?.createdAt;

  const breakdown = receiptRide?.fareBreakdown;

  /* =====================================================
     RECEIPT TEXT
  ===================================================== */

  const receiptText = [
    "SURDRIVE — TRIP RECEIPT",
    "",
    `Ride ID: ${rideId ?? "—"}`,
    `Date: ${formatDate(receiptDate)}`,
    `Pickup: ${pickupLabel}`,
    `Destination: ${destinationLabel}`,
    `Duration: ${
      typeof duration === "number"
        ? `${Math.round(duration)} min`
        : "—"
    }`,
    `Distance: ${
      typeof distance === "number"
        ? `${distance.toFixed(1)} km`
        : "—"
    }`,
    `Total: ${
      typeof finalFare === "number"
        ? formatMoney(finalFare)
        : "—"
    }`,
    `Payment Method: ${paymentMethod}`,
    `Payment Status: ${
      paid ? "Paid" : "Not confirmed"
    }`,
    ...(reference
      ? [`Transaction Reference: ${reference}`]
      : []),
  ].join("\n");

  /* =====================================================
     SHARE
  ===================================================== */

  const shareReceipt = async () => {
    if (!paid) {
      toast.error(
        "Payment must be confirmed before sharing a receipt.",
      );
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: "SurDrive Trip Receipt",
          text: receiptText,
        });
      } else {
        await navigator.clipboard.writeText(receiptText);
        toast.success("Receipt copied to clipboard.");
      }
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      toast.error("Unable to share receipt.");
    }
  };

  /* =====================================================
     DOWNLOAD
  ===================================================== */

  const downloadReceipt = () => {
    if (!paid) {
      toast.error(
        "Payment must be confirmed before downloading a receipt.",
      );
      return;
    }

    window.print();
  };

  /* =====================================================
     CONTINUE TO RATING

     Recheck payment immediately before navigation.
  ===================================================== */

  const handleContinue = async () => {
    if (!rideId || continuing) return;

    setContinuing(true);

    try {
      const latestPayment =
        await passengerPaymentApi.getPayment(rideId);

      if (!mountedRef.current) return;

      setPayment(latestPayment);
      setPaymentChecked(true);

      if (latestPayment.paid !== true) {
        toast.error(
          "Your payment has not been confirmed yet.",
        );
        return;
      }

      navigate(RATE_ROUTE);
    } catch (error) {
      console.error(
        "RECEIPT PAYMENT CONFIRMATION ERROR:",
        error,
      );

      if (mountedRef.current) {
        setPaymentChecked(false);
      }

      toast.error(
        "Unable to confirm payment. Please try again.",
      );
    } finally {
      if (mountedRef.current) {
        setContinuing(false);
      }
    }
  };

  /* =====================================================
     ROUTE GUARD
  ===================================================== */

  if (!rideId) {
    return (
      <Navigate
        to={HOME_ROUTE}
        replace
      />
    );
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading && !backendRide) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-white">
        <div className="text-center">
          <LoaderCircle
            size={32}
            className="mx-auto animate-spin text-[#7442AD]"
          />

          <p className="mt-4 text-[14px] text-[#918B95]">
            Preparing your receipt...
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="min-h-[100dvh] bg-[#F8F7FA]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[480px] bg-white">

        {/* HEADER */}

        <header className="flex h-[76px] items-center justify-between border-b border-[#F1EDF3] px-5 print:hidden">
          <button
            type="button"
            onClick={() => navigate(PAYMENT_ROUTE)}
            aria-label="Back to payment"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F5F8]"
          >
            <ArrowLeft size={20} />
          </button>

          <h1 className="text-[17px] font-semibold text-[#302B34]">
            Trip Receipt
          </h1>

          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            aria-label="Refresh receipt"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F5F8] disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
        </header>

        <main className="px-5 pb-10 pt-7">

          {/* RECEIPT CARD */}

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden rounded-[24px] border border-[#EEEAF1] bg-white shadow-[0_12px_45px_rgba(40,20,60,0.06)] print:border-0 print:shadow-none"
          >

            {/* RECEIPT TOP */}

            <div className="bg-[#7442AD] px-6 pb-8 pt-7 text-center text-white">

              <div className="flex items-center justify-center mx-auto rounded-full h-14 w-14 bg-white/15">
                <ReceiptText size={27} />
              </div>

              <h2 className="mt-4 text-[22px] font-bold">
                SurDrive
              </h2>

              <p className="mt-1 text-[12px] text-white/75">
                Your Trip Receipt
              </p>

              <p className="mt-6 text-[34px] font-bold tracking-tight">
                {typeof finalFare === "number"
                  ? formatMoney(finalFare)
                  : "—"}
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[12px] font-semibold">
                {paid ? (
                  <>
                    <Check size={15} />
                    Payment Successful
                  </>
                ) : (
                  <>
                    <Clock3 size={15} />
                    {loading
                      ? "Checking Payment..."
                      : "Payment Not Confirmed"}
                  </>
                )}
              </div>

            </div>

            {/* RECEIPT BODY */}

            <div className="px-5 py-6">

              {/* RIDE DETAILS */}

              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-[#918B95]">
                  Trip ID
                </span>

                <span className="max-w-[65%] break-all text-right text-[12px] font-semibold text-[#302B34]">
                  {rideId}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 mt-4">
                <span className="text-[13px] text-[#918B95]">
                  Date
                </span>

                <span className="text-right text-[13px] font-medium text-[#302B34]">
                  {formatDate(receiptDate)}
                </span>
              </div>

              {reference && (
                <div className="flex items-center justify-between gap-3 mt-4">
                  <span className="text-[13px] text-[#918B95]">
                    Reference
                  </span>

                  <span className="max-w-[65%] break-all text-right text-[12px] font-semibold text-[#302B34]">
                    {reference}
                  </span>
                </div>
              )}

              <div className="my-6 border-t border-dashed border-[#E8E2EB]" />

              {/* ROUTE */}

              <div className="relative space-y-6">

                <div className="flex items-start gap-3">
                  <div className="mt-1 h-3 w-3 shrink-0 rounded-full border-[3px] border-[#7442AD]" />

                  <div>
                    <p className="text-[12px] text-[#918B95]">
                      Pickup
                    </p>

                    <p className="mt-1 text-[14px] font-semibold text-[#302B34]">
                      {pickupLabel}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin
                    size={17}
                    className="shrink-0 text-[#7442AD]"
                  />

                  <div>
                    <p className="text-[12px] text-[#918B95]">
                      Destination
                    </p>

                    <p className="mt-1 text-[14px] font-semibold text-[#302B34]">
                      {destinationLabel}
                    </p>
                  </div>
                </div>

              </div>

              <div className="my-6 border-t border-dashed border-[#E8E2EB]" />

              {/* TRIP STATS */}

              <div className="grid grid-cols-2 gap-3">

                <div className="rounded-[14px] bg-[#F7F5F8] p-4">
                  <Clock3
                    size={18}
                    className="text-[#7442AD]"
                  />

                  <p className="mt-2 text-[12px] text-[#918B95]">
                    Duration
                  </p>

                  <p className="mt-1 text-[15px] font-semibold text-[#302B34]">
                    {typeof duration === "number"
                      ? `${Math.round(duration)} min`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-[14px] bg-[#F7F5F8] p-4">
                  <Route
                    size={18}
                    className="text-[#7442AD]"
                  />

                  <p className="mt-2 text-[12px] text-[#918B95]">
                    Distance
                  </p>

                  <p className="mt-1 text-[15px] font-semibold text-[#302B34]">
                    {typeof distance === "number"
                      ? `${distance.toFixed(1)} km`
                      : "—"}
                  </p>
                </div>

              </div>

              {/* FARE BREAKDOWN */}

              <div className="my-6 border-t border-dashed border-[#E8E2EB]" />

              <h3 className="text-[15px] font-semibold text-[#302B34]">
                Fare Breakdown
              </h3>

              <div className="mt-4 space-y-3">

                {typeof breakdown?.baseFare === "number" && (
                  <FareRow
                    label="Base Fare"
                    amount={breakdown.baseFare}
                  />
                )}

                {typeof breakdown?.distanceFare === "number" && (
                  <FareRow
                    label="Distance Fare"
                    amount={breakdown.distanceFare}
                  />
                )}

                {typeof breakdown?.timeFare === "number" && (
                  <FareRow
                    label="Time Fare"
                    amount={breakdown.timeFare}
                  />
                )}

                {typeof breakdown?.serviceFee === "number" && (
                  <FareRow
                    label="Service Fee"
                    amount={breakdown.serviceFee}
                  />
                )}

                {typeof breakdown?.discount === "number" && (
                  <FareRow
                    label="Discount"
                    amount={-Math.abs(breakdown.discount)}
                  />
                )}

                <div className="border-t border-[#EEEAF1] pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold text-[#302B34]">
                      Total Fare
                    </span>

                    <span className="text-[20px] font-bold text-[#302B34]">
                      {typeof finalFare === "number"
                        ? formatMoney(finalFare)
                        : "—"}
                    </span>
                  </div>
                </div>

              </div>

              {/* PAYMENT METHOD */}

              <div className="my-6 border-t border-dashed border-[#E8E2EB]" />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CreditCard
                    size={18}
                    className="text-[#7442AD]"
                  />

                  <span className="text-[13px] text-[#918B95]">
                    Payment Method
                  </span>
                </div>

                <span className="text-[14px] font-semibold capitalize text-[#302B34]">
                  {paymentMethod}
                </span>
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-[13px] bg-[#F3ECF9] p-3">
                <ShieldCheck
                  size={17}
                  className="shrink-0 text-[#7442AD]"
                />

                <p className="text-[12px] leading-5 text-[#817A85]">
                  This receipt reflects the trip and payment
                  information confirmed by SurDrive.
                </p>
              </div>

            </div>

          </motion.div>

          {/* ERROR */}

          {requestError && (
            <div className="mt-4 rounded-[13px] bg-[#FFF4F4] p-4 text-center">
              <p className="text-[13px] text-[#B74B4B]">
                Unable to refresh the latest receipt or payment details.
              </p>

              <button
                type="button"
                onClick={() => void handleRefresh()}
                className="mt-2 inline-flex items-center gap-2 text-[13px] font-semibold text-[#7442AD]"
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "animate-spin" : ""}
                />
                Retry
              </button>
            </div>
          )}

          {/* ACTIONS */}

          <div className="space-y-3 mt-7 print:hidden">

            <div className="grid grid-cols-2 gap-3">

              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => void shareReceipt()}
                disabled={!paid}
                className="flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-[#F3ECF9] text-[14px] font-semibold text-[#7442AD] disabled:opacity-50"
              >
                <Share2 size={18} />
                Share
              </motion.button>

              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={downloadReceipt}
                disabled={!paid}
                className="flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-[#F3ECF9] text-[14px] font-semibold text-[#7442AD] disabled:opacity-50"
              >
                <Download size={18} />
                Save PDF
              </motion.button>

            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => void handleContinue()}
              disabled={!paid || continuing}
              className="flex h-[56px] w-full items-center justify-center gap-2 rounded-[15px] bg-[#7442AD] text-[16px] font-semibold text-white disabled:opacity-50"
            >
              {continuing ? (
                <>
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                  />
                  Confirming Payment...
                </>
              ) : (
                <>
                  Rate Your Driver
                  <ArrowRight size={19} />
                </>
              )}
            </motion.button>

            {!paid && (
              <button
                type="button"
                onClick={() => navigate(PAYMENT_ROUTE)}
                className="flex h-[48px] w-full items-center justify-center text-[14px] font-semibold text-[#7442AD]"
              >
                Return to Payment
              </button>
            )}

          </div>

        </main>

      </div>
    </div>
  );
}

/* =====================================================
   FARE ROW
===================================================== */

function FareRow({
  label,
  amount,
}: {
  label: string;
  amount: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-[#918B95]">
        {label}
      </span>

      <span className="text-[14px] font-medium text-[#302B34]">
        {amount < 0 ? "-" : ""}
        {formatMoney(Math.abs(amount))}
      </span>
    </div>
  );
}

// "use client";

// import {
//   ArrowLeft,
//   ArrowRight,
//   Check,
//   Clock3,
//   CreditCard,
//   Download,
//   MapPin,
//   ReceiptText,
//   Route,
//   Share2,
//   ShieldCheck,
//   LoaderCircle,
//   RefreshCw,
// } from "lucide-react";

// import { motion } from "framer-motion";
// import { useCallback, useEffect, useRef, useState } from "react";
// import { Navigate, useNavigate } from "react-router-dom";
// import { toast } from "sonner";

// import {
//   passengerRideApi,
//   type PassengerRideResponse,
// } from "../../../api/passenger/rides";

// import {
//   getStoredActiveRide,
//   getStoredActiveRideId,
//   storeActiveRide,
// } from "../../../utils/passengerActiveRide";

// import { useRideSocket } from "../../../hooks/passenger/useRideSocket";

// /* =====================================================
//    CONFIG
// ===================================================== */

// const POLL_INTERVAL = 5000;
// const RATE_ROUTE = "/passenger/ride/rate";
// const TOKEN_KEY = "passenger_access_token";

// /* =====================================================
//    TYPES
// ===================================================== */

// type ReceiptRide = PassengerRideResponse & {
//   paymentStatus?: string | null;
//   paymentReference?: string | null;
//   transactionReference?: string | null;
//   completedAt?: string | null;
//   createdAt?: string | null;
//   fareBreakdown?: PassengerRideResponse["fareBreakdown"] & {
//     baseFare?: number;
//     distanceFare?: number;
//     timeFare?: number;
//     serviceFee?: number;
//     discount?: number;
//   };
// };

// /* =====================================================
//    HELPERS
// ===================================================== */

// function getToken() {
//   return localStorage.getItem(TOKEN_KEY);
// }

// function formatMoney(amount: number) {
//   return `₦${amount.toLocaleString("en-NG", {
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 2,
//   })}`;
// }

// function normalize(value?: string | null) {
//   return (value ?? "")
//     .toLowerCase()
//     .replace(/[\s-]+/g, "_");
// }

// function isPaymentConfirmed(
//   ride: ReceiptRide | null,
// ) {
//   if (!ride) return false;

//   const rideStatus = normalize(ride.status);
//   const paymentStatus = normalize(ride.paymentStatus);

//   return (
//     rideStatus === "paid" ||
//     paymentStatus === "paid" ||
//     paymentStatus === "success" ||
//     paymentStatus === "successful"
//   );
// }

// function formatDate(value?: string | null) {
//   if (!value) return "—";

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return "—";
//   }

//   return date.toLocaleString("en-NG", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//     hour: "numeric",
//     minute: "2-digit",
//   });
// }

// function getLocationLabel(
//   location: unknown,
//   fallback: string,
// ) {
//   if (!location || typeof location !== "object") {
//     return fallback;
//   }

//   const record = location as Record<string, unknown>;

//   if (typeof record.label === "string" && record.label) {
//     return record.label;
//   }

//   if (typeof record.address === "string" && record.address) {
//     return record.address;
//   }

//   return fallback;
// }

// /* =====================================================
//    COMPONENT
// ===================================================== */

// export default function TripReceipt() {
//   const navigate = useNavigate();

//   const [backendRide, setBackendRide] =
//     useState<PassengerRideResponse | null>(
//       () => getStoredActiveRide(),
//     );

//   const [token, setToken] =
//     useState<string | null>(getToken);

//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [requestError, setRequestError] = useState(false);

//   const mountedRef = useRef(true);
//   const fetchingRef = useRef(false);

//   const rideId =
//     backendRide?.id ?? getStoredActiveRideId();

//   /* =====================================================
//      TOKEN
//   ===================================================== */

//   useEffect(() => {
//     mountedRef.current = true;

//     const syncToken = () => {
//       setToken(getToken());
//     };

//     window.addEventListener("storage", syncToken);

//     return () => {
//       mountedRef.current = false;
//       window.removeEventListener("storage", syncToken);
//     };
//   }, []);

//   /* =====================================================
//      UPDATE RIDE
//   ===================================================== */

//   const handleRideUpdate = useCallback(
//     (response: PassengerRideResponse) => {
//       if (!mountedRef.current || !response?.id) {
//         return;
//       }

//       if (rideId && response.id !== rideId) {
//         return;
//       }

//       setBackendRide(response);
//       storeActiveRide(response);
//       setLoading(false);
//       setRequestError(false);
//     },
//     [rideId],
//   );

//   /* =====================================================
//      SOCKET
//   ===================================================== */

//   const { connected } = useRideSocket({
//     rideId,
//     token,
//     enabled: Boolean(rideId && token),
//     onRideUpdate: handleRideUpdate,
//   });

//   /* =====================================================
//      REFRESH
//   ===================================================== */

//   const refreshRide = useCallback(async () => {
//     if (!rideId || fetchingRef.current) return;

//     fetchingRef.current = true;

//     try {
//       const response =
//         await passengerRideApi.getRide(rideId);

//       if (mountedRef.current) {
//         handleRideUpdate(response);
//       }
//     } catch (error) {
//       console.error("RECEIPT LOAD ERROR:", error);

//       if (mountedRef.current) {
//         setRequestError(true);
//         setLoading(false);
//       }
//     } finally {
//       fetchingRef.current = false;
//     }
//   }, [rideId, handleRideUpdate]);

//   useEffect(() => {
//     void refreshRide();
//   }, [refreshRide]);

//   /* =====================================================
//      FALLBACK POLLING
//   ===================================================== */

//   useEffect(() => {
//     if (!rideId || connected) return;

//     const interval = window.setInterval(() => {
//       void refreshRide();
//     }, POLL_INTERVAL);

//     return () => window.clearInterval(interval);
//   }, [rideId, connected, refreshRide]);

//   const handleRefresh = async () => {
//     setRefreshing(true);

//     try {
//       await refreshRide();
//     } finally {
//       if (mountedRef.current) {
//         setRefreshing(false);
//       }
//     }
//   };

//   /* =====================================================
//      ROUTE GUARD
//   ===================================================== */

//   if (!rideId) {
//     return (
//       <Navigate
//         to="/passenger/home"
//         replace
//       />
//     );
//   }

//   const receiptRide =
//     backendRide as ReceiptRide | null;

//   const paid = isPaymentConfirmed(receiptRide);

//   const finalFare =
//     receiptRide?.finalFare ??
//     receiptRide?.fareBreakdown?.total ??
//     receiptRide?.estimatedFare;

//   const duration =
//     receiptRide?.actualDurationMin ??
//     receiptRide?.estimatedDurationMin;

//   const distance =
//     receiptRide?.actualDistanceKm ??
//     receiptRide?.estimatedDistanceKm;

//   const pickupLabel = getLocationLabel(
//     receiptRide?.pickup,
//     "Pickup location",
//   );

//   const destinationLabel = getLocationLabel(
//     receiptRide?.dropoff,
//     "Destination",
//   );

//   const paymentMethod =
//     receiptRide?.paymentMethod || "Online payment";

//   const reference =
//     receiptRide?.transactionReference ??
//     receiptRide?.paymentReference ??
//     null;

//   const receiptDate =
//     receiptRide?.completedAt ??
//     receiptRide?.createdAt;

//   const breakdown = receiptRide?.fareBreakdown;

//   /* =====================================================
//      RECEIPT TEXT
//   ===================================================== */

//   const receiptText = [
//     "SURDRIVE — TRIP RECEIPT",
//     "",
//     `Ride ID: ${rideId}`,
//     `Date: ${formatDate(receiptDate)}`,
//     `Pickup: ${pickupLabel}`,
//     `Destination: ${destinationLabel}`,
//     `Duration: ${
//       typeof duration === "number"
//         ? `${duration} min`
//         : "—"
//     }`,
//     `Distance: ${
//       typeof distance === "number"
//         ? `${distance.toFixed(1)} km`
//         : "—"
//     }`,
//     `Total: ${
//       typeof finalFare === "number"
//         ? formatMoney(finalFare)
//         : "—"
//     }`,
//     `Payment Method: ${paymentMethod}`,
//     `Payment Status: ${
//       paid ? "Paid" : "Not confirmed"
//     }`,
//     ...(reference
//       ? [`Transaction Reference: ${reference}`]
//       : []),
//   ].join("\n");

//   /* =====================================================
//      SHARE
//   ===================================================== */

//   const shareReceipt = async () => {
//     if (!paid) {
//       toast.error(
//         "Payment must be confirmed before sharing a paid receipt.",
//       );
//       return;
//     }

//     try {
//       if (navigator.share) {
//         await navigator.share({
//           title: "SurDrive Trip Receipt",
//           text: receiptText,
//         });
//       } else {
//         await navigator.clipboard.writeText(receiptText);
//         toast.success("Receipt copied to clipboard.");
//       }
//     } catch (error) {
//       if (
//         error instanceof DOMException &&
//         error.name === "AbortError"
//       ) {
//         return;
//       }

//       toast.error("Unable to share receipt.");
//     }
//   };

//   /* =====================================================
//      DOWNLOAD

//      This creates a printable receipt using the
//      browser's native print-to-PDF feature.
//   ===================================================== */

//   const downloadReceipt = () => {
//     if (!paid) {
//       toast.error(
//         "Payment must be confirmed before downloading a paid receipt.",
//       );
//       return;
//     }

//     window.print();
//   };

//   /* =====================================================
//      LOADING
//   ===================================================== */

//   if (loading && !backendRide) {
//     return (
//       <div className="flex min-h-[100dvh] items-center justify-center bg-white">
//         <div className="text-center">
//           <LoaderCircle
//             size={32}
//             className="mx-auto animate-spin text-[#7442AD]"
//           />

//           <p className="mt-4 text-[14px] text-[#918B95]">
//             Preparing your receipt...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   /* =====================================================
//      RENDER
//   ===================================================== */

//   return (
//     <div className="min-h-[100dvh] bg-[#F8F7FA]">
//       <div className="mx-auto min-h-[100dvh] w-full max-w-[480px] bg-white">

//         {/* HEADER */}

//         <header className="flex h-[76px] items-center justify-between border-b border-[#F1EDF3] px-5 print:hidden">
//           <button
//             type="button"
//             onClick={() =>
//               navigate("/passenger/ride/payment")
//             }
//             aria-label="Back to payment"
//             className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F5F8]"
//           >
//             <ArrowLeft size={20} />
//           </button>

//           <h1 className="text-[17px] font-semibold text-[#302B34]">
//             Trip Receipt
//           </h1>

//           <div className="w-10" />
//         </header>

//         <main className="px-5 pb-10 pt-7">

//           {/* RECEIPT CARD */}

//           <motion.div
//             initial={{ opacity: 0, y: 18 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.4 }}
//             className="overflow-hidden rounded-[24px] border border-[#EEEAF1] bg-white shadow-[0_12px_45px_rgba(40,20,60,0.06)] print:border-0 print:shadow-none"
//           >

//             {/* RECEIPT TOP */}

//             <div className="bg-[#7442AD] px-6 pb-8 pt-7 text-center text-white">

//               <div className="flex items-center justify-center mx-auto rounded-full h-14 w-14 bg-white/15">
//                 <ReceiptText size={27} />
//               </div>

//               <h2 className="mt-4 text-[22px] font-bold">
//                 SurDrive
//               </h2>

//               <p className="mt-1 text-[12px] text-white/75">
//                 Your Trip Receipt
//               </p>

//               <p className="mt-6 text-[34px] font-bold tracking-tight">
//                 {typeof finalFare === "number"
//                   ? formatMoney(finalFare)
//                   : "—"}
//               </p>

//               <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[12px] font-semibold">
//                 {paid ? (
//                   <>
//                     <Check size={15} />
//                     Payment Successful
//                   </>
//                 ) : (
//                   <>
//                     <Clock3 size={15} />
//                     Payment Not Confirmed
//                   </>
//                 )}
//               </div>

//             </div>

//             {/* RECEIPT BODY */}

//             <div className="px-5 py-6">

//               {/* RIDE DETAILS */}

//               <div className="flex items-center justify-between gap-3">
//                 <span className="text-[13px] text-[#918B95]">
//                   Trip ID
//                 </span>

//                 <span className="max-w-[65%] break-all text-right text-[12px] font-semibold text-[#302B34]">
//                   {rideId}
//                 </span>
//               </div>

//               <div className="flex items-center justify-between gap-3 mt-4">
//                 <span className="text-[13px] text-[#918B95]">
//                   Date
//                 </span>

//                 <span className="text-right text-[13px] font-medium text-[#302B34]">
//                   {formatDate(receiptDate)}
//                 </span>
//               </div>

//               {reference && (
//                 <div className="flex items-center justify-between gap-3 mt-4">
//                   <span className="text-[13px] text-[#918B95]">
//                     Reference
//                   </span>

//                   <span className="max-w-[65%] break-all text-right text-[12px] font-semibold text-[#302B34]">
//                     {reference}
//                   </span>
//                 </div>
//               )}

//               {/* DIVIDER */}

//               <div className="my-6 border-t border-dashed border-[#E8E2EB]" />

//               {/* ROUTE */}

//               <div className="relative space-y-6">

//                 <div className="flex items-start gap-3">
//                   <div className="mt-1 h-3 w-3 shrink-0 rounded-full border-[3px] border-[#7442AD]" />

//                   <div>
//                     <p className="text-[12px] text-[#918B95]">
//                       Pickup
//                     </p>

//                     <p className="mt-1 text-[14px] font-semibold text-[#302B34]">
//                       {pickupLabel}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-start gap-3">
//                   <MapPin
//                     size={17}
//                     className="shrink-0 text-[#7442AD]"
//                   />

//                   <div>
//                     <p className="text-[12px] text-[#918B95]">
//                       Destination
//                     </p>

//                     <p className="mt-1 text-[14px] font-semibold text-[#302B34]">
//                       {destinationLabel}
//                     </p>
//                   </div>
//                 </div>

//               </div>

//               {/* DIVIDER */}

//               <div className="my-6 border-t border-dashed border-[#E8E2EB]" />

//               {/* TRIP STATS */}

//               <div className="grid grid-cols-2 gap-3">

//                 <div className="rounded-[14px] bg-[#F7F5F8] p-4">
//                   <Clock3
//                     size={18}
//                     className="text-[#7442AD]"
//                   />

//                   <p className="mt-2 text-[12px] text-[#918B95]">
//                     Duration
//                   </p>

//                   <p className="mt-1 text-[15px] font-semibold text-[#302B34]">
//                     {typeof duration === "number"
//                       ? `${Math.round(duration)} min`
//                       : "—"}
//                   </p>
//                 </div>

//                 <div className="rounded-[14px] bg-[#F7F5F8] p-4">
//                   <Route
//                     size={18}
//                     className="text-[#7442AD]"
//                   />

//                   <p className="mt-2 text-[12px] text-[#918B95]">
//                     Distance
//                   </p>

//                   <p className="mt-1 text-[15px] font-semibold text-[#302B34]">
//                     {typeof distance === "number"
//                       ? `${distance.toFixed(1)} km`
//                       : "—"}
//                   </p>
//                 </div>

//               </div>

//               {/* FARE BREAKDOWN */}

//               <div className="my-6 border-t border-dashed border-[#E8E2EB]" />

//               <h3 className="text-[15px] font-semibold text-[#302B34]">
//                 Fare Breakdown
//               </h3>

//               <div className="mt-4 space-y-3">

//                 {typeof breakdown?.baseFare === "number" && (
//                   <FareRow
//                     label="Base Fare"
//                     amount={breakdown.baseFare}
//                   />
//                 )}

//                 {typeof breakdown?.distanceFare === "number" && (
//                   <FareRow
//                     label="Distance Fare"
//                     amount={breakdown.distanceFare}
//                   />
//                 )}

//                 {typeof breakdown?.timeFare === "number" && (
//                   <FareRow
//                     label="Time Fare"
//                     amount={breakdown.timeFare}
//                   />
//                 )}

//                 {typeof breakdown?.serviceFee === "number" && (
//                   <FareRow
//                     label="Service Fee"
//                     amount={breakdown.serviceFee}
//                   />
//                 )}

//                 {typeof breakdown?.discount === "number" && (
//                   <FareRow
//                     label="Discount"
//                     amount={-Math.abs(breakdown.discount)}
//                   />
//                 )}

//                 <div className="border-t border-[#EEEAF1] pt-4">
//                   <div className="flex items-center justify-between">
//                     <span className="text-[15px] font-semibold text-[#302B34]">
//                       Total Fare
//                     </span>

//                     <span className="text-[20px] font-bold text-[#302B34]">
//                       {typeof finalFare === "number"
//                         ? formatMoney(finalFare)
//                         : "—"}
//                     </span>
//                   </div>
//                 </div>

//               </div>

//               {/* PAYMENT METHOD */}

//               <div className="my-6 border-t border-dashed border-[#E8E2EB]" />

//               <div className="flex items-center justify-between gap-3">
//                 <div className="flex items-center gap-2">
//                   <CreditCard
//                     size={18}
//                     className="text-[#7442AD]"
//                   />

//                   <span className="text-[13px] text-[#918B95]">
//                     Payment Method
//                   </span>
//                 </div>

//                 <span className="text-[14px] font-semibold capitalize text-[#302B34]">
//                   {paymentMethod}
//                 </span>
//               </div>

//               <div className="mt-5 flex items-center gap-2 rounded-[13px] bg-[#F3ECF9] p-3">
//                 <ShieldCheck
//                   size={17}
//                   className="shrink-0 text-[#7442AD]"
//                 />

//                 <p className="text-[12px] leading-5 text-[#817A85]">
//                   This receipt reflects the trip and payment
//                   information confirmed by SurDrive.
//                 </p>
//               </div>

//             </div>

//           </motion.div>

//           {/* ERROR */}

//           {requestError && (
//             <div className="mt-4 rounded-[13px] bg-[#FFF4F4] p-4 text-center">
//               <p className="text-[13px] text-[#B74B4B]">
//                 Unable to refresh the latest receipt details.
//               </p>

//               <button
//                 type="button"
//                 onClick={() => void handleRefresh()}
//                 className="mt-2 inline-flex items-center gap-2 text-[13px] font-semibold text-[#7442AD]"
//               >
//                 <RefreshCw
//                   size={14}
//                   className={refreshing ? "animate-spin" : ""}
//                 />
//                 Retry
//               </button>
//             </div>
//           )}

//           {/* ACTIONS */}

//           <div className="space-y-3 mt-7 print:hidden">

//             <div className="grid grid-cols-2 gap-3">

//               <motion.button
//                 type="button"
//                 whileTap={{ scale: 0.98 }}
//                 onClick={() => void shareReceipt()}
//                 disabled={!paid}
//                 className="flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-[#F3ECF9] text-[14px] font-semibold text-[#7442AD] disabled:opacity-50"
//               >
//                 <Share2 size={18} />
//                 Share
//               </motion.button>

//               <motion.button
//                 type="button"
//                 whileTap={{ scale: 0.98 }}
//                 onClick={downloadReceipt}
//                 disabled={!paid}
//                 className="flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-[#F3ECF9] text-[14px] font-semibold text-[#7442AD] disabled:opacity-50"
//               >
//                 <Download size={18} />
//                 Save PDF
//               </motion.button>

//             </div>

//             <motion.button
//               type="button"
//               whileTap={{ scale: 0.98 }}
//               onClick={() => navigate(RATE_ROUTE)}
//               disabled={!paid}
//               className="flex h-[56px] w-full items-center justify-center gap-2 rounded-[15px] bg-[#7442AD] text-[16px] font-semibold text-white disabled:opacity-50"
//             >
//               Rate Your Driver
//               <ArrowRight size={19} />
//             </motion.button>

//             {!paid && (
//               <button
//                 type="button"
//                 onClick={() =>
//                   navigate("/passenger/ride/payment")
//                 }
//                 className="flex h-[48px] w-full items-center justify-center text-[14px] font-semibold text-[#7442AD]"
//               >
//                 Return to Payment
//               </button>
//             )}

//           </div>

//         </main>

//       </div>
//     </div>
//   );
// }

// /* =====================================================
//    FARE ROW
// ===================================================== */

// function FareRow({
//   label,
//   amount,
// }: {
//   label: string;
//   amount: number;
// }) {
//   return (
//     <div className="flex items-center justify-between gap-3">
//       <span className="text-[13px] text-[#918B95]">
//         {label}
//       </span>

//       <span className="text-[14px] font-medium text-[#302B34]">
//         {amount < 0 ? "-" : ""}
//         {formatMoney(Math.abs(amount))}
//       </span>
//     </div>
//   );
// }