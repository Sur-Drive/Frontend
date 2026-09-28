import {
  MapPin,
  ShieldCheck,
  Share2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";

import SafetySheet from "../../../components/passenger/ride/SafetySheet";
import ShareRideSheet from "../../../components/passenger/ride/ShareRideSheet";

import PassengerMap from "../../../components/passenger/ride/PassengerMap";
import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";
import DriverCard from "../../../components/passenger/ride/DriverCard";

import { usePassengerRide } from "../../../context/PassengerRideContext";
import { mockAssignedDriver } from "../../../data/passengerRide";

export default function ActiveTrip() {
  const navigate = useNavigate();

  const {
    ride,
    setRideStatus,
    setTripInfo,
  } = usePassengerRide();

  const [
  safetyOpen,
  setSafetyOpen,
] = useState(false);

const [
  shareOpen,
  setShareOpen,
] = useState(false);

  if (!ride.destination) {
    return <Navigate to="/passenger/home" replace />;
  }

  const driver =
    ride.driver ?? mockAssignedDriver;

  const center =
    ride.pickup?.coordinates ??
    ride.destination.coordinates ?? {
      lat: 6.5244,
      lng: 3.3792,
    };

  const previewArrival = () => {
    setTripInfo("12.3 km", "25 mins");
    setRideStatus("arrived");

    navigate("/passenger/ride/arrived");
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden">
      <PassengerMap
        center={center}
        destination={ride.destination}
        zoom={18}
        followMode
        showTraffic
        tilt={38}
        heading={18}
        puckSize={46}
        puckMode="driving"
      />

      <RideMapHeader
        title="Trip in progress"
        showMore
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute left-4 right-4 top-[88px] z-[500] mx-auto max-w-[520px] rounded-[17px] bg-white/95 p-4 shadow-[0_10px_35px_rgba(28,20,35,0.14)] backdrop-blur-xl"
      >
        <p className="text-[11px] font-semibold tracking-[0.08em] text-[#8E8792]">
          HEADING TO
        </p>

        <div className="mt-1 flex items-center gap-2">
          <MapPin
            size={18}
            className="shrink-0 text-[#7442AD]"
          />

          <p className="min-w-0 flex-1 truncate text-[16px] font-semibold text-[#302B34]">
            {ride.destination.label}
          </p>
        </div>

        <div className="mt-3 flex gap-5 text-[13px]">
          <span className="font-semibold text-[#7442AD]">
            18 min
          </span>

          <span className="text-[#817A85]">
            8.2 km left
          </span>
        </div>
      </motion.div>

      <RideBottomSheet className="max-h-[47dvh]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[19px] font-semibold">
              Heading to destination
            </h1>

            <p className="mt-1 text-[13px] text-[#918B95]">
              18 min • 8.2 km left
            </p>
          </div>

          <div className="h-3 w-3 rounded-full bg-[#38A967] shadow-[0_0_0_5px_rgba(56,169,103,0.12)]" />
        </div>

        <div className="mt-4">
          <DriverCard
            driver={driver}
            showActions={false}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <motion.button
  type="button"
  whileTap={{
    scale: 0.97,
  }}
  onClick={() =>
    setSafetyOpen(true)
  }
  className="flex h-[50px] items-center justify-center gap-2 rounded-[13px] bg-[#F3ECF9] text-[14px] font-semibold text-[#7442AD]"
>
  <ShieldCheck
    size={18}
  />
  Safety
</motion.button>

          <motion.button
  type="button"
  whileTap={{
    scale: 0.97,
  }}
  onClick={() =>
    setShareOpen(true)
  }
  className="flex h-[50px] items-center justify-center gap-2 rounded-[13px] bg-[#F3ECF9] text-[14px] font-semibold text-[#7442AD]"
>
  <Share2 size={18} />
  Share Trip
</motion.button>
        </div>

        {/* DEVELOPMENT ONLY */}
        <button
          type="button"
          onClick={previewArrival}
          className="mt-3 h-[50px] w-full rounded-[13px] bg-[#7442AD] text-[14px] font-semibold text-white"
        >
          Preview Arrival
        </button>
      </RideBottomSheet>

      <SafetySheet
  open={safetyOpen}
  onClose={() =>
    setSafetyOpen(false)
  }
  onEmergency={() => {
    setSafetyOpen(false);

    navigate(
      "/passenger/ride/safety",
    );
  }}
  onShareTrip={() => {
    setSafetyOpen(false);
    setShareOpen(true);
  }}
  onReportIssue={() => {
    setSafetyOpen(false);

    navigate(
      "/passenger/ride/safety",
    );
  }}
/>

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
  eta="18 min"
/>
    </div>
  );
}