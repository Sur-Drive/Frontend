import type { StatusTone } from "@/components/ui/StatusPill";

export type FleetStatus = "Active" | "Under Review" | "Suspended";

// Avatar tone set (mirrors InitialsAvatar's tone prop).
export type FleetTone = "brand" | "success" | "warning" | "info";

export interface Fleet {
  id: string;
  name: string;
  initials: string;
  tone: FleetTone;
  owner: string;
  drivers: number;
  vehicles: number;
  activeRides: number;
  // Percent.
  compliance: number;
  status: FleetStatus;
}

export interface FleetSummary {
  fleetPartners: number;
  activeDrivers: number;
  fleetVehicles: number;
  activeFleetRides: number;
  partnersNote: string;
  driversNote: string;
  vehiclesNote: string;
  ridesNote: string;
}

export interface FleetsData {
  summary: FleetSummary;
  fleets: Fleet[];
}

export const FLEET_STATUS_TONE: Record<FleetStatus, StatusTone> = {
  Active: "success",
  "Under Review": "warning",
  Suspended: "danger",
};
