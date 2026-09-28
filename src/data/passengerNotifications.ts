import type {
  PassengerNotification,
} from "../types/passengerNotification";

export const passengerNotifications: PassengerNotification[] = [
  {
    id: "notification-1",

    type: "driver",

    title:
      "Driver Abubakar is arriving",

    message:
      "Toyota Corolla (Gold plate) is 2 minutes away from Lekki Phase 1.",

    time: "Just now",

    createdAt:
      "2026-09-23T09:45:00",

    status: "unread",

    group: "today",

    route:
      "/passenger/ride/driver-arriving",
  },

  {
    id: "notification-2",

    type: "ride",

    title: "Ride completed",

    message:
      "Don't forget to rate your driver!",

    time: "5 mins ago",

    createdAt:
      "2026-09-23T09:40:00",

    status: "read",

    group: "today",

    route:
      "/passenger/activity",
  },

  {
    id: "notification-3",

    type: "payment",

    title:
      "Payment Successful",

    message:
      "Successfully charged ₦6,500 for your ride to Victoria Island.",

    time: "50 mins ago",

    createdAt:
      "2026-09-23T08:55:00",

    status: "read",

    group: "today",
  },

  {
    id: "notification-4",

    type: "system",

    title: "Update!!!",

    message:
      "New features added to the Sur-Drive app!",

    time: "50 mins ago",

    createdAt:
      "2026-09-23T08:50:00",

    status: "read",

    group: "today",
  },

  {
    id: "notification-5",

    type: "driver",

    title:
      "Your driver is on the way!",

    message:
      "John Doe's estimated time of arrival is 5 mins.",

    time: "2 mins ago",

    createdAt:
      "2026-09-22T18:30:00",

    status: "unread",

    group: "yesterday",
  },

  {
    id: "notification-6",

    type: "ride",

    title: "Ride completed",

    message:
      "Don't forget to rate your driver!",

    time: "5 mins ago",

    createdAt:
      "2026-09-22T18:10:00",

    status: "read",

    group: "yesterday",
  },

  {
    id: "notification-7",

    type: "promotion",

    title: "New user discount",

    message:
      "Get 20% off on your next ride.",

    time: "50 mins ago",

    createdAt:
      "2026-09-22T17:30:00",

    status: "read",

    group: "yesterday",
  },

  {
    id: "notification-8",

    type: "system",

    title: "Update!!!",

    message:
      "New features added to the Sur-Drive app!",

    time: "50 mins ago",

    createdAt:
      "2026-09-22T17:00:00",

    status: "read",

    group: "yesterday",
  },
];