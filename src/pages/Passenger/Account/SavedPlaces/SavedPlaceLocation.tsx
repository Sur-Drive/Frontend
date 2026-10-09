import {
  BriefcaseBusiness,
  Crosshair,
  House,
  LoaderCircle,
  MapPin,
  Search,
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  toast,
} from "sonner";

import RideHeader from "../../../../components/passenger/ride/RideHeader";

import {
  normalizeGeocodeResults,
  normalizeGeocodeResult,
  passengerGeocodeApi,
} from "../../../../api/passenger/geocode";

import type {
  RideLocation,
} from "../../../../types/passengerRide";

import type {
  SavedPlace,
} from "../../../../types/savedPlace";

type Mode =
  | "home"
  | "work"
  | "new";

interface LocationPageState {
  place?: SavedPlace;
}

function getErrorMessage(
  error: unknown,
) {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export default function SavedPlaceLocation() {
  const navigate =
    useNavigate();

  const params =
    useParams();

  const routerLocation =
    useLocation();

  const requestIdRef =
    useRef(0);

  const pageState =
    routerLocation.state as
      | LocationPageState
      | undefined;

  const editId =
    params.id;

  const existingPlace =
    pageState?.place;

  const routeMode =
    params.mode as
      | Mode
      | undefined;

  const mode: Mode =
    existingPlace
      ? existingPlace.type ===
        "custom"
        ? "new"
        : existingPlace.type
      : routeMode ??
        "new";

  const title =
    existingPlace
      ? existingPlace.name
      : mode === "home"
        ? "Home"
        : mode === "work"
          ? "Work"
          : "New Place";

  const [
    query,
    setQuery,
  ] = useState(
    existingPlace?.address ??
      "",
  );

  const [
    locating,
    setLocating,
  ] = useState(false);

  const [
    searchLoading,
    setSearchLoading,
  ] = useState(false);

  const [
    results,
    setResults,
  ] = useState<
    RideLocation[]
  >([]);

  const [
    searchError,
    setSearchError,
  ] = useState("");

  const [
    hasTyped,
    setHasTyped,
  ] = useState(false);

  useEffect(() => {
    if (!hasTyped) {
      return;
    }

    const value =
      query.trim();

    if (
      value.length < 3
    ) {
      setResults([]);
      setSearchLoading(
        false,
      );
      setSearchError("");

      return;
    }

    const requestId =
      ++requestIdRef.current;

    const timer =
      window.setTimeout(
        async () => {
          setSearchLoading(
            true,
          );

          setSearchError("");

          try {
            const response =
              await passengerGeocodeApi.geocode(
                value,
              );

            if (
              requestId !==
              requestIdRef.current
            ) {
              return;
            }

            const places =
              normalizeGeocodeResults(
                response,
              );

            setResults(
              places.map(
                (place) => ({
                  label:
                    place.address,

                  address:
                    place.address,

                  coordinates: {
                    lat:
                      place.lat,

                    lng:
                      place.lng,
                  },
                }),
              ),
            );
          } catch (error) {
            if (
              requestId !==
              requestIdRef.current
            ) {
              return;
            }

            console.error(
              "SAVED PLACE SEARCH ERROR:",
              error,
            );

            setResults([]);

            setSearchError(
              "Unable to search locations right now.",
            );
          } finally {
            if (
              requestId ===
              requestIdRef.current
            ) {
              setSearchLoading(
                false,
              );
            }
          }
        },
        350,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    query,
    hasTyped,
  ]);

  if (
    editId &&
    !existingPlace
  ) {
    return (
      <Navigate
        to="/passenger/account/saved-places"
        replace
      />
    );
  }

  const selectLocation = (
    location: RideLocation,
  ) => {
    navigate(
      "/passenger/account/saved-places/map",
      {
        state: {
          location,
          mode,
          editId,

          existingName:
            existingPlace?.name,

          existingType:
            existingPlace?.type,
        },
      },
    );
  };

  const useCurrentLocation =
    () => {
      if (
        !navigator.geolocation
      ) {
        toast.error(
          "Location is not supported on this device.",
        );

        return;
      }

      setLocating(true);

      navigator.geolocation.getCurrentPosition(
        async (
          position,
        ) => {
          const coordinates =
            {
              lat:
                position.coords
                  .latitude,

              lng:
                position.coords
                  .longitude,
            };

          try {
            /*
             * IMPORTANT:
             * Resolve the coordinates
             * BEFORE navigating.
             *
             * We no longer send the
             * fake text "Current location".
             */
            const response =
              await passengerGeocodeApi.reverseGeocode(
                coordinates.lat,
                coordinates.lng,
              );

            const place =
              normalizeGeocodeResult(
                response,
                coordinates,
              );

            if (!place) {
              throw new Error(
                "No address was returned for your current location.",
              );
            }

            selectLocation({
              label:
                place.address,

              address:
                place.address,

              coordinates: {
                lat:
                  place.lat,

                lng:
                  place.lng,
              },
            });
          } catch (error) {
            console.error(
              "CURRENT LOCATION REVERSE GEOCODE ERROR:",
              error,
            );

            toast.error(
              "We found your location, but couldn't resolve its address. You can choose it directly on the map.",
            );

            /*
             * We can still open
             * the map using the
             * genuine coordinates.
             *
             * The map screen will
             * retry reverse geocoding.
             */
            navigate(
              "/passenger/account/saved-places/map",
              {
                state: {
                  mode,
                  editId,

                  existingName:
                    existingPlace?.name,

                  existingType:
                    existingPlace?.type,

                  location: {
                    label: "",

                    coordinates,
                  },
                },
              },
            );
          } finally {
            setLocating(
              false,
            );
          }
        },

        (error) => {
          setLocating(false);

          if (
            error.code ===
            error.PERMISSION_DENIED
          ) {
            toast.error(
              "Location permission was denied. Search for your address or choose it on the map.",
            );

            return;
          }

          if (
            error.code ===
            error.TIMEOUT
          ) {
            toast.error(
              "Location request timed out. Please try again.",
            );

            return;
          }

          toast.error(
            "We couldn't get your current location.",
          );
        },

        {
          enableHighAccuracy:
            true,

          timeout: 10000,

          maximumAge: 30000,
        },
      );
    };

  const openMap = () => {
    navigate(
      "/passenger/account/saved-places/map",
      {
        state: {
          mode,
          editId,

          existingName:
            existingPlace?.name,

          existingType:
            existingPlace?.type,

          initialLocation:
            existingPlace
              ? {
                  label:
                    existingPlace.address,

                  address:
                    existingPlace.address,

                  coordinates:
                    existingPlace.coordinates,
                }
              : undefined,
        },
      },
    );
  };

  const showSearch =
    hasTyped &&
    query.trim().length >= 3;

  return (
    <div className="min-h-[100dvh] bg-white">
      <RideHeader
        title={title}
        onBack={() =>
          navigate(
            "/passenger/account/saved-places",
          )
        }
      />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-12 pt-4 sm:px-7">
        <div className="relative z-30">
          <label className="flex h-[56px] items-center gap-3 rounded-[13px] bg-[#F5F4F5] px-4 transition focus-within:ring-2 focus-within:ring-[#7442AD]/15">
            {searchLoading ? (
              <LoaderCircle
                size={20}
                className="shrink-0 animate-spin text-[#7442AD]"
              />
            ) : (
              <Search
                size={20}
                className="shrink-0 text-[#5D5570]"
              />
            )}

            <input
              autoFocus
              value={query}
              onChange={(
                event,
              ) => {
                setHasTyped(
                  true,
                );

                setQuery(
                  event.target
                    .value,
                );
              }}
              placeholder="Search location"
              className="min-w-0 flex-1 bg-transparent text-[16px] text-[#302B34] outline-none placeholder:text-[#B8B3BC]"
            />

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setSearchError("");
                  setHasTyped(
                    true,
                  );
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#918B95] transition hover:bg-white"
                aria-label="Clear search"
              >
                <X
                  size={17}
                />
              </button>
            )}
          </label>

          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -5,
                  scale: 0.99,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: -5,
                  scale: 0.99,
                }}
                transition={{
                  duration: 0.16,
                }}
                className="absolute left-0 right-0 top-[64px] z-50 max-h-[360px] overflow-y-auto rounded-[16px] border border-[#EEEAF1] bg-white shadow-[0_18px_45px_rgba(31,22,39,0.14)]"
              >
                {searchLoading ? (
                  <div className="flex min-h-[90px] items-center justify-center gap-2 px-4 text-[14px] text-[#918B95]">
                    <LoaderCircle
                      size={18}
                      className="animate-spin text-[#7442AD]"
                    />

                    Searching...
                  </div>
                ) : results.length >
                  0 ? (
                  results.map(
                    (
                      location,
                      index,
                    ) => (
                      <button
                        key={`${location.label}-${location.coordinates?.lat ?? index}-${location.coordinates?.lng ?? index}`}
                        type="button"
                        onClick={() =>
                          selectLocation(
                            location,
                          )
                        }
                        className="flex min-h-[72px] w-full items-start gap-3 border-b border-[#F0EDF2] px-4 py-4 text-left transition last:border-b-0 hover:bg-[#FAF8FB]"
                      >
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3ECF9]">
                          <MapPin
                            size={18}
                            className="text-[#7442AD]"
                          />
                        </span>

                        <span className="flex-1 min-w-0">
                          <span className="block text-[15px] font-medium leading-5 text-[#302B34]">
                            {
                              location.label
                            }
                          </span>

                          {location.address &&
                            location.address !==
                              location.label && (
                              <span className="mt-1 block text-[13px] leading-5 text-[#918B95]">
                                {
                                  location.address
                                }
                              </span>
                            )}
                        </span>
                      </button>
                    ),
                  )
                ) : (
                  <div className="px-5 py-6 text-center">
                    <MapPin
                      size={25}
                      className="mx-auto text-[#A99CB5]"
                    />

                    <p className="mt-2 text-[14px] font-medium text-[#554E59]">
                      {searchError ||
                        "No locations found"}
                    </p>

                    <button
                      type="button"
                      onClick={
                        openMap
                      }
                      className="mt-3 text-[14px] font-semibold text-[#7442AD]"
                    >
                      Choose on
                      map instead
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!showSearch && (
          <>
            <div className="mt-4 overflow-hidden rounded-[16px] bg-white shadow-[0_5px_25px_rgba(30,20,40,0.055)]">
              <button
                type="button"
                disabled={
                  locating
                }
                onClick={
                  useCurrentLocation
                }
                className="flex min-h-[64px] w-full items-center gap-3 border-b border-[#EEEAF1] px-4 text-left transition hover:bg-[#FAF8FB] disabled:opacity-60"
              >
                {locating ? (
                  <LoaderCircle
                    size={20}
                    className="animate-spin text-[#7442AD]"
                  />
                ) : (
                  <Crosshair
                    size={20}
                    className="text-[#7184B0]"
                  />
                )}

                <span className="text-[15px] font-medium text-[#302B34]">
                  {locating
                    ? "Finding your address..."
                    : "Use my current location"}
                </span>
              </button>

              <button
                type="button"
                onClick={
                  openMap
                }
                className="flex min-h-[64px] w-full items-center gap-3 px-4 text-left transition hover:bg-[#FAF8FB]"
              >
                <MapPin
                  size={20}
                  className="text-[#7184B0]"
                />

                <span className="text-[15px] font-medium text-[#302B34]">
                  Set location on
                  the map
                </span>
              </button>
            </div>

            {existingPlace && (
              <>
                <h2 className="mt-6 text-[15px] font-semibold text-[#302B34]">
                  Current Place
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    selectLocation(
                      {
                        label:
                          existingPlace.name,

                        address:
                          existingPlace.address,

                        coordinates:
                          existingPlace.coordinates,
                      },
                    )
                  }
                  className="mt-2 flex min-h-[70px] w-full items-center gap-3 rounded-[16px] bg-white px-4 py-3 text-left shadow-[0_5px_25px_rgba(30,20,40,0.045)]"
                >
                  {existingPlace.type ===
                  "home" ? (
                    <House
                      size={19}
                      className="shrink-0 text-[#7184B0]"
                    />
                  ) : existingPlace.type ===
                    "work" ? (
                    <BriefcaseBusiness
                      size={19}
                      className="shrink-0 text-[#7184B0]"
                    />
                  ) : (
                    <MapPin
                      size={19}
                      className="shrink-0 text-[#7184B0]"
                    />
                  )}

                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium text-[#302B34]">
                      {
                        existingPlace.name
                      }
                    </span>

                    <span className="mt-1 block truncate text-[13px] text-[#7D6AA0]">
                      {
                        existingPlace.address
                      }
                    </span>
                  </span>
                </button>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

