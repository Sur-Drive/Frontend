import {
  Clock3,
  Navigation,
  Share2,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useState } from "react";

import ShareRideSheet from "../../../components/passenger/ride/ShareRideSheet";
import CancelRideSheet from "../../../components/passenger/ride/CancelRideSheet";

import PassengerMap from "../../../components/passenger/ride/PassengerMap";
import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";
import DriverCard from "../../../components/passenger/ride/DriverCard";

import { usePassengerRide } from "../../../context/PassengerRideContext";
import { mockAssignedDriver } from "../../../data/passengerRide";

export default function DriverArriving() {
  const navigate = useNavigate();

  const {
    ride,
    setDriver,
    setRideStatus,
  } = usePassengerRide();

  const [
  shareOpen,
  setShareOpen,
] = useState(false);

const [
  cancelOpen,
  setCancelOpen,
] = useState(false);

  if (!ride.pickup) {
    return (
      <Navigate
        to="/passenger/book-ride"
        replace
      />
    );
  }

  const driver =
    ride.driver ?? mockAssignedDriver;

  const center =
    ride.pickup.coordinates ?? {
      lat: 6.5244,
      lng: 3.3792,
    };

  const handleDriverArrived = () => {
    setDriver(driver);

    setRideStatus("driver-arrived");

    navigate(
      "/passenger/ride/driver-arrived",
    );
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
      {/* MAP */}

      <PassengerMap
        center={center}
        pickup={ride.pickup}
        destination={ride.destination}
        zoom={17}
        interactive
        showTraffic
      />

      {/* FIXED HEADER */}

      <RideMapHeader
        title="Driver Arriving"
        subtitle="Get ready for pickup"
        showMore
      />

      {/* ARRIVING MAP BADGE */}

      <motion.div
        initial={{
          opacity: 0,
          y: -15,
          scale: 0.96,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          type: "spring",
          stiffness: 220,
          damping: 20,
        }}
        className="
          absolute
          left-1/2
          top-[112px]
          z-[500]
          -translate-x-1/2
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
            whitespace-nowrap
            rounded-full
            bg-white/95
            px-4
            py-2.5
            shadow-[0_8px_30px_rgba(30,20,38,0.14)]
            backdrop-blur-xl
          "
        >
          <motion.span
            animate={{
              scale: [1, 1.25, 1],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
            }}
            className="
              h-2.5
              w-2.5
              rounded-full
              bg-[#7442AD]
            "
          />

          <span className="text-[13px] font-semibold text-[#302B34]">
            Driver is almost there
          </span>
        </div>
      </motion.div>

      {/* BOTTOM SHEET */}

      <RideBottomSheet>
        {/* ETA */}

        <div
          className="
            rounded-[18px]
            bg-[#F3ECF9]
            p-4
          "
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Navigation
                  size={18}
                  className="text-[#7442AD]"
                />

                <p className="text-[17px] font-semibold text-[#302B34]">
                  Your driver is arriving
                </p>
              </div>

              <p className="mt-2 text-[13px] leading-5 text-[#817A85]">
                Head to your pickup point and
                look out for the vehicle.
              </p>
            </div>

            <motion.div
              animate={{
                scale: [1, 1.04, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
              className="
                shrink-0
                rounded-[13px]
                bg-white
                px-3
                py-2
                text-center
                shadow-sm
              "
            >
              <div className="flex items-center justify-center gap-1 text-[#7442AD]">
                <Clock3 size={15} />

                <span className="text-[18px] font-bold">
                  1
                </span>
              </div>

              <p className="text-[11px] font-medium text-[#928B96]">
                min away
              </p>
            </motion.div>
          </div>

          {/* PROGRESS */}

          <div className="mt-4 h-[5px] overflow-hidden rounded-full bg-white">
            <motion.div
              initial={{
                width: "70%",
              }}
              animate={{
                width: "94%",
              }}
              transition={{
                duration: 1.2,
                ease: "easeOut",
              }}
              className="h-full rounded-full bg-[#7442AD]"
            />
          </div>
        </div>

        {/* DRIVER */}

        <div className="mt-4">
          <DriverCard
  driver={driver}
  onChat={() =>
    navigate(
      "/passenger/ride/chat",
    )
  }
  onCall={() => {
    console.log(
      "Open call sheet",
    );
  }}
/>
        </div>

        {/* PICKUP */}

        <div
          className="
            mt-4
            rounded-[16px]
            border
            border-[#EEEAF1]
            bg-white
            p-4
          "
        >
          <p
            className="
              text-[11px]
              font-semibold
              uppercase
              tracking-[0.08em]
              text-[#A29BA6]
            "
          >
            Pickup point
          </p>

          <p className="mt-1.5 text-[15px] font-semibold text-[#302B34]">
            {ride.pickup.label}
          </p>

          {ride.pickup.address && (
            <p className="mt-1 text-[13px] leading-5 text-[#918B95]">
              {ride.pickup.address}
            </p>
          )}
        </div>

        {/* SHARE */}

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
  onClick={() =>
    setCancelOpen(true)
  }
  className="mt-3 h-[48px] w-full text-[15px] font-semibold text-[#E45B5B]"
>
  Cancel Ride
</button>

        {/*
          TEMPORARY FRONTEND DEVELOPMENT ACTION.

          Later this transition should come from
          the driver's real arrival event.
        */}

        <motion.button
          type="button"
          whileTap={{
            scale: 0.98,
          }}
          onClick={handleDriverArrived}
          className="
            mt-3
            h-[54px]
            w-full
            rounded-[14px]
            bg-[#7442AD]
            text-[15px]
            font-semibold
            text-white
            shadow-[0_8px_25px_rgba(116,66,173,0.20)]
          "
        >
          Preview Driver Arrived
        </motion.button>
      </RideBottomSheet>

      <ShareRideSheet
  open={shareOpen}
  onClose={() =>
    setShareOpen(false)
  }
  driver={driver}
  pickup={ride.pickup}
  destination={
    ride.destination
  }
  eta="1 min"
/>

<CancelRideSheet
  open={cancelOpen}
  onClose={() =>
    setCancelOpen(false)
  }
  onConfirm={(
    reason,
    comment,
  ) => {
    console.log({
      reason,
      comment,
    });

    setRideStatus("idle");

    navigate(
      "/passenger/home",
      {
        replace: true,
      },
    );
  }}
/>
    </div>
  );
}