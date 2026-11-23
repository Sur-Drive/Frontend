import { PageHeader } from '@/components/admin/dashboard/PageHeader';
import { UserManagementView } from '@/components/admin/user-management/UserManagementView';

/** First value of a search param, or undefined when absent. */
function firstParam(searchParams: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = searchParams?.[key];
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value[0] : String(value);
}

export default function UserManagementPage({
  searchParams,
}: {
  searchParams?: { status?: string; search?: string; page?: string };
}) {
  const initial: { status?: string; search?: string; page?: string } = {};
  const status = firstParam(searchParams, 'status');
  const search = firstParam(searchParams, 'search');
  const page = firstParam(searchParams, 'page');
  if (status) initial.status = status;
  if (search) initial.search = search;
  if (page) initial.page = page;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="User Management"
        subtitle="Manage user accounts, and status"
      />

      <UserManagementView initial={initial} />
    </div>
  );
}