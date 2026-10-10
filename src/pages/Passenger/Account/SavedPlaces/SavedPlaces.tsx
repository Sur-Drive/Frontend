import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  motion,
} from "framer-motion";

import {
  MapPin,
  RefreshCw,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "sonner";

import RideHeader from "../../../../components/passenger/ride/RideHeader";

import SavedPlaceRow from "../../../../components/passenger/saved-places/SavedPlaceRow";
import SavedPlaceActionSheet from "../../../../components/passenger/saved-places/SavedPlaceActionSheet";

import {
  extractSavedPlaces,
  passengerSavedPlacesApi,
  type SavedPlaceApiItem,
} from "../../../../api/passenger/savedPlaces";

import type {
  SavedPlace,
} from "../../../../types/savedPlace";

function toSavedPlace(
  item: SavedPlaceApiItem,
): SavedPlace | null {
  const lat =
    typeof item.lat === "number"
      ? item.lat
      : typeof item.latitude ===
          "number"
        ? item.latitude
        : null;

  const lng =
    typeof item.lng === "number"
      ? item.lng
      : typeof item.longitude ===
          "number"
        ? item.longitude
        : null;

  if (
    !item.id ||
    !item.name ||
    !item.type ||
    !item.address ||
    lat === null ||
    lng === null
  ) {
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    type: item.type,
    address: item.address,

    coordinates: {
      lat,
      lng,
    },
  };
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

export default function SavedPlaces() {
  const navigate =
    useNavigate();

  const [
    savedPlaces,
    setSavedPlaces,
  ] = useState<SavedPlace[]>(
    [],
  );

  const [
    selectedPlace,
    setSelectedPlace,
  ] =
    useState<SavedPlace | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const loadSavedPlaces =
    useCallback(async () => {
      setLoading(true);
      setLoadError(false);

      try {
        const response =
          await passengerSavedPlacesApi.getAll();

        const places =
          extractSavedPlaces(
            response,
          )
            .map(toSavedPlace)
            .filter(
              (
                place,
              ): place is SavedPlace =>
                place !== null,
            );

        setSavedPlaces(
          places,
        );
      } catch (error) {
        console.error(
          "GET SAVED PLACES ERROR:",
          error,
        );

        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadSavedPlaces();
  }, [loadSavedPlaces]);

  const home =
    savedPlaces.find(
      (place) =>
        place.type === "home",
    );

  const work =
    savedPlaces.find(
      (place) =>
        place.type === "work",
    );

  const customPlaces =
    savedPlaces.filter(
      (place) =>
        place.type === "custom",
    );

  const openPlace = (
    place:
      | SavedPlace
      | undefined,
    type:
      | "home"
      | "work",
  ) => {
    if (place) {
      setSelectedPlace(
        place,
      );

      return;
    }

    navigate(
      `/passenger/account/saved-places/location/${type}`,
    );
  };

  const handleDelete =
    async () => {
      if (
        !selectedPlace ||
        deleting
      ) {
        return;
      }

      const place =
        selectedPlace;

      setDeleting(true);

      try {
        await passengerSavedPlacesApi.remove(
          place.id,
        );

        setSavedPlaces(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                place.id,
            ),
        );

        setSelectedPlace(
          null,
        );

        toast.success(
          `${place.name} removed`,
        );
      } catch (error) {
        console.error(
          "DELETE SAVED PLACE ERROR:",
          error,
        );

        toast.error(
          getErrorMessage(
            error,
          ),
        );
      } finally {
        setDeleting(false);
      }
    };

  return (
    <div className="min-h-[100dvh] bg-white">
      <RideHeader
        title="Saved Places"
        onBack={() =>
          navigate(
            "/passenger/account",
          )
        }
      />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-12 pt-5 sm:px-7">
        {loading ? (
          <SavedPlacesSkeleton />
        ) : loadError ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F3ECF9]">
              <MapPin
                size={25}
                className="text-[#7442AD]"
              />
            </span>

            <h2 className="mt-4 text-[18px] font-semibold text-[#302B34]">
              Couldn't load saved
              places
            </h2>

            <p className="mt-2 max-w-[300px] text-[14px] leading-6 text-[#918B95]">
              Check your connection
              and try again.
            </p>

            <button
              type="button"
              onClick={() =>
                void loadSavedPlaces()
              }
              className="mt-5 flex h-[48px] items-center gap-2 rounded-[13px] bg-[#7442AD] px-5 text-[15px] font-semibold text-white"
            >
              <RefreshCw
                size={17}
              />

              Try Again
            </button>
          </div>
        ) : (
          <motion.div
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="overflow-hidden rounded-[17px] bg-white shadow-[0_6px_30px_rgba(31,22,39,0.06)]"
          >
            <SavedPlaceRow
              name="Home"
              type="home"
              address={
                home?.address
              }
              onClick={() =>
                openPlace(
                  home,
                  "home",
                )
              }
            />

            <SavedPlaceRow
              name="Work"
              type="work"
              address={
                work?.address
              }
              onClick={() =>
                openPlace(
                  work,
                  "work",
                )
              }
            />

            {customPlaces.map(
              (place) => (
                <SavedPlaceRow
                  key={place.id}
                  name={
                    place.name
                  }
                  type="custom"
                  address={
                    place.address
                  }
                  onClick={() =>
                    setSelectedPlace(
                      place,
                    )
                  }
                />
              ),
            )}

            <SavedPlaceRow
              name="New Place"
              type="custom"
              onClick={() =>
                navigate(
                  "/passenger/account/saved-places/location/new",
                )
              }
            />
          </motion.div>
        )}
      </main>

      <SavedPlaceActionSheet
        open={
          selectedPlace !==
          null
        }
        onClose={() => {
          if (!deleting) {
            setSelectedPlace(
              null,
            );
          }
        }}
        onEdit={() => {
          if (
            !selectedPlace ||
            deleting
          ) {
            return;
          }

          const id =
            selectedPlace.id;

          setSelectedPlace(
            null,
          );

          navigate(
            `/passenger/account/saved-places/location/edit/${id}`,
            {
              state: {
                place:
                  selectedPlace,
              },
            },
          );
        }}
        onDelete={() => {
          void handleDelete();
        }}
      />
    </div>
  );
}

function SavedPlacesSkeleton() {
  return (
    <div className="overflow-hidden rounded-[17px] bg-white shadow-[0_6px_30px_rgba(31,22,39,0.06)]">
      {[1, 2, 3].map(
        (item) => (
          <div
            key={item}
            className="flex min-h-[72px] animate-pulse items-center gap-3 border-b border-[#EEEAF1] px-4 last:border-0"
          >
            <div className="h-10 w-10 rounded-full bg-[#F1EEF3]" />

            <div className="flex-1">
              <div className="h-4 w-24 rounded bg-[#F1EEF3]" />

              <div className="mt-2 h-3 w-[65%] rounded bg-[#F5F3F6]" />
            </div>
          </div>
        ),
      )}
    </div>
  );
}
