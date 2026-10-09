import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  ArrowUpDown,
  Crosshair,
  LoaderCircle,
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

import {
  useNavigate,
} from "react-router-dom";

import { toast } from "sonner";

import RideHeader from "../../../components/passenger/ride/RideHeader";
import AddStopSheet from "../../../components/passenger/ride/AddStopSheet";

import {
  usePassengerRide,
} from "../../../context/PassengerRideContext";

import {
  usePassengerLocation,
} from "../../../hooks/passenger/usePassengerLocation";

import {
  passengerLocationApi,
} from "../../../api/passenger/location";

import {
  getPlaceDetails,
  searchPlaces,
  type PlaceSuggestion,
} from "../../../api/passenger/placeSearch";

import {
  passengerLocationToRideLocation,
  placeDetailsToRideLocation,
} from "../../../utils/passengerRideLocation";

import type {
  RideLocation,
} from "../../../types/passengerRide";

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

  const locationQuery =
    usePassengerLocation();

  const [
    activeField,
    setActiveField,
  ] =
    useState<ActiveLocationField>(
      ride.destination
        ? null
        : "destination",
    );

  const [
    pickupQuery,
    setPickupQuery,
  ] = useState(
    ride.pickup?.label ?? "",
  );

  const [
    destinationQuery,
    setDestinationQuery,
  ] = useState(
    ride.destination?.label ?? "",
  );

  const [
    suggestions,
    setSuggestions,
  ] = useState<PlaceSuggestion[]>([]);

  const [
    isSearching,
    setIsSearching,
  ] = useState(false);

  const [
    isResolvingPlace,
    setIsResolvingPlace,
  ] = useState(false);

  const [
    isGettingCurrentLocation,
    setIsGettingCurrentLocation,
  ] = useState(false);

  const [
    addStopOpen,
    setAddStopOpen,
  ] = useState(false);

  useEffect(() => {
    setRideStatus("planning");
  }, [setRideStatus]);

  /**
   * Hydrate pickup from the location
   * already stored by the backend.
   *
   * We intentionally do not request
   * browser GPS on page load.
   */
  useEffect(() => {
    if (ride.pickup) {
      return;
    }

    if (!locationQuery.data) {
      return;
    }

    const currentLocation =
      passengerLocationToRideLocation(
        locationQuery.data,
      );

    if (!currentLocation) {
      return;
    }

    setPickup(currentLocation);

    setPickupQuery(
      currentLocation.label,
    );
  }, [
    locationQuery.data,
    ride.pickup,
    setPickup,
  ]);

  /**
   * Keep text fields in sync when another
   * ride screen changes the ride context.
   *
   * Example:
   * "Set location on map".
   */
  useEffect(() => {
    if (ride.pickup) {
      setPickupQuery(
        ride.pickup.label,
      );
    }
  }, [ride.pickup]);

  useEffect(() => {
    if (ride.destination) {
      setDestinationQuery(
        ride.destination.label,
      );
    }
  }, [ride.destination]);

  /**
   * The query currently being edited.
   */
  const searchQuery = useMemo(
    () =>
      activeField === "pickup"
        ? pickupQuery
        : activeField ===
            "destination"
          ? destinationQuery
          : "",
    [
      activeField,
      pickupQuery,
      destinationQuery,
    ],
  );

  /**
   * Search is considered active once
   * the rider has typed enough text.
   */
  const hasSearchQuery =
    searchQuery.trim().length >= 3;

  /**
   * Real Google Places search.
   */
  useEffect(() => {
    const query =
      searchQuery.trim();

    if (
      !activeField ||
      query.length < 3
    ) {
      setSuggestions([]);
      setIsSearching(false);

      return;
    }

    const selectedLocation =
      activeField === "pickup"
        ? ride.pickup
        : ride.destination;

    /**
     * Avoid searching again immediately
     * after we fill the input with the
     * location that was just selected.
     */
    if (
      selectedLocation &&
      query === selectedLocation.label
    ) {
      setSuggestions([]);
      setIsSearching(false);

      return;
    }

    let cancelled = false;

    const timer =
      window.setTimeout(
        async () => {
          try {
            setIsSearching(true);

            const results =
              await searchPlaces(
                query,
              );

            if (!cancelled) {
              setSuggestions(
                results,
              );
            }
          } catch (error) {
            if (cancelled) {
              return;
            }

            console.error(
              "Place search failed:",
              error,
            );

            setSuggestions([]);

            toast.error(
              "Unable to search locations.",
            );
          } finally {
            if (!cancelled) {
              setIsSearching(false);
            }
          }
        },
        350,
      );

    return () => {
      cancelled = true;

      window.clearTimeout(
        timer,
      );
    };
  }, [
    searchQuery,
    activeField,
    ride.pickup,
    ride.destination,
  ]);

  /**
   * Apply a location to whichever field
   * the rider is currently editing.
   */
  const chooseLocation = (
    location: RideLocation,
  ) => {
    if (
      activeField === "pickup"
    ) {
      setPickup(location);

      setPickupQuery(
        location.label,
      );

      setSuggestions([]);

      /**
       * After pickup is chosen, immediately
       * move the rider to destination.
       */
      setActiveField(
        "destination",
      );

      return;
    }

    if (
      activeField ===
      "destination"
    ) {
      setDestination(location);

      setDestinationQuery(
        location.label,
      );

      setSuggestions([]);

      /**
       * Close location search once both
       * primary locations are selected.
       */
      setActiveField(null);
    }
  };

  /**
   * Resolve a Google suggestion into a
   * complete RideLocation.
   */
  const handleSuggestionSelect =
    async (
      suggestion: PlaceSuggestion,
    ) => {
      try {
        setIsResolvingPlace(true);

        const details =
          await getPlaceDetails(
            suggestion.placeId,
          );

        const location =
          placeDetailsToRideLocation(
            details,
          );

        chooseLocation(location);
      } catch (error) {
        console.error(
          "Place details failed:",
          error,
        );

        toast.error(
          "Unable to select this location.",
        );
      } finally {
        setIsResolvingPlace(false);
      }
    };

  /**
   * Use current location.
   *
   * First try the location already stored
   * for this rider.
   *
   * Only request browser GPS when no
   * usable persisted location exists.
   */
  const handleCurrentLocation =
    () => {
      const persisted =
        locationQuery.data
          ? passengerLocationToRideLocation(
              locationQuery.data,
            )
          : null;

      if (persisted) {
        chooseLocation(
          persisted,
        );

        return;
      }

      if (
        !navigator.geolocation
      ) {
        toast.error(
          "Location is not supported on this device.",
        );

        return;
      }

      setIsGettingCurrentLocation(
        true,
      );

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const {
              latitude,
              longitude,
              accuracy,
              heading,
              speed,
            } = position.coords;

            const updated =
              await passengerLocationApi.updateLocation(
                {
                  lat: latitude,
                  lng: longitude,
                  accuracy,

                  ...(heading !==
                    null &&
                  Number.isFinite(
                    heading,
                  )
                    ? { heading }
                    : {}),

                  ...(speed !==
                    null &&
                  Number.isFinite(
                    speed,
                  )
                    ? { speed }
                    : {}),
                },
              );

            const currentLocation =
              passengerLocationToRideLocation(
                updated,
              );

            if (
              !currentLocation
            ) {
              throw new Error(
                "Backend returned an incomplete location.",
              );
            }

            chooseLocation(
              currentLocation,
            );

            await locationQuery.refetch();

            toast.success(
              "Current location updated.",
            );
          } catch (error) {
            console.error(
              "Current location update failed:",
              error,
            );

            toast.error(
              "Unable to update your current location.",
            );
          } finally {
            setIsGettingCurrentLocation(
              false,
            );
          }
        },

        (error) => {
          setIsGettingCurrentLocation(
            false,
          );

          if (error.code === 1) {
            toast.error(
              "Location permission was denied.",
            );

            return;
          }

          if (error.code === 2) {
            toast.error(
              "Your location is currently unavailable.",
            );

            return;
          }

          if (error.code === 3) {
            toast.error(
              "Location request timed out.",
            );

            return;
          }

          toast.error(
            "Unable to get your current location.",
          );
        },

        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        },
      );
    };

  /**
   * Swap pickup and destination.
   */
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

    setSuggestions([]);
  };

  /**
   * Open map-location selector for
   * whichever field is currently active.
   */
  const handleMapLocation =
    () => {
      if (!activeField) {
        return;
      }

      navigate(
        "/passenger/ride/map-location",
        {
          state: {
            target:
              activeField,
          },
        },
      );
    };

  /**
   * Validate planning data before
   * continuing to ride selection.
   */
  const handleContinue = () => {
    if (!ride.pickup) {
      toast.error(
        "Choose your pickup location.",
      );

      return;
    }

    if (!ride.destination) {
      toast.error(
        "Choose your destination.",
      );

      return;
    }

    if (
      !ride.pickup.coordinates
    ) {
      toast.error(
        "Pickup coordinates are unavailable.",
      );

      return;
    }

    if (
      !ride.destination
        .coordinates
    ) {
      toast.error(
        "Destination coordinates are unavailable.",
      );

      return;
    }

    const invalidStop =
      ride.stops.some(
        (stop) =>
          !stop.coordinates &&
          !stop.address &&
          !stop.savedPlaceId,
      );

    if (invalidStop) {
      toast.error(
        "One of your stops does not have a valid location.",
      );

      return;
    }

    setRideStatus(
      "selecting",
    );

    navigate(
      "/passenger/ride/select",
    );
  };

  /**
   * Whether both main route points
   * have been selected.
   */
  const canContinue =
    Boolean(
      ride.pickup &&
        ride.destination,
    );

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
        {/* ROUTE CARD */}

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
            relative
            rounded-[22px]
            bg-white
            p-4
            shadow-[0_10px_40px_rgba(32,22,40,0.06)]
          "
        >
          {/* CONNECTING LINE */}

          <div
            className="
              absolute
              left-[31px]
              top-[53px]
              h-[52px]
              border-l-2
              border-dotted
              border-[#CAC2D1]
            "
          />

          {/* PICKUP */}

          <div className="flex gap-3">
            <div
              className="
                mt-[21px]
                h-3 w-3
                shrink-0
                rounded-full
                border-[3px]
                border-[#7442AD]
                bg-white
              "
            />

            <div className="flex-1 min-w-0">
              <p
                className="
                  mb-1
                  text-[13px]
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
                  value={
                    pickupQuery
                  }
                  onFocus={() => {
                    setActiveField(
                      "pickup",
                    );

                    setSuggestions(
                      [],
                    );
                  }}
                  onChange={(
                    event,
                  ) => {
                    setPickupQuery(
                      event.target
                        .value,
                    );

                    setPickup(null);

                    setActiveField(
                      "pickup",
                    );
                  }}
                  placeholder="Pickup location"
                  className="
                    min-w-0
                    flex-1
                    bg-transparent
                    text-[16px]
                    text-[#302B34]
                    outline-none
                    placeholder:text-[#AAA5AE]
                  "
                />

                {pickupQuery && (
                  <button
                    type="button"
                    aria-label="Clear pickup"
                    onClick={() => {
                      setPickupQuery(
                        "",
                      );

                      setPickup(null);

                      setSuggestions(
                        [],
                      );

                      setActiveField(
                        "pickup",
                      );
                    }}
                    className="
                      flex h-8 w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      text-[#A09AA5]
                      transition-colors
                      hover:bg-black/5
                    "
                  >
                    <X
                      size={16}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SWAP */}

          <motion.button
            type="button"
            aria-label="Swap pickup and destination"
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
              absolute
              right-7
              top-[82px]
              z-10
              flex h-10 w-10
              items-center
              justify-center
              rounded-full
              border
              border-[#E5DCEB]
              bg-white
              text-[#7442AD]
              shadow-[0_4px_16px_rgba(44,27,58,0.10)]
            "
          >
            <ArrowUpDown
              size={18}
            />
          </motion.button>

          {/* DESTINATION */}

          <div className="flex gap-3 mt-3">
            <MapPin
              size={17}
              fill="#7442AD"
              stroke="#7442AD"
              className="
                mt-[22px]
                shrink-0
              "
            />

            <div className="flex-1 min-w-0">
              <p
                className="
                  mb-1
                  text-[13px]
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
                  border
                  px-3
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
                  autoFocus={
                    !ride.destination
                  }
                  value={
                    destinationQuery
                  }
                  onFocus={() => {
                    setActiveField(
                      "destination",
                    );

                    setSuggestions(
                      [],
                    );
                  }}
                  onChange={(
                    event,
                  ) => {
                    setDestinationQuery(
                      event.target
                        .value,
                    );

                    setDestination(
                      null,
                    );

                    setActiveField(
                      "destination",
                    );
                  }}
                  placeholder="Where to?"
                  className="
                    min-w-0
                    flex-1
                    bg-transparent
                    text-[16px]
                    text-[#302B34]
                    outline-none
                    placeholder:text-[#AAA5AE]
                  "
                />

                {destinationQuery && (
                  <button
                    type="button"
                    aria-label="Clear destination"
                    onClick={() => {
                      setDestinationQuery(
                        "",
                      );

                      setDestination(
                        null,
                      );

                      setSuggestions(
                        [],
                      );

                      setActiveField(
                        "destination",
                      );
                    }}
                    className="
                      flex h-8 w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      text-[#A09AA5]
                      transition-colors
                      hover:bg-black/5
                    "
                  >
                    <X
                      size={16}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* STOPS */}

          <AnimatePresence>
            {ride.stops.map(
              (
                stop,
                index,
              ) => (
                <motion.div
                  key={stop.id}
                  initial={{
                    opacity: 0,
                    height: 0,
                    y: -10,
                  }}
                  animate={{
                    opacity: 1,
                    height:
                      "auto",
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    height: 0,
                  }}
                  className="
                    ml-[29px]
                    mt-3
                    flex
                    items-center
                    gap-2
                  "
                >
                  <div
                    className="
                      flex h-[48px]
                      min-w-0
                      flex-1
                      items-center
                      rounded-[12px]
                      bg-[#F5F5F6]
                      px-3
                    "
                  >
                    <MapPin
                      size={17}
                      className="
                        mr-2
                        shrink-0
                        text-[#7442AD]
                      "
                    />

                    <span
                      className="
                        min-w-0
                        flex-1
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

                  <motion.button
                    type="button"
                    whileTap={{
                      scale: 0.9,
                    }}
                    aria-label={`Remove stop ${
                      index + 1
                    }`}
                    onClick={() =>
                      removeStop(
                        stop.id,
                      )
                    }
                    className="
                      flex h-10 w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-[#F5F2F8]
                      text-[#7442AD]
                    "
                  >
                    <X
                      size={17}
                    />
                  </motion.button>
                </motion.div>
              ),
            )}
          </AnimatePresence>

          {/* ADD STOP */}

          <motion.button
            type="button"
            whileTap={{
              scale: 0.97,
            }}
            onClick={() =>
              setAddStopOpen(
                true,
              )
            }
            className="
              ml-[28px]
              mt-4
              flex
              items-center
              gap-2
              text-[15px]
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
              <Plus
                size={17}
              />
            </span>

            Add stop
          </motion.button>
        </motion.div>

        {/* LOCATION SEARCH AREA */}

        <AnimatePresence
          mode="wait"
        >
          {activeField && (
            <motion.section
              key={activeField}
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -6,
              }}
              transition={{
                duration: 0.18,
              }}
              className="mt-3"
            >
              {/*
               * Once the rider starts searching,
               * results are the primary content.
               *
               * This is intentionally ABOVE
               * current-location/map actions.
               */}
              {hasSearchQuery ? (
                <>
                  <SearchResults
                    suggestions={
                      suggestions
                    }
                    isSearching={
                      isSearching
                    }
                    isResolving={
                      isResolvingPlace
                    }
                    onSelect={
                      handleSuggestionSelect
                    }
                  />

                  <div
                    className="
                      mt-2
                      overflow-hidden
                      rounded-[16px]
                      bg-white
                    "
                  >
                    <LocationAction
                      icon={
                        isGettingCurrentLocation ? (
                          <LoaderCircle
                            size={
                              19
                            }
                            className="animate-spin"
                          />
                        ) : (
                          <Crosshair
                            size={
                              19
                            }
                          />
                        )
                      }
                      title="Use my current location"
                      onClick={
                        handleCurrentLocation
                      }
                      disabled={
                        isGettingCurrentLocation
                      }
                    />

                    <LocationAction
                      icon={
                        <Navigation
                          size={
                            19
                          }
                        />
                      }
                      title="Set location on map"
                      onClick={
                        handleMapLocation
                      }
                      showDivider={
                        false
                      }
                    />
                  </div>
                </>
              ) : (
                <>
                  {/*
                   * No query yet.
                   *
                   * Show quick location actions,
                   * followed by the rider's
                   * recent-destination area.
                   */}
                  <div
                    className="
                      overflow-hidden
                      rounded-[16px]
                      bg-white
                    "
                  >
                    <LocationAction
                      icon={
                        isGettingCurrentLocation ? (
                          <LoaderCircle
                            size={
                              19
                            }
                            className="animate-spin"
                          />
                        ) : (
                          <Crosshair
                            size={
                              19
                            }
                          />
                        )
                      }
                      title="Use my current location"
                      subtitle={
                        locationQuery
                          .data
                          ?.locationEnabled
                          ? "Use your saved current location"
                          : "Use your device location"
                      }
                      onClick={
                        handleCurrentLocation
                      }
                      disabled={
                        isGettingCurrentLocation
                      }
                    />

                    <LocationAction
                      icon={
                        <Navigation
                          size={
                            19
                          }
                        />
                      }
                      title="Set location on map"
                      onClick={
                        handleMapLocation
                      }
                      showDivider={
                        false
                      }
                    />
                  </div>

                  <RecentDestinations />
                </>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* CONTINUE */}

      <AnimatePresence>
        {canContinue && (
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
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 26,
            }}
            className="
              fixed
              inset-x-0
              bottom-0
              z-[700]
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
                mx-auto
                flex
                h-[56px]
                w-full
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

      {/* ADD STOP */}

      <AddStopSheet
        open={addStopOpen}
        onClose={() =>
          setAddStopOpen(false)
        }
        onAdd={(location) => {
          addStop({
            ...location,

            id:
              crypto.randomUUID(),
          });

          setAddStopOpen(
            false,
          );
        }}
      />
    </div>
  );
}

/* ======================================================
   LOCATION ACTION
====================================================== */

interface LocationActionProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;

  disabled?: boolean;

  showDivider?: boolean;

  onClick: () => void;
}

function LocationAction({
  icon,
  title,
  subtitle,

  disabled = false,

  showDivider = true,

  onClick,
}: LocationActionProps) {
  return (
    <motion.button
      type="button"
      whileTap={
        disabled
          ? undefined
          : {
              scale: 0.99,
            }
      }
      disabled={disabled}
      onClick={onClick}
      className={`
        flex
        w-full
        items-center
        gap-3
        bg-white
        px-4
        py-4
        text-left
        transition-colors
        hover:bg-[#FBFAFC]
        disabled:cursor-not-allowed
        disabled:opacity-60

        ${
          showDivider
            ? "border-b border-[#ECE9EF]"
            : ""
        }
      `}
    >
      <span
        className="
          flex h-10 w-10
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-[#EEE7F5]
          text-[#7442AD]
        "
      >
        {icon}
      </span>

      <span
        className="flex-1 min-w-0 "
      >
        <span
          className="
            block
            text-[16px]
            font-semibold
            text-[#302B34]
          "
        >
          {title}
        </span>

        {subtitle && (
          <span
            className="
              mt-0.5
              block
              text-[14px]
              text-[#99939D]
            "
          >
            {subtitle}
          </span>
        )}
      </span>
    </motion.button>
  );
}

/* ======================================================
   SEARCH RESULTS
====================================================== */

interface SearchResultsProps {
  suggestions:
    PlaceSuggestion[];

  isSearching: boolean;

  isResolving: boolean;

  onSelect: (
    suggestion: PlaceSuggestion,
  ) => void;
}

function SearchResults({
  suggestions,

  isSearching,

  isResolving,

  onSelect,
}: SearchResultsProps) {
  if (isSearching) {
    return (
      <div
        className="
          flex
          min-h-[90px]
          items-center
          justify-center
          gap-2
          rounded-[16px]
          bg-white
          px-4
          text-[15px]
          text-[#8F8993]
        "
      >
        <LoaderCircle
          size={18}
          className="animate-spin"
        />

        Searching locations...
      </div>
    );
  }

  if (
    suggestions.length === 0
  ) {
    return (
      <div
        className="
          flex
          min-h-[100px]
          flex-col
          items-center
          justify-center
          rounded-[16px]
          bg-white
          px-4
          text-center
        "
      >
        <MapPin
          size={23}
          className="
            text-[#B8B1BC]
          "
        />

        <p
          className="
            mt-2
            text-[15px]
            text-[#8F8993]
          "
        >
          No matching locations
          found.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 5,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
        overflow-hidden
        rounded-[16px]
        bg-white
        shadow-[0_8px_28px_rgba(32,22,40,0.06)]
      "
    >
      {suggestions.map(
        (
          suggestion,
          index,
        ) => (
          <motion.button
            key={
              suggestion.placeId
            }
            type="button"
            whileTap={{
              scale: 0.99,
            }}
            disabled={
              isResolving
            }
            onClick={() =>
              onSelect(
                suggestion,
              )
            }
            className={`
              flex
              w-full
              items-center
              gap-3
              px-4
              py-4
              text-left
              transition-colors
              hover:bg-[#FAF8FB]
              disabled:opacity-50

              ${
                index <
                suggestions.length -
                  1
                  ? "border-b border-[#EEEAF0]"
                  : ""
              }
            `}
          >
            <span
              className="
                flex h-10 w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#F3F0F5]
                text-[#7442AD]
              "
            >
              <MapPin
                size={19}
              />
            </span>

            <span
              className="flex-1 min-w-0 "
            >
              <span
                className="
                  block
                  truncate
                  text-[16px]
                  font-semibold
                  text-[#302B34]
                "
              >
                {
                  suggestion.label
                }
              </span>

              {suggestion.address && (
                <span
                  className="
                    mt-1
                    block
                    truncate
                    text-[14px]
                    text-[#99939D]
                  "
                >
                  {
                    suggestion.address
                  }
                </span>
              )}
            </span>

            {isResolving && (
              <LoaderCircle
                size={17}
                className="
                  shrink-0
                  animate-spin
                  text-[#7442AD]
                "
              />
            )}
          </motion.button>
        ),
      )}
    </motion.div>
  );
}

/* ======================================================
   RECENT DESTINATIONS
====================================================== */

function RecentDestinations() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="mt-7"
    >
      <h2
        className="
          text-[18px]
          font-semibold
          text-[#302B34]
        "
      >
        Recent destinations
      </h2>

      {/*
       * This intentionally remains an empty
       * state until we connect real recent
       * destination data.
       *
       * Do not hardcode fake places.
       */}
      <div
        className="
          mt-4
          rounded-[18px]
          border
          border-[#ECE8EF]
          bg-white
          px-5
          py-7
          text-center
        "
      >
        <span
          className="
            mx-auto
            flex h-11 w-11
            items-center
            justify-center
            rounded-full
            bg-[#F3EDF8]
            text-[#7442AD]
          "
        >
          <MapPin
            size={22}
          />
        </span>

        <p
          className="
            mt-3
            text-[16px]
            font-semibold
            text-[#302B34]
          "
        >
          No recent destinations
        </p>

        <p
          className="
            mx-auto
            mt-1
            max-w-[310px]
            text-[14px]
            leading-5
            text-[#99939D]
          "
        >
          Places from your recent
          rides will appear here for
          quicker booking.
        </p>
      </div>
    </motion.div>
  );
}

// import {
//   AnimatePresence,
//   motion,
// } from "framer-motion";

// import {
//   ArrowUpDown,
//   Crosshair,
//   LoaderCircle,
//   MapPin,
//   Navigation,
//   Plus,
//   Search,
//   X,
// } from "lucide-react";

// import {
//   useEffect,
//   useMemo,
//   useState,
// } from "react";

// import {
//   useNavigate,
// } from "react-router-dom";

// import { toast } from "sonner";

// import RideHeader from "../../../components/passenger/ride/RideHeader";
// import AddStopSheet from "../../../components/passenger/ride/AddStopSheet";

// import {
//   usePassengerRide,
// } from "../../../context/PassengerRideContext";

// import {
//   usePassengerLocation,
// } from "../../../hooks/passenger/usePassengerLocation";

// import {
//   passengerLocationApi,
// } from "../../../api/passenger/location";

// import {
//   getPlaceDetails,
//   searchPlaces,
//   type PlaceSuggestion,
// } from "../../../api/passenger/placeSearch";

// import {
//   passengerLocationToRideLocation,
//   placeDetailsToRideLocation,
// } from "../../../utils/passengerRideLocation";

// import type {
//   RideLocation,
// } from "../../../types/passengerRide";

// type ActiveLocationField =
//   | "pickup"
//   | "destination"
//   | null;

// export default function BookRide() {
//   const navigate = useNavigate();

//   const {
//     ride,

//     setPickup,
//     setDestination,

//     swapLocations,

//     addStop,
//     removeStop,

//     setRideStatus,
//   } = usePassengerRide();

//   const locationQuery =
//     usePassengerLocation();

//   const [
//     activeField,
//     setActiveField,
//   ] =
//     useState<ActiveLocationField>(
//       ride.destination
//         ? null
//         : "destination",
//     );

//   const [
//     pickupQuery,
//     setPickupQuery,
//   ] = useState(
//     ride.pickup?.label ?? "",
//   );

//   const [
//     destinationQuery,
//     setDestinationQuery,
//   ] = useState(
//     ride.destination?.label ?? "",
//   );

//   const [
//     suggestions,
//     setSuggestions,
//   ] = useState<PlaceSuggestion[]>([]);

//   const [
//     isSearching,
//     setIsSearching,
//   ] = useState(false);

//   const [
//     isResolvingPlace,
//     setIsResolvingPlace,
//   ] = useState(false);

//   const [
//     isGettingCurrentLocation,
//     setIsGettingCurrentLocation,
//   ] = useState(false);

//   const [
//     addStopOpen,
//     setAddStopOpen,
//   ] = useState(false);

//   useEffect(() => {
//     setRideStatus("planning");
//   }, [setRideStatus]);

//   /**
//    * Hydrate the pickup using the
//    * rider's location stored by the backend.
//    *
//    * Do NOT request browser location here.
//    */
//   useEffect(() => {
//     if (ride.pickup) {
//       return;
//     }

//     if (!locationQuery.data) {
//       return;
//     }

//     const currentLocation =
//       passengerLocationToRideLocation(
//         locationQuery.data,
//       );

//     if (!currentLocation) {
//       return;
//     }

//     setPickup(currentLocation);

//     setPickupQuery(
//       currentLocation.label,
//     );
//   }, [
//     locationQuery.data,
//     ride.pickup,
//     setPickup,
//   ]);

//   /**
//    * Keep text inputs synchronized when
//    * another screen modifies ride context,
//    * e.g. Set Location on Map.
//    */
//   useEffect(() => {
//     if (ride.pickup) {
//       setPickupQuery(
//         ride.pickup.label,
//       );
//     }
//   }, [ride.pickup]);

//   useEffect(() => {
//     if (ride.destination) {
//       setDestinationQuery(
//         ride.destination.label,
//       );
//     }
//   }, [ride.destination]);

//   const searchQuery = useMemo(
//     () =>
//       activeField === "pickup"
//         ? pickupQuery
//         : activeField ===
//             "destination"
//           ? destinationQuery
//           : "",
//     [
//       activeField,
//       pickupQuery,
//       destinationQuery,
//     ],
//   );

//   /**
//    * Real Google Places search.
//    */
//   useEffect(() => {
//     const query =
//       searchQuery.trim();

//     if (
//       !activeField ||
//       query.length < 3
//     ) {
//       setSuggestions([]);
//       setIsSearching(false);
//       return;
//     }

//     const selectedLocation =
//       activeField === "pickup"
//         ? ride.pickup
//         : ride.destination;

//     /**
//      * Prevent another Google request just
//      * because we populated the input after
//      * selecting a place.
//      */
//     if (
//       selectedLocation &&
//       query ===
//         selectedLocation.label
//     ) {
//       setSuggestions([]);
//       setIsSearching(false);
//       return;
//     }

//     let cancelled = false;

//     const timer =
//       window.setTimeout(
//         async () => {
//           try {
//             setIsSearching(true);

//             const results =
//               await searchPlaces(
//                 query,
//               );

//             if (!cancelled) {
//               setSuggestions(
//                 results,
//               );
//             }
//           } catch (error) {
//             if (cancelled) {
//               return;
//             }

//             console.error(
//               "Place search failed:",
//               error,
//             );

//             setSuggestions([]);

//             toast.error(
//               "Unable to search locations.",
//             );
//           } finally {
//             if (!cancelled) {
//               setIsSearching(false);
//             }
//           }
//         },
//         350,
//       );

//     return () => {
//       cancelled = true;

//       window.clearTimeout(
//         timer,
//       );
//     };
//   }, [
//     searchQuery,
//     activeField,
//     ride.pickup,
//     ride.destination,
//   ]);

//   const chooseLocation = (
//     location: RideLocation,
//   ) => {
//     if (
//       activeField === "pickup"
//     ) {
//       setPickup(location);

//       setPickupQuery(
//         location.label,
//       );

//       setSuggestions([]);

//       setActiveField(
//         "destination",
//       );

//       return;
//     }

//     if (
//       activeField ===
//       "destination"
//     ) {
//       setDestination(location);

//       setDestinationQuery(
//         location.label,
//       );

//       setSuggestions([]);

//       setActiveField(null);
//     }
//   };

//   const handleSuggestionSelect =
//     async (
//       suggestion: PlaceSuggestion,
//     ) => {
//       try {
//         setIsResolvingPlace(true);

//         const details =
//           await getPlaceDetails(
//             suggestion.placeId,
//           );

//         const location =
//           placeDetailsToRideLocation(
//             details,
//           );

//         chooseLocation(location);
//       } catch (error) {
//         console.error(
//           "Place details failed:",
//           error,
//         );

//         toast.error(
//           "Unable to select this location.",
//         );
//       } finally {
//         setIsResolvingPlace(false);
//       }
//     };

//   /**
//    * "Use current location"
//    *
//    * First use backend-persisted location.
//    * Only request device GPS when no usable
//    * backend location exists.
//    */
//   const handleCurrentLocation =
//     () => {
//       const persisted =
//         locationQuery.data
//           ? passengerLocationToRideLocation(
//               locationQuery.data,
//             )
//           : null;

//       if (persisted) {
//         chooseLocation(
//           persisted,
//         );

//         return;
//       }

//       if (
//         !navigator.geolocation
//       ) {
//         toast.error(
//           "Location is not supported on this device.",
//         );

//         return;
//       }

//       setIsGettingCurrentLocation(
//         true,
//       );

//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           try {
//             const {
//               latitude,
//               longitude,
//               accuracy,
//               heading,
//               speed,
//             } = position.coords;

//             const updated =
//               await passengerLocationApi.updateLocation(
//                 {
//                   lat: latitude,
//                   lng: longitude,
//                   accuracy,

//                   ...(heading !==
//                     null &&
//                   Number.isFinite(
//                     heading,
//                   )
//                     ? { heading }
//                     : {}),

//                   ...(speed !== null &&
//                   Number.isFinite(
//                     speed,
//                   )
//                     ? { speed }
//                     : {}),
//                 },
//               );

//             const currentLocation =
//               passengerLocationToRideLocation(
//                 updated,
//               );

//             if (
//               !currentLocation
//             ) {
//               throw new Error(
//                 "Backend returned an incomplete location.",
//               );
//             }

//             chooseLocation(
//               currentLocation,
//             );

//             await locationQuery.refetch();

//             toast.success(
//               "Current location updated.",
//             );
//           } catch (error) {
//             console.error(
//               "Current location update failed:",
//               error,
//             );

//             toast.error(
//               "Unable to update your current location.",
//             );
//           } finally {
//             setIsGettingCurrentLocation(
//               false,
//             );
//           }
//         },

//         (error) => {
//           setIsGettingCurrentLocation(
//             false,
//           );

//           if (error.code === 1) {
//             toast.error(
//               "Location permission was denied.",
//             );

//             return;
//           }

//           if (error.code === 2) {
//             toast.error(
//               "Your location is currently unavailable.",
//             );

//             return;
//           }

//           if (error.code === 3) {
//             toast.error(
//               "Location request timed out.",
//             );

//             return;
//           }

//           toast.error(
//             "Unable to get your current location.",
//           );
//         },

//         {
//           enableHighAccuracy: true,
//           timeout: 12000,
//           maximumAge: 0,
//         },
//       );
//     };

//   const handleSwap = () => {
//     swapLocations();

//     const previousPickup =
//       pickupQuery;

//     setPickupQuery(
//       destinationQuery,
//     );

//     setDestinationQuery(
//       previousPickup,
//     );

//     setSuggestions([]);
//   };

//   const handleMapLocation =
//     () => {
//       if (!activeField) {
//         return;
//       }

//       navigate(
//         "/passenger/ride/map-location",
//         {
//           state: {
//             target:
//               activeField,
//           },
//         },
//       );
//     };

//   const handleContinue = () => {
//     if (!ride.pickup) {
//       toast.error(
//         "Choose your pickup location.",
//       );

//       return;
//     }

//     if (!ride.destination) {
//       toast.error(
//         "Choose your destination.",
//       );

//       return;
//     }

//     if (
//       !ride.pickup.coordinates
//     ) {
//       toast.error(
//         "Pickup coordinates are unavailable.",
//       );

//       return;
//     }

//     if (
//       !ride.destination
//         .coordinates
//     ) {
//       toast.error(
//         "Destination coordinates are unavailable.",
//       );

//       return;
//     }

//     const invalidStop =
//       ride.stops.some(
//         (stop) =>
//           !stop.coordinates &&
//           !stop.address &&
//           !stop.savedPlaceId,
//       );

//     if (invalidStop) {
//       toast.error(
//         "One of your stops does not have a valid location.",
//       );

//       return;
//     }

//     setRideStatus(
//       "selecting",
//     );

//     navigate(
//       "/passenger/ride/select",
//     );
//   };

//   const hasSearchQuery =
//     searchQuery.trim().length >=
//     3;

//   return (
//     <div
//       className="
//         min-h-[100dvh]
//         bg-[#F8F8FA]
//         text-[#302B34]
//       "
//     >
//       <RideHeader
//         title="Where are you going?"
//       />

//       <main
//         className="
//           mx-auto w-full
//           max-w-[760px]
//           px-4 pb-36 pt-5
//           sm:px-6
//         "
//       >
//         <motion.div
//           initial={{
//             opacity: 0,
//             y: 16,
//           }}
//           animate={{
//             opacity: 1,
//             y: 0,
//           }}
//           className="
//             relative
//             rounded-[22px]
//             bg-white p-4
//             shadow-[0_10px_40px_rgba(32,22,40,0.06)]
//           "
//         >
//           <div
//             className="
//               absolute
//               left-[31px]
//               top-[53px]
//               h-[52px]
//               border-l-2
//               border-dotted
//               border-[#CAC2D1]
//             "
//           />

//           {/* PICKUP */}

//           <div className="flex gap-3">
//             <div
//               className="
//                 mt-[21px]
//                 h-3 w-3
//                 shrink-0
//                 rounded-full
//                 border-[3px]
//                 border-[#7442AD]
//                 bg-white
//               "
//             />

//             <div className="flex-1 min-w-0">
//               <p
//                 className="
//                   mb-1
//                   text-[13px]
//                   font-medium
//                   text-[#9A949F]
//                 "
//               >
//                 Pickup
//               </p>

//               <div
//                 className={`
//                   flex h-[52px]
//                   items-center
//                   rounded-[12px]
//                   border px-3
//                   transition-all

//                   ${
//                     activeField ===
//                     "pickup"
//                       ? `
//                           border-[#A67BD2]
//                           bg-white
//                           shadow-[0_0_0_3px_rgba(116,66,173,0.07)]
//                         `
//                       : `
//                           border-transparent
//                           bg-[#F5F5F6]
//                         `
//                   }
//                 `}
//               >
//                 <Search
//                   size={18}
//                   className="
//                     mr-2.5
//                     shrink-0
//                     text-[#6D6572]
//                   "
//                 />

//                 <input
//                   value={
//                     pickupQuery
//                   }
//                   onFocus={() =>
//                     setActiveField(
//                       "pickup",
//                     )
//                   }
//                   onChange={(
//                     event,
//                   ) => {
//                     setPickupQuery(
//                       event.target
//                         .value,
//                     );

//                     setPickup(null);

//                     setActiveField(
//                       "pickup",
//                     );
//                   }}
//                   placeholder="Pickup location"
//                   className="
//                     min-w-0 flex-1
//                     bg-transparent
//                     text-[16px]
//                     outline-none
//                     placeholder:text-[#AAA5AE]
//                   "
//                 />

//                 {pickupQuery && (
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setPickupQuery(
//                         "",
//                       );

//                       setPickup(null);

//                       setSuggestions(
//                         [],
//                       );

//                       setActiveField(
//                         "pickup",
//                       );
//                     }}
//                     className="
//                       flex h-8 w-8
//                       items-center
//                       justify-center
//                       rounded-full
//                       text-[#A09AA5]
//                       hover:bg-black/5
//                     "
//                   >
//                     <X
//                       size={16}
//                     />
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* SWAP */}

//           <motion.button
//             type="button"
//             onClick={handleSwap}
//             whileTap={{
//               rotate: 180,
//               scale: 0.88,
//             }}
//             transition={{
//               type: "spring",
//               stiffness: 330,
//               damping: 18,
//             }}
//             className="
//               absolute
//               right-7
//               top-[82px]
//               z-10
//               flex h-10 w-10
//               items-center
//               justify-center
//               rounded-full
//               border
//               border-[#E5DCEB]
//               bg-white
//               text-[#7442AD]
//               shadow-[0_4px_16px_rgba(44,27,58,0.10)]
//             "
//           >
//             <ArrowUpDown
//               size={18}
//             />
//           </motion.button>

//           {/* DESTINATION */}

//           <div className="flex gap-3 mt-3">
//             <MapPin
//               size={17}
//               fill="#7442AD"
//               stroke="#7442AD"
//               className="
//                 mt-[22px]
//                 shrink-0
//               "
//             />

//             <div className="flex-1 min-w-0">
//               <p
//                 className="
//                   mb-1
//                   text-[13px]
//                   font-medium
//                   text-[#9A949F]
//                 "
//               >
//                 Destination
//               </p>

//               <div
//                 className={`
//                   flex h-[52px]
//                   items-center
//                   rounded-[12px]
//                   border px-3
//                   transition-all

//                   ${
//                     activeField ===
//                     "destination"
//                       ? `
//                           border-[#A67BD2]
//                           bg-white
//                           shadow-[0_0_0_3px_rgba(116,66,173,0.07)]
//                         `
//                       : `
//                           border-transparent
//                           bg-[#F5F5F6]
//                         `
//                   }
//                 `}
//               >
//                 <Search
//                   size={18}
//                   className="
//                     mr-2.5
//                     shrink-0
//                     text-[#6D6572]
//                   "
//                 />

//                 <input
//                   autoFocus={
//                     !ride.destination
//                   }
//                   value={
//                     destinationQuery
//                   }
//                   onFocus={() =>
//                     setActiveField(
//                       "destination",
//                     )
//                   }
//                   onChange={(
//                     event,
//                   ) => {
//                     setDestinationQuery(
//                       event.target
//                         .value,
//                     );

//                     setDestination(
//                       null,
//                     );

//                     setActiveField(
//                       "destination",
//                     );
//                   }}
//                   placeholder="Where to?"
//                   className="
//                     min-w-0 flex-1
//                     bg-transparent
//                     text-[16px]
//                     outline-none
//                     placeholder:text-[#AAA5AE]
//                   "
//                 />

//                 {destinationQuery && (
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setDestinationQuery(
//                         "",
//                       );

//                       setDestination(
//                         null,
//                       );

//                       setSuggestions(
//                         [],
//                       );

//                       setActiveField(
//                         "destination",
//                       );
//                     }}
//                     className="
//                       flex h-8 w-8
//                       items-center
//                       justify-center
//                       rounded-full
//                       text-[#A09AA5]
//                       hover:bg-black/5
//                     "
//                   >
//                     <X
//                       size={16}
//                     />
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* STOPS */}

//           <AnimatePresence>
//             {ride.stops.map(
//               (
//                 stop,
//                 index,
//               ) => (
//                 <motion.div
//                   key={stop.id}
//                   initial={{
//                     opacity: 0,
//                     height: 0,
//                     y: -10,
//                   }}
//                   animate={{
//                     opacity: 1,
//                     height:
//                       "auto",
//                     y: 0,
//                   }}
//                   exit={{
//                     opacity: 0,
//                     height: 0,
//                   }}
//                   className="
//                     ml-[29px]
//                     mt-3 flex
//                     items-center
//                     gap-2
//                   "
//                 >
//                   <div
//                     className="
//                       flex h-[48px]
//                       flex-1
//                       items-center
//                       rounded-[12px]
//                       bg-[#F5F5F6]
//                       px-3
//                     "
//                   >
//                     <MapPin
//                       size={17}
//                       className="
//                         mr-2
//                         text-[#7442AD]
//                       "
//                     />

//                     <span
//                       className="
//                         min-w-0
//                         flex-1
//                         truncate
//                         text-[15px]
//                       "
//                     >
//                       {stop.label ||
//                         `Stop ${
//                           index + 1
//                         }`}
//                     </span>
//                   </div>

//                   <button
//                     type="button"
//                     onClick={() =>
//                       removeStop(
//                         stop.id,
//                       )
//                     }
//                     className="
//                       flex h-10 w-10
//                       items-center
//                       justify-center
//                       rounded-full
//                       bg-[#F5F2F8]
//                       text-[#7442AD]
//                     "
//                   >
//                     <X
//                       size={17}
//                     />
//                   </button>
//                 </motion.div>
//               ),
//             )}
//           </AnimatePresence>

//           <motion.button
//             type="button"
//             whileTap={{
//               scale: 0.97,
//             }}
//             onClick={() =>
//               setAddStopOpen(
//                 true,
//               )
//             }
//             className="
//               ml-[28px] mt-4
//               flex items-center
//               gap-2
//               text-[15px]
//               font-semibold
//               text-[#7442AD]
//             "
//           >
//             <span
//               className="
//                 flex h-8 w-8
//                 items-center
//                 justify-center
//                 rounded-full
//                 bg-[#F1E9F8]
//               "
//             >
//               <Plus
//                 size={17}
//               />
//             </span>

//             Add stop
//           </motion.button>
//         </motion.div>

//         {/* LOCATION ACTIONS / SEARCH */}

//         <AnimatePresence
//           mode="wait"
//         >
//           {activeField && (
//             <motion.div
//               key={activeField}
//               initial={{
//                 opacity: 0,
//                 y: 12,
//               }}
//               animate={{
//                 opacity: 1,
//                 y: 0,
//               }}
//               exit={{
//                 opacity: 0,
//                 y: -8,
//               }}
//               className="mt-6"
//             >
//               <button
//                 type="button"
//                 disabled={
//                   isGettingCurrentLocation
//                 }
//                 onClick={
//                   handleCurrentLocation
//                 }
//                 className="
//                   flex w-full
//                   items-center
//                   gap-3
//                   border-b
//                   border-[#ECE9EF]
//                   py-4
//                   text-left
//                   disabled:opacity-60
//                 "
//               >
//                 <span
//                   className="
//                     flex h-10 w-10
//                     shrink-0
//                     items-center
//                     justify-center
//                     rounded-full
//                     bg-[#EEE7F5]
//                     text-[#7442AD]
//                   "
//                 >
//                   {isGettingCurrentLocation ? (
//                     <LoaderCircle
//                       size={19}
//                       className="animate-spin"
//                     />
//                   ) : (
//                     <Crosshair
//                       size={19}
//                     />
//                   )}
//                 </span>

//                 <span>
//                   <span
//                     className="
//                       block
//                       text-[16px]
//                       font-semibold
//                     "
//                   >
//                     Use my current location
//                   </span>

//                   <span
//                     className="
//                       mt-0.5 block
//                       text-[14px]
//                       text-[#99939D]
//                     "
//                   >
//                     {locationQuery.data
//                       ?.locationEnabled
//                       ? "Use your saved current location"
//                       : "Use your device location"}
//                   </span>
//                 </span>
//               </button>

//               <button
//                 type="button"
//                 onClick={
//                   handleMapLocation
//                 }
//                 className="
//                   flex w-full
//                   items-center
//                   gap-3
//                   border-b
//                   border-[#ECE9EF]
//                   py-4
//                   text-left
//                 "
//               >
//                 <span
//                   className="
//                     flex h-10 w-10
//                     items-center
//                     justify-center
//                     rounded-full
//                     bg-[#EEE7F5]
//                     text-[#7442AD]
//                   "
//                 >
//                   <Navigation
//                     size={19}
//                   />
//                 </span>

//                 <span
//                   className="
//                     text-[16px]
//                     font-semibold
//                   "
//                 >
//                   Set location on map
//                 </span>
//               </button>

//               {hasSearchQuery ? (
//                 <SearchResults
//                   suggestions={
//                     suggestions
//                   }
//                   isSearching={
//                     isSearching
//                   }
//                   isResolving={
//                     isResolvingPlace
//                   }
//                   onSelect={
//                     handleSuggestionSelect
//                   }
//                 />
//               ) : (
//                 <div className="mt-7">
//                   <h2
//                     className="
//                       text-[18px]
//                       font-semibold
//                     "
//                   >
//                     Recent destinations
//                   </h2>

//                   <div
//                     className="
//                       mt-4
//                       rounded-[18px]
//                       border
//                       border-[#ECE8EF]
//                       bg-white
//                       px-5 py-7
//                       text-center
//                     "
//                   >
//                     <MapPin
//                       size={24}
//                       className="
//                         mx-auto
//                         text-[#7442AD]
//                       "
//                     />

//                     <p
//                       className="
//                         mt-3
//                         text-[16px]
//                         font-semibold
//                       "
//                     >
//                       No recent destinations
//                     </p>

//                     <p
//                       className="
//                         mt-1
//                         text-[14px]
//                         text-[#99939D]
//                       "
//                     >
//                       Your recent ride
//                       destinations will
//                       appear here.
//                     </p>
//                   </div>
//                 </div>
//               )}
//             </motion.div>
//           )}
//         </AnimatePresence>

        
//       </main>

//       {/* CONTINUE */}

//       <AnimatePresence>
//         {ride.pickup &&
//           ride.destination && (
//             <motion.div
//               initial={{
//                 y: 100,
//                 opacity: 0,
//               }}
//               animate={{
//                 y: 0,
//                 opacity: 1,
//               }}
//               exit={{
//                 y: 100,
//                 opacity: 0,
//               }}
//               className="
//                 fixed inset-x-0
//                 bottom-0
//                 z-[700]
//                 border-t
//                 border-[#EEEAF0]
//                 bg-white/95
//                 px-5
//                 pb-[calc(18px+env(safe-area-inset-bottom))]
//                 pt-4
//                 backdrop-blur-xl
//               "
//             >
//               <motion.button
//                 type="button"
//                 whileTap={{
//                   scale: 0.98,
//                 }}
//                 onClick={
//                   handleContinue
//                 }
//                 className="
//                   mx-auto flex
//                   h-[56px]
//                   w-full
//                   max-w-[720px]
//                   items-center
//                   justify-center
//                   rounded-[14px]
//                   bg-[#7442AD]
//                   text-[16px]
//                   font-semibold
//                   text-white
//                   shadow-[0_10px_30px_rgba(116,66,173,0.22)]
//                 "
//               >
//                 Find rides
//               </motion.button>
//             </motion.div>
//           )}
//       </AnimatePresence>

//       <AddStopSheet
//         open={addStopOpen}
//         onClose={() =>
//           setAddStopOpen(false)
//         }
//         onAdd={(location) => {
//           addStop({
//             ...location,

//             id:
//               crypto.randomUUID(),
//           });

//           setAddStopOpen(
//             false,
//           );
//         }}
//       />
//     </div>
//   );
// }

// interface SearchResultsProps {
//   suggestions:
//     PlaceSuggestion[];

//   isSearching: boolean;
//   isResolving: boolean;

//   onSelect: (
//     suggestion: PlaceSuggestion,
//   ) => void;
// }

// function SearchResults({
//   suggestions,
//   isSearching,
//   isResolving,
//   onSelect,
// }: SearchResultsProps) {
//   return (
//     <div className="mt-7">
//       <h2
//         className="
//           mb-2
//           text-[18px]
//           font-semibold
//         "
//       >
//         Search results
//       </h2>

//       {isSearching ? (
//         <div
//           className="
//             flex items-center
//             justify-center
//             gap-2 py-10
//             text-[15px]
//             text-[#8F8993]
//           "
//         >
//           <LoaderCircle
//             size={18}
//             className="animate-spin"
//           />

//           Searching...
//         </div>
//       ) : suggestions.length >
//         0 ? (
//         suggestions.map(
//           (suggestion) => (
//             <motion.button
//               key={
//                 suggestion.placeId
//               }
//               type="button"
//               whileHover={{
//                 x: 3,
//               }}
//               whileTap={{
//                 scale: 0.99,
//               }}
//               disabled={
//                 isResolving
//               }
//               onClick={() =>
//                 onSelect(
//                   suggestion,
//                 )
//               }
//               className="
//                 flex w-full
//                 items-center
//                 gap-3
//                 border-b
//                 border-[#EEEAF0]
//                 py-4
//                 text-left
//                 disabled:opacity-50
//               "
//             >
//               <span
//                 className="
//                   flex h-10 w-10
//                   shrink-0
//                   items-center
//                   justify-center
//                   rounded-full
//                   bg-[#F3F0F5]
//                   text-[#7442AD]
//                 "
//               >
//                 <MapPin
//                   size={19}
//                 />
//               </span>

//               <span className="min-w-0">
//                 <span
//                   className="
//                     block truncate
//                     text-[16px]
//                     font-medium
//                   "
//                 >
//                   {
//                     suggestion.label
//                   }
//                 </span>

//                 <span
//                   className="
//                     mt-1 block
//                     truncate
//                     text-[14px]
//                     text-[#99939D]
//                   "
//                 >
//                   {
//                     suggestion.address
//                   }
//                 </span>
//               </span>
//             </motion.button>
//           ),
//         )
//       ) : (
//         <div
//           className="
//             py-10
//             text-center
//             text-[15px]
//             text-[#8F8993]
//           "
//         >
//           No locations found.
//         </div>
//       )}
//     </div>
//   );
// }

// import {
//   AnimatePresence,
//   motion,
// } from "framer-motion";

// import {
//   ArrowUpDown,
//   Crosshair,
//   MapPin,
//   Navigation,
//   Plus,
//   Search,
//   X,
// } from "lucide-react";

// import {
//   useEffect,
//   useMemo,
//   useState,
// } from "react";

// import { useNavigate } from "react-router-dom";

// import RideHeader from "../../../components/passenger/ride/RideHeader";

// import {
//   usePassengerRide,
// } from "../../../context/PassengerRideContext";

// import type {
//   RideLocation,
// } from "../../../types/passengerRide";
// import AddStopSheet from "../../../components/passenger/ride/AddStopSheet";

// type ActiveLocationField =
//   | "pickup"
//   | "destination"
//   | null;

// export default function BookRide() {
//   const navigate = useNavigate();

//   const {
//     ride,
//     setPickup,
//     setDestination,
//     swapLocations,
//     addStop,
//     removeStop,
//     setRideStatus,
//   } = usePassengerRide();

//   const [
//   addStopOpen,
//   setAddStopOpen,
// ] = useState(false);

//   const [activeField, setActiveField] =
//     useState<ActiveLocationField>(
//       ride.destination
//         ? null
//         : "destination",
//     );

//   const [pickupQuery, setPickupQuery] =
//     useState(
//       ride.pickup?.label ??
//         "Current location",
//     );

//   const [
//     destinationQuery,
//     setDestinationQuery,
//   ] = useState(
//     ride.destination?.label ?? "",
//   );

//   useEffect(() => {
//     setRideStatus("planning");
//   }, [setRideStatus]);

//   const searchQuery =
//     activeField === "pickup"
//       ? pickupQuery
//       : destinationQuery;

//   const filteredLocations = useMemo(
//     () => {
//       if (!searchQuery.trim()) {
//         return recentRideLocations;
//       }

//       const query =
//         searchQuery.toLowerCase();

//       return recentRideLocations.filter(
//         (location) =>
//           location.label
//             .toLowerCase()
//             .includes(query) ||
//           location.address
//             .toLowerCase()
//             .includes(query),
//       );
//     },
//     [searchQuery],
//   );

//   const chooseLocation = (
//     location: RideLocation,
//   ) => {
//     if (activeField === "pickup") {
//       setPickup(location);
//       setPickupQuery(location.label);

//       setActiveField("destination");

//       return;
//     }

//     setDestination(location);

//     setDestinationQuery(
//       location.label,
//     );

//     setActiveField(null);
//   };

//   const handleCurrentLocation = () => {
//     if (!navigator.geolocation) {
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         const current: RideLocation = {
//           label: "Current location",

//           address:
//             "Your current location",

//           coordinates: {
//             lat:
//               position.coords.latitude,

//             lng:
//               position.coords.longitude,
//           },
//         };

//         if (activeField === "pickup") {
//           setPickup(current);

//           setPickupQuery(
//             "Current location",
//           );

//           setActiveField(
//             "destination",
//           );
//         } else {
//           setDestination(current);

//           setDestinationQuery(
//             "Current location",
//           );

//           setActiveField(null);
//         }
//       },
//       () => {
//         // We'll connect this to your
//         // existing IP fallback later.
//       },
//       {
//         enableHighAccuracy: true,
//         timeout: 12000,
//       },
//     );
//   };

//   const handleSwap = () => {
//     swapLocations();

//     const previousPickup =
//       pickupQuery;

//     setPickupQuery(
//       destinationQuery,
//     );

//     setDestinationQuery(
//       previousPickup,
//     );
//   };

//   const handleContinue = () => {
//     if (
//       !ride.pickup ||
//       !ride.destination
//     ) {
//       return;
//     }

//     setRideStatus("selecting");

//     navigate(
//       "/passenger/ride/select",
//     );
//   };

//   return (
//     <div
//       className="
//         min-h-[100dvh]
//         bg-[#F8F8FA]
//         text-[#302B34]
//       "
//     >
//       <RideHeader
//         title="Where are you going?"
//       />

//       <main
//         className="
//           mx-auto w-full
//           max-w-[760px]
//           px-4 pb-36 pt-5
//           sm:px-6
//         "
//       >
//         <motion.div
//           initial={{
//             opacity: 0,
//             y: 16,
//           }}
//           animate={{
//             opacity: 1,
//             y: 0,
//           }}
//           className="
//             relative rounded-[22px]
//             bg-white p-4
//             shadow-[0_10px_40px_rgba(32,22,40,0.06)]
//           "
//         >
//           <div
//             className="
//               absolute left-[31px]
//               top-[53px]
//               h-[52px]
//               border-l-2 border-dotted
//               border-[#CAC2D1]
//             "
//           />

//           <div className="flex gap-3">
//             <div
//               className="
//                 mt-[21px] h-3 w-3
//                 shrink-0 rounded-full
//                 border-[3px]
//                 border-[#7442AD]
//                 bg-white
//               "
//             />

//             <div className="flex-1 min-w-0">
//               <p
//                 className="
//                   mb-1 text-[12px]
//                   font-medium
//                   text-[#9A949F]
//                 "
//               >
//                 Pickup
//               </p>

//               <div
//                 className={`
//                   flex h-[52px]
//                   items-center
//                   rounded-[12px]
//                   border
//                   px-3
//                   transition-all

//                   ${
//                     activeField ===
//                     "pickup"
//                       ? `
//                         border-[#A67BD2]
//                         bg-white
//                         shadow-[0_0_0_3px_rgba(116,66,173,0.07)]
//                       `
//                       : `
//                         border-transparent
//                         bg-[#F5F5F6]
//                       `
//                   }
//                 `}
//               >
//                 <Search
//                   size={18}
//                   className="
//                     mr-2.5
//                     shrink-0
//                     text-[#6D6572]
//                   "
//                 />

//                 <input
//                   value={pickupQuery}
//                   onFocus={() =>
//                     setActiveField(
//                       "pickup",
//                     )
//                   }
//                   onChange={(event) => {
//                     setPickupQuery(
//                       event.target.value,
//                     );

//                     setActiveField(
//                       "pickup",
//                     );
//                   }}
//                   placeholder="Pickup location"
//                   className="
//                     min-w-0 flex-1
//                     bg-transparent
//                     text-[16px]
//                     outline-none
//                     placeholder:text-[#AAA5AE]
//                   "
//                 />

//                 {pickupQuery && (
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setPickupQuery("");
//                       setPickup(null);
//                     }}
//                     className="
//                       flex h-8 w-8
//                       items-center
//                       justify-center
//                       rounded-full
//                       text-[#A09AA5]
//                       hover:bg-black/5
//                     "
//                   >
//                     <X size={16} />
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>

//           <motion.button
//             type="button"
//             onClick={handleSwap}
//             whileTap={{
//               rotate: 180,
//               scale: 0.88,
//             }}
//             transition={{
//               type: "spring",
//               stiffness: 330,
//               damping: 18,
//             }}
//             className="
//               absolute right-7
//               top-[82px]
//               z-10 flex
//               h-10 w-10
//               items-center
//               justify-center
//               rounded-full
//               border border-[#E5DCEB]
//               bg-white
//               text-[#7442AD]
//               shadow-[0_4px_16px_rgba(44,27,58,0.10)]
//             "
//           >
//             <ArrowUpDown
//               size={18}
//               strokeWidth={2}
//             />
//           </motion.button>

//           <div className="flex gap-3 mt-3">
//             <MapPin
//               size={17}
//               fill="#7442AD"
//               stroke="#7442AD"
//               className="
//                 mt-[22px]
//                 shrink-0
//               "
//             />

//             <div className="flex-1 min-w-0">
//               <p
//                 className="
//                   mb-1 text-[12px]
//                   font-medium
//                   text-[#9A949F]
//                 "
//               >
//                 Destination
//               </p>

//               <div
//                 className={`
//                   flex h-[52px]
//                   items-center
//                   rounded-[12px]
//                   border px-3
//                   transition-all

//                   ${
//                     activeField ===
//                     "destination"
//                       ? `
//                         border-[#A67BD2]
//                         bg-white
//                         shadow-[0_0_0_3px_rgba(116,66,173,0.07)]
//                       `
//                       : `
//                         border-transparent
//                         bg-[#F5F5F6]
//                       `
//                   }
//                 `}
//               >
//                 <Search
//                   size={18}
//                   className="
//                     mr-2.5
//                     shrink-0
//                     text-[#6D6572]
//                   "
//                 />

//                 <input
//                   autoFocus
//                   value={
//                     destinationQuery
//                   }
//                   onFocus={() =>
//                     setActiveField(
//                       "destination",
//                     )
//                   }
//                   onChange={(event) => {
//                     setDestinationQuery(
//                       event.target.value,
//                     );

//                     setActiveField(
//                       "destination",
//                     );
//                   }}
//                   placeholder="Where to?"
//                   className="
//                     min-w-0 flex-1
//                     bg-transparent
//                     text-[16px]
//                     outline-none
//                     placeholder:text-[#AAA5AE]
//                   "
//                 />

//                 {destinationQuery && (
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setDestinationQuery(
//                         "",
//                       );

//                       setDestination(null);
//                     }}
//                     className="
//                       flex h-8 w-8
//                       items-center
//                       justify-center
//                       rounded-full
//                       text-[#A09AA5]
//                       hover:bg-black/5
//                     "
//                   >
//                     <X size={16} />
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>

//           <AnimatePresence>
//             {ride.stops.map(
//               (stop, index) => (
//                 <motion.div
//                   key={stop.id}
//                   initial={{
//                     opacity: 0,
//                     height: 0,
//                     y: -10,
//                   }}
//                   animate={{
//                     opacity: 1,
//                     height: "auto",
//                     y: 0,
//                   }}
//                   exit={{
//                     opacity: 0,
//                     height: 0,
//                   }}
//                   className="
//                     ml-[29px]
//                     mt-3 flex
//                     items-center gap-2
//                   "
//                 >
//                   <div
//                     className="
//                       flex h-[48px]
//                       flex-1 items-center
//                       rounded-[12px]
//                       bg-[#F5F5F6]
//                       px-3
//                     "
//                   >
//                     <MapPin
//                       size={17}
//                       className="
//                         mr-2
//                         text-[#7442AD]
//                       "
//                     />

//                     <span
//                       className="
//                         min-w-0 flex-1
//                         truncate
//                         text-[15px]
//                       "
//                     >
//                       {stop.label ||
//                         `Stop ${
//                           index + 1
//                         }`}
//                     </span>
//                   </div>

//                   <button
//                     type="button"
//                     onClick={() =>
//                       removeStop(stop.id)
//                     }
//                     className="
//                       flex h-10 w-10
//                       items-center
//                       justify-center
//                       rounded-full
//                       bg-[#F5F2F8]
//                       text-[#7442AD]
//                     "
//                   >
//                     <X size={17} />
//                   </button>
//                 </motion.div>
//               ),
//             )}
//           </AnimatePresence>

//           <motion.button
//             type="button"
//             whileTap={{
//               scale: 0.97,
//             }}
//             // onClick={() => {
//             //   addStop({
//             //     id:
//             //       crypto.randomUUID(),

//             //     label: "New stop",

//             //     address: "",

//             //     coordinates: null,
//             //   });
//             // }}
//             onClick={() =>
//   setAddStopOpen(true)
// }
//             className="
//               ml-[28px] mt-4
//               flex items-center
//               gap-2
//               text-[14px]
//               font-semibold
//               text-[#7442AD]
//             "
//           >
//             <span
//               className="
//                 flex h-8 w-8
//                 items-center
//                 justify-center
//                 rounded-full
//                 bg-[#F1E9F8]
//               "
//             >
//               <Plus size={17} />
//             </span>

//             Add stop
//           </motion.button>
//         </motion.div>

//         <AnimatePresence mode="wait">
//           {activeField && (
//             <motion.div
//               key={activeField}
//               initial={{
//                 opacity: 0,
//                 y: 12,
//               }}
//               animate={{
//                 opacity: 1,
//                 y: 0,
//               }}
//               exit={{
//                 opacity: 0,
//                 y: -8,
//               }}
//               className="mt-6"
//             >
//               <button
//                 type="button"
//                 onClick={
//                   handleCurrentLocation
//                 }
//                 className="
//                   flex w-full
//                   items-center gap-3
//                   border-b
//                   border-[#ECE9EF]
//                   py-4 text-left
//                 "
//               >
//                 <span
//                   className="
//                     flex h-10 w-10
//                     shrink-0 items-center
//                     justify-center
//                     rounded-full
//                     bg-[#EEE7F5]
//                     text-[#7442AD]
//                   "
//                 >
//                   <Crosshair
//                     size={19}
//                   />
//                 </span>

//                 <span>
//                   <span
//                     className="
//                       block text-[16px]
//                       font-semibold
//                     "
//                   >
//                     Use my current location
//                   </span>

//                   <span
//                     className="
//                       mt-0.5 block
//                       text-[13px]
//                       text-[#99939D]
//                     "
//                   >
//                     Use your device location
//                   </span>
//                 </span>
//               </button>

//               <button
//                 type="button"
//                 onClick={() =>
//                   navigate(
//                     "/passenger/ride/map-location",
//                     {
//                       state: {
//                         target:
//                           activeField,
//                       },
//                     },
//                   )
//                 }
//                 className="
//                   flex w-full
//                   items-center gap-3
//                   border-b
//                   border-[#ECE9EF]
//                   py-4 text-left
//                 "
//               >
//                 <span
//                   className="
//                     flex h-10 w-10
//                     items-center
//                     justify-center
//                     rounded-full
//                     bg-[#EEE7F5]
//                     text-[#7442AD]
//                   "
//                 >
//                   <Navigation
//                     size={19}
//                   />
//                 </span>

//                 <span
//                   className="
//                     text-[16px]
//                     font-semibold
//                   "
//                 >
//                   Set location on map
//                 </span>
//               </button>

//               <h2
//                 className="
//                   mb-2 mt-7
//                   text-[18px]
//                   font-semibold
//                 "
//               >
//                 Recent destinations
//               </h2>

//               {filteredLocations.map(
//                 (location) => (
//                   <motion.button
//                     key={location.id}
//                     type="button"
//                     whileHover={{
//                       x: 3,
//                     }}
//                     whileTap={{
//                       scale: 0.99,
//                     }}
//                     onClick={() =>
//                       chooseLocation(
//                         location,
//                       )
//                     }
//                     className="
//                       flex w-full
//                       items-center gap-3
//                       border-b
//                       border-[#EEEAF0]
//                       py-4
//                       text-left
//                     "
//                   >
//                     <span
//                       className="
//                         flex h-10 w-10
//                         shrink-0 items-center
//                         justify-center
//                         rounded-full
//                         bg-[#F3F0F5]
//                         text-[#77707C]
//                       "
//                     >
//                       <MapPin
//                         size={19}
//                       />
//                     </span>

//                     <span className="min-w-0">
//                       <span
//                         className="
//                           block truncate
//                           text-[16px]
//                           font-medium
//                         "
//                       >
//                         {
//                           location.label
//                         }
//                       </span>

//                       <span
//                         className="
//                           mt-1 block
//                           truncate
//                           text-[13px]
//                           text-[#99939D]
//                         "
//                       >
//                         {
//                           location.address
//                         }
//                       </span>
//                     </span>
//                   </motion.button>
//                 ),
//               )}
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </main>

//       <AnimatePresence>
//         {ride.pickup &&
//           ride.destination && (
//             <motion.div
//               initial={{
//                 y: 100,
//                 opacity: 0,
//               }}
//               animate={{
//                 y: 0,
//                 opacity: 1,
//               }}
//               exit={{
//                 y: 100,
//                 opacity: 0,
//               }}
//               className="
//                 fixed inset-x-0
//                 bottom-0 z-[700]
//                 border-t
//                 border-[#EEEAF0]
//                 bg-white/95
//                 px-5
//                 pb-[calc(18px+env(safe-area-inset-bottom))]
//                 pt-4
//                 backdrop-blur-xl
//               "
//             >
//               <motion.button
//                 type="button"
//                 whileTap={{
//                   scale: 0.98,
//                 }}
//                 onClick={
//                   handleContinue
//                 }
//                 className="
//                   mx-auto flex
//                   h-[56px] w-full
//                   max-w-[720px]
//                   items-center
//                   justify-center
//                   rounded-[14px]
//                   bg-[#7442AD]
//                   text-[16px]
//                   font-semibold
//                   text-white
//                   shadow-[0_10px_30px_rgba(116,66,173,0.22)]
//                 "
//               >
//                 Find rides
//               </motion.button>
//             </motion.div>
//           )}
//       </AnimatePresence>


//       <AddStopSheet
//   open={addStopOpen}
//   onClose={() =>
//     setAddStopOpen(false)
//   }
//   suggestions={
//     recentRideLocations
//   }
//   onAdd={(location) => {
//     addStop({
//       ...location,
//       id:
//         crypto.randomUUID(),
//     });

//     setAddStopOpen(false);
//   }}
// />
//     </div>
//   );
// }