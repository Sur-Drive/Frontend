
import {
  ArrowRight,
  CarFront,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import type {
  KeyboardEvent,
  MouseEvent,
} from "react";

import type {
  PassengerTrip,
} from "../../../types/passengerTrip";

/* ======================================================
   TYPES
====================================================== */

type Props = {
  trip: PassengerTrip;

  onRebook: (
    trip: PassengerTrip,
  ) => void;

  onViewDetails: (
    trip: PassengerTrip,
  ) => void;
};

/* ======================================================
   STATUS META
====================================================== */

function getStatusMeta(
  status: PassengerTrip["status"],
) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        className: "text-[#35A960]",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        className: "text-[#F05B4D]",
      };

    case "no_drivers_found":
      return {
        label: "No drivers found",
        className: "text-[#D88A24]",
      };

    default:
      return {
        label: "Unavailable",
        className: "text-[#8F8994]",
      };
  }
}

/* ======================================================
   FORMAT AMOUNT
====================================================== */

function formatAmount(
  amount: number | null | undefined,
) {
  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount)
  ) {
    return "—";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/* ======================================================
   TRIP CARD
====================================================== */

export default function TripCard({
  trip,
  onRebook,
  onViewDetails,
}: Props) {
  const status = getStatusMeta(
    trip.status,
  );

  /*
   * All historical ride activities can open
   * their respective backend Ride Details page.
   *
   * The page decides what information to show
   * according to the actual ride status.
   */
  const canOpenDetails = Boolean(trip.id);

  /* ------------------------------------------------------
     OPEN RIDE DETAILS
  ------------------------------------------------------ */

  const handleCardClick = (
    event: MouseEvent<HTMLElement>,
  ) => {
    if (!canOpenDetails) return;

    /*
     * Ignore clicks originating from a nested
     * interactive element.
     */
    const target = event.target;

    if (
      target instanceof Element &&
      target.closest(
        "button, a, input, select, textarea",
      )
    ) {
      return;
    }

    onViewDetails(trip);
  };

  /* ------------------------------------------------------
     KEYBOARD ACCESSIBILITY
  ------------------------------------------------------ */

  const handleCardKeyDown = (
    event: KeyboardEvent<HTMLElement>,
  ) => {
    if (!canOpenDetails) return;

    /*
     * Don't activate the card when keyboard focus
     * is on the nested Rebook button.
     */
    if (event.target !== event.currentTarget) {
      return;
    }

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();

      onViewDetails(trip);
    }
  };

  /* ------------------------------------------------------
     REBOOK
  ------------------------------------------------------ */

  const handleRebook = (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    onRebook(trip);
  };

  /* ------------------------------------------------------
     RENDER
  ------------------------------------------------------ */

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
      role={
        canOpenDetails
          ? "link"
          : undefined
      }
      tabIndex={
        canOpenDetails
          ? 0
          : undefined
      }
      aria-label={
        canOpenDetails
          ? `View details for ride from ${trip.pickup.label} to ${trip.destination.label}. Status: ${status.label}`
          : undefined
      }
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={`
        rounded-[18px]
        border
        border-[#F0EDF2]
        bg-white
        p-4
        shadow-[0_6px_24px_rgba(30,20,38,0.05)]
        transition-colors
        duration-200
        ${
          canOpenDetails
            ? `
                cursor-pointer
                hover:border-[#DCC9EC]
                hover:bg-[#FEFCFF]
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#7442AD]
                focus-visible:ring-offset-2
              `
            : "cursor-default"
        }
      `}
    >
      {/* =================================================
          TOP CONTENT
      ================================================= */}

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
          <CarFront size={18} />
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
            {/* PICKUP */}

            <p
              className="
                min-w-0
                truncate
                text-[15px]
                font-semibold
                text-[#302B34]
              "
              title={
                trip.pickup.label
              }
            >
              {trip.pickup.label}
            </p>

            {/* ARROW */}

            <ArrowRight
              size={14}
              strokeWidth={2.2}
              className="
                shrink-0
                text-[#7442AD]
              "
            />

            {/* DESTINATION */}

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
                trip.destination.label
              }
            >
              {trip.destination.label}
            </p>
          </div>

          {/* =================================================
              DATE + STATUS
          ================================================= */}

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
                <span>•</span>

                <span>
                  {trip.time}
                </span>
              </>
            )}

            <span>•</span>

            <span
              className={`font-medium ${status.className}`}
            >
              {status.label}
            </span>
          </div>
        </div>

        {/* DETAIL INDICATOR */}

        {canOpenDetails && (
          <ArrowRight
            size={17}
            strokeWidth={2}
            className="
              mt-2
              shrink-0
              text-[#B3A8BD]
              transition-transform
              duration-200
            "
            aria-hidden="true"
          />
        )}
      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

      <div
        className="
          mt-3
          flex
          items-center
          justify-between
          gap-3
          border-t
          border-[#F0EDF2]
          pt-3
        "
      >
        {/* AMOUNT */}

        <div className="min-w-0">
          <p
            className="
              text-[16px]
              font-bold
              text-[#302B34]
            "
          >
            {formatAmount(
              trip.payment.total,
            )}
          </p>

          {trip.status ===
            "no_drivers_found" && (
            <p
              className="
                mt-0.5
                text-[11px]
                text-[#96909A]
              "
            >
              Estimated fare
            </p>
          )}
        </div>

        {/* REBOOK BUTTON */}

        <motion.button
          type="button"
          whileTap={{
            scale: 0.94,
          }}
          onClick={handleRebook}
          className="
            shrink-0
            rounded-full
            bg-[#7442AD]
            px-5
            py-2
            text-[13px]
            font-semibold
            text-white
            transition-colors
            hover:bg-[#66389A]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#7442AD]
            focus-visible:ring-offset-2
          "
        >
          {trip.status ===
          "no_drivers_found"
            ? "Try Again"
            : "Rebook"}
        </motion.button>
      </div>
    </motion.article>
  );
}


