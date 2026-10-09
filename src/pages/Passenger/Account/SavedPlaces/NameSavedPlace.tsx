import {
  LoaderCircle,
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

import {
  toast,
} from "sonner";

import RideHeader from "../../../../components/passenger/ride/RideHeader";

import {
  passengerSavedPlacesApi,
} from "../../../../api/passenger/savedPlaces";

import type {
  RideLocation,
} from "../../../../types/passengerRide";

interface NameState {
  mode: "new";

  location: RideLocation;
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

  return "Unable to save this place. Please try again.";
}

export default function NameSavedPlace() {
  const navigate =
    useNavigate();

  const routerLocation =
    useLocation();

  const state =
    routerLocation.state as
      | NameState
      | undefined;

  const [
    name,
    setName,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  if (
    !state?.location
      ?.coordinates
  ) {
    return (
      <Navigate
        to="/passenger/account/saved-places"
        replace
      />
    );
  }

  const save = async () => {
    const trimmed =
      name.trim();

    const coordinates =
      state.location
        .coordinates;

    const address =
      state.location.address ??
      state.location.label;

    if (
      !trimmed ||
      !coordinates ||
      saving
    ) {
      return;
    }

    setSaving(true);

    try {
      await passengerSavedPlacesApi.create(
        {
          name: trimmed,

          type: "custom",

          address,

          lat:
            coordinates.lat,

          lng:
            coordinates.lng,
        },
      );

      toast.success(
        `${trimmed} saved`,
      );

      navigate(
        "/passenger/account/saved-places",
        {
          replace: true,
        },
      );
    } catch (error) {
      console.error(
        "CREATE CUSTOM PLACE ERROR:",
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

        <p className="mt-2 text-[14px] leading-6 text-[#918B95]">
          Choose a name you'll
          easily recognize later.
        </p>

        <div className="mt-5 rounded-[14px] bg-[#F8F6F9] p-4">
          <div className="flex items-start gap-3">
            <MapPin
              size={19}
              className="mt-0.5 shrink-0 text-[#7442AD]"
            />

            <p className="text-[14px] leading-5 text-[#665F69]">
              {state.location
                .address ??
                state.location
                  .label}
            </p>
          </div>
        </div>

        <label className="mt-5 flex h-[58px] items-center gap-3 rounded-[13px] bg-[#F5F4F5] px-4 focus-within:ring-2 focus-within:ring-[#7442AD]/15">
          <MapPin
            size={19}
            className="shrink-0 text-[#7442AD]"
          />

          <input
            autoFocus
            value={name}
            maxLength={60}
            disabled={saving}
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
                  "Enter" &&
                name.trim() &&
                !saving
              ) {
                void save();
              }
            }}
            placeholder="e.g. Gym, Church, Mum's House"
            className="min-w-0 flex-1 bg-transparent text-[16px] text-[#302B34] outline-none placeholder:text-[#BEB9C2] disabled:opacity-60"
          />
        </label>

        <motion.button
          type="button"
          disabled={
            !name.trim() ||
            saving
          }
          whileTap={
            name.trim() &&
            !saving
              ? {
                  scale: 0.98,
                }
              : undefined
          }
          onClick={() =>
            void save()
          }
          className="mt-5 flex h-[56px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#7442AD] text-[16px] font-semibold text-white shadow-[0_8px_24px_rgba(116,66,173,0.22)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving && (
            <LoaderCircle
              size={19}
              className="animate-spin"
            />
          )}

          {saving
            ? "Saving..."
            : "Save Place"}
        </motion.button>
      </main>
    </div>
  );
}

