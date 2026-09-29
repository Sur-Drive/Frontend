import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  ArrowRight,
  Car,
  Compass,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import logo from "../../assets/logo.png";

const HERO_IMAGE = "/images/bgimg.png";

/* =========================================================
   TYPES
========================================================= */

type CardProps = {
  title: string;
  desc: string;
  glyph: "nav" | "car" | "driver";
  variant: "purple" | "gold";
  onClick: () => void;
};

/* =========================================================
   CUSTOM NAVIGATION GLYPH
========================================================= */

function NavigationGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[58%] w-[58%]"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6.5 9.5 5v13L4 19.5v-13Z"
        fill="currentColor"
        fillOpacity="0.9"
      />

      <path
        d="M9.5 5 14.5 7v13L9.5 18V5Z"
        fill="currentColor"
        fillOpacity="0.65"
      />

      <path
        d="M14.5 7 20 5.5v13L14.5 20V7Z"
        fill="currentColor"
        fillOpacity="0.9"
      />

      <circle
        cx="15.5"
        cy="5.2"
        r="3.4"
        fill="currentColor"
      />

      <circle
        cx="15.5"
        cy="5.2"
        r="1.3"
        className="fill-[#6E43A3]"
      />
    </svg>
  );
}

/* =========================================================
   CAR GLYPH
========================================================= */

function CarGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[58%] w-[58%]"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 15.5v-2.2c0-.5.3-.9.7-1.1l1.6-.8 1.4-3c.3-.6.9-1 1.6-1h6.4c.7 0 1.3.4 1.6 1l1.4 3 1.6.8c.4.2.7.6.7 1.1v2.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect
        x="2.2"
        y="13.3"
        width="19.6"
        height="4"
        rx="1.6"
        fill="currentColor"
        fillOpacity="0.9"
      />

      <circle
        cx="7.2"
        cy="17.6"
        r="1.8"
        fill="currentColor"
      />

      <circle
        cx="16.8"
        cy="17.6"
        r="1.8"
        fill="currentColor"
      />

      <path
        d="M2 12.5h2.4M2 10.2h3.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

/* =========================================================
   DRIVER GLYPH
========================================================= */

function DriverGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[58%] w-[58%]"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="9.3"
        cy="6.4"
        r="3"
        fill="currentColor"
      />

      <path
        d="M4 17.5c0-3 2.4-5.4 5.3-5.4 1.5 0 2.8.6 3.8 1.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle
        cx="16.3"
        cy="16.3"
        r="4.6"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <circle
        cx="16.3"
        cy="16.3"
        r="1.3"
        fill="currentColor"
      />

      <path
        d="M16.3 11.7v1.7M16.3 19.2v1.7M11.7 16.3h1.7M19.2 16.3h1.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* =========================================================
   ROUTE PATTERN
========================================================= */

