import { driverFetch } from "./account";

export const RIDE_STATUSES = [
  "requested",
  "searching",
  "driver_assigned",
  "driver_en_route",
  "driver_arrived",
  "ride_started",
  "ride_in_progress",
  "ride_completed",
  "payment_pending",
  "paid",
  "closed",
  "cancelled",
] as const;

export type DriverRideStatus = (typeof RIDE_STATUSES)[number];

export interface DriverRideHistoryParams {
  page?: number;
  limit?: number;
  status?: DriverRideStatus;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

/** GET /rides/driver/history?page&limit&status&startDate&endDate */
export function getDriverRideHistory(params: DriverRideHistoryParams = {}) {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 10));
  if (params.status) qs.set("status", params.status);
  if (params.startDate) qs.set("startDate", params.startDate);
  if (params.endDate) qs.set("endDate", params.endDate);

  return driverFetch(
    `/rides/driver/history?${qs.toString()}`,
    "GET",
    "Failed to load ride history",
  );
}
