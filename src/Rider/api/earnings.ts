import { driverFetch } from "./account";

/**
 * Driver earnings. All GET, all use driverFetch (driver login token).
 * Dates are YYYY-MM-DD.
 */

export interface EarningsRangeParams {
  startDate: string;
  endDate: string;
}

export interface EarningsRidesParams extends Partial<EarningsRangeParams> {
  page?: number;
  limit?: number;
}

/** GET /ride-drivers/earnings/wallet */
export const getEarningsWallet = () =>
  driverFetch("/ride-drivers/earnings/wallet", "GET", "Failed to load wallet");

/** GET /ride-drivers/earnings/overview */
export const getEarningsOverview = () =>
  driverFetch("/ride-drivers/earnings/overview", "GET", "Failed to load earnings overview");

/** GET /ride-drivers/earnings/this-week */
export const getEarningsThisWeek = () =>
  driverFetch("/ride-drivers/earnings/this-week", "GET", "Failed to load this week's earnings");

/** GET /ride-drivers/earnings/this-month */
export const getEarningsThisMonth = () =>
  driverFetch("/ride-drivers/earnings/this-month", "GET", "Failed to load this month's earnings");

/** GET /ride-drivers/earnings/detail?startDate&endDate */
export function getEarningsDetail(p: EarningsRangeParams) {
  const qs = new URLSearchParams({ startDate: p.startDate, endDate: p.endDate });
  return driverFetch(
    `/ride-drivers/earnings/detail?${qs.toString()}`,
    "GET",
    "Failed to load earnings details",
  );
}

/** GET /ride-drivers/earnings/rides?page&limit&startDate&endDate */
export function getEarningsRides(p: EarningsRidesParams = {}) {
  const qs = new URLSearchParams();
  qs.set("page", String(p.page ?? 1));
  qs.set("limit", String(p.limit ?? 10));
  if (p.startDate) qs.set("startDate", p.startDate);
  if (p.endDate) qs.set("endDate", p.endDate);
  return driverFetch(
    `/ride-drivers/earnings/rides?${qs.toString()}`,
    "GET",
    "Failed to load earnings trips",
  );
}
