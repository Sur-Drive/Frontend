import {
  MapPin,
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

import RideHeader from "../../../../components/passenger/ride/RideHeader";

import {
  usePassengerSavedPlaces,
} from "../../../../context/PassengerSavedPlacesContext";

import type {
  RideLocation,
} from "../../../../types/passengerRide";

interface NameState {
  mode: "new";
  location: RideLocation;
}

export default function NameSavedPlace() {
  const navigate =
    useNavigate();

  const routerLocation =
    useLocation();

  const {
    addSavedPlace,
  } =
    usePassengerSavedPlaces();

  const state =
    routerLocation.state as
      | NameState
      | undefined;

  const [
    name,
    setName,
  ] = useState("");

  if (
    !state ||
    !state.location
      .coordinates
  ) {
    return (
      <Navigate
        to="/passenger/account/saved-places"
        replace
      />
    );
  }

  const save =
    () => {
      const trimmed =
        name.trim();

      if (!trimmed) {
        return;
      }

      addSavedPlace({
        id: `custom-${Date.now()}`,
        type: "custom",
        name:
          trimmed,
        address:
          state.location
            .address ??
          state.location
            .label,

        coordinates:
          state.location
            .coordinates!,
      });

      navigate(
        "/passenger/account/saved-places",
        {
          replace: true,
        },
      );
    };

  return (
    <div className="min-h-[100dvh] bg-white">
      <RideHeader
        title=""
        onBack={() =>
          navigate(-1)
        }
      />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-12 pt-5 sm:px-7">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#302B34]">
          Give this place a name
        </h1>

        <label className="mt-6 flex h-[58px] items-center gap-3 rounded-[13px] bg-[#F5F4F5] px-4">
          <MapPin
            size={19}
            className="shrink-0 text-[#7442AD]"
          />

          <input
            autoFocus
            value={name}
            onChange={(
              event,
            ) =>
              setName(
                event.target
                  .value,
              )
            }
            onKeyDown={(
              event,
            ) => {
              if (
                event.key ===
                "Enter"
              ) {
                save();
              }
            }}
            placeholder="Enter place name"
            className="min-w-0 flex-1 bg-transparent text-[16px] text-[#302B34] outline-none placeholder:text-[#BEB9C2]"
          />
        </label>

        <motion.button
          type="button"
          disabled={
            !name.trim()
          }
          whileTap={
            name.trim()
              ? {
                  scale: 0.98,
                }
              : undefined
          }
          onClick={save}
          className="mt-5 h-[56px] w-full rounded-[13px] bg-[#7442AD] text-[16px] font-semibold text-white shadow-[0_8px_24px_rgba(116,66,173,0.22)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save Place
        </motion.button>
      </main>
    </div>
  );
}