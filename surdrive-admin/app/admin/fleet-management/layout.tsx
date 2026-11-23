import type { ReactNode } from 'react';
import { FleetStoreProvider } from '@/components/admin/fleet-management/FleetStoreProvider';

// Wraps the fleet list page and the [fleetId] details page in one provider so
// both share the same fleet state (status toggles sync across navigation).
export default function FleetManagementLayout({ children }: { children: ReactNode }) {
  return <FleetStoreProvider>{children}</FleetStoreProvider>;
}