import { apiFetch } from './api';
import type { SosResponse } from '@/types';

export type SosQueryParams = {
  page?: number;
  limit?: number;
  status?: string;
  fleetId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
};

/** GET /admin/sos — incident feed + stats + pagination. */
export async function getSosAlerts(params: SosQueryParams = {}): Promise<SosResponse> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.status) searchParams.set('status', params.status);
  if (params.fleetId) searchParams.set('fleetId', params.fleetId);
  if (params.search) searchParams.set('search', params.search);
  if (params.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params.toDate) searchParams.set('toDate', params.toDate);
  const query = searchParams.toString();
  return apiFetch<SosResponse>(`/admin/sos${query ? `?${query}` : ''}`);
}

/** POST /admin/sos/:id/resolve — marks an incident resolved with a required note. */
export function resolveSosAlert(id: string, note: string): Promise<void> {
  return apiFetch<void>(`/admin/sos/${encodeURIComponent(id)}/resolve`, {
    method: 'POST',
    body: { note },
  });
}

/** POST /admin/sos/:id/confirm — escalates a PENDING alert as a real emergency. */
export function confirmSosAlert(id: string, note: string): Promise<void> {
  return apiFetch<void>(`/admin/sos/${encodeURIComponent(id)}/confirm`, {
    method: 'POST',
    body: { note },
  });
}

/** POST /admin/sos/:id/cancel — marks a PENDING alert as a false alarm/mistake. */
export function cancelSosAlert(id: string, reason: string): Promise<void> {
  return apiFetch<void>(`/admin/sos/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
    body: { reason },
  });
}
