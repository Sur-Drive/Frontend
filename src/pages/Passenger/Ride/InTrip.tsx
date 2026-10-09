import {
  Clock3,
  MapPin,
  Route,
  Share2,
  ShieldCheck,
  Wifi,
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

import {
  usePassengerRide,
} from "../../../context/PassengerRideContext";

import {
  passengerRideApi,
  type PassengerRideResponse,
} from "../../../api/passenger/rides";

import {
  clearActiveRide,
  getStoredActiveRide,
  getStoredActiveRideId,
  storeActiveRide,
} from "../../../utils/passengerActiveRide";

export default function InTrip() {
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
    pollError,
    setPollError,
  ] = useState(false);

  const [
    shareOpen,
    setShareOpen,
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

        setBackendRide(
          response,
        );

        storeActiveRide(
          response,
        );

        /*
         * Ride has finished.
         */
        if (
          response.status ===
            "ride_completed" ||
          response.status ===
            "payment_pending" ||
          response.status ===
            "paid" ||
          response.status ===
            "closed"
        ) {
          navigate(
            "/passenger/ride/complete",
            {
              replace: true,
            },
          );

          return;
        }

        /*
         * Ride was cancelled.
         */
        if (
          response.status ===
          "cancelled"
        ) {
          clearActiveRide();

          setRideStatus(
            "idle",
          );

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

          return;
        }

        /*
         * If someone manually enters this
         * screen before the ride has started,
         * send them back to the correct
         * backend-driven screen.
         */

        if (
          response.status ===
          "searching"
        ) {
          navigate(
            "/passenger/ride/searching",
            {
              replace: true,
            },
          );

          return;
        }

        if (
          response.status ===
          "driver_assigned"
        ) {
          navigate(
            "/passenger/ride/driver-assigned",
            {
              replace: true,
            },
          );

          return;
        }

        if (
          response.status ===
          "driver_en_route"
        ) {
          navigate(
            "/passenger/ride/driver-en-route",
            {
              replace: true,
            },
          );

          return;
        }

        if (
          response.status ===
          "driver_arrived"
        ) {
          navigate(
            "/passenger/ride/driver-arrived",
            {
              replace: true,
            },
          );

          return;
        }
      } catch (error) {
        console.error(
          "IN TRIP POLL ERROR:",
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
        to="/passenger/home"
        replace
      />
    );
  }

  if (!rideId) {
    return (
      <Navigate
        to="/passenger/home"
        replace
      />
    );
  }

  const center =
    ride.destination
      .coordinates ??
    ride.pickup.coordinates;

  if (!center) {
    return (
      <Navigate
        to="/passenger/home"
        replace
      />
    );
  }

  const duration =
    backendRide
      ?.actualDurationMin ??
    backendRide
      ?.estimatedDurationMin;

  const distance =
    backendRide
      ?.actualDistanceKm ??
    backendRide
      ?.estimatedDistanceKm;

  const fare =
    backendRide?.finalFare ??
    backendRide?.estimatedFare;

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
      <PassengerMap
        center={center}
        pickup={ride.pickup}
        destination={
          ride.destination
        }
        zoom={15}
        interactive
        followMode
        showTraffic
        puckMode="driving"
      />

      <RideMapHeader
        title="Trip in Progress"
        subtitle={
          pollError
            ? "Reconnecting..."
            : "Live trip status"
        }
        showMore
      />

      <RideBottomSheet>
        {/* LIVE STATUS */}

        <div className="flex items-center gap-2">
          <motion.span
            animate={{
              scale: [
                1,
                1.25,
                1,
              ],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
            }}
            className="h-2.5 w-2.5 rounded-full bg-[#2E9B61]"
          />

          <p className="text-[16px] font-semibold text-[#302B34]">
            You're on your way
          </p>
        </div>

        {/* DESTINATION */}

        <div className="mt-5 rounded-[17px] bg-[#F7F5F8] p-4">
          <div className="flex items-start gap-3">
            <MapPin
              size={19}
              className="mt-0.5 shrink-0 text-[#7442AD]"
            />

            <div className="min-w-0">
              <p className="text-[12px] uppercase tracking-[0.07em] text-[#A19AA5]">
                Destination
              </p>

              <p className="mt-1 text-[15px] font-semibold leading-5 text-[#302B34]">
                {
                  ride.destination
                    .label
                }
              </p>

              {ride.destination
                .address && (
                <p className="mt-1 text-[13px] leading-5 text-[#918B95]">
                  {
                    ride
                      .destination
                      .address
                  }
                </p>
              )}
            </div>
          </div>
        </div>

        {/* TRIP INFORMATION */}

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-[15px] border border-[#EEEAF1] bg-white p-4">
            <Clock3
              size={18}
              className="text-[#7442AD]"
            />

            <p className="mt-3 text-[13px] text-[#918B95]">
              Duration
            </p>

            <p className="mt-1 text-[16px] font-semibold text-[#302B34]">
              {typeof duration ===
              "number"
                ? `${duration} min`
                : "—"}
            </p>
          </div>

          <div className="rounded-[15px] border border-[#EEEAF1] bg-white p-4">
            <Route
              size={18}
              className="text-[#7442AD]"
            />

            <p className="mt-3 text-[13px] text-[#918B95]">
              Distance
            </p>

            <p className="mt-1 text-[16px] font-semibold text-[#302B34]">
              {typeof distance ===
              "number"
                ? `${distance.toFixed(
                    1,
                  )} km`
                : "—"}
            </p>
          </div>
        </div>

        {/* FARE */}

        {typeof fare ===
          "number" && (
          <div className="mt-4 flex items-center justify-between rounded-[15px] bg-[#F3ECF9] p-4">
            <span className="text-[14px] text-[#756E79]">
              {backendRide
                ?.finalFare !=
              null
                ? "Fare"
                : "Estimated fare"}
            </span>

            <span className="text-[19px] font-bold text-[#302B34]">
              ₦
              {fare.toLocaleString(
                "en-NG",
                {
                  maximumFractionDigits: 2,
                },
              )}
            </span>
          </div>
        )}

        {/* SAFETY ACTIONS */}

        <div className="grid grid-cols-2 gap-3 mt-4">
          <motion.button
            type="button"
            whileTap={{
              scale: 0.97,
            }}
            onClick={() =>
              navigate(
                "/passenger/ride/safety",
              )
            }
            className="flex h-[52px] items-center justify-center gap-2 rounded-[13px] bg-[#F3ECF9] text-[15px] font-semibold text-[#7442AD]"
          >
            <ShieldCheck
              size={19}
            />

            Safety
          </motion.button>

          <motion.button
            type="button"
            whileTap={{
              scale: 0.97,
            }}
            onClick={() =>
              setShareOpen(
                true,
              )
            }
            className="flex h-[52px] items-center justify-center gap-2 rounded-[13px] bg-[#F3ECF9] text-[15px] font-semibold text-[#7442AD]"
          >
            <Share2
              size={19}
            />

            Share Trip
          </motion.button>
        </div>

        {/* CONNECTION STATUS */}

        <div className="flex items-center justify-center gap-2 mt-4">
          <Wifi
            size={14}
            className={
              pollError
                ? "text-[#D05B5B]"
                : "text-[#5B9B72]"
            }
          />

          <span className="text-[12px] text-[#9A939E]">
            {pollError
              ? "Reconnecting to trip..."
              : "Live trip updates"}
          </span>
        </div>
      </RideBottomSheet>

      <ShareRideSheet
        open={shareOpen}
        onClose={() =>
          setShareOpen(
            false,
          )
        }
        driver={ride.driver}
        pickup={ride.pickup}
        destination={
          ride.destination
        }
        eta={
          typeof duration ===
          "number"
            ? `${duration} min`
            : undefined
        }
      />
    </div>
  );
}

