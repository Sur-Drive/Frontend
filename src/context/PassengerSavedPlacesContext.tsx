import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  SavedPlace,
} from "../types/savedPlace";

interface PassengerSavedPlacesContextValue {
  savedPlaces: SavedPlace[];

  addSavedPlace: (
    place: SavedPlace,
  ) => void;

  updateSavedPlace: (
    id: string,
    place: Partial<SavedPlace>,
  ) => void;

  deleteSavedPlace: (
    id: string,
  ) => void;

  getPlaceById: (
    id: string,
  ) => SavedPlace | undefined;
}

const PassengerSavedPlacesContext =
  createContext<
    PassengerSavedPlacesContextValue | undefined
  >(undefined);

export function PassengerSavedPlacesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    savedPlaces,
    setSavedPlaces,
  ] = useState<SavedPlace[]>([]);

  const addSavedPlace = (
    place: SavedPlace,
  ) => {
    setSavedPlaces(
      (previous) => {
        /*
         * Home and Work should only have one
         * saved entry each.
         */
        if (
          place.type === "home" ||
          place.type === "work"
        ) {
          return [
            ...previous.filter(
              (item) =>
                item.type !==
                place.type,
            ),
            place,
          ];
        }

        return [
          ...previous,
          place,
        ];
      },
    );
  };

  const updateSavedPlace = (
    id: string,
    changes: Partial<SavedPlace>,
  ) => {
    setSavedPlaces(
      (previous) =>
        previous.map(
          (place) =>
            place.id === id
              ? {
                  ...place,
                  ...changes,
                }
              : place,
        ),
    );
  };

  const deleteSavedPlace = (
    id: string,
  ) => {
    setSavedPlaces(
      (previous) =>
        previous.filter(
          (place) =>
            place.id !== id,
        ),
    );
  };

  const getPlaceById = (
    id: string,
  ) =>
    savedPlaces.find(
      (place) =>
        place.id === id,
    );

  const value = useMemo(
    () => ({
      savedPlaces,
      addSavedPlace,
      updateSavedPlace,
      deleteSavedPlace,
      getPlaceById,
    }),
    [savedPlaces],
  );

  return (
    <PassengerSavedPlacesContext.Provider
      value={value}
    >
      {children}
    </PassengerSavedPlacesContext.Provider>
  );
}

export function usePassengerSavedPlaces() {
  const context = useContext(
    PassengerSavedPlacesContext,
  );

  if (!context) {
    throw new Error(
      "usePassengerSavedPlaces must be used inside PassengerSavedPlacesProvider",
    );
  }

  return context;
}