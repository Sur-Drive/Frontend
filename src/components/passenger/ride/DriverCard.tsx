import {
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";

import type { RideDriver } from "../../../types/passengerRide";

type Props = {
  driver: RideDriver;
  showActions?: boolean;
  onChat?: () => void;
  onCall?: () => void;
};

export default function DriverCard({
  driver,
  showActions = true,
  onChat,
  onCall,
}: Props) {
  return (
    <div className="rounded-[18px] border border-[#EEEAF1] bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EEE7F5] text-[20px] font-bold text-[#7442AD]">
          {driver.photo ? (
            <img
              src={driver.photo}
              alt={driver.firstName}
              className="h-full w-full object-cover"
            />
          ) : (
            driver.firstName.charAt(0)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-semibold text-[#302B34]">
            {driver.firstName}
          </h3>

          <div className="mt-1 flex items-center gap-1 text-[13px] text-[#77717C]">
            <Star
              size={14}
              fill="#F5B942"
              stroke="#F5B942"
            />

            <span className="font-semibold text-[#4D4751]">
              {driver.rating}
            </span>

            <span>•</span>

            <span>
              {driver.totalTrips} completed rides
            </span>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2">
            <motion.button
  type="button"
  whileTap={{ scale: 0.9 }}
  onClick={onChat}
  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F0E8F8] text-[#7442AD]"
  aria-label={`Message ${driver.firstName}`}
>
  <MessageCircle size={19} />
</motion.button>

           <motion.button
  type="button"
  whileTap={{ scale: 0.9 }}
  onClick={onCall}
  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7442AD] text-white"
  aria-label={`Call ${driver.firstName}`}
>
  <Phone size={18} />
</motion.button>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#F0EDF2] pt-4">
        <div>
          <p className="text-[15px] font-semibold text-[#302B34]">
            {driver.vehicle.make} {driver.vehicle.model}
          </p>

          <p className="mt-1 text-[13px] text-[#96909A]">
            {driver.vehicle.color}
          </p>
        </div>

        <span className="rounded-[8px] border border-[#DCD7E0] bg-[#F8F7F9] px-3 py-2 text-[14px] font-bold tracking-[0.06em] text-[#302B34]">
          {driver.vehicle.plateNumber}
        </span>
      </div>
    </div>
  );
}