// import {
//   Clock3,
//   MapPin,
//   Route,
//   Wifi,
// } from "lucide-react";

// import {
//   motion,
// } from "framer-motion";

// import {
//   useEffect,
//   useState,
// } from "react";

// import {
//   Navigate,
//   useNavigate,
// } from "react-router-dom";

// import {
//   toast,
// } from "sonner";

// import PassengerMap from "../../../components/passenger/ride/PassengerMap";
// import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
// import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";

// import {
//   usePassengerRide,
// } from "../../../context/PassengerRideContext";

// import {
//   passengerRideApi,
//   type PassengerRideResponse,
// } from "../../../api/passenger/rides";

// import {
//   clearActiveRide,
//   getStoredActiveRide,
//   getStoredActiveRideId,
//   storeActiveRide,
// } from "../../../utils/passengerActiveRide";

// export default function InTrip() {
//   const navigate = useNavigate();

//   const {
//     ride,
//     setRideStatus,
//   } = usePassengerRide();

//   const [
//     backendRide,
//     setBackendRide,
//   ] =
//     useState<PassengerRideResponse | null>(
//       () => getStoredActiveRide(),
//     );

//   const [
//     pollError,
//     setPollError,
//   ] = useState(false);

//   const rideId =
//     backendRide?.id ??
//     getStoredActiveRideId();

//   useEffect(() => {
//     if (!rideId) {
//       return;
//     }

//     let mounted = true;
//     let running = false;

//     const refresh = async () => {
//       if (running) {
//         return;
//       }

//       running = true;

//       try {
//         const response =
//           await passengerRideApi.getRide(
//             rideId,
//           );

//         if (!mounted) {
//           return;
//         }

//         setPollError(false);
//         setBackendRide(response);
//         storeActiveRide(response);

//         if (
//           response.status ===
//             "ride_completed" ||
//           response.status ===
//             "payment_pending" ||
//           response.status === "paid" ||
//           response.status === "closed"
//         ) {
//           navigate(
//             "/passenger/ride/complete",
//             {
//               replace: true,
//             },
//           );

//           return;
//         }

//         if (
//           response.status ===
//           "cancelled"
//         ) {
//           clearActiveRide();

//           setRideStatus("idle");

