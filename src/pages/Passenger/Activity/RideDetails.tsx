import {
  ArrowLeft,
  CarFront,
  HelpCircle,
  MapPin,
  RotateCcw,
  Star,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useState,
} from "react";

import TripRoutePreview from "../../../components/passenger/trips/TripRoutePreview";

import TripPaymentCard from "../../../components/passenger/trips/TripPaymentCard";

import ReceiptSheet from "../../../components/passenger/trips/ReceiptSheet";

import {
  passengerTrips,
} from "../../../data/passengerTrips";

import {
  usePassengerRide,
} from "../../../context/PassengerRideContext";

export default function RideDetails() {
  const navigate =
    useNavigate();

  const {
    rideId,
  } = useParams<{
    rideId: string;
  }>();

  const {
    setPickup,
    setDestination,
    setRideStatus,
  } = usePassengerRide();

  const [
    receiptOpen,
    setReceiptOpen,
  ] = useState(false);

  const trip =
    passengerTrips.find(
      (item) =>
        item.id === rideId,
    );

  if (!trip) {
    return (
      <Navigate
        to="/passenger/activity"
        replace
      />
    );
  }

  const completed =
    trip.status ===
    "completed";

  const rebook = () => {
    setPickup(trip.pickup);

    setDestination(
      trip.destination,
    );

    setRideStatus(
      "selecting",
    );

    navigate(
      "/passenger/ride/select",
    );
  };

  return (
    <div
      className="
        min-h-[100dvh]
        bg-[#F8F8FA]
      "
    >
      {/* =====================================
          FIXED HEADER
      ===================================== */}

      <header
        className="
          sticky
          top-0
          z-[700]
          border-b
          border-black/[0.03]
          bg-white/95
          px-4
          py-3
          backdrop-blur-xl
        "
      >
        <div
          className="
            mx-auto
            flex
            h-[52px]
            w-full
            max-w-[680px]
            items-center
          "
        >
          <motion.button
            type="button"
            whileTap={{
              scale: 0.9,
            }}
            onClick={() =>
              navigate(
                "/passenger/activity",
              )
            }
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              text-[#302B34]
              hover:bg-[#F4F1F6]
            "
          >
            <ArrowLeft
              size={21}
            />
          </motion.button>

          <h1
            className="
              flex-1
              pr-11
              text-center
              text-[21px]
              font-semibold
              tracking-[-0.02em]
              text-[#302B34]
            "
          >
            Ride Details
          </h1>
        </div>
      </header>

      {/* =====================================
          CONTENT
      ===================================== */}

      <main
        className="
          mx-auto
          w-full
          max-w-[680px]
          space-y-4
          px-5
          pb-12
          pt-4
          sm:px-7
        "
      >
        {/* MAP */}

        <TripRoutePreview
          status={
            trip.status
          }
        />

        {/* =================================
            DRIVER
        ================================= */}

        <section
          className="
            rounded-[19px]
            border
            border-[#F0EDF2]
            bg-white
            p-4
            shadow-[0_5px_24px_rgba(30,20,38,0.04)]
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                overflow-hidden
                rounded-full
                bg-[#EEE7F5]
                text-[17px]
                font-bold
                text-[#7442AD]
              "
            >
              {trip.driver
                .photo ? (
                <img
                  src={
                    trip.driver
                      .photo
                  }
                  alt={
                    trip.driver
                      .firstName
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                trip.driver.firstName.charAt(
                  0,
                )
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p
                className="
                  truncate
                  text-[16px]
                  font-semibold
                  text-[#302B34]
                "
              >
                {
                  trip.driver
                    .firstName
                }
              </p>

              <p
                className="
                  mt-1
                  text-[13px]
                  text-[#96909A]
                "
              >
                {
                  trip.driver
                    .totalTrips
                }{" "}
                completed rides
              </p>
            </div>

            {completed && (
              <div
                className="
                  flex
                  shrink-0
                  gap-0.5
                "
              >
                {[1, 2, 3, 4, 5].map(
                  (
                    star,
                  ) => (
                    <Star
                      key={
                        star
                      }
                      size={16}
                      strokeWidth={
                        1.8
                      }
                      fill={
                        star <=
                        (trip.rating ??
                          0)
                          ? "#F4B72D"
                          : "transparent"
                      }
                      className={
                        star <=
                        (trip.rating ??
                          0)
                          ? "text-[#F4B72D]"
                          : "text-[#D8D3DB]"
                      }
                    />
                  ),
                )}
              </div>
            )}
          </div>

          <div className="my-4 h-px bg-[#EEEAF0]" />

          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <span
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-[10px]
                bg-[#F4F2F5]
                text-[#514B55]
              "
            >
              <CarFront
                size={18}
              />
            </span>

            <div className="min-w-0">
              <p
                className="
                  truncate
                  text-[15px]
                  font-semibold
                  text-[#302B34]
                "
              >
                {
                  trip.driver
                    .vehicle
                    .make
                }{" "}
                {
                  trip.driver
                    .vehicle
                    .model
                }{" "}
                •{" "}
                {
                  trip.driver
                    .vehicle
                    .color
                }
              </p>

              <p
                className="
                  mt-1
                  text-[13px]
                  text-[#7442AD]
                "
              >
                {
                  trip.driver
                    .vehicle
                    .plateNumber
                }
              </p>
            </div>
          </div>
        </section>

        {/* =================================
            ROUTE
        ================================= */}

        <section
          className="
            rounded-[20px]
            border
            border-[#F0EDF2]
            bg-white
            p-5
            shadow-[0_5px_25px_rgba(30,20,38,0.04)]
          "
        >
          <h2
            className="
              text-[18px]
              font-semibold
              text-[#302B34]
            "
          >
            Route
          </h2>

          <div className="mt-5">
            {/* PICKUP */}

            <div className="flex gap-3">
              <div
                className="
                  flex
                  w-5
                  shrink-0
                  flex-col
                  items-center
                "
              >
                <span
                  className="
                    mt-1
                    h-3
                    w-3
                    rounded-full
                    border-[3px]
                    border-[#F4B72D]
                    bg-white
                  "
                />

                <span
                  className="
                    mt-1
                    h-[54px]
                    border-l-2
                    border-dotted
                    border-[#D9D3DD]
                  "
                />
              </div>

              <div className="min-w-0 pb-4">
                <p
                  className="
                    text-[15px]
                    font-medium
                    text-[#302B34]
                  "
                >
                  {
                    trip.pickup
                      .label
                  }
                </p>

                <p
                  className="
                    mt-1
                    text-[13px]
                    text-[#96909A]
                  "
                >
                  {trip.date},{" "}
                  {trip.pickupTime}
                </p>
              </div>
            </div>

            {/* DESTINATION */}

            <div className="flex gap-3">
              <div
                className="
                  flex
                  w-5
                  shrink-0
                  justify-center
                "
              >
                <span
                  className="
                    mt-1
                    h-3
                    w-3
                    rounded-full
                    border-[3px]
                    border-[#7442AD]
                    bg-white
                  "
                />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    text-[15px]
                    font-medium
                    text-[#302B34]
                  "
                >
                  {
                    trip
                      .destination
                      .label
                  }
                </p>

                <p className="mt-1 text-[13px] text-[#96909A]">
  {trip.dropoffTime
    ? `${trip.date}, ${trip.dropoffTime}`
    : "Drop off"}
</p>
              </div>
            </div>
          </div>

          {/* REBOOK */}

          <motion.button
            type="button"
            whileTap={{
              scale: 0.98,
            }}
            onClick={rebook}
            className="
              mt-6
              flex
              h-[54px]
              w-full
              items-center
              justify-center
              gap-2
              rounded-[14px]
              bg-[#7442AD]
              text-[15px]
              font-semibold
              text-white
            "
          >
            <RotateCcw
              size={17}
            />

            Rebook
          </motion.button>

          {/* HELP */}

          <motion.button
            type="button"
            whileTap={{
              scale: 0.98,
            }}
            className="
              mt-3
              flex
              h-[52px]
              w-full
              items-center
              justify-center
              gap-2
              rounded-[14px]
              bg-[#E7E7E8]
              text-[14px]
              font-semibold
              text-white
            "
          >
            <HelpCircle
              size={17}
            />

            Get help with ride
          </motion.button>
        </section>

        {/* =================================
            PAYMENT
        ================================= */}

        <TripPaymentCard
          trip={trip}
          onGetReceipt={
            completed
              ? () =>
                  setReceiptOpen(
                    true,
                  )
              : undefined
          }
        />
      </main>

      {/* RECEIPT */}

      <ReceiptSheet
        open={receiptOpen}
        trip={trip}
        onClose={() =>
          setReceiptOpen(
            false,
          )
        }
      />
    </div>
  );
}