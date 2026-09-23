import {
  Check,
  Clock3,
  MapPin,
  ReceiptText,
  Route,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";

import PassengerMap from "../../../components/passenger/ride/PassengerMap";
import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";

import { usePassengerRide } from "../../../context/PassengerRideContext";

export default function TripComplete() {
  const navigate = useNavigate();

  const {
    ride,
    completeRide,
  } = usePassengerRide();

  const [showSuccess, setShowSuccess] =
    useState(true);

  if (!ride.destination) {
    return <Navigate to="/passenger/home" replace />;
  }

  const center =
    ride.destination.coordinates ?? {
      lat: 6.5244,
      lng: 3.3792,
    };

  const finalFare =
    ride.finalFare ??
    ride.estimatedFare ??
    0;

  const continueToRating = () => {
    completeRide(finalFare);
    setShowSuccess(false);

    navigate("/passenger/ride/rate");
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden">
      <PassengerMap
        center={center}
        destination={ride.destination}
        zoom={16}
      />

      <RideMapHeader
        title="Trip Complete"
      />

      <RideBottomSheet>
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 16,
            }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E4F7EA] text-[#36A665]"
          >
            <Check
              size={31}
              strokeWidth={3}
            />
          </motion.div>

          <h1 className="mt-4 text-[24px] font-semibold">
            You've Arrived!
          </h1>

          <p className="mt-1 text-[14px] text-[#918B95]">
            {ride.destination.label}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[15px] bg-[#F7F5F8] p-4">
            <Clock3
              size={18}
              className="text-[#7442AD]"
            />

            <p className="mt-3 text-[12px] text-[#918B95]">
              Duration
            </p>

            <p className="mt-1 text-[16px] font-semibold">
              {ride.duration ?? "25 mins"}
            </p>
          </div>

          <div className="rounded-[15px] bg-[#F7F5F8] p-4">
            <Route
              size={18}
              className="text-[#7442AD]"
            />

            <p className="mt-3 text-[12px] text-[#918B95]">
              Distance
            </p>

            <p className="mt-1 text-[16px] font-semibold">
              {ride.distance ?? "12.3 km"}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[16px] border border-[#EEEAF1] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ReceiptText
                size={19}
                className="text-[#7442AD]"
              />

              <span className="text-[15px] font-medium">
                Final Fare
              </span>
            </div>

            <span className="text-[21px] font-bold">
              ₦{finalFare.toLocaleString()}
            </span>
          </div>

          <div className="my-4 h-px bg-[#EEEAF1]" />

          <div className="flex items-start gap-2">
            <MapPin
              size={17}
              className="mt-0.5 shrink-0 text-[#7442AD]"
            />

            <div>
              <p className="text-[12px] text-[#96909A]">
                Destination
              </p>

              <p className="mt-1 text-[14px] font-medium">
                {ride.destination.label}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSuccess(true)}
          className="mt-5 h-[54px] w-full rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white"
        >
          View Ride Info
        </button>
      </RideBottomSheet>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#211927]/45 px-5 backdrop-blur-[5px]"
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.88,
                y: 25,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.94,
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 22,
              }}
              className="w-full max-w-[390px] rounded-[26px] bg-white px-6 py-8 text-center shadow-[0_30px_90px_rgba(20,12,25,0.25)]"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.1,
                  type: "spring",
                  stiffness: 250,
                  damping: 15,
                }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E4F7EA] text-[#36A665]"
              >
                <Check
                  size={39}
                  strokeWidth={3}
                />
              </motion.div>

              <h2 className="mt-5 text-[23px] font-semibold text-[#302B34]">
                Success Your Ride
              </h2>

              <p className="mt-2 text-[14px] text-[#918B95]">
                We hope you enjoyed your ride.
              </p>

              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={continueToRating}
                className="mt-7 h-[54px] w-full rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white"
              >
                Rate Driver
              </motion.button>

              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="mt-3 h-[48px] w-full text-[15px] font-semibold text-[#817A85]"
              >
                Not Now
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}