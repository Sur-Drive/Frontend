import {
  AnimatePresence,
  motion,
} from "framer-motion";

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

import {
  passengerSession,
} from "../../../api/passenger/passengerSession";

import {
  useSendPassengerOtp,
  useVerifyPassengerOtp,
} from "../../../hooks/passenger/usePassengerAuth";
import { toast } from "sonner";

/* =========================================================
   TYPES
========================================================= */

interface OtpLocationState {
  identifier?: string;

  identifierType?:
    | "phone"
    | "email";
}

/* =========================================================
   CONSTANTS
========================================================= */

const OTP_LENGTH = 5;
const RESEND_TIME = 45;

/* =========================================================
   PAGE
========================================================= */

export default function PassengerOtp() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const state =
    (location.state ??
      {}) as OtpLocationState;

  /*
   * Prefer navigation state.
   *
   * If the user refreshes this page, fall back to the
   * identifier persisted when send-otp was called.
   */
  const identifier =
    state.identifier ??
    passengerSession.getIdentifier();

  const identifierType:
    "phone" | "email" =
    state.identifierType ??
    (identifier.includes("@")
      ? "email"
      : "phone");

  /* =======================================================
     STATE
  ======================================================= */

  const [
    otp,
    setOtp,
  ] = useState("");

  const [
    seconds,
    setSeconds,
  ] = useState(
    RESEND_TIME,
  );

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     API
  ======================================================= */

  const {
    mutate: verifyOtp,
    isPending:
      isVerifying,
  } =
    useVerifyPassengerOtp();

  const {
    mutate: sendOtp,
    isPending:
      isResending,
  } =
    useSendPassengerOtp();

  /* =======================================================
     OTP DIGITS
  ======================================================= */

  const digits =
    useMemo(
      () =>
        Array.from(
          {
            length:
              OTP_LENGTH,
          },

          (_, index) =>
            otp[index] ??
            "",
        ),

      [otp],
    );

  /* =======================================================
     ROUTE PROTECTION
  ======================================================= */

  useEffect(() => {
    if (!identifier) {
      navigate(
        "/passenger/signup",
        {
          replace: true,
        },
      );
    }
  }, [
    identifier,
    navigate,
  ]);

  /* =======================================================
     COUNTDOWN
  ======================================================= */

  useEffect(() => {
    if (
      seconds <= 0
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setSeconds(
            (current) => {
              if (
                current <=
                1
              ) {
                window.clearInterval(
                  timer,
                );

                return 0;
              }

              return (
                current -
                1
              );
            },
          );
        },
        1000,
      );

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [seconds]);

  /* =======================================================
     VERIFY OTP
  ======================================================= */

  const verify =
    useCallback(
      (
        code: string,
      ) => {
        if (
          !identifier ||
          code.length !==
            OTP_LENGTH ||
          isVerifying
        ) {
          return;
        }

        setError("");

        verifyOtp(
          {
            identifier,
            otp: code,
          },

          {
            onSuccess: (
              response,
            ) => {
              /*
               * ============================================
               * NEW / INCOMPLETE PASSENGER
               * ============================================
               *
               * Backend response:
               *
               * requiresPersonalInfo: true
               *
               * passengerAuthApi.verifyOtp() should already
               * have stored user.accessToken as the
               * onboarding/temp token.
               */

              if (
                response
                  .requiresPersonalInfo
              ) {
                 toast.success(
                  "Verification successful.",
                );
                navigate(
                  "/passenger/complete-profile",
                  {
                    replace:
                      true,

                    state: {
                      identifier,

                      identifierType,
                    },
                  },
                );

                return;
              }

              /*
               * ============================================
               * EXISTING PASSENGER
               * ============================================
               *
               * Actual backend response:
               *
               * requiresPersonalInfo: false
               * user.hasCompletedOnboarding: true
               * tokens.accessToken
               * tokens.refreshToken
               *
               * passengerAuthApi.verifyOtp() has already
               * stored those as the normal passenger
               * session.
               */

              const hasCompletedOnboarding =
                response
                  .user
                  ?.hasCompletedOnboarding ===
                true;

              const hasAccessToken =
                Boolean(
                  response
                    .tokens
                    ?.accessToken,
                );

              const hasRefreshToken =
                Boolean(
                  response
                    .tokens
                    ?.refreshToken,
                );

              if (
                hasCompletedOnboarding &&
                hasAccessToken &&
                hasRefreshToken
              ) {
                toast.success(
                "Welcome back!",
                {
                  description:
                    "You've been signed in successfully.",
                },
              );
                navigate(
                  "/passenger/home",
                  {
                    replace:
                      true,
                  },
                );

                return;
              }

              /*
               * ============================================
               * DEFENSIVE FALLBACK
               * ============================================
               *
               * Do not guess where the passenger should go
               * if the backend returns an unexpected state.
               */

              setOtp("");
              toast.error(
                "Unable to continue",
                {
                  description:
                    "Your code was verified, but we couldn't determine your account status.",
                },
              );

              setError(
                "Your code was verified, but we could not determine your account status. Please try again.",
              );
            },

            onError: (
              apiError,
            ) => {
              setOtp("");

              toast.error(
              "Verification failed",
              {
                description:
                  apiError instanceof Error
                    ? apiError.message
                    : "Invalid OTP. Please try again.",
              },
            );

              setError(
                apiError instanceof
                  Error
                  ? apiError.message
                  : "Invalid OTP. Please try again.",
              );
            },
          },
        );
      },

      [
        identifier,
        identifierType,
        isVerifying,
        navigate,
        verifyOtp,
      ],
    );

  /* =======================================================
     ADD DIGIT
  ======================================================= */

  const addDigit =
    useCallback(
      (
        digit: string,
      ) => {
        if (
          isVerifying ||
          isResending ||
          otp.length >=
            OTP_LENGTH
        ) {
          return;
        }

        const nextOtp =
          `${otp}${digit}`;

        setOtp(
          nextOtp,
        );

        /*
         * Automatically verify once all five digits
         * have been entered.
         */
        if (
          nextOtp.length ===
          OTP_LENGTH
        ) {
          void verify(
            nextOtp,
          );
        }
      },

      [
        isResending,
        isVerifying,
        otp,
        verify,
      ],
    );

  /* =======================================================
     REMOVE DIGIT
  ======================================================= */

  const removeDigit =
    useCallback(
      () => {
        if (
          isVerifying ||
          isResending
        ) {
          return;
        }

        setOtp(
          (current) =>
            current.slice(
              0,
              -1,
            ),
        );

        setError("");
      },

      [
        isResending,
        isVerifying,
      ],
    );

  /* =======================================================
     PHYSICAL KEYBOARD SUPPORT
  ======================================================= */

  useEffect(() => {
    const handleKeyDown =
      (
        event: KeyboardEvent,
      ) => {
        if (
          isVerifying ||
          isResending
        ) {
          return;
        }

        if (
          /^[0-9]$/.test(
            event.key,
          )
        ) {
          event.preventDefault();

          addDigit(
            event.key,
          );

          return;
        }

        if (
          event.key ===
            "Backspace" ||
          event.key ===
            "Delete"
        ) {
          event.preventDefault();

          removeDigit();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    addDigit,
    removeDigit,
    isResending,
    isVerifying,
  ]);

  /* =======================================================
     RESEND OTP
  ======================================================= */

  const resendOtp =
    () => {
      if (
        seconds > 0 ||
        isVerifying ||
        isResending ||
        !identifier
      ) {
        return;
      }

      setError("");

      /*
       * Clear the previous code before requesting another.
       */
      setOtp("");

      sendOtp(
        {
          identifier,
        },

        {
          onSuccess:
            (response) => {
              setSeconds(
                RESEND_TIME,
              );
              toast.success(
            response?.message ||
              "A new OTP has been sent.",
          );
            },

          onError: (
            apiError,
          ) => {
             toast.error(
            apiError instanceof Error
              ? apiError.message
              : "Unable to resend OTP. Please try again.",
          );
            setError(
              apiError instanceof
                Error
                ? apiError.message
                : "Unable to resend OTP. Please try again.",
            );
          },
        },
      );
    };

  /* =======================================================
     CHANGE EMAIL / PHONE
  ======================================================= */

  const changeIdentifier =
    () => {
      /*
       * Remove the current onboarding attempt so a different
       * email/phone starts with a clean authentication state.
       */
      passengerSession.clearAuthTokens();

      navigate(
        "/passenger/signup",
        {
          replace: true,

          state: {
            mode:
              identifierType,
          },
        },
      );
    };

  /* =======================================================
     EMPTY IDENTIFIER
  ======================================================= */

  if (!identifier) {
    return null;
  }

  /* =======================================================
     UI
  ======================================================= */

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
        {/* =============================================
            OTP CONTENT
        ============================================== */}

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
            onClick={() =>
              navigate(-1)
            }
            whileHover={{
              x: -2,
            }}
            whileTap={{
              scale: 0.9,
            }}
            className="
              flex
              h-9
              w-9
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
              size={17}
              strokeWidth={
                1.8
              }
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
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
            className="mt-5"
          >
            <h1
              className="
                text-[22px]
                font-semibold
                tracking-[-0.025em]
                text-[#25212A]

                sm:text-[24px]
              "
            >
              OTP
              Verification
            </h1>

            <p
              className="
                mt-2
                text-[16px]
                leading-6
                text-[#AAA6AE]
              "
            >
              Enter the OTP
              sent to{" "}
              <span
                className="
                  font-medium
                  text-[#625D67]
                "
              >
                {
                  identifier
                }
              </span>
            </p>
          </motion.div>

          {/* Error */}

          <AnimatePresence
            mode="wait"
          >
            {error && (
              <motion.div
                key={error}
                initial={{
                  opacity:
                    0,
                  y: -5,
                }}
                animate={{
                  opacity:
                    1,
                  y: 0,
                }}
                exit={{
                  opacity:
                    0,
                  y: -5,
                }}
                className="
                  mt-4
                  rounded-[10px]
                  border
                  border-red-100
                  bg-red-50
                  px-4
                  py-3
                  text-[14px]
                  leading-5
                  text-red-600
                "
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

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
              (
                digit,
                index,
              ) => {
                const active =
                  index ===
                    otp.length &&
                  otp.length <
                    OTP_LENGTH;

                return (
                  <motion.div
                    key={
                      index
                    }
                    animate={{
                      scale:
                        digit
                          ? [
                              0.92,
                              1.06,
                              1,
                            ]
                          : 1,

                      borderColor:
                        active
                          ? "#7442AD"
                          : "#F1EFF3",
                    }}
                    transition={{
                      duration:
                        0.2,
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
                      text-[18px]
                      font-semibold
                      text-[#17131D]
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
              isVerifying ||
              isResending
            }
            onClick={
              resendOtp
            }
            whileHover={
              seconds ===
                0 &&
              !isVerifying &&
              !isResending
                ? {
                    y: -1,
                  }
                : undefined
            }
            whileTap={
              seconds ===
                0 &&
              !isVerifying &&
              !isResending
                ? {
                    scale:
                      0.98,
                  }
                : undefined
            }
            className={`
              mt-4
              flex
              h-[50px]
              w-full
              items-center
              justify-center
              rounded-[8px]
              text-[16px]
              font-semibold
              transition-all
              duration-300

              ${
                seconds >
                  0 ||
                isVerifying ||
                isResending
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
            {isResending
              ? "Sending OTP..."
              : seconds >
                  0
                ? `Resend OTP (${seconds}s)`
                : "Resend OTP"}
          </motion.button>

          {/* Change identifier */}

          <motion.button
            type="button"
            disabled={
              isVerifying ||
              isResending
            }
            onClick={
              changeIdentifier
            }
            whileHover={{
              scale:
                1.02,
            }}
            whileTap={{
              scale:
                0.97,
            }}
            className="
              mt-4
              w-full
              text-center
              text-[16px]
              font-medium
              text-[#D28A00]

              disabled:
              cursor-not-allowed

              disabled:
              opacity-50
            "
          >
            Change{" "}
            {identifierType ===
            "email"
              ? "Email"
              : "Number"}
          </motion.button>

          {/* Desktop helper */}

          <motion.p
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.5,
            }}
            className="
              mt-8
              hidden
              text-center
              text-[14px]
              text-gray-400

              lg:block
            "
          >
            You can also
            enter the code
            using your
            keyboard
          </motion.p>
        </main>

        {/* =============================================
            KEYPAD
        ============================================== */}

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
            ease: [
              0.22,
              1,
              0.36,
              1,
            ],
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
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              8,
              9,
            ].map(
              (
                number,
              ) => (
                <KeypadButton
                  key={
                    number
                  }
                  disabled={
                    isVerifying ||
                    isResending
                  }
                  onClick={() =>
                    addDigit(
                      String(
                        number,
                      ),
                    )
                  }
                >
                  {number}
                </KeypadButton>
              ),
            )}

            {/* empty left position */}

            <div />

            <KeypadButton
              disabled={
                isVerifying ||
                isResending
              }
              onClick={() =>
                addDigit(
                  "0",
                )
              }
            >
              0
            </KeypadButton>

            <KeypadButton
              disabled={
                isVerifying ||
                isResending
              }
              onClick={
                removeDigit
              }
              ariaLabel="Delete digit"
            >
              <Delete
                size={18}
                strokeWidth={
                  1.8
                }
              />
            </KeypadButton>
          </div>
        </motion.div>

        {/* =============================================
            VERIFYING OVERLAY
        ============================================== */}

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
                duration:
                  0.2,
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
                  opacity:
                    0,
                  scale:
                    0.75,
                }}
                animate={{
                  opacity:
                    1,
                  scale:
                    1,
                }}
                exit={{
                  opacity:
                    0,
                  scale:
                    0.8,
                }}
                transition={{
                  type:
                    "spring",
                  stiffness:
                    300,
                  damping:
                    23,
                }}
                className="flex flex-col items-center justify-center gap-4 "
              >
                <div
                  className="
                    flex
                    h-[72px]
                    w-[72px]
                    items-center
                    justify-center
                    rounded-full
                    bg-white/10
                  "
                >
                  <LoaderCircle
                    size={38}
                    strokeWidth={
                      2.4
                    }
                    className="text-white animate-spin"
                  />
                </div>

                <p
                  className="
                    text-[16px]
                    font-medium
                    text-white
                  "
                >
                  Verifying
                  your code...
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PassengerAuthShell>
  );
}

/* =========================================================
   KEYPAD BUTTON
========================================================= */

interface KeypadButtonProps {
  children:
    React.ReactNode;

  onClick:
    () => void;

  ariaLabel?:
    string;

  disabled?:
    boolean;
}

function KeypadButton({
  children,
  onClick,
  ariaLabel,
  disabled = false,
}: KeypadButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={
        ariaLabel
      }
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      whileHover={
        disabled
          ? undefined
          : {
              backgroundColor:
                "#F7F3FB",
            }
      }
      whileTap={
        disabled
          ? undefined
          : {
              scale:
                0.94,

              backgroundColor:
                "#EEE7F5",
            }
      }
      transition={{
        duration:
          0.12,
      }}
      className="
        flex
        h-[50px]
        items-center
        justify-center
        rounded-[6px]
        bg-white
        text-[16px]
        font-semibold
        text-[#17131D]
        shadow-[0_1px_2px_rgba(0,0,0,0.04)]

        disabled:
        cursor-not-allowed

        disabled:
        opacity-60
      "
    >
      {children}
    </motion.button>
  );
}

