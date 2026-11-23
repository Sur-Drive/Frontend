import { lazy, Suspense } from "react";

import type { GoogleMapViewProps } from "./GoogleMapView";

const GoogleMapView = lazy(
  () => import("./GoogleMapView"),
);

function DefaultFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-100">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#7442AD] border-t-transparent" />
    </div>
  );
}

export default function LazyGoogleMap(
  props: GoogleMapViewProps,
) {
  return (
    <Suspense fallback={<DefaultFallback />}>
      <GoogleMapView {...props} />
    </Suspense>
  );
}