//           toast.error(
//             response.cancellationReason ||
//               "This ride has been cancelled.",
//           );

//           navigate(
//             "/passenger/home",
//             {
//               replace: true,
//             },
//           );
//         }
//       } catch (error) {
//         console.error(
//           "IN TRIP POLL ERROR:",
//           error,
//         );

//         if (mounted) {
//           setPollError(true);
//         }
//       } finally {
//         running = false;
//       }
//     };

//     refresh();

//     const interval =
//       window.setInterval(
//         refresh,
//         5000,
//       );

//     return () => {
//       mounted = false;

//       window.clearInterval(
//         interval,
//       );
//     };
//   }, [
//     rideId,
//     navigate,
//     setRideStatus,
//   ]);

//   if (
//     !ride.pickup ||
//     !ride.destination
//   ) {
//     return (
//       <Navigate
//         to="/passenger/home"
//         replace
//       />
//     );
//   }

//   if (!rideId) {
//     return (
//       <Navigate
//         to="/passenger/home"
//         replace
//       />
//     );
//   }

//   const center =
//     ride.destination.coordinates ??
//     ride.pickup.coordinates;

//   if (!center) {
//     return (
//       <Navigate
//         to="/passenger/home"
//         replace
//       />
//     );
//   }

//   const duration =
//     backendRide?.actualDurationMin ??
//     backendRide?.estimatedDurationMin;

//   const distance =
//     backendRide?.actualDistanceKm ??
//     backendRide?.estimatedDistanceKm;

//   const fare =
//     backendRide?.finalFare ??
//     backendRide?.estimatedFare;

//   return (
//     <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
//       <PassengerMap
//         center={center}
//         pickup={ride.pickup}
//         destination={
//           ride.destination
//         }
//         zoom={15}
//         interactive
//         followMode
//         showTraffic
//         puckMode="driving"
//       />

//       <RideMapHeader
//         title="Trip in Progress"
//         subtitle={
//           pollError
//             ? "Reconnecting..."
//             : "Live trip status"
//         }
//         showMore
//       />

//       <RideBottomSheet>
//         <div className="flex items-center gap-2">
//           <motion.span
//             animate={{
//               scale: [
//                 1,
//                 1.25,
//                 1,
//               ],
//             }}
//             transition={{
//               duration: 1.4,
//               repeat: Infinity,
//             }}
//             className="h-2.5 w-2.5 rounded-full bg-[#2E9B61]"
//           />

//           <p className="text-[16px] font-semibold text-[#302B34]">
//             You're on your way
//           </p>
//         </div>

//         <div className="mt-5 rounded-[17px] bg-[#F7F5F8] p-4">
//           <div className="flex items-start gap-3">
//             <MapPin
//               size={19}
//               className="mt-0.5 shrink-0 text-[#7442AD]"
//             />

//             <div>
//               <p className="text-[12px] uppercase tracking-[0.07em] text-[#A19AA5]">
//                 Destination
//               </p>

//               <p className="mt-1 text-[15px] font-semibold leading-5 text-[#302B34]">
//                 {
//                   ride.destination
//                     .label
//                 }
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 gap-3 mt-4">
//           <div className="rounded-[15px] border border-[#EEEAF1] p-4">
//             <Clock3
//               size={18}
//               className="text-[#7442AD]"
//             />

//             <p className="mt-3 text-[13px] text-[#918B95]">
//               Duration
//             </p>

//             <p className="mt-1 text-[16px] font-semibold">
//               {typeof duration ===
//               "number"
//                 ? `${duration} min`
//                 : "—"}
//             </p>
//           </div>

//           <div className="rounded-[15px] border border-[#EEEAF1] p-4">
//             <Route
//               size={18}
//               className="text-[#7442AD]"
//             />

//             <p className="mt-3 text-[13px] text-[#918B95]">
//               Distance
//             </p>

//             <p className="mt-1 text-[16px] font-semibold">
//               {typeof distance ===
//               "number"
//                 ? `${distance.toFixed(
//                     1,
//                   )} km`
//                 : "—"}
//             </p>
//           </div>
//         </div>

//         {typeof fare ===
//           "number" && (
//           <div className="mt-4 flex items-center justify-between rounded-[15px] bg-[#F3ECF9] p-4">
//             <span className="text-[14px] text-[#756E79]">
//               Current fare
//             </span>

//             <span className="text-[19px] font-bold text-[#302B34]">
//               ₦
//               {fare.toLocaleString(
//                 "en-NG",
//                 {
//                   maximumFractionDigits: 2,
//                 },
//               )}
//             </span>
//           </div>
//         )}

//         <div className="flex items-center justify-center gap-2 mt-4">
//           <Wifi
//             size={14}
//             className={
//               pollError
//                 ? "text-[#D05B5B]"
//                 : "text-[#5B9B72]"
//             }
//           />

//           <span className="text-[12px] text-[#9A939E]">
//             {pollError
//               ? "Reconnecting to trip..."
//               : "Live trip updates"}
//           </span>
//         </div>
//       </RideBottomSheet>
//     </div>
//   );
// }