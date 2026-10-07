import {
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "sonner";

import PassengerMap from "../../../components/passenger/ride/PassengerMap";
import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";

import {
  usePassengerRide,
} from "../../../context/PassengerRideContext";

import {
  passengerRideApi,
  type PassengerRideResponse,
  type PickupDetailsResponse,
} from "../../../api/passenger/rides";

import {
  clearActiveRide,
  getStoredActiveRide,
  getStoredActiveRideId,
  storeActiveRide,
} from "../../../utils/passengerActiveRide";

function extractPickupCode(
  response: PickupDetailsResponse | null,
) {
  if (!response) {
    return null;
  }

  const possibleValues = [
    response.code,
    response.pickupCode,
    response.verificationCode,
    response.pin,
  ];

  const value =
    possibleValues.find(
      (item) =>
        typeof item === "string" ||
        typeof item === "number",
    );

  return value == null
    ? null
    : String(value);
}

export default function DriverArrived() {
  const navigate = useNavigate();

  const {
    ride,
    setRideStatus,
    setVerificationCode,
  } = usePassengerRide();

  const [
    backendRide,
    setBackendRide,
  ] =
    useState<PassengerRideResponse | null>(
      () => getStoredActiveRide(),
    );

  const [
    pickupDetails,
    setPickupDetails,
  ] =
    useState<PickupDetailsResponse | null>(
      null,
    );

  const [
    loadingCode,
    setLoadingCode,
  ] = useState(true);

  const [
    regenerating,
    setRegenerating,
  ] = useState(false);

  const rideId =
    backendRide?.id ??
    getStoredActiveRideId();

  const pickupCode =
    extractPickupCode(
      pickupDetails,
    );

  useEffect(() => {
    if (!rideId) {
      return;
    }

    let mounted = true;
    let running = false;

    const refresh = async () => {
      if (running) {
        return;
      }

      running = true;

      try {
        const response =
          await passengerRideApi.getRide(
            rideId,
          );

        if (!mounted) {
          return;
        }

        setBackendRide(response);
        storeActiveRide(response);

        if (
          response.status ===
            "ride_started" ||
          response.status ===
            "ride_in_progress"
        ) {
          setRideStatus(
            "in-progress",
          );

          navigate(
            "/passenger/ride/trip",
            {
              replace: true,
            },
          );

          return;
        }

        if (
          response.status ===
            "ride_completed" ||
          response.status ===
            "payment_pending" ||
          response.status === "paid" ||
          response.status === "closed"
        ) {
          navigate(
            "/passenger/ride/complete",
            {
              replace: true,
            },
          );

          return;
        }

        if (
          response.status ===
          "cancelled"
        ) {
          clearActiveRide();

          setRideStatus("idle");

          toast.error(
            response.cancellationReason ||
              "This ride has been cancelled.",
          );

          navigate(
            "/passenger/home",
            {
              replace: true,
            },
          );
        }
      } catch (error) {
        console.error(
          "DRIVER ARRIVED POLL ERROR:",
          error,
        );
      } finally {
        running = false;
      }
    };

    refresh();

    const interval =
      window.setInterval(
        refresh,
        4000,
      );

    return () => {
      mounted = false;

      window.clearInterval(
        interval,
      );
    };
  }, [
    rideId,
    navigate,
    setRideStatus,
  ]);

  useEffect(() => {
    if (!rideId) {
      return;
    }

    let mounted = true;

    const loadPickupDetails =
      async () => {
        try {
          setLoadingCode(true);

          const response =
            await passengerRideApi.getPickupDetails(
              rideId,
            );

          if (!mounted) {
            return;
          }

          console.log(
            "PICKUP DETAILS:",
            response,
          );

          setPickupDetails(
            response,
          );
        } catch (error) {
          console.error(
            "PICKUP DETAILS ERROR:",
            error,
          );

          if (mounted) {
            toast.error(
              "Unable to load pickup code.",
            );
          }
        } finally {
          if (mounted) {
            setLoadingCode(false);
          }
        }
      };

    loadPickupDetails();

    return () => {
      mounted = false;
    };
  }, [rideId]);

  useEffect(() => {
    if (
      pickupCode &&
      setVerificationCode
    ) {
      setVerificationCode(
        pickupCode,
      );
    }
  }, [
    pickupCode,
    setVerificationCode,
  ]);

  if (!ride.pickup) {
    return (
      <Navigate
        to="/passenger/book-ride"
        replace
      />
    );
  }

  if (!rideId) {
    return (
      <Navigate
        to="/passenger/book-ride"
        replace
      />
    );
  }

  const center =
    ride.pickup.coordinates;

  if (!center) {
    return (
      <Navigate
        to="/passenger/book-ride"
        replace
      />
    );
  }

  const regenerateCode =
    async () => {
      try {
        setRegenerating(true);

        const response =
          await passengerRideApi.regeneratePickupCode(
            rideId,
          );

        console.log(
          "REGENERATED PICKUP DETAILS:",
          response,
        );

        setPickupDetails(
          response,
        );

        toast.success(
          "Pickup code refreshed.",
        );
      } catch (error) {
        console.error(
          "REGENERATE CODE ERROR:",
          error,
        );

        toast.error(
          "Unable to regenerate pickup code.",
        );
      } finally {
        setRegenerating(false);
      }
    };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
      <PassengerMap
        center={center}
        pickup={ride.pickup}
        zoom={17}
      />

      <RideMapHeader
        title="Driver Arrived"
        showMore
      />

      <motion.div
        initial={{
          opacity: 0,
          y: -20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="absolute left-4 right-4 top-[88px] z-[500] mx-auto flex max-w-[520px] items-center gap-3 rounded-[16px] bg-[#2E9B61] px-4 py-3 text-white shadow-[0_10px_30px_rgba(30,120,70,0.22)]"
      >
        <CheckCircle2
          size={21}
        />

        <div>
          <p className="text-[15px] font-semibold">
            Your driver has arrived
          </p>

          <p className="mt-0.5 text-[13px] text-white/85">
            Meet your driver at
            the pickup point.
          </p>
        </div>
      </motion.div>

      <RideBottomSheet>
        <div className="text-center">
          <h1 className="text-[22px] font-semibold text-[#302B34]">
            Pickup verification
          </h1>

          <p className="mx-auto mt-2 max-w-[360px] text-[14px] leading-6 text-[#918B95]">
            Give this code only to
            the driver shown in the
            Sur-Drive app.
          </p>
        </div>

        <div className="mt-6">
          {loadingCode ? (
            <div className="flex h-[90px] items-center justify-center">
              <LoaderCircle
                size={28}
                className="animate-spin text-[#7442AD]"
              />
            </div>
          ) : pickupCode ? (
            <div className="flex justify-center gap-2.5">
              {pickupCode
                .split("")
                .map(
                  (
                    digit,
                    index,
                  ) => (
                    <motion.div
                      key={`${digit}-${index}`}
                      initial={{
                        opacity: 0,
                        y: 8,
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
                      className="flex h-[58px] min-w-[58px] items-center justify-center rounded-[12px] bg-[#F0E8F7] px-3 text-[25px] font-bold text-[#7442AD]"
                    >
                      {digit}
                    </motion.div>
                  ),
                )}
            </div>
          ) : (
            <div className="rounded-[15px] bg-[#FFF7E7] p-4 text-center">
              <p className="text-[14px] font-medium text-[#765A25]">
                Pickup code is not
                available yet.
              </p>
            </div>
          )}
        </div>

        <motion.button
          type="button"
          disabled={
            regenerating
          }
          whileTap={{
            scale: 0.98,
          }}
          onClick={
            regenerateCode
          }
          className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#F0E8F8] text-[15px] font-semibold text-[#7442AD] disabled:opacity-50"
        >
          {regenerating ? (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
          ) : (
            <RefreshCw
              size={18}
            />
          )}

          Regenerate Code
        </motion.button>

        <div className="mt-4 rounded-[15px] bg-[#F7F5F8] p-4">
          <p className="text-[14px] leading-6 text-[#625C66]">
            Once your driver verifies
            the code and starts the
            trip, this screen will
            update automatically.
          </p>
        </div>
      </RideBottomSheet>
    </div>
  );
}

// import {
//   CheckCircle2,
//   Clock3,
// } from "lucide-react";
// import { motion } from "framer-motion";
// import { Navigate, useNavigate } from "react-router-dom";

// import PassengerMap from "../../../components/passenger/ride/PassengerMap";
// import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
// import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";
// import DriverCard from "../../../components/passenger/ride/DriverCard";

// import { usePassengerRide } from "../../../context/PassengerRideContext";
// import { mockAssignedDriver } from "../../../data/passengerRide";

// export default function DriverArrived() {
//   const navigate = useNavigate();

//   const {
//     ride,
//     setRideStatus,
//   } = usePassengerRide();

//   if (!ride.pickup) {
//     return <Navigate to="/passenger/book-ride" replace />;
//   }

//   const driver =
//     ride.driver ?? mockAssignedDriver;

//   const center =
//     ride.pickup.coordinates ?? {
//       lat: 6.5244,
//       lng: 3.3792,
//     };

//   const verify = () => {
//     setRideStatus("verifying");

//     navigate("/passenger/ride/verify");
//   };

//   return (
//     <div className="relative h-[100dvh] overflow-hidden">
//       <PassengerMap
//         center={center}
//         pickup={ride.pickup}
//         zoom={17}
//       />

//       <RideMapHeader
//         title="Driver Arrived"
//         showMore
//       />

//       <motion.div
//         initial={{ opacity: 0, y: -30 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="absolute left-4 right-4 top-[88px] z-[500] mx-auto flex max-w-[520px] items-center gap-3 rounded-[16px] bg-[#2E9B61] px-4 py-3 text-white shadow-[0_10px_30px_rgba(30,120,70,0.22)]"
//       >
//         <CheckCircle2 size={21} />

//         <div>
//           <p className="text-[15px] font-semibold">
//             Your Driver Has Arrived
//           </p>

//           <p className="mt-0.5 text-[12px] text-white/80">
//             {driver.firstName} is waiting at your pickup location
//           </p>
//         </div>
//       </motion.div>

//       <RideBottomSheet>
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-[22px] font-semibold text-[#302B34]">
//               Your driver has arrived
//             </h1>

//             <p className="mt-1 text-[13px] text-[#918B95]">
//               Meet your driver at the pickup point.
//             </p>
//           </div>

//           <div className="flex items-center gap-1 rounded-[10px] bg-[#FFF5E0] px-3 py-2 text-[#A86B08]">
//             <Clock3 size={15} />
//             <span className="text-[14px] font-semibold">
//               0:45
//             </span>
//           </div>
//         </div>

//         <div className="mt-5">
//           <DriverCard
//   driver={driver}
//   onChat={() =>
//     navigate(
//       "/passenger/ride/chat",
//     )
//   }
//   onCall={() => {
//     console.log(
//       "Open call sheet",
//     );
//   }}
// />
//         </div>

//         <motion.button
//           type="button"
//           whileTap={{ scale: 0.98 }}
//           onClick={verify}
//           className="mt-5 h-[56px] w-full rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white"
//         >
//           Verify Ride
//         </motion.button>
//       </RideBottomSheet>
//     </div>
//   );
// }