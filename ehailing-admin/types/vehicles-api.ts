// Backend response types for GET /admin/ride-hailing/vehicles, transcribed
// from the observed response shapes (list
// observed 2026-11-11 at limit=50 across all 37 rows; detail observed
// 2026-11-11 for both id forms, which returned byte-identical bodies).
// Fields marked nullable were observed null in some or all samples; mapping
// code must treat every field as optional at runtime.

// Observed envelope: { items, total, page, limit, totalPages }.
export interface VehicleListResponse {
  items: VehicleListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VehicleListItem {
  profileId: string;
  userId: string;
  // Null on 23 of 37 observed rows (vehicle record not filled in yet).
  makeModel: string | null;
  make: string | null;
  model: string | null;
  registrationNumber: string | null;
  // Observed: comfort | economy | suv | null (null on 23 of 37 rows).
  category: string | null;
  capacity: number | null;
  driver: {
    name: string;
    email: string;
    phoneNumber: string;
    profilePicture: string | null;
  } | null;
  // Null in all 37 observed rows (2026-11-11).
  insuranceExpiry: string | null;
  // A pair: the nearest expiring document's name and expiry (observed
  // name "Roadworthiness", expiry a DateTime, on 1 of 37 rows).
  nearestDocumentExpiry: string | null;
  nearestDocumentName: string | null;
  inspection: {
    uploaded: number;
    total: number;
    complete: boolean;
    // Observed as either 0 or 9 entries — document/shot names.
    missing: string[];
  };
  // Observed: approved | pending | suspended (2026-11-11, all 37 rows).
  accountStatus: string | null;
  hasDocumentIssues: boolean;
}

// GET /admin/ride-hailing/vehicles/{driverProfileId} and the identical
// GET /admin/ride-hailing/vehicles/{driverUserId} (both observed 2026-11-11,
// same body for the same record). Bare object — no envelope.
export interface VehicleDetailResponse {
  profileId: string;
  userId: string;
  vehicle: {
    makeModel: string | null;
    make: string | null;
    model: string | null;
    registrationNumber: string | null;
    category: string | null;
    capacity: number | null;
    plateNumber: string | null;
  } | null;
  driver: {
    userId: string;
    name: string;
    email: string | null;
    phoneNumber: string | null;
    profilePicture: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    accountStatus: string | null;
  } | null;
  approval: {
    // Observed: approved | suspended on the two sampled details; the list
    // sample also contains pending, so treat the value as an open string.
    status: string | null;
    approvedAt: string | null;
    approvedBy: string | null;
    rejectionReason: string | null;
    onboardingStep: string | null;
  } | null;
  documents: VehicleDocumentItem[];
  inspectionPhotos: VehicleInspectionPhoto[];
  inspectionSummary: {
    total: number;
    uploaded: number;
    missing: string[];
    complete: boolean;
  } | null;
  facePhoto: {
    url: string | null;
    capturedAt: string | null;
  } | null;
  extras: {
    baseLocation: {
      lat: number | null;
      lng: number | null;
      address: string;
    } | null;
    // National identification number — sensitive; never rendered, logged or
    // stored by the admin UI (see lib/entity-details/vehicle.ts).
    nin: string | null;
    licenseNumber: string | null;
    licenseCountry: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  } | null;
}

export interface VehicleDocumentItem {
  documentKey: string;
  documentName: string;
  url: string | null;
  // Observed: pending | verified (2026-11-11). rawStatus carried the same
  // values as status in every observed row.
  status: string | null;
  rawStatus: string | null;
  expiryDate: string | null;
  daysUntilExpiry: number | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

export interface VehicleInspectionPhoto {
  key: string;
  name: string;
  url: string | null;
  uploaded: boolean;
}
