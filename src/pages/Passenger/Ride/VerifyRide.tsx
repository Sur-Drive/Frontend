import {
    AlertTriangle,
  Check,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import RideHeader from "../../../components/passenger/ride/RideHeader";

import {
  usePassengerRide,
} from "../../../context/PassengerRideContext";

import {
  mockAssignedDriver,
} from "../../../data/passengerRide";
import DriverCard from "../../../components/passenger/ride/DriverCard";

type VerificationState =
  | "ready"
  | "verifying"
  | "verified";

export default function VerifyRide() {
  const navigate = useNavigate();

  const {
    ride,
    setVerificationCode,
    setRideStatus,
  } = usePassengerRide();

  const [
    state,
    setState,
  ] =
    useState<VerificationState>(
      "ready",
    );

  const verificationTimer =
    useRef<number | null>(null);

  if (!ride.pickup) {
    return (
      <Navigate
        to="/passenger/home"
        replace
      />
    );
  }

  const driver =
    ride.driver ??
    mockAssignedDriver;

  const pin =
    ride.verificationCode ??
    "4829";

  const verify = () => {
    setVerificationCode(pin);

    setState("verifying");

    verificationTimer.current =
      window.setTimeout(() => {
        setState("verified");
      }, 1800);
  };

  useEffect(() => {
    return () => {
      if (
        verificationTimer.current
      ) {
        window.clearTimeout(
          verificationTimer.current,
        );
      }
    };
  }, []);

  const startTrip = () => {
    setRideStatus(
      "in-progress",
    );

    navigate(
      "/passenger/ride/trip",
    );
  };

 const vehicleText = `${driver.vehicle.color} ${driver.vehicle.make} ${driver.vehicle.model} • ${driver.vehicle.plateNumber}`;

  return (
    <div className="min-h-[100dvh] bg-white text-[#302B34]">
      <RideHeader
        title="Verify Your Ride"
      />

      <main
        className="
          mx-auto
          flex
          min-h-[calc(100dvh-64px)]
          w-full
          max-w-[520px]
          flex-col
          px-5
          pb-[max(20px,env(safe-area-inset-bottom))]
          pt-4
          sm:px-7
        "
      >
        {/* ========================================
            DRIVER
        ======================================== */}

        <section className="text-center">
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 20,
            }}
            className="
              mx-auto
              h-[76px]
              w-[76px]
              overflow-hidden
              rounded-full
              border-[2px]
              border-[#E5B62D]
              bg-[#F2F0F4]
              shadow-[0_5px_18px_rgba(30,20,38,0.10)]
            "
          >
           {driver.photo ? (
            <img
                src={driver.photo}
                alt={driver.firstName}
                className="h-full w-full object-cover"
            />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#EDE7F2] text-[25px] font-bold text-[#7442AD]">
                {driver.firstName
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
          </motion.div>

         
        </section>

        {/* ========================================
            STATE CONTENT
        ======================================== */}

        <div className="mt-5">
          <AnimatePresence
            mode="wait"
            initial={false}
          >
            {/* ====================================
                READY
            ==================================== */}

            {state ===
              "ready" && (
              <motion.section
                key="ready"
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -8,
                }}
                transition={{
                  duration: 0.2,
                }}
                className="text-center"
              >
                 <DriverCard
                driver={driver}
                showActions={false}
              />
                <p
                  className="
                    text-[13px] mt-4
                    font-bold
                    uppercase
                    tracking-[0.02em]
                    text-[#7442AD]
                  "
                >
                  Share this PIN
                  to start trip
                </p>

                <PinBoxes
                  pin={pin}
                  active
                />

                <div className="mt-8 flex gap-3 rounded-[16px] bg-[#FFF6E4] p-4 text-[#7A5A1E]">
                 <AlertTriangle
                   size={21}
                   className="mt-0.5 shrink-0"
                 />

                 <p className="text-[13px] leading-5">
                     Do not board if
                  the vehicle
                  model, plate
                  number, or
                  driver does not
                  match.
                 </p>
               </div>
              </motion.section>
            )}

            {/* ====================================
                VERIFYING
            ==================================== */}

            {state ===
              "verifying" && (
              <motion.section
                key="verifying"
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                className="text-center"
              >
                <VerificationLoader />

                <h2
                  className="
                    mt-5
                    text-[17px]
                    font-semibold
                    text-[#7442AD]
                  "
                >
                  Verifying your
                  code...
                </h2>

                <p
                  className="
                    mt-1.5
                    text-[15px]
                    text-[#625C66]
                  "
                >
                  Waiting for{" "}
                  {
                    driver.firstName
                  }{" "}
                  to enter the PIN.
                </p>

                <p
                  className="
                    mt-7
                    text-[13px]
                    font-semibold
                    uppercase
                    tracking-[0.04em]
                    text-[#AAA3AD]
                  "
                >
                  PIN shared with
                  driver
                </p>

                <PinBoxes
                  pin={pin}
                  active={false}
                />
              </motion.section>
            )}

            {/* ====================================
                VERIFIED
            ==================================== */}

            {state ===
              "verified" && (
              <motion.section
                key="verified"
                initial={{
                  opacity: 0,
                  scale: 0.96,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  duration: 0.25,
                }}
                className="text-center"
              >
                <VerifiedIcon />

                <h2
                  className="
                    mt-5
                    text-[17px]
                    font-semibold
                    text-[#7442AD]
                  "
                >
                  Code Verified!
                </h2>

                <p
                  className="
                    mt-1.5
                    text-[15px]
                    text-[#625C66]
                  "
                >
                  Your ride has
                  been confirmed.
                </p>

                <p
                  className="
                    mt-7
                    text-[13px]
                    font-semibold
                    uppercase
                    tracking-[0.04em]
                    text-[#AAA3AD]
                  "
                >
                  PIN shared with
                  driver
                </p>

                <PinBoxes
                  pin={pin}
                  active={false}
                />
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================
            VERIFICATION INFO
        ======================================== */}
        <div className="mt-4 flex gap-3 rounded-[16px] bg-[#F0F7F2] p-4 text-[#397052]">
                 <ShieldCheck
                   size={21}
                   className="shrink-0"
                 />

                 <p className="text-[13px] leading-5">
                    This verification
            ensures you are
            boarding the correct
            SUR-DRIVE licensed
            vehicle.
                 </p>
               </div>


        {/* ========================================
            BOTTOM ACTION
        ======================================== */}

        <div className="mt-auto pt-7">
          <AnimatePresence
            mode="wait"
          >
            {state ===
              "ready" && (
              <motion.button
                key="verify-button"
                type="button"
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 8,
                }}
                whileTap={{
                  scale: 0.985,
                }}
                onClick={verify}
                className="
                  h-[54px]
                  w-full
                  rounded-[9px]
                  bg-[#7442AD]
                  text-[15px]
                  font-semibold
                  text-white
                  shadow-[0_8px_18px_rgba(116,66,173,0.22)]
                "
              >
                Confirm & Start
                Trip
              </motion.button>
            )}

            {state ===
              "verified" && (
              <motion.button
                key="start-button"
                type="button"
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                }}
                whileTap={{
                  scale: 0.985,
                }}
                onClick={
                  startTrip
                }
                className="
                  h-[54px]
                  w-full
                  rounded-[9px]
                  bg-[#7442AD]
                  text-[16px]
                  font-semibold
                  text-white
                  shadow-[0_8px_18px_rgba(116,66,173,0.22)]
                "
              >
                Start Trip
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

/* ==========================================
   PIN BOXES
========================================== */

function PinBoxes({
  pin,
  active,
}: {
  pin: string;
  active: boolean;
}) {
  return (
    <div className="mt-3 flex justify-center gap-2.5">
      {pin
        .split("")
        .map(
          (
            number,
            index,
          ) => (
            <motion.div
              key={`${number}-${index}`}
              initial={{
                opacity: 0,
                y: 6,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay:
                  index *
                  0.04,
              }}
              className={`
                flex
                h-[48px]
                w-[58px]
                items-center
                justify-center
                rounded-[10px]
                text-[24px]
                font-bold

                ${
                  active
                    ? `
                      bg-[#F0E8F7]
                      text-[#7442AD]
                    `
                    : `
                      bg-[#F6F1F8]
                      text-[#C6AED9]
                    `
                }
              `}
            >
              {number}
            </motion.div>
          ),
        )}
    </div>
  );
}

/* ==========================================
   VERIFYING ANIMATION
========================================== */

function VerificationLoader() {
  return (
    <div
      className="
        relative
        mx-auto
        flex
        h-[78px]
        w-[78px]
        items-center
        justify-center
      "
    >
      <motion.span
        animate={{
          scale: [
            0.9,
            1.2,
            0.9,
          ],
          opacity: [
            0.45,
            0.1,
            0.45,
          ],
        }}
        transition={{
          duration: 1.7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          inset-0
          rounded-full
          bg-[#EEE5F6]
        "
      />

      <motion.span
        animate={{
          scale: [
            0.92,
            1.08,
            0.92,
          ],
        }}
        transition={{
          duration: 1.3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          inset-[10px]
          rounded-full
          bg-[#DFD0ED]
        "
      />

      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          ease: "linear",
        }}
        className="
          relative
          flex
          h-[44px]
          w-[44px]
          items-center
          justify-center
          rounded-full
          bg-[#7442AD]
          text-white
          shadow-[0_5px_16px_rgba(116,66,173,0.28)]
        "
      >
        <LockKeyhole
          size={18}
          strokeWidth={2.2}
        />
      </motion.div>
    </div>
  );
}

/* ==========================================
   VERIFIED ANIMATION
========================================== */

function VerifiedIcon() {
  return (
    <div
      className="
        relative
        mx-auto
        flex
        h-[78px]
        w-[78px]
        items-center
        justify-center
      "
    >
      <motion.div
        initial={{
          scale: 0.4,
          opacity: 0,
        }}
        animate={{
          scale: 1,
          opacity: 1,
        }}
        transition={{
          type: "spring",
          stiffness: 230,
          damping: 16,
        }}
        className="
          absolute
          inset-0
          rounded-full
          bg-[#EEE5F6]
        "
      />

      <motion.div
        initial={{
          scale: 0.5,
        }}
        animate={{
          scale: 1,
        }}
        transition={{
          delay: 0.06,
          type: "spring",
          stiffness: 250,
          damping: 17,
        }}
        className="
          absolute
          inset-[10px]
          rounded-full
          bg-[#DFD0ED]
        "
      />

      <motion.div
        initial={{
          scale: 0,
          rotate: -30,
        }}
        animate={{
          scale: 1,
          rotate: 0,
        }}
        transition={{
          delay: 0.12,
          type: "spring",
          stiffness: 300,
          damping: 16,
        }}
        className="
          relative
          flex
          h-[44px]
          w-[44px]
          items-center
          justify-center
          rounded-full
          bg-[#7442AD]
          text-white
        "
      >
        <Check
          size={21}
          strokeWidth={3}
        />
      </motion.div>
    </div>
  );
}

// import {
//   AlertTriangle,
//   Check,
//   ShieldCheck,
// } from "lucide-react";
// import {
//   AnimatePresence,
//   motion,
// } from "framer-motion";
// import { Navigate, useNavigate } from "react-router-dom";
// import { useState } from "react";

// import RideHeader from "../../../components/passenger/ride/RideHeader";
// import DriverCard from "../../../components/passenger/ride/DriverCard";

// import { usePassengerRide } from "../../../context/PassengerRideContext";
// import { mockAssignedDriver } from "../../../data/passengerRide";

// type VerificationState =
//   | "ready"
//   | "verifying"
//   | "verified";

// export default function VerifyRide() {
//   const navigate = useNavigate();

//   const {
//     ride,
//     setVerificationCode,
//     setRideStatus,
//   } = usePassengerRide();

//   const [state, setState] =
//     useState<VerificationState>("ready");

//   if (!ride.pickup) {
//     return <Navigate to="/passenger/home" replace />;
//   }

//   const driver =
//     ride.driver ?? mockAssignedDriver;

//   const pin =
//     ride.verificationCode ?? "4829";

//   const verify = () => {
//     setVerificationCode(pin);
//     setState("verifying");

//     // UI preview only.
//     window.setTimeout(() => {
//       setState("verified");
//     }, 1800);
//   };

//   const startTrip = () => {
//     setRideStatus("in-progress");

//     navigate("/passenger/ride/trip");
//   };

//   return (
//     <div className="min-h-[100dvh] bg-white">
//       <RideHeader title="Verify Your Ride" />

//       <main className="mx-auto w-full max-w-[680px] px-5 pb-12 pt-6 sm:px-7">
//         <AnimatePresence mode="wait">
//           {state === "ready" && (
//             <motion.div
//               key="ready"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -15 }}
//             >
//               <DriverCard
//                 driver={driver}
//                 showActions={false}
//               />

//               <div className="mt-8 text-center">
//                 <p className="text-[14px] text-[#918B95]">
//                   Your verification PIN
//                 </p>

//                 <div className="mt-4 flex justify-center gap-3">
//                   {pin.split("").map((number, index) => (
//                     <motion.div
//                       key={`${number}-${index}`}
//                       initial={{
//                         opacity: 0,
//                         y: 12,
//                       }}
//                       animate={{
//                         opacity: 1,
//                         y: 0,
//                       }}
//                       transition={{
//                         delay: index * 0.08,
//                       }}
//                       className="flex h-[62px] w-[56px] items-center justify-center rounded-[14px] bg-[#F1EAF7] text-[26px] font-bold text-[#7442AD]"
//                     >
//                       {number}
//                     </motion.div>
//                   ))}
//                 </div>

//                 <p className="mx-auto mt-4 max-w-[360px] text-[14px] leading-6 text-[#918B95]">
//                   Give this PIN to your driver before the trip begins.
//                 </p>
//               </div>

//               <div className="mt-8 flex gap-3 rounded-[16px] bg-[#FFF6E4] p-4 text-[#7A5A1E]">
//                 <AlertTriangle
//                   size={21}
//                   className="mt-0.5 shrink-0"
//                 />

//                 <p className="text-[13px] leading-5">
//                   Do not enter the vehicle if the driver, vehicle model or plate number does not match the information shown here.
//                 </p>
//               </div>

//               <div className="mt-4 flex gap-3 rounded-[16px] bg-[#F0F7F2] p-4 text-[#397052]">
//                 <ShieldCheck
//                   size={21}
//                   className="shrink-0"
//                 />

//                 <p className="text-[13px] leading-5">
//                   Ride verification helps ensure you enter the correct vehicle.
//                 </p>
//               </div>

//               <motion.button
//                 type="button"
//                 whileTap={{ scale: 0.98 }}
//                 onClick={verify}
//                 className="mt-8 h-[56px] w-full rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white"
//               >
//                 Confirm & Start Trip
//               </motion.button>
//             </motion.div>
//           )}

//           {state === "verifying" && (
//             <motion.div
//               key="verifying"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="flex min-h-[65dvh] flex-col items-center justify-center text-center"
//             >
//               <div className="relative flex h-[130px] w-[130px] items-center justify-center">
//                 {[1, 2, 3].map((item) => (
//                   <motion.div
//                     key={item}
//                     animate={{
//                       scale: [0.7, 1.5],
//                       opacity: [0.35, 0],
//                     }}
//                     transition={{
//                       duration: 1.8,
//                       repeat: Infinity,
//                       delay: item * 0.35,
//                     }}
//                     className="absolute h-20 w-20 rounded-full border border-[#7442AD]"
//                   />
//                 ))}

//                 <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#7442AD] text-[24px] font-bold text-white">
//                   {pin}
//                 </div>
//               </div>

//               <h2 className="mt-7 text-[22px] font-semibold">
//                 Verifying your code...
//               </h2>

//               <p className="mt-2 text-[14px] text-[#918B95]">
//                 Waiting for {driver.firstName} to enter the PIN.
//               </p>
//             </motion.div>
//           )}

//           {state === "verified" && (
//             <motion.div
//               key="verified"
//               initial={{ opacity: 0, scale: 0.92 }}
//               animate={{ opacity: 1, scale: 1 }}
//               className="flex min-h-[65dvh] flex-col items-center justify-center text-center"
//             >
//               <motion.div
//                 initial={{ scale: 0 }}
//                 animate={{ scale: 1 }}
//                 transition={{
//                   type: "spring",
//                   stiffness: 240,
//                   damping: 15,
//                 }}
//                 className="flex h-24 w-24 items-center justify-center rounded-full bg-[#7442AD] text-white shadow-[0_15px_45px_rgba(116,66,173,0.28)]"
//               >
//                 <Check size={45} strokeWidth={3} />
//               </motion.div>

//               <h2 className="mt-7 text-[24px] font-semibold">
//                 Code Verified!
//               </h2>

//               <p className="mt-2 text-[15px] text-[#918B95]">
//                 Your ride has been confirmed.
//               </p>

//               <motion.button
//                 type="button"
//                 whileTap={{ scale: 0.98 }}
//                 onClick={startTrip}
//                 className="mt-9 h-[56px] w-full max-w-[420px] rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white"
//               >
//                 Start Trip
//               </motion.button>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </main>
//     </div>
//   );
// }