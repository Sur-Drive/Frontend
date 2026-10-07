import {
  passengerApi,
} from "./passengerClient";

export type EmergencyRelationship =
  | "spouse"
  | "parent"
  | "sibling"
  | "child"
  | "friend"
  | "relative"
  | "colleague"
  | "other";

export interface PassengerEmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  relationship: EmergencyRelationship;
}

/*
 * The documentation does not provide the response
 * schema for pickup-code, so don't invent one.
 */
export type PickupCodeResponse =
  unknown;

export interface CreateEmergencyContactRequest {
  name: string;
  phoneNumber: string;
  relationship: EmergencyRelationship;
}

export interface UpdateEmergencyContactRequest {
  name?: string;

  /*
   * IMPORTANT:
   * Backend PATCH documentation currently shows `phone`,
   * while POST uses `phoneNumber`.
   *
   * Keep `phone` here until backend testing confirms
   * otherwise.
   */
  phone?: string;

  relationship?: EmergencyRelationship;
}

export const passengerSafetyApi = {
  setPickupCode: (
    enabled: boolean,
  ) =>
    passengerApi.patch<PickupCodeResponse>(
      "/riders/pickup-code",
      {
        enabled,
      },
      {
        authMode: "access",
      },
    ),

  getEmergencyContacts: () =>
    passengerApi.get<
      PassengerEmergencyContact[]
    >(
      "/riders/emergency-contacts",
      {
        authMode: "access",
      },
    ),

  createEmergencyContact: (
    payload:
      CreateEmergencyContactRequest,
  ) =>
    passengerApi.post<
      PassengerEmergencyContact
    >(
      "/riders/emergency-contacts",
      payload,
      {
        authMode: "access",
      },
    ),

  updateEmergencyContact: (
    contactId: string,
    payload:
      UpdateEmergencyContactRequest,
  ) =>
    passengerApi.patch<
      PassengerEmergencyContact
    >(
      `/riders/emergency-contacts/${contactId}`,
      payload,
      {
        authMode: "access",
      },
    ),

  deleteEmergencyContact: (
    contactId: string,
  ) =>
    passengerApi.delete<unknown>(
      `/riders/emergency-contacts/${contactId}`,
      {
        authMode: "access",
      },
    ),
};