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
} from "../../../api/passenger/rides";

/* =========================================================
   TYPES
========================================================= */

type BackendVehicle = {
  id?: string;

  make?: string;

  model?: string;

  color?: string;

  plateNumber?: string;

  registrationNumber?: string;
};

type BackendDriver = {
  id?: string;

  fullName?: string;

  firstName?: string;

  lastName?: string;

  phoneNumber?: string;

  profilePicture?: string | null;

  rating?: number;

  currentLat?: number | null;

  currentLng?: number | null;
};

type AssignedRideResponse = {
  id: string;

  driverId:
    string | null;

  status: string;

  estimatedFare:
    number;

  estimatedDurationMin:
    number;

  estimatedDistanceKm:
    number;

  finalFare:
    number | null;

  driver?:
    BackendDriver | null;

  vehicle?:
    BackendVehicle | null;

  pickup?: {
    lat: number;
    lng: number;
    address: string;
  };

  dropoff?: {
    lat: number;
    lng: number;
    address: string;
  };
};

/* =========================================================
   STORAGE
========================================================= */

function getStoredRide():
  AssignedRideResponse | null {
  try {
    const raw =
      sessionStorage.getItem(
        "surdrive_active_ride",
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(
      raw,
    ) as AssignedRideResponse;
  } catch {
    return null;
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function DriverAssigned() {
  const navigate =
    useNavigate();

  const {
    ride,
    setRideStatus,
  } =
    usePassengerRide();

  const [
    shareOpen,
    setShareOpen,
  ] = useState(false);

  const [
    cancelOpen,
    setCancelOpen,
  ] = useState(false);

  const [
    backendRide,
    setBackendRide,
  ] =
    useState<AssignedRideResponse | null>(
      () =>
        getStoredRide(),
    );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const rideId =
    backendRide?.id ??
    sessionStorage.getItem(
      "surdrive_active_ride_id",
    );

  /* =======================================================
     KEEP POLLING
  ======================================================= */

  useEffect(() => {
    if (!rideId) {
      return;
    }

    let mounted = true;

    let running = false;

    const refreshRide =
      async () => {
        if (running) {
          return;
        }

        running = true;

        try {
          setLoading(true);

          const rawResponse =
            await passengerRideApi.getRide(
              rideId,
            );

          if (!mounted) {
            return;
          }

          const response =
            rawResponse as AssignedRideResponse;

          console.log(
            "DRIVER ASSIGNED RIDE:",
            response,
          );

          setBackendRide(
            response,
          );

          sessionStorage.setItem(
            "surdrive_active_ride",
            JSON.stringify(
              response,
            ),
          );

          /* DRIVER NOW EN ROUTE */

          if (
            response.status ===
            "driver_en_route"
          ) {
            setRideStatus(
              "driver-en-route",
            );

            navigate(
              "/passenger/ride/driver-en-route",
              {
                replace: true,
              },
            );

            return;
          }

          /* DRIVER ALREADY ARRIVED */

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

          /* RIDE STARTED */

          if (
  response.status === "ride_started" ||
  response.status === "ride_in_progress"
) {
  navigate(
    "/passenger/ride/in-trip",
    {
      replace: true,
    },
  );

  return;
}

          /* CANCELLED */

          if (
            response.status ===
            "cancelled"
          ) {
            sessionStorage.removeItem(
              "surdrive_active_ride_id",
            );

            sessionStorage.removeItem(
              "surdrive_active_ride",
            );

            setRideStatus(
              "idle",
            );

            toast.error(
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
            "GET ASSIGNED RIDE ERROR:",
            error,
          );
        } finally {
          if (mounted) {
            setLoading(
              false,
            );
          }

          running = false;
        }
      };

    refreshRide();

    const interval =
      window.setInterval(
        refreshRide,
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

  /* =======================================================
     GUARDS
  ======================================================= */

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

  /* =======================================================
     DRIVER / VEHICLE
  ======================================================= */

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
    backendRide
      ?.estimatedDurationMin;

  /* =======================================================
     CANCEL
  ======================================================= */

  const handleCancel =
    (
      reason: string,
      comment?: string,
    ) => {
      console.log(
        "Cancellation requested:",
        {
          rideId,
          reason,
          comment,
        },
      );

      setCancelOpen(
        false,
      );

      toast.info(
        "Cancellation request is not connected to the backend yet.",
      );
    };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
      <PassengerMap
        center={center}
        pickup={
          ride.pickup
        }
        destination={
          ride.destination
        }
        zoom={15}
      />

      <RideMapHeader
        title="Driver Assigned"
        showMore
      />

      <RideBottomSheet>
        {/* HEADER */}

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold text-[#302B34]">
              Driver Assigned
            </h1>

            <p className="mt-1 text-[14px] leading-5 text-[#928C96]">
              Your driver has
              accepted the ride.
            </p>
          </div>

          {typeof eta ===
            "number" && (
            <div className="shrink-0 rounded-[12px] bg-[#F0E8F8] px-3 py-2 text-right text-[#7442AD]">
              <div className="flex items-center gap-1 text-[13px] font-semibold">
                <Clock3
                  size={14}
                />

                {eta} min
              </div>

              <p className="mt-0.5 text-[11px]">
                estimate
              </p>
            </div>
          )}
        </div>

        {/* DRIVER */}

        <div className="mt-5 rounded-[17px] border border-[#EEEAF1] bg-white p-4">
          <div className="flex items-center gap-3">
            {/* AVATAR */}

            <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F0E8F8] text-[#7442AD]">
              {driver?.profilePicture ? (
                <img
                  src={
                    driver.profilePicture
                  }
                  alt={
                    driverName
                  }
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
                {
                  driverName
                }
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
                  <p className="mt-1 text-[12px] text-[#9C96A0]">
                    Driver details
                    are updating...
                  </p>
                )}
            </div>

            {loading && (
              <LoaderCircle
                size={18}
                className="animate-spin text-[#7442AD]"
              />
            )}
          </div>

          {/* VEHICLE */}

          <div className="my-4 h-px bg-[#EEEAF0]" />

          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F6F3F8] text-[#7442AD]">
              <Car
                size={19}
              />
            </span>

            <div className="flex-1 min-w-0">
              <p className="truncate text-[14px] font-semibold text-[#302B34]">
                {
                  vehicleName
                }
              </p>

              {plateNumber && (
                <p className="mt-0.5 text-[12px] font-medium uppercase tracking-[0.08em] text-[#928C96]">
                  {
                    plateNumber
                  }
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SHARE */}

        <motion.button
          type="button"
          whileTap={{
            scale: 0.98,
          }}
          onClick={() =>
            setShareOpen(
              true,
            )
          }
          className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#F0E8F8] text-[15px] font-semibold text-[#7442AD]"
        >
          <Share2
            size={18}
          />

          Share Trip Live
          Status
        </motion.button>

        {/* CANCEL */}

        <button
          type="button"
          onClick={() =>
            setCancelOpen(
              true,
            )
          }
          className="mt-3 h-[48px] w-full text-[15px] font-semibold text-[#E45B5B]"
        >
          Cancel Ride
        </button>
      </RideBottomSheet>

      {/*
        We cannot safely feed DriverCard /
        ShareRideSheet a fabricated driver
        object anymore.

        Once GET /rides/:id shows us the
        actual assigned-driver response,
        we can map it exactly.
      */}

      <CancelRideSheet
        open={
          cancelOpen
        }
        onClose={() =>
          setCancelOpen(
            false,
          )
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

// import PassengerMap from "../../../components/passenger/ride/PassengerMap";
// import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
// import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";
// import DriverCard from "../../../components/passenger/ride/DriverCard";

// import { usePassengerRide } from "../../../context/PassengerRideContext";
// import { mockAssignedDriver } from "../../../data/passengerRide";
// import { useState } from "react";
// import ShareRideSheet from "../../../components/passenger/ride/ShareRideSheet";
// import CancelRideSheet from "../../../components/passenger/ride/CancelRideSheet";

// export default function DriverAssigned() {
//   const navigate = useNavigate();

//   const {
//     ride,
//     setDriver,
//     setRideStatus,
//   } = usePassengerRide();

//   const [
//   shareOpen,
//   setShareOpen,
// ] = useState(false);

// const [
//   cancelOpen,
//   setCancelOpen,
// ] = useState(false);

//   if (!ride.pickup || !ride.destination) {
//     return <Navigate to="/passenger/book-ride" replace />;
//   }

//   const driver = ride.driver ?? mockAssignedDriver;

//   const center =
//     ride.pickup.coordinates ?? {
//       lat: 6.5244,
//       lng: 3.3792,
//     };

//   const continueForDevelopment = () => {
//     setDriver(mockAssignedDriver);
//     setRideStatus("driver-en-route");

//     navigate("/passenger/ride/driver-en-route");
//   };

//   const handleCancel = (
//   reason: string,
//   comment?: string,
// ) => {
//   console.log({
//     reason,
//     comment,
//   });

//   setRideStatus("idle");

//   navigate(
//     "/passenger/home",
//     {
//       replace: true,
//     },
//   );
// };

//   return (
//     <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
//       <PassengerMap
//         center={center}
//         pickup={ride.pickup}
//         destination={ride.destination}
//         zoom={15}
//       />

//       <RideMapHeader
//         title="Driver Assigned"
//         showMore
//       />

//       <RideBottomSheet>
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-[22px] font-semibold text-[#302B34]">
//               Driver Assigned
//             </h1>

//             <p className="mt-1 text-[14px] text-[#928C96]">
//               Your driver is heading to you.
//             </p>
//           </div>

//           <div className="rounded-[12px] bg-[#F0E8F8] px-3 py-2 text-right text-[#7442AD]">
//             <div className="flex items-center gap-1 text-[13px] font-semibold">
//               <Clock3 size={14} />
//               5 min
//             </div>

//             <p className="mt-0.5 text-[11px]">
//               away
//             </p>
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
//   type="button"
//   whileTap={{
//     scale: 0.98,
//   }}
//   onClick={() =>
//     setShareOpen(true)
//   }
//   className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#F0E8F8] text-[15px] font-semibold text-[#7442AD]"
// >
//   <Share2 size={18} />
//   Share Trip Live Status
// </motion.button>

//         {/* TEMPORARY UI DEVELOPMENT BUTTON */}
//         <button
//           type="button"
//           onClick={continueForDevelopment}
//           className="mt-3 h-[52px] w-full rounded-[13px] bg-[#7442AD] text-[15px] font-semibold text-white"
//         >
//           Preview Driver En Route
//         </button>

//         <button
//   type="button"
//   onClick={() =>
//     setCancelOpen(true)
//   }
//   className="mt-3 h-[48px] w-full text-[15px] font-semibold text-[#E45B5B]"
// >
//   Cancel Ride
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
//   eta="5 min"
// />

// <CancelRideSheet
//   open={cancelOpen}
//   onClose={() =>
//     setCancelOpen(false)
//   }
//   onConfirm={
//     handleCancel
//   }
// />
//     </div>
//   );
// }