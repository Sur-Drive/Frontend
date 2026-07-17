import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import BottomNav from '../components/BottomNav'

// Fix Leaflet default icon
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

// Create custom report pin icons
const createReportIcon = (color: string, isSelected: boolean) => {
  const size = isSelected ? 56 : 36
  return L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="
        background:${color};
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        box-shadow:${isSelected ? '0 4px 16px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.2)'};
        border:3px solid white;
        transition:all 0.2s;
      ">
        <span style="color:white;font-size:${isSelected ? 18 : 12}px;font-weight:bold;">!</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

// User location icon (blue dot with pulse)
const userLocationIcon = L.divIcon({
  className: 'user-location',
  html: `
    <div style="position:relative;width:24px;height:24px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:#3b82f6;opacity:0.3;animation:pulse 1.5s infinite;"></div>
      <div style="position:absolute;inset:4px;border-radius:50%;background:#3b82f6;border:2px solid white;"></div>
    </div>
    <style>
      @keyframes pulse {
        0%,100% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(2); opacity: 0; }
      }
    </style>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

// Navigation arrow icon (blue arrow)
const navArrowIcon = L.divIcon({
  className: 'nav-arrow',
  html: `
    <div style="position:relative;width:28px;height:28px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:#0ea5e9;opacity:0.3;animation:pulse 1.5s infinite;"></div>
      <div style="position:absolute;inset:3px;border-radius:50%;background:#0ea5e9;border:2px solid white;display:flex;align-items:center;justify-content:center;">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
        </svg>
      </div>
    </div>
    <style>
      @keyframes pulse {
        0%,100% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(2); opacity: 0; }
      }
    </style>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

// Pan map to location when ready
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1 })
  }, [center, zoom, map])
  return null
}

// ─── Types ─────────────────────────────────────────────
type ReportType = 'wave' | 'hill' | 'pothole' | 'hazard' | 'sos' | 'sign' | 'warning' | 'tractor'

interface Report {
  id: string
  lat: number
  lng: number
  color: string
  type: ReportType
  label: string
}

interface HazardItem {
  id: string
  type: ReportType
  title: string
  location: string
  distance: string
}

// ─── Data ──────────────────────────────────────────────
const reports: Report[] = [
  { id: 'r1', lat: 6.5244, lng: 3.3792, color: '#3b82f6', type: 'wave', label: 'Chesapeake Avenue' },
  { id: 'r2', lat: 6.5350, lng: 3.3680, color: '#f59e0b', type: 'hill', label: 'Southwood Avenue' },
  { id: 'r3', lat: 6.5180, lng: 3.3910, color: '#f59e0b', type: 'pothole', label: 'Whittier Street' },
  { id: 'r4', lat: 6.5120, lng: 3.3550, color: '#ef4444', type: 'hazard', label: 'Southwood Avenue' },
  { id: 'r5', lat: 6.5400, lng: 3.4000, color: '#ef4444', type: 'sos', label: 'Dresden Street' },
  { id: 'r6', lat: 6.5000, lng: 3.3800, color: '#2563eb', type: 'sign', label: 'Bretton Place' },
  { id: 'r7', lat: 6.5280, lng: 3.3620, color: '#ef4444', type: 'warning', label: 'McDowell Street' },
  { id: 'r8', lat: 6.5150, lng: 3.4100, color: '#f59e0b', type: 'tractor', label: 'Southwood Avenue' },
  { id: 'r9', lat: 6.5480, lng: 3.3720, color: '#f59e0b', type: 'hill', label: 'McDowell Street' },
  { id: 'r10', lat: 6.5080, lng: 3.3950, color: '#f59e0b', type: 'pothole', label: 'Dresden Street' },
  { id: 'r11', lat: 6.5320, lng: 3.3480, color: '#ef4444', type: 'hazard', label: 'McDowell Street' },
  { id: 'r12', lat: 6.4950, lng: 3.3850, color: '#f59e0b', type: 'pothole', label: 'Bretton Place' },
  { id: 'r13', lat: 6.5220, lng: 3.4050, color: '#ef4444', type: 'sos', label: 'Bretton Place' },
  { id: 'r14', lat: 6.5050, lng: 3.3600, color: '#f59e0b', type: 'tractor', label: 'Bretton Place' },
  { id: 'r15', lat: 6.5380, lng: 3.3880, color: '#ef4444', type: 'warning', label: 'Bretton Place' },
]

