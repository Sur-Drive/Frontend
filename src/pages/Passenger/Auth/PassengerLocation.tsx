import { motion } from "framer-motion";
import {
  MapPin,
  Navigation,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import PassengerAuthShell from "../../../components/passenger/auth/PassengerAuthShell";

export default function PassengerLocation() {
  const navigate = useNavigate();

  const [isRequesting, setIsRequesting] =
    useState(false);

  const handleGrantPermission = () => {
    if (!navigator.geolocation) {
      // Browser does not support geolocation.
      navigate("/passenger/biometric");
      return;
    }

    setIsRequesting(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsRequesting(false);

        const {
          latitude,
          longitude,
        } = position.coords;

        /*
         * Later we can persist this in the
         * passenger store/context if needed.
         */

        navigate("/passenger/biometric", {
          state: {
            locationPermission: true,
            latitude,
            longitude,
          },
        });
      },

      (error) => {
        setIsRequesting(false);

        console.error(
          "Location permission error:",
          error,
        );

        /*
         * Don't force navigation here.
         * If permission is denied, the user
         * can still choose "Maybe Later".
         */
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const handleMaybeLater = () => {
    navigate("/passenger/biometric", {
      state: {
        locationPermission: false,
      },
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
          {/* Close button */}
          <motion.button
            type="button"
            aria-label="Close"
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
              rotate: 90,
              scale: 1.06,
            }}
            whileTap={{
              scale: 0.9,
            }}
            transition={{
              duration: 0.25,
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
            <X
              size={18}
              strokeWidth={2}
            />
          </motion.button>

          {/* Heading */}
          <motion.header
            initial={{
              opacity: 0,
              y: 16,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.08,
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-7"
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
              Enable Location
            </h1>

            <p
              className="
                mt-2
                max-w-[390px]
                text-[16px]
                leading-[1.55]
                text-[#9E9AA3]
              "
            >
              To be able to use the service, we
              require permission to access your
              location.
            </p>
          </motion.header>

          {/* Illustration area */}
          <div
            className="
              relative
              flex
              min-h-[270px]
              flex-1
              items-center
              justify-center

              sm:min-h-[320px]
              lg:min-h-[350px]
            "
          >
            <LocationIllustration />
          </div>

          {/* Actions */}
          <motion.div
            initial={{
              opacity: 0,
              y: 24,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.35,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="
              mt-auto
              w-full
              pb-6

              sm:pb-8
            "
          >
            <motion.button
              type="button"
              disabled={isRequesting}
              onClick={handleGrantPermission}
              whileHover={
                !isRequesting
                  ? {
                      y: -2,
                      boxShadow:
                        "0 12px 28px rgba(116,66,173,0.28)",
                    }
                  : undefined
              }
              whileTap={
                !isRequesting
                  ? { scale: 0.98 }
                  : undefined
              }
              className="
                relative
                flex
                h-[54px]
                w-full
                items-center
                justify-center
                overflow-hidden
                rounded-[8px]
                bg-[#7442AD]
                px-5
                text-[16px]
                font-semibold
                text-white
                shadow-[0_7px_18px_rgba(116,66,173,0.22)]
                disabled:cursor-wait
                disabled:opacity-80
              "
            >
              {isRequesting ? (
                <span className="flex items-center gap-2.5">
                  <motion.span
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Navigation
                      size={18}
                      strokeWidth={2}
                    />
                  </motion.span>

                  Getting your location...
                </span>
              ) : (
                "Grant Permission"
              )}
            </motion.button>

            <motion.button
              type="button"
              disabled={isRequesting}
              onClick={handleMaybeLater}
              whileHover={{
                color: "#7442AD",
              }}
              whileTap={{
                scale: 0.97,
              }}
              className="
                mt-5
                w-full
                text-center
                text-[16px]
                font-semibold
                text-[#4C4850]
                disabled:opacity-50
              "
            >
              Maybe Later
            </motion.button>
          </motion.div>
        </main>
      </div>
    </PassengerAuthShell>
  );
}

/* =====================================
   LOCATION ILLUSTRATION
===================================== */

function LocationIllustration() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.85,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{
        delay: 0.18,
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="
        relative
        h-[260px]
        w-full
        max-w-[340px]

        sm:h-[300px]
        sm:max-w-[380px]
      "
    >
      {/* Purple ambient glow */}
      <motion.div
        animate={{
          scale: [0.9, 1.08, 0.9],
          opacity: [0.12, 0.23, 0.12],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          left-1/2
          top-1/2
          h-[180px]
          w-[180px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-[#B88AF0]
          blur-[60px]
        "
      />

      {/* Abstract roads */}
      <div
        className="
          absolute
          left-[12%]
          top-[49%]
          h-[18px]
          w-[76%]
          -rotate-[18deg]
          rounded-full
          bg-[#F7F7F8]
        "
      />

      <div
        className="
          absolute
          left-[23%]
          top-[55%]
          h-[16px]
          w-[65%]
          rotate-[27deg]
          rounded-full
          bg-[#F8F8F9]
        "
      />

      <div
        className="
          absolute
          left-[43%]
          top-[28%]
          h-[62%]
          w-[16px]
          rotate-[8deg]
          rounded-full
          bg-[#F8F8F9]
        "
      />

      {/* Subtle map accents */}
      <div
        className="
          absolute
          left-[30%]
          top-[55%]
          h-3
          w-14
          -rotate-[20deg]
          rounded-full
          bg-red-100/50
        "
      />

      <div
        className="
          absolute
          right-[25%]
          top-[51%]
          h-3
          w-12
          -rotate-[18deg]
          rounded-full
          bg-green-100/60
        "
      />

      {/* Purple route glow */}
      <motion.div
        animate={{
          opacity: [0.1, 0.35, 0.1],
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          left-[43%]
          top-[26%]
          h-[110px]
          w-[55px]
          bg-gradient-to-b
          from-transparent
          via-[#C9A7F4]/35
          to-[#7442AD]/15
          blur-[9px]
        "
      />

      {/* Location pin */}
      <motion.div
        initial={{
          y: -20,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          delay: 0.5,
          type: "spring",
          stiffness: 240,
          damping: 14,
        }}
        className="
          absolute
          left-1/2
          top-[52%]
          -translate-x-1/2
          -translate-y-1/2
        "
      >
        {/* Pulse behind pin */}
        <motion.div
          animate={{
            scale: [0.8, 1.7],
            opacity: [0.3, 0],
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

        <motion.div
          animate={{
            y: [0, -5, 0],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="
            relative
            flex
            h-[54px]
            w-[54px]
            items-center
            justify-center
            rounded-full
            bg-white
            shadow-[0_10px_30px_rgba(116,66,173,0.22)]
          "
        >
          <MapPin
            size={40}
            fill="#7442AD"
            stroke="#7442AD"
            strokeWidth={1.8}
          />

          <span
            className="
              absolute
              top-[15px]
              h-[9px]
              w-[9px]
              rounded-full
              bg-white
            "
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}