function RoutePattern({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 180 110"
      className={`pointer-events-none absolute -bottom-3 -right-2 h-[92%] w-[62%] ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M-10 20c30 0 20 30 50 30s10-35 45-35 20 45 60 45"
        stroke="white"
        strokeOpacity="0.16"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="1 14"
      />

      <path
        d="M10 95c25-5 30-40 65-40s25 25 55 15"
        stroke="white"
        strokeOpacity="0.12"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="1 12"
      />

      {[
        [148, 14],
        [96, 40],
        [60, 72],
      ].map(([cx, cy], index) => (
        <g
          key={index}
          opacity={0.22}
        >
          <path
            d={`M${cx} ${cy - 9} c-5 0-9 4-9 9 0 6 9 14 9 14s9-8 9-14c0-5-4-9-9-9Z`}
            fill="white"
          />
        </g>
      ))}

      <rect
        x="120"
        y="60"
        width="16"
        height="9"
        rx="2"
        fill="white"
        opacity="0.14"
      />
    </svg>
  );
}

/* =========================================================
   CAR PATTERN
========================================================= */

function CarPattern({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 180 110"
      className={`pointer-events-none absolute -bottom-4 -right-1 h-[95%] w-[64%] ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M-10 30c30 5 25 35 60 35s20-40 60-40 30 30 60 22"
        stroke="#2d1a4a"
        strokeOpacity="0.14"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="1 13"
      />

      {[
        [40, 78, 0.16, 22],
        [112, 34, 0.14, 18],
      ].map(([x, y, op, s], index) => (
        <g
          key={index}
          transform={`translate(${x} ${y}) scale(${(s as number) / 24})`}
          opacity={op}
        >
          <path
            d="M1 15v-2.2c0-.5.3-.9.7-1.1l1.6-.8 1.4-3c.3-.6.9-1 1.6-1h6.4c.7 0 1.3.4 1.6 1l1.4 3 1.6.8c.4.2.7.6.7 1.1V15"
            stroke="#2d1a4a"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <rect
            x="0.2"
            y="12.8"
            width="19.6"
            height="4"
            rx="1.6"
            fill="#2d1a4a"
          />
        </g>
      ))}

      {[
        [150, 10],
        [70, 20],
      ].map(([cx, cy], index) => (
        <path
          key={index}
          d={`M${cx} ${cy - 9} c-5 0-9 4-9 9 0 6 9 14 9 14s9-8 9-14c0-5-4-9-9-9Z`}
          fill="#2d1a4a"
          opacity="0.16"
        />
      ))}
    </svg>
  );
}

/* =========================================================
   ACTION CARD
========================================================= */

function ActionCard({
  title,
  desc,
  glyph,
  variant,
  onClick,
}: CardProps) {
  const isGold = variant === "gold";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{
        opacity: 0,
        y: 20,
        scale: 0.97,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      whileHover={{
        y: -2,
        scale: 1.015,
      }}
      whileTap={{
        scale: 0.975,
      }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`
  group
  relative
  flex
  w-full
  items-center
  gap-[clamp(7px,1.8dvh,13px)]
  overflow-hidden
  rounded-[18px]

  px-[clamp(9px,2.2dvh,14px)]
  py-[clamp(10px,2.6dvh,17px)]

  text-left
  shadow-[0_7px_18px_rgba(40,20,65,0.10)]
  transition-shadow
  duration-300

  hover:shadow-[0_12px_28px_rgba(40,20,65,0.16)]

  ${
    isGold
      ? "bg-[#F4C542] text-[#2d1a4a]"
      : "bg-[#6E43A3] text-white"
  }
`}
    >
      {/* Animated shine */}

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-[80%] w-[45%] skew-x-[-20deg] bg-white/20 blur-xl"
        animate={{
          x: ["0%", "420%"],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          repeatDelay: 2.5,
          ease: "easeInOut",
        }}
      />

      {isGold ? (
        <CarPattern />
      ) : (
        <RoutePattern />
      )}

      {/* Icon */}

      <motion.span
        className={`
          relative
          flex
          h-[clamp(30px,7dvh,40px)]
          w-[clamp(30px,7dvh,40px)]
          shrink-0
          items-center
          justify-center
          rounded-full
          ${
            isGold
              ? "bg-white/25 text-[#2d1a4a]"
              : "bg-white/25 text-white"
          }
        `}
        animate={{
          y: [0, -2, 0],
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {glyph === "nav" && (
          <NavigationGlyph />
        )}

        {glyph === "car" && (
          <CarGlyph />
        )}

        {glyph === "driver" && (
          <DriverGlyph />
        )}
      </motion.span>

      {/* Text */}

      <span className="relative flex-1 min-w-0">
        <span className="block text-[clamp(11px,2.6dvh,13px)] font-semibold leading-tight">
          {title}
        </span>

        <span
          className={`
            mt-0.5 block
            text-[clamp(8px,1.8dvh,10px)]
            leading-snug
            ${
              isGold
                ? "text-[#2d1a4a]/80"
                : "text-white/85"
            }
          `}
        >
          {desc}
        </span>
      </span>

      {/* Arrow */}

      <motion.span
        className="relative flex h-[clamp(24px,5.6dvh,32px)] w-[clamp(24px,5.6dvh,32px)] shrink-0 items-center justify-center rounded-full bg-white text-[#6E43A3] shadow-sm"
        whileHover={{
          x: 3,
        }}
      >
        <ArrowRight className="h-[55%] w-[55%]" />
      </motion.span>
    </motion.button>
  );
}

/* =========================================================
   COMING SOON MODAL
========================================================= */

interface ComingSoonModalProps {
  open: boolean;
  onClose: () => void;
  feature: "ride" | "driver";
}

function ComingSoonModal({
  open,
  onClose,
  feature,
}: ComingSoonModalProps) {
  const isRide = feature === "ride";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-end justify-center bg-[#160B22]/55 p-4 backdrop-blur-[5px] sm:items-center"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="coming-soon-title"
            initial={{
              opacity: 0,
              y: 60,
              scale: 0.94,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 40,
              scale: 0.96,
            }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 28,
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
            className="relative w-full max-w-[390px] overflow-hidden rounded-[28px] bg-white p-6 shadow-[0_25px_80px_rgba(20,8,30,0.30)]"
          >
            {/* Decorative background */}

            <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-[#F4C542]/20 blur-2xl" />

            <div className="pointer-events-none absolute -bottom-16 -left-14 h-40 w-40 rounded-full bg-[#6E43A3]/15 blur-2xl" />

            {/* Close */}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#F6F4F7] text-[#655D6D] transition hover:bg-[#EEEAF1]"
            >
              <X size={18} />
            </button>

            {/* Icon */}

            <motion.div
              initial={{
                scale: 0.7,
                rotate: -8,
              }}
              animate={{
                scale: 1,
                rotate: 0,
              }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 18,
                delay: 0.05,
              }}
              className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F1E9FA] text-[#6E43A3]"
            >
              {isRide ? (
                <Car size={29} />
              ) : (
                <DriverGlyph />
              )}

              <motion.span
                className="absolute inset-0 rounded-full border border-[#6E43A3]/20"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 0, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            </motion.div>

            {/* Content */}

            <div className="relative mt-5 text-center">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6E43A3]">
                Coming Soon
              </p>

              <h2
                id="coming-soon-title"
                className="mt-2 text-[23px] font-bold tracking-[-0.03em] text-[#302B34]"
              >
                {isRide
                  ? "Book a Ride"
                  : "Earn as a Driver"}
              </h2>

              <p className="mx-auto mt-2 max-w-[300px] text-[14px] leading-6 text-[#817A85]">
                {isRide
                  ? "We're putting the finishing touches on the SUR-DRIVE ride booking experience."
                  : "Our driver onboarding and earning experience is currently being prepared."}
              </p>

              <p className="mt-3 text-[13px] font-medium text-[#6E43A3]">
                We'll be ready for you soon.
              </p>
            </div>

            {/* Button */}

            <motion.button
              type="button"
              onClick={onClose}
              whileTap={{
                scale: 0.97,
              }}
              className="relative mt-6 flex h-[52px] w-full items-center justify-center rounded-[15px] bg-[#6E43A3] text-[15px] font-semibold text-white shadow-[0_10px_25px_rgba(110,67,163,0.25)]"
            >
              Got it
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function WelcomePage() {
  const navigate =
    useNavigate();

  const [
    comingSoon,
    setComingSoon,
  ] = useState<
    "ride" | "driver" | null
  >(null);

  /* -----------------------------------------
     Navigation
  ----------------------------------------- */

  const openNavigation = () => {
    sessionStorage.removeItem(
      "splashShown",
    );

    navigate("/home");
  };

  const openRideComingSoon = () => {
    setComingSoon("ride");
  };

  const openDriverComingSoon = () => {
    setComingSoon("driver");
  };

  const closeComingSoon = () => {
    setComingSoon(null);
  };

  return (
    <div className="font-outfit relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#6E43A3]">
      {/* =================================================
          HERO IMAGE
      ================================================= */}
      <section className="relative h-[clamp(215px,40dvh,320px)] shrink-0 overflow-hidden">
  {/* =================================================
      HERO IMAGE
  ================================================= */}

  <img
    src={HERO_IMAGE}
    alt=""
    aria-hidden="true"
    className="
      absolute
      inset-0
      h-full
      w-full
      object-cover

      /* Show more of the upper part of the image */
      object-[50%_5%]

      sm:object-[50%_8%]

      md:object-[50%_12%]
    "
  />

  {/* Purple tint */}
  <div
    className="
      absolute
      inset-0
      bg-gradient-to-b
      from-[#6E43A3]/85
      via-[#6E43A3]/30
      to-[#6E43A3]/5
    "
  />

  {/* Bottom purple fade */}
  <div
    className="
      absolute
      inset-x-0
      bottom-0
      h-24
      bg-gradient-to-t
      from-[#6E43A3]
      to-transparent
    "
  />

  {/* =================================================
      LOGO
  ================================================= */}

  <motion.div
    initial={{
      opacity: 0,
      y: -10,
    }}
    animate={{
      opacity: 1,
      y: 0,
    }}
    transition={{
      duration: 0.6,
      ease: "easeOut",
    }}
    className="
      relative
      z-10
      flex
      items-center
      justify-center
      gap-1.5
      pt-[calc(env(safe-area-inset-top,0px)+clamp(8px,2.2dvh,16px))]
    "
  >
    <img
      src={logo}
      alt="SUR-DRIVE"
      className="
        h-[clamp(18px,4.5dvh,24px)]
        w-auto
      "
    />

    <div className="leading-none text-white">
      <span
        className="
          text-[clamp(12px,3dvh,15px)]
          font-extrabold
          tracking-tight
        "
      >
        SUR-DRIVE
      </span>

      <sup
        className="
          ml-0.5
          text-[clamp(6px,1.3dvh,7px)]
          font-bold
          text-[#F4C542]
        "
      >
        HT
      </sup>

      <p
        className="
          mt-0.5
          text-[clamp(4.5px,1dvh,5px)]
          font-bold
          tracking-widest
          text-[#F4C542]
        "
      >
        YOUR ROAD. YOUR GUIDE.
      </p>
    </div>
  </motion.div>
</section>

      

      {/* =================================================
          MAIN WHITE PANEL
      ================================================= */}

      <motion.main
        initial={{
          y: 35,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          duration: 0.65,
          delay: 0.12,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="
          relative
          z-20
          -mt-2
          flex
          min-h-0
          flex-1
          flex-col
          overflow-hidden
          rounded-t-[36px]
          bg-white
          px-5
          pb-[max(8px,env(safe-area-inset-bottom))]
          pt-[clamp(10px,3dvh,24px)]
          shadow-[0_-12px_35px_rgba(32,13,48,0.10)]
        "
      >
        {/* =================================================
            HEADING
        ================================================= */}

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
            delay: 0.35,
            duration: 0.5,
          }}
        >
          <h1 className="mt-[clamp(1px,0.6dvh,4px)] text-center text-[clamp(14px,3.2dvh,19px)] font-bold leading-tight text-[#6E43A3]">
            Welcome to SUR-DRIVE{" "}
            <span className="text-[#F4C542]">
              HT
            </span>
          </h1>

          <p className="mx-auto mt-[clamp(2px,0.8dvh,6px)] max-w-[230px] text-center text-[clamp(8.5px,1.9dvh,10.5px)] leading-snug text-[#7286A7]">
            Your journey. your choice.
            Drive, book or earn all in
            one app
          </p>
        </motion.div>

        {/* =================================================
            ACTION CARDS
        ================================================= */}

        <div className="mt-[clamp(6px,2.2dvh,16px)] flex flex-col gap-[clamp(5px,1.4dvh,10px)]">
          {/* ---------------------------------------------
              OPEN NAVIGATION
          --------------------------------------------- */}

          <ActionCard
            variant="purple"
            title="Open Navigation"
            desc="Get real-time directions and reach your destination with ease."
            glyph="nav"
            onClick={
              openNavigation
            }
          />

          {/* ---------------------------------------------
              BOOK A RIDE
              COMING SOON
          --------------------------------------------- */}

          <ActionCard
            variant="gold"
            title="Book a Ride"
            desc="Request a ride and get matched with a nearby driver."
            glyph="car"
            onClick={
              openRideComingSoon
            }
          />

          {/* ---------------------------------------------
              EARN AS DRIVER
              COMING SOON
          --------------------------------------------- */}

          <ActionCard
            variant="purple"
            title="Earn as a Driver"
            desc="Join our driver community and start earning today."
            glyph="driver"
            onClick={
              openDriverComingSoon
            }
          />
        </div>

        {/* =================================================
            SUPPORT
        ================================================= */}

        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            delay: 0.8,
            duration: 0.5,
          }}
          className="mt-auto pt-[clamp(3px,1.2dvh,12px)] text-center"
        >
          <p className="text-[clamp(8.5px,1.9dvh,10.5px)] text-[#7286A7]">
            Need help?{" "}
            <a
              href="mailto:surdriveht@gmail.com"
              className="font-semibold text-[#4a148c] underline underline-offset-2"
            >
              Contact support →
            </a>
          </p>
        </motion.div>
      </motion.main>

      {/* =================================================
          COMING SOON MODAL
      ================================================= */}

      <ComingSoonModal
        open={
          comingSoon !== null
        }
        feature={
          comingSoon === "driver"
            ? "driver"
            : "ride"
        }
        onClose={
          closeComingSoon
        }
      />
    </div>
  );
}


// import { useNavigate } from "react-router-dom";
// import { ArrowRight } from "lucide-react";
// import logo from "../../assets/logo.png";

// const HERO_IMAGE = "/images/bgimg.png";

// function NavigationGlyph() {
//   return (
//     <svg viewBox="0 0 24 24" className="h-[58%] w-[58%]" fill="none">
//       <path
//         d="M4 6.5 9.5 5v13L4 19.5v-13Z"
//         fill="currentColor"
//         fillOpacity="0.9"
//       />
//       <path
//         d="M9.5 5 14.5 7v13L9.5 18V5Z"
//         fill="currentColor"
//         fillOpacity="0.65"
//       />
//       <path
//         d="M14.5 7 20 5.5v13L14.5 20V7Z"
//         fill="currentColor"
//         fillOpacity="0.9"
//       />
//       <circle cx="15.5" cy="5.2" r="3.4" fill="currentColor" />
//       <circle cx="15.5" cy="5.2" r="1.3" className="fill-[#6E43A3]" />
//     </svg>
//   );
// }

// function CarGlyph() {
//   return (
//     <svg viewBox="0 0 24 24" className="h-[58%] w-[58%]" fill="none">
//       <path
//         d="M3 15.5v-2.2c0-.5.3-.9.7-1.1l1.6-.8 1.4-3c.3-.6.9-1 1.6-1h6.4c.7 0 1.3.4 1.6 1l1.4 3 1.6.8c.4.2.7.6.7 1.1v2.2"
//         stroke="currentColor"
//         strokeWidth="1.6"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//       />
//       <rect
//         x="2.2"
//         y="13.3"
//         width="19.6"
//         height="4"
//         rx="1.6"
//         fill="currentColor"
//         fillOpacity="0.9"
//       />
//       <circle cx="7.2" cy="17.6" r="1.8" fill="currentColor" />
//       <circle cx="16.8" cy="17.6" r="1.8" fill="currentColor" />
//       <path
//         d="M2 12.5h2.4M2 10.2h3.6"
//         stroke="currentColor"
//         strokeWidth="1.4"
//         strokeLinecap="round"
//         opacity="0.7"
//       />
//     </svg>
//   );
// }

// function DriverGlyph() {
//   return (
//     <svg viewBox="0 0 24 24" className="h-[58%] w-[58%]" fill="none">
//       <circle cx="9.3" cy="6.4" r="3" fill="currentColor" />
//       <path
//         d="M4 17.5c0-3 2.4-5.4 5.3-5.4 1.5 0 2.8.6 3.8 1.6"
//         stroke="currentColor"
//         strokeWidth="1.7"
//         strokeLinecap="round"
//       />
//       <circle
//         cx="16.3"
//         cy="16.3"
//         r="4.6"
//         stroke="currentColor"
//         strokeWidth="1.6"
//       />
//       <circle cx="16.3" cy="16.3" r="1.3" fill="currentColor" />
//       <path
//         d="M16.3 11.7v1.7M16.3 19.2v1.7M11.7 16.3h1.7M19.2 16.3h1.7"
//         stroke="currentColor"
//         strokeWidth="1.6"
//         strokeLinecap="round"
//       />
//     </svg>
//   );
// }

// function RoutePattern({ className = "" }: { className?: string }) {
//   return (
//     <svg
//       viewBox="0 0 180 110"
//       className={`pointer-events-none absolute -right-2 -bottom-3 h-[92%] w-[62%] ${className}`}
//       fill="none"
//       aria-hidden
//     >
//       <path
//         d="M-10 20c30 0 20 30 50 30s10-35 45-35 20 45 60 45"
//         stroke="white"
//         strokeOpacity="0.16"
//         strokeWidth="6"
//         strokeLinecap="round"
//         strokeDasharray="1 14"
//       />
//       <path
//         d="M10 95c25-5 30-40 65-40s25 25 55 15"
//         stroke="white"
//         strokeOpacity="0.12"
//         strokeWidth="5"
//         strokeLinecap="round"
//         strokeDasharray="1 12"
//       />
//       {[
//         [148, 14],
//         [96, 40],
//         [60, 72],
//       ].map(([cx, cy], i) => (
//         <g key={i} opacity={0.22}>
//           <path
//             d={`M${cx} ${cy - 9} c-5 0-9 4-9 9 0 6 9 14 9 14s9-8 9-14c0-5-4-9-9-9Z`}
//             fill="white"
//           />
//         </g>
//       ))}
//       <rect
//         x="120"
//         y="60"
//         width="16"
//         height="9"
//         rx="2"
//         fill="white"
//         opacity="0.14"
//       />
//     </svg>
//   );
// }

// function CarPattern({ className = "" }: { className?: string }) {
//   return (
//     <svg
//       viewBox="0 0 180 110"
//       className={`pointer-events-none absolute -right-1 -bottom-4 h-[95%] w-[64%] ${className}`}
//       fill="none"
//       aria-hidden
//     >
//       <path
//         d="M-10 30c30 5 25 35 60 35s20-40 60-40 30 30 60 22"
//         stroke="#2d1a4a"
//         strokeOpacity="0.14"
//         strokeWidth="6"
//         strokeLinecap="round"
//         strokeDasharray="1 13"
//       />
//       {[
//         [40, 78, 0.16, 22],
//         [112, 34, 0.14, 18],
//       ].map(([x, y, op, s], i) => (
//         <g
//           key={i}
//           transform={`translate(${x} ${y}) scale(${(s as number) / 24})`}
//           opacity={op}
//         >
//           <path
//             d="M1 15v-2.2c0-.5.3-.9.7-1.1l1.6-.8 1.4-3c.3-.6.9-1 1.6-1h6.4c.7 0 1.3.4 1.6 1l1.4 3 1.6.8c.4.2.7.6.7 1.1V15"
//             stroke="#2d1a4a"
//             strokeWidth="1.8"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//           />
//           <rect
//             x="0.2"
//             y="12.8"
//             width="19.6"
//             height="4"
//             rx="1.6"
//             fill="#2d1a4a"
//           />
//         </g>
//       ))}
//       {[
//         [150, 10],
//         [70, 20],
//       ].map(([cx, cy], i) => (
//         <path
//           key={i}
//           d={`M${cx} ${cy - 9} c-5 0-9 4-9 9 0 6 9 14 9 14s9-8 9-14c0-5-4-9-9-9Z`}
//           fill="#2d1a4a"
//           opacity="0.16"
//         />
//       ))}
//     </svg>
//   );
// }

// /* ============================= CARD ============================== */

// type CardProps = {
//   title: string;
//   desc: string;
//   glyph: "nav" | "car" | "driver";
//   variant: "purple" | "gold";
//   onClick: () => void;
// };

// function ActionCard({ title, desc, glyph, variant, onClick }: CardProps) {
//   const isGold = variant === "gold";
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className={`relative flex w-full items-center gap-[clamp(6px,1.6dvh,12px)] overflow-hidden rounded-[18px] px-[clamp(8px,2.2dvh,14px)] py-[clamp(8px,2.2dvh,14px)] text-left shadow-sm transition active:scale-[0.98] ${
//         isGold ? "bg-[#F4C542] text-[#2d1a4a]" : "bg-[#6E43A3] text-white"
//       }`}
//     >
//       {isGold ? <CarPattern /> : <RoutePattern />}

//       {/* Icon */}
//       <span
//         className={`relative flex h-[clamp(30px,7dvh,40px)] w-[clamp(30px,7dvh,40px)] shrink-0 items-center justify-center rounded-full ${
//           isGold ? "bg-white/25 text-[#2d1a4a]" : "bg-white/25 text-white"
//         }`}
//       >
//         {glyph === "nav" && <NavigationGlyph />}
//         {glyph === "car" && <CarGlyph />}
//         {glyph === "driver" && <DriverGlyph />}
//       </span>

//       {/* Text */}
//       <span className="relative flex-1 min-w-0">
//         <span className="block text-[clamp(11px,2.6dvh,13px)] font-semibold leading-tight">
//           {title}
//         </span>
//         <span
//           className={`mt-0.5 block text-[clamp(8px,1.8dvh,10px)] leading-snug ${
//             isGold ? "text-[#2d1a4a]/80" : "text-white/85"
//           }`}
//         >
//           {desc}
//         </span>
//       </span>

//       {/* Arrow */}
//       <span className="relative flex h-[clamp(24px,5.6dvh,32px)] w-[clamp(24px,5.6dvh,32px)] shrink-0 items-center justify-center rounded-full bg-white text-[#6E43A3]">
//         <ArrowRight className="h-[55%] w-[55%]" />
//       </span>
//     </button>
//   );
// }

// /* ============================ PAGE ============================== */

// export default function WelcomePage() {
//   const navigate = useNavigate();
//   const bookRide = () => {
//     navigate("/signin");
//   };

//   return (
//     <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-[#6E43A3]">
//       <div
//         className="relative h-[clamp(150px,34dvh,260px)] shrink-0 bg-cover bg-center"
//         style={{ backgroundImage: `url(${HERO_IMAGE})` }}
//       >
//         {/* Purple overlay */}
//         <div className="absolute inset-0 bg-gradient-to-b from-[#6E43A3] via-[#6E43A3]/40 to-transparent" />

//         {/* Logo — clears the status bar via safe-area */}
//         <div className="relative flex items-center justify-center gap-1.5 pt-[calc(env(safe-area-inset-top,0px)+clamp(8px,2.2dvh,16px))]">
//           <img
//             src={logo}
//             alt="SUR-DRIVE"
//             className="h-[clamp(18px,4.5dvh,24px)] w-auto"
//           />
//           <div className="leading-none text-white">
//             <span className="text-[clamp(12px,3dvh,15px)] font-extrabold tracking-tight">
//               SUR-DRIVE
//             </span>
//             <sup className="ml-0.5 text-[clamp(6px,1.3dvh,7px)] font-bold text-[#F4C542]">
//               HT
//             </sup>
//             <p className="mt-0.5 text-[clamp(4.5px,1dvh,5px)] font-bold tracking-widest text-[#F4C542]">
//               YOUR ROAD. YOUR GUIDE.
//             </p>
//           </div>
//         </div>
//       </div>

//       <div className="relative -mt-8 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[36px] bg-white px-5 pb-[max(8px,env(safe-area-inset-bottom))] pt-[clamp(10px,3dvh,24px)]">
//         {/* Heading */}
//         <h1 className="mt-[clamp(1px,0.6dvh,4px)] text-center text-[clamp(14px,3.2dvh,19px)] font-bold leading-tight text-[#6E43A3]">
//           Welcome to SUR-DRIVE <span className="text-[#F4C542]">HT</span>
//         </h1>

//         {/* Description */}
//         <p className="mx-auto mt-[clamp(2px,0.8dvh,6px)] max-w-[230px] text-center text-[clamp(8.5px,1.9dvh,10.5px)] leading-snug text-[#7286A7]">
//           Your journey. your choice. Drive, book or earn all in one app
//         </p>

//         {/* ========================= ACTION CARDS ========================== */}
//         <div className="mt-[clamp(6px,2.2dvh,16px)] flex flex-col gap-[clamp(5px,1.4dvh,10px)]">
//           <ActionCard
//             variant="purple"
//             title="Open Navigation"
//             desc="Get real-time directions and reach your destination with ease."
//             glyph="nav"
//             onClick={() => {
//               // Force the splash screen to replay before landing on /home
//               sessionStorage.removeItem("splashShown");
//               navigate("/home");
//             }}
//           />
//           <ActionCard
//             variant="gold"
//             title="Book a Ride"
//             desc="Request a ride and get matched with a nearby driver."
//             glyph="car"
//             onClick={bookRide}
//           />
//           <ActionCard
//             variant="purple"
//             title="Earn as a Driver"
//             desc="Join our driver community and start earning today."
//             glyph="driver"
//             onClick={() => navigate("/signin")}
//           />
//         </div>

//         {/* ========================= CONTACT SUPPORT ========================== */}
//         <div className="mt-auto pt-[clamp(3px,1.2dvh,12px)] text-center">
//           <p className="text-[clamp(8.5px,1.9dvh,10.5px)] text-[#7286A7]">
//             Need help?{" "}
//             <a
//               href="mailto:surdriveht@gmail.com"
//               className="font-semibold text-[#4a148c] underline"
//             >
//               Contact support →
//             </a>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }
