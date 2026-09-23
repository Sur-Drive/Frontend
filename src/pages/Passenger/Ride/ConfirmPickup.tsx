import {
  Banknote,
  MapPin,
  Navigation,
} from "lucide-react";
import { motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router-dom";

import PassengerMap from "../../../components/passenger/ride/PassengerMap";
import RideBottomSheet from "../../../components/passenger/ride/RideBottomSheet";
import RideMapHeader from "../../../components/passenger/ride/RideMapHeader";

import { usePassengerRide } from "../../../context/PassengerRideContext";
import { rideOptions } from "../../../data/passengerRide";

export default function ConfirmPickup() {
  const navigate = useNavigate();

  const {
    ride,
    setRideStatus,
  } = usePassengerRide();

  if (!ride.pickup || !ride.destination || !ride.selectedRide) {
    return <Navigate to="/passenger/book-ride" replace />;
  }

  const option = rideOptions.find(
    (item) => item.id === ride.selectedRide,
  );

  const center =
    ride.pickup.coordinates ??
    ride.destination.coordinates ?? {
      lat: 6.5244,
      lng: 3.3792,
    };

  const confirm = () => {
    setRideStatus("searching");
    navigate("/passenger/ride/searching");
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
      <PassengerMap
        center={center}
        pickup={ride.pickup}
        destination={ride.destination}
        zoom={16}
      />

      <RideMapHeader title="Confirm pickup" />

      <RideBottomSheet>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#302B34]">
          Confirm your pickup
        </h1>

        <p className="mt-1 text-[14px] text-[#99939D]">
          Make sure the pickup point is correct.
        </p>

        <div className="mt-5 rounded-[16px] bg-[#F7F5F8] p-4">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDE4F6] text-[#7442AD]">
              <Navigation size={18} />
            </span>

            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[#9A949E]">
                PICKUP
              </p>

              <p className="mt-1 truncate text-[16px] font-semibold text-[#302B34]">
                {ride.pickup.label}
              </p>

              {ride.pickup.address && (
                <p className="mt-1 truncate text-[13px] text-[#908A94]">
                  {ride.pickup.address}
                </p>
              )}
            </div>
          </div>

          <div className="my-4 ml-5 h-5 border-l-2 border-dotted border-[#C9C2CF]" />

          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFEDEF] text-[#302B34]">
              <MapPin size={18} />
            </span>

            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[#9A949E]">
                DESTINATION
              </p>

              <p className="mt-1 truncate text-[16px] font-semibold text-[#302B34]">
                {ride.destination.label}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-[15px] border border-[#EEEAF1] p-4">
          <div>
            <p className="text-[13px] text-[#99939D]">
              {option?.name}
            </p>

            <p className="mt-1 text-[18px] font-semibold text-[#302B34]">
              ₦{(ride.estimatedFare ?? option?.price ?? 0).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2 text-[14px] text-[#625C66]">
            <Banknote size={18} />
            {ride.paymentMethod.label}
          </div>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={confirm}
          className="mt-5 flex h-[56px] w-full items-center justify-center rounded-[14px] bg-[#7442AD] text-[16px] font-semibold text-white shadow-[0_10px_30px_rgba(116,66,173,0.24)]"
        >
          Confirm Order
        </motion.button>
      </RideBottomSheet>
    </div>
  );
}