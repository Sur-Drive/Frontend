import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import LazyGoogleMap from "../components/map/LazyGoogleMap";
import RouteMapView from "../components/map/RouteMapView";
import type { MapMarkerSpec } from "../components/map/GoogleMapView";
import MapControls, { type MapTypeId } from "../components/map/MapControls";
import { getInitialMapTheme, persistMapTheme, type MapThemeId } from "../lib/mapThemes";
import OfflineBanner from "../components/ui/OfflineBanner";
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
  closurePinHtml,
  CLOSURE_PIN_ANCHOR,
  CLOSURE_PIN_SELECTED_ANCHOR,
  userLocationPinHtml,
  USER_LOCATION_ANCHOR,
  destinationPinHtml,
  DESTINATION_PIN_ANCHOR,
  startPinHtml,
  START_PIN_ANCHOR,
  placePinHtml,
  PLACE_PIN_ANCHOR,
  PLACE_PIN_SELECTED_ANCHOR,
  trafficDelayBubbleHtml,
  TRAFFIC_DELAY_BUBBLE_ANCHOR,
} from "../components/map/mapMarkerIcons";
import PlacesAlongRoutePanel, {
  PlacesAlongRouteButton,
} from "../components/map/PlacesAlongRoutePanel";
import { usePlacesAlongRoute } from "../hooks/usePlacesAlongRoute";
import { PLACE_CATEGORIES, getPlaceCategory } from "../constants/placeCategories";
import type { PlaceCategoryId, NearbyPlace } from "../types/places";
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
  haversineMeters,
  totalLength,
  type LatLng,
} from "../lib/geoPath";
import { useVoiceGuidance } from "../hooks/useVoiceGuidance";
import { useTurnByTurn } from "../hooks/useTurnByTurn";
import { useWakeWord, useVoiceSearch } from "../hooks/useVoiceSearch";
import { forwardGeocode } from "../api/geocoding";
import { Mic } from "lucide-react";
import TurnByTurnCard, {
  describeManeuver,
} from "../components/map/TurnByTurnCard";
import VoiceGuidanceControl from "../components/map/VoiceGuidanceControl";
import {
  formatManeuverDistance,
  maneuverWarnDistance,
  maneuverWarningLeadIn,
} from "../lib/maneuvers";
import { angleDifference } from "../lib/geoPath";
import { useCollisionGuard } from "../hooks/useCollisionGuard";
import CollisionGuardView from "../components/map/CollisionGuardView";
import { describeWarning } from "../lib/collisionDetection";
import { useEtaSystem } from "../hooks/useEtaSystem";
import { phrasesFor, translateManeuverLeadIn } from "../lib/navPhrases";
import { formatEtaDistance, formatEtaDuration } from "../lib/etaSystem";
import TrafficEtaBadge from "../components/map/TrafficEtaBadge";
import RouteStopsEditor, {
  type RouteStop,
} from "../components/map/RouteStopsEditor";
import SearchSuggestionsPanel from "../components/map/SearchSuggestionsPanel";
import { useSavedPlaces } from "../hooks/useSavedPlaces";

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
  severity?: string;
  location?: { address?: string };
}

// ─── Traffic & Incident Alerts ─────────────────────────
// Icon/label/typical-delay lookups for hazard alerts shown on the plan
// screen, the upcoming-hazard banner during navigation, and the scan
// results list. Keyed by the backend's hazard `type` (uppercased) with a
// few extra forward-compatible keys (TRAFFIC, ROAD_CLOSURE, BREAKDOWN,
// POLICE) so the UI already has copy ready if the backend adds them.
const HAZARD_ICON: Record<string, string> = {
  TRAFFIC: "🚦",
  ACCIDENT: "⚠️",
  ROAD_WORKS: "🚧",
  ROAD_CLOSURE: "⛔",
  BREAKDOWN: "🚗",
  OBSTRUCTION: "🪨",
  DEBRIS: "🪨",
  CHECKPOINT: "👮",
  POLICE: "👮",
  FLOOD: "🌊",
  POTHOLE: "🕳️",
  DANGER: "⚠️",
  SOS: "🆘",
  OTHER: "⚠️",
};

const HAZARD_LABEL: Record<string, string> = {
  TRAFFIC: "Traffic ahead",
  ACCIDENT: "Accident ahead",
  ROAD_WORKS: "Road works ahead",
  ROAD_CLOSURE: "Road closed ahead",
  BREAKDOWN: "Vehicle breakdown ahead",
  OBSTRUCTION: "Obstruction on the road ahead",
  DEBRIS: "Obstruction on the road ahead",
  CHECKPOINT: "Police checkpoint ahead",
  POLICE: "Police incident reported ahead",
  FLOOD: "Flooding reported ahead",
  POTHOLE: "Pothole ahead",
  DANGER: "Hazard warning ahead",
  SOS: "Emergency reported ahead",
  OTHER: "Hazard warning ahead",
};

// Rough "how much this typically slows you down" estimate — real backend
// hazards don't carry a delay figure today, so this is a presentational
// heuristic (type baseline, nudged by severity) rather than a measured
// value. Good enough to give drivers a sense of scale at a glance.
const HAZARD_BASE_DELAY_MINUTES: Record<string, number> = {
  TRAFFIC: 6,
  ACCIDENT: 12,
  ROAD_WORKS: 8,
  ROAD_CLOSURE: 15,
  BREAKDOWN: 5,
  OBSTRUCTION: 3,
  DEBRIS: 3,
  CHECKPOINT: 4,
  POLICE: 4,
  FLOOD: 10,
  POTHOLE: 1,
  DANGER: 5,
  SOS: 5,
  OTHER: 3,
};

const SEVERITY_DELAY_MULTIPLIER: Record<string, number> = {
  LOW: 0.6,
  MEDIUM: 1,
  HIGH: 1.8,
};

function estimateDelayMinutes(type?: string, severity?: string): number | null {
  if (!type) return null;
  const base = HAZARD_BASE_DELAY_MINUTES[type.toUpperCase()];
  if (!base) return null;
  const multiplier =
    (severity && SEVERITY_DELAY_MULTIPLIER[severity.toUpperCase()]) || 1;
  return Math.max(1, Math.round(base * multiplier));
}

function formatDelayDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `~${minutes} min delay`;
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return `~${hrs}h${rem ? ` ${rem}m` : ""} delay`;
}

// Defensively pulls {lat, lng} out of a hazard object of unknown shape —
// backend hazards carry it as `location.latitude`/`location.longitude`
// (strings, per types/hazard.ts) but we also accept a plain lat/lng or
// location.lat/lng in case the shape varies, same defensive style as
// formatHazardLocation() in api/route.ts.
function extractHazardLatLng(h: unknown): { lat: number; lng: number } | null {
  const obj = h as any;
  if (!obj) return null;

  const tryPair = (latRaw: unknown, lngRaw: unknown) => {
    const lat = typeof latRaw === "string" ? parseFloat(latRaw) : latRaw;
    const lng = typeof lngRaw === "string" ? parseFloat(lngRaw) : lngRaw;
    if (typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { lat, lng };
    }
    return null;
  };

  return (
    tryPair(obj.latitude, obj.longitude) ??
    tryPair(obj.lat, obj.lng) ??
    tryPair(obj.location?.latitude, obj.location?.longitude) ??
    tryPair(obj.location?.lat, obj.location?.lng) ??
    null
  );
}

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
    delayLabel: formatDelayDuration(estimateDelayMinutes(type, first.severity)),
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
// Backing colors grouped by rough severity/category so the scan-results
// and hazard-alert lists stay visually distinct at a glance.
const HAZARD_ICON_BG: Record<string, string> = {
  TRAFFIC: "bg-amber-100",
  ACCIDENT: "bg-red-100",
  ROAD_WORKS: "bg-orange-100",
  ROAD_CLOSURE: "bg-red-100",
  BREAKDOWN: "bg-orange-100",
  OBSTRUCTION: "bg-gray-100",
  DEBRIS: "bg-gray-100",
  CHECKPOINT: "bg-blue-100",
  POLICE: "bg-blue-100",
  FLOOD: "bg-sky-100",
  POTHOLE: "bg-gray-100",
  DANGER: "bg-amber-100",
  SOS: "bg-red-100",
  OTHER: "bg-gray-100",
};

