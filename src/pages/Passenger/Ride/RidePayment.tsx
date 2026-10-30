"use client";

import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  WalletCards,
  X,
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
} from "../../../api/passenger/rides";

import {
  passengerPaymentApi,
  type RidePaymentState,
  type RideCheckoutResponse,
} from "../../../api/passenger/payment";

import {
  getStoredActiveRide,
  getStoredActiveRideId,
  storeActiveRide,
} from "../../../utils/passengerActiveRide";

import {
  useRideSocket,
} from "../../../hooks/passenger/useRideSocket";

/* =========================================================
   CONFIGURATION
========================================================= */

const RECEIPT_ROUTE = "/passenger/ride/receipt";

const COMPLETE_ROUTE = "/passenger/ride/complete";

const POLL_INTERVAL = 10_000;

type SupportedPaymentMethod = "cash" | "card";

/* =========================================================
   HELPERS
========================================================= */

function normalize(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getPaymentMethod(
  payment: RidePaymentState | null,
  ride: PassengerRideResponse | null,
): SupportedPaymentMethod | null {
  /*
   * The payment endpoint is authoritative.
   *
   * Once loaded, do not fall back to an older
   * locally stored payment method.
   */
  const method = payment
    ? normalize(payment.bookedMethod)
    : normalize(ride?.paymentMethod);

  if (method === "cash") {
    return "cash";
  }

  if (method === "card") {
    return "card";
  }

  return null;
}

function isPaymentConfirmed(
  payment: RidePaymentState | null,
): boolean {
  /*
   * Do not infer payment confirmation from:
   *
   * - ride_completed
   * - payment_pending
   * - checkout initialized
   * - successful redirect
   * - paid-looking local ride data
   *
   * The payment endpoint must confirm paid=true.
   */
  return payment?.paid === true;
}

function formatCurrency(
  amount?: number | null,
): string {
  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount)
  ) {
    return "—";
  }

  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    error &&
    typeof error === "object"
  ) {
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

    if (
      typeof message === "string" &&
      message.trim()
    ) {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(", ");
    }
  }

  return fallback;
}

function getCheckoutUrl(
  response: RideCheckoutResponse,
): string | null {
  if (
    normalize(response.status) === "failed"
  ) {
    return null;
  }

  return response.redirectUrl ?? null;
}

function validatePaystackUrl(
  value: string,
): string {
  const url = new URL(value);

  if (
    url.protocol !== "https:" ||
    url.hostname !== "checkout.paystack.com"
  ) {
    throw new Error(
      "The payment gateway returned an invalid checkout URL.",
    );
  }

  return url.toString();
}

/* =========================================================
   COMPONENT
========================================================= */

