import { PageHeader } from '@/components/admin/dashboard/PageHeader';
import { ModerationQueueView } from '@/components/admin/moderation/ModerationQueueView';

/** First value of a search param, or undefined when absent. */
function firstParam(searchParams: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = searchParams?.[key];
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value[0] : String(value);
}

export default function ModerationPage({
  searchParams,
}: {
  searchParams?: { status?: string; type?: string; search?: string; page?: string };
}) {
  const initial: { status?: string; type?: string; search?: string; page?: string } = {};
  const status = firstParam(searchParams, 'status');
  const type = firstParam(searchParams, 'type');
  const search = firstParam(searchParams, 'search');
  const page = firstParam(searchParams, 'page');
  if (status) initial.status = status;
  if (type) initial.type = type;
  if (search) initial.search = search;
  if (page) initial.page = page;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Moderation Queue"
        subtitle="Manage report by user access platform"
      />

      <ModerationQueueView initial={initial} />
    </div>
  );
}