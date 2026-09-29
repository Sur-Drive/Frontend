import {
  Clock3,
  Share2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";

import ShareRideSheet from "../../../components/passenger/ride/ShareRideSheet";
import CancelRideSheet from "../../../components/passenger/ride/CancelRideSheet";

import PassengerMap from "../../../components/passenger/ride/PassengerMap";
import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";
import DriverCard from "../../../components/passenger/ride/DriverCard";

import { usePassengerRide } from "../../../context/PassengerRideContext";
import { mockAssignedDriver } from "../../../data/passengerRide";

export default function DriverEnRoute() {
  const navigate = useNavigate();

  const {
    ride,
    setRideStatus,
    setDriver,
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
    return <Navigate to="/passenger/book-ride" replace />;
  }

  const driver =
    ride.driver ?? mockAssignedDriver;

  const center =
    ride.pickup.coordinates ?? {
      lat: 6.5244,
      lng: 3.3792,
    };

  const previewArriving = () => {
  setDriver(driver);
  setRideStatus("driver-arriving");

  navigate("/passenger/ride/driver-arriving");
};

  return (
    <div className="relative h-[100dvh] overflow-hidden">
      <PassengerMap
        center={center}
        pickup={ride.pickup}
        destination={ride.destination}
        zoom={16}
        showTraffic
      />

      <RideMapHeader
        title="Driver En Route"
        showMore
      />

      <RideBottomSheet>
        <div className="rounded-[16px] bg-[#F3ECF9] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[17px] font-semibold text-[#302B34]">
                Your driver is on the way
              </p>

              <p className="mt-1 text-[13px] text-[#8F8994]">
                Please be ready at your pickup point.
              </p>
            </div>

            <div className="flex items-center gap-1 text-[#7442AD]">
              <Clock3 size={17} />

              <span className="text-[16px] font-semibold">
                3 min
              </span>
            </div>
          </div>

          <div className="mt-4 h-[5px] overflow-hidden rounded-full bg-white">
            <motion.div
              initial={{ width: "15%" }}
              animate={{ width: "68%" }}
              transition={{
                duration: 1.2,
                ease: "easeOut",
              }}
              className="h-full rounded-full bg-[#7442AD]"
            />
          </div>
        </div>

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

        <button
  type="button"
  onClick={() =>
    setShareOpen(true)
  }
  className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#F0E8F8] text-[15px] font-semibold text-[#7442AD]"
>
  <Share2 size={18} />
  Share Trip Live Status
</button>

<button
  type="button"
  onClick={() =>
    setCancelOpen(true)
  }
  className="mt-3 h-[48px] w-full text-[15px] font-semibold text-[#E45B5B]"
>
  Cancel Ride
</button>

        {/* TEMPORARY UNTIL DRIVER STATUS COMES FROM BACKEND */}
        <button
  type="button"
  onClick={previewArriving}
  className="mt-3 h-[52px] w-full rounded-[13px] bg-[#7442AD] text-[15px] font-semibold text-white"
>
  Preview Driver Arriving
</button>
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
  eta="3 min"
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