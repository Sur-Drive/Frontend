import {
  Delete,
  LoaderCircle,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "sonner";

import AccountHeader from "../../../components/passenger/account/AccountHeader";

import {
  useResendPassengerEmailChange,
  useResendPassengerPhoneChange,
  useVerifyPassengerEmailChange,
  useVerifyPassengerPhoneChange,
} from "../../../hooks/passenger/usePassengerProfileApi";

import {
  getPassengerApiError,
} from "../../../api/passenger/getPassengerApiError";

import type {
  ProfileVerificationState,
} from "../../../types/passengerProfile";

const OTP_LENGTH = 5;
const RESEND_SECONDS = 45;

function formatCountdown(
  seconds: number,
) {
  const minutes =
    Math.floor(
      seconds / 60,
    );

  const remainingSeconds =
    seconds % 60;

  return `${String(
    minutes,
  ).padStart(
    2,
    "0",
  )}:${String(
    remainingSeconds,
  ).padStart(
    2,
    "0",
  )}`;
}

export default function ProfileOtpVerification() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const verification =
    location.state as
      | ProfileVerificationState
      | undefined;

  const verifyEmail =
    useVerifyPassengerEmailChange();

  const verifyPhone =
    useVerifyPassengerPhoneChange();

  const resendEmail =
    useResendPassengerEmailChange();

  const resendPhone =
    useResendPassengerPhoneChange();

  const [
    digits,
    setDigits,
  ] = useState<string[]>(
    Array(
      OTP_LENGTH,
    ).fill(""),
  );

  const [
    seconds,
    setSeconds,
  ] = useState(
    RESEND_SECONDS,
  );

  const [
    error,
    setError,
  ] = useState("");

  const inputRefs =
    useRef<
      Array<
        HTMLInputElement | null
      >
    >([]);

  const verifying =
    verifyEmail.isPending ||
    verifyPhone.isPending;

  const resending =
    resendEmail.isPending ||
    resendPhone.isPending;

  /*
   * --------------------------------------------
   * COUNTDOWN
   * --------------------------------------------
   */

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setSeconds(
          (previous) =>
            Math.max(
              previous - 1,
              0,
            ),
        );
      }, 1000);

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [seconds]);

  /*
   * Route must contain:
   *
   * {
   *   type: "phone" | "email",
   *   value: "..."
   * }
   */

  if (!verification) {
    return (
      <Navigate
        to="/passenger/account/profile"
        replace
      />
    );
  }

  const otp =
    digits.join("");

  const complete =
    otp.length ===
    OTP_LENGTH;

  /*
   * --------------------------------------------
   * OTP INPUT
   * --------------------------------------------
   */

  const setDigit = (
    index: number,
    value: string,
  ) => {
    const numbers =
      value.replace(
        /\D/g,
        "",
      );

    setError("");

    if (!numbers) {
      setDigits(
        (previous) => {
          const next =
            [...previous];

          next[index] =
            "";

          return next;
        },
      );

      return;
    }

    setDigits(
      (previous) => {
        const next =
          [...previous];

        next[index] =
          numbers.slice(
            -1,
          );

        return next;
      },
    );

    if (
      index <
      OTP_LENGTH - 1
    ) {
      inputRefs.current[
        index + 1
      ]?.focus();
    }
  };

  const removeDigit =
    () => {
      setError("");

      const lastFilled =
        digits.reduce(
          (
            result,
            digit,
            index,
          ) =>
            digit
              ? index
              : result,
          -1,
        );

      if (
        lastFilled < 0
      ) {
        return;
      }

      setDigits(
        (previous) => {
          const next =
            [...previous];

          next[
            lastFilled
          ] = "";

          return next;
        },
      );

      inputRefs.current[
        lastFilled
      ]?.focus();
    };

  const pressNumber = (
    number: string,
  ) => {
    if (verifying) {
      return;
    }

    const index =
      digits.findIndex(
        (digit) =>
          !digit,
      );

    if (
      index === -1
    ) {
      return;
    }

    setDigit(
      index,
      number,
    );
  };

  /*
   * --------------------------------------------
   * VERIFY
   * --------------------------------------------
   */

  const verify =
    async () => {
      if (
        !complete ||
        verifying
      ) {
        return;
      }

      setError("");

      try {
        if (
          verification.type ===
          "email"
        ) {
          await verifyEmail.mutateAsync(
            otp,
          );
        } else {
          await verifyPhone.mutateAsync(
            otp,
          );
        }

        toast.success(
          verification.type ===
            "email"
            ? "Email updated successfully."
            : "Phone number updated successfully.",
        );

        /*
         * The verification mutation should
         * invalidate GET /riders/profile.
         *
         * We no longer manually mutate the old
         * PassengerProfileContext here.
         */

        navigate(
          "/passenger/account/profile",
          {
            replace: true,

            state: {
              profileUpdated:
                true,
            },
          },
        );
      } catch (caughtError) {
        const message =
          getPassengerApiError(
            caughtError,
            "Unable to verify the code.",
          );

        setError(message);

        toast.error(message);
      }
    };

  /*
   * --------------------------------------------
   * RESEND
   * --------------------------------------------
   */

  const resend =
    async () => {
      if (
        seconds > 0 ||
        resending ||
        verifying
      ) {
        return;
      }

      setError("");

      try {
        if (
          verification.type ===
          "email"
        ) {
          await resendEmail.mutateAsync();
        } else {
          await resendPhone.mutateAsync();
        }

        setDigits(
          Array(
            OTP_LENGTH,
          ).fill(""),
        );

        setSeconds(
          RESEND_SECONDS,
        );

        window.setTimeout(
          () => {
            inputRefs.current[
              0
            ]?.focus();
          },
          0,
        );

        toast.success(
          "A new verification code has been sent.",
        );
      } catch (caughtError) {
        const message =
          getPassengerApiError(
            caughtError,
            "Unable to resend the verification code.",
          );

        setError(message);

        toast.error(message);
      }
    };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-white">
      <AccountHeader />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-[260px] sm:px-7">
        <h1 className="text-[22px] font-semibold text-[#302B34]">
          OTP Verification
        </h1>

        <p className="mt-2 text-[14px] leading-6 text-[#99939D]">
          Enter the verification
          code sent to{" "}

          <span className="font-medium text-[#302B34]">
            {verification.value}
          </span>
        </p>

        {/* OTP BOXES */}

        <div className="flex gap-3 mt-6">
          {digits.map(
            (
              digit,
              index,
            ) => (
              <input
                key={index}
                ref={(
                  element,
                ) => {
                  inputRefs.current[
                    index
                  ] = element;
                }}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={
                  verifying
                }
                onChange={(
                  event,
                ) =>
                  setDigit(
                    index,
                    event
                      .target
                      .value,
                  )
                }
                onKeyDown={(
                  event,
                ) => {
                  if (
                    event.key ===
                    "Backspace" &&
                    !digit &&
                    index > 0
                  ) {
                    inputRefs.current[
                      index - 1
                    ]?.focus();
                  }

                  if (
                    event.key ===
                      "Enter" &&
                    complete
                  ) {
                    void verify();
                  }
                }}
                className={`
                  h-[58px]
                  min-w-0
                  flex-1
                  rounded-[13px]
                  border
                  text-center
                  text-[18px]
                  font-semibold
                  text-[#302B34]
                  outline-none
                  ${
                    error
                      ? "border-red-300 bg-red-50/50"
                      : "border-transparent bg-[#F4F3F5]"
                  }
                  focus:ring-2
                  focus:ring-[#7442AD]/30
                `}
              />
            ),
          )}
        </div>

        {/* ERROR */}

        {error && (
          <p
            role="alert"
            className="mt-3 text-[14px] leading-5 text-red-600"
          >
            {error}
          </p>
        )}

        {/* VERIFY - ONLY PRIMARY BUTTON */}

        <motion.button
          type="button"
          disabled={
            !complete ||
            verifying ||
            resending
          }
          whileTap={
            complete &&
            !verifying
              ? {
                  scale: 0.98,
                }
              : undefined
          }
          onClick={verify}
          className="mt-6 flex h-[56px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#7442AD] text-[16px] font-semibold text-white shadow-[0_8px_22px_rgba(116,66,173,0.20)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {verifying && (
            <LoaderCircle
              size={19}
              className="animate-spin"
            />
          )}

          {verifying
            ? "Verifying..."
            : "Verify Code"}
        </motion.button>

        {/* RESEND - SECONDARY TEXT ACTION */}

        <div className="mt-5 text-center">
          {seconds > 0 ? (
            <p className="text-[14px] text-[#99939D]">
              Didn't receive the
              code? Resend in{" "}

              <span className="font-semibold text-[#625C66]">
                {formatCountdown(
                  seconds,
                )}
              </span>
            </p>
          ) : (
            <p className="text-[14px] text-[#99939D]">
              Didn't receive the
              code?{" "}

              <button
                type="button"
                disabled={
                  resending ||
                  verifying
                }
                onClick={resend}
                className="inline-flex items-center gap-1.5 font-semibold text-[#7442AD] disabled:opacity-50"
              >
                {resending && (
                  <LoaderCircle
                    size={15}
                    className="animate-spin"
                  />
                )}

                {resending
                  ? "Sending..."
                  : "Resend code"}
              </button>
            </p>
          )}
        </div>
      </main>

      {/* NUMERIC KEYPAD */}

      <div className="fixed inset-x-0 bottom-0 z-[300] bg-[#E8EBF1] px-5 pb-[calc(18px+env(safe-area-inset-bottom))] pt-4">
        <div className="mx-auto grid w-full max-w-[500px] grid-cols-3 gap-2.5">
          {[
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
          ].map(
            (number) => (
              <motion.button
                key={number}
                type="button"
                disabled={
                  verifying
                }
                whileTap={{
                  scale: 0.94,
                }}
                onClick={() =>
                  pressNumber(
                    number,
                  )
                }
                className="h-[48px] rounded-[7px] bg-white text-[16px] font-semibold text-[#302B34] shadow-sm disabled:opacity-50"
              >
                {number}
              </motion.button>
            ),
          )}

          <div />

          <motion.button
            type="button"
            disabled={
              verifying
            }
            whileTap={{
              scale: 0.94,
            }}
            onClick={() =>
              pressNumber(
                "0",
              )
            }
            className="h-[48px] rounded-[7px] bg-white text-[16px] font-semibold text-[#302B34] shadow-sm disabled:opacity-50"
          >
            0
          </motion.button>

          <button
            type="button"
            disabled={
              verifying
            }
            onClick={
              removeDigit
            }
            aria-label="Delete digit"
            className="flex h-[48px] items-center justify-center text-[#302B34] disabled:opacity-50"
          >
            <Delete
              size={21}
            />
          </button>
        </div>
      </div>

      {/* VERIFYING OVERLAY */}

      {verifying && (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/45 backdrop-blur-[3px]"
        >
          <div className="flex flex-col items-center gap-3">
            <LoaderCircle
              size={46}
              className="text-white animate-spin"
            />

            <p className="text-[15px] font-medium text-white">
              Verifying code...
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}



