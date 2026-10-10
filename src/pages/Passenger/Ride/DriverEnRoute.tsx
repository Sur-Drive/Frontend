import {
  Car,
  Clock3,
  LoaderCircle,
  Share2,
  UserRound,
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
import ShareRideSheet from "../../../components/passenger/ride/ShareRideSheet";
import CancelRideSheet from "../../../components/passenger/ride/CancelRideSheet";

import {
  usePassengerRide,
} from "../../../context/PassengerRideContext";

import {
  passengerRideApi,
  type PassengerRideResponse,
} from "../../../api/passenger/rides";

import {
  getStoredActiveRide,
  getStoredActiveRideId,
  storeActiveRide,
  clearActiveRide,
} from "../../../utils/passengerActiveRide";

export default function DriverEnRoute() {
  const navigate = useNavigate();

  const {
    ride,
    setRideStatus,
  } = usePassengerRide();

  const [
    backendRide,
    setBackendRide,
  ] =
    useState<PassengerRideResponse | null>(
      () => getStoredActiveRide(),
    );

  const [
    shareOpen,
    setShareOpen,
  ] = useState(false);

  const [
    cancelOpen,
    setCancelOpen,
  ] = useState(false);

  const [
    cancelling,
    setCancelling,
  ] = useState(false);

  const [
    pollError,
    setPollError,
  ] = useState(false);

  const rideId =
    backendRide?.id ??
    getStoredActiveRideId();

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

        setPollError(false);
        setBackendRide(response);
        storeActiveRide(response);

        if (
          response.status ===
          "driver_arrived"
        ) {
          setRideStatus(
            "driver-arrived",
          );

          navigate(
            "/passenger/ride/driver-arrived",
            {
              replace: true,
            },
          );

          return;
        }

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
          "DRIVER EN ROUTE POLL ERROR:",
          error,
        );

        if (mounted) {
          setPollError(true);
        }
      } finally {
        running = false;
      }
    };

    refresh();

    const interval =
      window.setInterval(
        refresh,
        5000,
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

  if (!rideId) {
    return (
      <Navigate
        to="/passenger/book-ride"
        replace
      />
    );
  }

  const center =
    ride.pickup.coordinates ??
    ride.destination.coordinates;

  if (!center) {
    return (
      <Navigate
        to="/passenger/book-ride"
        replace
      />
    );
  }

  const driver =
    backendRide?.driver;

  const vehicle =
    backendRide?.vehicle;

  const driverName =
    driver?.fullName ||
    [
      driver?.firstName,
      driver?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Your Sur-Drive driver";

  const vehicleName =
    [
      vehicle?.color,
      vehicle?.make,
      vehicle?.model,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Vehicle details updating";

  const plateNumber =
    vehicle?.plateNumber ||
    vehicle?.registrationNumber;

  const eta =
    backendRide?.estimatedDurationMin;

  const handleCancel = async (
    reason: string,
    comment?: string,
  ) => {
    if (cancelling) {
      return;
    }

    try {
      setCancelling(true);

      const finalReason =
        comment?.trim()
          ? `${reason}: ${comment.trim()}`
          : reason;

      await passengerRideApi.cancelRide(
        rideId,
        finalReason,
      );

      clearActiveRide();

      setRideStatus("idle");

      toast.success(
        "Ride cancelled.",
      );

      navigate(
        "/passenger/home",
        {
          replace: true,
        },
      );
    } catch (error) {
      console.error(
        "CANCEL RIDE ERROR:",
        error,
      );

      toast.error(
        "Unable to cancel ride.",
      );
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
      <PassengerMap
        center={center}
        pickup={ride.pickup}
        destination={
          ride.destination
        }
        zoom={16}
        interactive
        showTraffic
      />

      <RideMapHeader
        title="Driver En Route"
        subtitle={
          pollError
            ? "Reconnecting..."
            : "Live trip status"
        }
        showMore
      />

      <RideBottomSheet>
        <div className="rounded-[18px] bg-[#F3ECF9] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[17px] font-semibold text-[#302B34]">
                Your driver is on the way
              </p>

              <p className="mt-1 text-[14px] leading-5 text-[#8F8994]">
                Please be ready at
                your pickup point.
              </p>
            </div>

            {typeof eta ===
              "number" && (
              <div className="shrink-0 rounded-[12px] bg-white px-3 py-2 text-[#7442AD] shadow-sm">
                <div className="flex items-center gap-1">
                  <Clock3
                    size={16}
                  />

                  <span className="text-[16px] font-semibold">
                    {eta} min
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 h-[5px] overflow-hidden rounded-full bg-white">
            <motion.div
              animate={{
                x: [
                  "-100%",
                  "350%",
                ],
              }}
              transition={{
                duration: 1.7,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="h-full w-[30%] rounded-full bg-[#7442AD]"
            />
          </div>
        </div>

        <div className="mt-4 rounded-[17px] border border-[#EEEAF1] bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F0E8F8] text-[#7442AD]">
              {driver?.profilePicture ? (
                <img
                  src={
                    driver.profilePicture
                  }
                  alt={driverName}
                  className="object-cover w-full h-full"
                />
              ) : (
                <UserRound
                  size={25}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="truncate text-[17px] font-semibold text-[#302B34]">
                {driverName}
              </p>

              {typeof driver?.rating ===
                "number" && (
                <p className="mt-1 text-[13px] text-[#928C96]">
                  ★{" "}
                  {driver.rating.toFixed(
                    1,
                  )}
                </p>
              )}

              {!driver &&
                backendRide?.driverId && (
                  <p className="mt-1 text-[12px] text-[#928C96]">
                    Driver details
                    updating...
                  </p>
                )}
            </div>
          </div>

          <div className="my-4 h-px bg-[#EEEAF0]" />

          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F6F3F8] text-[#7442AD]">
              <Car size={19} />
            </span>

            <div className="flex-1 min-w-0">
              <p className="truncate text-[14px] font-semibold text-[#302B34]">
                {vehicleName}
              </p>

              {plateNumber && (
                <p className="mt-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#928C96]">
                  {plateNumber}
                </p>
              )}
            </div>
          </div>
        </div>

        <motion.button
          type="button"
          whileTap={{
            scale: 0.98,
          }}
          onClick={() =>
            setShareOpen(true)
          }
          className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#F0E8F8] text-[15px] font-semibold text-[#7442AD]"
        >
          <Share2 size={18} />

          Share Trip Live Status
        </motion.button>

        <button
          type="button"
          disabled={cancelling}
          onClick={() =>
            setCancelOpen(true)
          }
          className="mt-3 flex h-[48px] w-full items-center justify-center gap-2 text-[15px] font-semibold text-[#E45B5B] disabled:opacity-50"
        >
          {cancelling && (
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
          )}

          Cancel Ride
        </button>
      </RideBottomSheet>

      {/*
        ShareRideSheet currently expects
        your old frontend Driver type.

        Don't recreate mockAssignedDriver.
        Once we map BackendDriver to the
        component type, enable this sheet.
      */}

      <CancelRideSheet
        open={cancelOpen}
        onClose={() =>
          setCancelOpen(false)
        }
        onConfirm={
          handleCancel
        }
      />
    </div>
  );
}

// import {
//   Clock3,
//   Share2,
// } from "lucide-react";
// import { motion } from "framer-motion";
// import { Navigate, useNavigate } from "react-router-dom";
// import { useState } from "react";

// import ShareRideSheet from "../../../components/passenger/ride/ShareRideSheet";
// import CancelRideSheet from "../../../components/passenger/ride/CancelRideSheet";

// import PassengerMap from "../../../components/passenger/ride/PassengerMap";
// import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
// import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";
// import DriverCard from "../../../components/passenger/ride/DriverCard";

// import { usePassengerRide } from "../../../context/PassengerRideContext";
// import { mockAssignedDriver } from "../../../data/passengerRide";

// export default function DriverEnRoute() {
//   const navigate = useNavigate();

//   const {
//     ride,
//     setRideStatus,
//     setDriver,
//   } = usePassengerRide();

//   const [
//   shareOpen,
//   setShareOpen,
// ] = useState(false);

// const [
//   cancelOpen,
//   setCancelOpen,
// ] = useState(false);

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

//   const previewArriving = () => {
//   setDriver(driver);
//   setRideStatus("driver-arriving");

//   navigate("/passenger/ride/driver-arriving");
// };

//   return (
//     <div className="relative h-[100dvh] overflow-hidden">
//       <PassengerMap
//         center={center}
//         pickup={ride.pickup}
//         destination={ride.destination}
//         zoom={16}
//         showTraffic
//       />

//       <RideMapHeader
//         title="Driver En Route"
//         showMore
//       />

//       <RideBottomSheet>
//         <div className="rounded-[16px] bg-[#F3ECF9] p-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-[17px] font-semibold text-[#302B34]">
//                 Your driver is on the way
//               </p>

//               <p className="mt-1 text-[13px] text-[#8F8994]">
//                 Please be ready at your pickup point.
//               </p>
//             </div>

//             <div className="flex items-center gap-1 text-[#7442AD]">
//               <Clock3 size={17} />

//               <span className="text-[16px] font-semibold">
//                 3 min
//               </span>
//             </div>
//           </div>

//           <div className="mt-4 h-[5px] overflow-hidden rounded-full bg-white">
//             <motion.div
//               initial={{ width: "15%" }}
//               animate={{ width: "68%" }}
//               transition={{
//                 duration: 1.2,
//                 ease: "easeOut",
//               }}
//               className="h-full rounded-full bg-[#7442AD]"
//             />
//           </div>
//         </div>

//         <div className="mt-4">
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

//         <button
//   type="button"
//   onClick={() =>
//     setShareOpen(true)
//   }
//   className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#F0E8F8] text-[15px] font-semibold text-[#7442AD]"
// >
//   <Share2 size={18} />
//   Share Trip Live Status
// </button>

// <button
//   type="button"
//   onClick={() =>
//     setCancelOpen(true)
//   }
//   className="mt-3 h-[48px] w-full text-[15px] font-semibold text-[#E45B5B]"
// >
//   Cancel Ride
// </button>

//         {/* TEMPORARY UNTIL DRIVER STATUS COMES FROM BACKEND */}
//         <button
//   type="button"
//   onClick={previewArriving}
//   className="mt-3 h-[52px] w-full rounded-[13px] bg-[#7442AD] text-[15px] font-semibold text-white"
// >
//   Preview Driver Arriving
// </button>
//       </RideBottomSheet>

//       <ShareRideSheet
//   open={shareOpen}
//   onClose={() =>
//     setShareOpen(false)
//   }
//   driver={driver}
//   pickup={ride.pickup}
//   destination={
//     ride.destination
//   }
//   eta="3 min"
// />

// <CancelRideSheet
//   open={cancelOpen}
//   onClose={() =>
//     setCancelOpen(false)
//   }
//   onConfirm={(
//     reason,
//     comment,
//   ) => {
//     console.log({
//       reason,
//       comment,
//     });

//     setRideStatus("idle");

//     navigate(
//       "/passenger/home",
//       {
//         replace: true,
//       },
//     );
//   }}
// />
//     </div>
//   );
// }