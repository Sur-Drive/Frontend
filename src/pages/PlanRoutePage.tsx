// import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useQuery } from '@tanstack/react-query'
// import LazyGoogleMap from '../components/map/LazyGoogleMap'
// import RouteMapView from '../components/map/RouteMapView'
// import type { MapMarkerSpec } from '../components/map/GoogleMapView'
// import StreetViewModal, { StreetViewPegman } from '../components/map/StreetView'
// import AddressAutocompleteInput, { type SelectedAddress } from '../components/map/AddressAutocompleteInput'
// import {
//   reportPinHtml,
//   REPORT_PIN_ANCHOR,
//   REPORT_PIN_SELECTED_ANCHOR,
//   userLocationPinHtml,
//   USER_LOCATION_ANCHOR,
// } from '../components/map/mapMarkerIcons'
// import BottomNav from '../components/BottomNav'
// import AuthFlow from '../components/AuthFlow'
// import { useFleetOwnerGate } from '../hooks/useFleetOwnerGate'
// import { getUserProfile } from '../api/profile'
// import { reverseGeocode } from '../api/geocoding'
// import { usePlanRouteOptions } from '../hooks/useRoutePlan'
// import { pickDefaultMode, getRoutePath, getRouteAlternatives } from '../api/route'
// import type { RouteModeKey, RouteOption, RouteAlternative } from '../types/routePlan'
// import { useRouteAnimation } from '../hooks/useRouteAnimation'
// import { useTriggerSos, useCancelSos } from '../hooks/useSos'
// import { ApiError } from '../lib/apiClient'
// import { cumulativeDistances, pointAtFraction, projectPointOntoPath, type LatLng } from '../lib/geoPath'
// import { useVoiceGuidance } from '../hooks/useVoiceGuidance'
// import { useWakeWord, useVoiceSearch } from '../hooks/useVoiceSearch'
// import { forwardGeocode } from '../api/geocoding'
// import { Volume2, VolumeX, Mic } from 'lucide-react'

// // ─── Types ─────────────────────────────────────────────
// type ReportType = 'wave' | 'hill' | 'pothole' | 'hazard' | 'sos' | 'sign' | 'warning' | 'tractor'

// interface Report {
//   id: string
//   lat: number
//   lng: number
//   color: string
//   type: ReportType
//   label: string
// }

// interface HazardItem {
//   id: string
//   type: ReportType
//   title: string
//   location: string
//   distance: string
// }

// interface HazardLike {
//   type?: string
//   description?: string
//   distanceLabel?: string
//   location?: { address?: string }
// }

// const HAZARD_ICON: Record<string, string> = {
//   POTHOLE: '🕳️',
//   FLOOD: '🌊',
//   ACCIDENT: '⚠️',
//   DEBRIS: '🪨',
//   ROAD_WORKS: '🚜',
//   CHECKPOINT: '🚧',
//   DANGER: '⚠️',
//   SOS: '🆘',
// }

// const HAZARD_LABEL: Record<string, string> = {
//   POTHOLE: 'Pothole ahead',
//   FLOOD: 'Flood risk ahead',
//   ACCIDENT: 'Accident reported ahead',
//   DEBRIS: 'Debris in the road ahead',
//   ROAD_WORKS: 'Road works ahead',
//   CHECKPOINT: 'Checkpoint ahead',
//   DANGER: 'Hazard ahead',
//   SOS: 'Emergency reported ahead',
// }

// function describeUpcomingHazard(hazards: unknown[] | undefined) {
//   const first = hazards?.[0] as HazardLike | undefined
//   if (!first) return null

//   const type = typeof first.type === 'string' ? first.type.toUpperCase() : undefined
//   return {
//     icon: (type && HAZARD_ICON[type]) || '⚠️',
//     label: (type && HAZARD_LABEL[type]) || first.description || first.location?.address || 'Hazard ahead',
//   }
// }

// // ─── Data ──────────────────────────────────────────────
// const reports: Report[] = [
//   { id: 'r1', lat: 6.5244, lng: 3.3792, color: '#3b82f6', type: 'wave', label: 'Chesapeake Avenue' },
//   { id: 'r2', lat: 6.5350, lng: 3.3680, color: '#f59e0b', type: 'hill', label: 'Southwood Avenue' },
//   { id: 'r3', lat: 6.5180, lng: 3.3910, color: '#f59e0b', type: 'pothole', label: 'Whittier Street' },
//   { id: 'r4', lat: 6.5120, lng: 3.3550, color: '#ef4444', type: 'hazard', label: 'Southwood Avenue' },
//   { id: 'r5', lat: 6.5400, lng: 3.4000, color: '#ef4444', type: 'sos', label: 'Dresden Street' },
//   { id: 'r6', lat: 6.5000, lng: 3.3800, color: '#2563eb', type: 'sign', label: 'Bretton Place' },
//   { id: 'r7', lat: 6.5280, lng: 3.3620, color: '#ef4444', type: 'warning', label: 'McDowell Street' },
//   { id: 'r8', lat: 6.5150, lng: 3.4100, color: '#f59e0b', type: 'tractor', label: 'Southwood Avenue' },
//   { id: 'r9', lat: 6.5480, lng: 3.3720, color: '#f59e0b', type: 'hill', label: 'McDowell Street' },
//   { id: 'r10', lat: 6.5080, lng: 3.3950, color: '#f59e0b', type: 'pothole', label: 'Dresden Street' },
//   { id: 'r11', lat: 6.5320, lng: 3.3480, color: '#ef4444', type: 'hazard', label: 'McDowell Street' },
//   { id: 'r12', lat: 6.4950, lng: 3.3850, color: '#f59e0b', type: 'pothole', label: 'Bretton Place' },
//   { id: 'r13', lat: 6.5220, lng: 3.4050, color: '#ef4444', type: 'sos', label: 'Bretton Place' },
//   { id: 'r14', lat: 6.5050, lng: 3.3600, color: '#f59e0b', type: 'tractor', label: 'Bretton Place' },
//   { id: 'r15', lat: 6.5380, lng: 3.3880, color: '#ef4444', type: 'warning', label: 'Bretton Place' },
// ]

// // Mock hazards for scan results
// const scanHazards: HazardItem[] = [
//   { id: 'h1', type: 'pothole', title: 'Deep pothole on 3rd Avenue', location: '3rd Ave & Market St', distance: '0.4 km' },
//   { id: 'h2', type: 'hazard', title: 'Police checkpoint', location: 'Old Toll Gate', distance: '3.4 km' },
// ]

// // ─── ReportIcon Component ──────────────────────────────
// function ReportIcon({ type, selected }: { type: ReportType; selected?: boolean }) {
//   const s = selected ? 1.25 : 1
//   switch (type) {
//     case 'wave':
//       return (
//         <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
//           <path d="M2 10c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
//           <path d="M2 15c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
//         </svg>
//       )
//     case 'hill':
//       return (
//         <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="#3a2e1f">
//           <path d="M2 18 L9 8 L13 13 L16 9 L22 18 Z" />
//         </svg>
//       )
//     case 'pothole':
//       return (
//         <svg viewBox="0 0 24 24" width={18 * s} height={18 * s}>
//           <ellipse cx="12" cy="12" rx="8" ry="4.5" fill="#1a1a1a" />
//         </svg>
//       )
//     case 'hazard':
//       return (
//         <div style={{ width: 18 * s, height: 14 * s, borderRadius: 2, backgroundImage: 'repeating-linear-gradient(45deg, #f6c400 0 4px, #1a1a1a 4px 8px)' }} />
//       )
//     case 'sos':
//       return (
//         <div className="bg-white rounded-[3px] px-1 py-0.5 flex items-center justify-center">
//           <span className="text-red-600 font-extrabold text-[7px] leading-none">SOS</span>
//         </div>
//       )
//     case 'sign':
//       return (
//         <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
//           <path d="M4 14 L14 4" /><path d="M9 4 L14 4 L14 9" /><path d="M20 10 L10 20" /><path d="M15 20 L10 20 L10 15" />
//         </svg>
//       )
//     case 'warning':
//       return (
//         <svg viewBox="0 0 24 24" width={18 * s} height={18 * s}>
//           <path d="M12 3 L22 20 L2 20 Z" fill="white" />
//           <rect x="11" y="10" width="2" height="5" fill="#e02424" />
//           <rect x="11" y="16" width="2" height="2" fill="#e02424" />
//         </svg>
//       )
//     case 'tractor':
//       return (
//         <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="#2b2b2b">
//           <rect x="8" y="8" width="7" height="5" rx="1" />
//           <rect x="4" y="12" width="5" height="4" rx="1" />
//           <circle cx="7" cy="18" r="3" fill="none" stroke="#2b2b2b" strokeWidth="2" />
//           <circle cx="17" cy="18" r="4" fill="none" stroke="#2b2b2b" strokeWidth="2" />
//         </svg>
//       )
//     default:
//       return null
//   }
// }

// // ─── Hazard List Icon ──────────────────────────────────
// function HazardListIcon({ type }: { type: ReportType }) {
//   switch (type) {
//     case 'pothole':
//       return (
//         <div className="flex items-center justify-center bg-gray-100 w-9 h-9 sm:w-10 sm:h-10 rounded-xl">
//           <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//             <ellipse cx="12" cy="12" rx="8" ry="4" fill="#1a1a1a" />
//           </svg>
//         </div>
//       )
//     case 'hazard':
//       return (
//         <div className="flex items-center justify-center bg-blue-100 w-9 h-9 sm:w-10 sm:h-10 rounded-xl">
//           <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-blue-600" fill="currentColor">
//             <rect x="4" y="4" width="16" height="16" rx="3" />
//             <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">P</text>
//           </svg>
//         </div>
//       )
//     default:
//       return (
//         <div className="flex items-center justify-center bg-gray-100 w-9 h-9 sm:w-10 sm:h-10 rounded-xl">
//           <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//             <path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
//           </svg>
//         </div>
//       )
//   }
// }

// // ─── Spinner Icon for loading state ──────────────────────
// function SpinnerIcon({ className = '' }: { className?: string }) {
//   return (
//     <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
//       <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" />
//     </svg>
//   )
// }

// const WAKE_PHRASE = 'hey driver'
// const WAKE_WORD_STORAGE_KEY = 'wakeWordEnabled'

// // ─── Main Component ────────────────────────────────────
// export default function PlanRoutePage() {
//   const navigate = useNavigate()

//   const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token')
//   const [showAuth, setShowAuth] = useState(false)

//   // Fleet owners don't get the guest-browsing experience — force the
//   // sign-in modal open (and keep it open) until they've authenticated.
//   const mustAuthenticateAsFleetOwner = useFleetOwnerGate()

//   useEffect(() => {
//     if (mustAuthenticateAsFleetOwner) {
//       setShowAuth(true)
//     }
//   }, [mustAuthenticateAsFleetOwner])

//   // ── TanStack Query: Profile ─────────────────────────
//   const {
//     data: profile,
//     isLoading: profileLoading,
//   } = useQuery({
//     queryKey: ['userProfile'],
//     queryFn: getUserProfile,
//     retry: false,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//     enabled: isLoggedIn,
//   })

//   // ── State ───────────────────────────────────────────
//   const [showPlanModal, setShowPlanModal] = useState(false)
//   const [showScanResults, setShowScanResults] = useState(false)
//   const [isNavigating, setIsNavigating] = useState(false)
//   const [showSOS, setShowSOS] = useState(false)
//   const [sosHolding, setSosHolding] = useState(false)
//   const [sosProgress, setSosProgress] = useState(0)
//   const [showUpcomingAlert, setShowUpcomingAlert] = useState(false)
//   const [streetViewOpen, setStreetViewOpen] = useState(false)

//   const [selectedMode, setSelectedMode] = useState<RouteModeKey>('driving')

//   const [navPanelExpanded, setNavPanelExpanded] = useState(true)

//   // Fix: this state was referenced by mapMarkers below but never declared,
//   // which caused "Cannot find name 'selectedPin'" (TS2552).
//   const [selectedPin, setSelectedPin] = useState<string | null>(null)

//   const [startPoint, setStartPoint] = useState('')
//   const [destination, setDestination] = useState('')

//   const [startCoords, setStartCoords] = useState<{ lat: number; lng: number } | null>(null)
//   const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null)
//   const [routeError, setRouteError] = useState<string | null>(null)
//   const [activeSosId, setActiveSosId] = useState<string | null>(null)
//   const [sosError, setSosError] = useState<string | null>(null)

//   const planRouteMutation = usePlanRouteOptions()
//   const triggerSosMutation = useTriggerSos()
//   const cancelSosMutation = useCancelSos()

//   const routePlan = planRouteMutation.data
//   const activeRoute = routePlan?.routes[selectedMode]

//   // ── Alternative routes (1-2, shown alongside the recommended one) ──
//   const alternativeRoutes = useMemo(() => getRouteAlternatives(activeRoute, 2), [activeRoute])

//   // null = the backend's recommended route for this mode; otherwise an
//   // index into alternativeRoutes.
//   const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null)

//   // A fresh scan or a mode switch invalidates whatever was selected before.
//   useEffect(() => {
//     setSelectedRouteIndex(null)
//   }, [routePlan, selectedMode])

//   type RouteChoice = {
//     key: string
//     label: string
//     index: number | null
//     distance: number
//     duration: number
//     path: RouteOption['path']
//   }

//   const routeChoices = useMemo<RouteChoice[]>(() => {
//     if (!activeRoute) return []
//     const choices: RouteChoice[] = [
//       {
//         key: 'primary',
//         label: 'Recommended',
//         index: null,
//         distance: activeRoute.distance,
//         duration: activeRoute.duration,
//         path: activeRoute.path,
//       },
//     ]
//     alternativeRoutes.forEach((alt, i) => {
//       choices.push({
//         key: `alt-${i}`,
//         label: `Alternative ${i + 1}`,
//         index: i,
//         distance: alt.distance,
//         duration: alt.duration,
//         path: alt.path,
//       })
//     })
//     return choices
//   }, [activeRoute, alternativeRoutes])

//   const selectedChoice = routeChoices.find((c) => c.index === selectedRouteIndex) ?? routeChoices[0]

//   // The route actually driven/displayed: activeRoute as-is when the
//   // recommendation is selected, or activeRoute with the chosen
//   // alternative's path/stats spliced in otherwise.
//   const effectiveRoute = useMemo<RouteOption | undefined>(() => {
//     if (!activeRoute || !selectedChoice || selectedChoice.index === null) return activeRoute
//     const alt: RouteAlternative | undefined = alternativeRoutes[selectedChoice.index]
//     if (!alt) return activeRoute
//     return {
//       ...activeRoute,
//       path: alt.path,
//       distance: alt.distance || activeRoute.distance,
//       duration: alt.duration || activeRoute.duration,
//       durationInSeconds: (alt.duration || activeRoute.duration) * 60,
//       durationFormatted: alt.durationFormatted ?? activeRoute.durationFormatted,
//       summary: alt.summary ?? activeRoute.summary,
//       safetyScore: alt.safetyScore ?? activeRoute.safetyScore,
//       safetyLevel: alt.safetyLevel ?? activeRoute.safetyLevel,
//     }
//   }, [activeRoute, selectedChoice, alternativeRoutes])

//   const routePath = useMemo(() => getRoutePath(effectiveRoute), [effectiveRoute])

//   // The routes NOT currently selected, drawn as tappable muted lines on
//   // the map so the user can switch between recommended/alternatives.
//   const secondaryRoutes = useMemo(
//     () =>
//       routeChoices
//         .filter((c) => c.key !== selectedChoice?.key)
//         .map((c) => ({
//           path: getRoutePath({ ...activeRoute, path: c.path } as RouteOption),
//           onClick: () => setSelectedRouteIndex(c.index),
//         })),
//     [routeChoices, selectedChoice, activeRoute]
//   )

//   const availableModes = useMemo<RouteModeKey[]>(
//     () => (routePlan ? (Object.keys(routePlan.routes) as RouteModeKey[]) : []),
//     [routePlan]
//   )

