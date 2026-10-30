"use client";

import {
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { passengerPaymentApi } from "../../../api/passenger/payment";

import {
  getStoredActiveRideId,
} from "../../../utils/passengerActiveRide";

/* =========================================================
   CONFIG
========================================================= */

const PAYMENT_ROUTE = "/passenger/ride/payment";

const RECEIPT_ROUTE = "/passenger/ride/receipt";

type VerificationStage =
  | "verifying"
  | "success"
  | "pending"
  | "error";

  const MAX_PAYMENT_CHECKS = 8;
const RETRY_DELAY_MS = 3000;

/* =========================================================
   COMPONENT
========================================================= */

export default function RidePaymentCallback() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const [stage, setStage] =
    useState<VerificationStage>("verifying");

  const [message, setMessage] = useState(
    "We're securely confirming your transaction.",
  );

  const [amount, setAmount] =
    useState<number | null>(null);

  const [checking, setChecking] = useState(false);

  const verifyingRef = useRef(false);

  const initializedRef = useRef(false);

  const redirectTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

    const [attempt, setAttempt] = useState(0);

const verificationRunRef = useRef(0);

const retryTimerRef =
  useRef<ReturnType<typeof setTimeout> | null>(null);

const mountedRef = useRef(false);

  /* =======================================================
     RIDE ID

     Prefer callback query parameter.
     Fall back to locally stored active ride.
  ======================================================= */

  const rideId =
    searchParams.get("rideId") ??
    getStoredActiveRideId();

  /* =======================================================
     VERIFY PAYMENT
  ======================================================= */

//   const verifyPayment = useCallback(async () => {
//     if (!rideId || verifyingRef.current) {
//       if (!rideId) {
//         setStage("error");
//         setMessage(
//           "We couldn't identify your ride. Please return to your payment page.",
//         );
//       }

//       return;
//     }

//     verifyingRef.current = true;

//     setChecking(true);
//     setStage("verifying");

//     setMessage(
//       "We're securely confirming your transaction.",
//     );

//     try {
//       /*
//        * Ask backend to verify the transaction.
//        *
//        * The frontend does not decide whether
//        * payment succeeded.
//        */

//       await passengerPaymentApi.verify(rideId);

//       /*
//        * Read the authoritative payment state.
//        */

//       const payment =
//         await passengerPaymentApi.getPayment(rideId);

//       setAmount(payment.amount);

//       if (payment.paid === true) {
//         sessionStorage.removeItem(
//           `surdrive_payment_checkout_${rideId}`,
//         );

//         setStage("success");

//         setMessage(
//           "Your payment has been confirmed successfully.",
//         );

//         redirectTimerRef.current = setTimeout(() => {
//           navigate(RECEIPT_ROUTE, {
//             replace: true,
//           });
//         }, 1800);

//         return;
//       }

//       /*
//        * The gateway return is not proof of
//        * successful payment.
//        */

//       setStage("pending");

//       setMessage(
//         "Your payment hasn't been confirmed yet. You can check again or return to the payment page.",
//       );
//     } catch (error) {
//       console.error(
//         "PAYMENT CALLBACK VERIFICATION ERROR:",
//         error,
//       );

//       setStage("error");

//       setMessage(
//         "We couldn't confirm your payment right now. If you were charged, please check again before attempting another payment.",
//       );
//     } finally {
//       verifyingRef.current = false;
//       setChecking(false);
//     }
//   }, [rideId, navigate]);

/* =========================================================
   PAYMENT VERIFICATION WITH AUTOMATIC RETRIES
========================================================= */

const verifyPayment = useCallback(async () => {
  if (!rideId || verifyingRef.current) {
    if (!rideId) {
      setStage("error");
      setMessage(
        "We couldn't identify your ride. Please return to your payment page.",
      );
    }

    return;
  }

  verifyingRef.current = true;

  const runId = ++verificationRunRef.current;

  const isActive = () =>
    mountedRef.current &&
    verificationRunRef.current === runId;

  const wait = (milliseconds: number) =>
    new Promise<void>((resolve) => {
      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        resolve();
      }, milliseconds);
    });

  setChecking(true);
  setStage("verifying");
  setAttempt(0);

  setMessage(
    "We're securely confirming your transaction.",
  );

  try {
    /* -------------------------------------------------
       1. ASK BACKEND TO VERIFY PAYSTACK PAYMENT
    ------------------------------------------------- */

    try {
      await passengerPaymentApi.verify(rideId);
    } catch (error) {
      console.warn(
        "Initial payment verification request failed:",
        error,
      );

      // Continue checking the authoritative payment
      // state. A temporary verification error does not
      // necessarily mean the payment failed.
    }

    if (!isActive()) return;

    /* -------------------------------------------------
       2. CHECK PAYMENT STATUS WITH BOUNDED RETRIES
    ------------------------------------------------- */

    for (
      let check = 1;
      check <= MAX_PAYMENT_CHECKS;
      check++
    ) {
      if (!isActive()) return;

      setAttempt(check);

      setMessage(
        check === 1
          ? "Checking your payment status..."
          : `Still confirming your payment. Check ${check} of ${MAX_PAYMENT_CHECKS}...`,
      );

      try {
        const payment =
          await passengerPaymentApi.getPayment(rideId);

        if (!isActive()) return;

        setAmount(payment.amount);

        /* ---------------------------------------------
           PAYMENT CONFIRMED
        --------------------------------------------- */

        if (payment.paid === true) {
          sessionStorage.removeItem(
            `surdrive_payment_checkout_${rideId}`,
          );

          setStage("success");

          setMessage(
            "Your payment has been confirmed successfully.",
          );

          if (redirectTimerRef.current) {
            clearTimeout(redirectTimerRef.current);
          }

          redirectTimerRef.current = setTimeout(() => {
            if (isActive()) {
              navigate(RECEIPT_ROUTE, {
                replace: true,
              });
            }
          }, 1800);

          return;
        }
      } catch (error) {
        console.warn(
          `Payment status check ${check} failed:`,
          error,
        );
      }

      /* ---------------------------------------------
         WAIT BEFORE NEXT CHECK
      --------------------------------------------- */

      if (check < MAX_PAYMENT_CHECKS) {
        await wait(RETRY_DELAY_MS);
      }
    }

    /* -------------------------------------------------
       3. PAYMENT STILL UNCONFIRMED
    ------------------------------------------------- */

    if (!isActive()) return;

    setStage("pending");

    setMessage(
      "Your payment hasn't been confirmed yet. If you were charged, please check again before attempting another payment.",
    );
  } catch (error) {
    console.error(
      "PAYMENT CALLBACK ERROR:",
      error,
    );

    if (!isActive()) return;

    setStage("error");

    setMessage(
      "We couldn't confirm your payment right now. Please try checking again.",
    );
  } finally {
    if (isActive()) {
      setChecking(false);
    }

    verifyingRef.current = false;
  }
}, [rideId, navigate]);

  /* =======================================================
     VERIFY ONCE ON CALLBACK LOAD
  ======================================================= */

