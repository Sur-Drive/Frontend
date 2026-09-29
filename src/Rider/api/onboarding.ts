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

    console.log("[onboarding] request failed", {
      url: res.url,
      status: res.status,
      body: errorData,
    });

    throw new Error(
      errorData.message ||
        errorData.error ||
        `${fallbackMessage} (${res.status})`,
    );
  }

  const data = responseText ? JSON.parse(responseText) : {};

  console.log("[onboarding] request succeeded", {
    url: res.url,
    status: res.status,
    body: data,
  });

  return data;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("driverOnboardingToken");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

/* ============================================================
   SHARED RESPONSE
============================================================ */

export interface RideDriverStepResponse {
  message?: string;
  tempToken?: string;
  step?: string;
  nextStep?: string;
  completed?: boolean;
  progress?: number;
  totalSteps?: number;
  [key: string]: any;
}

/* ============================================================
   VEHICLE INFORMATION
============================================================ */

export interface RideDriverVehicleDetailsPayload {
  plateNumber: string;
  vehicleModel: string;
  vehicleCapacity: number;
  vehicleCategory: string;

  /*
   * These are required by the current frontend interface,
   * but they are NOT sent to /ride-drivers/vehicle.
   *
   * They are uploaded through their own endpoints below.
   */
  ownershipDocument: File;
  vehicleLicense: File;
  roadworthinessCertificate: File;
}

/**
 * PATCH /ride-drivers/vehicle
 */
export async function updateRideDriverVehicle(
  payload: RideDriverVehicleDetailsPayload,
): Promise<RideDriverStepResponse> {
  const formData = new FormData();

  formData.append("plateNumber", payload.plateNumber);

  formData.append("vehicleModel", payload.vehicleModel);

  formData.append(
    "vehicleCapacity",
    String(Math.trunc(payload.vehicleCapacity)),
  );

  formData.append("vehicleCategory", payload.vehicleCategory);

  console.log("[vehicle] sending data", {
    plateNumber: payload.plateNumber,
    vehicleModel: payload.vehicleModel,
    vehicleCapacity: payload.vehicleCapacity,
    vehicleCapacityType: typeof payload.vehicleCapacity,
    vehicleCategory: payload.vehicleCategory,
  });

  console.log("[vehicle] FormData contents:");

  for (const [key, value] of formData.entries()) {
    console.log(
      key,
      value instanceof File ? `File: ${value.name}` : value,
      typeof value,
    );
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

/**
 * PATCH /ride-drivers/vehicle/ownership
 */
export async function uploadRideDriverVehicleOwnership(
  file: File,
): Promise<RideDriverStepResponse> {
  const formData = new FormData();

  formData.append("file", file);

  const res = await fetch(`${API_BASE}/ride-drivers/vehicle/ownership`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
    body: formData,
  });

  return parseResponse(res, "Failed to upload ownership document");
}

/**
 * PATCH /ride-drivers/vehicle/license
 */
export async function uploadRideDriverVehicleLicense(
  file: File,
): Promise<RideDriverStepResponse> {
  const formData = new FormData();

  formData.append("file", file);

  const res = await fetch(`${API_BASE}/ride-drivers/vehicle/license`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
    body: formData,
  });

  return parseResponse(res, "Failed to upload vehicle license");
}

/**
 * PATCH /ride-drivers/vehicle/roadworthiness
 */
export async function uploadRideDriverVehicleRoadworthiness(
  file: File,
): Promise<RideDriverStepResponse> {
  const formData = new FormData();

  formData.append("file", file);

  const res = await fetch(`${API_BASE}/ride-drivers/vehicle/roadworthiness`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
    body: formData,
  });

  return parseResponse(res, "Failed to upload road worthiness certificate");
}

/* ============================================================
   VEHICLE INSPECTION
============================================================ */

export interface RideDriverInspectionPayload {
  rightRear: File;
  leftRear: File;
  front: File;
  back: File;
  driverSide: File;
  passengerSide: File;
  frontInterior: File;
  backInterior: File;
  dashboard: File;
}

/**
 * PATCH /ride-drivers/inspection
 */
export async function submitRideDriverInspection(
  payload: RideDriverInspectionPayload,
): Promise<RideDriverStepResponse> {
  const formData = new FormData();

  formData.append("rightRear", payload.rightRear);
  formData.append("leftRear", payload.leftRear);
  formData.append("front", payload.front);
  formData.append("back", payload.back);
  formData.append("driverSide", payload.driverSide);
  formData.append("passengerSide", payload.passengerSide);
  formData.append("frontInterior", payload.frontInterior);
  formData.append("backInterior", payload.backInterior);
  formData.append("dashboard", payload.dashboard);

  const res = await fetch(`${API_BASE}/ride-drivers/inspection`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
    body: formData,
  });

  return parseResponse(res, "Failed to submit vehicle inspection");
}

/* ============================================================
   PROFILE / FACE PHOTO
============================================================ */

/**
 * PATCH /ride-drivers/profile-picture
 */
export async function uploadRideDriverProfilePicture(
  facePhoto: File,
): Promise<RideDriverStepResponse> {
  const formData = new FormData();

  formData.append("facePhoto", facePhoto);

  const res = await fetch(`${API_BASE}/ride-drivers/profile-picture`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
    body: formData,
  });

  return parseResponse(res, "Failed to upload face photo");
}

/* ============================================================
   PASSWORD
============================================================ */

export interface RideDriverSetPasswordPayload {
  password: string;
  confirmPassword: string;
}

/**
 * PATCH /ride-drivers/password
 */
export async function setRideDriverPassword(
  payload: RideDriverSetPasswordPayload,
): Promise<RideDriverStepResponse> {
  const res = await fetch(`${API_BASE}/ride-drivers/password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(res, "Failed to set password");
}

/* ============================================================
   STATUS
============================================================ */

export interface RideDriverStatusResponse {
  status?: string;
  step?: string;
  nextStep?: string;
  completed?: boolean;
  progress?: number;
  totalSteps?: number;
  [key: string]: any;
}

/**
 * GET /ride-drivers/status
 */
export async function getRideDriverStatus(): Promise<RideDriverStatusResponse> {
  const res = await fetch(`${API_BASE}/ride-drivers/status`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });

  return parseResponse(res, "Failed to load application status");
}
