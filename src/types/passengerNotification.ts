export type PassengerNotificationType =
  | "driver"
  | "ride"
  | "payment"
  | "promotion"
  | "system";

export type PassengerNotificationStatus =
  | "read"
  | "unread";

export type PassengerNotificationGroup =
  | "today"
  | "yesterday"
  | "older";

export interface PassengerNotification {
  id: string;

  type: PassengerNotificationType;

  title: string;

  message: string;

  time: string;

  createdAt: string;

  status: PassengerNotificationStatus;

  group: PassengerNotificationGroup;

  route?: string;
}