// Mock hazards for scan results
const scanHazards: HazardItem[] = [
  { id: 'h1', type: 'pothole', title: 'Deep pothole on 3rd Avenue', location: '3rd Ave & Market St', distance: '0.4 km' },
  { id: 'h2', type: 'hazard', title: 'Police checkpoint', location: 'Old Toll Gate', distance: '3.4 km' },
]

// ─── ReportIcon Component ──────────────────────────────
function ReportIcon({ type, selected }: { type: ReportType; selected?: boolean }) {
  const s = selected ? 1.25 : 1
  switch (type) {
    case 'wave':
      return (
        <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <path d="M2 10c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
          <path d="M2 15c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
        </svg>
      )
    case 'hill':
      return (
        <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="#3a2e1f">
          <path d="M2 18 L9 8 L13 13 L16 9 L22 18 Z" />
        </svg>
      )
    case 'pothole':
      return (
        <svg viewBox="0 0 24 24" width={18 * s} height={18 * s}>
          <ellipse cx="12" cy="12" rx="8" ry="4.5" fill="#1a1a1a" />
        </svg>
      )
    case 'hazard':
      return (
        <div style={{ width: 18 * s, height: 14 * s, borderRadius: 2, backgroundImage: 'repeating-linear-gradient(45deg, #f6c400 0 4px, #1a1a1a 4px 8px)' }} />
      )
    case 'sos':
      return (
        <div className="bg-white rounded-[3px] px-1 py-0.5 flex items-center justify-center">
          <span className="text-red-600 font-extrabold text-[7px] leading-none">SOS</span>
        </div>
      )
    case 'sign':
      return (
        <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14 L14 4" /><path d="M9 4 L14 4 L14 9" /><path d="M20 10 L10 20" /><path d="M15 20 L10 20 L10 15" />
        </svg>
      )
    case 'warning':
      return (
        <svg viewBox="0 0 24 24" width={18 * s} height={18 * s}>
          <path d="M12 3 L22 20 L2 20 Z" fill="white" />
          <rect x="11" y="10" width="2" height="5" fill="#e02424" />
          <rect x="11" y="16" width="2" height="2" fill="#e02424" />
        </svg>
      )
    case 'tractor':
      return (
        <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="#2b2b2b">
          <rect x="8" y="8" width="7" height="5" rx="1" />
          <rect x="4" y="12" width="5" height="4" rx="1" />
          <circle cx="7" cy="18" r="3" fill="none" stroke="#2b2b2b" strokeWidth="2" />
          <circle cx="17" cy="18" r="4" fill="none" stroke="#2b2b2b" strokeWidth="2" />
        </svg>
      )
    default:
      return null
  }
}

// ─── Hazard List Icon ──────────────────────────────────
function HazardListIcon({ type }: { type: ReportType }) {
  switch (type) {
    case 'pothole':
      return (
        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <ellipse cx="12" cy="12" rx="8" ry="4" fill="#1a1a1a" />
          </svg>
        </div>
      )
    case 'hazard':
      return (
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-600" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="3" />
            <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">P</text>
          </svg>
        </div>
      )
    default:
      return (
        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </div>
      )
  }
}

// ─── Spinner Icon for loading state ──────────────────────
function SpinnerIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" />
    </svg>
  )
}

