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

import AccountHeader from "../../../components/passenger/account/AccountHeader";

import {
  usePassengerProfile,
} from "../../../context/PassengerProfileContext";

import type {
  ProfileVerificationState,
} from "../../../types/passengerProfile";

const OTP_LENGTH = 5;

export default function ProfileOtpVerification() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    updateEmail,
    updatePhone,
  } =
    usePassengerProfile();

  const verification =
    location.state as
      | ProfileVerificationState
      | undefined;

  const [digits, setDigits] =
    useState<string[]>(
      Array(OTP_LENGTH).fill(""),
    );

  const [
    seconds,
    setSeconds,
  ] = useState(45);

  const [
    verifying,
    setVerifying,
  ] = useState(false);

  const inputRefs =
    useRef<
      Array<HTMLInputElement | null>
    >([]);

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setSeconds(
          (previous) =>
            previous - 1,
        );
      }, 1000);

    return () =>
      window.clearInterval(timer);
  }, [seconds]);

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
    otp.length === OTP_LENGTH;

  const setDigit = (
    index: number,
    value: string,
  ) => {
    const number =
      value.replace(/\D/g, "");

    if (!number) {
      return;
    }

    setDigits((previous) => {
      const next = [
        ...previous,
      ];

      next[index] =
        number.slice(-1);

      return next;
    });

    if (
      index <
      OTP_LENGTH - 1
    ) {
      inputRefs.current[
        index + 1
      ]?.focus();
    }
  };

  const removeDigit = () => {
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

    if (lastFilled < 0) {
      return;
    }

    setDigits((previous) => {
      const next = [
        ...previous,
      ];

      next[lastFilled] = "";

      return next;
    });

    inputRefs.current[
      lastFilled
    ]?.focus();
  };

  const pressNumber = (
    number: string,
  ) => {
    const index =
      digits.findIndex(
        (digit) => !digit,
      );

    if (index === -1) {
      return;
    }

    setDigit(index, number);
  };

  const verify = () => {
    if (!complete || verifying) {
      return;
    }

    setVerifying(true);

    /*
     * UI simulation.
     *
     * Replace with actual OTP verification
     * endpoint later.
     */
    window.setTimeout(() => {
      if (
        verification.type ===
        "email"
      ) {
        updateEmail(
          verification.value,
        );
      } else {
        updatePhone(
          verification.value,
        );
      }

      navigate(
        "/passenger/account/profile",
        {
          replace: true,

          state: {
            profileUpdated: true,
          },
        },
      );
    }, 1500);
  };

  const resend = () => {
    if (seconds > 0) {
      return;
    }

    setDigits(
      Array(OTP_LENGTH).fill(""),
    );

    setSeconds(45);

    inputRefs.current[
      0
    ]?.focus();

    // TODO: call resend OTP API.
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-white">
      <AccountHeader />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-[260px] sm:px-7">
        <h1 className="text-[22px] font-semibold text-[#302B34]">
          OTP Verification
        </h1>

        <p className="mt-2 text-[14px] leading-6 text-[#99939D]">
          Enter the OTP sent to{" "}
          <span className="font-medium text-[#302B34]">
            {
              verification.value
            }
          </span>
        </p>

        <div className="mt-5 flex gap-3">
          {digits.map(
            (digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[
                    index
                  ] = element;
                }}
                inputMode="numeric"
                maxLength={1}
                value={digit}
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
                }}
                className="h-[58px] min-w-0 flex-1 rounded-[13px] border-0 bg-[#F4F3F5] text-center text-[18px] font-semibold text-[#302B34] outline-none focus:ring-2 focus:ring-[#7442AD]/30"
              />
            ),
          )}
        </div>

        <motion.button
          type="button"
          whileTap={
            seconds === 0
              ? {
                  scale: 0.98,
                }
              : undefined
          }
          disabled={
            seconds > 0
          }
          onClick={resend}
          className="mt-5 h-[54px] w-full rounded-[13px] bg-[#7442AD] text-[15px] font-semibold text-white disabled:bg-[#E2E2E2] disabled:text-white"
        >
          {seconds > 0
            ? `Resend OTP (${seconds})`
            : "Resend OTP"}
        </motion.button>

        {complete && (
          <motion.button
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            type="button"
            onClick={verify}
            className="mt-3 h-[54px] w-full rounded-[13px] bg-[#7442AD] text-[15px] font-semibold text-white"
          >
            Verify OTP
          </motion.button>
        )}
      </main>

      {/* FIGMA NUMERIC KEYPAD */}

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
                whileTap={{
                  scale: 0.94,
                }}
                onClick={() =>
                  pressNumber(
                    number,
                  )
                }
                className="h-[48px] rounded-[7px] bg-white text-[16px] font-semibold text-[#302B34] shadow-sm"
              >
                {number}
              </motion.button>
            ),
          )}

          <div />

          <motion.button
            type="button"
            whileTap={{
              scale: 0.94,
            }}
            onClick={() =>
              pressNumber("0")
            }
            className="h-[48px] rounded-[7px] bg-white text-[16px] font-semibold text-[#302B34] shadow-sm"
          >
            0
          </motion.button>

          <button
            type="button"
            onClick={removeDigit}
            className="flex h-[48px] items-center justify-center text-[#302B34]"
          >
            <Delete size={21} />
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
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              repeat: Infinity,
              duration: 0.8,
              ease: "linear",
            }}
          >
            <LoaderCircle
              size={46}
              className="text-white"
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}