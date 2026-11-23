import { DashboardView } from '@/components/admin/dashboard/DashboardView';

/** First value of a search param, or undefined when absent. */
function firstParam(searchParams: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = searchParams?.[key];
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value[0] : String(value);
}

export default function AdminOverviewPage({
  searchParams,
}: {
  searchParams?: { search?: string; status?: string };
}) {
  const initial: { search?: string; status?: string } = {};
  const search = firstParam(searchParams, 'search');
  const status = firstParam(searchParams, 'status');
  if (search) initial.search = search;
  if (status) initial.status = status;

  return <DashboardView initial={initial} />;
}
