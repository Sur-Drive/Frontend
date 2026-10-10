import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import type {
  PassengerProfile,
} from "../types/passengerProfile";

interface PassengerProfileContextValue {
  profile: PassengerProfile;
  userId: string | null;

  setAuthenticatedUserId: (id: string | null) => void;

  updateProfile: (
    updates: Partial<PassengerProfile>,
  ) => void;

  updateEmail: (email: string) => void;
  updatePhone: (phone: string) => void;
}

const PassengerProfileContext =
  createContext<
    PassengerProfileContextValue | undefined
  >(undefined);

const initialProfile: PassengerProfile = {
  firstName: "Adeniji",
  lastName: "Abiodun",
  phone: "+234 803 660 0027",
  email: "adenijiabiodun@gmail.com",
  gender: "Male",
  dateOfBirth: "December, 29",
};

export function PassengerProfileProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, setProfile] =
    useState<PassengerProfile>(initialProfile);

  const [userId, setUserId] =
    useState<string | null>(null);

  const setAuthenticatedUserId = (
    id: string | null,
  ) => {
    setUserId(id);
  };

  const updateProfile = (
    updates: Partial<PassengerProfile>,
  ) => {
    setProfile((previous) => ({
      ...previous,
      ...updates,
    }));
  };

  const updateEmail = (email: string) => {
    updateProfile({ email });
  };

  const updatePhone = (phone: string) => {
    updateProfile({ phone });
  };

  return (
    <PassengerProfileContext.Provider
      value={{
        profile,
        userId,
        setAuthenticatedUserId,
        updateProfile,
        updateEmail,
        updatePhone,
      }}
    >
      {children}
    </PassengerProfileContext.Provider>
  );
}

export function usePassengerProfile() {
  const context = useContext(
    PassengerProfileContext,
  );

  if (!context) {
    throw new Error(
      "usePassengerProfile must be used inside PassengerProfileProvider",
    );
  }

  return context;
}

