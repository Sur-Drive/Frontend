
import type {
  PaymentMethod,
  RideDriver,
  RideOption,
} from "../types/passengerRide";

export const rideOptions: RideOption[] = [
  {
    id: "economy",
    name: "Economy",
    description: "Affordable everyday rides",
    seats: 4,
    eta: "3 min",
    price: 4200,
    originalPrice: 4700,
  },

  {
    id: "comfort",
    name: "Comfort",
    description: "Newer cars with extra comfort",
    seats: 4,
    eta: "5 min",
    price: 5800,
  },

  {
    id: "suv",
    name: "SUV",
    description: "Extra room for people and luggage",
    seats: 6,
    eta: "7 min",
    price: 7900,
  },
];

export const defaultPaymentMethod: PaymentMethod = {
  id: "cash",
  type: "cash",
  label: "Cash",
};

export const recentRideLocations = [
  {
    id: "recent-1",
    label: "14 Admiralty Way",
    address: "Lekki Phase 1, Lagos",
    coordinates: {
      lat: 6.4474,
      lng: 3.4723,
    },
  },

  {
    id: "recent-2",
    label: "25 Marina Street",
    address: "Lagos Island, Lagos",
    coordinates: {
      lat: 6.4541,
      lng: 3.3947,
    },
  },

  {
    id: "recent-3",
    label: "The Palms Shopping Mall",
    address: "Lekki, Lagos",
    coordinates: {
      lat: 6.4377,
      lng: 3.4469,
    },
  },
];

export const mockAssignedDriver: RideDriver = {
  id: "driver-abubakar",

  firstName: "Abubakar M.",

  rating: 4.9,

  totalTrips: 256,

  vehicle: {
    make: "Toyota",
    model: "Camry",
    color: "Silver",
    plateNumber: "ABC-123-XY",
  },
};