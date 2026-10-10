import { driverFetch } from "./account";

/** GET /calls?page&limit — call history. */
export const getCalls = (page = 1, limit = 20) =>
  driverFetch(`/calls?page=${page}&limit=${limit}`, "GET", "Failed to load calls");

/** GET /calls/:id — one call. */
export const getCall = (id: string) =>
  driverFetch(`/calls/${encodeURIComponent(id)}`, "GET", "Failed to load call");
