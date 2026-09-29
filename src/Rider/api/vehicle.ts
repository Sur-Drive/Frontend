const API_BASE = "https://backend-production-01de.up.railway.app";

async function parseResponse(res: Response, fallbackMessage: string) {
  const responseText = await res.text();

  if (!res.ok) {
    let errorData: any = {};
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = { raw: responseText };
    }

    console.log(
      "[vehicle] request failed:",
      res.url,
      res.status,
      JSON.stringify(errorData, null, 2),
    );

    throw new Error(
      errorData.message ||
        errorData.error ||
        `${fallbackMessage} (${res.status})`,
    );
  }

  const data = responseText ? JSON.parse(responseText) : {};

  console.log("[vehicle] request succeeded", {
    url: res.url,
    status: res.status,
    body: data,
  });

  return data;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("driverOnboardingToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Shape shared by every step in the rotating-token onboarding flow. */
export interface RideDriverVehicleStepResponse {
  message?: string;
  tempToken?: string;
  step?: string;
  nextStep?: string;
  completed?: boolean;
  progress?: number;
  totalSteps?: number;
  [key: string]: any;
}

/** GET /ride-drivers/vehicle — current vehicle onboarding status/data. */
export async function getRideDriverVehicle(): Promise<RideDriverVehicleStepResponse> {
  const res = await fetch(`${API_BASE}/ride-drivers/vehicle`, {
    method: "GET",
    headers: { Accept: "application/json", ...authHeaders() },
  });

  return parseResponse(res, "Failed to load vehicle information");
}

// ============================================================
// TEXT-ONLY DETAILS — sent as real JSON, NOT FormData.
// This is what keeps vehicleCapacity an actual number end-to-end
// instead of getting stringified by multipart/form-data.
// ============================================================

export interface RideDriverVehicleDetailsPayload {
  plateNumber: string;
  vehicleModel: string;
  vehicleCapacity: number;
  vehicleCategory: string; // "economy" | "comfort" | "suv"
}

/**
 * PATCH /ride-drivers/vehicle — plate/model/capacity/category ONLY.
 * Sent as application/json so vehicleCapacity travels as a real number
 * (5, not "5"), avoiding the FormData string-coercion issue entirely.
 */
export async function updateRideDriverVehicleDetails(
  payload: RideDriverVehicleDetailsPayload,
): Promise<RideDriverVehicleStepResponse> {
  console.log("[vehicle] JSON payload about to be sent:", {
    ...payload,
    vehicleCapacity_type: typeof payload.vehicleCapacity,
  });

  const res = await fetch(`${API_BASE}/ride-drivers/vehicle`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(res, "Failed to save vehicle details");
}

// ============================================================
// COMBINED SUBMIT — details + all 3 documents in ONE multipart
// request. Confirmed required: PATCH /ride-drivers/vehicle rejects
// with "Ownership document, vehicle license, and roadworthiness
// certificate are required" if the documents aren't attached to
// THIS request, even when they were already uploaded separately
// and are saved on the driver record. So this is the only request
// shape the backend currently accepts end-to-end for the vehicle_info
// step.
//
// KNOWN REMAINING ISSUE (backend-side, not fixable here):
// vehicleCapacity is forced to travel as a string inside FormData
// (there is no way to send a typed number in multipart/form-data).
// The backend DTO needs `@Type(() => Number)` (class-transformer) on
// vehicleCapacity so class-validator's @IsInt/@Min/@Max evaluate the
// coerced number instead of the raw string. Until that lands, this
// call will fail with "vehicleCapacity must be an integer number" /
// min / max messages even for a valid value.
// ============================================================

export interface RideDriverVehicleCombinedPayload {
  plateNumber: string;
  vehicleModel: string;
  vehicleCapacity: number;
  vehicleCategory: string;
  ownershipDocument: File;
  vehicleLicense: File;
  roadworthinessCertificate: File;
}

export async function updateRideDriverVehicleCombined(
  payload: RideDriverVehicleCombinedPayload,
): Promise<RideDriverVehicleStepResponse> {
  const formData = new FormData();

  formData.append("plateNumber", payload.plateNumber);
  formData.append("vehicleModel", payload.vehicleModel);
  formData.append(
    "vehicleCapacity",
    String(Math.trunc(payload.vehicleCapacity)),
  );
  formData.append("vehicleCategory", payload.vehicleCategory);
  formData.append("ownershipDoc", payload.ownershipDocument);
  formData.append("vehicleLicense", payload.vehicleLicense);
  formData.append("roadworthiness", payload.roadworthinessCertificate);

  console.log("[vehicle] combined FormData entries about to be sent:");
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`  ${key}: File(name=${value.name}, size=${value.size})`);
    } else {
      console.log(`  ${key}: "${value}" (typeof ${typeof value})`);
    }
  }

  const res = await fetch(`${API_BASE}/ride-drivers/vehicle`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
    body: formData,
  });

  return parseResponse(res, "Failed to save vehicle details");
}

// ============================================================
// DOCUMENT UPLOADS — each its own multipart request.
// Kept for standalone re-uploads after onboarding (e.g. replacing a
// rejected document later). NOT sufficient on their own for initial
// onboarding — see updateRideDriverVehicleCombined above, confirmed
// required for the vehicle_info step to actually advance.
// ============================================================

/** PATCH /ride-drivers/vehicle/ownership — multipart, field: file */
export async function uploadRideDriverVehicleOwnership(
  file: File,
): Promise<RideDriverVehicleStepResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/ride-drivers/vehicle/ownership`, {
    method: "PATCH",
    headers: { Accept: "application/json", ...authHeaders() },
    body: formData,
  });

  return parseResponse(res, "Failed to upload ownership document");
}

/** PATCH /ride-drivers/vehicle/license — multipart, field: file */
export async function uploadRideDriverVehicleLicense(
  file: File,
): Promise<RideDriverVehicleStepResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/ride-drivers/vehicle/license`, {
    method: "PATCH",
    headers: { Accept: "application/json", ...authHeaders() },
    body: formData,
  });

  return parseResponse(res, "Failed to upload vehicle license");
}

/** PATCH /ride-drivers/vehicle/roadworthiness — multipart, field: file */
export async function uploadRideDriverVehicleRoadworthiness(
  file: File,
): Promise<RideDriverVehicleStepResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/ride-drivers/vehicle/roadworthiness`, {
    method: "PATCH",
    headers: { Accept: "application/json", ...authHeaders() },
    body: formData,
  });

  return parseResponse(res, "Failed to upload road worthiness document");
}

export interface RideDriverDriversLicensePayload {
  expiryDate: string; // MM/YYYY
  licenseNumber: string;
  issuingCountry: string;
  file: File;
}

/**
 * PATCH /ride-drivers/license - multipart (completes the onboarding license step).
 * Field names are the backend's: licenseNumber, licenseExpiry (MM/YYYY),
 * licenseCountry, licenseDoc (file).
 */
export async function submitRideDriverDriversLicense(
  payload: RideDriverDriversLicensePayload,
): Promise<RideDriverVehicleStepResponse> {
  const formData = new FormData();
  formData.append("licenseNumber", payload.licenseNumber);
  formData.append("licenseExpiry", payload.expiryDate);
  formData.append("licenseCountry", payload.issuingCountry);
  formData.append("licenseDoc", payload.file);

  const res = await fetch(`${API_BASE}/ride-drivers/license`, {
    method: "PATCH",
    headers: { Accept: "application/json", ...authHeaders() },
    body: formData,
  });

  return parseResponse(res, "Failed to save driver's license");
}