//   useEffect(() => {
//     if (!routePlan) return
//     const preferred = pickDefaultMode(routePlan)
//     if (preferred) setSelectedMode(preferred)
//   }, [routePlan])

//   const tripDurationMs = useMemo(() => {
//     if (!effectiveRoute) return 30000

//     return Math.min(90000, Math.max(20000, effectiveRoute.durationInSeconds * 60))
//   }, [effectiveRoute])

//   const trip = useRouteAnimation({
//     path: routePath,
//     durationMs: tripDurationMs,
//     autoPlay: false,
//     loop: false,
//   })

//   // ── Geolocation State ────────────────────────────────
//   const [isGettingLocation, setIsGettingLocation] = useState(false)
//   const [locationError, setLocationError] = useState<string | null>(null)
//   const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
//   const [mapReady, setMapReady] = useState(false)

//   const routeCum = useMemo(() => cumulativeDistances(routePath), [routePath])
//   const [liveProgress, setLiveProgress] = useState<number | null>(null)
//   const [liveHeading, setLiveHeading] = useState(0)

//   const [routeDeviationMeters, setRouteDeviationMeters] = useState<number | null>(null)

//   const [gpsStatus, setGpsStatus] = useState<'waiting' | 'active' | 'error'>('waiting')
//   const [gpsErrorMessage, setGpsErrorMessage] = useState<string | null>(null)

//   useEffect(() => {
//     if (!isNavigating || routePath.length < 2) {
//       setLiveProgress(null)
//       return
//     }

//     if (!navigator.geolocation) {
//       setGpsStatus('error')
//       setGpsErrorMessage('Geolocation is not supported on this device')
//       trip.play()
//       return
//     }

//     setGpsStatus('waiting')
//     setGpsErrorMessage(null)

//     let watchId: number
//     let usingFallback = false

//     const onPosition = (position: GeolocationPosition) => {
//       const raw: LatLng = { lat: position.coords.latitude, lng: position.coords.longitude }
//       const projection = projectPointOntoPath(routePath, routeCum, raw)
//       const sample = pointAtFraction(routePath, routeCum, projection.fraction)

//       setGpsStatus('active')
//       setLiveProgress(projection.fraction)
//       setLiveHeading(sample.heading)
//       setRouteDeviationMeters(projection.distanceMeters)
//       setUserLocation([raw.lat, raw.lng])
//     }

//     const startWatch = (options: PositionOptions) => {
//       watchId = navigator.geolocation.watchPosition(
//         onPosition,
//         (err) => {
//           console.warn('[gps] watchPosition error:', err.message)

//           if (!usingFallback && err.code === err.TIMEOUT) {
//             usingFallback = true
//             navigator.geolocation.clearWatch(watchId)
//             startWatch({ enableHighAccuracy: false, maximumAge: 5000, timeout: 20000 })
//             return
//           }

//           setGpsStatus('error')
//           setGpsErrorMessage(err.message || 'Unable to get your location')

//           trip.play()
//         },
//         options
//       )
//     }

//     startWatch({ enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 })

//     return () => navigator.geolocation.clearWatch(watchId)

//   }, [isNavigating, routePath, routeCum])

//   const displayProgress = liveProgress ?? trip.progress
//   const displayHeading = liveProgress != null ? liveHeading : trip.heading

//   const OFF_ROUTE_THRESHOLD_METERS = 40
//   const isOffRoute =
//     isNavigating && liveProgress != null && (routeDeviationMeters ?? 0) > OFF_ROUTE_THRESHOLD_METERS

//   const sosTimerRef = useRef<ReturnType<typeof window.setInterval> | null>(null)
//   const sosProgressRef = useRef(0)

//   // ── SOS Hold Logic ──────────────────────────────────
//   const startSOSHold = useCallback(() => {
//     if (showSOS) return
//     setSosHolding(true)
//     sosProgressRef.current = 0
//     setSosProgress(0)

//     sosTimerRef.current = window.setInterval(() => {
//       sosProgressRef.current += 2
//       setSosProgress(sosProgressRef.current)
//       if (sosProgressRef.current >= 100) {
//         if (sosTimerRef.current) window.clearInterval(sosTimerRef.current)
//         setSosHolding(false)
//         setSosProgress(0)
//         sosProgressRef.current = 0
//         setSosError(null)

//         if (!userLocation) {

//           setSosError('Unable to get your location. Please enable location access and try again.')
//           return
//         }

//         setShowSOS(true)

//         const [lat, lng] = userLocation
//         console.log('[sos] triggering SOS at', { lat, lng })
//         triggerSosMutation.mutate(
//           { latitude: lat, longitude: lng },
//           {
//             onSuccess: (data) => {
//               console.log('[sos] triggered successfully', data)
//               if (data?.id) setActiveSosId(data.id)
//             },
//             onError: (err) => {
//               console.error('[sos] failed to trigger', err)
//               const status = err instanceof ApiError ? err.status : undefined
//               const message = err instanceof Error ? err.message : 'Failed to send SOS alert'

//               if (status === 401) {

//                 setShowSOS(false)
//                 setShowAuth(true)
//                 return
//               }

//               setSosError(message)
//             },
//           }
//         )
//       }
//     }, 60)
//   }, [showSOS, userLocation, triggerSosMutation])

//   const endSOSHold = useCallback(() => {
//     if (sosTimerRef.current) window.clearInterval(sosTimerRef.current)
//     setSosHolding(false)
//     setSosProgress(0)
//     sosProgressRef.current = 0
//   }, [])

//   useEffect(() => {
//     return () => {
//       if (sosTimerRef.current) window.clearInterval(sosTimerRef.current)
//     }
//   }, [])

//   // ── Reverse geocode via backend (never call Geocoding API from the frontend) ──
//   const reverseGeocodeStartPoint = useCallback(async (lat: number, lng: number) => {
//     try {
//       const { address } = await reverseGeocode(lat, lng)
//       setStartPoint(address)
//       setStartCoords({ lat, lng })
//     } catch (err) {
//       setStartPoint(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
//       setStartCoords({ lat, lng })
//     } finally {
//       setIsGettingLocation(false)
//     }
//   }, [])

//   useEffect(() => {
//     if (!navigator.geolocation) {
//       setLocationError('Geolocation not supported by your browser')
//       setMapReady(true)
//       return
//     }

//     const onSuccess = (position: GeolocationPosition) => {
//       const loc: [number, number] = [position.coords.latitude, position.coords.longitude]
//       setUserLocation(loc)
//       setMapReady(true)
//       reverseGeocodeStartPoint(position.coords.latitude, position.coords.longitude)
//     }

//     const onFinalError = (error: GeolocationPositionError) => {
//       let message = 'Unable to retrieve your location'
//       switch (error.code) {
//         case error.PERMISSION_DENIED:
//           message = 'Location permission denied. Please enable it in settings.'
//           break
//         case error.POSITION_UNAVAILABLE:
//           message = 'Location information unavailable.'
//           break
//         case error.TIMEOUT:
//           message = 'Location request timed out.'
//           break
//       }
//       setLocationError(message)
//       setMapReady(true)
//     }

//     navigator.geolocation.getCurrentPosition(
//       onSuccess,
//       () => {
//         // Fast attempt failed/timed out — retry with GPS + longer timeout.
//         navigator.geolocation.getCurrentPosition(onSuccess, onFinalError, {
//           enableHighAccuracy: true,
//           timeout: 15000,
//           maximumAge: 0,
//         })
//       },
//       { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
//     )
//   }, [])

//   useEffect(() => {
//     const previousOverscroll = document.body.style.overscrollBehavior
//     document.body.style.overscrollBehavior = 'none'
//     return () => {
//       document.body.style.overscrollBehavior = previousOverscroll
//     }
//   }, [])

//   const handleUseMyLocation = useCallback(() => {
//     if (!navigator.geolocation) {
//       setLocationError('Geolocation not supported by your browser')
//       return
//     }
//     setIsGettingLocation(true)
//     setLocationError(null)

//     const onSuccess = (position: GeolocationPosition) => {
//       const loc: [number, number] = [position.coords.latitude, position.coords.longitude]
//       setUserLocation(loc)
//       reverseGeocodeStartPoint(position.coords.latitude, position.coords.longitude)
//     }

//     const onFinalError = (error: GeolocationPositionError) => {
//       let message = 'Unable to retrieve your location'
//       switch (error.code) {
//         case error.PERMISSION_DENIED:
//           message = 'Location permission denied. Please enable it in settings.'
//           break
//         case error.POSITION_UNAVAILABLE:
//           message = 'Location information unavailable.'
//           break
//         case error.TIMEOUT:
//           message = 'Location request timed out.'
//           break
//       }
//       setLocationError(message)
//       setIsGettingLocation(false)
//     }

//     navigator.geolocation.getCurrentPosition(
//       onSuccess,
//       () => {
//         // Fast attempt failed/timed out — retry with GPS + longer timeout.
//         navigator.geolocation.getCurrentPosition(onSuccess, onFinalError, {
//           enableHighAccuracy: true,
//           timeout: 15000,
//           maximumAge: 0,
//         })
//       },
//       { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
//     )
//   }, [reverseGeocodeStartPoint])

//   // ── Route Logic ─────────────────────────────────────
//   const handleScanRoute = () => {
//     console.log('[route] scan route clicked', {
//       startPoint,
//       destination,
//       startCoords,
//       destinationCoords,
//       userLocation,
//     })

//     if (!startPoint || !destination) {
//       console.log('[route] blocked: startPoint or destination text is empty')
//       return
//     }

//     const origin = startCoords ?? (userLocation ? { lat: userLocation[0], lng: userLocation[1] } : null)
//     const dest = destinationCoords

//     if (!origin || !dest) {

//       console.log('[route] blocked: missing coordinates', { origin, dest })
//       setRouteError('Pick both points from the suggestions so we have exact coordinates.')
//       return
//     }

//     console.log('[route] planning route with payload', { origin, destination: dest })
//     setRouteError(null)
//     setShowPlanModal(false)
//     setShowScanResults(true)

//     planRouteMutation.mutate(
//       { origin, destination: dest },
//       {
//         onSuccess: (data) => {
//           console.log('[route] plan succeeded', data)
//         },
//         onError: (err) => {
//           console.error('[route] plan failed', err)
//           const status = err instanceof ApiError ? err.status : undefined
//           const message = err instanceof Error ? err.message : 'Failed to plan route'

//           if (status === 401) {
//             setShowScanResults(false)
//             setShowAuth(true)
//             return
//           }

//           setRouteError(message)
//         },
//       }
//     )
//   }

//   const handleStartTrip = () => {
//     setShowScanResults(false)
//     setIsNavigating(true)
//     setNavPanelExpanded(true)
//     setGpsStatus('waiting')
//     setGpsErrorMessage(null)
//     trip.reset()

//     announcedArrivalRef.current = false
//     announcedOffRouteRef.current = false
//     lastMilestoneKmRef.current = null

//     const distanceLabel = effectiveRoute ? `${effectiveRoute.distance.toFixed(1)} kilometers` : ''
//     const etaLabel = effectiveRoute ? `about ${Math.round(effectiveRoute.duration)} minutes` : ''
//     voiceGuidance.speak(
//       `Starting navigation${destination ? ' to ' + destination : ''}.${distanceLabel ? ' ' + distanceLabel : ''}${etaLabel ? ', ' + etaLabel : ''}.`,
//       { interrupt: true }
//     )

//     setTimeout(() => setShowUpcomingAlert(true), 2000)
//     // The alert behaves like a toast, not a permanent fixture — it clears
//     // itself so it can't sit there covering the map for the rest of the trip.
//     setTimeout(() => setShowUpcomingAlert(false), 9000)
//   }

//   const handleEndTrip = () => {
//     voiceGuidance.stop()
//     setIsNavigating(false)
//     setShowUpcomingAlert(false)
//     setStartPoint('')
//     setDestination('')
//     setShowScanResults(false)
//     setRouteError(null)
//     trip.pause()
//     trip.reset()
//     setLiveProgress(null)
//     setRouteDeviationMeters(null)
//     setGpsStatus('waiting')
//     setGpsErrorMessage(null)
//     planRouteMutation.reset()
//   }

//   const hasArrived =
//     isNavigating && displayProgress >= 0.995 && (liveProgress != null || !trip.isPlaying)

//   // ── Upcoming hazard — real, not mock. `null` when the route has no
//   // hazard data, in which case no banner is shown at all.
//   const upcomingHazard = describeUpcomingHazard(effectiveRoute?.hazards)

//   const navHazardCount = (activeRoute?.hazards?.length || scanHazards.length)
//   const remainingKm = effectiveRoute ? Math.max(0, effectiveRoute.distance * (1 - displayProgress)) : 0
//   const etaMinutes = effectiveRoute ? Math.max(0, Math.round(effectiveRoute.duration * (1 - displayProgress))) : 0

//   // ── Turn-by-turn voice guidance ──────────────────────
//   // The backend doesn't give us street-level maneuver text (no "turn left
//   // onto X"), only path/distance/duration/hazards — so guidance is framed
//   // around what we actually know: distance/ETA milestones, hazard
//   // proximity, off-route detection, and arrival. Built on the browser's
//   // native SpeechSynthesis, so it needs no API key and works offline.
//   const voiceGuidance = useVoiceGuidance()
//   const announcedArrivalRef = useRef(false)
//   const announcedOffRouteRef = useRef(false)
//   const lastMilestoneKmRef = useRef<number | null>(null)

//   const remainingKmFloor = isNavigating && effectiveRoute && !hasArrived ? Math.floor(remainingKm) : null

//   // Distance/ETA call-outs, once per whole kilometer crossed.
//   useEffect(() => {
//     if (remainingKmFloor == null) return
//     if (lastMilestoneKmRef.current === remainingKmFloor) return
//     const isFirstReading = lastMilestoneKmRef.current === null
//     lastMilestoneKmRef.current = remainingKmFloor
//     // The very first reading right after trip start is already covered by
//     // the "Starting navigation…" announcement in handleStartTrip.
//     if (isFirstReading || remainingKmFloor <= 0) return
//     voiceGuidance.speak(
//       `${remainingKmFloor} kilometer${remainingKmFloor === 1 ? '' : 's'} remaining. E.T.A. ${etaMinutes} minute${etaMinutes === 1 ? '' : 's'}.`
//     )
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [remainingKmFloor])

//   // Off-route warning — announced once per departure, resets once you're back on track.
//   useEffect(() => {
//     if (!isNavigating) {
//       announcedOffRouteRef.current = false
//       return
//     }
//     if (isOffRoute && !announcedOffRouteRef.current) {
//       announcedOffRouteRef.current = true
//       voiceGuidance.speak("You've gone off route. Recalculating.", { interrupt: true })
//     } else if (!isOffRoute) {
//       announcedOffRouteRef.current = false
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isOffRoute, isNavigating])

//   // Arrival — announced once.
//   useEffect(() => {
//     if (hasArrived && !announcedArrivalRef.current) {
//       announcedArrivalRef.current = true
//       voiceGuidance.speak("You've arrived at your destination.", { interrupt: true })
//     }
//     if (!isNavigating) announcedArrivalRef.current = false
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [hasArrived, isNavigating])

//   // Upcoming hazard alert — mirrors the visual "Upcoming" card.
//   useEffect(() => {
//     if (showUpcomingAlert && isNavigating && !hasArrived && upcomingHazard) {
//       voiceGuidance.speak(`Caution: ${upcomingHazard.label} ahead.`)
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [showUpcomingAlert])

//   const [wakeWordEnabled, setWakeWordEnabled] = useState(
//     () => typeof window !== 'undefined' && window.localStorage.getItem(WAKE_WORD_STORAGE_KEY) === '1'
//   )
//   useEffect(() => {
//     try {
//       window.localStorage.setItem(WAKE_WORD_STORAGE_KEY, wakeWordEnabled ? '1' : '0')
//     } catch {
//       // ignore — non-fatal, just means the preference won't persist
//     }
//   }, [wakeWordEnabled])

//   const destinationVoiceSearch = useVoiceSearch()
//   const [voiceCaptureStatus, setVoiceCaptureStatus] = useState<'idle' | 'listening' | 'searching'>('idle')

