import { FleetDetailsView } from '@/components/admin/fleet-management/FleetDetailsView';

export default function FleetDetailsPage({ params }: { params: { fleetId: string } }) {
  return <FleetDetailsView fleetId={params.fleetId} />;
}