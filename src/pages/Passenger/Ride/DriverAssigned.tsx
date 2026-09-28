import {
  Clock3,
  Share2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router-dom";

import PassengerMap from "../../../components/passenger/ride/PassengerMap";
import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";
import DriverCard from "../../../components/passenger/ride/DriverCard";

import { usePassengerRide } from "../../../context/PassengerRideContext";
import { mockAssignedDriver } from "../../../data/passengerRide";
import { useState } from "react";
import ShareRideSheet from "../../../components/passenger/ride/ShareRideSheet";
import CancelRideSheet from "../../../components/passenger/ride/CancelRideSheet";

export default function DriverAssigned() {
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

  if (!ride.pickup || !ride.destination) {
    return <Navigate to="/passenger/book-ride" replace />;
  }

  const driver = ride.driver ?? mockAssignedDriver;

  const center =
    ride.pickup.coordinates ?? {
      lat: 6.5244,
      lng: 3.3792,
    };

  const continueForDevelopment = () => {
    setDriver(mockAssignedDriver);
    setRideStatus("driver-en-route");

    navigate("/passenger/ride/driver-en-route");
  };

  const handleCancel = (
  reason: string,
  comment?: string,
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
};

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
      <PassengerMap
        center={center}
        pickup={ride.pickup}
        destination={ride.destination}
        zoom={15}
      />

      <RideMapHeader
        title="Driver Assigned"
        showMore
      />

      <RideBottomSheet>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-[#302B34]">
              Driver Assigned
            </h1>

            <p className="mt-1 text-[14px] text-[#928C96]">
              Your driver is heading to you.
            </p>
          </div>

          <div className="rounded-[12px] bg-[#F0E8F8] px-3 py-2 text-right text-[#7442AD]">
            <div className="flex items-center gap-1 text-[13px] font-semibold">
              <Clock3 size={14} />
              5 min
            </div>

            <p className="mt-0.5 text-[11px]">
              away
            </p>
          </div>
        </div>

        <div className="mt-5">
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

        {/* TEMPORARY UI DEVELOPMENT BUTTON */}
        <button
          type="button"
          onClick={continueForDevelopment}
          className="mt-3 h-[52px] w-full rounded-[13px] bg-[#7442AD] text-[15px] font-semibold text-white"
        >
          Preview Driver En Route
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
  eta="5 min"
/>

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