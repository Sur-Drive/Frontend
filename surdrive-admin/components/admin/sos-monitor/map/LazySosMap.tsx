'use client';

// ---------------------------------------------------------------------------
// LazySosMap — lazy-loading wrapper around SosMapView.
//
// next/dynamic with ssr: false rather than React.lazy, for two reasons: the Maps
// JS API needs `window` so the map must never run during server rendering, and
// the component chunk (plus Google's own bundle, which SosMapView pulls in by
// script tag) stays out of the initial load of /admin/sos-monitor.
//
// There are deliberately two loading stages: the `loading` fallback below covers
// the chunk download, then SosMapView mounts and shows its own spinner while the
// Maps script downloads. The panel's container owns the sizing — both fill it.
// Import SosMapView through this wrapper only, or the lazy boundary is lost.
// ---------------------------------------------------------------------------
import dynamic from 'next/dynamic';
import type { SosMapViewProps } from './SosMapView';

const DynamicSosMap = dynamic<SosMapViewProps>(
  () => import('./SosMapView').then((mod) => mod.SosMapView),
  { ssr: false, loading: () => <SosMapSkeleton /> },
);

export function LazySosMap(props: SosMapViewProps) {
  return <DynamicSosMap {...props} />;
}

/** Decorative map-tile placeholder shown while the map chunk downloads. */
const SKELETON_TILES = [0, 1, 2, 3, 4, 5];

function SosMapSkeleton() {
  return (
    <div
      className="grid h-full w-full grid-cols-3 grid-rows-2 gap-px bg-[#E9EBED]"
      aria-hidden="true"
    >
      {SKELETON_TILES.map((tile) => (
        <span key={tile} className="animate-pulse bg-[#DFE3E7]" />
      ))}
    </div>
  );
}