//   useEffect(() => {
//     if (initializedRef.current) return;

//     initializedRef.current = true;

//     void verifyPayment();
//   }, [verifyPayment]);

/* =========================================================
   INITIALIZE CALLBACK
========================================================= */

useEffect(() => {
  mountedRef.current = true;

  if (!initializedRef.current) {
    initializedRef.current = true;
    void verifyPayment();
  }

  return () => {
    mountedRef.current = false;
    verificationRunRef.current += 1;

    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
  };
}, [verifyPayment]);

  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  /* =======================================================
     FORMAT AMOUNT
  ======================================================= */

  const formattedAmount =
    typeof amount === "number"
      ? `₦${amount.toLocaleString("en-NG", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : null;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-[100dvh] bg-[#F8F7FA]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col bg-white px-6">

        {/* HEADER */}

        <header className="flex h-[84px] items-center justify-center border-b border-[#F1EDF3]">
          <h1 className="text-[17px] font-semibold text-[#302B34]">
            Payment Verification
          </h1>
        </header>

        {/* CONTENT */}

        <main className="flex flex-col items-center justify-center flex-1 pb-20 text-center">

          <AnimatePresence mode="wait">

            {stage === "verifying" && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center w-full"
              >

                <div className="relative flex h-[116px] w-[116px] items-center justify-center">

                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 rounded-full border-[7px] border-[#F0E8F7] border-t-[#7442AD]"
                  />

                  <div className="flex h-[82px] w-[82px] items-center justify-center rounded-full bg-[#F3ECF9]">
                    <ShieldCheck
                      size={36}
                      className="text-[#7442AD]"
                    />
                  </div>

                </div>

                <h2 className="mt-8 text-[24px] font-bold text-[#302B34]">
                  Verifying Your Payment
                </h2>

                <p className="mt-3 max-w-[310px] text-[14px] leading-6 text-[#918B95]">
                  {message}
                </p>
                

                <div className="mt-8 flex items-center gap-2 rounded-full bg-[#F8F4FC] px-5 py-3 text-[13px] font-medium text-[#7442AD]">
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                  Please wait...
                </div>

                {/* ADD THE RETRY COUNTER HERE */}
      {attempt > 0 && (
        <p className="mt-3 text-[12px] font-medium text-[#7442AD]">
          Payment check {attempt} of {MAX_PAYMENT_CHECKS}
        </p>
      )}

              </motion.div>
            )}

            {stage === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  type: "spring",
                  stiffness: 220,
                  damping: 18,
                }}
                className="flex flex-col items-center w-full"
              >

                <div className="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-[#EAF8F0]">

                  <CheckCircle2
                    size={62}
                    className="text-[#2FA665]"
                    strokeWidth={1.8}
                  />

                </div>

                <h2 className="mt-7 text-[25px] font-bold text-[#302B34]">
                  Payment Successful!
                </h2>

                <p className="mt-3 max-w-[310px] text-[14px] leading-6 text-[#918B95]">
                  {message}
                </p>

                {formattedAmount && (
                  <div className="mt-7 rounded-[17px] bg-[#F8F6FA] px-8 py-5">
                    <p className="text-[12px] text-[#918B95]">
                      Amount Paid
                    </p>

                    <p className="mt-2 text-[28px] font-bold text-[#7442AD]">
                      {formattedAmount}
                    </p>
                  </div>
                )}

                <div className="mt-8 flex items-center gap-2 text-[13px] text-[#918B95]">
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                  Preparing your receipt...
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(RECEIPT_ROUTE, {
                      replace: true,
                    })
                  }
                  className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[15px] font-semibold text-white"
                >
                  View Receipt
                  <ArrowRight size={18} />
                </button>

              </motion.div>
            )}

            {(stage === "pending" || stage === "error") && (
              <motion.div
                key={stage}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center w-full"
              >

                <div className="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-[#FFF5E8]">

                  <AlertCircle
                    size={56}
                    className="text-[#C58A34]"
                    strokeWidth={1.8}
                  />

                </div>

                <h2 className="mt-7 text-[23px] font-bold text-[#302B34]">
                  {stage === "pending"
                    ? "Payment Still Pending"
                    : "Unable to Verify Payment"}
                </h2>

                <p className="mt-3 max-w-[320px] text-[14px] leading-6 text-[#918B95]">
                  {message}
                </p>

                <button
                  type="button"
                  disabled={checking}
                  onClick={() => void verifyPayment()}
                  className="mt-8 flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[15px] font-semibold text-white disabled:opacity-50"
                >
                  {checking ? (
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <RefreshCw size={18} />
                  )}

                  Check Payment Again
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(PAYMENT_ROUTE, {
                      replace: true,
                    })
                  }
                  className="mt-3 flex h-[52px] w-full items-center justify-center rounded-[14px] border border-[#E8DFEE] text-[14px] font-semibold text-[#7442AD]"
                >
                  Return to Payment
                </button>

              </motion.div>
            )}

          </AnimatePresence>

        </main>

        {/* FOOTER */}

        <footer className="pb-8 text-center">
          <p className="text-[12px] text-[#AAA2AD]">
            Secured by SurDrive
          </p>
        </footer>

      </div>
    </div>
  );
}