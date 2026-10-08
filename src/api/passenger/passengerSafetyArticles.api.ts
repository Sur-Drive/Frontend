import { passengerApi } from "./passengerClient";

export type FAQArticle = {
  id: string;
  question: string;
  answer: string;
};

export type SOSPayload = {
  latitude: string;
  longitude: string;
};

export type SOSResponse = {
  success: boolean;
  message: string;
  contactsNotified: number;
  contacts: string[];
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  sosAlertId: string;
};

export const passengerSafetyArticlesApi = {
  getFAQs(q = "") {
    const query = q.trim();

    return passengerApi.get<unknown>(
      `/articles/faq${
        query
          ? `?q=${encodeURIComponent(query)}`
          : ""
      }`,
      { authMode: "access" },
    );
  },

  getFAQ(id: string) {
    return passengerApi.get<unknown>(
      `/articles/faq/${encodeURIComponent(id)}`,
      { authMode: "access" },
    );
  },

  sendSOS(payload: SOSPayload) {
    return passengerApi.post<SOSResponse>(
      "/riders/sos",
      payload,
      { authMode: "access" },
    );
  },

  shareTrip(
    rideId: string,
    sharedWith: string,
  ) {
    return passengerApi.post<unknown>(
      `/rides/${encodeURIComponent(rideId)}/share`,
      { sharedWith },
      { authMode: "access" },
    );
  },

  revokeShare(shareId: string) {
    return passengerApi.delete<unknown>(
      `/rides/shares/${encodeURIComponent(shareId)}`,
      { authMode: "access" },
    );
  },
};