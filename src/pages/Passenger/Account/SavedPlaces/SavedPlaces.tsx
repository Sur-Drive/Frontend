import {
  useState,
} from "react";

import {
  motion,
} from "framer-motion";

import {
  useNavigate,
} from "react-router-dom";

import RideHeader from "../../../../components/passenger/ride/RideHeader";

import SavedPlaceRow from "../../../../components/passenger/saved-places/SavedPlaceRow";
import SavedPlaceActionSheet from "../../../../components/passenger/saved-places/SavedPlaceActionSheet";

import {
  usePassengerSavedPlaces,
} from "../../../../context/PassengerSavedPlacesContext";

import type {
  SavedPlace,
} from "../../../../types/savedPlace";

export default function SavedPlaces() {
  const navigate =
    useNavigate();

  const {
    savedPlaces,
    deleteSavedPlace,
  } =
    usePassengerSavedPlaces();

  const [
    selectedPlace,
    setSelectedPlace,
  ] =
    useState<SavedPlace | null>(
      null,
    );

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
                name={place.name}
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
      </main>

      <SavedPlaceActionSheet
        open={
          selectedPlace !==
          null
        }
        onClose={() =>
          setSelectedPlace(
            null,
          )
        }
        onEdit={() => {
          if (
            !selectedPlace
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
          );
        }}
        onDelete={() => {
          if (
            !selectedPlace
          ) {
            return;
          }

          deleteSavedPlace(
            selectedPlace.id,
          );

          setSelectedPlace(
            null,
          );
        }}
      />
    </div>
  );
}