import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  ArrowUpDown,
  Crosshair,
  MapPin,
  Navigation,
  Plus,
  Search,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import RideHeader from "../../../components/passenger/ride/RideHeader";

import {
  recentRideLocations,
} from "../../../data/passengerRide";

import {
  usePassengerRide,
} from "../../../context/PassengerRideContext";

import type {
  RideLocation,
} from "../../../types/passengerRide";
import AddStopSheet from "../../../components/passenger/ride/AddStopSheet";

type ActiveLocationField =
  | "pickup"
  | "destination"
  | null;

export default function BookRide() {
  const navigate = useNavigate();

  const {
    ride,
    setPickup,
    setDestination,
    swapLocations,
    addStop,
    removeStop,
    setRideStatus,
  } = usePassengerRide();

  const [
  addStopOpen,
  setAddStopOpen,
] = useState(false);

  const [activeField, setActiveField] =
    useState<ActiveLocationField>(
      ride.destination
        ? null
        : "destination",
    );

  const [pickupQuery, setPickupQuery] =
    useState(
      ride.pickup?.label ??
        "Current location",
    );

  const [
    destinationQuery,
    setDestinationQuery,
  ] = useState(
    ride.destination?.label ?? "",
  );

  useEffect(() => {
    setRideStatus("planning");
  }, [setRideStatus]);

  const searchQuery =
    activeField === "pickup"
      ? pickupQuery
      : destinationQuery;

  const filteredLocations = useMemo(
    () => {
      if (!searchQuery.trim()) {
        return recentRideLocations;
      }

      const query =
        searchQuery.toLowerCase();

      return recentRideLocations.filter(
        (location) =>
          location.label
            .toLowerCase()
            .includes(query) ||
          location.address
            .toLowerCase()
            .includes(query),
      );
    },
    [searchQuery],
  );

  const chooseLocation = (
    location: RideLocation,
  ) => {
    if (activeField === "pickup") {
      setPickup(location);
      setPickupQuery(location.label);

      setActiveField("destination");

      return;
    }

    setDestination(location);

    setDestinationQuery(
      location.label,
    );

    setActiveField(null);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const current: RideLocation = {
          label: "Current location",

          address:
            "Your current location",

          coordinates: {
            lat:
              position.coords.latitude,

            lng:
              position.coords.longitude,
          },
        };

        if (activeField === "pickup") {
          setPickup(current);

          setPickupQuery(
            "Current location",
          );

          setActiveField(
            "destination",
          );
        } else {
          setDestination(current);

          setDestinationQuery(
            "Current location",
          );

          setActiveField(null);
        }
      },
      () => {
        // We'll connect this to your
        // existing IP fallback later.
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
      },
    );
  };

  const handleSwap = () => {
    swapLocations();

    const previousPickup =
      pickupQuery;

    setPickupQuery(
      destinationQuery,
    );

    setDestinationQuery(
      previousPickup,
    );
  };

  const handleContinue = () => {
    if (
      !ride.pickup ||
      !ride.destination
    ) {
      return;
    }

    setRideStatus("selecting");

    navigate(
      "/passenger/ride/select",
    );
  };

  return (
    <div
      className="
        min-h-[100dvh]
        bg-[#F8F8FA]
        text-[#302B34]
      "
    >
      <RideHeader
        title="Where are you going?"
      />

      <main
        className="
          mx-auto w-full
          max-w-[760px]
          px-4 pb-36 pt-5
          sm:px-6
        "
      >
        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="
            relative rounded-[22px]
            bg-white p-4
            shadow-[0_10px_40px_rgba(32,22,40,0.06)]
          "
        >
          <div
            className="
              absolute left-[31px]
              top-[53px]
              h-[52px]
              border-l-2 border-dotted
              border-[#CAC2D1]
            "
          />

          <div className="flex gap-3">
            <div
              className="
                mt-[21px] h-3 w-3
                shrink-0 rounded-full
                border-[3px]
                border-[#7442AD]
                bg-white
              "
            />

            <div className="min-w-0 flex-1">
              <p
                className="
                  mb-1 text-[12px]
                  font-medium
                  text-[#9A949F]
                "
              >
                Pickup
              </p>

              <div
                className={`
                  flex h-[52px]
                  items-center
                  rounded-[12px]
                  border
                  px-3
                  transition-all

                  ${
                    activeField ===
                    "pickup"
                      ? `
                        border-[#A67BD2]
                        bg-white
                        shadow-[0_0_0_3px_rgba(116,66,173,0.07)]
                      `
                      : `
                        border-transparent
                        bg-[#F5F5F6]
                      `
                  }
                `}
              >
                <Search
                  size={18}
                  className="
                    mr-2.5
                    shrink-0
                    text-[#6D6572]
                  "
                />

                <input
                  value={pickupQuery}
                  onFocus={() =>
                    setActiveField(
                      "pickup",
                    )
                  }
                  onChange={(event) => {
                    setPickupQuery(
                      event.target.value,
                    );

                    setActiveField(
                      "pickup",
                    );
                  }}
                  placeholder="Pickup location"
                  className="
                    min-w-0 flex-1
                    bg-transparent
                    text-[16px]
                    outline-none
                    placeholder:text-[#AAA5AE]
                  "
                />

                {pickupQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setPickupQuery("");
                      setPickup(null);
                    }}
                    className="
                      flex h-8 w-8
                      items-center
                      justify-center
                      rounded-full
                      text-[#A09AA5]
                      hover:bg-black/5
                    "
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={handleSwap}
            whileTap={{
              rotate: 180,
              scale: 0.88,
            }}
            transition={{
              type: "spring",
              stiffness: 330,
              damping: 18,
            }}
            className="
              absolute right-7
              top-[82px]
              z-10 flex
              h-10 w-10
              items-center
              justify-center
              rounded-full
              border border-[#E5DCEB]
              bg-white
              text-[#7442AD]
              shadow-[0_4px_16px_rgba(44,27,58,0.10)]
            "
          >
            <ArrowUpDown
              size={18}
              strokeWidth={2}
            />
          </motion.button>

          <div className="mt-3 flex gap-3">
            <MapPin
              size={17}
              fill="#7442AD"
              stroke="#7442AD"
              className="
                mt-[22px]
                shrink-0
              "
            />

            <div className="min-w-0 flex-1">
              <p
                className="
                  mb-1 text-[12px]
                  font-medium
                  text-[#9A949F]
                "
              >
                Destination
              </p>

              <div
                className={`
                  flex h-[52px]
                  items-center
                  rounded-[12px]
                  border px-3
                  transition-all

                  ${
                    activeField ===
                    "destination"
                      ? `
                        border-[#A67BD2]
                        bg-white
                        shadow-[0_0_0_3px_rgba(116,66,173,0.07)]
                      `
                      : `
                        border-transparent
                        bg-[#F5F5F6]
                      `
                  }
                `}
              >
                <Search
                  size={18}
                  className="
                    mr-2.5
                    shrink-0
                    text-[#6D6572]
                  "
                />

                <input
                  autoFocus
                  value={
                    destinationQuery
                  }
                  onFocus={() =>
                    setActiveField(
                      "destination",
                    )
                  }
                  onChange={(event) => {
                    setDestinationQuery(
                      event.target.value,
                    );

                    setActiveField(
                      "destination",
                    );
                  }}
                  placeholder="Where to?"
                  className="
                    min-w-0 flex-1
                    bg-transparent
                    text-[16px]
                    outline-none
                    placeholder:text-[#AAA5AE]
                  "
                />

                {destinationQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setDestinationQuery(
                        "",
                      );

                      setDestination(null);
                    }}
                    className="
                      flex h-8 w-8
                      items-center
                      justify-center
                      rounded-full
                      text-[#A09AA5]
                      hover:bg-black/5
                    "
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {ride.stops.map(
              (stop, index) => (
                <motion.div
                  key={stop.id}
                  initial={{
                    opacity: 0,
                    height: 0,
                    y: -10,
                  }}
                  animate={{
                    opacity: 1,
                    height: "auto",
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    height: 0,
                  }}
                  className="
                    ml-[29px]
                    mt-3 flex
                    items-center gap-2
                  "
                >
                  <div
                    className="
                      flex h-[48px]
                      flex-1 items-center
                      rounded-[12px]
                      bg-[#F5F5F6]
                      px-3
                    "
                  >
                    <MapPin
                      size={17}
                      className="
                        mr-2
                        text-[#7442AD]
                      "
                    />

                    <span
                      className="
                        min-w-0 flex-1
                        truncate
                        text-[15px]
                      "
                    >
                      {stop.label ||
                        `Stop ${
                          index + 1
                        }`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeStop(stop.id)
                    }
                    className="
                      flex h-10 w-10
                      items-center
                      justify-center
                      rounded-full
                      bg-[#F5F2F8]
                      text-[#7442AD]
                    "
                  >
                    <X size={17} />
                  </button>
                </motion.div>
              ),
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            whileTap={{
              scale: 0.97,
            }}
            // onClick={() => {
            //   addStop({
            //     id:
            //       crypto.randomUUID(),

            //     label: "New stop",

            //     address: "",

            //     coordinates: null,
            //   });
            // }}
            onClick={() =>
  setAddStopOpen(true)
}
            className="
              ml-[28px] mt-4
              flex items-center
              gap-2
              text-[14px]
              font-semibold
              text-[#7442AD]
            "
          >
            <span
              className="
                flex h-8 w-8
                items-center
                justify-center
                rounded-full
                bg-[#F1E9F8]
              "
            >
              <Plus size={17} />
            </span>

            Add stop
          </motion.button>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeField && (
            <motion.div
              key={activeField}
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              className="mt-6"
            >
              <button
                type="button"
                onClick={
                  handleCurrentLocation
                }
                className="
                  flex w-full
                  items-center gap-3
                  border-b
                  border-[#ECE9EF]
                  py-4 text-left
                "
              >
                <span
                  className="
                    flex h-10 w-10
                    shrink-0 items-center
                    justify-center
                    rounded-full
                    bg-[#EEE7F5]
                    text-[#7442AD]
                  "
                >
                  <Crosshair
                    size={19}
                  />
                </span>

                <span>
                  <span
                    className="
                      block text-[16px]
                      font-semibold
                    "
                  >
                    Use my current location
                  </span>

                  <span
                    className="
                      mt-0.5 block
                      text-[13px]
                      text-[#99939D]
                    "
                  >
                    Use your device location
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/passenger/ride/map-location",
                    {
                      state: {
                        target:
                          activeField,
                      },
                    },
                  )
                }
                className="
                  flex w-full
                  items-center gap-3
                  border-b
                  border-[#ECE9EF]
                  py-4 text-left
                "
              >
                <span
                  className="
                    flex h-10 w-10
                    items-center
                    justify-center
                    rounded-full
                    bg-[#EEE7F5]
                    text-[#7442AD]
                  "
                >
                  <Navigation
                    size={19}
                  />
                </span>

                <span
                  className="
                    text-[16px]
                    font-semibold
                  "
                >
                  Set location on map
                </span>
              </button>

              <h2
                className="
                  mb-2 mt-7
                  text-[18px]
                  font-semibold
                "
              >
                Recent destinations
              </h2>

              {filteredLocations.map(
                (location) => (
                  <motion.button
                    key={location.id}
                    type="button"
                    whileHover={{
                      x: 3,
                    }}
                    whileTap={{
                      scale: 0.99,
                    }}
                    onClick={() =>
                      chooseLocation(
                        location,
                      )
                    }
                    className="
                      flex w-full
                      items-center gap-3
                      border-b
                      border-[#EEEAF0]
                      py-4
                      text-left
                    "
                  >
                    <span
                      className="
                        flex h-10 w-10
                        shrink-0 items-center
                        justify-center
                        rounded-full
                        bg-[#F3F0F5]
                        text-[#77707C]
                      "
                    >
                      <MapPin
                        size={19}
                      />
                    </span>

                    <span className="min-w-0">
                      <span
                        className="
                          block truncate
                          text-[16px]
                          font-medium
                        "
                      >
                        {
                          location.label
                        }
                      </span>

                      <span
                        className="
                          mt-1 block
                          truncate
                          text-[13px]
                          text-[#99939D]
                        "
                      >
                        {
                          location.address
                        }
                      </span>
                    </span>
                  </motion.button>
                ),
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {ride.pickup &&
          ride.destination && (
            <motion.div
              initial={{
                y: 100,
                opacity: 0,
              }}
              animate={{
                y: 0,
                opacity: 1,
              }}
              exit={{
                y: 100,
                opacity: 0,
              }}
              className="
                fixed inset-x-0
                bottom-0 z-[700]
                border-t
                border-[#EEEAF0]
                bg-white/95
                px-5
                pb-[calc(18px+env(safe-area-inset-bottom))]
                pt-4
                backdrop-blur-xl
              "
            >
              <motion.button
                type="button"
                whileTap={{
                  scale: 0.98,
                }}
                onClick={
                  handleContinue
                }
                className="
                  mx-auto flex
                  h-[56px] w-full
                  max-w-[720px]
                  items-center
                  justify-center
                  rounded-[14px]
                  bg-[#7442AD]
                  text-[16px]
                  font-semibold
                  text-white
                  shadow-[0_10px_30px_rgba(116,66,173,0.22)]
                "
              >
                Find rides
              </motion.button>
            </motion.div>
          )}
      </AnimatePresence>


      <AddStopSheet
  open={addStopOpen}
  onClose={() =>
    setAddStopOpen(false)
  }
  suggestions={
    recentRideLocations
  }
  onAdd={(location) => {
    addStop({
      ...location,
      id:
        crypto.randomUUID(),
    });

    setAddStopOpen(false);
  }}
/>
    </div>
  );
}