// ─── Main Component ────────────────────────────────────
export default function PlanRoutePage() {
  const navigate = useNavigate()

  // ── State ───────────────────────────────────────────
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showScanResults, setShowScanResults] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [showSOS, setShowSOS] = useState(false)
  const [sosHolding, setSosHolding] = useState(false)
  const [sosProgress, setSosProgress] = useState(0)
  const [showUpcomingAlert, setShowUpcomingAlert] = useState(false)
  const [selectedPin, setSelectedPin] = useState<string | null>(null)

  const [startPoint, setStartPoint] = useState('')
  const [destination, setDestination] = useState('')

  // ── Geolocation State ────────────────────────────────
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const sosTimerRef = useRef<ReturnType<typeof window.setInterval> | null>(null)
  const sosProgressRef = useRef(0)

  // ── SOS Hold Logic ──────────────────────────────────
  const startSOSHold = useCallback(() => {
    if (showSOS) return
    setSosHolding(true)
    sosProgressRef.current = 0
    setSosProgress(0)

    sosTimerRef.current = window.setInterval(() => {
      sosProgressRef.current += 2
      setSosProgress(sosProgressRef.current)
      if (sosProgressRef.current >= 100) {
        if (sosTimerRef.current) window.clearInterval(sosTimerRef.current)
        setSosHolding(false)
        setSosProgress(0)
        sosProgressRef.current = 0
        setShowSOS(true)
      }
    }, 60)
  }, [showSOS])

  const endSOSHold = useCallback(() => {
    if (sosTimerRef.current) window.clearInterval(sosTimerRef.current)
    setSosHolding(false)
    setSosProgress(0)
    sosProgressRef.current = 0
  }, [])

  useEffect(() => {
    return () => {
      if (sosTimerRef.current) window.clearInterval(sosTimerRef.current)
    }
  }, [])

  // ── Geolocation on mount ─────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser')
      setMapReady(true)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc: [number, number] = [position.coords.latitude, position.coords.longitude]
        setUserLocation(loc)
        setMapReady(true)
        // Auto-fill start point with coordinates initially
        reverseGeocode(position.coords.latitude, position.coords.longitude)
      },
      (error) => {
        let message = 'Unable to retrieve your location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable it in settings.'
            break
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.'
            break
          case error.TIMEOUT:
            message = 'Location request timed out.'
            break
        }
        setLocationError(message)
        setUserLocation([reports[0].lat, reports[0].lng])
        setMapReady(true)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  // ── Reverse Geocode (OpenStreetMap Nominatim) ──────
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      const data = await response.json()

      const address = data.address
      const suburb = address.suburb || address.neighbourhood || address.district || ''
      const road = address.road || address.street || ''
      const city = address.city || address.town || address.village || address.state || ''

      const shortAddress = suburb
        ? `${suburb}, ${city}`
        : road
          ? `${road}, ${city}`
          : data.display_name?.split(',')[0] || 'Current Location'

      setStartPoint(shortAddress)
    } catch (err) {
      setStartPoint(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    } finally {
      setIsGettingLocation(false)
    }
  }

  // ── Route Logic ─────────────────────────────────────
  const handleScanRoute = () => {
    if (!startPoint || !destination) return
    setShowPlanModal(false)
    setShowScanResults(true)
  }

  const handleStartTrip = () => {
    setShowScanResults(false)
    setIsNavigating(true)
    setTimeout(() => setShowUpcomingAlert(true), 2000)
  }

  const handleEndTrip = () => {
    setIsNavigating(false)
    setShowUpcomingAlert(false)
    setStartPoint('')
    setDestination('')
    setShowScanResults(false)
  }

  // ── Upcoming hazard (mock) ──────────────────────────
  const upcomingHazard = {
    type: 'tractor' as ReportType,
    label: 'Road Works ahead — Independence',
    distance: '0.9 KM',
  }

  if (!mapReady) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] w-full max-w-[430px] mx-auto bg-gray-100">
        <div className="w-12 h-12 mb-4 border-4 border-red-500 rounded-full border-t-transparent animate-spin" />
        <p className="font-medium text-gray-600">Getting your location...</p>
        {locationError && <p className="px-8 mt-2 text-sm text-center text-red-500">{locationError}</p>}
      </div>
    )
  }

  const mapCenter = userLocation || [reports[0].lat, reports[0].lng]

  return (
    <div className="relative h-[100dvh] w-full max-w-[430px] mx-auto overflow-hidden bg-gray-100">
      {/* Leaflet Map */}
      <div className="absolute inset-0">
        <MapContainer
          center={mapCenter as [number, number]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={mapCenter as [number, number]} zoom={15} />

          {/* User location marker */}
          {userLocation && !isNavigating && (
            <Marker position={userLocation} icon={userLocationIcon}>
              <Popup>You are here</Popup>
            </Marker>
          )}

          {/* Navigation arrow (when navigating) */}
          {isNavigating && userLocation && (
            <Marker position={userLocation} icon={navArrowIcon} />
          )}

          {/* Report markers */}
          {reports.map((r) => (
            <Marker
              key={r.id}
              position={[r.lat, r.lng]}
              icon={createReportIcon(r.color, r.id === selectedPin)}
              eventHandlers={{
                click: () => setSelectedPin(r.id === selectedPin ? null : r.id),
              }}
            >
              {r.id === selectedPin && (
                <Popup closeButton={false} className="report-popup">
                  <div className="text-center">
                    <p className="text-sm font-bold">{r.label}</p>
                  </div>
                </Popup>
              )}
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Location error toast */}
      {locationError && !showPlanModal && !showScanResults && !showSOS && (
        <div className="absolute top-4 left-4 right-4 z-[500] bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <div className="text-yellow-600 mt-0.5">⚠️</div>
          <div>
            <p className="text-sm font-medium text-yellow-800">{locationError}</p>
            <p className="mt-1 text-xs text-yellow-600">Showing default area</p>
          </div>
        </div>
      )}

      {/* Home Header (when not navigating and not scan results) */}
      {!isNavigating && !showScanResults && (
        <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-2">
          {/* Profile bar */}
          <div className="flex items-center justify-between px-4 py-3 mb-3 bg-white shadow-sm rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-gray-500 bg-gray-300 rounded-full">
                AA
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Good Afternoon 👋</p>
                <p className="text-xs text-purple-600">Lagos, Nigeria</p>
              </div>
            </div>
            <button className="relative flex items-center justify-center w-10 h-10">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-700" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </button>
          </div>

          {/* Search bar */}
          <button
            onClick={() => setShowPlanModal(true)}
            className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm text-left"
          >
            <svg viewBox="0 0 24 24" className="flex-shrink-0 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span className="flex-1 text-sm text-gray-400">Where are you going?</span>
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </div>
      )}

      {/* Scan Results Header (route info cards) */}
      {showScanResults && (
        <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-2">
          {/* Route info card */}
          <div className="px-4 py-3 mb-3 bg-white shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{startPoint || 'Lekki Phase 1'}</p>
                <p className="text-xs text-gray-400">From</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{destination || '3rd Avenue Market St'}</p>
                <p className="text-xs text-gray-400">To</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Header (when navigating) */}
      {isNavigating && (
        <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-2 max-h-[70%] overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-2">
            {/* Green direction banner */}
            <div className="flex items-center gap-3 px-4 py-3 shadow-sm bg-emerald-500 rounded-2xl">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide uppercase text-white/80">In 3.6 KM</p>
                <p className="text-sm font-semibold text-white">Head out and follow the route</p>
              </div>
            </div>

            {/* Upcoming hazard alert */}
            {showUpcomingAlert && (
              <div className="flex items-center gap-3 px-4 py-3 bg-white shadow-sm rounded-xl animate-in slide-in-from-top-2">
                <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Upcoming</p>
                  <p className="text-sm font-medium text-gray-900 truncate">🚜 {upcomingHazard.label}</p>
                </div>
                <span className="text-xs font-medium text-gray-500">{upcomingHazard.distance}</span>
              </div>
            )}

            {/* Trip stats card */}
            <div className="px-5 py-4 bg-white shadow-sm rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-0.5">ETA</p>
                  <p className="text-xl font-bold text-gray-900">17 min</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Remaining</p>
                  <p className="text-xl font-bold text-gray-900">7.1 km</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Hazards</p>
                  <p className="text-xl font-bold text-amber-500">2</p>
                </div>
              </div>
              <button
                onClick={handleEndTrip}
                className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition active:scale-[0.98]"
              >
                End Trip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOS Floating Button */}
      {!showSOS && (
        <div
          className="absolute z-[999] bottom-32 right-4"
          onMouseDown={startSOSHold}
          onMouseUp={endSOSHold}
          onMouseLeave={endSOSHold}
          onTouchStart={(e) => { e.stopPropagation(); startSOSHold(); }}
          onTouchEnd={(e) => { e.stopPropagation(); endSOSHold(); }}
        >
          {/* Outer pulse ring */}
          <span className="absolute inset-[-6px] rounded-full border-[3px] border-red-400/35 animate-ping pointer-events-none" />
          <span className="absolute inset-[-6px] rounded-full border-[3px] border-red-400/35 pointer-events-none" />

          {/* Circular progress ring */}
          {sosHolding && (
            <svg className="absolute inset-[-4px] w-[88px] h-[88px] -rotate-90 pointer-events-none" viewBox="0 0 88 88">
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
                style={{ transition: 'stroke-dashoffset 0.05s linear' }}
              />
            </svg>
          )}

          {/* Button */}
          <button
            className="relative flex flex-col items-center justify-center w-20 h-20 text-white transition rounded-full bg-[#ff4444] active:scale-95 overflow-hidden select-none"
            style={{
              touchAction: 'none',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span className="text-[15px] font-bold relative z-10 pointer-events-none">SOS</span>
            <span className="text-[10px] opacity-90 relative z-10 pointer-events-none">
              {sosHolding ? 'Hold...' : 'Hold 3s'}
            </span>
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          PLAN ROUTE MODAL
          ═══════════════════════════════════════════════════════ */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white animate-in slide-in-from-bottom">
          {/* Header */}
          <div className="flex-shrink-0 px-5 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Plan a route</h2>
                <p className="mt-1 text-sm text-gray-500">We'll scan reported hazards along the way before you drive.</p>
              </div>
              <button
                onClick={() => setShowPlanModal(false)}
                className="flex items-center justify-center text-gray-500 transition bg-gray-100 rounded-full w-9 h-9 hover:bg-gray-200"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 px-5 space-y-5 overflow-y-auto min-h-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Point A */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-5 h-5 border-2 rounded-full border-emerald-500">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <span className="text-sm font-medium text-gray-900">Point A — Start</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                <input
                  type="text"
                  placeholder="Search a place or Address"
                  value={startPoint}
                  onChange={(e) => setStartPoint(e.target.value)}
                  className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
                />
                <button
                  onClick={handleUseMyLocation}
                  disabled={isGettingLocation}
                  className="text-sm font-medium text-purple-600 whitespace-nowrap hover:text-purple-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isGettingLocation ? (
                    <>
                      <SpinnerIcon className="w-3.5 h-3.5" />
                      Locating...
                    </>
                  ) : (
                    'Use my location'
                  )}
                </button>
              </div>
              {locationError && (
                <p className="mt-1.5 ml-1 text-xs text-red-500">{locationError}</p>
              )}
            </div>

            {/* Point B */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                <span className="text-sm font-medium text-gray-900">Point B — Destination</span>
              </div>
              <div className="px-4 py-3 bg-gray-50 rounded-xl">
                <input
                  type="text"
                  placeholder="Where to?"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
                />
              </div>
            </div>

            <div className="h-4" />
          </div>

          {/* Scan button */}
          <div className="flex-shrink-0 px-5 pt-4 pb-8">
            <button
              onClick={handleScanRoute}
              disabled={!startPoint || !destination}
              className="w-full h-14 bg-purple-700 hover:bg-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-lg rounded-2xl transition active:scale-[0.98]"
            >
              Scan route
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCAN RESULTS BOTTOM SHEET
          ═══════════════════════════════════════════════════════ */}
      {showScanResults && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white/0 pointer-events-none">
          <div className="flex-shrink-0 h-[35%]" onClick={() => setShowScanResults(false)} />

          <div className="flex-1 flex flex-col bg-white rounded-t-[24px] shadow-[0_-4px_24px_rgba(0,0,0,0.15)] pointer-events-auto overflow-hidden">
            <div className="flex justify-center flex-shrink-0 pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 text-center bg-gray-50 rounded-2xl">
                  <p className="text-lg font-bold text-gray-900">9.5 km</p>
                  <p className="text-xs text-gray-400 mt-0.5">Distance</p>
                </div>
                <div className="p-3 text-center bg-gray-50 rounded-2xl">
                  <p className="text-lg font-bold text-gray-900">23 min</p>
                  <p className="text-xs text-gray-400 mt-0.5">ETA</p>
                </div>
                <div className="p-3 text-center bg-gray-50 rounded-2xl">
                  <p className="text-lg font-bold text-emerald-500">91</p>
                  <p className="text-xs text-gray-400 mt-0.5">Safety</p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-3 mb-4 border bg-amber-50 rounded-xl border-amber-100">
                <svg viewBox="0 0 24 24" className="flex-shrink-0 w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <p className="text-sm font-medium text-amber-700">
                  {scanHazards.length} hazards reported on this route. Drive carefully.
                </p>
              </div>

              <div className="mb-6 space-y-3">
                {scanHazards.map((hazard) => (
                  <div key={hazard.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <HazardListIcon type={hazard.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{hazard.title}</p>
                      <p className="text-xs text-gray-400">{hazard.location}</p>
                    </div>
                    <span className="flex-shrink-0 px-2 py-1 text-xs font-medium text-gray-500 bg-white rounded-lg">
                      {hazard.distance}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleStartTrip}
                className="w-full h-14 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-lg rounded-2xl transition active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Start trip
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          <div className="flex items-start justify-between px-5 pt-14">
            <div>
              <h2 className="text-3xl font-extrabold text-white">SOS Active</h2>
              <p className="mt-1 text-sm text-white/80">SOS broadcast, nearby drivers and contacts notified</p>
            </div>
            <button
              onClick={() => setShowSOS(false)}
              className="flex items-center justify-center text-white transition rounded-full w-9 h-9 bg-white/20 hover:bg-white/30"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-center flex-1">
            <div className="relative">
              <div className="absolute inset-0 w-48 h-48 -m-6 rounded-full bg-white/10 animate-ping" />
              <div className="absolute inset-0 w-40 h-40 -m-2 rounded-full bg-white/15" />
              <div className="relative flex items-center justify-center bg-white rounded-full shadow-2xl w-36 h-36">
                <svg viewBox="0 0 24 24" className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

          <div className="px-5 pb-24 space-y-3">
            <button
              onClick={() => setShowSOS(false)}
              className="w-full h-14 bg-white text-red-500 font-semibold text-lg rounded-xl hover:bg-gray-50 transition active:scale-[0.98]"
            >
              Cancel SOS
            </button>
            <a
              href="tel:112"
              className="w-full h-14 bg-white/20 text-white font-semibold text-lg rounded-xl flex items-center justify-center gap-2 hover:bg-white/30 transition active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Call 112
            </a>
          </div>
        </div>
      )}

      {/* BottomNav */}
      <div className="absolute bottom-0 left-0 right-0 z-[500]">
        <BottomNav />
      </div>
    </div>
  )
}






