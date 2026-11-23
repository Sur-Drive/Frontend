// ---------------------------------------------------------------------------
// fleets — data access for the Fleet Management list screen.
// getFleets() hits GET /admin/fleets with server-driven query params for
// pagination, status filtering, and search.
// ---------------------------------------------------------------------------
import { apiFetch } from './api';
import type { FleetDetail, FleetsResponse } from '@/types';

export type FleetQueryParams = {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  // + any additional query params the backend supports (e.g. city/region).
  // Confirm against the /admin/fleets Params tab in Postman if needed.
};

/**
 * Fetches a page of fleets from the backend.
 * Pagination/status/search are all passed to the server as query params.
 */
export async function getFleets(
  params: FleetQueryParams = {},
): Promise<FleetsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.status) searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);

  const query = searchParams.toString();
  return apiFetch<FleetsResponse>(`/admin/fleets${query ? `?${query}` : ''}`);
}

/**
 * Fetches a single fleet's full detail record from the backend.
 */
export async function getFleetById(id: string): Promise<FleetDetail> {
  return apiFetch<FleetDetail>(`/admin/fleets/${encodeURIComponent(id)}`);
}

/** Suspend a fleet. Backend requires `reason` (min 3 chars). */
export async function suspendFleet(id: string, reason: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/fleets/${encodeURIComponent(id)}/suspend`, {
    method: 'POST',
    body: { reason },
  });
}

/** Reactivate a previously suspended fleet (no body). */
export async function activateFleet(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/fleets/${encodeURIComponent(id)}/activate`, {
    method: 'POST',
  });
}