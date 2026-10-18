// import { driverFetch } from "./account";

// export const RIDE_STATUSES = [
//   "requested",
//   "searching",
//   "driver_assigned",
//   "driver_en_route",
//   "driver_arrived",
//   "ride_started",
//   "ride_in_progress",
//   "ride_completed",
//   "payment_pending",
//   "paid",
//   "closed",
//   "cancelled",
// ] as const;

// export type DriverRideStatus = (typeof RIDE_STATUSES)[number];

// export interface DriverRideHistoryParams {
//   page?: number;
//   limit?: number;
//   status?: DriverRideStatus;
//   startDate?: string; // YYYY-MM-DD
//   endDate?: string; // YYYY-MM-DD
// }

// /** GET /rides/driver/history?page&limit&status&startDate&endDate */
// export function getDriverRideHistory(params: DriverRideHistoryParams = {}) {
//   const qs = new URLSearchParams();
//   qs.set("page", String(params.page ?? 1));
//   qs.set("limit", String(params.limit ?? 10));
//   if (params.status) qs.set("status", params.status);
//   if (params.startDate) qs.set("startDate", params.startDate);
//   if (params.endDate) qs.set("endDate", params.endDate);

//   return driverFetch(
//     `/rides/driver/history?${qs.toString()}`,
//     "GET",
//     "Failed to load ride history",
//   );
// }

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

/** Pulls the first ride out of whatever shape the list arrives in. */
function firstRide(res: any) {
  const list = Array.isArray(res)
    ? res
    : (res?.items ??
      res?.data?.items ??
      res?.rides ??
      res?.data?.rides ??
      res?.data ??
      []);
  return Array.isArray(list) ? list[0] : undefined;
}

/** GET /rides/driver/history?page&limit&status&startDate&endDate */
export async function getDriverRideHistory(
  params: DriverRideHistoryParams = {},
) {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 10));
  if (params.status) qs.set("status", params.status);
  if (params.startDate) qs.set("startDate", params.startDate);
  if (params.endDate) qs.set("endDate", params.endDate);

  const res = await driverFetch(
    `/rides/driver/history?${qs.toString()}`,
    "GET",
    "Failed to load ride history",
  );

  // Debug only: shows the real field names. Remove once the mapper is fixed.
  if (import.meta.env.DEV) {
    console.log("[rides] full response:", res);
    console.log("[rides] first item:", JSON.stringify(firstRide(res), null, 2));
  }

  return res;
}
