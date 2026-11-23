import { PageHeader } from '@/components/admin/dashboard/PageHeader';
import { SosMonitorView } from '@/components/admin/sos-monitor/SosMonitorView';

/** First value of a search param, or undefined when absent. */
function firstParam(searchParams: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = searchParams?.[key];
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value[0] : String(value);
}

export default function SosMonitorPage({
  searchParams,
}: {
  searchParams?: { status?: string; search?: string; fromDate?: string; toDate?: string };
}) {
  const initial: { status?: string; search?: string; fromDate?: string; toDate?: string } = {};
  const status = firstParam(searchParams, 'status');
  const search = firstParam(searchParams, 'search');
  const fromDate = firstParam(searchParams, 'fromDate');
  const toDate = firstParam(searchParams, 'toDate');
  if (status) initial.status = status;
  if (search) initial.search = search;
  if (fromDate) initial.fromDate = fromDate;
  if (toDate) initial.toDate = toDate;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="SOS Monitor"
        subtitle="Monitor across the platform"
      />

      <SosMonitorView initial={initial} />
    </div>
  );
}