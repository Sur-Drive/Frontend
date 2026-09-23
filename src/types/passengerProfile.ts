export interface PassengerProfile {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  photo?: string;
}

export type ProfileVerificationType =
  | "email"
  | "phone";

export interface ProfileVerificationState {
  type: ProfileVerificationType;
  value: string;
}