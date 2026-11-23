import { PageHeader } from '@/components/admin/dashboard/PageHeader';
import { SubscriptionsPanel } from '@/components/admin/subscription-management/SubscriptionsPanel';

/** First value of a search param, or undefined when absent. */
function firstParam(searchParams: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = searchParams?.[key];
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value[0] : String(value);
}

export default function SubscriptionManagementPage({
  searchParams,
}: {
  searchParams?: { tab?: string; search?: string; page?: string };
}) {
  const initial: { tab?: string; search?: string; page?: string } = {};
  const tab = firstParam(searchParams, 'tab');
  const search = firstParam(searchParams, 'search');
  const page = firstParam(searchParams, 'page');
  if (tab) initial.tab = tab;
  if (search) initial.search = search;
  if (page) initial.page = page;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Subscription Management"
        subtitle="Manage user subscriptions and billing"
      />

      <SubscriptionsPanel initial={initial} />
    </div>
  );
}