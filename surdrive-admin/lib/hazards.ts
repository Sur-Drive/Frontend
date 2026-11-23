// ---------------------------------------------------------------------------
// hazards — data access for the Hazard Moderation screen.
// getHazards() hits GET /admin/hazards with server-driven query params for
// status, type, severity, fleet, date range, search, and pagination.
// rejectHazard/resolveHazard call their respective POST endpoints.
// deleteHazard exists but the UI button stays disabled for now (backend 500).
// ---------------------------------------------------------------------------
import { apiFetch } from './api';
import type { HazardsResponse } from '@/types';

export type HazardQueryParams = {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
  severity?: string;
  search?: string;
  fleetId?: string;
  fromDate?: string;
  toDate?: string;
};

export async function getHazards(
  params: HazardQueryParams = {},
): Promise<HazardsResponse> {
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.set('status', params.status);
  if (params.type) searchParams.set('type', params.type);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.severity) searchParams.set('severity', params.severity);
  if (params.search) searchParams.set('search', params.search);
  if (params.fleetId) searchParams.set('fleetId', params.fleetId);
  if (params.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params.toDate) searchParams.set('toDate', params.toDate);

  const query = searchParams.toString();
  return apiFetch<HazardsResponse>(`/admin/hazards${query ? `?${query}` : ''}`);
}

/** Reject a hazard. Backend requires `reason`. */
export async function rejectHazard(id: string, reason: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/hazards/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    body: { reason },
  });
}

/** Resolve a hazard. Backend requires `note`. */
export async function resolveHazard(id: string, note: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/hazards/${encodeURIComponent(id)}/resolve`, {
    method: 'POST',
    body: { note },
  });
}

/** Delete a hazard — UI button stays disabled for now (backend returns 500). */
export async function deleteHazard(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/hazards/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
