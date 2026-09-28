import {
  Search,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useState,
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import PassengerMap from "../../../../components/passenger/ride/PassengerMap";
import RideMapHeader from "../../../../components/passenger/ride/RideMapHeader";

import {
  usePassengerSavedPlaces,
} from "../../../../context/PassengerSavedPlacesContext";

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

  initialLocation?: RideLocation;
}

const defaultCenter: Coordinates = {
  lat: 6.5244,
  lng: 3.3792,
};

export default function SavedPlaceMap() {
  const navigate =
    useNavigate();

  const routerLocation =
    useLocation();

  const {
    addSavedPlace,
    updateSavedPlace,
  } =
    usePassengerSavedPlaces();

  const state =
    routerLocation.state as
      | MapState
      | undefined;

  const [
    selectedCoordinates,
    setSelectedCoordinates,
  ] =
    useState<Coordinates>(
      state?.initialLocation
        ?.coordinates ??
        defaultCenter,
    );

  const [
    address,
    setAddress,
  ] =
    useState<string>(
      state?.initialLocation
        ?.address ??
        state?.initialLocation
          ?.label ??
        "",
    );

  /*
   * If this page was opened directly
   * without the required router state,
   * send the user back safely.
   */
  if (!state) {
    return (
      <Navigate
        to="/passenger/account/saved-places"
        replace
      />
    );
  }

  const selectedLocation: RideLocation = {
    label:
      address.trim() ||
      "Selected location",

    address:
      address.trim() ||
      "Selected location",

    coordinates:
      selectedCoordinates,
  };

  const handleMapClick = (
    lat: number,
    lng: number,
  ) => {
    setSelectedCoordinates({
      lat,
      lng,
    });

    /*
     * Later, when reverse geocoding is
     * connected, replace this with the
     * actual address returned by Google.
     */
    setAddress(
      "Selected location",
    );
  };

  const handleConfirmLocation =
    () => {
      const cleanAddress =
        address.trim() ||
        "Selected location";

      /*
       * =================================
       * EDIT EXISTING SAVED PLACE
       * =================================
       */
      if (state.editId) {
        updateSavedPlace(
          state.editId,
          {
            address:
              cleanAddress,

            coordinates:
              selectedCoordinates,
          },
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
       * =================================
       * NEW CUSTOM PLACE
       * =================================
       *
       * A custom place needs another
       * screen so the passenger can give
       * it a name such as:
       *
       * Gym
       * Church
       * Mum's House
       * Office 2
       */
      if (
        state.mode ===
        "new"
      ) {
        navigate(
          "/passenger/account/saved-places/name",
          {
            state: {
              mode:
                state.mode,

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

      /*
       * =================================
       * HOME / WORK
       * =================================
       *
       * Home and Work already have names,
       * so they can be saved immediately.
       */
      if (
        state.mode ===
          "home" ||
        state.mode ===
          "work"
      ) {
        addSavedPlace({
          id:
            state.mode,

          type:
            state.mode,

          name:
            state.mode ===
            "home"
              ? "Home"
              : "Work",

          address:
            cleanAddress,

          coordinates:
            selectedCoordinates,
        });

        navigate(
          "/passenger/account/saved-places",
          {
            replace: true,
          },
        );
      }
    };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#F4F4F4]">
      {/* =========================
          MAP
      ========================== */}

      <PassengerMap
        center={
          selectedCoordinates
        }
        pickup={
          selectedLocation
        }
        zoom={16}
        onMapClick={
          handleMapClick
        }
      />

      {/* =========================
          MAP HEADER
      ========================== */}

      <RideMapHeader
        title="Location"
      />

      {/* =========================
          CONFIRMATION SHEET
      ========================== */}

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
        {/* Sheet handle */}

        <div className="mx-auto h-1 w-12 rounded-full bg-[#D5D0D9] lg:hidden" />

        <div className="mx-auto mt-5 w-full max-w-[640px] lg:mt-1">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[#302B34]">
            Confirm location
          </h1>

          <p className="mt-1 text-[14px] leading-6 text-[#918B95]">
            Drag map or edit
            address to set location
          </p>

          {/* ADDRESS */}

          <label
            className="
              mt-5
              flex
              h-[56px]
              items-center
              gap-3
              rounded-[13px]
              bg-[#F5F4F5]
              px-4
              transition
              focus-within:ring-2
              focus-within:ring-[#7442AD]/20
            "
          >
            <Search
              size={19}
              strokeWidth={2}
              className="shrink-0 text-[#71678A]"
            />

            <input
              type="text"
              value={
                address
              }
              onChange={(
                event,
              ) =>
                setAddress(
                  event
                    .target
                    .value,
                )
              }
              placeholder="Enter address"
              className="
                min-w-0
                flex-1
                bg-transparent
                text-[16px]
                text-[#302B34]
                outline-none
                placeholder:text-[#AAA4AE]
              "
            />
          </label>

          {/* CONFIRM */}

          <motion.button
            type="button"
            whileTap={{
              scale: 0.98,
            }}
            onClick={
              handleConfirmLocation
            }
            className="
              mt-4
              flex
              h-[56px]
              w-full
              items-center
              justify-center
              rounded-[13px]
              bg-[#7442AD]
              text-[16px]
              font-semibold
              text-white
              shadow-[0_8px_25px_rgba(116,66,173,0.24)]
              transition
              hover:bg-[#69389F]
            "
          >
            Confirm
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}