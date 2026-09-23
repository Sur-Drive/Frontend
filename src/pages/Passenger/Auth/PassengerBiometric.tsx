import { motion } from "framer-motion";
import {
  ArrowLeft,
  Fingerprint,
  ScanFace,
  User,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import PassengerAuthShell from "../../../components/passenger/auth/PassengerAuthShell";

type BiometricType = "fingerprint" | "face";

interface BiometricLocationState {
  fullName?: string;
  phone?: string;
  biometricType?: BiometricType;
}

export default function PassengerBiometric() {
  const navigate = useNavigate();
  const location = useLocation();

  const state =
    (location.state ?? {}) as BiometricLocationState;

  const firstName =
    state.fullName?.trim().split(" ")[0] || "Abiodun";

  const phone = state.phone || "816****789";

  const [biometricType] = useState<BiometricType>(
    state.biometricType ??
      (isLikelyAppleDevice() ? "face" : "fingerprint"),
  );

  const [isAuthenticating, setIsAuthenticating] =
    useState(false);

  const maskedPhone = maskPhone(phone);

  const isFace = biometricType === "face";

  const handleBiometricLogin = () => {
    if (isAuthenticating) return;

    setIsAuthenticating(true);

    /*
     * TEMPORARY FRONTEND FLOW
     *
     * Replace this with WebAuthn/passkey authentication
     * once the passenger authentication API is connected.
     */

    window.setTimeout(() => {
      setIsAuthenticating(false);

      navigate("/passenger/home", {
        replace: true,
      });
    }, 1500);
  };

  const handleLogout = () => {
    navigate("/passenger/signup", {
      replace: true,
    });
  };

  return (
    <PassengerAuthShell>
      <div
        className="
          relative
          min-h-[100dvh]
          w-full
          overflow-hidden
          bg-white
        "
      >
        <main
          className="
            mx-auto
            flex
            min-h-[100dvh]
            w-full
            max-w-[480px]
            flex-col
            px-5
            pb-[max(2rem,env(safe-area-inset-bottom))]
            pt-5

            sm:px-7
            sm:pt-7

            lg:max-w-[540px]
            lg:px-8
            lg:pb-10
            lg:pt-8
          "
        >
          {/* Back */}
          <motion.button
            type="button"
            aria-label="Go back"
            onClick={() => navigate(-1)}
            initial={{
              opacity: 0,
              scale: 0.7,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
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
              text-[#25212A]
              shadow-[0_3px_16px_rgba(20,15,30,0.08)]
            "
          >
            <ArrowLeft
              size={18}
              strokeWidth={2}
            />
          </motion.button>

          {/* Main biometric content */}
          <div
            className="
              flex
              flex-1
              flex-col
              items-center
              justify-start
              pt-[10vh]

              sm:pt-[12vh]
              lg:pt-[9vh]
            "
          >
            {/* Avatar */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.7,
                y: 15,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              transition={{
                type: "spring",
                stiffness: 220,
                damping: 18,
              }}
              className="
                relative
                flex
                h-[86px]
                w-[86px]
                items-center
                justify-center
                overflow-hidden
                rounded-full
                bg-[#F1E9FF]

                sm:h-[96px]
                sm:w-[96px]
              "
            >
              {/* Subtle animated face placeholder */}
              <motion.div
                animate={{
                  y: [0, -2, 0],
                  rotate: [0, 1.5, -1.5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <User
                  size={40}
                  strokeWidth={1.3}
                  className="text-[#E1D2F8]"
                />
              </motion.div>

              {/* Glow */}
              <motion.div
                animate={{
                  opacity: [0.15, 0.4, 0.15],
                  scale: [0.9, 1.1, 0.9],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="
                  absolute
                  inset-2
                  rounded-full
                  bg-[#C9A7F4]/20
                  blur-xl
                "
              />
            </motion.div>

            {/* Welcome */}
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
                delay: 0.12,
                duration: 0.45,
              }}
              className="mt-7 text-center"
            >
              <h1
                className="
                  text-[22px]
                  font-semibold
                  tracking-[-0.03em]
                  text-[#25212A]

                  sm:text-[24px]
                "
              >
                Welcome back, {firstName}
              </h1>

              <p
                className="
                  mt-2
                  text-[14px]
                  text-[#AAA6AE]
                "
              >
                ({maskedPhone})
              </p>
            </motion.div>

            {/* Biometric button */}
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              transition={{
                delay: 0.22,
                type: "spring",
                stiffness: 220,
                damping: 20,
              }}
              className="mt-9 flex flex-col items-center"
            >
              <div className="relative">
                {/* Pulsing ring */}
                <motion.div
                  animate={{
                    scale: [1, 1.45],
                    opacity: [0.22, 0],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                  className="
                    absolute
                    inset-0
                    rounded-full
                    bg-[#7442AD]
                  "
                />

                <motion.button
                  type="button"
                  aria-label={
                    isFace
                      ? "Login using Face ID"
                      : "Login using fingerprint"
                  }
                  disabled={isAuthenticating}
                  onClick={handleBiometricLogin}
                  whileHover={{
                    scale: 1.06,
                    boxShadow:
                      "0 14px 35px rgba(116,66,173,0.32)",
                  }}
                  whileTap={{
                    scale: 0.92,
                  }}
                  className="
                    relative
                    z-10
                    flex
                    h-[68px]
                    w-[68px]
                    items-center
                    justify-center
                    rounded-full
                    bg-[#7442AD]
                    text-white
                    shadow-[0_10px_25px_rgba(116,66,173,0.25)]

                    sm:h-[74px]
                    sm:w-[74px]
                  "
                >
                  {isFace ? (
                    <ScanFace
                      size={34}
                      strokeWidth={1.8}
                    />
                  ) : (
                    <Fingerprint
                      size={36}
                      strokeWidth={1.7}
                    />
                  )}

                  {/* Authentication sweep */}
                  {isAuthenticating && (
                    <motion.span
                      initial={{ top: "15%" }}
                      animate={{ top: "78%" }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                      }}
                      className="
                        pointer-events-none
                        absolute
                        left-[18%]
                        h-[2px]
                        w-[64%]
                        rounded-full
                        bg-white
                        shadow-[0_0_10px_rgba(255,255,255,0.9)]
                      "
                    />
                  )}
                </motion.button>
              </div>

              <motion.p
                animate={
                  isAuthenticating
                    ? {
                        opacity: [0.5, 1, 0.5],
                      }
                    : undefined
                }
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                }}
                className="
                  mt-5
                  text-center
                  text-[16px]
                  font-medium
                  text-[#7442AD]
                "
              >
                {isAuthenticating
                  ? "Authenticating..."
                  : isFace
                    ? "Use Face ID to login"
                    : "Touch fingerprint sensor to login"}
              </motion.p>
            </motion.div>
          </div>

          {/* Bottom logout */}
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
              delay: 0.45,
            }}
            className="
              flex
              items-center
              justify-center
              pb-1
            "
          >
            <span
              className="
                text-[14px]
                text-[#AAA6AE]
              "
            >
              Not you?
            </span>

            <motion.button
              type="button"
              onClick={handleLogout}
              whileHover={{
                y: -1,
              }}
              whileTap={{
                scale: 0.96,
              }}
              className="
                ml-1
                text-[14px]
                font-semibold
                text-[#7442AD]
              "
            >
              Log out
            </motion.button>
          </motion.div>
        </main>
      </div>
    </PassengerAuthShell>
  );
}

/* =====================================
   HELPERS
===================================== */

function maskPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length < 6) {
    return "816****789";
  }

  return `${cleaned.slice(0, 3)}****${cleaned.slice(-3)}`;
}

function isLikelyAppleDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const platform =
    navigator.userAgent.toLowerCase();

  return (
    platform.includes("iphone") ||
    platform.includes("ipad") ||
    platform.includes("macintosh")
  );
}