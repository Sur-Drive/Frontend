import type { Person } from "@/types/rides";

export type { Person };

// Row record for the Live Ride Queue, populated from the real
// /admin/ride-hailing/live-operations items by lib/live-operations.ts.
// status and category hold RAW backend values — render them through
// rideStatusDisplay() / rideCategoryDisplay() so unknown values still get a
// safe neutral chip. isDelayed drives the extra "Delayed" pill the mock
// queue used to show as its own status.
export interface LiveQueueRow {
  id: string;
  passenger: Person;
  driver: Person | null;
  pickup: string;
  destination: string;
  // Raw backend category: economy | comfort | suv observed.
  category: string;
  // Raw backend status. Observed: ride_in_progress, driver_en_route;
  // requested, searching, driver_assigned, driver_arrived, ride_started are
  // documented as well. Never treated as exhaustive.
  status: string;
  isDelayed: boolean;
}


// Illustrative map data. All coordinates are SVG viewBox units in a
// 1000 x 720 space; a real map replaces this without touching the component.
export interface MapPoint {
  x: number;
  y: number;
}

export type MapZoneId = "mainland" | "island";

export interface MapZone {
  id: MapZoneId;
  // Polygon points in "x,y x,y ..." form for the SVG polygon element.
  polygon: MapPoint[];
  // Brand for mainland, accent for island.
  tone: "brand" | "accent";
  label: string;
}

export interface MapRoute {
  id: string;
  tone: "brand" | "accent";
  // SVG path "d" attribute.
  path: string;
}

export type MapMarkerKind = "available" | "onTrip";

export interface MapMarker {
  id: string;
  kind: MapMarkerKind;
  point: MapPoint;
  tone: "brand" | "success";
  // Which service zone this marker belongs to; drives zone filtering.
  zone: MapZoneId;
}

export type MapPinKind = "pickup" | "navigator";

export interface MapPin {
  id: string;
  kind: MapPinKind;
  point: MapPoint;
  tone: "brand" | "accent";
  // Which service zone this pin belongs to; drives zone filtering.
  zone: MapZoneId;
}

export interface MapAreaLabel {
  text: string;
  point: MapPoint;
}

export interface LiveMapData {
  width: number;
  height: number;
  labels: MapAreaLabel[];
  lagoonLabel: MapAreaLabel;
  lagoonRotation: number;
  zones: MapZone[];
  routes: MapRoute[];
  markers: MapMarker[];
  pins: MapPin[];
}

