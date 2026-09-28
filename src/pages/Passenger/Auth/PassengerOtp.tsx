import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Delete,
  LoaderCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import PassengerAuthShell from "../../../components/passenger/auth/PassengerAuthShell";

interface OtpLocationState {
  identifier?: string;
  identifierType?: "phone" | "email";
}

const OTP_LENGTH = 5;
const RESEND_TIME = 45;

export default function PassengerOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state ?? {}) as OtpLocationState;

  const identifier =
    state.identifier ?? "+234 812 345 6789";

  const identifierType =
    state.identifierType ?? "phone";

  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(RESEND_TIME);
  const [isVerifying, setIsVerifying] = useState(false);

  const digits = useMemo(
    () =>
      Array.from(
        { length: OTP_LENGTH },
        (_, index) => otp[index] ?? "",
      ),
    [otp],
  );

  /*
   * Countdown
   */
  useEffect(() => {
    if (seconds <= 0) return;

    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [seconds]);

  /*
   * Temporary verification.
   * We'll replace this with useVerifyOtp().
   */
  const verify = useCallback(
    async (code: string) => {
      if (
        code.length !== OTP_LENGTH ||
        isVerifying
      ) {
        return;
      }

      setIsVerifying(true);

      window.setTimeout(() => {
        setIsVerifying(false);

        navigate("/passenger/complete-profile", {
            replace: true,
            state: {
            identifier,
            identifierType,
        },
          });
      }, 1400);
    },
    [isVerifying, navigate],
  );

  const addDigit = useCallback(
    (digit: string) => {
      if (
        isVerifying ||
        otp.length >= OTP_LENGTH
      ) {
        return;
      }

      const nextOtp = `${otp}${digit}`;

      setOtp(nextOtp);

      if (nextOtp.length === OTP_LENGTH) {
        void verify(nextOtp);
      }
    },
    [isVerifying, otp, verify],
  );

  const removeDigit = useCallback(() => {
    if (isVerifying) return;

    setOtp((current) =>
      current.slice(0, -1),
    );
  }, [isVerifying]);

  /*
   * Desktop keyboard / laptop numpad support.
   */
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (isVerifying) return;

      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        addDigit(event.key);
        return;
      }

      if (
        event.key === "Backspace" ||
        event.key === "Delete"
      ) {
        event.preventDefault();
        removeDigit();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
  }, [
    addDigit,
    removeDigit,
    isVerifying,
  ]);

  const resendOtp = () => {
    if (seconds > 0 || isVerifying) return;

    setOtp("");
    setSeconds(RESEND_TIME);

    // TODO:
    // sendOtpMutation.mutate(...)
  };

  const changeIdentifier = () => {
    navigate("/passenger/signup", {
      state: {
        mode: identifierType,
      },
    });
  };

  return (
    <PassengerAuthShell>
      <div
        className="
          relative
          flex
          min-h-[100dvh]
          w-full
          flex-col
          overflow-hidden
          bg-white
        "
      >
        {/* =========================
            OTP CONTENT
        ========================== */}

        <main
          className="
            mx-auto
            flex
            w-full
            max-w-[430px]
            flex-1
            flex-col
            px-4
            pb-6
            pt-5

            sm:px-5
            sm:pt-7

            lg:max-w-[480px]
            lg:justify-center
            lg:pb-10
            lg:pt-10
          "
        >
          {/* Back */}
          <motion.button
            type="button"
            aria-label="Go back"
            onClick={() => navigate(-1)}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.9 }}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              self-start
              rounded-full
              bg-white
              text-[#28232E]
              shadow-[0_3px_14px_rgba(20,15,30,0.08)]
            "
          >
            <ArrowLeft
              size={15}
              strokeWidth={1.8}
            />
          </motion.button>

          {/* Heading */}
          <motion.div
            initial={{
              opacity: 0,
              y: 14,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-5"
          >
            <h1
              className="
                text-[17px]
                font-semibold
                tracking-[-0.025em]
                text-[#25212A]

                sm:text-[24px]
              "
            >
              OTP Verification
            </h1>

            <p
              className="
                mt-1.5
                text-[14px]
                leading-4
                text-[#AAA6AE]

                sm:text-[14px]
              "
            >
              Enter the OTP sent to{" "}
              {identifier}
            </p>
          </motion.div>

          {/* OTP boxes */}
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.08,
              duration: 0.4,
            }}
            className="
              mt-5
              grid
              grid-cols-5
              gap-2.5

              sm:gap-3
            "
          >
            {digits.map(
              (digit, index) => {
                const active =
                  index === otp.length &&
                  otp.length < OTP_LENGTH;

                return (
                  <motion.div
                    key={index}
                    animate={{
                      scale: digit
                        ? [0.92, 1.06, 1]
                        : 1,
                      borderColor: active
                        ? "#7442AD"
                        : "#F1EFF3",
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                    className="
                      flex
                      aspect-square
                      w-full
                      items-center
                      justify-center
                      rounded-[12px]
                      border
                      bg-[#F7F7F8]
                      text-[14px]
                      font-semibold
                      text-[#17131D]

                      sm:text-[15px]
                    "
                  >
                    {digit}
                  </motion.div>
                );
              },
            )}
          </motion.div>

          {/* Resend */}
          <motion.button
            type="button"
            disabled={
              seconds > 0 ||
              isVerifying
            }
            onClick={resendOtp}
            whileHover={
              seconds === 0
                ? { y: -1 }
                : undefined
            }
            whileTap={
              seconds === 0
                ? { scale: 0.98 }
                : undefined
            }
            className={`
              mt-4
              flex
              h-[48px]
              w-full
              items-center
              justify-center
              rounded-[8px]
              text-[14px]
              font-semibold
              transition-all
              duration-300

              ${
                seconds > 0
                  ? `
                    cursor-not-allowed
                    bg-[#E4E4E5]
                    text-white
                    shadow-[0_5px_12px_rgba(0,0,0,0.10)]
                  `
                  : `
                    bg-[#7442AD]
                    text-white
                    shadow-[0_7px_18px_rgba(116,66,173,0.25)]
                  `
              }
            `}
          >
            {seconds > 0
              ? `Resend OTP (${seconds})`
              : "Resend OTP"}
          </motion.button>

          {/* Change identifier */}
          <motion.button
            type="button"
            onClick={changeIdentifier}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="
              mt-4
              w-full
              text-center
              text-[14px]
              font-medium
              text-[#D28A00]
            "
          >
            Change{" "}
            {identifierType === "email"
              ? "Email"
              : "Number"}
          </motion.button>

          {/* Desktop helper */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="
              mt-8
              hidden
              text-center
              text-[14px]
              text-gray-400
              lg:block
            "
          >
            You can also enter the code
            using your keyboard
          </motion.p>
        </main>

        {/* =========================
            KEYPAD
        ========================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 80,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.12,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="
            w-full
            shrink-0
            border-t
            border-[#E4E7EC]
            bg-[#E9EDF3]

            px-4
            pb-[max(1rem,env(safe-area-inset-bottom))]
            pt-5

            lg:px-6
            lg:pb-6
          "
        >
          <div
            className="
              mx-auto
              grid
              w-full
              max-w-[430px]
              grid-cols-3
              gap-x-2
              gap-y-2

              lg:max-w-[480px]
            "
          >
            {[
              1, 2, 3,
              4, 5, 6,
              7, 8, 9,
            ].map((number) => (
              <KeypadButton
                key={number}
                onClick={() =>
                  addDigit(
                    String(number),
                  )
                }
              >
                {number}
              </KeypadButton>
            ))}

            {/* empty left position */}
            <div />

            <KeypadButton
              onClick={() =>
                addDigit("0")
              }
            >
              0
            </KeypadButton>

            <KeypadButton
              onClick={removeDigit}
              ariaLabel="Delete digit"
            >
              <Delete
                size={16}
                strokeWidth={1.8}
              />
            </KeypadButton>
          </div>
        </motion.div>

        {/* =========================
            VERIFYING OVERLAY
        ========================== */}

        <AnimatePresence>
          {isVerifying && (
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
              transition={{
                duration: 0.2,
              }}
              className="
                absolute
                inset-0
                z-50
                flex
                items-center
                justify-center
                bg-black/45
                backdrop-blur-[2px]
              "
            >
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.75,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 23,
                }}
                className="
                  flex
                  h-[72px]
                  w-[72px]
                  items-center
                  justify-center
                  rounded-full
                  bg-white/5
                "
              >
                <LoaderCircle
                  size={38}
                  strokeWidth={2.4}
                  className="
                    animate-spin
                    text-white
                  "
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PassengerAuthShell>
  );
}

interface KeypadButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel?: string;
}

function KeypadButton({
  children,
  onClick,
  ariaLabel,
}: KeypadButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      whileHover={{
        backgroundColor:
          "#F7F3FB",
      }}
      whileTap={{
        scale: 0.94,
        backgroundColor:
          "#EEE7F5",
      }}
      transition={{
        duration: 0.12,
      }}
      className="
        flex
        h-[48px]
        items-center
        justify-center
        rounded-[6px]
        bg-white
        text-[14px]
        font-semibold
        text-[#17131D]
        shadow-[0_1px_2px_rgba(0,0,0,0.04)]

        sm:h-[50px]
      "
    >
      {children}
    </motion.button>
  );
}