import {
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router-dom";

import PassengerMap from "../../../components/passenger/ride/PassengerMap";
import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";
import DriverCard from "../../../components/passenger/ride/DriverCard";

import { usePassengerRide } from "../../../context/PassengerRideContext";
import { mockAssignedDriver } from "../../../data/passengerRide";

export default function DriverArrived() {
  const navigate = useNavigate();

  const {
    ride,
    setRideStatus,
  } = usePassengerRide();

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

  const verify = () => {
    setRideStatus("verifying");

    navigate("/passenger/ride/verify");
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden">
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
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute left-4 right-4 top-[88px] z-[500] mx-auto flex max-w-[520px] items-center gap-3 rounded-[16px] bg-[#2E9B61] px-4 py-3 text-white shadow-[0_10px_30px_rgba(30,120,70,0.22)]"
      >
        <CheckCircle2 size={21} />

        <div>
          <p className="text-[15px] font-semibold">
            Your Driver Has Arrived
          </p>

          <p className="mt-0.5 text-[12px] text-white/80">
            {driver.firstName} is waiting at your pickup location
          </p>
        </div>
      </motion.div>

      <RideBottomSheet>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-[#302B34]">
              Your driver has arrived
            </h1>

            <p className="mt-1 text-[13px] text-[#918B95]">
              Meet your driver at the pickup point.
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-[10px] bg-[#FFF5E0] px-3 py-2 text-[#A86B08]">
            <Clock3 size={15} />
            <span className="text-[14px] font-semibold">
              0:45
            </span>
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
          whileTap={{ scale: 0.98 }}
          onClick={verify}
          className="mt-5 h-[56px] w-full rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white"
        >
          Verify Ride
        </motion.button>
      </RideBottomSheet>
    </div>
  );
}