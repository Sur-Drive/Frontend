import {
  passengerApi,
} from "./passengerClient";

export interface GetNotificationsParams {
  limit?: number;
  offset?: number;
  isRead?: boolean;
  type?: string;
}

/**
 * The API documentation currently does not
 * provide the notification response schema.
 *
 * Keep this unknown until we inspect an actual
 * response from GET /notifications.
 */
export type PassengerNotificationsResponse =
  unknown;

export type UnreadCountResponse =
  unknown;

export type NotificationActionResponse =
  unknown;

export const passengerNotificationsApi = {
  getNotifications(
    params: GetNotificationsParams = {},
  ) {
    const searchParams =
      new URLSearchParams();

    if (params.limit !== undefined) {
      searchParams.set(
        "limit",
        String(params.limit),
      );
    }

    if (params.offset !== undefined) {
      searchParams.set(
        "offset",
        String(params.offset),
      );
    }

    if (params.isRead !== undefined) {
      searchParams.set(
        "isRead",
        String(params.isRead),
      );
    }

    if (params.type) {
      searchParams.set(
        "type",
        params.type,
      );
    }

    const query =
      searchParams.toString();

    return passengerApi.get<PassengerNotificationsResponse>(
      query
        ? `/notifications?${query}`
        : "/notifications",
      {
        authMode: "access",
      },
    );
  },

  getUnreadCount() {
    return passengerApi.get<UnreadCountResponse>(
      "/notifications/unread-count",
      {
        authMode: "access",
      },
    );
  },

  getRecent(limit = 5) {
    return passengerApi.get<PassengerNotificationsResponse>(
      `/notifications/recent?limit=${limit}`,
      {
        authMode: "access",
      },
    );
  },

  markAsRead(
    notificationId: string,
  ) {
    return passengerApi.patch<NotificationActionResponse>(
      `/notifications/${notificationId}/read`,
      undefined,
      {
        authMode: "access",
      },
    );
  },

  markAllAsRead() {
    return passengerApi.patch<NotificationActionResponse>(
      "/notifications/mark-all-read",
      undefined,
      {
        authMode: "access",
      },
    );
  },

  deleteNotification(
    notificationId: string,
  ) {
    return passengerApi.delete<NotificationActionResponse>(
      `/notifications/${notificationId}`,
      {
        authMode: "access",
      },
    );
  },
};