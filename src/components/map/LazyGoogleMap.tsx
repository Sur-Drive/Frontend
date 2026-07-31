import { lazy, Suspense } from 'react'
import type { ComponentProps } from 'react'

const GoogleMapView = lazy(() => import('./GoogleMapView'))

type Props = ComponentProps<typeof GoogleMapView>

function DefaultFallback() {
  return (
    <div className="flex items-center justify-center w-full h-full bg-gray-100">
      <div className="w-10 h-10 border-4 border-red-500 rounded-full animate-spin border-t-transparent" />
    </div>
  )
}

export default function LazyGoogleMap(props: Props) {
  return (
    <Suspense fallback={<DefaultFallback />}>
      <GoogleMapView {...props} />
    </Suspense>
  )
}
