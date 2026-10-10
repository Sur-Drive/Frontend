import {
  passengerApi,
} from "./passengerClient";

export interface PassengerProfileResponse {
  id: string;
  userId: string;

  fullName: string;

  phoneNumber: string | null;
  email: string | null;

  dateOfBirth: string | null;
  gender: string | null;

  profilePicture: string | null;

  rating: number;
  totalRides: number;
  totalSpent: number;
  cancellationCount: number;

  status: string;

  locationEnabled: boolean;

  currentLat: number | null;
  currentLng: number | null;
  currentAddress: string | null;

  lastLocationAt: string | null;

  homeAddress: string | null;
  homeLat: number | null;
  homeLng: number | null;

  workAddress: string | null;
  workLat: number | null;
  workLng: number | null;

  primaryEmergencyContact: unknown | null;
  emergencyContactsCount: number;

  shareTripWithContacts: boolean;

  preferredPaymentMethod:
    | "cash"
    | "card"
    | "wallet"
    | string
    | null;

  pickupCodeEnabled: boolean;

  isOnRide: boolean;

  defaultPickupAddress:
    | string
    | null;

  defaultPickupLat:
    | number
    | null;

  defaultPickupLng:
    | number
    | null;

  defaultPickupUseCurrentLocation:
    boolean;

  defaultPickupPlaceId:
    | string
    | null;

  recentDestinations:
    unknown[];

  createdAt: string;
}

export interface UpdatePassengerProfileRequest {
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;

  defaultPickupPlaceId?: string;

  defaultPickupUseCurrentLocation?:
    boolean;
}

export type PassengerStatsResponse =
  unknown;

export type ProfileChangeResponse =
  unknown;

export const passengerProfileApi = {
  getProfile: () =>
    passengerApi.get<PassengerProfileResponse>(
      "/riders/profile",
      {
        authMode: "access",
      },
    ),

  updateProfile: (
    payload:
      UpdatePassengerProfileRequest,
  ) =>
    passengerApi.patch<PassengerProfileResponse>(
      "/riders/profile",
      payload,
      {
        authMode: "access",
      },
    ),

  uploadProfilePicture: (
    file: File,
  ) => {
    const formData =
      new FormData();

    formData.append(
      "file",
      file,
    );

    return passengerApi.post<PassengerProfileResponse>(
      "/riders/profile-picture",
      formData,
      {
        authMode: "access",
      },
    );
  },

  getStats: () =>
    passengerApi.get<PassengerStatsResponse>(
      "/riders/stats",
      {
        authMode: "access",
      },
    ),

  requestEmailChange: (
    newEmail: string,
  ) =>
    passengerApi.post<ProfileChangeResponse>(
      "/riders/email/change",
      {
        newEmail,
      },
      {
        authMode: "access",
      },
    ),

  verifyEmailChange: (
    otp: string,
  ) =>
    passengerApi.post<ProfileChangeResponse>(
      "/riders/email/change/verify",
      {
        otp,
      },
      {
        authMode: "access",
      },
    ),

  resendEmailChange: () =>
    passengerApi.post<ProfileChangeResponse>(
      "/riders/email/change/resend",
      undefined,
      {
        authMode: "access",
      },
    ),

  requestPhoneChange: (
    newPhoneNumber: string,
  ) =>
    passengerApi.post<ProfileChangeResponse>(
      "/riders/phone/change",
      {
        newPhoneNumber,
      },
      {
        authMode: "access",
      },
    ),

  verifyPhoneChange: (
    otp: string,
  ) =>
    passengerApi.post<ProfileChangeResponse>(
      "/riders/phone/change/verify",
      {
        otp,
      },
      {
        authMode: "access",
      },
    ),

  resendPhoneChange: () =>
    passengerApi.post<ProfileChangeResponse>(
      "/riders/phone/change/resend",
      undefined,
      {
        authMode: "access",
      },
    ),
};