//   const captureDestinationByVoice = useCallback(() => {
//     setRouteError(null)
//     setShowPlanModal(true)
//     setVoiceCaptureStatus('listening')
//     voiceGuidance.speak('Where would you like to go?', { interrupt: true })

//     // Give the prompt a moment to finish before opening the mic, so the
//     // recognizer doesn't try to transcribe our own voice.
//     window.setTimeout(() => {
//       destinationVoiceSearch.start(async (transcript) => {
//         setDestination(transcript)
//         setVoiceCaptureStatus('searching')
//         try {
//           const result = await forwardGeocode(transcript)
//           if (typeof result.lat === 'number' && typeof result.lng === 'number') {
//             setDestination(result.address || transcript)
//             setDestinationCoords({ lat: result.lat, lng: result.lng })
//             voiceGuidance.speak(`Got it — ${result.address || transcript}. Tap Scan Route when you're ready.`)
//           } else {
//             voiceGuidance.speak("I couldn't find that place. Please pick it from the list.")
//           }
//         } catch {
//           voiceGuidance.speak("I couldn't find that place. Please pick it from the list.")
//         } finally {
//           setVoiceCaptureStatus('idle')
//         }
//       })
//     }, 1200)
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [destinationVoiceSearch])

//   const wakeWord = useWakeWord({
//     phrase: WAKE_PHRASE,
//     enabled: wakeWordEnabled && !isNavigating && !showPlanModal,
//     onWake: captureDestinationByVoice,
//   })

//   // Memoize map center
//   const mapCenter = useMemo<[number, number]>(
//     () => userLocation || [reports[0].lat, reports[0].lng],
//     [userLocation]
//   )

//   const mapMarkers = useMemo<MapMarkerSpec[]>(() => {
//     const markers: MapMarkerSpec[] = reports.map((r) => ({
//       id: r.id,
//       lat: r.lat,
//       lng: r.lng,
//       html: reportPinHtml(r.color, r.id === selectedPin),
//       anchor: r.id === selectedPin ? REPORT_PIN_SELECTED_ANCHOR : REPORT_PIN_ANCHOR,
//       onClick: () => setSelectedPin(r.id === selectedPin ? null : r.id),
//     }))

//     if (userLocation && !isNavigating) {
//       markers.push({
//         id: '__user_location__',
//         lat: userLocation[0],
//         lng: userLocation[1],
//         html: userLocationPinHtml,
//         anchor: USER_LOCATION_ANCHOR,
//       })
//     }

//     return markers
//   }, [selectedPin, userLocation, isNavigating])

//   // ── Profile Helpers ──────────────────────────────────
//   const avatarInitials = useMemo(() => {
//     if (!isLoggedIn) return '?'
//     if (profileLoading || !profile) return profileLoading ? '...' : '??'
//     return `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase()
//   }, [isLoggedIn, profile, profileLoading])

//   const displayName = useMemo(() => {
//     if (!isLoggedIn) return 'Welcome 👋'
//     if (profileLoading) return 'Loading...'
//     if (!profile) return 'Welcome 👋'
//     return `Good Afternoon 👋`
//   }, [isLoggedIn, profile, profileLoading])

//   const subtitleText = useMemo(() => {
//     if (!isLoggedIn) return 'Tap to sign in'
//     if (profileLoading) return '...'
//     if (!profile) return 'Guest'
//     if (profile.driverProfile?.address) return profile.driverProfile.address
//     return `${profile.firstName} ${profile.lastName}`
//   }, [isLoggedIn, profile, profileLoading])

//   const handleProfileBarClick = () => {
//     if (!isLoggedIn) {
//       setShowAuth(true)
//       return
//     }
//     navigate('/profile')
//   }

//   if (!mapReady) {
//     return (
//       <div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-gray-100">
//         <div className="w-10 h-10 mb-4 border-4 border-red-500 rounded-full sm:w-12 sm:h-12 border-t-transparent animate-spin" />
//         <p className="text-sm font-medium text-gray-600 sm:text-base">Getting your location...</p>
//         {locationError && <p className="px-8 mt-2 text-xs text-center text-red-500 sm:text-sm">{locationError}</p>}
//       </div>
//     )
//   }

//   return (

//     // <div
//     //   className="fixed inset-0 w-full h-full overflow-hidden bg-gray-100"
//     //   style={{ overscrollBehavior: 'none' }}
//     // >

//     <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-gray-100">

//       <div className="absolute inset-0 z-0">

//         {effectiveRoute ? (
//   <RouteMapView
//     route={effectiveRoute}
//     markers={mapMarkers}
//     zoom={isNavigating ? 17 : 15}
//     progress={isNavigating ? displayProgress : undefined}
//     flowing={!isNavigating}
//     heading={isNavigating ? displayHeading : 0}
//     interactive={!isNavigating}
//     followMode={isNavigating}
//     secondaryRoutes={isNavigating ? undefined : secondaryRoutes}
//     className="w-full h-full"
//   />
// ) : (
//           <LazyGoogleMap
//             center={{ lat: mapCenter[0], lng: mapCenter[1] }}
//             zoom={15}
//             markers={mapMarkers}
//           />
//         )}
//       </div>

//       {/* Location error toast */}
//       {locationError && !showPlanModal && !showScanResults && !showSOS && (
//         <div className="absolute top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-md z-[500] bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-start gap-3">
//           <div className="text-yellow-600 mt-0.5">⚠️</div>
//           <div>
//             <p className="text-xs font-medium text-yellow-800 sm:text-sm">{locationError}</p>
//             <p className="mt-1 text-[11px] sm:text-xs text-yellow-600">Showing default area</p>
//           </div>
//         </div>
//       )}

//       {/* Home Header (when not navigating and not scan results) */}
//       {!isNavigating && !showScanResults && (
//         <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-2 sm:flex sm:justify-center">
//           <div className="sm:w-full sm:max-w-md">
//             {/* Profile bar */}
//             <button
//               onClick={handleProfileBarClick}
//               className="flex items-center justify-between w-full px-4 py-3 mb-3 text-left bg-white shadow-sm rounded-2xl"
//             >
//               <div className="flex items-center gap-3">
//                 <div className="flex items-center justify-center text-xs font-bold text-white bg-purple-600 rounded-full w-9 h-9 sm:w-10 sm:h-10 sm:text-sm">
//                   {avatarInitials}
//                 </div>
//                 <div>
//                   <p className="text-xs font-semibold text-gray-900 sm:text-sm">{displayName}</p>
//                   <p className="text-[11px] sm:text-xs text-purple-600">{subtitleText}</p>
//                 </div>
//               </div>
//               <span className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10">
//                 <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700 sm:w-6 sm:h-6" fill="currentColor">
//                   <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
//                 </svg>
//                 {isLoggedIn && (
//                   <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
//                 )}
//               </span>
//             </button>

