import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type EmergencyRelationship =
  | "Parent"
  | "Sibling"
  | "Spouse or partner"
  | "Family member"
  | "Friend or colleague";

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: EmergencyRelationship;
}

interface PassengerSafetyContextValue {
  pickupCodeEnabled: boolean;
  emergencyContacts: EmergencyContact[];

  setPickupCodeEnabled: (
    enabled: boolean,
  ) => void;

  addEmergencyContact: (
    contact: Omit<
      EmergencyContact,
      "id"
    >,
  ) => void;

  removeEmergencyContact: (
    id: string,
  ) => void;
}

const PassengerSafetyContext =
  createContext<
    PassengerSafetyContextValue | undefined
  >(undefined);

export function PassengerSafetyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    pickupCodeEnabled,
    setPickupCodeEnabled,
  ] = useState(false);

  const [
    emergencyContacts,
    setEmergencyContacts,
  ] = useState<
    EmergencyContact[]
  >([]);

  const addEmergencyContact = (
    contact: Omit<
      EmergencyContact,
      "id"
    >,
  ) => {
    setEmergencyContacts(
      (previous) => [
        ...previous,
        {
          ...contact,
          id: `${Date.now()}-${Math.random()}`,
        },
      ],
    );
  };

  const removeEmergencyContact = (
    id: string,
  ) => {
    setEmergencyContacts(
      (previous) =>
        previous.filter(
          (contact) =>
            contact.id !== id,
        ),
    );
  };

  const value = useMemo(
    () => ({
      pickupCodeEnabled,
      emergencyContacts,
      setPickupCodeEnabled,
      addEmergencyContact,
      removeEmergencyContact,
    }),
    [
      pickupCodeEnabled,
      emergencyContacts,
    ],
  );

  return (
    <PassengerSafetyContext.Provider
      value={value}
    >
      {children}
    </PassengerSafetyContext.Provider>
  );
}

export function usePassengerSafety() {
  const context = useContext(
    PassengerSafetyContext,
  );

  if (!context) {
    throw new Error(
      "usePassengerSafety must be used inside PassengerSafetyProvider",
    );
  }

  return context;
}