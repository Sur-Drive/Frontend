import {
  BriefcaseBusiness,
  Crosshair,
  House,
  MapPin,
  Search,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";

import RideHeader from "../../../../components/passenger/ride/RideHeader";

import {
  recentSavedDestinations,
  savedPlaceSearchResults,
} from "../../../../data/savedPlaces";

import {
  usePassengerSavedPlaces,
} from "../../../../context/PassengerSavedPlacesContext";

import type {
  RideLocation,
} from "../../../../types/passengerRide";

type Mode =
  | "home"
  | "work"
  | "new";

export default function SavedPlaceLocation() {
  const navigate =
    useNavigate();

  const params =
    useParams();

  const {
    getPlaceById,
  } =
    usePassengerSavedPlaces();

  const editId =
    params.id;

  const existingPlace =
    editId
      ? getPlaceById(editId)
      : undefined;

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

  useEffect(() => {
    if (
      existingPlace
    ) {
      setQuery(
        existingPlace.address,
      );
    }
  }, [existingPlace]);

  const results =
    useMemo(() => {
      const value =
        query
          .trim()
          .toLowerCase();

      if (!value) {
        return [];
      }

      return savedPlaceSearchResults.filter(
        (location) =>
          `${location.label} ${location.address ?? ""}`
            .toLowerCase()
            .includes(value),
      );
    }, [query]);

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
      "/passenger/account/saved-places/confirm",
      {
        state: {
          location,
          mode,
          editId:
            existingPlace?.id,
          existingName:
            existingPlace?.name,
        },
      },
    );
  };

  const useCurrentLocation =
    () => {
      if (
        !navigator.geolocation
      ) {
        return;
      }

      setLocating(true);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocating(
            false,
          );

          selectLocation({
            label:
              "Current location",
            address:
              "Current location",
            coordinates: {
              lat:
                position
                  .coords
                  .latitude,
              lng:
                position
                  .coords
                  .longitude,
            },
          });
        },
        () => {
          setLocating(
            false,
          );
        },
        {
          enableHighAccuracy:
            true,
          timeout: 10000,
        },
      );
    };

  const openMap = () => {
    navigate(
      "/passenger/account/saved-places/map",
      {
        state: {
          mode,
          editId:
            existingPlace?.id,
          existingName:
            existingPlace?.name,
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
        {/* SEARCH */}

        <label className="flex h-[56px] items-center gap-3 rounded-[13px] bg-[#F5F4F5] px-4">
          <Search
            size={20}
            className="shrink-0 text-[#5D5570]"
          />

          <input
            autoFocus
            value={query}
            onChange={(
              event,
            ) =>
              setQuery(
                event.target
                  .value,
              )
            }
            placeholder="Search location"
            className="min-w-0 flex-1 bg-transparent text-[16px] text-[#302B34] outline-none placeholder:text-[#B8B3BC]"
          />
        </label>

        {query.trim() ? (
          <>
            {results.length >
            0 ? (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mt-4 overflow-hidden rounded-[16px] bg-white shadow-[0_5px_25px_rgba(30,20,40,0.055)]"
              >
                {results.map(
                  (
                    location,
                  ) => (
                    <button
                      key={
                        location.id
                      }
                      type="button"
                      onClick={() =>
                        selectLocation(
                          location,
                        )
                      }
                      className="flex min-h-[70px] w-full items-center gap-3 border-b border-[#EEEAF1] px-4 py-3 text-left last:border-b-0"
                    >
                      <MapPin
                        size={20}
                        className="shrink-0 text-[#7E73A5]"
                      />

                      <span className="min-w-0">
                        <span className="block text-[15px] font-medium text-[#302B34]">
                          {
                            location.label
                          }
                        </span>

                        <span className="mt-1 block text-[13px] text-[#7D6AA0]">
                          {
                            location.address
                          }
                        </span>
                      </span>
                    </button>
                  ),
                )}
              </motion.div>
            ) : (
              <div className="flex min-h-[330px] flex-col items-center justify-center text-center">
                <MapPin
                  size={58}
                  strokeWidth={
                    1.4
                  }
                  className="text-[#9D91AA]"
                />

                <p className="mt-5 text-[14px] text-[#918B95]">
                  Address not
                  found
                </p>

                <button
                  type="button"
                  onClick={
                    openMap
                  }
                  className="mt-1 text-[14px] font-semibold text-[#7442AD]"
                >
                  Choose on map
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* LOCATION ACTIONS */}

            <div className="mt-4 overflow-hidden rounded-[16px] bg-white shadow-[0_5px_25px_rgba(30,20,40,0.055)]">
              <button
                type="button"
                onClick={
                  useCurrentLocation
                }
                className="flex min-h-[64px] w-full items-center gap-3 border-b border-[#EEEAF1] px-4 text-left"
              >
                <Crosshair
                  size={20}
                  className="text-[#7184B0]"
                />

                <span className="text-[15px] font-medium text-[#302B34]">
                  {locating
                    ? "Finding your location..."
                    : "Use my current location"}
                </span>
              </button>

              <button
                type="button"
                onClick={
                  openMap
                }
                className="flex min-h-[64px] w-full items-center gap-3 px-4 text-left"
              >
                <MapPin
                  size={20}
                  className="text-[#7184B0]"
                />

                <span className="text-[15px] font-medium text-[#302B34]">
                  Set Location on
                  the map
                </span>
              </button>
            </div>

            {/* RECENT */}

            <h2 className="mt-6 text-[15px] font-semibold text-[#302B34]">
              Recent Destinations
            </h2>

            <div className="mt-2 overflow-hidden rounded-[16px] bg-white shadow-[0_5px_25px_rgba(30,20,40,0.045)]">
              {recentSavedDestinations.map(
                (
                  location,
                  index,
                ) => {
                  const Icon =
                    index === 0
                      ? House
                      : BriefcaseBusiness;

                  return (
                    <button
                      key={
                        location.id
                      }
                      type="button"
                      onClick={() =>
                        selectLocation(
                          location,
                        )
                      }
                      className="flex min-h-[70px] w-full items-center gap-3 border-b border-[#EEEAF1] px-4 py-3 text-left last:border-b-0"
                    >
                      <Icon
                        size={19}
                        className="text-[#7184B0]"
                      />

                      <span>
                        <span className="block text-[15px] font-medium text-[#302B34]">
                          {
                            location.label
                          }
                        </span>

                        <span className="mt-1 block text-[13px] text-[#7D6AA0]">
                          {
                            location.address
                          }
                        </span>
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}