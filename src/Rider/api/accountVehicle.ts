import { driverFetch } from "./account";

/**
 * Logged-in driver vehicle calls (Account > Vehicle Information).
 * Uses driverFetch, which sends the driver login token ("token"), NOT the
 * onboarding token that api/vehicle.ts uses.
 */

export type VehicleDocKind =
  | "ownership"
  | "license"
  | "roadworthiness"
  | "drivers-license";

export interface VehicleDocumentInfo {
  url?: string;
  fileName?: string;
  status?: string;
  verified?: boolean;
  expiryDate?: string;
  expiresAt?: string;
  [key: string]: any;
}

export interface DriverVehicle {
  vehicleModel?: string;
  plateNumber?: string;
  category?: string;
  capacity?: number;
  documents?: {
    ownershipDocument?: VehicleDocumentInfo | string | null;
    vehicleLicense?: VehicleDocumentInfo | string | null;
    roadworthiness?: VehicleDocumentInfo | string | null;
    driversLicense?: VehicleDocumentInfo | string | null;
  };
  [key: string]: any;
}

/** GET /ride-drivers/vehicle */
export const getDriverVehicle = () =>
  driverFetch(
    "/ride-drivers/vehicle",
    "GET",
    "Failed to load vehicle information",
  ) as Promise<DriverVehicle>;

const PATHS: Record<VehicleDocKind, string> = {
  ownership: "/ride-drivers/vehicle/ownership",
  license: "/ride-drivers/vehicle/license",
  roadworthiness: "/ride-drivers/vehicle/roadworthiness",
  "drivers-license": "/ride-drivers/vehicle/drivers-license",
};

/** PATCH /ride-drivers/vehicle/<kind> — multipart, field: file */
export function uploadVehicleDocument(kind: VehicleDocKind, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return driverFetch(
    PATHS[kind],
    "PATCH",
    "Failed to upload document",
    formData,
  );
}