export default function RidePayment() {
  const navigate = useNavigate();

  /* =======================================================
     INITIAL RIDE
  ======================================================= */

  const [ride, setRide] =
    useState<PassengerRideResponse | null>(
      () => getStoredActiveRide(),
    );

  const rideId =
    ride?.id ??
    getStoredActiveRideId();

  /* =======================================================
     STATE
  ======================================================= */

  const [payment, setPayment] =
    useState<RidePaymentState | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [checking, setChecking] =
    useState(false);

  const [
    startingCheckout,
    setStartingCheckout,
  ] = useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /* =======================================================
     REFS
  ======================================================= */

  const mountedRef = useRef(false);

  const fetchingRef = useRef(false);

  const verifyingRef = useRef(false);

  const checkoutRef = useRef(false);

  const navigatingRef = useRef(false);

  const modalDismissedRef = useRef(false);

  /*
   * Avoid state updates from requests belonging
   * to a previous component lifecycle.
   */
  const requestGenerationRef = useRef(0);

  /* =======================================================
     PAYMENT DETAILS
  ======================================================= */

  const paymentMethod = getPaymentMethod(
    payment,
    ride,
  );

  const isCash =
    paymentMethod === "cash";

  const isCard =
    paymentMethod === "card";

  const paid = isPaymentConfirmed(payment);

  const payable =
    payment?.payable === true;

  const fare =
    typeof payment?.amount === "number"
      ? payment.amount
      : ride?.finalFare ??
        ride?.fareBreakdown?.total ??
        ride?.estimatedFare ??
        null;

  /* =======================================================
     AUTH TOKEN
  ======================================================= */

  const token =
    localStorage.getItem(
      "passenger_access_token",
    );

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const goToReceipt = useCallback(() => {
    if (
      navigatingRef.current ||
      !rideId
    ) {
      return;
    }

    navigatingRef.current = true;

    sessionStorage.removeItem(
      `surdrive_payment_checkout_${rideId}`,
    );

    setShowModal(false);

    navigate(RECEIPT_ROUTE, {
      replace: true,
    });
  }, [navigate, rideId]);

  /* =======================================================
     LOAD PAYMENT

     Both cash and card use the same authoritative
     payment endpoint.

     CASH:
     - Wait for paid=true
     - Never open Paystack

     CARD:
     - Wait for paid=true
     - Allow checkout only when payable=true
  ======================================================= */

  const loadPayment = useCallback(
    async (showRefreshing = false) => {
      if (
        !rideId ||
        fetchingRef.current ||
        navigatingRef.current
      ) {
        return;
      }

      const generation =
        requestGenerationRef.current;

      fetchingRef.current = true;

      if (showRefreshing) {
        setRefreshing(true);
      }

      try {
        const [
          rideResponse,
          paymentResponse,
        ] = await Promise.all([
          passengerRideApi.getRide(rideId),

          passengerPaymentApi.getPayment(
            rideId,
          ),
        ]);

        if (
          !mountedRef.current ||
          generation !== requestGenerationRef.current ||
          navigatingRef.current
        ) {
          return;
        }

        setRide(rideResponse);

        storeActiveRide(rideResponse);

        setPayment(paymentResponse);

        setError(null);

        const method = getPaymentMethod(
          paymentResponse,
          rideResponse,
        );

        const confirmedPaid =
          isPaymentConfirmed(paymentResponse);

        /* -----------------------------------------------
           PAYMENT CONFIRMED

           Applies to BOTH cash and card.
        ----------------------------------------------- */

        if (confirmedPaid) {
          setShowModal(false);

          goToReceipt();

          return;
        }

        /* -----------------------------------------------
           CASH

           No card modal.
           No Paystack checkout.
           Wait for backend settlement.
        ----------------------------------------------- */

        if (method === "cash") {
          setShowModal(false);

          return;
        }

        /* -----------------------------------------------
           UNKNOWN PAYMENT METHOD

           Do not assume card.
        ----------------------------------------------- */

        if (method !== "card") {
          setShowModal(false);

          return;
        }

        /* -----------------------------------------------
           CARD

           Only show payment modal when the backend
           says the payment is payable.
        ----------------------------------------------- */

        if (
          paymentResponse.payable === true &&
          !modalDismissedRef.current
        ) {
          setShowModal(true);
        } else {
          setShowModal(false);
        }
      } catch (err) {
        console.error(
          "LOAD RIDE PAYMENT ERROR:",
          err,
        );

        if (
          mountedRef.current &&
          generation === requestGenerationRef.current
        ) {
          setError(
            getErrorMessage(
              err,
              "Unable to load payment details. Please try again.",
            ),
          );
        }
      } finally {
        fetchingRef.current = false;

        if (
          mountedRef.current &&
          generation === requestGenerationRef.current
        ) {
          setLoading(false);

          setRefreshing(false);
        }
      }
    },
    [
      rideId,
      goToReceipt,
    ],
  );

  /* =======================================================
     SOCKET UPDATE

     A ride status of "paid" triggers a refresh,
     NOT immediate navigation.

     We navigate only after the payment endpoint
     confirms paid=true.
  ======================================================= */

  const handleRideUpdate = useCallback(
    (response: PassengerRideResponse) => {
      if (
        !mountedRef.current ||
        navigatingRef.current
      ) {
        return;
      }

      setRide(response);

      storeActiveRide(response);

      const status = normalize(
        response.status,
      );

      if (
        status === "paid" ||
        status === "closed" ||
        status === "ride_completed" ||
        status === "payment_pending"
      ) {
        void loadPayment();
      }
    },
    [loadPayment],
  );

  /* =======================================================
     WEBSOCKET
  ======================================================= */

  const { connected } = useRideSocket({
    rideId,

    token,

    enabled: Boolean(
      rideId && token,
    ),

    onRideUpdate:
      handleRideUpdate,
  });

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    mountedRef.current = true;

    requestGenerationRef.current += 1;

    void loadPayment();

    return () => {
      mountedRef.current = false;

      requestGenerationRef.current += 1;
    };
  }, [loadPayment]);

  /* =======================================================
     VISIBILITY / FOCUS

     Useful when the passenger:
     - Returns from another app
     - Unlocks their phone
     - Switches back to SurDrive
  ======================================================= */

  useEffect(() => {
    if (!rideId) {
      return;
    }

    const handleVisibility = () => {
      if (
        document.visibilityState === "visible"
      ) {
        void loadPayment();
      }
    };

    const handleFocus = () => {
      void loadPayment();
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibility,
    );

    window.addEventListener(
      "focus",
      handleFocus,
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility,
      );

      window.removeEventListener(
        "focus",
        handleFocus,
      );
    };
  }, [rideId, loadPayment]);

  /* =======================================================
     SOCKET RECONNECTION
  ======================================================= */

  useEffect(() => {
    if (connected) {
      void loadPayment();
    }
  }, [connected, loadPayment]);

  /* =======================================================
     FALLBACK POLLING

     Applies to BOTH cash and card.

     A cash payment may be confirmed from the
     driver's application or the backend.

     Keep polling while unresolved, even when
     the websocket is connected, at a reduced
     frequency if needed.

     This protects against missed socket events.
  ======================================================= */

  useEffect(() => {
    if (
      !rideId ||
      paid ||
      navigatingRef.current
    ) {
      return;
    }

    const poll = () => {
      if (
        document.visibilityState !== "visible" ||
        fetchingRef.current ||
        verifyingRef.current ||
        navigatingRef.current
      ) {
        return;
      }

      void loadPayment();
    };

    const interval = window.setInterval(
      poll,
      connected
        ? 15_000
        : POLL_INTERVAL,
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [
    rideId,
    paid,
    connected,
    loadPayment,
  ]);

  /* =======================================================
     VERIFY CARD PAYMENT

     Only Card may call the payment verification API.

     Cash never calls Paystack verification.
  ======================================================= */

  const verifyPayment = useCallback(
    async () => {
      if (
        !rideId ||
        !isCard ||
        paid ||
        verifyingRef.current ||
        navigatingRef.current
      ) {
        return;
      }

      verifyingRef.current = true;

      setChecking(true);

      try {
        await passengerPaymentApi.verify(
          rideId,
        );

        if (!mountedRef.current) {
          return;
        }

        /*
         * The verify response may not contain
         * the complete payment state.
         *
         * Refresh the authoritative endpoint.
         */
        await loadPayment(true);
      } catch (err) {
        console.error(
          "CARD PAYMENT VERIFICATION ERROR:",
          err,
        );

        if (mountedRef.current) {
          toast.error(
            getErrorMessage(
              err,
              "Unable to verify your card payment.",
            ),
          );
        }
      } finally {
        verifyingRef.current = false;

        if (mountedRef.current) {
          setChecking(false);
        }
      }
    },
    [
      rideId,
      isCard,
      paid,
      loadPayment,
    ],
  );

  /* =======================================================
     START PAYSTACK CHECKOUT

     Only CARD bookings can reach this function.

     Reuse an existing checkout when the backend
     provides one.
  ======================================================= */

  const startCheckout = async () => {
    if (
      !rideId ||
      loading ||
      startingCheckout ||
      checkoutRef.current ||
      navigatingRef.current ||
      !isCard ||
      !payable ||
      paid
    ) {
      return;
    }

    checkoutRef.current = true;

    setStartingCheckout(true);

    try {
      let checkoutUrl =
        payment?.pendingCheckout?.redirectUrl ??
        null;

      if (!checkoutUrl) {
        const response: RideCheckoutResponse =
          await passengerPaymentApi.checkout(
            rideId,
          );

        checkoutUrl = getCheckoutUrl(
          response,
        );
      }

      if (!checkoutUrl) {
        throw new Error(
          "The payment gateway did not return a checkout URL.",
        );
      }

      const validCheckoutUrl =
        validatePaystackUrl(
          checkoutUrl,
        );

      sessionStorage.setItem(
        `surdrive_payment_checkout_${rideId}`,
        "1",
      );

      /*
       * Paystack redirects back to the dedicated
       * PaymentCallback page configured by backend.
       */
      window.location.assign(
        validCheckoutUrl,
      );
    } catch (err) {
      console.error(
        "START CARD CHECKOUT ERROR:",
        err,
      );

      toast.error(
        getErrorMessage(
          err,
          "Unable to start card payment.",
        ),
      );

      checkoutRef.current = false;

      setStartingCheckout(false);
    }
  };

  /* =======================================================
     MODAL ACTIONS
  ======================================================= */

  const closeModal = () => {
    if (startingCheckout) {
      return;
    }

    modalDismissedRef.current = true;

    setShowModal(false);
  };

  const openModal = () => {
    if (
      !isCard ||
      !payable ||
      paid
    ) {
      return;
    }

    modalDismissedRef.current = false;

    setShowModal(true);
  };

  /* =======================================================
     ROUTE GUARD

     Keep after all hooks.
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
     RENDER
  ======================================================= */

  return (
    <div className="min-h-[100dvh] bg-[#F8F7FA]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[480px] bg-white">

        {/* ===============================================
            HEADER
        =============================================== */}

        <header className="flex h-[76px] items-center justify-between border-b border-[#F1EDF3] px-5">
          <button
            type="button"
            onClick={() =>
              navigate(COMPLETE_ROUTE)
            }
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F5F8]"
            aria-label="Back to trip summary"
          >
            <ArrowLeft
              size={20}
              className="text-[#302B34]"
            />
          </button>

          <h1 className="text-[17px] font-semibold text-[#302B34]">
            Ride Payment
          </h1>

          <div className="w-10" />
        </header>

        {/* ===============================================
            MAIN
        =============================================== */}

        <main className="px-5 pt-8 pb-10">

          {/* PAYMENT ICON */}

          <div className="mx-auto flex h-[78px] w-[78px] items-center justify-center rounded-full bg-[#F3ECF9]">
            {paid ? (
              <CheckCircle2
                size={37}
                className="text-[#2FA665]"
              />
            ) : isCash ? (
              <Banknote
                size={37}
                className="text-[#7442AD]"
              />
            ) : (
              <WalletCards
                size={37}
                className="text-[#7442AD]"
              />
            )}
          </div>

          {/* TITLE */}

          <h2 className="mt-5 text-center text-[23px] font-bold text-[#302B34]">
            {paid
              ? "Payment Successful"
              : loading
                ? "Checking Your Payment"
                : isCash
                  ? "Cash Payment"
                  : isCard
                    ? "Complete Your Payment"
                    : "Payment Details"}
          </h2>

          {/* DESCRIPTION */}

          <p className="mx-auto mt-2 max-w-[330px] text-center text-[14px] leading-6 text-[#918B95]">
            {paid
              ? "Your ride payment has been confirmed."
              : loading
                ? "Please wait while we retrieve your payment details."
                : isCash
                  ? "Please pay your final ride fare directly to your driver."
                  : isCard
                    ? "Complete your payment securely through Paystack."
                    : "We're checking the payment method for this ride."}
          </p>

          {/* ===============================================
              FARE CARD
          =============================================== */}

          <div className="mt-8 rounded-[20px] bg-[#F8F6FA] p-6 text-center">
            <p className="text-[13px] text-[#918B95]">
              Total Ride Fare
            </p>

            <p className="mt-2 text-[34px] font-bold text-[#302B34]">
              {formatCurrency(fare)}
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-[#7442AD]">
              {isCash ? (
                <Banknote size={16} />
              ) : (
                <CreditCard size={16} />
              )}

              <span>
                {isCash
                  ? "Cash"
                  : isCard
                    ? "Card"
                    : "Checking method"}
              </span>
            </div>
          </div>

          {/* ===============================================
              PAYMENT STATUS
          =============================================== */}

          <div className="mt-6 flex items-center justify-between rounded-[15px] border border-[#EEEAF1] p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3ECF9]">
                {paid ? (
                  <CheckCircle2
                    size={20}
                    className="text-[#2FA665]"
                  />
                ) : (
                  <Clock3
                    size={20}
                    className="text-[#7442AD]"
                  />
                )}
              </span>

              <div>
                <p className="text-[14px] font-semibold text-[#302B34]">
                  Payment Status
                </p>

                <p className="mt-1 text-[12px] text-[#918B95]">
                  {paid
                    ? "Payment confirmed"
                    : loading
                      ? "Checking payment..."
                      : isCash
                        ? "Awaiting cash confirmation"
                        : isCard && payable
                          ? "Ready for card payment"
                          : isCard
                            ? "Waiting for payment availability"
                            : "Checking payment method"}
                </p>
              </div>
            </div>

            {(loading ||
              checking ||
              refreshing) && (
              <LoaderCircle
                size={18}
                className="animate-spin text-[#7442AD]"
              />
            )}
          </div>

          {/* ===============================================
              CASH PAYMENT NOTICE
          =============================================== */}

          {!paid && isCash && (
            <motion.div
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mt-5 rounded-[16px] border border-[#F4E5C6] bg-[#FFF9EE] p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF0CD] text-[#B68B35]">
                  <Banknote size={21} />
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#725A2A]">
                    Pay Your Driver
                  </p>

                  <p className="mt-2 text-[12px] leading-5 text-[#947C4A]">
                    Please pay the displayed final fare
                    directly to your driver.
                  </p>

                  <p className="mt-2 text-[12px] leading-5 text-[#947C4A]">
                    Once your cash payment is recorded
                    and confirmed by SurDrive, your
                    receipt will become available
                    automatically.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===============================================
              CASH WAITING INDICATOR
          =============================================== */}

          {!paid && isCash && (
            <div className="mt-4 flex items-center gap-3 rounded-[14px] border border-[#EEEAF1] bg-[#FAF9FB] px-4 py-3">
              <LoaderCircle
                size={17}
                className="shrink-0 animate-spin text-[#7442AD]"
              />

              <p className="text-[12px] leading-5 text-[#817A85]">
                Waiting for payment confirmation.
                This page updates automatically.
              </p>
            </div>
          )}

          {/* ===============================================
              ERROR
          =============================================== */}

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-[13px] bg-[#FFF3F3] p-4">
              <AlertCircle
                size={18}
                className="shrink-0 text-[#BB5555]"
              />

              <p className="text-[13px] leading-5 text-[#BB5555]">
                {error}
              </p>
            </div>
          )}

          {/* ===============================================
              ACTIONS
          =============================================== */}

          <div className="space-y-3 mt-7">

            {/* CARD CHECKOUT */}

            {!paid &&
              !loading &&
              isCard &&
              payable && (
                <motion.button
                  type="button"
                  whileTap={{
                    scale: 0.98,
                  }}
                  disabled={startingCheckout}
                  onClick={openModal}
                  className="flex h-[56px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white transition disabled:opacity-50"
                >
                  {startingCheckout ? (
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />
                  ) : (
                    <CreditCard size={19} />
                  )}

                  {startingCheckout
                    ? "Opening Paystack..."
                    : "Pay with Card"}
                </motion.button>
              )}

            {/* VERIFY CARD PAYMENT */}

            {!paid &&
              !loading &&
              isCard && (
                <button
                  type="button"
                  disabled={
                    checking ||
                    startingCheckout
                  }
                  onClick={() =>
                    void verifyPayment()
                  }
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] border border-[#E6DDED] text-[14px] font-semibold text-[#7442AD] transition disabled:opacity-50"
                >
                  {checking ? (
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <RefreshCw size={18} />
                  )}

                  I've Completed Payment
                </button>
              )}

            {/* REFRESH PAYMENT STATUS */}

            {!paid && (
              <button
                type="button"
                disabled={
                  refreshing ||
                  loading
                }
                onClick={() =>
                  void loadPayment(true)
                }
                className="flex h-[48px] w-full items-center justify-center gap-2 text-[13px] font-medium text-[#918B95] transition disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                {isCash
                  ? "Check Cash Payment Status"
                  : "Refresh Payment Status"}
              </button>
            )}
          </div>

          {/* ===============================================
              SECURITY NOTICE
          =============================================== */}

          {isCard && (
            <div className="mt-8 flex items-start gap-3 rounded-[15px] bg-[#F3ECF9] p-4">
              <ShieldCheck
                size={20}
                className="shrink-0 text-[#7442AD]"
              />

              <p className="text-[12px] leading-5 text-[#817A85]">
                Your card payment is processed securely
                through Paystack. SurDrive will confirm
                your payment with the backend before
                issuing your receipt.
              </p>
            </div>
          )}

          {/* ===============================================
              CASH INFORMATION
          =============================================== */}

          {isCash && (
            <div className="mt-6 rounded-[15px] bg-[#F5F1F9] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-[#7442AD]"
                />

                <p className="text-[12px] leading-5 text-[#817A85]">
                  Cash payments are settled directly
                  with your driver. You do not need
                  to enter card details or visit
                  Paystack for this ride.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* ===============================================
            CARD PAYMENT MODAL

            Cash rides cannot open this modal.
        =============================================== */}

        <AnimatePresence>
          {showModal &&
            !loading &&
            !paid &&
            isCard &&
            payable && (
              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/45 px-3 pb-3 sm:items-center"
              >
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 30,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: 30,
                  }}
                  className="w-full max-w-[440px] rounded-[25px] bg-white p-6 shadow-[0_20px_70px_rgba(0,0,0,0.15)]"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="payment-modal-title"
                >
                  {/* MODAL HEADER */}

                  <div className="flex items-center justify-between gap-3">
                    <h3
                      id="payment-modal-title"
                      className="text-[19px] font-bold text-[#302B34]"
                    >
                      Complete Payment
                    </h3>

                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={startingCheckout}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F5F8] disabled:opacity-50"
                      aria-label="Close payment modal"
                    >
                      <X size={19} />
                    </button>
                  </div>

                  <p className="mt-2 text-[13px] leading-5 text-[#918B95]">
                    Pay your final ride fare securely
                    using your card.
                  </p>

                  {/* CARD OPTION */}

                  <div className="mt-6 flex items-center gap-3 rounded-[15px] border-2 border-[#7442AD] bg-[#F8F4FC] p-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#EEE4F7] text-[#7442AD]">
                      <CreditCard size={23} />
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-[#302B34]">
                        Pay with Card
                      </p>

                      <p className="mt-1 text-[12px] leading-5 text-[#918B95]">
                        Secure checkout through Paystack
                      </p>
                    </div>

                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7442AD] text-white">
                      <CheckCircle2 size={15} />
                    </span>
                  </div>

                  {/* TOTAL */}

                  <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#EEEAF1] pt-5">
                    <span className="text-[14px] text-[#918B95]">
                      Total to Pay
                    </span>

                    <span className="text-[24px] font-bold text-[#302B34]">
                      {formatCurrency(fare)}
                    </span>
                  </div>

                  {/* PAY BUTTON */}

                  <motion.button
                    type="button"
                    whileTap={{
                      scale: 0.98,
                    }}
                    disabled={
                      startingCheckout ||
                      !payable
                    }
                    onClick={() =>
                      void startCheckout()
                    }
                    className="mt-6 flex h-[56px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {startingCheckout ? (
                      <>
                        <LoaderCircle
                          size={19}
                          className="animate-spin"
                        />

                        Redirecting...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={19} />

                        Pay {formatCurrency(fare)}
                      </>
                    )}
                  </motion.button>

                  <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#96909A]">
                    <ShieldCheck size={13} />

                    Secure payment powered by Paystack
                  </div>
                </motion.div>
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// "use client";

// import {
//   ArrowLeft,
//   CheckCircle2,
//   Clock3,
//   CreditCard,
//   LoaderCircle,
//   RefreshCw,
//   ShieldCheck,
//   WalletCards,
//   X,
//   AlertCircle,
//   Banknote,
// } from "lucide-react";

// import {
//   AnimatePresence,
//   motion,
// } from "framer-motion";

// import {
//   useCallback,
//   useEffect,
//   useRef,
//   useState,
// } from "react";

// import {
//   Navigate,
//   useNavigate,
// } from "react-router-dom";

// import { toast } from "sonner";

// import {
//   passengerRideApi,
//   type PassengerRideResponse,
// } from "../../../api/passenger/rides";

// import {
//   passengerPaymentApi,
//   type RidePaymentState,
//   type RideCheckoutResponse,
// } from "../../../api/passenger/payment";

// import {
//   getStoredActiveRide,
//   getStoredActiveRideId,
//   storeActiveRide,
// } from "../../../utils/passengerActiveRide";

// import {
//   useRideSocket,
// } from "../../../hooks/passenger/useRideSocket";

// /* =========================================================
//    CONFIGURATION
// ========================================================= */

// const RECEIPT_ROUTE = "/passenger/ride/receipt";

// const COMPLETE_ROUTE = "/passenger/ride/complete";

// const POLL_INTERVAL = 5000;

// /* =========================================================
//    HELPERS
// ========================================================= */

// function normalize(value?: string | null) {
//   return (value ?? "")
//     .toLowerCase()
//     .replace(/[\s-]+/g, "_");
// }

// function formatCurrency(amount?: number | null) {
//   if (
//     typeof amount !== "number" ||
//     !Number.isFinite(amount)
//   ) {
//     return "—";
//   }

//   return `₦${amount.toLocaleString("en-NG", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })}`;
// }

// /* =========================================================
//    CHECKOUT URL
// ========================================================= */

// // function getCheckoutUrl(
// //   response: RideCheckoutResponse,
// // ): string | null {
// //   return (
// //     response.authorizationUrl ??
// //     response.checkoutUrl ??
// //     response.paymentUrl ??
// //     response.data?.authorization_url ??
// //     response.data?.authorizationUrl ??
// //     null
// //   );
// // }

// function getCheckoutUrl(
//   response: RideCheckoutResponse,
// ): string | null {
//   if (
//     response.status.toLowerCase() === "failed"
//   ) {
//     return null;
//   }

//   return response.redirectUrl;
// }

// /* =========================================================
//    PAYMENT CONFIRMATION

//    Only treat payment as successful when the backend
//    explicitly reports a paid state.

//    Do not treat:
//    - payment_pending
//    - checkout initialized
//    - redirect successful
//    - verified request completed

//    as proof of payment.
// ========================================================= */

// // function isPaymentConfirmed(
// //   payment: RidePaymentState | null,
// //   ride: PassengerRideResponse | null,
// // ) {
// //   const paymentStatus = normalize(
// //     payment?.paymentStatus ??
// //       payment?.status,
// //   );

// //   const rideStatus = normalize(ride?.status);

// //   return (
// //     paymentStatus === "paid" ||
// //     paymentStatus === "success" ||
// //     paymentStatus === "successful" ||
// //     rideStatus === "paid"
// //   );
// // }

// function isPaymentConfirmed(
//   payment: RidePaymentState | null,
//   ride: PassengerRideResponse | null,
// ): boolean {
//   if (payment) {
//     return payment.paid === true;
//   }

//   return ride?.status === "paid";
// }

// /* =========================================================
//    COMPONENT
// ========================================================= */

// export default function RidePayment() {
//   const navigate = useNavigate();

//   /* =======================================================
//      STATE
//   ======================================================= */

//   const [ride, setRide] =
//     useState<PassengerRideResponse | null>(
//       () => getStoredActiveRide(),
//     );

//   const [payment, setPayment] =
//     useState<RidePaymentState | null>(null);

//   const [loading, setLoading] = useState(true);

//   const [checking, setChecking] = useState(false);

//   const [
//     startingCheckout,
//     setStartingCheckout,
//   ] = useState(false);

//   const [refreshing, setRefreshing] =
//     useState(false);

//   const [showModal, setShowModal] =
//     useState(false);

//   const [error, setError] =
//     useState<string | null>(null);

//   /* =======================================================
//      REFS
//   ======================================================= */

//   const mountedRef = useRef(false);

//   const fetchingRef = useRef(false);

//   const verifyingRef = useRef(false);

//   const checkoutRef = useRef(false);

//   const navigatingRef = useRef(false);

// //   const gatewayReturnHandledRef = useRef(false);

//   const modalDismissedRef = useRef(false);

//   /* =======================================================
//      RIDE ID
//   ======================================================= */

//   const rideId =
//     ride?.id ??
//     getStoredActiveRideId();

//   const token =
//     localStorage.getItem(
//       "passenger_access_token",
//     );

//   /* =======================================================
//      PAYMENT METHOD
//   ======================================================= */

// //   const paymentMethod = normalize(
// //     payment?.paymentMethod ??
// //       ride?.paymentMethod,
// //   );
// const paymentMethod = normalize(
//   payment?.bookedMethod ??
//     ride?.paymentMethod,
// );

//   const isCash =
//     paymentMethod === "cash";

//   const isCard =
//     paymentMethod === "card";

//   const paid = isPaymentConfirmed(
//     payment,
//     ride,
//   );

//   const payable =
//     payment?.payable === true;

//   /* =======================================================
//      PAYMENT AMOUNT
//   ======================================================= */

//   const fare =
//     typeof payment?.amount === "number"
//       ? payment.amount
//       : ride?.finalFare ??
//         ride?.fareBreakdown?.total ??
//         ride?.estimatedFare;

//   /* =======================================================
//      NAVIGATE AFTER CONFIRMED PAYMENT
//   ======================================================= */

//   const goToReceipt = useCallback(() => {
//     if (navigatingRef.current) return;

//     navigatingRef.current = true;

//     if (rideId) {
//       sessionStorage.removeItem(
//         `surdrive_payment_checkout_${rideId}`,
//       );
//     }

//     navigate(RECEIPT_ROUTE, {
//       replace: true,
//     });
//   }, [navigate, rideId]);

//   /* =======================================================
//      LOAD PAYMENT STATE

//      Backend is the source of truth.

//      This function:
//      - Refreshes ride
//      - Refreshes payment
//      - Checks payment method
//      - Checks payable
//      - Navigates only after confirmed payment
//   ======================================================= */

//   const loadPayment = useCallback(
//     async (showRefreshing = false) => {
//       if (
//         !rideId ||
//         fetchingRef.current ||
//         navigatingRef.current
//       ) {
//         return;
//       }

//       fetchingRef.current = true;

//       if (showRefreshing) {
//         setRefreshing(true);
//       }

//       try {
//         const [
//           rideResponse,
//           paymentResponse,
//         ] = await Promise.all([
//           passengerRideApi.getRide(rideId),

//           passengerPaymentApi.getPayment(
//             rideId,
//           ),
//         ]);

//         if (
//           !mountedRef.current ||
//           navigatingRef.current
//         ) {
//           return;
//         }

//         setRide(rideResponse);

//         storeActiveRide(rideResponse);

//         setPayment(paymentResponse);

//         setError(null);

//         const method = normalize(
//   paymentResponse.bookedMethod ??
//     rideResponse.paymentMethod,
// );

//         const cashRide =
//           method === "cash";

//         const confirmedPaid =
//           isPaymentConfirmed(
//             paymentResponse,
//             rideResponse,
//           );

//         /* -----------------------------------------------
//            PAYMENT CONFIRMED
//         ----------------------------------------------- */

//         if (confirmedPaid) {
//           setShowModal(false);

//           goToReceipt();

//           return;
//         }

//         /* -----------------------------------------------
//            CASH RIDE

//            Cash is settled in person.
//            Never show card modal.
//         ----------------------------------------------- */

//         if (cashRide) {
//           setShowModal(false);

//           return;
//         }

//         /* -----------------------------------------------
//            CARD PAYMENT AVAILABLE
//         ----------------------------------------------- */

//         if (
//           paymentResponse.payable === true &&
//           !modalDismissedRef.current
//         ) {
//           setShowModal(true);
//         } else if (
//           paymentResponse.payable !== true
//         ) {
//           setShowModal(false);
//         }
//       } catch (err) {
//         console.error(
//           "LOAD RIDE PAYMENT ERROR:",
//           err,
//         );

//         if (mountedRef.current) {
//           setError(
//             err instanceof Error
//               ? err.message
//               : "Unable to load payment details.",
//           );
//         }
//       } finally {
//         fetchingRef.current = false;

//         if (mountedRef.current) {
//           setLoading(false);
//           setRefreshing(false);
//         }
//       }
//     },
//     [rideId, goToReceipt],
//   );

//   /* =======================================================
//      SOCKET RIDE UPDATE
//   ======================================================= */

//   const handleRideUpdate = useCallback(
//     (response: PassengerRideResponse) => {
//       if (
//         !mountedRef.current ||
//         navigatingRef.current
//       ) {
//         return;
//       }

//       setRide(response);

//       storeActiveRide(response);

//       /* -----------------------------------------------
//          BACKEND CONFIRMS PAID
//       ----------------------------------------------- */

//       if (
//         normalize(response.status) ===
//         "paid"
//       ) {
//         goToReceipt();

//         return;
//       }

//       /* -----------------------------------------------
//          PAYMENT-RELATED STATUS
//       ----------------------------------------------- */

//       const status = normalize(
//         response.status,
//       );

//       if (
//         status === "ride_completed" ||
//         status === "payment_pending" ||
//         status === "closed"
//       ) {
//         void loadPayment();
//       }
//     },
//     [goToReceipt, loadPayment],
//   );

//   /* =======================================================
//      WEBSOCKET
//   ======================================================= */

//   const { connected } = useRideSocket({
//     rideId,
//     token,

//     enabled: Boolean(
//       rideId && token,
//     ),

//     onRideUpdate:
//       handleRideUpdate,
//   });

//   /* =======================================================
//      INITIAL LOAD
//   ======================================================= */

//   useEffect(() => {
//     mountedRef.current = true;

//     void loadPayment();

//     return () => {
//       mountedRef.current = false;
//     };
//   }, [loadPayment]);

//   /* =======================================================
//      FOREGROUND / FOCUS

//      If the passenger returns to SurDrive,
//      check payment again.
//   ======================================================= */

//   useEffect(() => {
//     if (!rideId) return;

//     const handleVisibility = () => {
//       if (
//         document.visibilityState ===
//         "visible"
//       ) {
//         void loadPayment();
//       }
//     };

//     const handleFocus = () => {
//       void loadPayment();
//     };

//     document.addEventListener(
//       "visibilitychange",
//       handleVisibility,
//     );

//     window.addEventListener(
//       "focus",
//       handleFocus,
//     );

//     return () => {
//       document.removeEventListener(
//         "visibilitychange",
//         handleVisibility,
//       );

//       window.removeEventListener(
//         "focus",
//         handleFocus,
//       );
//     };
//   }, [rideId, loadPayment]);

//   /* =======================================================
//      SOCKET RECONNECTION
//   ======================================================= */

//   useEffect(() => {
//     if (connected) {
//       void loadPayment();
//     }
//   }, [connected, loadPayment]);

//   /* =======================================================
//      FALLBACK POLLING

//      Continue checking while payment is unresolved.
//   ======================================================= */

// //   useEffect(() => {
// //     if (
// //       !rideId ||
// //       paid ||
// //       navigatingRef.current
// //     ) {
// //       return;
// //     }

// //     const interval =
// //       window.setInterval(() => {
// //         if (
// //           document.visibilityState ===
// //           "visible"
// //         ) {
// //           void loadPayment();
// //         }
// //       }, POLL_INTERVAL);

// //     return () => {
// //       window.clearInterval(interval);
// //     };
// //   }, [
// //     rideId,
// //     paid,
// //     loadPayment,
// //   ]);

// useEffect(() => {
//   if (
//     !rideId ||
//     paid ||
//     connected ||
//     navigatingRef.current
//   ) {
//     return;
//   }

//   const pollPayment = () => {
//     if (
//       document.visibilityState === "visible" &&
//       !fetchingRef.current &&
//       !verifyingRef.current
//     ) {
//       void loadPayment();
//     }
//   };

//   const interval = window.setInterval(
//     pollPayment,
//     10000,
//   );

//   return () => {
//     window.clearInterval(interval);
//   };
// }, [rideId, paid, connected, loadPayment]);

//   /* =======================================================
//      VERIFY PAYMENT

//      Called after returning from Paystack or when
//      passenger manually requests verification.
//   ======================================================= */

//   const verifyPayment =
//     useCallback(async () => {
//       if (
//         !rideId ||
//         verifyingRef.current ||
//         navigatingRef.current
//       ) {
//         return;
//       }

//       verifyingRef.current = true;

//       setChecking(true);

//       try {
//         await passengerPaymentApi.verify(
//           rideId,
//         );

//         if (!mountedRef.current) {
//           return;
//         }

//         /*
//          * Verification endpoint may return a
//          * different response structure.
//          *
//          * Refresh the authoritative payment state.
//          */

//         await loadPayment(true);
//       } catch (err) {
//         console.error(
//           "PAYMENT VERIFICATION ERROR:",
//           err,
//         );

//         if (mountedRef.current) {
//           toast.error(
//             err instanceof Error
//               ? err.message
//               : "Unable to verify payment.",
//           );
//         }
//       } finally {
//         verifyingRef.current = false;

//         if (mountedRef.current) {
//           setChecking(false);
//         }
//       }
//     }, [
//       rideId,
//       loadPayment,
//     ]);

//   /* =======================================================
//      VERIFY AFTER PAYSTACK RETURN

//      Avoid infinite verification loops.

//      Session storage remembers that checkout started.
//   ======================================================= */

// //   useEffect(() => {
// //     if (
// //       !rideId ||
// //       gatewayReturnHandledRef.current
// //     ) {
// //       return;
// //     }

// //     const checkoutStarted =
// //       sessionStorage.getItem(
// //         `surdrive_payment_checkout_${rideId}`,
// //       );

// //     if (!checkoutStarted) {
// //       return;
// //     }

// //     gatewayReturnHandledRef.current = true;

// //     void verifyPayment();
// //   }, [
// //     rideId,
// //     verifyPayment,
// //   ]);

//   /* =======================================================
//      START CHECKOUT
//   ======================================================= */

//  const startCheckout = async () => {
//   if (
//     !rideId ||
//     startingCheckout ||
//     checkoutRef.current ||
//     navigatingRef.current ||
//     isCash ||
//     !isCard ||
//     !payable ||
//     paid
//   ) {
//     return;
//   }

//   checkoutRef.current = true;
//   setStartingCheckout(true);

//   try {
//     // Reuse an existing checkout when available.
//     let checkoutUrl =
//       payment?.pendingCheckout?.redirectUrl ?? null;

//     if (!checkoutUrl) {
//       const response: RideCheckoutResponse =
//         await passengerPaymentApi.checkout(rideId);

//       if (response.status?.toLowerCase() === "failed") {
//         throw new Error(
//           "Unable to initialize payment. Please try again.",
//         );
//       }

//       checkoutUrl = response.redirectUrl;
//     }

//     if (!checkoutUrl) {
//       throw new Error(
//         "The payment gateway did not return a checkout URL.",
//       );
//     }

//     const parsedUrl = new URL(checkoutUrl);

//     if (
//       parsedUrl.protocol !== "https:" ||
//       parsedUrl.hostname !== "checkout.paystack.com"
//     ) {
//       throw new Error("Invalid Paystack checkout URL.");
//     }

//     sessionStorage.setItem(
//       `surdrive_payment_checkout_${rideId}`,
//       "1",
//     );

//     window.location.assign(parsedUrl.toString());
//   } catch (error) {
//     console.error("CHECKOUT ERROR:", error);

//     toast.error(
//       error instanceof Error
//         ? error.message
//         : "Unable to start payment.",
//     );

//     checkoutRef.current = false;
//     setStartingCheckout(false);
//   }
// };

//   /* =======================================================
//      CLOSE PAYMENT MODAL
//   ======================================================= */

//   const closeModal = () => {
//     if (startingCheckout) {
//       return;
//     }

//     modalDismissedRef.current = true;

//     setShowModal(false);
//   };

//   /* =======================================================
//      OPEN PAYMENT MODAL
//   ======================================================= */

//   const openModal = () => {
//     modalDismissedRef.current = false;

//     setShowModal(true);
//   };

//   /* =======================================================
//      ROUTE GUARD
//   ======================================================= */

//   if (!rideId) {
//     return (
//       <Navigate
//         to="/passenger/home"
//         replace
//       />
//     );
//   }

//   /* =======================================================
//      RENDER
//   ======================================================= */

//   return (
//     <div className="min-h-[100dvh] bg-[#F8F7FA]">
//       <div className="mx-auto min-h-[100dvh] w-full max-w-[480px] bg-white">

//         {/* ===============================================
//             HEADER
//         =============================================== */}

//         <header className="flex h-[76px] items-center justify-between border-b border-[#F1EDF3] px-5">

//           <button
//             type="button"
//             onClick={() =>
//               navigate(
//                 COMPLETE_ROUTE,
//               )
//             }
//             className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F5F8]"
//           >
//             <ArrowLeft size={20} />
//           </button>

//           <h1 className="text-[17px] font-semibold text-[#302B34]">
//             Ride Payment
//           </h1>

//           <div className="w-10" />

//         </header>

//         {/* ===============================================
//             MAIN
//         =============================================== */}

//         <main className="px-5 pt-8 pb-10">

//           {/* PAYMENT ICON */}

//           <div className="mx-auto flex h-[78px] w-[78px] items-center justify-center rounded-full bg-[#F3ECF9]">

//             {paid ? (
//               <CheckCircle2
//                 size={37}
//                 className="text-[#2FA665]"
//               />
//             ) : isCash ? (
//               <Banknote
//                 size={37}
//                 className="text-[#7442AD]"
//               />
//             ) : (
//               <WalletCards
//                 size={37}
//                 className="text-[#7442AD]"
//               />
//             )}

//           </div>

//           {/* TITLE */}

//           <h2 className="mt-5 text-center text-[23px] font-bold text-[#302B34]">

//             {paid
//               ? "Payment Successful"
//               : isCash
//                 ? "Cash Payment"
//                 : "Complete Your Payment"}

//           </h2>

//           <p className="mx-auto mt-2 max-w-[310px] text-center text-[14px] leading-6 text-[#918B95]">

//             {paid
//               ? "Your ride payment has been confirmed."
//               : isCash
//                 ? "Please settle your fare directly with your driver."
//                 : "Pay securely with your card to complete this ride."}

//           </p>

//           {/* ===============================================
//               FARE CARD
//           =============================================== */}

//           <div className="mt-8 rounded-[20px] bg-[#F8F6FA] p-6 text-center">

//             <p className="text-[13px] text-[#918B95]">
//               Total Ride Fare
//             </p>

//             <p className="mt-2 text-[34px] font-bold text-[#302B34]">
//               {formatCurrency(fare)}
//             </p>

//             <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-[#7442AD]">

//               {isCash ? (
//                 <Banknote size={16} />
//               ) : (
//                 <CreditCard size={16} />
//               )}

//               {isCash
//                 ? "Cash"
//                 : "Card"}

//             </div>

//           </div>

//           {/* ===============================================
//               PAYMENT STATUS
//           =============================================== */}

//           <div className="mt-6 flex items-center justify-between rounded-[15px] border border-[#EEEAF1] p-4">

//             <div className="flex items-center gap-3">

//               <Clock3
//                 size={20}
//                 className="text-[#7442AD]"
//               />

//               <div>

//                 <p className="text-[14px] font-semibold text-[#302B34]">
//                   Payment Status
//                 </p>

//                 <p className="mt-1 text-[12px] text-[#918B95]">

//                   {paid
//                     ? "Payment confirmed"
//                     : loading
//                       ? "Checking payment..."
//                       : isCash
//                         ? "Awaiting cash settlement"
//                         : payable
//                           ? "Ready for card payment"
//                           : "Waiting for payment availability"}

//                 </p>

//               </div>

//             </div>

//             {(loading ||
//               checking ||
//               refreshing) && (
//               <LoaderCircle
//                 size={18}
//                 className="animate-spin text-[#7442AD]"
//               />
//             )}

//           </div>

//           {/* ===============================================
//               ERROR
//           =============================================== */}

//           {error && (
//             <div className="mt-4 flex items-start gap-3 rounded-[13px] bg-[#FFF3F3] p-4">

//               <AlertCircle
//                 size={18}
//                 className="shrink-0 text-[#BB5555]"
//               />

//               <p className="text-[13px] leading-5 text-[#BB5555]">
//                 {error}
//               </p>

//             </div>
//           )}

//           {/* ===============================================
//               ACTIONS
//           =============================================== */}

//           <div className="space-y-3 mt-7">

//             {/* CARD PAYMENT */}

//             {!paid &&
//               isCard &&
//               payable && (
//                 <motion.button
//                   type="button"
//                   whileTap={{
//                     scale: 0.98,
//                   }}
//                   onClick={openModal}
//                   className="flex h-[56px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white"
//                 >
//                   <CreditCard size={19} />
//                   Pay with Card
//                 </motion.button>
//               )}

//             {/* VERIFY PAYMENT */}

//             {!paid &&
//               isCard && (
//                 <button
//                   type="button"
//                   disabled={checking}
//                   onClick={() =>
//                     void verifyPayment()
//                   }
//                   className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] border border-[#E6DDED] text-[14px] font-semibold text-[#7442AD] disabled:opacity-50"
//                 >

//                   {checking ? (
//                     <LoaderCircle
//                       size={18}
//                       className="animate-spin"
//                     />
//                   ) : (
//                     <RefreshCw size={18} />
//                   )}

//                   I've Completed Payment

//                 </button>
//               )}

//             {/* REFRESH PAYMENT */}

//             <button
//               type="button"
//               disabled={refreshing}
//               onClick={() =>
//                 void loadPayment(true)
//               }
//               className="flex h-[48px] w-full items-center justify-center gap-2 text-[13px] font-medium text-[#918B95] disabled:opacity-50"
//             >

//               <RefreshCw
//                 size={15}
//                 className={
//                   refreshing
//                     ? "animate-spin"
//                     : ""
//                 }
//               />

//               Refresh Payment Status

//             </button>

//           </div>

//           {/* ===============================================
//               CASH PAYMENT MESSAGE
//           =============================================== */}

//           {isCash && !paid && (
//             <div className="mt-6 rounded-[15px] bg-[#FFF8E8] p-4">

//               <div className="flex items-start gap-3">

//                 <Banknote
//                   size={21}
//                   className="shrink-0 text-[#B68B35]"
//                 />

//                 <div>

//                   <p className="text-[14px] font-semibold text-[#725A2A]">
//                     Paying with Cash
//                   </p>

//                   <p className="mt-2 text-[12px] leading-5 text-[#947C4A]">
//                     Please pay the displayed fare
//                     directly to your driver.
//                     Your payment will be
//                     confirmed once the
//                     backend records settlement.
//                   </p>

//                 </div>

//               </div>

//             </div>
//           )}

//           {/* ===============================================
//               SECURITY NOTICE
//           =============================================== */}

//           {!isCash && (
//             <div className="mt-8 flex items-start gap-3 rounded-[15px] bg-[#F3ECF9] p-4">

//               <ShieldCheck
//                 size={20}
//                 className="shrink-0 text-[#7442AD]"
//               />

//               <p className="text-[12px] leading-5 text-[#817A85]">
//                 Your card payment is processed
//                 securely through SurDrive's
//                 payment provider. Payment is
//                 considered successful only
//                 after confirmation by the backend.
//               </p>

//             </div>
//           )}

//         </main>

//         {/* ===============================================
//             PAYMENT MODAL
//         =============================================== */}

//         <AnimatePresence>

//           {showModal &&
//             !paid &&
//             isCard &&
//             payable && (

//               <motion.div
//                 initial={{
//                   opacity: 0,
//                 }}
//                 animate={{
//                   opacity: 1,
//                 }}
//                 exit={{
//                   opacity: 0,
//                 }}
//                 className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/45 px-3 pb-3 sm:items-center"
//               >

//                 <motion.div
//                   initial={{
//                     opacity: 0,
//                     y: 30,
//                   }}
//                   animate={{
//                     opacity: 1,
//                     y: 0,
//                   }}
//                   exit={{
//                     opacity: 0,
//                     y: 30,
//                   }}
//                   className="w-full max-w-[440px] rounded-[25px] bg-white p-6"
//                 >

//                   {/* MODAL HEADER */}

//                   <div className="flex items-center justify-between">

//                     <h3 className="text-[19px] font-bold text-[#302B34]">
//                       Complete Payment
//                     </h3>

//                     <button
//                       type="button"
//                       onClick={closeModal}
//                       disabled={startingCheckout}
//                       className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F5F8] disabled:opacity-50"
//                     >
//                       <X size={19} />
//                     </button>

//                   </div>

//                   <p className="mt-2 text-[13px] text-[#918B95]">
//                     Select your payment method.
//                   </p>

//                   {/* CARD OPTION */}

//                   <div className="mt-6 flex items-center gap-3 rounded-[15px] border-2 border-[#7442AD] bg-[#F8F4FC] p-4">

//                     <CreditCard
//                       size={23}
//                       className="text-[#7442AD]"
//                     />

//                     <div className="flex-1">

//                       <p className="text-[15px] font-semibold text-[#302B34]">
//                         Pay with Card
//                       </p>

//                       <p className="mt-1 text-[12px] text-[#918B95]">
//                         Secure payment through Paystack
//                       </p>

//                     </div>

//                     <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7442AD] text-white">
//                       <CheckCircle2 size={14} />
//                     </div>

//                   </div>

//                   {/* TOTAL */}

//                   <div className="flex items-center justify-between mt-6">

//                     <span className="text-[14px] text-[#918B95]">
//                       Total
//                     </span>

//                     <span className="text-[24px] font-bold text-[#302B34]">
//                       {formatCurrency(fare)}
//                     </span>

//                   </div>

//                   {/* PAY BUTTON */}

//                   <motion.button
//                     type="button"
//                     whileTap={{
//                       scale: 0.98,
//                     }}
//                     disabled={
//                       startingCheckout ||
//                       !payable
//                     }
//                     onClick={() =>
//                       void startCheckout()
//                     }
//                     className="mt-6 flex h-[56px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white disabled:opacity-50"
//                   >

//                     {startingCheckout ? (
//                       <>
//                         <LoaderCircle
//                           size={19}
//                           className="animate-spin"
//                         />
//                         Redirecting...
//                       </>
//                     ) : (
//                       <>
//                         <ShieldCheck size={19} />
//                         Pay {formatCurrency(fare)}
//                       </>
//                     )}

//                   </motion.button>

//                 </motion.div>

//               </motion.div>
//             )}

//         </AnimatePresence>

//       </div>
//     </div>
//   );
// }

