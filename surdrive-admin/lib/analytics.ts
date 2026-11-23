import { apiFetch } from './api';
import type { DashboardAnalytics } from '@/types';

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  return apiFetch<DashboardAnalytics>('/admin/analytics/dashboard');
}