//             {/* Search bar */}
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => {
//                   setRouteError(null)
//                   setShowPlanModal(true)
//                 }}
//                 className="flex items-center flex-1 gap-3 px-4 py-3.5 text-left bg-white shadow-sm rounded-2xl"
//               >
//                 <svg viewBox="0 0 24 24" className="flex-shrink-0 w-4.5 h-4.5 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                   <circle cx="11" cy="11" r="8" />
//                   <path d="m21 21-4.35-4.35" />
//                 </svg>
//                 <span className="flex-1 text-xs text-gray-400 truncate sm:text-sm">
//                   {voiceCaptureStatus === 'listening' ? 'Listening…' : voiceCaptureStatus === 'searching' ? 'Finding that place…' : 'Where are you going?'}
//                 </span>
//               </button>

//               {destinationVoiceSearch.isSupported && (
//                 <button
//                   onClick={captureDestinationByVoice}
//                   aria-label="Search by voice"
//                   className={`flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-2xl shadow-sm transition ${
//                     voiceCaptureStatus !== 'idle' ? 'bg-purple-600 text-white animate-pulse' : 'bg-white text-purple-600'
//                   }`}
//                 >
//                   <Mic size={18} />
//                 </button>
//               )}
//             </div>

//             {/* Hands-free "Hey Driver" wake word toggle */}
//             {wakeWord.isSupported && !wakeWord.permissionDenied && (
//               <button
//                 onClick={() => setWakeWordEnabled((v) => !v)}
//                 className="flex items-center gap-1.5 px-3 py-1.5 mt-2 bg-white rounded-full shadow-sm w-fit"
//               >
//                 <span
//                   className={`relative inline-flex h-4 w-7 items-center rounded-full transition flex-shrink-0 ${
//                     wakeWordEnabled ? 'bg-purple-600' : 'bg-gray-300'
//                   }`}
//                 >
//                   <span
//                     className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
//                       wakeWordEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
//                     }`}
//                   />
//                 </span>
//                 <span className="text-[11px] font-medium text-gray-700">
//                   {wakeWordEnabled ? `Listening for "Hey Driver"${wakeWord.isListening ? '' : '…'}` : 'Hands-free "Hey Driver" — off'}
//                 </span>
//               </button>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Scan Results Header (route info cards) */}
//       {showScanResults && (
//         <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-2 sm:flex sm:justify-center">
//           <div className="px-4 py-3 mb-3 bg-white shadow-sm rounded-2xl sm:w-full sm:max-w-md">
//             <div className="flex items-center gap-3 mb-3">
//               <div className="flex items-center justify-center rounded-full w-7 h-7 sm:w-8 sm:h-8 bg-emerald-100">
//                 <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//                   <circle cx="12" cy="12" r="10" />
//                   <path d="M12 8v4l3 3" />
//                 </svg>
//               </div>
//               <div className="flex-1">
//                 <p className="text-xs font-semibold text-gray-900 sm:text-sm">{startPoint || 'Lekki Phase 1'}</p>
//                 <p className="text-[11px] sm:text-xs text-gray-400">From</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-3">
//               <div className="flex items-center justify-center bg-red-100 rounded-full w-7 h-7 sm:w-8 sm:h-8">
//                 <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//                   <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
//                   <line x1="4" y1="22" x2="4" y2="15" />
//                 </svg>
//               </div>
//               <div className="flex-1">
//                 <p className="text-xs font-semibold text-gray-900 sm:text-sm">{destination || '3rd Avenue Market St'}</p>
//                 <p className="text-[11px] sm:text-xs text-gray-400">To</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {isNavigating && (
//         <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-2 sm:flex sm:justify-center">
//           <div className="space-y-2 sm:w-full sm:max-w-md">
//             <div className={`flex items-center gap-3 px-4 py-3 shadow-sm rounded-2xl ${hasArrived ? 'bg-purple-600' : 'bg-emerald-500'}`}>
//               <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20">
//                 <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//                   {hasArrived ? <path d="M20 6L9 17l-5-5" /> : <path d="M12 19V5M5 12l7-7 7 7" />}
//                 </svg>
//               </div>
//               <div className="flex-1">
//                 <p className="text-[10px] sm:text-xs font-medium tracking-wide uppercase text-white/80">
//                   {hasArrived ? 'Trip complete' : `${remainingKm.toFixed(1)} KM left`}
//                 </p>
//                 <p className="text-xs font-semibold text-white sm:text-sm">
//                   {hasArrived ? "You've arrived" : 'Head out and follow the route'}
//                 </p>
//               </div>
//               {voiceGuidance.isSupported && (
//                 <button
//                   onClick={voiceGuidance.toggleMuted}
//                   aria-label={voiceGuidance.muted ? 'Unmute voice guidance' : 'Mute voice guidance'}
//                   className="flex items-center justify-center flex-shrink-0 text-white w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20"
//                 >
//                   {voiceGuidance.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
//                 </button>
//               )}
//             </div>

//             {gpsStatus === 'waiting' && (
//               <div className="flex items-center gap-3 px-4 py-3 bg-white shadow-sm rounded-xl animate-in slide-in-from-top-2">
//                 <div className="flex items-center justify-center flex-shrink-0 bg-blue-100 rounded-lg w-7 h-7 sm:w-8 sm:h-8">
//                   <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-blue-500 rounded-full border-t-transparent animate-spin" />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium uppercase tracking-wide">GPS</p>
//                   <p className="text-xs font-medium text-gray-900 truncate sm:text-sm">Waiting for your location…</p>
//                 </div>
//               </div>
//             )}

//             {gpsStatus === 'error' && (
//               <div className="flex items-center gap-3 px-4 py-3 border shadow-sm bg-amber-50 border-amber-200 rounded-xl animate-in slide-in-from-top-2">
//                 <div className="flex items-center justify-center flex-shrink-0 rounded-lg w-7 h-7 sm:w-8 sm:h-8 bg-amber-100">
//                   <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <path d="M12 9v4M12 17h.01M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-2.96L13.71 3.86a2 2 0 0 0-3.42 0z" />
//                   </svg>
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-[9px] sm:text-[10px] text-amber-500 font-medium uppercase tracking-wide">Demo mode — GPS unavailable</p>
//                   <p className="text-xs font-medium truncate text-amber-900 sm:text-sm">{gpsErrorMessage}</p>
//                 </div>
//               </div>
//             )}

//             {isOffRoute && (
//               <div className="flex items-center gap-3 px-4 py-3 border border-red-200 shadow-sm bg-red-50 rounded-xl animate-in slide-in-from-top-2">
//                 <div className="flex items-center justify-center flex-shrink-0 bg-red-100 rounded-lg w-7 h-7 sm:w-8 sm:h-8">
//                   <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <path d="M12 9v4M12 17h.01M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-2.96L13.71 3.86a2 2 0 0 0-3.42 0z" />
//                   </svg>
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-[9px] sm:text-[10px] text-red-400 font-medium uppercase tracking-wide">Off route</p>
//                   <p className="text-xs font-medium text-red-900 truncate sm:text-sm">
//                     You've drifted {Math.round(routeDeviationMeters ?? 0)}m from the planned path
//                   </p>
//                 </div>
//               </div>
//             )}

//             {showUpcomingAlert && !hasArrived && upcomingHazard && (
//               <div className="flex items-center gap-3 px-4 py-3 bg-white shadow-sm rounded-xl animate-in slide-in-from-top-2">
//                 <div className="flex items-center justify-center flex-shrink-0 rounded-lg w-7 h-7 sm:w-8 sm:h-8 bg-amber-100">
//                   <span className="text-sm leading-none sm:text-base">{upcomingHazard.icon}</span>
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium uppercase tracking-wide">Upcoming</p>
//                   <p className="text-xs font-medium text-gray-900 truncate sm:text-sm">{upcomingHazard.label}</p>
//                 </div>
//                 <button
//                   onClick={() => setShowUpcomingAlert(false)}
//                   aria-label="Dismiss"
//                   className="flex items-center justify-center flex-shrink-0 w-6 h-6 text-gray-400 rounded-full active:bg-gray-100"
//                 >
//                   <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
//                     <path d="M6 6l12 12M18 6L6 18" />
//                   </svg>
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {isNavigating && (
//         // <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex sm:justify-center">
//         <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-[calc(5.0rem+env(safe-area-inset-bottom))] sm:flex sm:justify-center">
//           <div className="sm:w-full sm:max-w-md">
//             {navPanelExpanded ? (
//               <div className="px-5 pt-3 pb-4 bg-white shadow-lg rounded-2xl">
//                 {/* Collapse handle — tap to shrink the card and see the full map */}
//                 <button
//                   onClick={() => setNavPanelExpanded(false)}
//                   className="flex items-center justify-center w-full gap-1.5 py-1.5 mb-2 -mt-1 group"
//                   aria-label="Collapse trip card"
//                 >
//                   <span className="w-8 h-1 transition bg-gray-300 rounded-full group-active:bg-gray-400" />
//                   <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//                     <path d="M6 9l6 6 6-6" />
//                   </svg>
//                 </button>

//                 <button
//                   onClick={() => setNavPanelExpanded(false)}
//                   aria-label="Collapse trip card"
//                   className="grid w-full grid-cols-3 gap-2 mb-3"
//                 >
//                   {/* <div className="text-center"> */}
//                   <div className="min-w-0 text-center">
//                     <p className="text-[11px] sm:text-xs text-gray-400 mb-0.5">ETA</p>
//                     <p className="text-lg font-bold text-gray-900 sm:text-xl">{hasArrived ? '0 min' : `${etaMinutes} min`}</p>
//                   </div>
//                   <div className="min-w-0 text-center">
//                     <p className="text-[11px] sm:text-xs text-gray-400 mb-0.5">Remaining</p>
//                     <p className="text-lg font-bold text-gray-900 sm:text-xl">{remainingKm.toFixed(1)} km</p>
//                   </div>
//                   <div className="min-w-0 text-center">
//                     <p className="text-[11px] sm:text-xs text-gray-400 mb-0.5">Hazards</p>
//                     <p className="text-lg font-bold sm:text-xl text-amber-500">{navHazardCount}</p>
//                   </div>
//                 </button>
//                 <button
//                   onClick={handleEndTrip}
//                   className="w-full h-11 sm:h-12 bg-red-500 hover:bg-red-600 text-white text-sm sm:text-base font-semibold rounded-xl transition active:scale-[0.98]"
//                 >
//                   {hasArrived ? 'Done' : 'End Trip'}
//                 </button>
//               </div>
//             ) : (

//               <button
//                 onClick={() => setNavPanelExpanded(true)}
//                 className="flex items-center w-full gap-3 py-2.5 pl-4 pr-2 bg-white shadow-lg rounded-full"
//               >
//                 <span className="flex-1 text-xs font-semibold text-left text-gray-900 sm:text-sm">
//                   {hasArrived ? "You've arrived" : `${etaMinutes} min · ${remainingKm.toFixed(1)} km left`}
//                 </span>
//                 <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//                   <path d="M18 15l-6-6-6 6" />
//                 </svg>
//                 <span
//                   onClick={(e) => {
//                     e.stopPropagation()
//                     handleEndTrip()
//                   }}
//                   role="button"
//                   aria-label="End trip"
//                   className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-white bg-red-500 rounded-full active:scale-95"
//                 >
//                   <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
//                     <path d="M18 6L6 18M6 6l12 12" />
//                   </svg>
//                 </span>
//               </button>
//             )}
//           </div>
//         </div>
//       )}

//       {!showSOS && !showPlanModal && !showScanResults && (
//         <StreetViewPegman
//           onClick={() => setStreetViewOpen(true)}
//           className={`absolute z-[999] left-4 sm:left-8 transition-[bottom] ${
//             isNavigating ? (navPanelExpanded ? 'bottom-56' : 'bottom-24') : 'bottom-32'
//           }`}
//         />
//       )}

//       <StreetViewModal
//         isOpen={streetViewOpen}
//         onClose={() => setStreetViewOpen(false)}
//         lat={(destinationCoords ?? routePath[routePath.length - 1] ?? { lat: mapCenter[0], lng: mapCenter[1] }).lat}
//         lng={(destinationCoords ?? routePath[routePath.length - 1] ?? { lat: mapCenter[0], lng: mapCenter[1] }).lng}
//         label={destination || 'Current location'}
//       />

//       {/* SOS Floating Button */}
//       {!showSOS && (
//         <div
//           className={`absolute z-[999] right-4 sm:right-8 transition-[bottom] ${
//             isNavigating ? (navPanelExpanded ? 'bottom-56' : 'bottom-24') : 'bottom-32'
//           }`}
//           onMouseDown={startSOSHold}
//           onMouseUp={endSOSHold}
//           onMouseLeave={endSOSHold}
//           onTouchStart={(e) => { e.stopPropagation(); startSOSHold(); }}
//           onTouchEnd={(e) => { e.stopPropagation(); endSOSHold(); }}
//         >
//           <span className="absolute inset-[-6px] rounded-full border-[3px] border-red-400/35 animate-ping pointer-events-none" />
//           <span className="absolute inset-[-6px] rounded-full border-[3px] border-red-400/35 pointer-events-none" />

//           {sosHolding && (
//             <svg className="absolute inset-[-4px] w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] -rotate-90 pointer-events-none" viewBox="0 0 88 88">
//               <circle
//                 cx="44"
//                 cy="44"
//                 r="42"
//                 fill="none"
//                 stroke="white"
//                 strokeWidth="4"
//                 strokeLinecap="round"
//                 strokeDasharray={2 * Math.PI * 42}
//                 strokeDashoffset={2 * Math.PI * 42 * (1 - sosProgress / 100)}
//                 style={{ transition: 'stroke-dashoffset 0.05s linear' }}
//               />
//             </svg>
//           )}

//           <button
//             className="relative flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 text-white transition rounded-full bg-[#ff4444] active:scale-95 overflow-hidden select-none"
//             style={{
//               touchAction: 'none',
//               WebkitTouchCallout: 'none',
//               WebkitUserSelect: 'none',
//               userSelect: 'none',
//               WebkitTapHighlightColor: 'transparent',
//             }}
//           >
//             <span className="text-[13px] sm:text-[15px] font-bold relative z-10 pointer-events-none">SOS</span>
//             <span className="text-[9px] sm:text-[10px] opacity-90 relative z-10 pointer-events-none">
//               {sosHolding ? 'Hold...' : 'Hold 3s'}
//             </span>
//           </button>
//         </div>
//       )}

//       {/* ═══════════════════════════════════════════════════════
//           PLAN ROUTE MODAL
//           ═══════════════════════════════════════════════════════ */}
//       {showPlanModal && (
//         <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/0 sm:bg-black/40">
//           <div className="flex flex-col w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-md bg-white animate-in slide-in-from-bottom sm:rounded-3xl sm:shadow-2xl overflow-hidden">
//             <div className="flex-shrink-0 px-5 pt-6 pb-4">
//               <div className="flex items-start justify-between">
//                 <div>
//                   <h2 className="text-xl font-extrabold text-gray-900 sm:text-2xl">Plan a route</h2>
//                   <p className="mt-1 text-xs text-gray-500 sm:text-sm">We&apos;ll scan reported hazards along the way before you drive.</p>
//                 </div>
//                 <button
//                   onClick={() => setShowPlanModal(false)}
//                   className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-gray-500 transition bg-gray-100 rounded-full sm:w-9 sm:h-9 hover:bg-gray-200"
//                 >
//                   <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
//                     <path d="M18 6L6 18M6 6l12 12" />
//                   </svg>
//                 </button>
//               </div>
//             </div>

//             <div className="flex-1 px-5 space-y-5 overflow-y-auto min-h-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//               <div>
//                 <div className="flex items-center gap-2 mb-2">
//                   <div className="flex items-center justify-center w-5 h-5 border-2 rounded-full border-emerald-500">
//                     <div className="w-2 h-2 rounded-full bg-emerald-500" />
//                   </div>
//                   <span className="text-xs font-medium text-gray-900 sm:text-sm">Point A — Start</span>
//                 </div>
//                 <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
//                   <AddressAutocompleteInput
//                     value={startPoint}
//                     onChange={setStartPoint}
//                     onSelect={(result) => setStartCoords({ lat: result.lat, lng: result.lng })}
//                     placeholder="Search a place or Address"
//                     className="flex-1"
//                     inputClassName="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent outline-none sm:text-sm"
//                   />
//                   <button
//                     onClick={handleUseMyLocation}
//                     disabled={isGettingLocation}
//                     className="text-xs sm:text-sm font-medium text-purple-600 whitespace-nowrap hover:text-purple-700 disabled:opacity-50 flex items-center gap-1.5"
//                   >
//                     {isGettingLocation ? (
//                       <>
//                         <SpinnerIcon className="w-3.5 h-3.5" />
//                         Locating...
//                       </>
//                     ) : (
//                       'Use my location'
//                     )}
//                   </button>
//                 </div>
//                 {locationError && (
//                   <p className="mt-1.5 ml-1 text-[11px] sm:text-xs text-red-500">{locationError}</p>
//                 )}
//               </div>

//               <div>
//                 <div className="flex items-center gap-2 mb-2">
//                   <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
//                     <line x1="4" y1="22" x2="4" y2="15" />
//                   </svg>
//                   <span className="text-xs font-medium text-gray-900 sm:text-sm">Point B — Destination</span>
//                 </div>
//                 <div className="px-4 py-3 bg-gray-50 rounded-xl">
//                   <AddressAutocompleteInput
//                     value={destination}
//                     onChange={setDestination}
//                     onSelect={(result) => setDestinationCoords({ lat: result.lat, lng: result.lng })}
//                     placeholder="Where to?"
//                     inputClassName="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent outline-none sm:text-sm"
//                   />
//                 </div>
//               </div>

//               <div className="h-4" />
//             </div>

//             <div className="flex-shrink-0 px-5 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:pb-6">
//               {routeError && (
//                 <p className="mb-3 text-xs text-center text-red-500 sm:text-sm">{routeError}</p>
//               )}
//               <button
//                 onClick={handleScanRoute}
//                 disabled={!startPoint || !destination}
//                 className="w-full h-12 sm:h-14 bg-purple-700 hover:bg-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm sm:text-base rounded-2xl transition active:scale-[0.98]"
//               >
//                 Scan route
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ═══════════════════════════════════════════════════════
//           SCAN RESULTS BOTTOM SHEET
//           ═══════════════════════════════════════════════════════ */}
//       {showScanResults && (
//         <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:justify-center sm:items-center bg-white/0 sm:bg-black/30 pointer-events-none">
//           <div
//             className="flex-shrink-0 h-[35%] sm:hidden"
//             onClick={() => setShowScanResults(false)}
//           />

//           <div className="flex-1 sm:flex-none flex flex-col bg-white rounded-t-[24px] sm:rounded-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.15)] sm:shadow-2xl pointer-events-auto overflow-hidden w-full sm:max-w-md sm:max-h-[80vh]">
//             <div className="flex justify-center flex-shrink-0 pt-3 pb-2 sm:hidden">
//               <div className="w-10 h-1 bg-gray-300 rounded-full" />
//             </div>

//             <div className="flex-1 overflow-y-auto px-5 pt-4 sm:pt-6 pb-[calc(8rem+env(safe-area-inset-bottom))] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//               {planRouteMutation.isPending && (
//                 <div className="flex flex-col items-center justify-center gap-3 py-10">
//                   <SpinnerIcon className="w-6 h-6 text-purple-600" />
//                   <p className="text-xs text-gray-500 sm:text-sm">Scanning route for hazards...</p>
//                 </div>
//               )}

//               {!planRouteMutation.isPending && routeError && (
//                 <div className="flex items-center gap-2 px-4 py-3 mb-4 border border-red-100 bg-red-50 rounded-xl">
//                   <p className="text-xs font-medium text-red-700 sm:text-sm">{routeError}</p>
//                 </div>
//               )}

//               {!planRouteMutation.isPending && !routeError && (
//                 <>
//                   {availableModes.length > 1 && (
//                     <div className="flex gap-2 mb-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//                       {availableModes.map((mode) => (
//                         <button
//                           key={mode}
//                           onClick={() => setSelectedMode(mode)}
//                           className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
//                             mode === selectedMode ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-600'
//                           }`}
//                         >
//                           {routePlan?.routes[mode]?.label ?? mode}
//                         </button>
//                       ))}
//                     </div>
//                   )}

//                   {alternativeRoutes.length > 0 && (
//                     <div className="flex gap-2 mb-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//                       {routeChoices.map((choice) => (
//                         <button
//                           key={choice.key}
//                           onClick={() => setSelectedRouteIndex(choice.index)}
//                           className={`flex-shrink-0 min-w-[104px] px-3.5 py-2 rounded-xl text-left transition border ${
//                             choice.key === selectedChoice?.key
//                               ? 'bg-purple-50 border-purple-600'
//                               : 'bg-gray-50 border-transparent'
//                           }`}
//                         >
//                           <p
//                             className={`text-[11px] sm:text-xs font-semibold whitespace-nowrap ${
//                               choice.key === selectedChoice?.key ? 'text-purple-700' : 'text-gray-600'
//                             }`}
//                           >
//                             {choice.label}
//                           </p>
//                           <p className="text-xs font-bold text-gray-900 sm:text-sm whitespace-nowrap">
//                             {choice.distance.toFixed(1)} km · {Math.round(choice.duration)} min
//                           </p>
//                         </button>
//                       ))}
//                     </div>
//                   )}

//                   <div className="grid grid-cols-3 gap-3 mb-4">
//                     <div className="p-3 text-center bg-gray-50 rounded-2xl">
//                       <p className="text-base font-bold text-gray-900 sm:text-lg">
//                         {effectiveRoute ? `${effectiveRoute.distance.toFixed(1)} km` : '9.5 km'}
//                       </p>
//                       <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">Distance</p>
//                     </div>
//                     <div className="p-3 text-center bg-gray-50 rounded-2xl">
//                       <p className="text-base font-bold text-gray-900 sm:text-lg">
//                         {effectiveRoute ? `${Math.round(effectiveRoute.duration)} min` : '23 min'}
//                       </p>
//                       <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">ETA</p>
//                     </div>
//                     <div className="p-3 text-center bg-gray-50 rounded-2xl">
//                       <p className="text-base font-bold sm:text-lg text-emerald-500">
//                         {effectiveRoute ? Math.round(effectiveRoute.safetyScore) : 91}
//                       </p>
//                       <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">Safety</p>
//                     </div>
//                   </div>

//                   {(() => {
//                     const liveHazards = activeRoute?.hazards as any[] | undefined
//                     const hazardCount = liveHazards?.length ? liveHazards.length : scanHazards.length
//                     return (
//                       <div className="flex items-center gap-2 px-4 py-3 mb-4 border bg-amber-50 rounded-xl border-amber-100">
//                         <svg viewBox="0 0 24 24" className="flex-shrink-0 w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//                           <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
//                         </svg>
//                         <p className="text-xs font-medium sm:text-sm text-amber-700">
//                           {hazardCount} hazards reported on this route. Drive carefully.
//                         </p>
//                       </div>
//                     )
//                   })()}

//                   <div className="mb-6 space-y-3">
//                     {((activeRoute?.hazards as any[] | undefined)?.length ? (activeRoute!.hazards as any[]) : scanHazards).map((hazard: any) => (
//                       <div key={hazard.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
//                         <HazardListIcon type={hazard.type} />
//                         <div className="flex-1 min-w-0">
//                           <p className="text-xs font-semibold text-gray-900 truncate sm:text-sm">
//                             {typeof hazard.title === 'string' ? hazard.title : 'Reported hazard'}
//                           </p>
//                           <p className="text-[11px] sm:text-xs text-gray-400">
//                             {typeof hazard.location === 'string' ? hazard.location : ''}
//                           </p>
//                         </div>
//                         <span className="flex-shrink-0 px-2 py-1 text-[11px] sm:text-xs font-medium text-gray-500 bg-white rounded-lg">
//                           {typeof hazard.distanceKm === 'number' ? `${hazard.distanceKm.toFixed(1)} km` : hazard.distance}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </>
//               )}

//               <button
//                 onClick={handleStartTrip}
//                 disabled={planRouteMutation.isPending}
//                 className="w-full h-12 sm:h-14 bg-purple-700 hover:bg-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm sm:text-base rounded-2xl transition active:scale-[0.98] flex items-center justify-center gap-2"
//               >
//                 Start trip
//                 <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//                   <path d="M5 12h14M12 5l7 7-7 7" />
//                 </svg>
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ═══════════════════════════════════════════════════════
//           SOS ACTIVE SCREEN
//           ═══════════════════════════════════════════════════════ */}
//       {showSOS && (
//         <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-red-500">
//           <div className="flex items-start justify-between px-5 pt-14 sm:mx-auto sm:w-full sm:max-w-md">
//             <div>
//               <h2 className="text-2xl font-extrabold text-white sm:text-3xl">SOS Active</h2>
//               <p className="mt-1 text-xs sm:text-sm text-white/80">SOS broadcast, nearby drivers and contacts notified</p>
//             </div>
//             <button
//               onClick={() => setShowSOS(false)}
//               className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-white transition rounded-full sm:w-9 sm:h-9 bg-white/20 hover:bg-white/30"
//             >
//               <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
//                 <path d="M18 6L6 18M6 6l12 12" />
//               </svg>
//             </button>
//           </div>

//           {sosError && (
//             <div className="mx-5 mt-3 rounded-xl bg-white/20 px-4 py-2.5 backdrop-blur-sm sm:mx-auto sm:w-full sm:max-w-md">
//               <p className="text-[13px] font-medium text-white">
//                 Couldn&apos;t reach the server: {sosError}. Your emergency call still works.
//               </p>
//             </div>
//           )}

//           <div className="flex items-center justify-center flex-1">
//             <div className="relative">
//               <div className="absolute inset-0 w-40 h-40 -m-6 rounded-full sm:w-48 sm:h-48 bg-white/10 animate-ping" />
//               <div className="absolute inset-0 w-32 h-32 -m-2 rounded-full sm:w-40 sm:h-40 bg-white/15" />
//               <div className="relative flex items-center justify-center bg-white rounded-full shadow-2xl w-28 h-28 sm:w-36 sm:h-36">
//                 <svg viewBox="0 0 24 24" className="w-12 h-12 text-red-500 sm:w-16 sm:h-16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//                   <path d="M12 3v1" />
//                   <path d="M12 20v1" />
//                   <path d="M4.2 7.2l.7.7" />
//                   <path d="M19.1 16.1l.7.7" />
//                   <path d="M3 12h1" />
//                   <path d="M20 12h1" />
//                   <path d="M4.2 16.8l.7-.7" />
//                   <path d="M19.1 7.9l.7-.7" />
//                   <path d="M12 8a4 4 0 0 1 4 4v3H8v-3a4 4 0 0 1 4-4z" />
//                   <path d="M8 15v2a4 4 0 0 0 8 0v-2" />
//                 </svg>
//               </div>
//             </div>
//           </div>

//           <div className="px-5 pb-24 space-y-3 sm:mx-auto sm:w-full sm:max-w-md">
//             <button
//               onClick={() => {
//                 if (activeSosId) {
//                   cancelSosMutation.mutate(activeSosId, {
//                     onSettled: () => setActiveSosId(null),
//                   })
//                 }
//                 setShowSOS(false)
//                 setSosError(null)
//               }}
//               disabled={cancelSosMutation.isPending}
//               className="w-full h-12 sm:h-14 bg-white text-red-500 font-semibold text-sm sm:text-base rounded-xl hover:bg-gray-50 transition active:scale-[0.98] disabled:opacity-60"
//             >
//               {cancelSosMutation.isPending ? 'Cancelling...' : 'Cancel SOS'}
//             </button>
//             <a
//               href="tel:112"
//               className="w-full h-12 sm:h-14 bg-white/20 text-white font-semibold text-sm sm:text-base rounded-xl flex items-center justify-center gap-2 hover:bg-white/30 transition active:scale-[0.98]"
//             >
//               <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
//               </svg>
//               Call 112
//             </a>
//           </div>
//         </div>
//       )}

//       {/* Auth flow for guests who tap the profile bar */}
//       {showAuth && (
//         <AuthFlow
//           onClose={mustAuthenticateAsFleetOwner ? () => {} : () => setShowAuth(false)}
//           onAuthSuccess={() => {
//             setShowAuth(false)
//             window.location.reload()
//           }}
//         />
//       )}

//       {/* BottomNav */}
//       {!showPlanModal && !showScanResults && !showSOS && !isNavigating && (
//         <div className="absolute bottom-0 left-0 right-0 z-[500] sm:flex sm:justify-center">
//           <div className="w-full sm:max-w-md">
//             <BottomNav />
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import LazyGoogleMap from "../components/map/LazyGoogleMap";
import RouteMapView from "../components/map/RouteMapView";
import type { MapMarkerSpec } from "../components/map/GoogleMapView";
import StreetViewModal, {
  StreetViewPegman,
} from "../components/map/StreetView";
import AddressAutocompleteInput, {
  type SelectedAddress,
} from "../components/map/AddressAutocompleteInput";
import {
  reportPinHtml,
  REPORT_PIN_ANCHOR,
  REPORT_PIN_SELECTED_ANCHOR,
  userLocationPinHtml,
  USER_LOCATION_ANCHOR,
} from "../components/map/mapMarkerIcons";
import BottomNav from "../components/BottomNav";
import AuthFlow from "../components/AuthFlow";
import NotificationsPanel from "../components/NotificationsPanel";
import {
  useNotificationsList,
  useUnreadCount,
  useMarkAllRead,
  useMarkNotificationRead,
} from "../hooks/useNotifications";
import { useFleetOwnerGate } from "../hooks/useFleetOwnerGate";
import { getUserProfile } from "../api/profile";
import { reverseGeocode } from "../api/geocoding";
import { usePlanRouteOptions } from "../hooks/useRoutePlan";
import {
  pickDefaultMode,
  getRoutePath,
  getRouteAlternatives,
} from "../api/route";
import type {
  RouteModeKey,
  RouteOption,
  RouteAlternative,
} from "../types/routePlan";
import { useRouteAnimation } from "../hooks/useRouteAnimation";
import { useTriggerSos, useCancelSos } from "../hooks/useSos";
import { ApiError } from "../lib/apiClient";
import {
  cumulativeDistances,
  pointAtFraction,
  projectPointOntoPath,
  type LatLng,
} from "../lib/geoPath";
import { useVoiceGuidance } from "../hooks/useVoiceGuidance";
import { useWakeWord, useVoiceSearch } from "../hooks/useVoiceSearch";
import { forwardGeocode } from "../api/geocoding";
import { Volume2, VolumeX, Mic } from "lucide-react";

// ─── Types ─────────────────────────────────────────────
type ReportType =
  | "wave"
  | "hill"
  | "pothole"
  | "hazard"
  | "sos"
  | "sign"
  | "warning"
  | "tractor";

interface Report {
  id: string;
  lat: number;
  lng: number;
  color: string;
  type: ReportType;
  label: string;
}

interface HazardItem {
  id: string;
  type: ReportType;
  title: string;
  location: string;
  distance: string;
}

interface HazardLike {
  type?: string;
  description?: string;
  distanceLabel?: string;
  location?: { address?: string };
}

const HAZARD_ICON: Record<string, string> = {
  POTHOLE: "🕳️",
  FLOOD: "🌊",
  ACCIDENT: "⚠️",
  DEBRIS: "🪨",
  ROAD_WORKS: "🚜",
  CHECKPOINT: "🚧",
  DANGER: "⚠️",
  SOS: "🆘",
};

const HAZARD_LABEL: Record<string, string> = {
  POTHOLE: "Pothole ahead",
  FLOOD: "Flood risk ahead",
  ACCIDENT: "Accident reported ahead",
  DEBRIS: "Debris in the road ahead",
  ROAD_WORKS: "Road works ahead",
  CHECKPOINT: "Checkpoint ahead",
  DANGER: "Hazard ahead",
  SOS: "Emergency reported ahead",
};

function describeUpcomingHazard(hazards: unknown[] | undefined) {
  const first = hazards?.[0] as HazardLike | undefined;
  if (!first) return null;

  const type =
    typeof first.type === "string" ? first.type.toUpperCase() : undefined;
  return {
    icon: (type && HAZARD_ICON[type]) || "⚠️",
    label:
      (type && HAZARD_LABEL[type]) ||
      first.description ||
      first.location?.address ||
      "Hazard ahead",
  };
}

// ─── Data ──────────────────────────────────────────────
const reports: Report[] = [
  {
    id: "r1",
    lat: 6.5244,
    lng: 3.3792,
    color: "#3b82f6",
    type: "wave",
    label: "Chesapeake Avenue",
  },
  {
    id: "r2",
    lat: 6.535,
    lng: 3.368,
    color: "#f59e0b",
    type: "hill",
    label: "Southwood Avenue",
  },
  {
    id: "r3",
    lat: 6.518,
    lng: 3.391,
    color: "#f59e0b",
    type: "pothole",
    label: "Whittier Street",
  },
  {
    id: "r4",
    lat: 6.512,
    lng: 3.355,
    color: "#ef4444",
    type: "hazard",
    label: "Southwood Avenue",
  },
  {
    id: "r5",
    lat: 6.54,
    lng: 3.4,
    color: "#ef4444",
    type: "sos",
    label: "Dresden Street",
  },
  {
    id: "r6",
    lat: 6.5,
    lng: 3.38,
    color: "#2563eb",
    type: "sign",
    label: "Bretton Place",
  },
  {
    id: "r7",
    lat: 6.528,
    lng: 3.362,
    color: "#ef4444",
    type: "warning",
    label: "McDowell Street",
  },
  {
    id: "r8",
    lat: 6.515,
    lng: 3.41,
    color: "#f59e0b",
    type: "tractor",
    label: "Southwood Avenue",
  },
  {
    id: "r9",
    lat: 6.548,
    lng: 3.372,
    color: "#f59e0b",
    type: "hill",
    label: "McDowell Street",
  },
  {
    id: "r10",
    lat: 6.508,
    lng: 3.395,
    color: "#f59e0b",
    type: "pothole",
    label: "Dresden Street",
  },
  {
    id: "r11",
    lat: 6.532,
    lng: 3.348,
    color: "#ef4444",
    type: "hazard",
    label: "McDowell Street",
  },
  {
    id: "r12",
    lat: 6.495,
    lng: 3.385,
    color: "#f59e0b",
    type: "pothole",
    label: "Bretton Place",
  },
  {
    id: "r13",
    lat: 6.522,
    lng: 3.405,
    color: "#ef4444",
    type: "sos",
    label: "Bretton Place",
  },
  {
    id: "r14",
    lat: 6.505,
    lng: 3.36,
    color: "#f59e0b",
    type: "tractor",
    label: "Bretton Place",
  },
  {
    id: "r15",
    lat: 6.538,
    lng: 3.388,
    color: "#ef4444",
    type: "warning",
    label: "Bretton Place",
  },
];

// Mock hazards for scan results
const scanHazards: HazardItem[] = [
  {
    id: "h1",
    type: "pothole",
    title: "Deep pothole on 3rd Avenue",
    location: "3rd Ave & Market St",
    distance: "0.4 km",
  },
  {
    id: "h2",
    type: "hazard",
    title: "Police checkpoint",
    location: "Old Toll Gate",
    distance: "3.4 km",
  },
];

// ─── ReportIcon Component ──────────────────────────────
function ReportIcon({
  type,
  selected,
}: {
  type: ReportType;
  selected?: boolean;
}) {
  const s = selected ? 1.25 : 1;
  switch (type) {
    case "wave":
      return (
        <svg
          viewBox="0 0 24 24"
          width={18 * s}
          height={18 * s}
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M2 10c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
          <path d="M2 15c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
        </svg>
      );
    case "hill":
      return (
        <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="#3a2e1f">
          <path d="M2 18 L9 8 L13 13 L16 9 L22 18 Z" />
        </svg>
      );
    case "pothole":
      return (
        <svg viewBox="0 0 24 24" width={18 * s} height={18 * s}>
          <ellipse cx="12" cy="12" rx="8" ry="4.5" fill="#1a1a1a" />
        </svg>
      );
    case "hazard":
      return (
        <div
          style={{
            width: 18 * s,
            height: 14 * s,
            borderRadius: 2,
            backgroundImage:
              "repeating-linear-gradient(45deg, #f6c400 0 4px, #1a1a1a 4px 8px)",
          }}
        />
      );
    case "sos":
      return (
        <div className="bg-white rounded-[3px] px-1 py-0.5 flex items-center justify-center">
          <span className="text-red-600 font-extrabold text-[7px] leading-none">
            SOS
          </span>
        </div>
      );
    case "sign":
      return (
        <svg
          viewBox="0 0 24 24"
          width={18 * s}
          height={18 * s}
          fill="none"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 14 L14 4" />
          <path d="M9 4 L14 4 L14 9" />
          <path d="M20 10 L10 20" />
          <path d="M15 20 L10 20 L10 15" />
        </svg>
      );
    case "warning":
      return (
        <svg viewBox="0 0 24 24" width={18 * s} height={18 * s}>
          <path d="M12 3 L22 20 L2 20 Z" fill="white" />
          <rect x="11" y="10" width="2" height="5" fill="#e02424" />
          <rect x="11" y="16" width="2" height="2" fill="#e02424" />
        </svg>
      );
    case "tractor":
      return (
        <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="#2b2b2b">
          <rect x="8" y="8" width="7" height="5" rx="1" />
          <rect x="4" y="12" width="5" height="4" rx="1" />
          <circle
            cx="7"
            cy="18"
            r="3"
            fill="none"
            stroke="#2b2b2b"
            strokeWidth="2"
          />
          <circle
            cx="17"
            cy="18"
            r="4"
            fill="none"
            stroke="#2b2b2b"
            strokeWidth="2"
          />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Hazard List Icon ──────────────────────────────────
function HazardListIcon({ type }: { type: ReportType }) {
  switch (type) {
    case "pothole":
      return (
        <div className="flex items-center justify-center bg-gray-100 w-9 h-9 sm:w-10 sm:h-10 rounded-xl">
          <svg
            viewBox="0 0 24 24"
            className="w-4.5 h-4.5 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <ellipse cx="12" cy="12" rx="8" ry="4" fill="#1a1a1a" />
          </svg>
        </div>
      );
    case "hazard":
      return (
        <div className="flex items-center justify-center bg-blue-100 w-9 h-9 sm:w-10 sm:h-10 rounded-xl">
          <svg
            viewBox="0 0 24 24"
            className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-blue-600"
            fill="currentColor"
          >
            <rect x="4" y="4" width="16" height="16" rx="3" />
            <text
              x="12"
              y="16"
              textAnchor="middle"
              fill="white"
              fontSize="10"
              fontWeight="bold"
            >
              P
            </text>
          </svg>
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center bg-gray-100 w-9 h-9 sm:w-10 sm:h-10 rounded-xl">
          <svg
            viewBox="0 0 24 24"
            className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </div>
      );
  }
}

// ─── Spinner Icon for loading state ──────────────────────
function SpinnerIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="60"
        strokeDashoffset="20"
      />
    </svg>
  );
}

const WAKE_PHRASE = "hey driver";
const WAKE_WORD_STORAGE_KEY = "wakeWordEnabled";

// ─── Main Component ────────────────────────────────────
export default function PlanRoutePage() {
  const navigate = useNavigate();

  const isLoggedIn =
    typeof window !== "undefined" && !!localStorage.getItem("token");
  const [showAuth, setShowAuth] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Notifications: bell badge always polls the unread count; the full list
  // is only fetched once the panel is actually opened.
  const { data: unreadCountData } = useUnreadCount();
  const unreadCount = unreadCountData?.count ?? 0;

  const { data: notificationsData, isLoading: notificationsLoading } =
    useNotificationsList({ limit: 20, offset: 0 });
  const notifications = notificationsData?.notifications ?? [];

  const markAllRead = useMarkAllRead();
  const markNotificationRead = useMarkNotificationRead();

  // Fleet owners don't get the guest-browsing experience — force the
  // sign-in modal open (and keep it open) until they've authenticated.
  const mustAuthenticateAsFleetOwner = useFleetOwnerGate();

  useEffect(() => {
    if (mustAuthenticateAsFleetOwner) {
      setShowAuth(true);
    }
  }, [mustAuthenticateAsFleetOwner]);

  // ── TanStack Query: Profile ─────────────────────────
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isLoggedIn,
  });

  // ── State ───────────────────────────────────────────
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showScanResults, setShowScanResults] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [sosHolding, setSosHolding] = useState(false);
  const [sosProgress, setSosProgress] = useState(0);
  const [showUpcomingAlert, setShowUpcomingAlert] = useState(false);
  const [streetViewOpen, setStreetViewOpen] = useState(false);

  const [selectedMode, setSelectedMode] = useState<RouteModeKey>("driving");

  const [navPanelExpanded, setNavPanelExpanded] = useState(true);

  // Fix: this state was referenced by mapMarkers below but never declared,
  // which caused "Cannot find name 'selectedPin'" (TS2552).
  const [selectedPin, setSelectedPin] = useState<string | null>(null);

  const [startPoint, setStartPoint] = useState("");
  const [destination, setDestination] = useState("");

  const [startCoords, setStartCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [activeSosId, setActiveSosId] = useState<string | null>(null);
  const [sosError, setSosError] = useState<string | null>(null);

  const planRouteMutation = usePlanRouteOptions();
  const triggerSosMutation = useTriggerSos();
  const cancelSosMutation = useCancelSos();

  const routePlan = planRouteMutation.data;
  const activeRoute = routePlan?.routes[selectedMode];

  // ── Alternative routes (1-2, shown alongside the recommended one) ──
  const alternativeRoutes = useMemo(
    () => getRouteAlternatives(activeRoute, 2),
    [activeRoute],
  );

  // null = the backend's recommended route for this mode; otherwise an
  // index into alternativeRoutes.
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(
    null,
  );

  // A fresh scan or a mode switch invalidates whatever was selected before.
  useEffect(() => {
    setSelectedRouteIndex(null);
  }, [routePlan, selectedMode]);

  type RouteChoice = {
    key: string;
    label: string;
    index: number | null;
    distance: number;
    duration: number;
    path: RouteOption["path"];
  };

  const routeChoices = useMemo<RouteChoice[]>(() => {
    if (!activeRoute) return [];
    const choices: RouteChoice[] = [
      {
        key: "primary",
        label: "Recommended",
        index: null,
        distance: activeRoute.distance,
        duration: activeRoute.duration,
        path: activeRoute.path,
      },
    ];
    alternativeRoutes.forEach((alt, i) => {
      choices.push({
        key: `alt-${i}`,
        label: `Alternative ${i + 1}`,
        index: i,
        distance: alt.distance,
        duration: alt.duration,
        path: alt.path,
      });
    });
    return choices;
  }, [activeRoute, alternativeRoutes]);

  const selectedChoice =
    routeChoices.find((c) => c.index === selectedRouteIndex) ?? routeChoices[0];

  // The route actually driven/displayed: activeRoute as-is when the
  // recommendation is selected, or activeRoute with the chosen
  // alternative's path/stats spliced in otherwise.
  const effectiveRoute = useMemo<RouteOption | undefined>(() => {
    if (!activeRoute || !selectedChoice || selectedChoice.index === null)
      return activeRoute;
    const alt: RouteAlternative | undefined =
      alternativeRoutes[selectedChoice.index];
    if (!alt) return activeRoute;
    return {
      ...activeRoute,
      path: alt.path,
      distance: alt.distance || activeRoute.distance,
      duration: alt.duration || activeRoute.duration,
      durationInSeconds: (alt.duration || activeRoute.duration) * 60,
      durationFormatted: alt.durationFormatted ?? activeRoute.durationFormatted,
      summary: alt.summary ?? activeRoute.summary,
      safetyScore: alt.safetyScore ?? activeRoute.safetyScore,
      safetyLevel: alt.safetyLevel ?? activeRoute.safetyLevel,
    };
  }, [activeRoute, selectedChoice, alternativeRoutes]);

  const routePath = useMemo(
    () => getRoutePath(effectiveRoute),
    [effectiveRoute],
  );

  // The routes NOT currently selected, drawn as tappable muted lines on
  // the map so the user can switch between recommended/alternatives.
  const secondaryRoutes = useMemo(
    () =>
      routeChoices
        .filter((c) => c.key !== selectedChoice?.key)
        .map((c) => ({
          path: getRoutePath({ ...activeRoute, path: c.path } as RouteOption),
          onClick: () => setSelectedRouteIndex(c.index),
        })),
    [routeChoices, selectedChoice, activeRoute],
  );

  const availableModes = useMemo<RouteModeKey[]>(
    () => (routePlan ? (Object.keys(routePlan.routes) as RouteModeKey[]) : []),
    [routePlan],
  );

  useEffect(() => {
    if (!routePlan) return;
    const preferred = pickDefaultMode(routePlan);
    if (preferred) setSelectedMode(preferred);
  }, [routePlan]);

  const tripDurationMs = useMemo(() => {
    if (!effectiveRoute) return 30000;

    return Math.min(
      90000,
      Math.max(20000, effectiveRoute.durationInSeconds * 60),
    );
  }, [effectiveRoute]);

  const trip = useRouteAnimation({
    path: routePath,
    durationMs: tripDurationMs,
    autoPlay: false,
    loop: false,
  });

  // ── Geolocation State ────────────────────────────────
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [mapReady, setMapReady] = useState(false);

  const routeCum = useMemo(() => cumulativeDistances(routePath), [routePath]);
  const [liveProgress, setLiveProgress] = useState<number | null>(null);
  const [liveHeading, setLiveHeading] = useState(0);

  const [routeDeviationMeters, setRouteDeviationMeters] = useState<
    number | null
  >(null);

  const [gpsStatus, setGpsStatus] = useState<"waiting" | "active" | "error">(
    "waiting",
  );
  const [gpsErrorMessage, setGpsErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isNavigating || routePath.length < 2) {
      setLiveProgress(null);
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsErrorMessage("Geolocation is not supported on this device");
      trip.play();
      return;
    }

    setGpsStatus("waiting");
    setGpsErrorMessage(null);

    let watchId: number;
    let usingFallback = false;

    const onPosition = (position: GeolocationPosition) => {
      const raw: LatLng = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      const projection = projectPointOntoPath(routePath, routeCum, raw);
      const sample = pointAtFraction(routePath, routeCum, projection.fraction);

      setGpsStatus("active");
      setLiveProgress(projection.fraction);
      setLiveHeading(sample.heading);
      setRouteDeviationMeters(projection.distanceMeters);
      setUserLocation([raw.lat, raw.lng]);
    };

    const startWatch = (options: PositionOptions) => {
      watchId = navigator.geolocation.watchPosition(
        onPosition,
        (err) => {
          console.warn("[gps] watchPosition error:", err.message);

          if (!usingFallback && err.code === err.TIMEOUT) {
            usingFallback = true;
            navigator.geolocation.clearWatch(watchId);
            startWatch({
              enableHighAccuracy: false,
              maximumAge: 5000,
              timeout: 20000,
            });
            return;
          }

          setGpsStatus("error");
          setGpsErrorMessage(err.message || "Unable to get your location");

          trip.play();
        },
        options,
      );
    };

    startWatch({ enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isNavigating, routePath, routeCum]);

  const displayProgress = liveProgress ?? trip.progress;
  const displayHeading = liveProgress != null ? liveHeading : trip.heading;

  const OFF_ROUTE_THRESHOLD_METERS = 40;
  const isOffRoute =
    isNavigating &&
    liveProgress != null &&
    (routeDeviationMeters ?? 0) > OFF_ROUTE_THRESHOLD_METERS;

  const sosTimerRef = useRef<ReturnType<typeof window.setInterval> | null>(
    null,
  );
  const sosProgressRef = useRef(0);

  // ── SOS Hold Logic ──────────────────────────────────
  const startSOSHold = useCallback(() => {
    if (showSOS) return;
    setSosHolding(true);
    sosProgressRef.current = 0;
    setSosProgress(0);

    sosTimerRef.current = window.setInterval(() => {
      sosProgressRef.current += 2;
      setSosProgress(sosProgressRef.current);
      if (sosProgressRef.current >= 100) {
        if (sosTimerRef.current) window.clearInterval(sosTimerRef.current);
        setSosHolding(false);
        setSosProgress(0);
        sosProgressRef.current = 0;
        setSosError(null);

        if (!userLocation) {
          setSosError(
            "Unable to get your location. Please enable location access and try again.",
          );
          return;
        }

        setShowSOS(true);

        const [lat, lng] = userLocation;
        console.log("[sos] triggering SOS at", { lat, lng });
        triggerSosMutation.mutate(
          { latitude: lat, longitude: lng },
          {
            onSuccess: (data) => {
              console.log("[sos] triggered successfully", data);
              if (data?.id) setActiveSosId(data.id);
            },
            onError: (err) => {
              console.error("[sos] failed to trigger", err);
              const status = err instanceof ApiError ? err.status : undefined;
              const message =
                err instanceof Error ? err.message : "Failed to send SOS alert";

              if (status === 401) {
                setShowSOS(false);
                setShowAuth(true);
                return;
              }

              setSosError(message);
            },
          },
        );
      }
    }, 60);
  }, [showSOS, userLocation, triggerSosMutation]);

  const endSOSHold = useCallback(() => {
    if (sosTimerRef.current) window.clearInterval(sosTimerRef.current);
    setSosHolding(false);
    setSosProgress(0);
    sosProgressRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      if (sosTimerRef.current) window.clearInterval(sosTimerRef.current);
    };
  }, []);

  // ── Reverse geocode via backend (never call Geocoding API from the frontend) ──
  const reverseGeocodeStartPoint = useCallback(
    async (lat: number, lng: number) => {
      try {
        const { address } = await reverseGeocode(lat, lng);
        setStartPoint(address);
        setStartCoords({ lat, lng });
      } catch (err) {
        setStartPoint(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setStartCoords({ lat, lng });
      } finally {
        setIsGettingLocation(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by your browser");
      setMapReady(true);
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      const loc: [number, number] = [
        position.coords.latitude,
        position.coords.longitude,
      ];
      setUserLocation(loc);
      setMapReady(true);
      reverseGeocodeStartPoint(
        position.coords.latitude,
        position.coords.longitude,
      );
    };

    const onFinalError = (error: GeolocationPositionError) => {
      let message = "Unable to retrieve your location";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = "Location permission denied. Please enable it in settings.";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "Location information unavailable.";
          break;
        case error.TIMEOUT:
          message = "Location request timed out.";
          break;
      }
      setLocationError(message);
      setMapReady(true);
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      () => {
        // Fast attempt failed/timed out — retry with GPS + longer timeout.
        navigator.geolocation.getCurrentPosition(onSuccess, onFinalError, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, []);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by your browser");
      return;
    }
    setIsGettingLocation(true);
    setLocationError(null);

    const onSuccess = (position: GeolocationPosition) => {
      const loc: [number, number] = [
        position.coords.latitude,
        position.coords.longitude,
      ];
      setUserLocation(loc);
      reverseGeocodeStartPoint(
        position.coords.latitude,
        position.coords.longitude,
      );
    };

    const onFinalError = (error: GeolocationPositionError) => {
      let message = "Unable to retrieve your location";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = "Location permission denied. Please enable it in settings.";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "Location information unavailable.";
          break;
        case error.TIMEOUT:
          message = "Location request timed out.";
          break;
      }
      setLocationError(message);
      setIsGettingLocation(false);
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      () => {
        // Fast attempt failed/timed out — retry with GPS + longer timeout.
        navigator.geolocation.getCurrentPosition(onSuccess, onFinalError, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
    );
  }, [reverseGeocodeStartPoint]);

  // ── Route Logic ─────────────────────────────────────
  const handleScanRoute = () => {
    console.log("[route] scan route clicked", {
      startPoint,
      destination,
      startCoords,
      destinationCoords,
      userLocation,
    });

    if (!startPoint || !destination) {
      console.log("[route] blocked: startPoint or destination text is empty");
      return;
    }

    const origin =
      startCoords ??
      (userLocation ? { lat: userLocation[0], lng: userLocation[1] } : null);
    const dest = destinationCoords;

    if (!origin || !dest) {
      console.log("[route] blocked: missing coordinates", { origin, dest });
      setRouteError(
        "Pick both points from the suggestions so we have exact coordinates.",
      );
      return;
    }

    console.log("[route] planning route with payload", {
      origin,
      destination: dest,
    });
    setRouteError(null);
    setShowPlanModal(false);
    setShowScanResults(true);

    planRouteMutation.mutate(
      { origin, destination: dest },
      {
        onSuccess: (data) => {
          console.log("[route] plan succeeded", data);
        },
        onError: (err) => {
          console.error("[route] plan failed", err);
          const status = err instanceof ApiError ? err.status : undefined;
          const message =
            err instanceof Error ? err.message : "Failed to plan route";

          if (status === 401) {
            setShowScanResults(false);
            setShowAuth(true);
            return;
          }

          setRouteError(message);
        },
      },
    );
  };

  const handleStartTrip = () => {
    setShowScanResults(false);
    setIsNavigating(true);
    setNavPanelExpanded(true);
    setGpsStatus("waiting");
    setGpsErrorMessage(null);
    trip.reset();

    announcedArrivalRef.current = false;
    announcedOffRouteRef.current = false;
    lastMilestoneKmRef.current = null;

    const distanceLabel = effectiveRoute
      ? `${effectiveRoute.distance.toFixed(1)} kilometers`
      : "";
    const etaLabel = effectiveRoute
      ? `about ${Math.round(effectiveRoute.duration)} minutes`
      : "";
    voiceGuidance.speak(
      `Starting navigation${destination ? " to " + destination : ""}.${distanceLabel ? " " + distanceLabel : ""}${etaLabel ? ", " + etaLabel : ""}.`,
      { interrupt: true },
    );

    setTimeout(() => setShowUpcomingAlert(true), 2000);
    // The alert behaves like a toast, not a permanent fixture — it clears
    // itself so it can't sit there covering the map for the rest of the trip.
    setTimeout(() => setShowUpcomingAlert(false), 9000);
  };

  const handleEndTrip = () => {
    voiceGuidance.stop();
    setIsNavigating(false);
    setShowUpcomingAlert(false);
    setStartPoint("");
    setDestination("");
    setShowScanResults(false);
    setRouteError(null);
    trip.pause();
    trip.reset();
    setLiveProgress(null);
    setRouteDeviationMeters(null);
    setGpsStatus("waiting");
    setGpsErrorMessage(null);
    planRouteMutation.reset();
  };

  const hasArrived =
    isNavigating &&
    displayProgress >= 0.995 &&
    (liveProgress != null || !trip.isPlaying);

  // ── Upcoming hazard — real, not mock. `null` when the route has no
  // hazard data, in which case no banner is shown at all.
  const upcomingHazard = describeUpcomingHazard(effectiveRoute?.hazards);

  const navHazardCount = activeRoute?.hazards?.length || scanHazards.length;
  const remainingKm = effectiveRoute
    ? Math.max(0, effectiveRoute.distance * (1 - displayProgress))
    : 0;
  const etaMinutes = effectiveRoute
    ? Math.max(0, Math.round(effectiveRoute.duration * (1 - displayProgress)))
    : 0;

  // ── Turn-by-turn voice guidance ──────────────────────
  // The backend doesn't give us street-level maneuver text (no "turn left
  // onto X"), only path/distance/duration/hazards — so guidance is framed
  // around what we actually know: distance/ETA milestones, hazard
  // proximity, off-route detection, and arrival. Built on the browser's
  // native SpeechSynthesis, so it needs no API key and works offline.
  const voiceGuidance = useVoiceGuidance();
  const announcedArrivalRef = useRef(false);
  const announcedOffRouteRef = useRef(false);
  const lastMilestoneKmRef = useRef<number | null>(null);

  const remainingKmFloor =
    isNavigating && effectiveRoute && !hasArrived
      ? Math.floor(remainingKm)
      : null;

  // Distance/ETA call-outs, once per whole kilometer crossed.
  useEffect(() => {
    if (remainingKmFloor == null) return;
    if (lastMilestoneKmRef.current === remainingKmFloor) return;
    const isFirstReading = lastMilestoneKmRef.current === null;
    lastMilestoneKmRef.current = remainingKmFloor;
    // The very first reading right after trip start is already covered by
    // the "Starting navigation…" announcement in handleStartTrip.
    if (isFirstReading || remainingKmFloor <= 0) return;
    voiceGuidance.speak(
      `${remainingKmFloor} kilometer${remainingKmFloor === 1 ? "" : "s"} remaining. E.T.A. ${etaMinutes} minute${etaMinutes === 1 ? "" : "s"}.`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingKmFloor]);

  // Off-route warning — announced once per departure, resets once you're back on track.
  useEffect(() => {
    if (!isNavigating) {
      announcedOffRouteRef.current = false;
      return;
    }
    if (isOffRoute && !announcedOffRouteRef.current) {
      announcedOffRouteRef.current = true;
      voiceGuidance.speak("You've gone off route. Recalculating.", {
        interrupt: true,
      });
    } else if (!isOffRoute) {
      announcedOffRouteRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffRoute, isNavigating]);

  // Arrival — announced once.
  useEffect(() => {
    if (hasArrived && !announcedArrivalRef.current) {
      announcedArrivalRef.current = true;
      voiceGuidance.speak("You've arrived at your destination.", {
        interrupt: true,
      });
    }
    if (!isNavigating) announcedArrivalRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasArrived, isNavigating]);

  // Upcoming hazard alert — mirrors the visual "Upcoming" card.
  useEffect(() => {
    if (showUpcomingAlert && isNavigating && !hasArrived && upcomingHazard) {
      voiceGuidance.speak(`Caution: ${upcomingHazard.label} ahead.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUpcomingAlert]);

  const [wakeWordEnabled, setWakeWordEnabled] = useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem(WAKE_WORD_STORAGE_KEY) === "1",
  );
  useEffect(() => {
    try {
      window.localStorage.setItem(
        WAKE_WORD_STORAGE_KEY,
        wakeWordEnabled ? "1" : "0",
      );
    } catch {
      // ignore — non-fatal, just means the preference won't persist
    }
  }, [wakeWordEnabled]);

  const destinationVoiceSearch = useVoiceSearch();
  const [voiceCaptureStatus, setVoiceCaptureStatus] = useState<
    "idle" | "listening" | "searching"
  >("idle");

  const captureDestinationByVoice = useCallback(() => {
    setRouteError(null);
    setShowPlanModal(true);
    setVoiceCaptureStatus("listening");
    voiceGuidance.speak("Where would you like to go?", { interrupt: true });

    // Give the prompt a moment to finish before opening the mic, so the
    // recognizer doesn't try to transcribe our own voice.
    window.setTimeout(() => {
      destinationVoiceSearch.start(async (transcript) => {
        setDestination(transcript);
        setVoiceCaptureStatus("searching");
        try {
          const result = await forwardGeocode(transcript);
          if (
            typeof result.lat === "number" &&
            typeof result.lng === "number"
          ) {
            setDestination(result.address || transcript);
            setDestinationCoords({ lat: result.lat, lng: result.lng });
            voiceGuidance.speak(
              `Got it — ${result.address || transcript}. Tap Scan Route when you're ready.`,
            );
          } else {
            voiceGuidance.speak(
              "I couldn't find that place. Please pick it from the list.",
            );
          }
        } catch {
          voiceGuidance.speak(
            "I couldn't find that place. Please pick it from the list.",
          );
        } finally {
          setVoiceCaptureStatus("idle");
        }
      });
    }, 1200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationVoiceSearch]);

  const wakeWord = useWakeWord({
    phrase: WAKE_PHRASE,
    enabled: wakeWordEnabled && !isNavigating && !showPlanModal,
    onWake: captureDestinationByVoice,
  });

  // Memoize map center
  const mapCenter = useMemo<[number, number]>(
    () => userLocation || [reports[0].lat, reports[0].lng],
    [userLocation],
  );

  const mapMarkers = useMemo<MapMarkerSpec[]>(() => {
    const markers: MapMarkerSpec[] = reports.map((r) => ({
      id: r.id,
      lat: r.lat,
      lng: r.lng,
      html: reportPinHtml(r.color, r.id === selectedPin),
      anchor:
        r.id === selectedPin ? REPORT_PIN_SELECTED_ANCHOR : REPORT_PIN_ANCHOR,
      onClick: () => setSelectedPin(r.id === selectedPin ? null : r.id),
    }));

    if (userLocation && !isNavigating) {
      markers.push({
        id: "__user_location__",
        lat: userLocation[0],
        lng: userLocation[1],
        html: userLocationPinHtml,
        anchor: USER_LOCATION_ANCHOR,
      });
    }

    return markers;
  }, [selectedPin, userLocation, isNavigating]);

  // ── Profile Helpers ──────────────────────────────────
  const avatarInitials = useMemo(() => {
    if (!isLoggedIn) return "?";
    if (profileLoading || !profile) return profileLoading ? "..." : "??";
    return `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase();
  }, [isLoggedIn, profile, profileLoading]);

  const displayName = useMemo(() => {
    if (!isLoggedIn) return "Welcome 👋";
    if (profileLoading) return "Loading...";
    if (!profile) return "Welcome 👋";
    return `Good Afternoon 👋`;
  }, [isLoggedIn, profile, profileLoading]);

  const subtitleText = useMemo(() => {
    if (!isLoggedIn) return "Tap to sign in";
    if (profileLoading) return "...";
    if (!profile) return "Guest";
    if (profile.driverProfile?.address) return profile.driverProfile.address;
    return `${profile.firstName} ${profile.lastName}`;
  }, [isLoggedIn, profile, profileLoading]);

  const handleProfileBarClick = () => {
    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }
    navigate("/profile");
  };

  const handleNotificationsClick = () => {
    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }
    setShowNotifications(true);
  };

  if (!mapReady) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-gray-100">
        <div className="w-10 h-10 mb-4 border-4 border-red-500 rounded-full sm:w-12 sm:h-12 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-gray-600 sm:text-base">
          Getting your location...
        </p>
        {locationError && (
          <p className="px-8 mt-2 text-xs text-center text-red-500 sm:text-sm">
            {locationError}
          </p>
        )}
      </div>
    );
  }

  return (
    // <div
    //   className="fixed inset-0 w-full h-full overflow-hidden bg-gray-100"
    //   style={{ overscrollBehavior: 'none' }}
    // >

    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-gray-100">
      <div className="absolute inset-0 z-0">
        {effectiveRoute ? (
          <RouteMapView
            route={effectiveRoute}
            markers={mapMarkers}
            zoom={isNavigating ? 17 : 15}
            progress={isNavigating ? displayProgress : undefined}
            flowing={!isNavigating}
            heading={isNavigating ? displayHeading : 0}
            interactive={!isNavigating}
            followMode={isNavigating}
            secondaryRoutes={isNavigating ? undefined : secondaryRoutes}
            className="w-full h-full"
          />
        ) : (
          <LazyGoogleMap
            center={{ lat: mapCenter[0], lng: mapCenter[1] }}
            zoom={15}
            markers={mapMarkers}
          />
        )}
      </div>

      {/* Location error toast */}
      {locationError && !showPlanModal && !showScanResults && !showSOS && (
        <div className="absolute top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-md z-[500] bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <div className="text-yellow-600 mt-0.5">⚠️</div>
          <div>
            <p className="text-xs font-medium text-yellow-800 sm:text-sm">
              {locationError}
            </p>
            <p className="mt-1 text-[11px] sm:text-xs text-yellow-600">
              Showing default area
            </p>
          </div>
        </div>
      )}

      {/* Home Header (when not navigating and not scan results) */}
      {!isNavigating && !showScanResults && (
        <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-2 sm:flex sm:justify-center">
          <div className="sm:w-full sm:max-w-md">
            {/* Profile bar + notifications bell */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={handleProfileBarClick}
                className="flex items-center flex-1 gap-3 px-4 py-3 text-left bg-white shadow-sm rounded-2xl"
              >
                <div className="flex items-center justify-center text-xs font-bold text-white bg-purple-600 rounded-full w-9 h-9 sm:w-10 sm:h-10 sm:text-sm">
                  {avatarInitials}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 sm:text-sm">
                    {displayName}
                  </p>
                  <p className="text-[11px] sm:text-xs text-purple-600">
                    {subtitleText}
                  </p>
                </div>
              </button>

              <button
                onClick={handleNotificationsClick}
                aria-label="Notifications"
                className="relative flex items-center justify-center flex-shrink-0 bg-white shadow-sm w-11 h-11 sm:w-12 sm:h-12 rounded-2xl"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-gray-700 sm:w-6 sm:h-6"
                  fill="currentColor"
                >
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
                {isLoggedIn && unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>
            </div>

            {/* Search bar */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setRouteError(null);
                  setShowPlanModal(true);
                }}
                className="flex items-center flex-1 gap-3 px-4 py-3.5 text-left bg-white shadow-sm rounded-2xl"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="flex-shrink-0 w-4.5 h-4.5 sm:w-5 sm:h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <span className="flex-1 text-xs text-gray-400 truncate sm:text-sm">
                  {voiceCaptureStatus === "listening"
                    ? "Listening…"
                    : voiceCaptureStatus === "searching"
                      ? "Finding that place…"
                      : "Where are you going?"}
                </span>
              </button>

              {destinationVoiceSearch.isSupported && (
                <button
                  onClick={captureDestinationByVoice}
                  aria-label="Search by voice"
                  className={`flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-2xl shadow-sm transition ${
                    voiceCaptureStatus !== "idle"
                      ? "bg-purple-600 text-white animate-pulse"
                      : "bg-white text-purple-600"
                  }`}
                >
                  <Mic size={18} />
                </button>
              )}
            </div>

            {/* Hands-free "Hey Driver" wake word toggle */}
            {wakeWord.isSupported && !wakeWord.permissionDenied && (
              <button
                onClick={() => setWakeWordEnabled((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 mt-2 bg-white rounded-full shadow-sm w-fit"
              >
                <span
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition flex-shrink-0 ${
                    wakeWordEnabled ? "bg-purple-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                      wakeWordEnabled ? "translate-x-3.5" : "translate-x-0.5"
                    }`}
                  />
                </span>
                <span className="text-[11px] font-medium text-gray-700">
                  {wakeWordEnabled
                    ? `Listening for "Hey Driver"${wakeWord.isListening ? "" : "…"}`
                    : 'Hands-free "Hey Driver" — off'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scan Results Header (route info cards) */}
      {showScanResults && (
        <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-2 sm:flex sm:justify-center">
          <div className="px-4 py-3 mb-3 bg-white shadow-sm rounded-2xl sm:w-full sm:max-w-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center rounded-full w-7 h-7 sm:w-8 sm:h-8 bg-emerald-100">
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-900 sm:text-sm">
                  {startPoint || "Lekki Phase 1"}
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400">From</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center bg-red-100 rounded-full w-7 h-7 sm:w-8 sm:h-8">
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-900 sm:text-sm">
                  {destination || "3rd Avenue Market St"}
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400">To</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isNavigating && (
        <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-2 sm:flex sm:justify-center">
          <div className="space-y-2 sm:w-full sm:max-w-md">
            <div
              className={`flex items-center gap-3 px-4 py-3 shadow-sm rounded-2xl ${hasArrived ? "bg-purple-600" : "bg-emerald-500"}`}
            >
              <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {hasArrived ? (
                    <path d="M20 6L9 17l-5-5" />
                  ) : (
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  )}
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[10px] sm:text-xs font-medium tracking-wide uppercase text-white/80">
                  {hasArrived
                    ? "Trip complete"
                    : `${remainingKm.toFixed(1)} KM left`}
                </p>
                <p className="text-xs font-semibold text-white sm:text-sm">
                  {hasArrived
                    ? "You've arrived"
                    : "Head out and follow the route"}
                </p>
              </div>
              {voiceGuidance.isSupported && (
                <button
                  onClick={voiceGuidance.toggleMuted}
                  aria-label={
                    voiceGuidance.muted
                      ? "Unmute voice guidance"
                      : "Mute voice guidance"
                  }
                  className="flex items-center justify-center flex-shrink-0 text-white w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20"
                >
                  {voiceGuidance.muted ? (
                    <VolumeX size={18} />
                  ) : (
                    <Volume2 size={18} />
                  )}
                </button>
              )}
            </div>

            {gpsStatus === "waiting" && (
              <div className="flex items-center gap-3 px-4 py-3 bg-white shadow-sm rounded-xl animate-in slide-in-from-top-2">
                <div className="flex items-center justify-center flex-shrink-0 bg-blue-100 rounded-lg w-7 h-7 sm:w-8 sm:h-8">
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-blue-500 rounded-full border-t-transparent animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                    GPS
                  </p>
                  <p className="text-xs font-medium text-gray-900 truncate sm:text-sm">
                    Waiting for your location…
                  </p>
                </div>
              </div>
            )}

            {gpsStatus === "error" && (
              <div className="flex items-center gap-3 px-4 py-3 border shadow-sm bg-amber-50 border-amber-200 rounded-xl animate-in slide-in-from-top-2">
                <div className="flex items-center justify-center flex-shrink-0 rounded-lg w-7 h-7 sm:w-8 sm:h-8 bg-amber-100">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 9v4M12 17h.01M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-2.96L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[10px] text-amber-500 font-medium uppercase tracking-wide">
                    Demo mode — GPS unavailable
                  </p>
                  <p className="text-xs font-medium truncate text-amber-900 sm:text-sm">
                    {gpsErrorMessage}
                  </p>
                </div>
              </div>
            )}

            {isOffRoute && (
              <div className="flex items-center gap-3 px-4 py-3 border border-red-200 shadow-sm bg-red-50 rounded-xl animate-in slide-in-from-top-2">
                <div className="flex items-center justify-center flex-shrink-0 bg-red-100 rounded-lg w-7 h-7 sm:w-8 sm:h-8">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 9v4M12 17h.01M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-2.96L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[10px] text-red-400 font-medium uppercase tracking-wide">
                    Off route
                  </p>
                  <p className="text-xs font-medium text-red-900 truncate sm:text-sm">
                    You've drifted {Math.round(routeDeviationMeters ?? 0)}m from
                    the planned path
                  </p>
                </div>
              </div>
            )}

            {showUpcomingAlert && !hasArrived && upcomingHazard && (
              <div className="flex items-center gap-3 px-4 py-3 bg-white shadow-sm rounded-xl animate-in slide-in-from-top-2">
                <div className="flex items-center justify-center flex-shrink-0 rounded-lg w-7 h-7 sm:w-8 sm:h-8 bg-amber-100">
                  <span className="text-sm leading-none sm:text-base">
                    {upcomingHazard.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                    Upcoming
                  </p>
                  <p className="text-xs font-medium text-gray-900 truncate sm:text-sm">
                    {upcomingHazard.label}
                  </p>
                </div>
                <button
                  onClick={() => setShowUpcomingAlert(false)}
                  aria-label="Dismiss"
                  className="flex items-center justify-center flex-shrink-0 w-6 h-6 text-gray-400 rounded-full active:bg-gray-100"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isNavigating && (
        // <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex sm:justify-center">
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-[calc(5.0rem+env(safe-area-inset-bottom))] sm:flex sm:justify-center">
          <div className="sm:w-full sm:max-w-md">
            {navPanelExpanded ? (
              <div className="px-5 pt-3 pb-4 bg-white shadow-lg rounded-2xl">
                {/* Collapse handle — tap to shrink the card and see the full map */}
                <button
                  onClick={() => setNavPanelExpanded(false)}
                  className="flex items-center justify-center w-full gap-1.5 py-1.5 mb-2 -mt-1 group"
                  aria-label="Collapse trip card"
                >
                  <span className="w-8 h-1 transition bg-gray-300 rounded-full group-active:bg-gray-400" />
                  <svg
                    viewBox="0 0 24 24"
                    className="w-3.5 h-3.5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                <button
                  onClick={() => setNavPanelExpanded(false)}
                  aria-label="Collapse trip card"
                  className="grid w-full grid-cols-3 gap-2 mb-3"
                >
                  {/* <div className="text-center"> */}
                  <div className="min-w-0 text-center">
                    <p className="text-[11px] sm:text-xs text-gray-400 mb-0.5">
                      ETA
                    </p>
                    <p className="text-lg font-bold text-gray-900 sm:text-xl">
                      {hasArrived ? "0 min" : `${etaMinutes} min`}
                    </p>
                  </div>
                  <div className="min-w-0 text-center">
                    <p className="text-[11px] sm:text-xs text-gray-400 mb-0.5">
                      Remaining
                    </p>
                    <p className="text-lg font-bold text-gray-900 sm:text-xl">
                      {remainingKm.toFixed(1)} km
                    </p>
                  </div>
                  <div className="min-w-0 text-center">
                    <p className="text-[11px] sm:text-xs text-gray-400 mb-0.5">
                      Hazards
                    </p>
                    <p className="text-lg font-bold sm:text-xl text-amber-500">
                      {navHazardCount}
                    </p>
                  </div>
                </button>
                <button
                  onClick={handleEndTrip}
                  className="w-full h-11 sm:h-12 bg-red-500 hover:bg-red-600 text-white text-sm sm:text-base font-semibold rounded-xl transition active:scale-[0.98]"
                >
                  {hasArrived ? "Done" : "End Trip"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setNavPanelExpanded(true)}
                className="flex items-center w-full gap-3 py-2.5 pl-4 pr-2 bg-white shadow-lg rounded-full"
              >
                <span className="flex-1 text-xs font-semibold text-left text-gray-900 sm:text-sm">
                  {hasArrived
                    ? "You've arrived"
                    : `${etaMinutes} min · ${remainingKm.toFixed(1)} km left`}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 15l-6-6-6 6" />
                </svg>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEndTrip();
                  }}
                  role="button"
                  aria-label="End trip"
                  className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-white bg-red-500 rounded-full active:scale-95"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {!showSOS && !showPlanModal && !showScanResults && (
        <StreetViewPegman
          onClick={() => setStreetViewOpen(true)}
          className={`absolute z-[999] left-4 sm:left-8 transition-[bottom] ${
            isNavigating
              ? navPanelExpanded
                ? "bottom-56"
                : "bottom-24"
              : "bottom-32"
          }`}
        />
      )}

      <StreetViewModal
        isOpen={streetViewOpen}
        onClose={() => setStreetViewOpen(false)}
        lat={
          (
            destinationCoords ??
            routePath[routePath.length - 1] ?? {
              lat: mapCenter[0],
              lng: mapCenter[1],
            }
          ).lat
        }
        lng={
          (
            destinationCoords ??
            routePath[routePath.length - 1] ?? {
              lat: mapCenter[0],
              lng: mapCenter[1],
            }
          ).lng
        }
        label={destination || "Current location"}
      />

      {/* SOS Floating Button */}
      {!showSOS && (
        <div
          className={`absolute z-[999] right-4 sm:right-8 transition-[bottom] ${
            isNavigating
              ? navPanelExpanded
                ? "bottom-56"
                : "bottom-24"
              : "bottom-32"
          }`}
          onMouseDown={startSOSHold}
          onMouseUp={endSOSHold}
          onMouseLeave={endSOSHold}
          onTouchStart={(e) => {
            e.stopPropagation();
            startSOSHold();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            endSOSHold();
          }}
        >
          <span className="absolute inset-[-6px] rounded-full border-[3px] border-red-400/35 animate-ping pointer-events-none" />
          <span className="absolute inset-[-6px] rounded-full border-[3px] border-red-400/35 pointer-events-none" />

          {sosHolding && (
            <svg
              className="absolute inset-[-4px] w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] -rotate-90 pointer-events-none"
              viewBox="0 0 88 88"
            >
              <circle
                cx="44"
                cy="44"
                r="42"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - sosProgress / 100)}
                style={{ transition: "stroke-dashoffset 0.05s linear" }}
              />
            </svg>
          )}

          <button
            className="relative flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 text-white transition rounded-full bg-[#ff4444] active:scale-95 overflow-hidden select-none"
            style={{
              touchAction: "none",
              WebkitTouchCallout: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span className="text-[13px] sm:text-[15px] font-bold relative z-10 pointer-events-none">
              SOS
            </span>
            <span className="text-[9px] sm:text-[10px] opacity-90 relative z-10 pointer-events-none">
              {sosHolding ? "Hold..." : "Hold 3s"}
            </span>
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          PLAN ROUTE MODAL
          ═══════════════════════════════════════════════════════ */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/0 sm:bg-black/40">
          <div className="flex flex-col w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-md bg-white animate-in slide-in-from-bottom sm:rounded-3xl sm:shadow-2xl overflow-hidden">
            <div className="flex-shrink-0 px-5 pt-6 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 sm:text-2xl">
                    Plan a route
                  </h2>
                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                    We&apos;ll scan reported hazards along the way before you
                    drive.
                  </p>
                </div>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-gray-500 transition bg-gray-100 rounded-full sm:w-9 sm:h-9 hover:bg-gray-200"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4.5 h-4.5 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 px-5 space-y-5 overflow-y-auto min-h-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-5 h-5 border-2 rounded-full border-emerald-500">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-xs font-medium text-gray-900 sm:text-sm">
                    Point A — Start
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                  <AddressAutocompleteInput
                    value={startPoint}
                    onChange={setStartPoint}
                    onSelect={(result) =>
                      setStartCoords({ lat: result.lat, lng: result.lng })
                    }
                    placeholder="Search a place or Address"
                    className="flex-1"
                    inputClassName="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent outline-none sm:text-sm"
                  />
                  <button
                    onClick={handleUseMyLocation}
                    disabled={isGettingLocation}
                    className="text-xs sm:text-sm font-medium text-purple-600 whitespace-nowrap hover:text-purple-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isGettingLocation ? (
                      <>
                        <SpinnerIcon className="w-3.5 h-3.5" />
                        Locating...
                      </>
                    ) : (
                      "Use my location"
                    )}
                  </button>
                </div>
                {locationError && (
                  <p className="mt-1.5 ml-1 text-[11px] sm:text-xs text-red-500">
                    {locationError}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" y1="22" x2="4" y2="15" />
                  </svg>
                  <span className="text-xs font-medium text-gray-900 sm:text-sm">
                    Point B — Destination
                  </span>
                </div>
                <div className="px-4 py-3 bg-gray-50 rounded-xl">
                  <AddressAutocompleteInput
                    value={destination}
                    onChange={setDestination}
                    onSelect={(result) =>
                      setDestinationCoords({ lat: result.lat, lng: result.lng })
                    }
                    placeholder="Where to?"
                    inputClassName="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent outline-none sm:text-sm"
                  />
                </div>
              </div>

              <div className="h-4" />
            </div>

            <div className="flex-shrink-0 px-5 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:pb-6">
              {routeError && (
                <p className="mb-3 text-xs text-center text-red-500 sm:text-sm">
                  {routeError}
                </p>
              )}
              <button
                onClick={handleScanRoute}
                disabled={!startPoint || !destination}
                className="w-full h-12 sm:h-14 bg-purple-700 hover:bg-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm sm:text-base rounded-2xl transition active:scale-[0.98]"
              >
                Scan route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCAN RESULTS BOTTOM SHEET
          ═══════════════════════════════════════════════════════ */}
      {showScanResults && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:justify-center sm:items-center bg-white/0 sm:bg-black/30 pointer-events-none">
          <div
            className="flex-shrink-0 h-[35%] sm:hidden"
            onClick={() => setShowScanResults(false)}
          />

          <div className="flex-1 sm:flex-none flex flex-col bg-white rounded-t-[24px] sm:rounded-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.15)] sm:shadow-2xl pointer-events-auto overflow-hidden w-full sm:max-w-md sm:max-h-[80vh]">
            <div className="flex justify-center flex-shrink-0 pt-3 pb-2 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-4 sm:pt-6 pb-[calc(8rem+env(safe-area-inset-bottom))] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {planRouteMutation.isPending && (
                <div className="flex flex-col items-center justify-center gap-3 py-10">
                  <SpinnerIcon className="w-6 h-6 text-purple-600" />
                  <p className="text-xs text-gray-500 sm:text-sm">
                    Scanning route for hazards...
                  </p>
                </div>
              )}

              {!planRouteMutation.isPending && routeError && (
                <div className="flex items-center gap-2 px-4 py-3 mb-4 border border-red-100 bg-red-50 rounded-xl">
                  <p className="text-xs font-medium text-red-700 sm:text-sm">
                    {routeError}
                  </p>
                </div>
              )}

              {!planRouteMutation.isPending && !routeError && (
                <>
                  {availableModes.length > 1 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {availableModes.map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setSelectedMode(mode)}
                          className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
                            mode === selectedMode
                              ? "bg-purple-700 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {routePlan?.routes[mode]?.label ?? mode}
                        </button>
                      ))}
                    </div>
                  )}

                  {alternativeRoutes.length > 0 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {routeChoices.map((choice) => (
                        <button
                          key={choice.key}
                          onClick={() => setSelectedRouteIndex(choice.index)}
                          className={`flex-shrink-0 min-w-[104px] px-3.5 py-2 rounded-xl text-left transition border ${
                            choice.key === selectedChoice?.key
                              ? "bg-purple-50 border-purple-600"
                              : "bg-gray-50 border-transparent"
                          }`}
                        >
                          <p
                            className={`text-[11px] sm:text-xs font-semibold whitespace-nowrap ${
                              choice.key === selectedChoice?.key
                                ? "text-purple-700"
                                : "text-gray-600"
                            }`}
                          >
                            {choice.label}
                          </p>
                          <p className="text-xs font-bold text-gray-900 sm:text-sm whitespace-nowrap">
                            {choice.distance.toFixed(1)} km ·{" "}
                            {Math.round(choice.duration)} min
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="p-3 text-center bg-gray-50 rounded-2xl">
                      <p className="text-base font-bold text-gray-900 sm:text-lg">
                        {effectiveRoute
                          ? `${effectiveRoute.distance.toFixed(1)} km`
                          : "9.5 km"}
                      </p>
                      <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                        Distance
                      </p>
                    </div>
                    <div className="p-3 text-center bg-gray-50 rounded-2xl">
                      <p className="text-base font-bold text-gray-900 sm:text-lg">
                        {effectiveRoute
                          ? `${Math.round(effectiveRoute.duration)} min`
                          : "23 min"}
                      </p>
                      <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                        ETA
                      </p>
                    </div>
                    <div className="p-3 text-center bg-gray-50 rounded-2xl">
                      <p className="text-base font-bold sm:text-lg text-emerald-500">
                        {effectiveRoute
                          ? Math.round(effectiveRoute.safetyScore)
                          : 91}
                      </p>
                      <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                        Safety
                      </p>
                    </div>
                  </div>

                  {(() => {
                    const liveHazards = activeRoute?.hazards as
                      | any[]
                      | undefined;
                    const hazardCount = liveHazards?.length
                      ? liveHazards.length
                      : scanHazards.length;
                    return (
                      <div className="flex items-center gap-2 px-4 py-3 mb-4 border bg-amber-50 rounded-xl border-amber-100">
                        <svg
                          viewBox="0 0 24 24"
                          className="flex-shrink-0 w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <p className="text-xs font-medium sm:text-sm text-amber-700">
                          {hazardCount} hazards reported on this route. Drive
                          carefully.
                        </p>
                      </div>
                    );
                  })()}

                  <div className="mb-6 space-y-3">
                    {((activeRoute?.hazards as any[] | undefined)?.length
                      ? (activeRoute!.hazards as any[])
                      : scanHazards
                    ).map((hazard: any) => (
                      <div
                        key={hazard.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                      >
                        <HazardListIcon type={hazard.type} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate sm:text-sm">
                            {typeof hazard.title === "string"
                              ? hazard.title
                              : "Reported hazard"}
                          </p>
                          <p className="text-[11px] sm:text-xs text-gray-400">
                            {typeof hazard.location === "string"
                              ? hazard.location
                              : ""}
                          </p>
                        </div>
                        <span className="flex-shrink-0 px-2 py-1 text-[11px] sm:text-xs font-medium text-gray-500 bg-white rounded-lg">
                          {typeof hazard.distanceKm === "number"
                            ? `${hazard.distanceKm.toFixed(1)} km`
                            : hazard.distance}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={handleStartTrip}
                disabled={planRouteMutation.isPending}
                className="w-full h-12 sm:h-14 bg-purple-700 hover:bg-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm sm:text-base rounded-2xl transition active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Start trip
                <svg
                  viewBox="0 0 24 24"
                  className="w-4.5 h-4.5 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SOS ACTIVE SCREEN
          ═══════════════════════════════════════════════════════ */}
      {showSOS && (
        <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-red-500">
          <div className="flex items-start justify-between px-5 pt-14 sm:mx-auto sm:w-full sm:max-w-md">
            <div>
              <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                SOS Active
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-white/80">
                SOS broadcast, nearby drivers and contacts notified
              </p>
            </div>
            <button
              onClick={() => setShowSOS(false)}
              className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-white transition rounded-full sm:w-9 sm:h-9 bg-white/20 hover:bg-white/30"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4.5 h-4.5 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {sosError && (
            <div className="mx-5 mt-3 rounded-xl bg-white/20 px-4 py-2.5 backdrop-blur-sm sm:mx-auto sm:w-full sm:max-w-md">
              <p className="text-[13px] font-medium text-white">
                Couldn&apos;t reach the server: {sosError}. Your emergency call
                still works.
              </p>
            </div>
          )}

          <div className="flex items-center justify-center flex-1">
            <div className="relative">
              <div className="absolute inset-0 w-40 h-40 -m-6 rounded-full sm:w-48 sm:h-48 bg-white/10 animate-ping" />
              <div className="absolute inset-0 w-32 h-32 -m-2 rounded-full sm:w-40 sm:h-40 bg-white/15" />
              <div className="relative flex items-center justify-center bg-white rounded-full shadow-2xl w-28 h-28 sm:w-36 sm:h-36">
                <svg
                  viewBox="0 0 24 24"
                  className="w-12 h-12 text-red-500 sm:w-16 sm:h-16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3v1" />
                  <path d="M12 20v1" />
                  <path d="M4.2 7.2l.7.7" />
                  <path d="M19.1 16.1l.7.7" />
                  <path d="M3 12h1" />
                  <path d="M20 12h1" />
                  <path d="M4.2 16.8l.7-.7" />
                  <path d="M19.1 7.9l.7-.7" />
                  <path d="M12 8a4 4 0 0 1 4 4v3H8v-3a4 4 0 0 1 4-4z" />
                  <path d="M8 15v2a4 4 0 0 0 8 0v-2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="px-5 pb-24 space-y-3 sm:mx-auto sm:w-full sm:max-w-md">
            <button
              onClick={() => {
                if (activeSosId) {
                  cancelSosMutation.mutate(activeSosId, {
                    onSettled: () => setActiveSosId(null),
                  });
                }
                setShowSOS(false);
                setSosError(null);
              }}
              disabled={cancelSosMutation.isPending}
              className="w-full h-12 sm:h-14 bg-white text-red-500 font-semibold text-sm sm:text-base rounded-xl hover:bg-gray-50 transition active:scale-[0.98] disabled:opacity-60"
            >
              {cancelSosMutation.isPending ? "Cancelling..." : "Cancel SOS"}
            </button>
            <a
              href="tel:112"
              className="w-full h-12 sm:h-14 bg-white/20 text-white font-semibold text-sm sm:text-base rounded-xl flex items-center justify-center gap-2 hover:bg-white/30 transition active:scale-[0.98]"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4.5 h-4.5 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Call 112
            </a>
          </div>
        </div>
      )}

      {/* Auth flow for guests who tap the profile bar */}
      {showAuth && (
        <AuthFlow
          onClose={
            mustAuthenticateAsFleetOwner ? () => {} : () => setShowAuth(false)
          }
          onAuthSuccess={() => {
            setShowAuth(false);
            window.location.reload();
          }}
        />
      )}

      {/* Notifications panel */}
      {showNotifications && (
        <NotificationsPanel
          onClose={() => setShowNotifications(false)}
          notifications={notifications}
          isLoading={notificationsLoading}
          isMarkingAllRead={markAllRead.isPending}
          onMarkAllRead={() => markAllRead.mutate()}
          onNotificationClick={(n) => markNotificationRead.mutate(n.id)}
        />
      )}

      {/* BottomNav */}
      {!showPlanModal && !showScanResults && !showSOS && !isNavigating && (
        <div className="absolute bottom-0 left-0 right-0 z-[500] sm:flex sm:justify-center">
          <div className="w-full sm:max-w-md">
            <BottomNav />
          </div>
        </div>
      )}
    </div>
  );
}
