// ---------------------------------------------------------------------------
// drivers — data access for the User Management screen.
// getDrivers() hits GET /admin/drivers with server-driven query params for
// pagination, status filtering, and search.
// ---------------------------------------------------------------------------
import { apiFetch } from './api';
import type { DriversResponse } from '@/types';

export type DriverQueryParams = {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  fleetId?: string;
  subFleetId?: string;
};

/**
 * Fetches a page of drivers from the backend.
 * Pagination/status/search are all passed to the server as query params.
 */
export async function getDrivers(
  params: DriverQueryParams = {},
): Promise<DriversResponse> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.status) searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);
  if (params.fleetId) searchParams.set('fleetId', params.fleetId);
  if (params.subFleetId) searchParams.set('subFleetId', params.subFleetId);

  const query = searchParams.toString();
  return apiFetch<DriversResponse>(`/admin/drivers${query ? `?${query}` : ''}`);
}

/** Suspend a driver. Backend requires `reason` (min 3 chars). */
export async function suspendDriver(id: string, reason: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/drivers/${encodeURIComponent(id)}/suspend`, {
    method: 'POST',
    body: { reason },
  });
}

/** Reactivate a previously suspended driver (no body). */
export async function activateDriver(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/drivers/${encodeURIComponent(id)}/activate`, {
    method: 'POST',
  });
}