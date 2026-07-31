export interface EmailStepData {
    email: string;
}

export interface OtpStepData {
    otp: string;
}

export interface PersonalInfoData {
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    occupation: string;
}

export interface PasswordData {
    password: string;
    confirmPassword: string;
}

export type FleetStep = "email" | "otp" | "personal" | "password";

export interface FleetRegistrationState {
    currentStep: FleetStep;
    email: string;
    otp: string;
    personalInfo: PersonalInfoData | null;
    password: string;
    isLoading: boolean;
    error: string | null;
    isSuccess: boolean;
    otpTimer: number;
}