// Maps the app's own report-pin types (lowercase, used by mock/sample
// data) onto the same backend-style keys used by HAZARD_ICON/LABEL above,
// so both real hazards and sample pins render consistently here.
const REPORT_TYPE_TO_HAZARD_KEY: Record<string, string> = {
  pothole: "POTHOLE",
  hazard: "CHECKPOINT",
  sos: "SOS",
  sign: "OTHER",
  warning: "DANGER",
  tractor: "ROAD_WORKS",
  wave: "OTHER",
  hill: "OTHER",
};

function HazardListIcon({ type }: { type: string }) {
  const key =
    REPORT_TYPE_TO_HAZARD_KEY[type] ?? (type ? type.toUpperCase() : "OTHER");
  const icon = HAZARD_ICON[key] ?? "⚠️";
  const bg = HAZARD_ICON_BG[key] ?? "bg-gray-100";

  return (
    <div
      className={`flex items-center justify-center ${bg} w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex-shrink-0`}
    >
      <span className="text-base leading-none sm:text-lg">{icon}</span>
    </div>
  );
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

// ─── Active trip persistence ──────────────────────────────
const ACTIVE_TRIP_STORAGE_KEY = "activeTrip";

type StoredActiveTrip = {
  startPoint: string;
  destination: string;
  startCoords: { lat: number; lng: number } | null;
  destinationCoords: { lat: number; lng: number } | null;
  selectedMode: RouteModeKey;
};

function readStoredActiveTrip(): StoredActiveTrip | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(ACTIVE_TRIP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredActiveTrip;
    if (!parsed.destinationCoords) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredActiveTrip(trip: StoredActiveTrip) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      ACTIVE_TRIP_STORAGE_KEY,
      JSON.stringify(trip),
    );
  } catch {
    // sessionStorage can throw in private-browsing modes
  }
}

function clearStoredActiveTrip() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ACTIVE_TRIP_STORAGE_KEY);
  } catch {
    // no-op
  }
}

