import { SubscriptionDetailsView } from '@/components/admin/subscription-management/SubscriptionDetailsView';

export default function SubscriptionDetailsPage({
  params,
}: {
  params: { subscriptionId: string };
}) {
  return <SubscriptionDetailsView subscriptionId={params.subscriptionId} />;
}