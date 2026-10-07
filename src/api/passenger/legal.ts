import { passengerApi } from "./passengerClient";

/**
 * The legal endpoints return complete HTML documents.
 */
export const passengerLegalApi = {
  getPrivacyPolicy: () =>
    passengerApi.get<string>(
      "/privacy-policy",
      {
        authMode: "access",
      },
    ),

  getTermsAndConditions: () =>
    passengerApi.get<string>(
      "/terms-and-conditions",
      {
        authMode: "access",
      },
    ),
};