// ─── Main Component ────────────────────────────────────
export default function PlanRoutePage() {
  const navigate = useNavigate();

  const isLoggedIn =
    typeof window !== "undefined" && !!localStorage.getItem("token");
  const [showAuth, setShowAuth] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: unreadCountData } = useUnreadCount();
  const unreadCount = unreadCountData?.count ?? 0;

  const { data: notificationsData, isLoading: notificationsLoading } =
    useNotificationsList({ limit: 20, offset: 0 });
  const notifications = notificationsData?.notifications ?? [];

  const markAllRead = useMarkAllRead();
  const markNotificationRead = useMarkNotificationRead();

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
    staleTime: 5 * 60 * 1000,
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
  const [showPlacesPanel, setShowPlacesPanel] = useState(false);
  const [activePlaceCategory, setActivePlaceCategory] =
    useState<PlaceCategoryId | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const [selectedMode, setSelectedMode] = useState<RouteModeKey>("driving");

  const [navPanelExpanded, setNavPanelExpanded] = useState(true);
  const [topStackExpanded, setTopStackExpanded] = useState(true);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);

  const [startPoint, setStartPoint] = useState("");
  const [destination, setDestination] = useState("");
  const [stops, setStops] = useState<RouteStop[]>([]);

  // ── Search: saved places, recent searches, current-location search ──
  const savedPlaces = useSavedPlaces();
  const savedPlacesRef = useRef(savedPlaces);
  savedPlacesRef.current = savedPlaces;
  const [activeSearchField, setActiveSearchField] = useState<
    "start" | "destination" | null
  >(null);
  const [startPredictionsOpen, setStartPredictionsOpen] = useState(false);
  const [destinationPredictionsOpen, setDestinationPredictionsOpen] =
    useState(false);
  const [isLocatingDestination, setIsLocatingDestination] = useState(false);
  const [destinationLocationError, setDestinationLocationError] = useState<
    string | null
  >(null);
  const startFieldContainerRef = useRef<HTMLDivElement>(null);
  const destinationFieldContainerRef = useRef<HTMLDivElement>(null);

  // Close the suggestions panel on outside tap/click, same pattern
  // AddressAutocompleteInput uses for its own predictions dropdown.
  useEffect(() => {
    if (!activeSearchField) return;
    const handleClickOutside = (e: MouseEvent) => {
      const container =
        activeSearchField === "start"
          ? startFieldContainerRef.current
          : destinationFieldContainerRef.current;
      if (container && !container.contains(e.target as Node)) {
        setActiveSearchField(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeSearchField]);
  const stopCoords = useMemo(
    () => stops.filter((s) => s.coords).map((s) => s.coords!),
    [stops],
  );
  // Kept fresh via ref so re-plans triggered from timers/effects set up
  // before the latest stop edit still plan through the current stops.
  const stopCoordsRef = useRef(stopCoords);
  stopCoordsRef.current = stopCoords;

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

  const alternativeRoutes = useMemo(
    () => getRouteAlternatives(activeRoute, 2),
    [activeRoute],
  );

  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(
    null,
  );

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

  // ── Map display controls ─────
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // ── Places along the route ───────────────────────────
  const activePlaceCategoryObj = useMemo(
    () => (activePlaceCategory ? getPlaceCategory(activePlaceCategory) ?? null : null),
    [activePlaceCategory],
  );
  const {
    places: nearbyPlaces,
    isLoading: nearbyPlacesLoading,
    error: nearbyPlacesError,
  } = usePlacesAlongRoute(
    routePath,
    showPlacesPanel ? activePlaceCategoryObj : null,
  );

  const handleTogglePlacesPanel = useCallback(() => {
    setShowPlacesPanel((open) => {
      const next = !open;
      if (!next) {
        setActivePlaceCategory(null);
        setSelectedPlaceId(null);
      } else if (!activePlaceCategory) {
        setActivePlaceCategory(PLACE_CATEGORIES[0].id);
      }
      return next;
    });
  }, [activePlaceCategory]);

  const handlePlaceCategoryChange = useCallback((id: PlaceCategoryId) => {
    setActivePlaceCategory(id);
    setSelectedPlaceId(null);
  }, []);

  const handleSelectNearbyPlace = useCallback(
    (place: NearbyPlace) => {
      setSelectedPlaceId((current) => (current === place.id ? null : place.id));
      mapInstance?.panTo({ lat: place.lat, lng: place.lng });
    },
    [mapInstance],
  );
  const [mapTypeId, setMapTypeId] = useState<MapTypeId>("roadmap");
  const [mapTilt, setMapTilt] = useState(0);

  const [showTraffic, setShowTraffic] = useState(true);
  const [mapTheme, setMapTheme] = useState<MapThemeId>(getInitialMapTheme);
  const [manualHeading, setManualHeading] = useState(0);

  const routeCum = useMemo(() => cumulativeDistances(routePath), [routePath]);
  const [liveProgress, setLiveProgress] = useState<number | null>(null);
  const [liveHeading, setLiveHeading] = useState(0);
  const [locationAccuracyMeters, setLocationAccuracyMeters] = useState<
    number | null
  >(null);

  const [routeDeviationMeters, setRouteDeviationMeters] = useState<
    number | null
  >(null);

  // Device's actual compass heading + ground speed, straight from the
  // GPS fix — distinct from `liveHeading` above, which is the *route's*
  // expected heading at the driver's projected position. Comparing the
  // two is what lets us tell "off-route" (drifted off the path) apart
  // from "wrong way" (on the path, but pointed backwards along it), and
  // ground speed is what a speed-limit warning needs.
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [deviceSpeedKph, setDeviceSpeedKph] = useState<number | null>(null);

  const [gpsStatus, setGpsStatus] = useState<"waiting" | "active" | "error">(
    "waiting",
  );
  const [gpsErrorMessage, setGpsErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isNavigating || routePath.length < 2) {
      setLiveProgress(null);
      setLocationAccuracyMeters(null);
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsErrorMessage("Geolocation is not supported on this device");
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
      setLocationAccuracyMeters(position.coords.accuracy);
      setUserLocation([raw.lat, raw.lng]);
      setDeviceHeading(
        typeof position.coords.heading === "number" &&
          !Number.isNaN(position.coords.heading)
          ? position.coords.heading
          : null,
      );
      setDeviceSpeedKph(
        typeof position.coords.speed === "number" &&
          !Number.isNaN(position.coords.speed) &&
          position.coords.speed >= 0
          ? position.coords.speed * 3.6
          : null,
      );
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

  // "Wrong way": still on the route line (not off-route), but pointed
  // roughly opposite the direction of travel — e.g. driving backwards
  // down a one-way stretch. Distinct from off-route, which only means
  // "not on the path" and says nothing about which way the driver is
  // facing. Requires actual GPS heading (`coords.heading`, which most
  // browsers only populate above a walking pace) and a genuine minimum
  // speed, since heading is unreliable near-stationary.
  const WRONG_WAY_ANGLE_THRESHOLD = 120;
  const WRONG_WAY_MIN_SPEED_KPH = 8;
  const isWrongWay =
    isNavigating &&
    !isOffRoute &&
    liveProgress != null &&
    deviceHeading != null &&
    liveHeading != null &&
    (deviceSpeedKph ?? 0) >= WRONG_WAY_MIN_SPEED_KPH &&
    Math.abs(angleDifference(liveHeading, deviceHeading)) >
      WRONG_WAY_ANGLE_THRESHOLD;

  // Speed-limit warning — only ever activates when the route actually
  // carries a `speedLimitKph` (the backend doesn't send one today; see
  // the field's doc comment in types/routePlan.ts). A small buffer above
  // the posted limit avoids nagging over normal speedometer/GPS noise.
  const SPEED_WARNING_BUFFER_KPH = 8;
  const speedLimitKph = effectiveRoute?.speedLimitKph;
  const isOverSpeedLimit =
    isNavigating &&
    typeof speedLimitKph === "number" &&
    deviceSpeedKph != null &&
    deviceSpeedKph > speedLimitKph + SPEED_WARNING_BUFFER_KPH;

  const turnByTurn = useTurnByTurn(routePath, displayProgress, isNavigating);

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

  // ── Reverse geocode via backend ──
  const reverseGeocodeStartPoint = useCallback(
    async (lat: number, lng: number) => {
      try {
        const { address } = await reverseGeocode(lat, lng);
        setStartPoint(address);
        setStartCoords({ lat, lng });
        savedPlacesRef.current.addRecentSearch({ address, lat, lng });
      } catch (err) {
        setStartPoint(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setStartCoords({ lat, lng });
      } finally {
        setIsGettingLocation(false);
        setActiveSearchField(null);
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

    const requestAccuratePosition = () => {
      navigator.geolocation.getCurrentPosition(onSuccess, onFinalError, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (position.coords.accuracy <= 100) {
          onSuccess(position);
        } else {
          requestAccuratePosition();
        }
      },
      requestAccuratePosition,
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

    const requestAccuratePosition = () => {
      navigator.geolocation.getCurrentPosition(onSuccess, onFinalError, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (position.coords.accuracy <= 100) {
          onSuccess(position);
        } else {
          requestAccuratePosition();
        }
      },
      requestAccuratePosition,
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
    );
  }, [reverseGeocodeStartPoint]);

  // Reverse geocode the device's current position into the destination
  // field — the "Search around current location" action for Point B.
  // (Point A already has this via handleUseMyLocation/"Use my location".)
  const handleUseCurrentLocationForDestination = useCallback(() => {
    if (!navigator.geolocation) {
      setDestinationLocationError("Geolocation not supported by your browser");
      return;
    }
    setIsLocatingDestination(true);
    setDestinationLocationError(null);

    const resolve = async (lat: number, lng: number) => {
      try {
        const { address } = await reverseGeocode(lat, lng);
        setDestination(address);
        setDestinationCoords({ lat, lng });
        savedPlacesRef.current.addRecentSearch({ address, lat, lng });
      } catch {
        const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setDestination(fallback);
        setDestinationCoords({ lat, lng });
      } finally {
        setIsLocatingDestination(false);
        setActiveSearchField(null);
      }
    };

    const onError = (error: GeolocationPositionError) => {
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
      setDestinationLocationError(message);
      setIsLocatingDestination(false);
    };

    if (userLocation) {
      resolve(userLocation[0], userLocation[1]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords.latitude, position.coords.longitude),
      onError,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, [userLocation]);

  // Selecting a saved place, favourite, or recent search from the
  // suggestions panel — fills whichever field (start/destination) is
  // currently active.
  const handleSelectSuggestion = useCallback(
    (place: { address: string; lat: number; lng: number; placeId?: string }) => {
      if (activeSearchField === "start") {
        setStartPoint(place.address);
        setStartCoords({ lat: place.lat, lng: place.lng });
      } else if (activeSearchField === "destination") {
        setDestination(place.address);
        setDestinationCoords({ lat: place.lat, lng: place.lng });
      }
      savedPlacesRef.current.addRecentSearch(place);
      setActiveSearchField(null);
    },
    [activeSearchField],
  );

  const handleRecenter = useCallback(() => {
    if (userLocation && mapInstance) {
      mapInstance.panTo({ lat: userLocation[0], lng: userLocation[1] });
      if ((mapInstance.getZoom() ?? 15) < 15) {
        mapInstance.setZoom(16);
      }
      return;
    }
    handleUseMyLocation();
  }, [userLocation, mapInstance, handleUseMyLocation]);

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
      { origin, destination: dest, stops: stopCoords },
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

    writeStoredActiveTrip({
      startPoint,
      destination,
      startCoords,
      destinationCoords,
      selectedMode,
    });

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
    setTimeout(() => setShowUpcomingAlert(false), 9000);
  };

  const handleEndTrip = () => {
    voiceGuidance.stop();
    setIsNavigating(false);
    setShowUpcomingAlert(false);
    setStartPoint("");
    setDestination("");
    setStops([]);
    setShowScanResults(false);
    setRouteError(null);
    trip.pause();
    trip.reset();
    setLiveProgress(null);
    setRouteDeviationMeters(null);
    setGpsStatus("waiting");
    setGpsErrorMessage(null);
    planRouteMutation.reset();
    lastTrafficDurationRef.current = null;
    setTrafficNotice(null);
    clearStoredActiveTrip();
  };

  // ── Resume a trip in progress ──────────────────────────
  // If the app is backgrounded/reloaded mid-trip (screen locked, tab
  // suspended, browser killed the page to save memory, etc.) and the
  // driver comes back, we shouldn't drop them back on the plan screen
  // as if the trip ended — restore the same navigating view they left.
  const resumedActiveTripRef = useRef(false);
  const pendingResumeDestRef = useRef<{ lat: number; lng: number } | null>(
    null,
  );
  const resumeReplanFiredRef = useRef(false);

  useEffect(() => {
    if (resumedActiveTripRef.current) return;
    resumedActiveTripRef.current = true;

    const stored = readStoredActiveTrip();
    if (!stored || !stored.destinationCoords) return;

    setStartPoint(stored.startPoint);
    setDestination(stored.destination);
    setStartCoords(stored.startCoords);
    setDestinationCoords(stored.destinationCoords);
    setSelectedMode(stored.selectedMode);
    setShowPlanModal(false);
    setShowScanResults(false);
    setIsNavigating(true);
    setNavPanelExpanded(true);

    // Don't replan from the ORIGINAL start point — the driver has
    // likely moved since the trip began. Wait for a fresh GPS fix
    // (below) so the resumed route continues from where they
    // actually are now, and only fall back to the original start
    // point if a live fix never arrives.
    pendingResumeDestRef.current = stored.destinationCoords;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const dest = pendingResumeDestRef.current;
    if (!dest || resumeReplanFiredRef.current) return;

    // Prefer the live GPS position so the route picks up from the
    // driver's current location; fall back to the location they
    // started from if we couldn't get a fresh fix (permission denied,
    // GPS unavailable, etc.) so the trip doesn't get stuck.
    const origin = userLocation
      ? { lat: userLocation[0], lng: userLocation[1] }
      : locationError
        ? startCoords
        : null;
    if (!origin) return;

    resumeReplanFiredRef.current = true;
    pendingResumeDestRef.current = null;
    planRouteMutation.mutate({ origin, destination: dest, stops: stopCoords });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, locationError]);

  // ── Live traffic: periodic re-plan while navigating ───────────
  const userLocationRef = useRef(userLocation);
  userLocationRef.current = userLocation;

  const lastTrafficDurationRef = useRef<number | null>(null);
  const [trafficNotice, setTrafficNotice] = useState<string | null>(null);
  const TRAFFIC_RECALC_INTERVAL_MS = 120000;
  const TRAFFIC_NOTICE_THRESHOLD_MIN = 2;

  useEffect(() => {
    if (!isNavigating || !destinationCoords) return;
    const dest = destinationCoords;

    if (lastTrafficDurationRef.current == null && effectiveRoute) {
      lastTrafficDurationRef.current = effectiveRoute.duration;
    }

    const interval = setInterval(() => {
      const loc = userLocationRef.current;
      if (!loc) return;

      planRouteMutation.mutate(
        {
          origin: { lat: loc[0], lng: loc[1] },
          destination: dest,
          stops: stopCoordsRef.current,
        },
        {
          onSuccess: (data) => {
            const updated = data.routes[selectedMode];
            if (!updated) return;

            const previous = lastTrafficDurationRef.current;
            lastTrafficDurationRef.current = updated.duration;

            if (previous == null) return;
            const deltaMin = Math.round(updated.duration - previous);

            if (Math.abs(deltaMin) >= TRAFFIC_NOTICE_THRESHOLD_MIN) {
              setTrafficNotice(
                deltaMin > 0
                  ? `Traffic ahead — route updated, +${deltaMin} min`
                  : `Traffic cleared — route updated, ${Math.abs(deltaMin)} min faster`,
              );
              setTimeout(() => setTrafficNotice(null), 7000);
            }
          },
        },
      );
    }, TRAFFIC_RECALC_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNavigating, destinationCoords, selectedMode]);

  // ── Collision Guard ─────────────────────────────────
  const [collisionGuardEnabled, setCollisionGuardEnabled] = useState(false);
  const [collisionGuardExpanded, setCollisionGuardExpanded] = useState(false);
  const collisionGuard = useCollisionGuard(
    collisionGuardEnabled && isNavigating,
  );

  const lastSpokenCollisionRef = useRef<{
    id: string;
    severity: string;
    at: number;
  } | null>(null);

  useEffect(() => {
    const warning = collisionGuard.activeWarning;
    if (!collisionGuardEnabled || !isNavigating || !warning) return;

    const last = lastSpokenCollisionRef.current;
    const sameAndRecent =
      last &&
      last.id === warning.id &&
      last.severity === warning.severity &&
      Date.now() - last.at < 8000;
    if (sameAndRecent) return;

    lastSpokenCollisionRef.current = {
      id: warning.id,
      severity: warning.severity,
      at: Date.now(),
    };
    voiceGuidance.speak(describeWarning(warning), {
      interrupt: warning.severity === "high",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collisionGuard.activeWarning, collisionGuardEnabled, isNavigating]);

  // ── Arrival ──
  // Google Maps doesn't declare arrival off a single GPS sample — a lone
  // noisy/inaccurate fix that happens to land near the destination would
  // otherwise trigger "You've arrived" while still blocks away. We guard
  // against that the same way: ignore fixes whose reported accuracy is too
  // poor to trust, and require the "arrived" condition to hold steadily
  // for a few seconds (not just once) before actually confirming it.
  //
  // Straight-line distance alone isn't enough either: it can look small
  // while the destination is still a real drive away (across a highway
  // median, a canal, a walled estate, etc — the classic "3 km left" but
  // as-the-crow-flies is only 40 m" case). So arrival requires BOTH the
  // straight-line distance AND the distance remaining *along the actual
  // route* to be small — matching how turn-by-turn nav apps do it.
  const ARRIVAL_RADIUS_METERS = 50;
  const ARRIVAL_ROUTE_REMAINING_METERS = 60;
  const ARRIVAL_MAX_ACCURACY_METERS = 100;
  const ARRIVAL_CONFIRM_MS = 3000;

  const distanceToDestinationMeters =
    userLocation && destinationCoords
      ? haversineMeters(
          { lat: userLocation[0], lng: userLocation[1] },
          destinationCoords,
        )
      : null;

  const routeRemainingMeters =
    liveProgress != null
      ? (1 - liveProgress) * totalLength(routeCum)
      : null;

  const isPositionAccurateEnough =
    locationAccuracyMeters != null &&
    locationAccuracyMeters <= ARRIVAL_MAX_ACCURACY_METERS;

  const isArrivalCandidate =
    isNavigating &&
    liveProgress != null &&
    displayProgress >= 0.995 &&
    distanceToDestinationMeters != null &&
    distanceToDestinationMeters <= ARRIVAL_RADIUS_METERS &&
    routeRemainingMeters != null &&
    routeRemainingMeters <= ARRIVAL_ROUTE_REMAINING_METERS &&
    isPositionAccurateEnough;

  const [hasArrived, setHasArrived] = useState(false);
  const arrivalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isArrivalCandidate) {
      if (arrivalTimerRef.current) {
        clearTimeout(arrivalTimerRef.current);
        arrivalTimerRef.current = null;
      }
      setHasArrived(false);
      return;
    }

    if (hasArrived) return;

    arrivalTimerRef.current = setTimeout(() => {
      setHasArrived(true);
      arrivalTimerRef.current = null;
    }, ARRIVAL_CONFIRM_MS);

    return () => {
      if (arrivalTimerRef.current) {
        clearTimeout(arrivalTimerRef.current);
        arrivalTimerRef.current = null;
      }
    };
  }, [isArrivalCandidate, hasArrived]);

  const upcomingHazard = describeUpcomingHazard(effectiveRoute?.hazards);

  // ── Top-stack alert priority ──────────────────────────
  const activeTopAlert:
    | "collision"
    | "wrongway"
    | "offroute"
    | "gpserror"
    | "gpswaiting"
    | "hazard"
    | null =
    collisionGuardEnabled && collisionGuard.activeWarning
      ? "collision"
      : isWrongWay
        ? "wrongway"
        : isOffRoute
          ? "offroute"
          : gpsStatus === "error"
            ? "gpserror"
            : gpsStatus === "waiting"
              ? "gpswaiting"
              : showUpcomingAlert && !hasArrived && upcomingHazard
                ? "hazard"
                : null;

  const navHazardCount = activeRoute?.hazards?.length || scanHazards.length;

  // ── ETA system ──────────────────────────────────────
  // Centralizes current ETA, remaining time/distance, and the
  // traffic-adjusted delta. It recomputes continuously (ticking every
  // second, plus whenever `effectiveRoute`/progress change), and its
  // traffic baseline resets automatically on a genuine reroute or a
  // stop being added/removed, since those change the route's identity.
  const eta = useEtaSystem({
    route: effectiveRoute,
    progress: displayProgress,
    isNavigating,
    hasArrived,
  });
  const remainingKm = eta.remainingKm;
  const etaMinutes = eta.remainingMinutes;
  const plannedArrivalLabel = eta.plannedEtaClock;
  const liveArrivalLabel = eta.currentEtaClock;

  // ── Turn-by-turn voice guidance ──────────────────────
  const voiceGuidance = useVoiceGuidance();
  const navPhrases = useMemo(() => phrasesFor(voiceGuidance.navLanguage), [voiceGuidance.navLanguage]);
  const announcedArrivalRef = useRef(false);
  const announcedOffRouteRef = useRef(false);
  const lastMilestoneKmRef = useRef<number | null>(null);

  const remainingKmFloor =
    isNavigating && effectiveRoute && !hasArrived
      ? Math.floor(remainingKm)
      : null;

  useEffect(() => {
    if (remainingKmFloor == null) return;
    if (lastMilestoneKmRef.current === remainingKmFloor) return;
    const isFirstReading = lastMilestoneKmRef.current === null;
    lastMilestoneKmRef.current = remainingKmFloor;
    if (isFirstReading || remainingKmFloor <= 0) return;
    voiceGuidance.speak(navPhrases.kmRemaining(remainingKmFloor, etaMinutes));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingKmFloor]);

  useEffect(() => {
    if (!isNavigating) {
      announcedOffRouteRef.current = false;
      return;
    }
    if (isOffRoute && !announcedOffRouteRef.current) {
      announcedOffRouteRef.current = true;
      voiceGuidance.speak(navPhrases.offRoute, {
        interrupt: true,
      });
    } else if (!isOffRoute) {
      announcedOffRouteRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffRoute, isNavigating]);

  useEffect(() => {
    if (hasArrived && !announcedArrivalRef.current) {
      announcedArrivalRef.current = true;
      voiceGuidance.speak(navPhrases.arrived, {
        interrupt: true,
      });
    }
    if (!isNavigating) announcedArrivalRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasArrived, isNavigating]);

  useEffect(() => {
    if (showUpcomingAlert && isNavigating && !hasArrived && upcomingHazard) {
      voiceGuidance.speak(navPhrases.hazardAhead(upcomingHazard.label));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUpcomingAlert]);

  // ── Traffic announcements ──────────────────────────
  // Announce once when the live traffic-aware ETA first tips into
  // "slower" territory (heavy traffic ahead added noticeable delay) and
  // again if it later clears back to typical — mirrors the visual
  // TrafficBadge but only speaks up when the traffic picture actually
  // changes, not on every tick.
  const announcedTrafficToneRef = useRef<"typical" | "slower" | "faster" | null>(null);
  useEffect(() => {
    if (!isNavigating || hasArrived || !eta.traffic) return;
    const tone = eta.traffic.tone;
    if (announcedTrafficToneRef.current === tone) return;
    const wasAnnounced = announcedTrafficToneRef.current !== null;
    announcedTrafficToneRef.current = tone;
    if (!wasAnnounced) return; // don't announce the very first reading, only genuine changes
    if (tone === "slower") {
      voiceGuidance.speak(navPhrases.heavyTraffic(eta.traffic.label));
    } else if (tone === "typical") {
      voiceGuidance.speak(navPhrases.trafficCleared);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eta.traffic?.tone, isNavigating, hasArrived]);

  useEffect(() => {
    if (!isNavigating) announcedTrafficToneRef.current = null;
  }, [isNavigating]);

  // ── Turn-by-turn maneuver call-outs ──────────────────
  // Ordinary turns get a heads-up at 300m; sharp turns, roundabouts,
  // highway exits, and U-turns get it earlier (500m — see
  // maneuverWarnDistance) since they need more reaction time, plus a
  // pointed lead-in ("Sharp turn ahead") ahead of the normal "In X, …"
  // phrasing instead of blending in with routine turn call-outs.
  const MANEUVER_NOW_METERS = 30;
  const announcedWarnRef = useRef<string | null>(null);
  const announcedNowRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isNavigating || hasArrived) return;
    const step = turnByTurn.currentStep;
    if (!step || step.type === "arrive") return;

    const distance = turnByTurn.distanceToNextManeuverMeters;
    const lang = voiceGuidance.navLanguage;
    const instruction = describeManeuver(step, turnByTurn.nextRoadName, lang);
    const warnDistance = maneuverWarnDistance(step.type);
    const leadIn = lang === "en" ? maneuverWarningLeadIn(step.type) : translateManeuverLeadIn(step.type, lang);

    if (distance <= warnDistance && announcedWarnRef.current !== step.id) {
      announcedWarnRef.current = step.id;
      const body =
        lang === "en"
          ? `In ${formatManeuverDistance(distance)}, ${instruction.charAt(0).toLowerCase()}${instruction.slice(1)}.`
          : navPhrases.maneuverIn(formatManeuverDistance(distance), instruction);
      voiceGuidance.speak(leadIn ? `${leadIn}. ${body}` : body);
    }

    if (
      distance <= MANEUVER_NOW_METERS &&
      announcedNowRef.current !== step.id
    ) {
      announcedNowRef.current = step.id;
      voiceGuidance.speak(navPhrases.maneuverNow(instruction), { interrupt: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isNavigating,
    hasArrived,
    turnByTurn.currentStep?.id,
    turnByTurn.distanceToNextManeuverMeters,
    turnByTurn.nextRoadName,
  ]);

  useEffect(() => {
    if (!isNavigating) {
      announcedWarnRef.current = null;
      announcedNowRef.current = null;
    }
  }, [isNavigating]);

  // ── Destination approaching ──────────────────────────
  // A distinct heads-up shortly before arrival ("Approaching your
  // destination") — separate from the "You've arrived" announcement,
  // which only fires once hasArrived flips true.
  const DESTINATION_APPROACH_METERS = 400;
  const announcedApproachRef = useRef(false);
  useEffect(() => {
    if (!isNavigating) {
      announcedApproachRef.current = false;
      return;
    }
    if (hasArrived || announcedApproachRef.current) return;
    if (remainingKm * 1000 <= DESTINATION_APPROACH_METERS) {
      announcedApproachRef.current = true;
      voiceGuidance.speak(navPhrases.approachingDestination);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNavigating, hasArrived, remainingKm]);

  // ── Wrong-way warning ─────────────────────────────────
  // Distinct from the off-route/"Recalculating" announcement above:
  // this fires when the driver is still on the route line but their
  // actual GPS heading points roughly opposite the route's direction of
  // travel — e.g. driving backwards down a one-way stretch.
  const announcedWrongWayRef = useRef(false);
  useEffect(() => {
    if (!isNavigating) {
      announcedWrongWayRef.current = false;
      return;
    }
    if (isWrongWay && !announcedWrongWayRef.current) {
      announcedWrongWayRef.current = true;
      voiceGuidance.speak(
        navPhrases.wrongWay,
        { interrupt: true },
      );
    } else if (!isWrongWay) {
      announcedWrongWayRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWrongWay, isNavigating]);

  // ── Speed-limit warning (where supported) ─────────────
  // Only ever fires when the route actually carries a `speedLimitKph` —
  // the backend doesn't send one today, so this stays silent until it
  // does. Re-arms once the driver's speed drops back under the limit,
  // so it can warn again on a later stretch without spamming while
  // still over.
  const announcedSpeedRef = useRef(false);
  useEffect(() => {
    if (!isNavigating) {
      announcedSpeedRef.current = false;
      return;
    }
    if (isOverSpeedLimit && !announcedSpeedRef.current) {
      announcedSpeedRef.current = true;
      voiceGuidance.speak(navPhrases.overSpeedLimit(speedLimitKph ?? 0));
    } else if (!isOverSpeedLimit) {
      announcedSpeedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOverSpeedLimit, isNavigating]);

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
      // ignore
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
    voiceGuidance.speak(navPhrases.whereTo, { interrupt: true });

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
            voiceGuidance.speak(navPhrases.destinationSet(result.address || transcript));
          } else {
            voiceGuidance.speak(navPhrases.destinationNotFound);
          }
        } catch {
          voiceGuidance.speak(navPhrases.destinationNotFound);
        } finally {
          setVoiceCaptureStatus("idle");
        }
      });
    }, 1200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationVoiceSearch, navPhrases]);

  const wakeWord = useWakeWord({
    phrase: WAKE_PHRASE,
    enabled: wakeWordEnabled && !isNavigating && !showPlanModal,
    onWake: captureDestinationByVoice,
  });

  const mapCenter = useMemo<[number, number]>(
    () => userLocation || [reports[0].lat, reports[0].lng],
    [userLocation],
  );

  const mapMarkers = useMemo<MapMarkerSpec[]>(() => {
    const markers: MapMarkerSpec[] = reports.map((r) => ({
      id: r.id,
      lat: r.lat,
      lng: r.lng,
      html:
        r.type === "closure"
          ? closurePinHtml(r.color, r.id === selectedPin)
          : reportPinHtml(r.color, r.id === selectedPin),
      anchor:
        r.type === "closure"
          ? r.id === selectedPin
            ? CLOSURE_PIN_SELECTED_ANCHOR
            : CLOSURE_PIN_ANCHOR
          : r.id === selectedPin
            ? REPORT_PIN_SELECTED_ANCHOR
            : REPORT_PIN_ANCHOR,
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

    if (effectiveRoute && routePath.length > 0) {
      const destPoint = destinationCoords ?? routePath[routePath.length - 1];
      markers.push({
        id: "__destination__",
        lat: destPoint.lat,
        lng: destPoint.lng,
        html: destinationPinHtml(),
        anchor: DESTINATION_PIN_ANCHOR,
      });

      if (!isNavigating) {
        const originPoint = startCoords ?? routePath[0];
        markers.push({
          id: "__start__",
          lat: originPoint.lat,
          lng: originPoint.lng,
          html: startPinHtml,
          anchor: START_PIN_ANCHOR,
        });
      }

      // Traffic/incident "delay" bubbles along the route while actively
      // navigating — snap each reported hazard onto the route line, keep
      // only the ones still ahead of the driver, and show the nearest
      // handful so the map doesn't get cluttered on a long route.
      if (isNavigating && effectiveRoute?.hazards?.length) {
        const upcoming = (effectiveRoute.hazards as unknown[])
          .map((h) => {
            const latLng = extractHazardLatLng(h);
            if (!latLng) return null;
            const projection = projectPointOntoPath(routePath, routeCum, latLng);
            return { hazard: h as any, projection };
          })
          .filter(
            (
              entry,
            ): entry is {
              hazard: any;
              projection: ReturnType<typeof projectPointOntoPath>;
            } => entry != null && entry.projection.fraction > displayProgress,
          )
          .sort((a, b) => a.projection.fraction - b.projection.fraction)
          .slice(0, 4);

        for (const { hazard, projection } of upcoming) {
          const type =
            typeof hazard.type === "string" ? hazard.type.toUpperCase() : undefined;
          const icon = (type && HAZARD_ICON[type]) || "⚠️";
          const minutes = estimateDelayMinutes(type, hazard.severity);
          const label = minutes ? `${minutes} min` : (type && HAZARD_LABEL[type]) || "Ahead";
          const severity =
            hazard.severity === "HIGH" || hazard.severity === "LOW"
              ? hazard.severity
              : "MEDIUM";

          markers.push({
            id: `__hazard_${hazard.id ?? projection.fraction}__`,
            lat: projection.point.lat,
            lng: projection.point.lng,
            html: trafficDelayBubbleHtml(icon, label, severity),
            anchor: TRAFFIC_DELAY_BUBBLE_ANCHOR,
          });
        }
      }
    }

    if (showPlacesPanel && activePlaceCategoryObj) {
      for (const place of nearbyPlaces) {
        const isSelected = place.id === selectedPlaceId;
        markers.push({
          id: `__place_${place.id}__`,
          lat: place.lat,
          lng: place.lng,
          html: placePinHtml(activePlaceCategoryObj.icon, activePlaceCategoryObj.color, isSelected),
          anchor: isSelected ? PLACE_PIN_SELECTED_ANCHOR : PLACE_PIN_ANCHOR,
          onClick: () => handleSelectNearbyPlace(place),
        });
      }
    }

    return markers;
  }, [
    selectedPin,
    userLocation,
    isNavigating,
    effectiveRoute,
    routePath,
    routeCum,
    displayProgress,
    destinationCoords,
    startCoords,
    showPlacesPanel,
    activePlaceCategoryObj,
    nearbyPlaces,
    selectedPlaceId,
    handleSelectNearbyPlace,
  ]);

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
    <div
      ref={pageContainerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-gray-100"
    >
      <div className="absolute inset-0 z-0">
        {effectiveRoute ? (
          <RouteMapView
            route={effectiveRoute}
            markers={mapMarkers}
            zoom={isNavigating ? 17 : 15}
            progress={isNavigating ? displayProgress : undefined}
            flowing={!isNavigating}
            heading={isNavigating ? displayHeading : manualHeading}
            interactive={!isNavigating}
            followMode={isNavigating}
            secondaryRoutes={isNavigating ? undefined : secondaryRoutes}
            mapTypeId={mapTypeId}
            tilt={mapTilt}
            showTraffic={showTraffic}
            theme={mapTheme}
            onReady={setMapInstance}
            className="w-full h-full"
          />
        ) : (
          <LazyGoogleMap
            center={{ lat: mapCenter[0], lng: mapCenter[1] }}
            zoom={15}
            markers={mapMarkers}
            heading={manualHeading}
            mapTypeId={mapTypeId}
            tilt={mapTilt}
            showTraffic={showTraffic}
            theme={mapTheme}
            onReady={setMapInstance}
          />
        )}
      </div>

      {/* Connectivity status — sits above the map, below any modal sheets;
          shows nothing while online so it never takes up permanent space. */}
      <div className="absolute z-[500] left-1/2 -translate-x-1/2 top-[calc(env(safe-area-inset-top)+12px)] w-[calc(100%-32px)] max-w-sm pointer-events-none">
        <div className="pointer-events-auto">
          <OfflineBanner />
        </div>
      </div>

      {/* Map Controls */}
      {!showPlanModal && !showScanResults && !showSOS && (
        <MapControls
          map={mapInstance}
          mapTypeId={mapTypeId}
          onMapTypeChange={setMapTypeId}
          tilt={mapTilt}
          onToggleTilt={() => setMapTilt((t) => (t > 0 ? 0 : 45))}
          trafficEnabled={showTraffic}
          onToggleTraffic={() => setShowTraffic((t) => !t)}
          mapTheme={mapTheme}
          onToggleTheme={() =>
            setMapTheme((t) => {
              const next = t === "dark" ? "light" : "dark";
              persistMapTheme(next);
              return next;
            })
          }
          heading={isNavigating ? displayHeading : manualHeading}
          onHeadingChange={setManualHeading}
          rotatable={!isNavigating}
          onRecenter={handleRecenter}
          isLocating={isGettingLocation}
          fullscreenTargetRef={pageContainerRef}
          className={`transition-[bottom] ${
            isNavigating
              ? navPanelExpanded
                ? "bottom-[21rem]"
                : "bottom-[13rem]"
              : "bottom-[15rem]"
          }`}
        />
      )}

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

      {/* Collision Guard */}
      {collisionGuardEnabled && isNavigating && (
        <CollisionGuardView
          guard={collisionGuard}
          expanded={collisionGuardExpanded}
          onToggleExpanded={() => setCollisionGuardExpanded((v) => !v)}
          onClose={() => setCollisionGuardEnabled(false)}
        />
      )}

      {/* Traffic recalculation toast */}
      {trafficNotice && isNavigating && (
        <div className="absolute top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-md z-[500] bg-white shadow-lg border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-lg">🚦</span>
          <p className="text-xs font-medium text-gray-800 sm:text-sm">
            {trafficNotice}
          </p>
        </div>
      )}

      {/* Home Header */}
      {!isNavigating && !showScanResults && (
        <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-2 sm:flex sm:justify-center">
          <div className="sm:w-full sm:max-w-md">
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

      {/* Scan Results Header */}
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

      {/* Navigation Top Stack */}
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
                <VoiceGuidanceControl
                  muted={voiceGuidance.muted}
                  toggleMuted={voiceGuidance.toggleMuted}
                  volume={voiceGuidance.volume}
                  setVolume={voiceGuidance.setVolume}
                  languages={voiceGuidance.languages}
                  language={voiceGuidance.language}
                  setLanguage={voiceGuidance.setLanguage}
                  gender={voiceGuidance.gender}
                  setGenderPreference={voiceGuidance.setGenderPreference}
                  hasAfricanVoice={voiceGuidance.hasAfricanVoice}
                />
              )}
              {collisionGuard.isSupported && (
                <button
                  onClick={() => setCollisionGuardEnabled((v) => !v)}
                  aria-label={
                    collisionGuardEnabled
                      ? "Turn off Collision Guard"
                      : "Turn on Collision Guard"
                  }
                  title="Collision Guard — forward-collision warning"
                  className={`flex items-center justify-center flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition ${
                    collisionGuardEnabled
                      ? "bg-white text-emerald-600"
                      : "bg-white/20 text-white"
                  }`}
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
                    <path d="M12 3l8 4v5c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V7l8-4z" />
                    <path d="M9.5 12l1.8 1.8L15 10" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setTopStackExpanded((v) => !v)}
                aria-label={
                  topStackExpanded
                    ? "Collapse trip details"
                    : "Expand trip details"
                }
                className="flex items-center justify-center flex-shrink-0 text-white transition w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 hover:bg-white/30"
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform ${topStackExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>

            {topStackExpanded && !hasArrived && turnByTurn.currentStep && (
              <TurnByTurnCard
                step={turnByTurn.currentStep}
                distanceMeters={turnByTurn.distanceToNextManeuverMeters}
                currentRoadName={turnByTurn.currentRoadName}
                nextRoadName={turnByTurn.nextRoadName}
                nextManeuver={turnByTurn.nextStep}
              />
            )}

            {topStackExpanded && activeTopAlert === "gpswaiting" && (
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

            {topStackExpanded && activeTopAlert === "gpserror" && (
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
                    GPS unavailable
                  </p>
                  <p className="text-xs font-medium truncate text-amber-900 sm:text-sm">
                    {gpsErrorMessage}
                  </p>
                </div>
              </div>
            )}

            {topStackExpanded && activeTopAlert === "wrongway" && (
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
                    <path d="M12 19V5M5 12l7-7 7 7" transform="rotate(180 12 12)" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[10px] text-red-400 font-medium uppercase tracking-wide">
                    Wrong way
                  </p>
                  <p className="text-xs font-medium text-red-900 truncate sm:text-sm">
                    You're heading opposite the route — turn around when safe
                  </p>
                </div>
              </div>
            )}

            {topStackExpanded && activeTopAlert === "offroute" && (
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

            {activeTopAlert === "collision" &&
              collisionGuard.activeWarning &&
              (() => {
                const warning = collisionGuard.activeWarning;
                const isHigh = warning.severity === "high";
                return (
                  <div
                    className={`flex items-center gap-3 px-4 py-3 border shadow-sm rounded-xl animate-in slide-in-from-top-2 ${
                      isHigh
                        ? "bg-red-50 border-red-200"
                        : "bg-amber-50 border-amber-200"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center flex-shrink-0 rounded-lg w-7 h-7 sm:w-8 sm:h-8 ${
                        isHigh ? "bg-red-100" : "bg-amber-100"
                      }`}
                    >
                      <span className="text-sm leading-none sm:text-base">
                        {isHigh ? "🚨" : "⚠️"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[9px] sm:text-[10px] font-medium uppercase tracking-wide ${
                          isHigh ? "text-red-400" : "text-amber-500"
                        }`}
                      >
                        Collision Guard
                      </p>
                      <p
                        className={`text-xs font-medium truncate sm:text-sm ${
                          isHigh ? "text-red-900" : "text-amber-900"
                        }`}
                      >
                        {describeWarning(warning)}
                      </p>
                    </div>
                  </div>
                );
              })()}

            {topStackExpanded &&
              activeTopAlert === "hazard" &&
              upcomingHazard && (
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
                    {upcomingHazard.delayLabel && (
                      <p className="text-[10px] sm:text-[11px] font-medium text-amber-600">
                        {upcomingHazard.delayLabel}
                      </p>
                    )}
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
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-[calc(5.0rem+env(safe-area-inset-bottom))] sm:flex sm:justify-center">
          <div className="sm:w-full sm:max-w-md">
            {navPanelExpanded ? (
              <div className="px-5 pt-3 pb-4 bg-white shadow-lg rounded-2xl">
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
                  <div className="min-w-0 text-center">
                    <p className="text-[11px] sm:text-xs text-gray-400 mb-0.5">
                      ETA
                    </p>
                    <p className="text-lg font-bold text-gray-900 sm:text-xl">
                      {hasArrived ? "0 min" : `${etaMinutes} min`}
                    </p>
                    {!hasArrived && liveArrivalLabel && (
                      <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">
                        Arrive {liveArrivalLabel}
                      </p>
                    )}
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

                {eta.traffic && (
                  <TrafficEtaBadge
                    traffic={eta.traffic}
                    freshnessLabel={eta.freshnessLabel}
                    className="mb-3"
                  />
                )}

                {/* Speed-limit warning — only renders where the route
                    actually carries a posted limit (speedLimitKph);
                    the backend doesn't send one today. */}
                {typeof speedLimitKph === "number" && deviceSpeedKph != null && (
                  <div
                    className={`flex items-center justify-between px-3 py-2 mb-3 rounded-xl text-xs font-semibold ${
                      isOverSpeedLimit
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-gray-50 text-gray-600 border border-gray-200"
                    }`}
                  >
                    <span>
                      {isOverSpeedLimit ? "Over the speed limit" : "Speed"}
                    </span>
                    <span>
                      {Math.round(deviceSpeedKph)} / {Math.round(speedLimitKph)} km/h
                    </span>
                  </div>
                )}

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
                    : `${etaMinutes} min · ${remainingKm.toFixed(1)} km left${
                        liveArrivalLabel ? ` · Arrive ${liveArrivalLabel}` : ""
                      }`}
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

      {/* StreetViewPegman and the "Places" search button both normally
          anchor to the bottom-left corner — the same corner the collision-
          guard camera PiP occupies while it's on. Push them clear of it
          (and hide them outright while the guard is expanded full-screen)
          instead of letting them sit on top of / block the camera feed. */}
      {!showSOS && !showPlanModal && !showScanResults && !(collisionGuardEnabled && isNavigating && collisionGuardExpanded) && (
        <StreetViewPegman
          onClick={() => setStreetViewOpen(true)}
          className={`absolute z-[999] transition-[left,bottom] ${
            collisionGuardEnabled && isNavigating ? "left-[172px] sm:left-[220px]" : "left-4 sm:left-8"
          } ${
            isNavigating
              ? navPanelExpanded
                ? "bottom-56"
                : "bottom-24"
              : "bottom-32"
          }`}
        />
      )}

      {/* Places along the route — floating toggle + results sheet */}
      {!showSOS && !showPlanModal && !showScanResults && effectiveRoute && !(collisionGuardEnabled && isNavigating && collisionGuardExpanded) && (
        <PlacesAlongRouteButton
          active={showPlacesPanel}
          onClick={handleTogglePlacesPanel}
          className={`transition-[left,bottom] ${
            collisionGuardEnabled && isNavigating ? "left-[172px] sm:left-[220px]" : "left-4 sm:left-8"
          } ${
            isNavigating
              ? navPanelExpanded
                ? "bottom-[17.5rem]"
                : "bottom-40"
              : "bottom-48"
          }`}
        />
      )}

      {!showSOS && !showPlanModal && !showScanResults && effectiveRoute && (
        <PlacesAlongRoutePanel
          open={showPlacesPanel}
          onClose={handleTogglePlacesPanel}
          activeCategory={activePlaceCategory}
          onCategoryChange={handlePlaceCategoryChange}
          places={nearbyPlaces}
          isLoading={nearbyPlacesLoading}
          error={nearbyPlacesError}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={handleSelectNearbyPlace}
          className={`transition-[bottom] ${
            isNavigating
              ? navPanelExpanded
                ? "bottom-[21rem]"
                : "bottom-[9.5rem]"
              : "bottom-[17.5rem]"
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
      {/* ═══════════════════════════════════════════════════════
    PLAN ROUTE MODAL
    MOBILE RESPONSIVE VERSION
    ═══════════════════════════════════════════════════════ */}

      {showPlanModal && (
        <div
          className="
      fixed inset-0 z-[60]
      flex items-end sm:items-center sm:justify-center
      bg-black/30
    "
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-route-title"
        >
          {/* Modal Panel */}
          <div
            className="
  relative
  flex
  flex-col
  w-full
  max-h-[100dvh]
  h-[100dvh]
  sm:w-[min(100%-2rem,28rem)]
  sm:h-auto
  sm:max-h-[75vh]
  bg-white
  rounded-t-[24px]
  sm:rounded-3xl
  shadow-2xl
  overflow-hidden
"
          >
            {/* ═══════════════════════════════════════════════
          MOBILE DRAG HANDLE
          ═══════════════════════════════════════════════ */}
            <div className="flex-shrink-0 flex justify-center pt-3 pb-3 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* ═══════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════ */}
            <div className="flex-shrink-0 px-5 pt-4 pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2
                    id="plan-route-title"
                    className="text-xl font-extrabold text-gray-900 sm:text-2xl"
                  >
                    Plan a route
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                    We'll scan reported hazards along the way before you drive.
                  </p>
                </div>

                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  aria-label="Close route planner"
                  className="
              flex
              items-center
              justify-center
              flex-shrink-0
              w-9
              h-9
              text-gray-500
              transition
              bg-gray-100
              rounded-full
              hover:bg-gray-200
              active:bg-gray-300
              touch-manipulation
            "
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5"
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

            {/* ═══════════════════════════════════════════════
          SCROLLABLE FORM AREA
          
          IMPORTANT:
          Only this section scrolls.
          The Scan Route button NEVER scrolls away.
          ═══════════════════════════════════════════════ */}
            <div
              className="
          flex-1
          min-h-0
          overflow-y-auto
          overscroll-contain
          px-5
          py-5
          space-y-6
          [-ms-overflow-style:none]
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
            >
              {/* ═══════════════════════════════════════════════
            POINT A — START
            ═══════════════════════════════════════════════ */}
              <div ref={startFieldContainerRef}>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="
                flex
                items-center
                justify-center
                w-5
                h-5
                border-2
                rounded-full
                border-emerald-500
              "
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>

                  <span className="text-xs font-medium text-gray-900 sm:text-sm">
                    Point A — Start
                  </span>
                </div>

                <div
                  className="
              flex
              items-center
              gap-2
              px-4
              py-3
              bg-gray-50
              rounded-xl
              border
              border-transparent
              focus-within:border-purple-200
              focus-within:bg-white
              transition
            "
                >
                  <AddressAutocompleteInput
                    value={startPoint}
                    onChange={setStartPoint}
                    onSelect={(result) => {
                      setStartCoords({
                        lat: result.lat,
                        lng: result.lng,
                      });
                      savedPlacesRef.current.addRecentSearch(result);
                      setActiveSearchField(null);
                    }}
                    onFocus={() => setActiveSearchField("start")}
                    onPredictionsChange={(count) =>
                      setStartPredictionsOpen(count > 0)
                    }
                    locationBias={
                      userLocation
                        ? { lat: userLocation[0], lng: userLocation[1] }
                        : null
                    }
                    placeholder="Search addresses, businesses, landmarks…"
                    className="flex-1 min-w-0"
                    inputClassName="
                w-full
                min-w-0
                text-base
                text-gray-900
                placeholder-gray-400
                bg-transparent
                outline-none
              "
                  />

                  {/* Use my location */}
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={isGettingLocation}
                    className="
                flex
                items-center
                gap-1.5
                flex-shrink-0
                text-xs
                sm:text-sm
                font-medium
                text-purple-600
                whitespace-nowrap
                hover:text-purple-700
                active:text-purple-800
                disabled:opacity-50
                disabled:cursor-not-allowed
                touch-manipulation
              "
                  >
                    {isGettingLocation ? (
                      <>
                        <SpinnerIcon className="w-3.5 h-3.5" />
                        <span>Locating...</span>
                      </>
                    ) : (
                      "Use my location"
                    )}
                  </button>
                </div>

                {locationError && (
                  <p className="mt-1.5 ml-1 text-[11px] leading-4 text-red-500 sm:text-xs">
                    {locationError}
                  </p>
                )}

                {activeSearchField === "start" && !startPredictionsOpen && (
                  <SearchSuggestionsPanel
                    savedPlaces={savedPlaces}
                    onSelect={handleSelectSuggestion}
                    onUseCurrentLocation={handleUseMyLocation}
                    isLocatingCurrentPosition={isGettingLocation}
                    currentLocationErrorText={locationError}
                  />
                )}
              </div>

              {/* ═══════════════════════════════════════════════
            POINT B — DESTINATION
            ═══════════════════════════════════════════════ */}
              <div ref={destinationFieldContainerRef}>
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 text-red-400"
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

                <div
                  className="
              px-4
              py-3
              bg-gray-50
              rounded-xl
              border
              border-transparent
              focus-within:border-purple-200
              focus-within:bg-white
              transition
            "
                >
                  <AddressAutocompleteInput
                    value={destination}
                    onChange={setDestination}
                    onSelect={(result) => {
                      setDestinationCoords({
                        lat: result.lat,
                        lng: result.lng,
                      });
                      savedPlacesRef.current.addRecentSearch(result);
                      setActiveSearchField(null);
                    }}
                    onFocus={() => setActiveSearchField("destination")}
                    onPredictionsChange={(count) =>
                      setDestinationPredictionsOpen(count > 0)
                    }
                    locationBias={
                      userLocation
                        ? { lat: userLocation[0], lng: userLocation[1] }
                        : null
                    }
                    placeholder="Search addresses, businesses, landmarks…"
                    inputClassName="
                w-full
                text-base
                text-gray-900
                placeholder-gray-400
                bg-transparent
                outline-none
              "
                  />
                </div>

                {destinationLocationError && (
                  <p className="mt-1.5 ml-1 text-[11px] leading-4 text-red-500 sm:text-xs">
                    {destinationLocationError}
                  </p>
                )}

                {activeSearchField === "destination" &&
                  !destinationPredictionsOpen && (
                    <SearchSuggestionsPanel
                      savedPlaces={savedPlaces}
                      onSelect={handleSelectSuggestion}
                      onUseCurrentLocation={handleUseCurrentLocationForDestination}
                      isLocatingCurrentPosition={isLocatingDestination}
                      currentLocationErrorText={destinationLocationError}
                    />
                  )}
              </div>

              {/* ═══════════════════════════════════════════════
            ADDITIONAL STOPS
            ═══════════════════════════════════════════════ */}
              <div>
                <RouteStopsEditor stops={stops} onChange={setStops} />
              </div>

              {/* Extra bottom spacing inside scroll area */}
              <div className="h-4" />
            </div>

            {/* ═══════════════════════════════════════════════
          FIXED SCAN ROUTE FOOTER
          
          THIS IS THE IMPORTANT MOBILE FIX.
          
          This section is NOT inside the scrollable area.
          ═══════════════════════════════════════════════ */}
            <div
              className="
          relative
          z-50
          flex-shrink-0
          w-full
          px-5
          pt-3
          bg-white
          border-t
          border-gray-200
          pb-[calc(90px+env(safe-area-inset-bottom))]  sm:pb-[calc(20px+env(safe-area-inset-bottom))]
        "
            >
              {/* Error */}
              {routeError && (
                <p className="mb-3 text-xs leading-5 text-center text-red-500 sm:text-sm">
                  {routeError}
                </p>
              )}

              {/* Scan Route */}
              <button
                type="button"
                onClick={handleScanRoute}
                disabled={!startPoint || !destination}
                className="
      block
      w-full
      min-h-[56px]
      h-14
      px-4
      bg-purple-700
      hover:bg-purple-800
      active:bg-purple-900
      disabled:bg-gray-300
      disabled:text-gray-500
      disabled:cursor-not-allowed
      text-white
      font-semibold
      text-base
      rounded-2xl
      transition
      active:scale-[0.98]
      flex
      items-center
      justify-center
      touch-manipulation
      select-none
      flex-shrink-0
    "
              >
                Scan route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCAN RESULTS BOTTOM SHEET  (RESPONSIVE FIX APPLIED)
          ═══════════════════════════════════════════════════════ */}
      {showScanResults && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:justify-center sm:items-center bg-white/0 sm:bg-black/30 pointer-events-none">
          <div className="flex-1 sm:flex-none flex flex-col bg-white rounded-t-[24px] sm:rounded-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.15)] sm:shadow-2xl pointer-events-auto overflow-hidden w-full sm:max-w-md max-h-[90vh] sm:max-h-[80vh]">
            <div className="flex justify-center flex-shrink-0 pt-3 pb-2 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pt-4 sm:pt-6 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

                  {stopCoords.length > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 text-[11px] sm:text-xs font-medium text-purple-700 bg-purple-50 rounded-full">
                      {stopCoords.length} stop
                      {stopCoords.length === 1 ? "" : "s"} on this route
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="p-3 text-center bg-gray-50 rounded-2xl">
                      <p className="text-base font-bold text-gray-900 sm:text-lg">
                        {effectiveRoute
                          ? formatEtaDistance(effectiveRoute.distance)
                          : "9.5 km"}
                      </p>
                      <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                        Distance
                      </p>
                    </div>
                    <div className="p-3 text-center bg-gray-50 rounded-2xl">
                      <p className="text-base font-bold text-gray-900 sm:text-lg">
                        {effectiveRoute
                          ? formatEtaDuration(effectiveRoute.duration)
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

                  {plannedArrivalLabel && (
                    <div className="flex items-center justify-center gap-1.5 px-4 py-2.5 mb-4 bg-purple-50 rounded-xl">
                      <svg
                        viewBox="0 0 24 24"
                        className="flex-shrink-0 w-4 h-4 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 3" />
                      </svg>
                      <p className="text-xs font-semibold text-purple-700 sm:text-sm">
                        Arrive by {plannedArrivalLabel}
                      </p>
                    </div>
                  )}

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

                  <div className="mb-4 space-y-3">
                    {((activeRoute?.hazards as any[] | undefined)?.length
                      ? (activeRoute!.hazards as any[])
                      : scanHazards
                    ).map((hazard: any) => {
                      const hazardKey =
                        REPORT_TYPE_TO_HAZARD_KEY[hazard.type] ?? hazard.type;
                      const delayLabel = formatDelayDuration(
                        estimateDelayMinutes(hazardKey, hazard.severity),
                      );
                      return (
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
                            <p className="text-[11px] sm:text-xs text-gray-400 truncate">
                              {typeof hazard.location === "string"
                                ? hazard.location
                                : ""}
                              {delayLabel && (
                                <span className="font-medium text-amber-600">
                                  {typeof hazard.location === "string" &&
                                  hazard.location
                                    ? " · "
                                    : ""}
                                  {delayLabel}
                                </span>
                              )}
                            </p>
                          </div>
                          <span className="flex-shrink-0 px-2 py-1 text-[11px] sm:text-xs font-medium text-gray-500 bg-white rounded-lg">
                            {typeof hazard.distanceKm === "number"
                              ? `${hazard.distanceKm.toFixed(1)} km`
                              : hazard.distance}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="sticky bottom-0 z-10 flex-shrink-0 px-5 pt-3 pb-[calc(6rem+env(safe-area-inset-bottom))] bg-white border-t border-gray-100">
              <button
                onClick={handleStartTrip}
                disabled={planRouteMutation.isPending}
                className="w-full h-14 bg-purple-700 hover:bg-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-base rounded-2xl transition active:scale-[0.98] flex items-center justify-center gap-2 touch-manipulation"
              >
                Start trip
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
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
