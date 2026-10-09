import {
  LoaderCircle,
  MapPin,
  Search,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "sonner";

import PassengerMap from "../../../../components/passenger/ride/PassengerMap";
import RideMapHeader from "../../../../components/passenger/ride/RideMapHeader";

import {
  passengerSavedPlacesApi,
  type SavedPlaceType,
} from "../../../../api/passenger/savedPlaces";

import {
  normalizeGeocodeResult,
  passengerGeocodeApi,
} from "../../../../api/passenger/geocode";

import type {
  Coordinates,
  RideLocation,
} from "../../../../types/passengerRide";

interface MapState {
  mode:
    | "home"
    | "work"
    | "new";

  editId?: string;

  existingName?: string;

  existingType?: SavedPlaceType;

  initialLocation?: RideLocation;

  location?: RideLocation;
}

/*
 * This is ONLY the initial map viewport.
 *
 * It is NOT treated as the passenger's
 * current location and is NOT saved.
 *
 * Once the user taps the map, the actual
 * selected coordinates replace it.
 *
 * Ideally we will later replace this with
 * the rider's persisted backend location.
 */
const INITIAL_MAP_CENTER: Coordinates = {
  lat: 8.4799,
  lng: 4.5418,
};

function getErrorMessage(
  error: unknown,
) {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return "Unable to save this place. Please try again.";
}

export default function SavedPlaceMap() {
  const navigate =
    useNavigate();

  const routerLocation =
    useLocation();

  const state =
    routerLocation.state as
      | MapState
      | undefined;

  /*
   * Coordinates that the passenger has
   * actually selected.
   *
   * For a brand-new place this starts
   * undefined.
   */
 const initialCoordinates: Coordinates | undefined =
  state?.location?.coordinates ??
  state?.initialLocation?.coordinates ??
  undefined;

const [
  selectedCoordinates,
  setSelectedCoordinates,
] = useState<Coordinates | undefined>(
  initialCoordinates,
);

  /*
   * Separate viewport center.
   *
   * This allows the map to render even
   * when no saved-place location has
   * been selected yet.
   */
  const [
  mapCenter,
  setMapCenter,
] = useState<Coordinates>(
  initialCoordinates ??
    INITIAL_MAP_CENTER,
);

  const [
    address,
    setAddress,
  ] = useState(
    state?.location
      ?.address ??
      state?.location
        ?.label ??
      state?.initialLocation
        ?.address ??
      state?.initialLocation
        ?.label ??
      "",
  );

  const [
    resolvingAddress,
    setResolvingAddress,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  /*
   * If coordinates came from another
   * screen but no address was supplied,
   * reverse geocode them.
   */
  useEffect(() => {
    if (
      !selectedCoordinates ||
      address.trim()
    ) {
      return;
    }

    let mounted = true;

    const resolveAddress =
      async () => {
        setResolvingAddress(
          true,
        );

        try {
          const response =
            await passengerGeocodeApi.reverseGeocode(
              selectedCoordinates.lat,
              selectedCoordinates.lng,
            );

          if (!mounted) {
            return;
          }

          const place =
            normalizeGeocodeResult(
              response,
              selectedCoordinates,
            );

          if (!place) {
            throw new Error(
              "No address was returned for this location.",
            );
          }

          setAddress(
            place.address,
          );

          setMapCenter({
            lat: place.lat,
            lng: place.lng,
          });

          setSelectedCoordinates({
            lat: place.lat,
            lng: place.lng,
          });
        } catch (error) {
          console.error(
            "INITIAL REVERSE GEOCODE ERROR:",
            error,
          );

          if (mounted) {
            toast.error(
              "We couldn't identify this address. Tap another point on the map.",
            );
          }
        } finally {
          if (mounted) {
            setResolvingAddress(
              false,
            );
          }
        }
      };

    void resolveAddress();

    return () => {
      mounted = false;
    };
  }, [
    selectedCoordinates,
    address,
  ]);

  /*
   * Router state is required because
   * we need to know whether this is
   * Home, Work, New or Edit.
   */
  if (!state) {
    return (
      <Navigate
        to="/passenger/account/saved-places"
        replace
      />
    );
  }

  /*
   * IMPORTANT:
   *
   * DO NOT redirect just because
   * selectedCoordinates is undefined.
   *
   * A new place is SUPPOSED to arrive
   * here without selected coordinates.
   */

  const selectedLocation:
    | RideLocation
    | undefined =
    selectedCoordinates
      ? {
          label:
            address.trim() ||
            "Selected location",

          address:
            address.trim() ||
            undefined,

          coordinates:
            selectedCoordinates,
        }
      : undefined;

  const handleMapClick =
    async (
      lat: number,
      lng: number,
    ) => {
      const coordinates = {
        lat,
        lng,
      };

      /*
       * Immediately move the map/pin.
       */
      setSelectedCoordinates(
        coordinates,
      );

      setMapCenter(
        coordinates,
      );

      /*
       * Remove any previous address so
       * it can never mismatch the new pin.
       */
      setAddress("");

      setResolvingAddress(
        true,
      );

      try {
        const response =
          await passengerGeocodeApi.reverseGeocode(
            lat,
            lng,
          );

        const place =
          normalizeGeocodeResult(
            response,
            coordinates,
          );

        if (!place) {
          throw new Error(
            "No address was returned for this location.",
          );
        }

        /*
         * This is what makes the input
         * automatically display the
         * address of the map point.
         */
        setAddress(
          place.address,
        );

        setSelectedCoordinates({
          lat: place.lat,
          lng: place.lng,
        });

        setMapCenter({
          lat: place.lat,
          lng: place.lng,
        });
      } catch (error) {
        console.error(
          "MAP REVERSE GEOCODE ERROR:",
          error,
        );

        toast.error(
          "We couldn't identify this location. Try another point or enter the address manually.",
        );
      } finally {
        setResolvingAddress(
          false,
        );
      }
    };

  const handleConfirmLocation =
    async () => {
      /*
       * A map location MUST actually
       * have been selected.
       */
      if (
        !selectedCoordinates
      ) {
        toast.error(
          "Tap a location on the map first.",
        );

        return;
      }

      const cleanAddress =
        address.trim();

      if (!cleanAddress) {
        toast.error(
          "Please wait for the address or enter one manually.",
        );

        return;
      }

      /*
       * New custom place:
       * continue to naming screen.
       */
      if (
        state.mode ===
          "new" &&
        !state.editId
      ) {
        navigate(
          "/passenger/account/saved-places/name",
          {
            state: {
              mode: "new",

              location: {
                label:
                  cleanAddress,

                address:
                  cleanAddress,

                coordinates:
                  selectedCoordinates,
              },
            },
          },
        );

        return;
      }

      setSaving(true);

      try {
        /*
         * EDIT EXISTING PLACE
         */
        if (
          state.editId
        ) {
          await passengerSavedPlacesApi.update(
            state.editId,
            {
              name:
                state.existingName ||
                (state.mode ===
                "home"
                  ? "Home"
                  : state.mode ===
                      "work"
                    ? "Work"
                    : "Saved Place"),

              type:
                state.existingType ??
                (state.mode ===
                "new"
                  ? "custom"
                  : state.mode),

              address:
                cleanAddress,

              lat:
                selectedCoordinates.lat,

              lng:
                selectedCoordinates.lng,
            },
          );

          toast.success(
            "Saved place updated",
          );

          navigate(
            "/passenger/account/saved-places",
            {
              replace: true,
            },
          );

          return;
        }

        /*
         * CREATE HOME / WORK
         */
        if (
          state.mode ===
            "home" ||
          state.mode ===
            "work"
        ) {
          await passengerSavedPlacesApi.create(
            {
              name:
                state.mode ===
                "home"
                  ? "Home"
                  : "Work",

              type:
                state.mode,

              address:
                cleanAddress,

              lat:
                selectedCoordinates.lat,

              lng:
                selectedCoordinates.lng,
            },
          );

          toast.success(
            `${
              state.mode ===
              "home"
                ? "Home"
                : "Work"
            } saved`,
          );

          navigate(
            "/passenger/account/saved-places",
            {
              replace: true,
            },
          );
        }
      } catch (error) {
        console.error(
          "SAVE PLACE ERROR:",
          error,
        );

        toast.error(
          getErrorMessage(
            error,
          ),
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
      <PassengerMap
        center={mapCenter}
        pickup={
          selectedLocation
        }
        zoom={16}
        interactive
        onMapClick={(
          lat,
          lng,
        ) => {
          void handleMapClick(
            lat,
            lng,
          );
        }}
      />

      <RideMapHeader
        title="Location"
      />

      <motion.div
        initial={{
          y: 100,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 28,
        }}
        className="
          absolute
          inset-x-0
          bottom-0
          z-[100]
          rounded-t-[28px]
          bg-white
          px-5
          pb-[calc(18px+env(safe-area-inset-bottom))]
          pt-3
          shadow-[0_-12px_40px_rgba(31,22,39,0.12)]

          md:left-1/2
          md:right-auto
          md:w-[520px]
          md:-translate-x-1/2

          lg:bottom-6
          lg:left-6
          lg:w-[440px]
          lg:translate-x-0
          lg:rounded-[24px]
        "
      >
        <div className="mx-auto h-1 w-12 rounded-full bg-[#D5D0D9] lg:hidden" />

        <div className="mx-auto mt-5 w-full max-w-[640px] lg:mt-1">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[#302B34]">
            Confirm location
          </h1>

          <p className="mt-1 text-[14px] leading-6 text-[#918B95]">
            Tap anywhere on the
            map to select a
            location.
          </p>

          <label className="mt-5 flex min-h-[56px] items-center gap-3 rounded-[13px] bg-[#F5F4F5] px-4 transition focus-within:ring-2 focus-within:ring-[#7442AD]/20">
            {resolvingAddress ? (
              <LoaderCircle
                size={19}
                className="shrink-0 animate-spin text-[#7442AD]"
              />
            ) : (
              <Search
                size={19}
                strokeWidth={2}
                className="shrink-0 text-[#71678A]"
              />
            )}

            <input
              type="text"
              value={address}
              onChange={(
                event,
              ) =>
                setAddress(
                  event.target
                    .value,
                )
              }
              placeholder={
                resolvingAddress
                  ? "Finding address..."
                  : selectedCoordinates
                    ? "Enter address"
                    : "Tap a location on the map"
              }
              className="min-w-0 flex-1 bg-transparent text-[16px] text-[#302B34] outline-none placeholder:text-[#AAA4AE]"
            />
          </label>

          {selectedCoordinates && (
            <div className="flex items-start gap-2 mt-3">
              <MapPin
                size={16}
                className="mt-0.5 shrink-0 text-[#7442AD]"
              />

              <p className="text-[13px] leading-5 text-[#918B95]">
                Location selected
              </p>
            </div>
          )}

          <motion.button
            type="button"
            disabled={
              saving ||
              resolvingAddress ||
              !selectedCoordinates ||
              !address.trim()
            }
            whileTap={
              !saving &&
              !resolvingAddress &&
              selectedCoordinates
                ? {
                    scale: 0.98,
                  }
                : undefined
            }
            onClick={() =>
              void handleConfirmLocation()
            }
            className="mt-4 flex h-[56px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#7442AD] text-[16px] font-semibold text-white shadow-[0_8px_25px_rgba(116,66,173,0.24)] transition hover:bg-[#69389F] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ||
            resolvingAddress ? (
              <LoaderCircle
                size={19}
                className="animate-spin"
              />
            ) : null}

            {saving
              ? "Saving..."
              : resolvingAddress
                ? "Finding address..."
                : selectedCoordinates
                  ? "Confirm Location"
                  : "Select a Location"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

