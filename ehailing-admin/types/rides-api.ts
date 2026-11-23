// Backend response types for the rides section, transcribed from the observed
// response shapes. Fields marked nullable were
// observed null in some or all samples; mapping code must treat every field as
// optional at runtime and never throw on a missing field.
//
// Money units (settled by arithmetic against observed pairs):
//   * ride fare / fareBreakdown.* totals are NAIRA (e.g. 2588.87 NGN).
//   * payment transaction amounts are KOBO (e.g. 258887 = 2588.87 x 100).
//     Divide by 100 before rendering as naira.
//
// Observed 2026-11-11. rideStatus values seen: paid, cancelled,
// no_drivers_found, payment_pending, driver_en_route, ride_in_progress (not
// treated as exhaustive). paymentStatus: paid, unpaid. category: economy,
// comfort, suv.

// GET /admin/ride-hailing/rides — observed envelope { items, total, page,
// limit, totalPages }.
export interface RideListResponse {
  items: RideListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RideListItem {
  id: string;
  passenger: {
    userId: string;
    name: string;
    phoneNumber: string | null;
  };
  driver: {
    userId: string;
    name: string;
    phoneNumber: string;
  } | null;
  pickupAddress: string;
  dropoffAddress: string;
  category: string; // economy | comfort | suv observed
  fare: number; // naira
  currency: string; // NGN observed
  paymentStatus: string; // paid | unpaid observed
  rideStatus: string; // paid | cancelled | no_drivers_found | payment_pending | driver_en_route | ride_in_progress observed
  requestedAt: string; // ISO datetime
}

// GET /admin/ride-hailing/rides/{rideId}/overview — bare object, no envelope.
export interface RideOverviewResponse {
  id: string;
  rideStatus: string;
  category: string;
  paymentMethod: string;
  passenger: {
    userId: string;
    name: string;
    phoneNumber: string | null;
    profilePicture: string | null;
  };
  driver: {
    userId: string;
    name: string;
    phoneNumber: string;
    profilePicture: string | null;
    rating: number | null;
  } | null;
  vehicle: {
    plateNumber: string;
    model: string;
    category: string;
  } | null;
  route: {
    pickup: { address: string; lat: number; lng: number };
    dropoff: { address: string; lat: number; lng: number };
    stops: unknown[];
    distanceKm: number;
    durationMin: number;
    isActual: boolean;
  };
  fareBreakdown: {
    baseFare: number;
    distanceCharge: number;
    timeCharge: number;
    bookingFee: number;
    surgeMultiplier: number;
    surgeCharge: number;
    waitingFee: number;
    waitingMinutes: number;
    approvedFees: number;
    discount: number;
    promoDiscount: number;
    subtotal: number;
    total: number; // naira
    platformCommission: number | null; // naira; null on unfinished rides
    driverEarnings: number | null; // naira; null on unfinished rides
    currency: string;
    isEstimate: boolean;
  };
}

// GET /admin/ride-hailing/rides/{rideId}/timeline — bare object, no envelope.
export interface RideTimelineResponse {
  entries: RideTimelineEntry[];
}

export interface RideTimelineEntry {
  id: string;
  at: string; // ISO datetime
  event: string;
  fromStatus: string | null;
  toStatus: string;
  actorId: string | null;
  actorRole: string;
  metadata: RideTimelineMetadata | null;
}

export interface RideTimelineMetadata {
  finalFare: number | null; // naira
  distanceKm: number | null;
  durationMin: number | null;
  driverEarnings: number | null; // naira
  waitingMinutes: number | null;
  platformCommission: number | null; // naira
  amount?: number; // kobo on payment events
  paymentId?: string;
  paymentMethod?: string;
}

// GET /admin/ride-hailing/rides/{rideId}/payment — bare object, no envelope.
export interface RidePaymentResponse {
  summary: RidePaymentSummary;
  transactions: RideTransaction[];
}

export interface RidePaymentSummary {
  currency: string; // NGN
  finalFare: number | null; // naira
  paidAt: string | null;
  paymentMethod: string;
  settlementType: string;
  isSettledAtCompletion: boolean;
  platformCommission: number | null; // naira
  driverEarnings: number | null; // naira
  cancellationFee: number | null; // naira
  promoCode: string | null;
  promoDiscount: number | null; // naira
}

export interface RideTransaction {
  id: string;
  referenceType: string;
  referenceId: string;
  purpose: string;
  methodType: string;
  status: string;
  amount: number; // kobo
  currency: string;
  gatewayProvider: string | null;
  gatewayReference: string | null;
  paidAt: string | null;
  createdAt: string | null;
  failureMessage: string | null;
}
