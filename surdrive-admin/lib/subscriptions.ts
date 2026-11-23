import { apiFetch } from './api';
import type { SubscriptionsResponse, Subscription } from '@/types';

export type SubscriptionQueryParams = {
  page?: number;
  limit?: number;
  status?: string;
  plan?: string;
  search?: string;
  fleetId?: string;
  fromDate?: string;
  toDate?: string;
};

/** GET /admin/subscriptions — list + stats + pagination. */
export async function getSubscriptions(params: SubscriptionQueryParams = {}): Promise<SubscriptionsResponse> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.status) searchParams.set('status', params.status);
  if (params.plan) searchParams.set('plan', params.plan);
  if (params.search) searchParams.set('search', params.search);
  if (params.fleetId) searchParams.set('fleetId', params.fleetId);
  if (params.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params.toDate) searchParams.set('toDate', params.toDate);
  const query = searchParams.toString();
  return apiFetch<SubscriptionsResponse>(`/admin/subscriptions${query ? `?${query}` : ''}`);
}

/** GET /admin/subscriptions/:id — bare Subscription object (may include paymentHistory when available). */
export async function getSubscriptionById(id: string): Promise<Subscription> {
  return apiFetch<Subscription>(`/admin/subscriptions/${encodeURIComponent(id)}`);
}
