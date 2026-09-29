import type {
  SupportFAQ,
  SupportRide,
  SupportTicket,
} from "../types/passengerSupport";

export const supportFAQs: SupportFAQ[] = [
  {
    id: "faq-1",

    question:
      "How do I track my ride?",

    answer:
      "Tap the map to see your driver's live location and estimated arrival time.",
  },

  {
    id: "faq-2",

    question:
      "How do I contact my driver?",

    answer:
      "Once a driver has been assigned, use the call or chat option on your active ride screen.",
  },

  {
    id: "faq-3",

    question:
      "Can I add a stop along the way?",

    answer:
      "You can add an additional stop while setting up your trip before confirming your ride.",
  },

  {
    id: "faq-4",

    question:
      "How do I rate my trip?",

    answer:
      "After completing your trip, you'll be given the option to rate your driver and share feedback.",
  },

  {
    id: "faq-5",

    question:
      "Can I change my pickup location?",

    answer:
      "You can adjust your pickup location before your ride is confirmed.",
  },
];

export const supportRides: SupportRide[] = [
  {
    id: "ride-2048",

    date:
      "Jan 15, 2026",

    pickup:
      "14 Admiralty Way, Lekki Phase 1",

    destination:
      "25 Marina Street, Lagos Island",
  },

  {
    id: "ride-2049",

    date:
      "Jan 10, 2026",

    pickup:
      "Lekki Phase 1",

    destination:
      "Victoria Island",
  },
];

export const initialSupportTickets: SupportTicket[] = [
  {
    id: "ticket-2048",

    reference:
      "TR-2048",

    summary:
      "Missing fare refund after cancelled ride",

    description:
      "Ride ID #TR-2048 was cancelled by the driver, but the refund has not appeared in my wallet yet.",

    rideId:
      "ride-2048",

    priority:
      "medium",

    status:
      "open",

    escalated:
      false,

    createdAt:
      "2026-01-15T17:20:00",

    updatedAt:
      "2026-01-15T17:35:00",

    messages: [
      {
        id: "message-1",

        sender:
          "passenger",

        message:
          "Missing fare refund after cancelled ride.\n\nRide ID #TR-2048 was cancelled by the driver, but the refund has not appeared in my wallet yet.",

        createdAt:
          "2026-01-15T17:20:00",
      },

      {
        id: "message-2",

        sender:
          "agent",

        message:
          "Hi there! 👋 Welcome to our support chat. How can I help you today?",

        createdAt:
          "2026-01-15T17:35:00",
      },
    ],
  },

  {
    id: "ticket-2049",

    reference:
      "TR-2049",

    summary:
      "Incorrect pickup address on last trip",

    description:
      "The driver arrived at the wrong entrance and I had to update the pickup point manually before the trip started.",

    rideId:
      "ride-2049",

    priority:
      "low",

    status:
      "closed",

    escalated:
      false,

    createdAt:
      "2026-01-10T12:00:00",

    updatedAt:
      "2026-01-10T15:00:00",

    messages: [],
  },
];