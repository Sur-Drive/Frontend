import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router-dom";

import PassengerMap from "../../../components/passenger/ride/PassengerMap";
import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";

import { usePassengerRide } from "../../../context/PassengerRideContext";
import { mockAssignedDriver } from "../../../data/passengerRide";
import CancelRideSheet from "../../../components/passenger/ride/CancelRideSheet";

export default function SearchingDriver() {
  const navigate = useNavigate();

  const {
    ride,
    setDriver,
    setRideStatus,
  } = usePassengerRide();

  const [
  cancelOpen,
  setCancelOpen,
] = useState(false);

  const hasAssignedDriver = useRef(false);

  const center =
    ride.pickup?.coordinates ??
    ride.destination?.coordinates ?? {
      lat: 6.5244,
      lng: 3.3792,
    };

  /* =========================================
     TEMPORARY DRIVER MATCH SIMULATION

     Later replace this with:
     WebSocket / SignalR / API driver accepted event.
  ========================================= */

  useEffect(() => {
    if (!ride.pickup || !ride.destination) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (hasAssignedDriver.current) {
        return;
      }

      hasAssignedDriver.current = true;

      setDriver(mockAssignedDriver);

      setRideStatus("driver-assigned");

      navigate(
        "/passenger/ride/driver-assigned",
        {
          replace: true,
        },
      );
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    ride.pickup,
    ride.destination,
    setDriver,
    setRideStatus,
    navigate,
  ]);

  /* =========================================
     INVALID RIDE
  ========================================= */

  if (
    !ride.pickup ||
    !ride.destination
  ) {
    return (
      <Navigate
        to="/passenger/book-ride"
        replace
      />
    );
  }

  /* =========================================
     CANCEL RIDE
  ========================================= */

 const requestCancel = () => {
  setCancelOpen(true);
};

const confirmCancel = (
  reason: string,
  comment?: string,
) => {
  console.log(
    "Ride cancelled:",
    {
      reason,
      comment,
    },
  );

  setRideStatus("idle");

  navigate(
    "/passenger/home",
    {
      replace: true,
    },
  );
};

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
      {/* =====================================
          MAP
      ===================================== */}

      <PassengerMap
        center={center}
        pickup={ride.pickup}
        destination={ride.destination}
        zoom={15}
        interactive
      />

      {/* =====================================
          FIXED HEADER
      ===================================== */}

      <RideMapHeader
        title="Finding a driver"
        onBack={requestCancel}
      />

      {/* =====================================
          RADAR
      ===================================== */}

      <div className="pointer-events-none absolute left-1/2 top-[35%] z-[300] -translate-x-1/2 -translate-y-1/2">
        {/* Radar waves */}

        {[0, 0.65, 1.3].map(
          (delay) => (
            <motion.div
              key={delay}
              initial={{
                scale: 0.6,
                opacity: 0.5,
              }}
              animate={{
                scale: 4.8,
                opacity: 0,
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay,
                ease: "easeOut",
              }}
              className="absolute left-1/2 top-1/2 h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#7442AD] bg-[#7442AD]/10"
            />
          ),
        )}

        {/* Second radar layer */}

        <motion.div
          animate={{
            scale: [
              1,
              1.18,
              1,
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-1/2 top-1/2 h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7442AD]/10"
        />

        {/* Pickup / passenger dot */}

        <motion.div
          animate={{
            scale: [
              1,
              1.08,
              1,
            ],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
          }}
          className="relative flex h-[62px] w-[62px] items-center justify-center rounded-full border-[5px] border-white bg-[#7442AD] shadow-[0_10px_35px_rgba(116,66,173,0.35)]"
        >
          <div className="h-[13px] w-[13px] rounded-full bg-white" />
        </motion.div>
      </div>

      {/* =====================================
          BOTTOM SHEET
      ===================================== */}

      <RideBottomSheet>
        <div className="text-center">
          {/* Spinner */}

          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 1.25,
              repeat: Infinity,
              ease: "linear",
            }}
            className="mx-auto h-[46px] w-[46px] rounded-full border-[4px] border-[#EEE5F5] border-t-[#7442AD]"
          />

          <h1 className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-[#302B34]">
            Finding Your Driver...
          </h1>

          <p className="mx-auto mt-2 max-w-[350px] text-[14px] leading-6 text-[#938D97]">
            This usually takes less than a
            minute. Connecting you to
            nearby drivers.
          </p>
        </div>

        {/* Searching progress */}

        <div className="mt-6">
          <div className="h-[5px] overflow-hidden rounded-full bg-[#EEE8F2]">
            <motion.div
              initial={{
                x: "-100%",
              }}
              animate={{
                x: "350%",
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="h-full w-[30%] rounded-full bg-[#7442AD]"
            />
          </div>
        </div>

        {/* Ride summary */}

        <div className="mt-6 rounded-[17px] bg-[#F8F6F9] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#8F8994]">
              Estimated fare
            </span>

            <span className="text-[17px] font-semibold text-[#302B34]">
              ₦
              {(
                ride.estimatedFare ?? 0
              ).toLocaleString()}
            </span>
          </div>

          {ride.pickup && (
            <>
              <div className="my-4 h-px bg-[#EDE8EF]" />

              <div className="text-left">
                <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#AAA3AD]">
                  Pickup
                </p>

                <p className="mt-1 truncate text-[14px] font-medium text-[#4E4852]">
                  {ride.pickup.label}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Cancel */}

        <motion.button
  type="button"
  whileTap={{
    scale: 0.98,
  }}
  onClick={requestCancel}
  className="mt-5 h-[54px] w-full rounded-[14px] border border-[#E1D9E7] bg-white text-[16px] font-semibold text-[#7442AD]"
>
  Cancel Ride
</motion.button>

        {/* Development note */}

        <p className="mt-3 text-center text-[12px] text-[#AAA3AD]">
          Searching for available drivers...
        </p>
      </RideBottomSheet>

      <CancelRideSheet
  open={cancelOpen}
  onClose={() =>
    setCancelOpen(false)
  }
  onConfirm={
    confirmCancel
  }
/>
    </div>
  );
}

// import { motion } from "framer-motion";
// import { Navigate, useNavigate } from "react-router-dom";

// import PassengerMap from "../../../components/passenger/ride/PassengerMap";
// import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
// import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";

// import { usePassengerRide } from "../../../context/PassengerRideContext";

// export default function SearchingDriver() {
//   const navigate = useNavigate();
//   const { ride } = usePassengerRide();

//   if (!ride.pickup || !ride.destination) {
//     return <Navigate to="/passenger/book-ride" replace />;
//   }

//   const center =
//     ride.pickup.coordinates ??
//     ride.destination.coordinates ?? {
//       lat: 6.5244,
//       lng: 3.3792,
//     };

//   return (
//     <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
//       <PassengerMap
//         center={center}
//         pickup={ride.pickup}
//         destination={ride.destination}
//         zoom={15}
//       />

//       <RideMapHeader title="Finding a driver" />

//       <div className="pointer-events-none absolute left-1/2 top-[36%] z-[300] -translate-x-1/2 -translate-y-1/2">
//         {[0, 0.7, 1.4].map((delay) => (
//           <motion.div
//             key={delay}
//             initial={{ scale: 0.5, opacity: 0.5 }}
//             animate={{ scale: 4.5, opacity: 0 }}
//             transition={{
//               duration: 2.2,
//               repeat: Infinity,
//               delay,
//               ease: "easeOut",
//             }}
//             className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#7442AD] bg-[#7442AD]/10"
//           />
//         ))}

//         <motion.div
//           animate={{
//             scale: [1, 1.08, 1],
//           }}
//           transition={{
//             duration: 1.4,
//             repeat: Infinity,
//           }}
//           className="relative flex h-16 w-16 items-center justify-center rounded-full border-[5px] border-white bg-[#7442AD] shadow-[0_8px_30px_rgba(116,66,173,0.35)]"
//         >
//           <div className="h-3 w-3 rounded-full bg-white" />
//         </motion.div>
//       </div>

//       <RideBottomSheet>
//         <div className="text-center">
//           <motion.div
//             animate={{
//               rotate: 360,
//             }}
//             transition={{
//               duration: 1.4,
//               repeat: Infinity,
//               ease: "linear",
//             }}
//             className="mx-auto h-12 w-12 rounded-full border-[4px] border-[#EEE5F5] border-t-[#7442AD]"
//           />

//           <h1 className="mt-5 text-[22px] font-semibold text-[#302B34]">
//             Finding Your Driver...
//           </h1>

//           <p className="mx-auto mt-2 max-w-[330px] text-[14px] leading-6 text-[#938D97]">
//             This usually takes less than a minute. Connecting to nearby drivers.
//           </p>
//         </div>

//         <div className="mt-6 rounded-[16px] bg-[#F8F6F9] p-4">
//           <div className="flex justify-between">
//             <span className="text-[14px] text-[#8F8994]">
//               Estimated fare
//             </span>

//             <span className="text-[16px] font-semibold text-[#302B34]">
//               ₦{(ride.estimatedFare ?? 0).toLocaleString()}
//             </span>
//           </div>
//         </div>

//         <button
//           type="button"
//           onClick={() => navigate("/passenger/home")}
//           className="mt-5 h-[54px] w-full rounded-[14px] border border-[#E1D9E7] text-[16px] font-semibold text-[#7442AD]"
//         >
//           Cancel Ride
//         </button>
//       </RideBottomSheet>
//     </div>
//   );
// }