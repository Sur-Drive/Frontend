import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  passengerNotificationsApi,
  type GetNotificationsParams,
} from "../../api/passenger/notifications";

/*
 * Keep the root key separate.
 *
 * This avoids:
 * "variable used before its declaration"
 * and the recursive type inference error.
 */
const PASSENGER_NOTIFICATIONS_KEY = [
  "passenger",
  "notifications",
] as const;

export const passengerNotificationKeys = {
  all: PASSENGER_NOTIFICATIONS_KEY,

  list: (
    params: GetNotificationsParams,
  ) =>
    [
      ...PASSENGER_NOTIFICATIONS_KEY,
      "list",
      params,
    ] as const,

  unreadCount: [
    ...PASSENGER_NOTIFICATIONS_KEY,
    "unread-count",
  ] as const,

  recent: (limit: number) =>
    [
      ...PASSENGER_NOTIFICATIONS_KEY,
      "recent",
      limit,
    ] as const,
};

export function usePassengerNotifications(
  params: GetNotificationsParams = {},
) {
  return useQuery({
    queryKey:
      passengerNotificationKeys.list(
        params,
      ),

    queryFn: () =>
      passengerNotificationsApi.getNotifications(
        params,
      ),

    staleTime: 30_000,

    refetchOnWindowFocus: true,
  });
}

export function usePassengerUnreadCount() {
  return useQuery({
    queryKey:
      passengerNotificationKeys.unreadCount,

    queryFn: () =>
      passengerNotificationsApi.getUnreadCount(),

    staleTime: 30_000,
  });
}

export function useMarkPassengerNotificationRead() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      notificationId: string,
    ) =>
      passengerNotificationsApi.markAsRead(
        notificationId,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          PASSENGER_NOTIFICATIONS_KEY,
      });
    },
  });
}

export function useMarkAllPassengerNotificationsRead() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: () =>
      passengerNotificationsApi.markAllAsRead(),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          PASSENGER_NOTIFICATIONS_KEY,
      });
    },
  });
}

export function useDeletePassengerNotification() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      notificationId: string,
    ) =>
      passengerNotificationsApi.deleteNotification(
        notificationId,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          PASSENGER_NOTIFICATIONS_KEY,
      });
    },
  });
}