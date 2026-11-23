'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { FleetRecord, FleetStatus } from './mockData';

type FleetStore = {
  fleets: FleetRecord[];
  setFleets: (updater: (prev: FleetRecord[]) => FleetRecord[]) => void;
  setFleetStatus: (fleetId: string, status: FleetStatus) => void;
};

const FleetStoreContext = createContext<FleetStore | null>(null);

/**
 * Shared fleet state for the Fleet Management section (list page + details
 * page), scoped to the fleet-management layout.
 * NOTE: the list page now feeds the fetched /admin/fleets array into this store
 * (instead of mock data); the Fleet Details page still consumes it as `FleetRecord`
 * until it is migrated to real API data in a later pass.
 */
export function FleetStoreProvider({ children }: { children: ReactNode }) {
  const [fleets, setFleets] = useState<FleetRecord[]>([]);

  const value = useMemo<FleetStore>(
    () => ({
      fleets,
      setFleets,
      setFleetStatus: (fleetId, status) =>
        setFleets((prev) => prev.map((f) => (f.id === fleetId ? { ...f, status } : f))),
    }),
    [fleets],
  );

  return <FleetStoreContext.Provider value={value}>{children}</FleetStoreContext.Provider>;
}

export function useFleetStore(): FleetStore {
  const store = useContext(FleetStoreContext);
  if (!store) {
    throw new Error('useFleetStore must be used within a FleetStoreProvider');
  }
  return store;
}