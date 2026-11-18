import { MessageCircle, Phone, Star, UsersRound } from "lucide-react";
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
  const driverName = driver.firstName?.trim() || "Your driver";

  const vehicleName = [
    driver.vehicle?.make,
    driver.vehicle?.model,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="rounded-[18px] border border-[#EEEAF1] bg-white p-4 shadow-[0_5px_20px_rgba(30,20,38,0.04)]">
      <div className="flex items-center gap-3">
        {/* DRIVER PHOTO */}
        <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EEE7F5] text-[20px] font-bold text-[#7442AD]">
          {driver.photo ? (
            <img
              src={driver.photo}
              alt={driverName}
              className="object-cover w-full h-full"
            />
          ) : (
            driverName.charAt(0).toUpperCase()
          )}
        </div>

        {/* DRIVER DETAILS */}
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-[16px] font-semibold text-[#302B34]">
            {driverName}
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-1 text-[12px] text-[#77717C]">
            {typeof driver.rating === "number" &&
                driver.rating > 0 && (
              <>
                <Star
                  size={13}
                  fill="#F5B942"
                  stroke="#F5B942"
                />
                <span className="font-semibold">
                  {driver.rating.toFixed(1)}
                </span>
              </>
            )}

            {typeof driver.totalTrips === "number" &&
              driver.totalTrips > 0 && (
              <span>
                {typeof driver.rating === "number" ? "• " : ""}
                {driver.totalTrips} trips
              </span>
            )}
          </div>
        </div>

        {/* CHAT AND CALL */}
        {showActions && (
          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              type="button"
              whileTap={onChat ? { scale: 0.9 } : undefined}
              onClick={onChat}
              disabled={!onChat}
              aria-label={`Chat with ${driverName}`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0E8F8] text-[#7442AD] transition hover:bg-[#E7DAF4] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MessageCircle size={19} />
            </motion.button>

            <motion.button
              type="button"
              whileTap={onCall ? { scale: 0.9 } : undefined}
              onClick={onCall}
              disabled={!onCall}
              aria-label={`Call ${driverName}`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7F7EC] text-[#2E9B61] transition hover:bg-[#D9F0E0] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Phone size={18} />
            </motion.button>
          </div>
        )}
      </div>

      {/* VEHICLE INFORMATION */}
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#F0EDF2] pt-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-[#302B34]">
            {vehicleName || "Vehicle details updating"}
          </p>

          {driver.vehicle?.color && (
            <p className="mt-1 text-[12px] text-[#96909A]">
              {driver.vehicle.color}
            </p>
          )}
        </div>

        {driver.vehicle?.plateNumber && (
          <span className="shrink-0 rounded-[8px] border border-[#DCD7E0] bg-[#F8F7F9] px-2.5 py-2 text-[12px] font-bold tracking-[0.03em] text-[#302B34]">
            {driver.vehicle.plateNumber}
          </span>
        )}
      
      </div>
            {/* <div className="flex items-center justify-between gap-3 border-[#F0EDF2]">
       {driver.vehicle?.category && (
              <p className="mt-2 text-[13px] text-[#918B95]">
                {driver.vehicle.category}
              </p>
            )}

            {driver.vehicle?.capacity && (
              <p className="mt-2 text-[13px] text-[#918B95]">
                {driver.vehicle.capacity} seats
              </p>
            )}
            </div> */}
             {/* VEHICLE CATEGORY AND CAPACITY */}

  {(driver.vehicle?.category ||
    driver.vehicle?.capacity != null) && (

    <div className="flex flex-wrap items-center gap-2 mt-3">

      {/* CATEGORY */}

      {driver.vehicle?.category && (
        <span className="inline-flex items-center rounded-full bg-[#F3ECF9] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7442AD]">
          {driver.vehicle.category}
        </span>
      )}

      {/* PASSENGER CAPACITY */}

      {driver.vehicle?.capacity != null && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F7F7F8] px-3 py-1.5 text-[11px] font-medium text-[#77717C]">
          <UsersRound size={13} />

          {driver.vehicle.capacity}{" "}
          {driver.vehicle.capacity === 1
            ? "Passenger"
            : "Passengers"}
        </span>
      )}

    </div>
  )}
    </div>
  );
}

