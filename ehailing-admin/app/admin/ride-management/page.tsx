import type { Metadata } from "next";
import { RideManagementView } from "@/components/admin/ride-management/RideManagementView";

export const metadata: Metadata = {
  title: "Ride Management | SUR-DRIVEHT Admin",
};

// Data is fetched client-side from GET /admin/ride-hailing/rides (see
// lib/rides.ts); the view owns pagination, search and filters. The optional
// `?ride=` query param deep-links to a ride's details drawer.
export default async function RideManagementPage({
  searchParams,
}: {
  searchParams?: Promise<{ ride?: string | string[] }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const rideParam = params?.ride;
  const initialRideId = Array.isArray(rideParam) ? rideParam[0] : rideParam;
  return <RideManagementView initialRideId={initialRideId} />;
}
