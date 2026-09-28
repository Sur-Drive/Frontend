import {
  CarFront,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useNavigate,
} from "react-router-dom";

import type {
  PassengerTrip,
} from "../../../types/passengerTrip";

type Props = {
  trip: PassengerTrip;
  onRebook: (
    trip: PassengerTrip,
  ) => void;
};

export default function TripCard({
  trip,
  onRebook,
}: Props) {
  const navigate = useNavigate();

  const completed =
    trip.status === "completed";

  return (
    <motion.article
      layout
      initial={{
        opacity: 0,
        y: 14,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      whileTap={{
        scale: 0.995,
      }}
      onClick={() =>
        navigate(
          `/passenger/activity/${trip.id}`,
        )
      }
      className="
        cursor-pointer
        rounded-[18px]
        border
        border-[#F0EDF2]
        bg-white
        p-4
        shadow-[0_6px_24px_rgba(30,20,38,0.05)]
      "
    >
      <div className="flex items-start gap-3">
        <span
          className="
            mt-0.5
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-[10px]
            bg-[#F4F2F5]
            text-[#57515B]
          "
        >
          <CarFront size={18} />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className="
              truncate
              text-[15px]
              font-semibold
              text-[#302B34]
            "
          >
            {trip.pickup.label},{" "}
            {trip.destination.label}
          </p>

          <div
            className="
              mt-1
              flex
              flex-wrap
              items-center
              gap-1.5
              text-[13px]
              text-[#8F8994]
            "
          >
            <span>
              {trip.date}
            </span>

            <span>•</span>

            <span
              className={
                completed
                  ? "text-[#35A960]"
                  : "text-[#F05B4D]"
              }
            >
              {completed
                ? "Completed"
                : "Cancelled"}
            </span>
          </div>
        </div>
      </div>

      <div
        className="
          mt-3
          flex
          items-center
          justify-between
          border-t
          border-[#F0EDF2]
          pt-3
        "
      >
        <p
          className="
            text-[16px]
            font-bold
            text-[#302B34]
          "
        >
          ₦
          {trip.payment.total.toLocaleString(
            undefined,
            {
              maximumFractionDigits: 2,
            },
          )}
        </p>

        <motion.button
          type="button"
          whileTap={{
            scale: 0.94,
          }}
          onClick={(event) => {
            event.stopPropagation();
            onRebook(trip);
          }}
          className="
            rounded-full
            bg-[#7442AD]
            px-5
            py-2
            text-[13px]
            font-semibold
            text-white
          "
        >
          Rebook
        </motion.button>
      </div>
    </motion.article>
  );
}