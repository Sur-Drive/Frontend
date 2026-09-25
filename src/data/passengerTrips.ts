import type {
  PassengerTrip,
} from "../types/passengerTrip";

import {
  mockAssignedDriver,
} from "./passengerRide";

export const passengerTrips: PassengerTrip[] = [
  {
    id: "ride-001",

    status: "completed",

    pickupTime: "11:30 AM",
dropoffTime: "11:56 AM",
    pickup: {
      id: "admiralty",
      label: "14 Admiralty Way",
      address:
        "14 Admiralty Way, Lekki Phase 1, Lagos",
      coordinates: {
        lat: 6.4474,
        lng: 3.4723,
      },
    },

    destination: {
      id: "marina",
      label: "25 Marina Street",
      address:
        "25 Marina Street, Lagos Island, Lagos",
      coordinates: {
        lat: 6.4549,
        lng: 3.3947,
      },
    },

    driver: mockAssignedDriver,

    date: "2025-09-05",
    time: "11:30 AM",

    distance: "12.3 km",
    duration: "25 mins",

    rating: 4,

    payment: {
      fare: 4150.8,
      bookingFee: 49.2,
      total: 4200,

      method: {
        id: "card-4412",
        type: "card",
        label: "MasterCard •••• 4412",
        detail: "Exp 09/28",
      },
    },
  },

  {
    id: "ride-002",

    status: "cancelled",
pickupTime: "11:30 AM",
dropoffTime: "11:56 AM",
    pickup: {
      label: "14 Admiralty Way",
      coordinates: {
        lat: 6.4474,
        lng: 3.4723,
      },
    },

    destination: {
      label: "25 Marina Street",
      coordinates: {
        lat: 6.4549,
        lng: 3.3947,
      },
    },

    driver: mockAssignedDriver,

    date: "2025-10-05",
    time: "11:30 AM",

    payment: {
      fare: 0,
      cancellationFee: 0,
      total: 0,

      method: {
        id: "cash",
        type: "cash",
        label: "Cash",
      },
    },
  },

  {
    id: "ride-003",

    status: "completed",
pickupTime: "11:30 AM",
dropoffTime: "11:56 AM",
    pickup: {
      label: "14 Admiralty Way",
      coordinates: {
        lat: 6.4474,
        lng: 3.4723,
      },
    },

    destination: {
      label: "25 Marina Street",
      coordinates: {
        lat: 6.4549,
        lng: 3.3947,
      },
    },

    driver: mockAssignedDriver,

    date: "2025-10-05",
    time: "11:30 AM",

    rating: 5,

    payment: {
      fare: 4150.8,
      bookingFee: 49.2,
      total: 4200,

      method: {
        id: "cash",
        type: "cash",
        label: "Cash",
        detail: "Paid Driver directly",
      },
    },
  },
];