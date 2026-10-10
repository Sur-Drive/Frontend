import {
  ArrowRight,
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

function getStatusMeta(
  status: PassengerTrip["status"],
) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        className:
          "text-[#35A960]",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        className:
          "text-[#F05B4D]",
      };

    case "no_drivers_found":
      return {
        label: "No drivers found",
        className:
          "text-[#D88A24]",
      };

    default:
      return {
        label: "Unavailable",
        className:
          "text-[#8F8994]",
      };
  }
}

export default function TripCard({
  trip,
  onRebook,
}: Props) {
  const navigate =
    useNavigate();

  const status =
    getStatusMeta(
      trip.status,
    );

  /*
   * RideDetails is still using the old
   * passengerTrips mock data.
   *
   * Until we connect that page to the backend,
   * only open details for rides it can support.
   */
  const canOpenDetails =
    trip.status === "completed" ||
    trip.status === "cancelled";

  const handleCardClick =
    () => {
      if (!canOpenDetails) {
        return;
      }

      navigate(
        `/passenger/activity/${trip.id}`,
      );
    };

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
      whileTap={
        canOpenDetails
          ? {
              scale: 0.995,
            }
          : undefined
      }
      onClick={
        handleCardClick
      }
      className={`
        rounded-[18px]
        border
        border-[#F0EDF2]
        bg-white
        p-4
        shadow-[0_6px_24px_rgba(30,20,38,0.05)]
        ${
          canOpenDetails
            ? "cursor-pointer"
            : "cursor-default"
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* CAR ICON */}

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
          <CarFront
            size={18}
          />
        </span>

        <div className="flex-1 min-w-0">
          {/* ROUTE */}

          <div
            className="
              flex
              min-w-0
              items-center
              gap-1.5
            "
          >
            <p
              className="
                min-w-0
                truncate
                text-[15px]
                font-semibold
                text-[#302B34]
              "
              title={
                trip.pickup
                  .label
              }
            >
              {
                trip.pickup
                  .label
              }
            </p>

            <ArrowRight
              size={14}
              strokeWidth={2.2}
              className="
                shrink-0
                text-[#7442AD]
              "
            />

            <p
              className="
                min-w-0
                flex-1
                truncate
                text-[15px]
                font-semibold
                text-[#302B34]
              "
              title={
                trip
                  .destination
                  .label
              }
            >
              {
                trip
                  .destination
                  .label
              }
            </p>
          </div>

          {/* DATE + STATUS */}

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

            {trip.time && (
              <>
                <span>
                  •
                </span>

                <span>
                  {trip.time}
                </span>
              </>
            )}

            <span>
              •
            </span>

            <span
              className={
                status.className
              }
            >
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER */}

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
        {/* AMOUNT */}

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

        {/* REBOOK */}

        <motion.button
          type="button"
          whileTap={{
            scale: 0.94,
          }}
          onClick={(
            event,
          ) => {
            event.stopPropagation();

            onRebook(
              trip,
            );
          }}
          className="
            rounded-full
            bg-[#7442AD]
            px-5
            py-2
            text-[13px]
            font-semibold
            text-white
            transition-colors
            hover:bg-[#66389A]
          "
        >
          Rebook
        </motion.button>
      </div>
    </motion.article>
  );
}