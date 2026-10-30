import { passengerApi } from "./passengerClient";

/* =========================================================
   PAYMENT TYPES
========================================================= */

export type RidePaymentMethod = "CARD" | "CASH";

export interface RidePaymentOption {
  method: "CARD" | "WALLET";
  available: boolean;
  balance?: number;
  reason?: string;
}

export interface PendingRideCheckout {
  paymentId: string;
  redirectUrl: string | null;
}

export interface RidePaymentState {
  rideId: string;
  rideStatus: string;
  amount: number;
  currency: string;
  bookedMethod: "card" | "cash";
  payable: boolean;
  paid: boolean;
  options: RidePaymentOption[];
  pendingCheckout: PendingRideCheckout | null;
}

export interface RideCheckoutResponse {
  status: string;
  paymentId?: string;
  redirectUrl: string | null;
}


/* =========================================================
   CHECKOUT REQUEST
========================================================= */

export interface RideCheckoutRequest {
  method: "CARD";
}


/* =========================================================
   VERIFICATION RESPONSE
========================================================= */

export interface RidePaymentVerificationResponse {
  rideId?: string;

  status?: string;

  paymentStatus?: string;

  payable?: boolean;

  reference?: string;

  verified?: boolean;

  success?: boolean;

  [key: string]: unknown;
}

/* =========================================================
   PASSENGER PAYMENT API
========================================================= */

export const passengerPaymentApi = {
  /* -------------------------------------------------------
     GET RIDE PAYMENT

     GET /rides/:id/payment

     Used when:
     - Ride is completed
     - Ride enters payment_pending
     - Passenger returns to the app
     - WebSocket reconnects
     - Passenger opens the payment screen
  ------------------------------------------------------- */

  getPayment(rideId: string) {
    return passengerApi.get<RidePaymentState>(
      `/rides/${encodeURIComponent(rideId)}/payment`,
      {
        authMode: "access",
      },
    );
  },

  /* -------------------------------------------------------
     START CARD CHECKOUT

     POST /rides/:id/payment/checkout

     Backend starts the Paystack payment process.
  ------------------------------------------------------- */

  checkout(rideId: string) {
    const payload: RideCheckoutRequest = {
      method: "CARD",
    };

    return passengerApi.post<RideCheckoutResponse>(
      `/rides/${encodeURIComponent(rideId)}/payment/checkout`,
      payload,
      {
        authMode: "access",
      },
    );
  },

  /* -------------------------------------------------------
     VERIFY CARD PAYMENT

     POST /rides/:id/payment/verify

     Called after the passenger returns from Paystack
     or requests payment verification manually.
  ------------------------------------------------------- */

  verify(rideId: string) {
    return passengerApi.post<RidePaymentVerificationResponse>(
      `/rides/${encodeURIComponent(rideId)}/payment/verify`,
      {},
      {
        authMode: "access",
      },
    );
  },
};