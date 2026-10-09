import { driverFetch } from "./account";

export type EmergencyRelationship =
  | "sibling"
  | "spouse"
  | "parent"
  | "child"
  | "friend"
  | "relative"
  | "colleague"
  | "other";

export interface RideDriverEmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  isPrimary: boolean;
  notifyOnRideStart: boolean;
  /** Whatever the API returned for this contact, untouched. */
  raw: any;
}

export interface NewEmergencyContactPayload {
  name: string;
  phoneNumber: string; // E.164, e.g. +2348124568001
  relationship: EmergencyRelationship;
  isPrimary: boolean;
  notifyOnRideStart: boolean;
}

export interface UpdateEmergencyContactPayload {
  name?: string;
  isPrimary?: boolean;
  notifyOnRideStart?: boolean;
}

/** "803 660 0027" / "0803 660 0027" -> "+2348036600027" */
export function toE164(raw: string): string {
  const v = raw.replace(/[\s()-]/g, "");
  if (v.startsWith("+")) return v;
  if (v.startsWith("234")) return `+${v}`;
  if (v.startsWith("0")) return `+234${v.slice(1)}`;
  return `+234${v}`;
}

function normalizeContact(c: any): RideDriverEmergencyContact {
  return {
    id: String(c?.id ?? c?._id ?? c?.contactId ?? ""),
    name: c?.name ?? c?.fullName ?? "",
    phoneNumber: c?.phoneNumber ?? c?.phone ?? "",
    relationship: String(c?.relationship ?? "").toLowerCase(),
    isPrimary: !!c?.isPrimary,
    notifyOnRideStart: !!c?.notifyOnRideStart,
    raw: c,
  };
}

// The list may be a bare array or wrapped in data/contacts/emergencyContacts.
function extractList(body: any): any[] {
  if (Array.isArray(body)) return body;
  const candidates = [
    body?.data,
    body?.contacts,
    body?.emergencyContacts,
    body?.data?.contacts,
    body?.data?.emergencyContacts,
    body?.items,
  ];
  return candidates.find(Array.isArray) ?? [];
}

/** GET /ride-drivers/emergency-contacts */
export async function getEmergencyContacts(): Promise<
  RideDriverEmergencyContact[]
> {
  const body = await driverFetch(
    "/ride-drivers/emergency-contacts",
    "GET",
    "Failed to load emergency contacts",
  );
  return extractList(body)
    .map(normalizeContact)
    .filter((c) => c.id);
}

/** POST /ride-drivers/emergency-contacts */
export const addEmergencyContact = (payload: NewEmergencyContactPayload) =>
  driverFetch(
    "/ride-drivers/emergency-contacts",
    "POST",
    "Failed to add contact",
    payload,
  );

/** PATCH /ride-drivers/emergency-contacts/:contactId */
export const updateEmergencyContact = ({
  contactId,
  ...payload
}: UpdateEmergencyContactPayload & { contactId: string }) =>
  driverFetch(
    `/ride-drivers/emergency-contacts/${encodeURIComponent(contactId)}`,
    "PATCH",
    "Failed to update contact",
    payload,
  );

/** DELETE /ride-drivers/emergency-contacts/:contactId */
export const deleteEmergencyContact = (contactId: string) =>
  driverFetch(
    `/ride-drivers/emergency-contacts/${encodeURIComponent(contactId)}`,
    "DELETE",
    "Failed to delete contact",
  );
