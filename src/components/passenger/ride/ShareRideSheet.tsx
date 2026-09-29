import {
  Check,
  Clock3,
  Copy,
  MapPin,
  Share2,
} from "lucide-react";
import {
  motion,
} from "framer-motion";
import {
  useState,
} from "react";

import RideModalSheet from "./RideModalSheet";

import type {
  RideDriver,
  RideLocation,
} from "../../../types/passengerRide";

interface ShareRideSheetProps {
  open: boolean;
  onClose: () => void;
  driver?: RideDriver | null;
  pickup?: RideLocation | null;
  destination?: RideLocation | null;
  eta?: string;
  liveTripUrl?: string;
}

export default function ShareRideSheet({
  open,
  onClose,
  driver,
  pickup,
  destination,
  eta = "18 min",
  liveTripUrl = "",
}: ShareRideSheetProps) {
  const [copied, setCopied] =
    useState(false);

  const copyLink = async () => {
    if (!liveTripUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        liveTripUrl,
      );

      setCopied(true);

      window.setTimeout(
        () => setCopied(false),
        1800,
      );
    } catch {
      setCopied(false);
    }
  };

  const nativeShare = async () => {
    if (!liveTripUrl) {
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title:
            "Follow my Sur-Drive trip",
          text:
            "Track my live trip status.",
          url: liveTripUrl,
        });
      } catch {
        // User dismissed share sheet.
      }

      return;
    }

    await copyLink();
  };

  return (
    <RideModalSheet
      open={open}
      onClose={onClose}
      title="Share your trip"
      description="Let someone follow your ride and arrival status."
    >
      {driver && (
        <div
          className="
            flex items-center gap-3
            rounded-[16px]
            bg-[#F8F6F9]
            p-4
          "
        >
          <div
            className="
              flex h-12 w-12
              items-center justify-center
              rounded-full
              bg-[#EEE7F5]
              text-[18px] font-bold
              text-[#7442AD]
            "
          >
            {driver.photo ? (
              <img
                src={driver.photo}
                alt={driver.firstName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              driver.firstName.charAt(0)
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-[#302B34]">
              {driver.firstName}
            </p>

            <p className="mt-1 truncate text-[12px] text-[#918B95]">
              {driver.vehicle.make}{" "}
              {driver.vehicle.model} •{" "}
              {driver.vehicle.plateNumber}
            </p>
          </div>

          <div className="flex items-center gap-1 text-[#7442AD]">
            <Clock3 size={15} />

            <span className="text-[13px] font-semibold">
              {eta}
            </span>
          </div>
        </div>
      )}

      <div
        className="
          mt-4 rounded-[16px]
          border border-[#EEEAF1]
          p-4
        "
      >
        {pickup && (
          <div className="flex gap-3">
            <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-[3px] border-[#7442AD]" />

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#AAA4AD]">
                Pickup
              </p>

              <p className="mt-1 text-[14px] font-medium text-[#302B34]">
                {pickup.label}
              </p>
            </div>
          </div>
        )}

        {pickup && destination && (
          <div className="ml-[5px] my-2 h-7 border-l-2 border-dotted border-[#D4CED8]" />
        )}

        {destination && (
          <div className="flex gap-3">
            <MapPin
              size={17}
              className="mt-0.5 shrink-0 text-[#302B34]"
            />

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#AAA4AD]">
                Destination
              </p>

              <p className="mt-1 text-[14px] font-medium text-[#302B34]">
                {destination.label}
              </p>
            </div>
          </div>
        )}
      </div>

      {liveTripUrl ? (
        <>
          <div
            className="
              mt-4 flex min-h-[56px]
              items-center gap-3
              rounded-[14px]
              bg-[#F7F5F8]
              px-4
            "
          >
            <p className="min-w-0 flex-1 truncate text-[13px] text-[#625C66]">
              {liveTripUrl}
            </p>

            <button
              type="button"
              onClick={copyLink}
              className="
                flex h-9 w-9
                shrink-0 items-center
                justify-center
                rounded-full bg-white
                text-[#7442AD]
              "
            >
              {copied ? (
                <Check size={18} />
              ) : (
                <Copy size={18} />
              )}
            </button>
          </div>

          <motion.button
            type="button"
            whileTap={{
              scale: 0.98,
            }}
            onClick={nativeShare}
            className="
              mt-5 flex h-[54px]
              w-full items-center
              justify-center gap-2
              rounded-[14px]
              bg-[#7442AD]
              text-[16px] font-semibold
              text-white
            "
          >
            <Share2 size={18} />
            Share Live Trip
          </motion.button>
        </>
      ) : (
        <div
          className="
            mt-4 rounded-[14px]
            bg-[#FFF6E7]
            p-4 text-[13px]
            leading-5 text-[#765E37]
          "
        >
          A live tracking link will appear here when the backend provides the trip-sharing URL.
        </div>
      )}
    </RideModalSheet>
  );
}