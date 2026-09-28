import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  PassengerRideState,
  PaymentMethod,
  RideCategory,
  RideDriver,
  RideLocation,
  RideStatus,
  RideStop,
} from "../types/passengerRide";

import { defaultPaymentMethod } from "../data/passengerRide";

interface PassengerRideContextValue {
  ride: PassengerRideState;

  setPickup: (location: RideLocation | null) => void;

  setDestination: (
    location: RideLocation | null,
  ) => void;

  swapLocations: () => void;

  addStop: (stop: RideStop) => void;

  removeStop: (id: string) => void;

  updateStop: (
    id: string,
    location: RideLocation,
  ) => void;

  selectRide: (ride: RideCategory) => void;

  setPaymentMethod: (
    method: PaymentMethod,
  ) => void;

  setPromoCode: (code: string | null) => void;

  applyPromo: (code: string | null) => void;

  setRideStatus: (status: RideStatus) => void;

  setDriver: (driver: RideDriver | null) => void;

  setEstimatedFare: (fare: number | null) => void;

  setTripInfo: (
    distance: string | null,
    duration: string | null,
  ) => void;

  setVerificationCode: (
    code: string | null,
  ) => void;

  completeRide: (fare: number) => void;

  resetRide: () => void;
}

const initialRideState: PassengerRideState = {
  status: "idle",

  pickup: null,
  destination: null,

  stops: [],

  selectedRide: null,

  paymentMethod: defaultPaymentMethod,

  promoCode: null,

  driver: null,

  estimatedFare: null,
  finalFare: null,

  distance: null,
  duration: null,

  verificationCode: null,
};

const PassengerRideContext =
  createContext<PassengerRideContextValue | null>(
    null,
  );

export function PassengerRideProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [ride, setRide] =
    useState<PassengerRideState>(
      initialRideState,
    );

  const setPickup = useCallback(
    (location: RideLocation | null) => {
      setRide((previous) => ({
        ...previous,
        pickup: location,
      }));
    },
    [],
  );

  const setDestination = useCallback(
    (location: RideLocation | null) => {
      setRide((previous) => ({
        ...previous,
        destination: location,
      }));
    },
    [],
  );

  const swapLocations = useCallback(() => {
    setRide((previous) => ({
      ...previous,

      pickup: previous.destination,
      destination: previous.pickup,
    }));
  }, []);

  const addStop = useCallback(
    (stop: RideStop) => {
      setRide((previous) => ({
        ...previous,
        stops: [...previous.stops, stop],
      }));
    },
    [],
  );

  const removeStop = useCallback(
    (id: string) => {
      setRide((previous) => ({
        ...previous,
        stops: previous.stops.filter(
          (stop) => stop.id !== id,
        ),
      }));
    },
    [],
  );

  const updateStop = useCallback(
    (
      id: string,
      location: RideLocation,
    ) => {
      setRide((previous) => ({
        ...previous,

        stops: previous.stops.map(
          (stop) =>
            stop.id === id
              ? {
                  ...stop,
                  ...location,
                }
              : stop,
        ),
      }));
    },
    [],
  );

  const selectRide = useCallback(
    (selectedRide: RideCategory) => {
      setRide((previous) => ({
        ...previous,
        selectedRide,
      }));
    },
    [],
  );

  const setPromoCode = (
  code: string | null,
) => {
  setRide((previous) => ({
    ...previous,
    promoCode: code,
  }));
};

  const setPaymentMethod = useCallback(
    (paymentMethod: PaymentMethod) => {
      setRide((previous) => ({
        ...previous,
        paymentMethod,
      }));
    },
    [],
  );

  const applyPromo = useCallback(
    (promoCode: string | null) => {
      setRide((previous) => ({
        ...previous,
        promoCode,
      }));
    },
    [],
  );

  const setRideStatus = useCallback(
    (status: RideStatus) => {
      setRide((previous) => ({
        ...previous,
        status,
      }));
    },
    [],
  );

  const setDriver = useCallback(
    (driver: RideDriver | null) => {
      setRide((previous) => ({
        ...previous,
        driver,
      }));
    },
    [],
  );

  const setEstimatedFare = useCallback(
    (estimatedFare: number | null) => {
      setRide((previous) => ({
        ...previous,
        estimatedFare,
      }));
    },
    [],
  );

  const setTripInfo = useCallback(
    (
      distance: string | null,
      duration: string | null,
    ) => {
      setRide((previous) => ({
        ...previous,
        distance,
        duration,
      }));
    },
    [],
  );

  const setVerificationCode = useCallback(
    (verificationCode: string | null) => {
      setRide((previous) => ({
        ...previous,
        verificationCode,
      }));
    },
    [],
  );

  const completeRide = useCallback(
    (finalFare: number) => {
      setRide((previous) => ({
        ...previous,
        finalFare,
        status: "completed",
      }));
    },
    [],
  );

  const resetRide = useCallback(() => {
    setRide(initialRideState);
  }, []);

  const value = useMemo(
    () => ({
      ride,
setPromoCode,
      setPickup,
      setDestination,

      swapLocations,

      addStop,
      removeStop,
      updateStop,

      selectRide,

      setPaymentMethod,
      applyPromo,

      setRideStatus,

      setDriver,

      setEstimatedFare,

      setTripInfo,

      setVerificationCode,

      completeRide,

      resetRide,
    }),
    [
      ride,

      setPickup,
      setDestination,

      swapLocations,

      addStop,
      removeStop,
      updateStop,

      selectRide,

      setPaymentMethod,
      applyPromo,

      setRideStatus,

      setDriver,

      setEstimatedFare,

      setTripInfo,

      setVerificationCode,

      completeRide,

      resetRide,
    ],
  );

  return (
    <PassengerRideContext.Provider
      value={value}
    >
      {children}
    </PassengerRideContext.Provider>
  );
}

export function usePassengerRide() {
  const context = useContext(
    PassengerRideContext,
  );

  if (!context) {
    throw new Error(
      "usePassengerRide must be used inside PassengerRideProvider",
    );
  }

  return context;
}