import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import LazyGoogleMap from "../components/map/LazyGoogleMap";
import type { MapMarkerSpec } from "../components/map/GoogleMapView";
import StreetViewModal, {
  StreetViewPegman,
} from "../components/map/StreetView";
import {
  reportPinHtml,
  getReportPinAnchor,
  userLocationPinHtml,
  USER_LOCATION_ANCHOR,
} from "../components/map/mapMarkerIcons";
import BottomNav from "../components/BottomNav";
import CreateAccountModal from "../components/CreateAccountModal";
import SignInModal from "../components/SignInModal";
import ForgotPasswordModal from "../components/ForgetPasswordModal";
import OTP from "../components/OTP";
import VerifyResetOtpModal from "../components/VerifyResetOtpModal";
import PersonalInformation from "../components/PersonalInformation";
import CreatePassword from "../components/CreatePassword";
import CreateNewPassword from "../components/Createnewpassword";
import ResetPasswordSuccess from "../components/Resetpasswordsuccess";
import SOSActiveModal from "../components/Sosactivemodal";
import ReportDetailModal from "../components/ReportDetailModal";
import { useHazardFeed, useConfirmHazard } from "../hooks/useHazards";
import { hazardToReport } from "../lib/hazardToReport";
import { getIpLocation } from "../lib/ipLocation";
import { useTriggerSos, useCancelSos } from "../hooks/useSos";
import { ApiError } from "../lib/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import { useGoogleSignIn, prefetchOnboardingStatus } from "../hooks/useAuth";
import { useFleetOwnerGate } from "../hooks/useFleetOwnerGate";
import PlaceCategoryBar from "../components/places/PlaceCategoryBar";
import PlaceResultsList from "../components/places/PlaceResultsList";
import PlaceDetailSheet from "../components/places/PlaceDetailSheet";
import GoogleStyleBottomSheet from "../components/ui/GoogleStyleBottomSheet";
import {
  placePinHtml,
  getPlacePinAnchor,
  dropPinHtml,
  getDropPinAnchor,
} from "../components/map/placeMarkerIcons";
import {
  searchNearbyPlaces,
  fetchPlaceById,
  reverseGeocodeLatLng,
  createManualPin,
} from "../lib/placesSearch";
import { PLACE_CATEGORIES } from "../types/places";
import type { PlaceCategoryKey, PlaceResult } from "../types/places";

const DEFAULT_COORDS: [number, number] = [6.5244, 3.3792];
const FEED_RADIUS_KM = 10;

export default function HomePage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showVerifyResetOtp, setShowVerifyResetOtp] = useState(false);
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showCreateNewPassword, setShowCreateNewPassword] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [resetSessionId, setResetSessionId] = useState("");
  const [profileData, setProfileData] = useState<{
    firstName: string;
    lastName: string;
    gender: "male" | "female" | "others";
    dateOfBirth: string;
    occupation: string;
  } | null>(null);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [streetViewOpen, setStreetViewOpen] = useState(false);

  // "Explore" category bar — tapping Restaurants/Hotels/Gas/etc runs a
  // Places Nearby Search around the map center and drops pins for the
  // results, same interaction as Google Maps' own category chips.
  const [activeCategory, setActiveCategory] = useState<PlaceCategoryKey | null>(
    null,
  );
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);

  // Which category result the map is currently centered/highlighted on.
  // Auto-set to the first result after a category search, and updated
  // whenever a pin is tapped directly on the map.
  const [browsePlaceId, setBrowsePlaceId] = useState<string | null>(null);

  // Manual pin-drop — tapping anywhere on the map (not just the Explore
  // category results) resolves to either a real Google place (tapped
  // directly on a POI icon) or an address-only dropped pin, and shows the
  // same detail sheet as a category search result would.
  const [pinnedPlace, setPinnedPlace] = useState<PlaceResult | null>(null);
  const [isResolvingPin, setIsResolvingPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Which location Street View should open on — the map's current pegman
  // button opens it centered on the map, while the "Street View" action
  // inside a place/pin's detail sheet should open it on THAT place instead.
  const [streetViewTarget, setStreetViewTarget] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);

  const [sosActive, setSosActive] = useState(false);
  const [sosProgress, setSosProgress] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const [sosError, setSosError] = useState<string | null>(null);
  const [activeSosId, setActiveSosId] = useState<string | null>(null);
  const [googleSignInError, setGoogleSignInError] = useState<string | null>(
    null,
  );
  const sosTimerRef = useRef<ReturnType<typeof window.setInterval> | null>(
    null,
  );
  const sosStartTimeRef = useRef<number>(0);
  const sosCompletedRef = useRef<boolean>(false);

  const triggerSosMutation = useTriggerSos();
  const cancelSosMutation = useCancelSos();

  const queryClient = useQueryClient();
  const googleSignInMutation = useGoogleSignIn();

  const isAuthenticated =
    typeof window !== "undefined" && !!localStorage.getItem("token");

  // Fleet owners don't get the guest-browsing experience — force the
  // sign-in modal open (and keep it open) until they've authenticated.
  const mustAuthenticateAsFleetOwner = useFleetOwnerGate();

  useEffect(() => {
    if (mustAuthenticateAsFleetOwner) {
      setShowCreateAccount(false);
      setShowSignIn(true);
    }
  }, [mustAuthenticateAsFleetOwner]);

  const feedParams = mapReady
    ? {
        latitude: (userLocation ?? DEFAULT_COORDS)[0],
        longitude: (userLocation ?? DEFAULT_COORDS)[1],
        radius: FEED_RADIUS_KM,
      }
    : null;

  const { data: hazards = [] } = useHazardFeed(feedParams);
  const confirmMutation = useConfirmHazard();

  const reports = useMemo(
    () => hazards.map((h) => hazardToReport(h, userLocation)),
    [hazards, userLocation],
  );

  // selectedId intentionally excluded — the report sheet sits above the
  // bottom nav, it doesn't hide it. Only these full-screen flows hide it.
  const isAnyModalOpen =
    showCreateAccount ||
    showSignIn ||
    showForgotPassword ||
    showOTP ||
    showVerifyResetOtp ||
    showPersonalInfo ||
    showCreatePassword ||
    showCreateNewPassword ||
    showResetSuccess ||
    sosActive;

  const selected = useMemo(
    () => reports.find((r) => r.id === selectedId) || null,
    [reports, selectedId],
  );

  // A manually dropped/tapped pin takes priority over an Explore-bar
  // category selection — they're mutually exclusive in the UI (see the
  // various setPinnedPlace(null) calls below whenever a category result
  // or hazard report is selected instead).
  const selectedCategoryPlace = useMemo(
    () => placeResults.find((p) => p.id === selectedPlaceId) || null,
    [placeResults, selectedPlaceId],
  );
  const selectedPlace = pinnedPlace ?? selectedCategoryPlace;

  // Closes whichever place sheet is open, regardless of whether it came
  // from a category search result or a manual map tap.
  const closePlaceSheet = useCallback(() => {
    setPinnedPlace(null);
    setSelectedPlaceId(null);
  }, []);

  // Whole-category results list — the scrollable "Restaurants nearby" /
  // "Homes nearby" / etc. list Google Maps shows before you drill into any
  // one result. Shown whenever a category search has results and nothing
  // more specific (a single place, or a hazard report) is already open;
  // closing it clears the whole category, same as tapping its chip again.
  const showResultsList = Boolean(
    activeCategory && placeResults.length > 0 && !selected && !selectedPlace,
  );
  const closeResultsList = useCallback(() => {
    setActiveCategory(null);
  }, []);

  // Tapping an already-active category clears it (same toggle behavior as
  // Google Maps' chips); switching categories drops any place selection.
  const handleSelectCategory = useCallback((key: PlaceCategoryKey) => {
    setActiveCategory((prev) => (prev === key ? null : key));
    setSelectedPlaceId(null);
    setBrowsePlaceId(null);
    setPinnedPlace(null);
  }, []);

  // Fires on every map tap. If the tap landed on one of Google's own POI
  // icons, `placeId` is set — fetch that place's full details straight
  // away. Otherwise reverse-geocode the tapped point into an address and
  // show it as a dropped pin, same as long-pressing empty ground in
  // Google Maps itself.
  const handleMapClick = useCallback(
    async (lat: number, lng: number, placeId?: string) => {
      setSelectedId(null);
      setSelectedPlaceId(null);
      setPinError(null);
      setIsResolvingPin(true);

      try {
        if (placeId) {
          const place = await fetchPlaceById(placeId);
          if (place) {
            setPinnedPlace(place);
            return;
          }
        }

        const address = await reverseGeocodeLatLng(lat, lng);
        setPinnedPlace(createManualPin(lat, lng, address));
      } catch (err) {
        console.error("[places] failed to resolve map tap", err);
        setPinError("Could not load details for this location");
        setPinnedPlace(createManualPin(lat, lng, null));
      } finally {
        setIsResolvingPin(false);
      }
    },
    [],
  );

  // Locates the user with a real GPS fix first (enableHighAccuracy is what
  // actually turns on GPS on a phone, not just wifi/cell triangulation),
  // and only falls back to a coarse network-based lookup if that times out
  // or fails outright.
  //
  // This used to be the other way around — a fast, low-accuracy lookup
  // first, falling back to GPS only on error. The problem: that first
  // low-accuracy call almost always "succeeds" (wifi/cell positioning
  // resolves in ~1s), just with a fix that can be off by a whole city —
  // and since it counted as success, locateUser stopped right there and
  // never tried GPS at all. That's what looked like "always getting a
  // fallback location" even though geolocation was technically working.
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by your browser");
      setMapReady(true);
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    const onSuccess = (position: GeolocationPosition) => {
      setUserLocation([position.coords.latitude, position.coords.longitude]);
      setLocationError(null);
      setMapReady(true);
      setIsLocating(false);
    };

    const onFinalError = async (error: GeolocationPositionError) => {
      setLocationError(
        error.code === 1
          ? "Location access denied. Please enable location permissions."
          : error.code === 2
            ? "Location unavailable."
            : "Location request timed out.",
      );
      // Real GPS failed (denied/unavailable/timed out) — approximate from
      // the network/IP address instead of jumping straight to a fixed
      // fallback point, so the map still lands somewhere near the user.
      const ipLocation = await getIpLocation();
      setUserLocation(
        (prev) =>
          prev ??
          (ipLocation
            ? [ipLocation.latitude, ipLocation.longitude]
            : DEFAULT_COORDS),
      );
      setMapReady(true);
      setIsLocating(false);
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      () => {
        // Real GPS fix failed/timed out — fall back to a quick
        // network-based lookup rather than giving up entirely.
        navigator.geolocation.getCurrentPosition(onSuccess, onFinalError, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 30000,
        });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }, []);

  useEffect(() => {
    locateUser();
  }, [locateUser]);

  // Runs a Nearby Search for the active category around the current map
  // center. Intentionally only re-runs on category change (and once the
  // map/location is ready) rather than on every pan — re-querying on
  // every map move would burn a Places API call per pixel of drag.
  useEffect(() => {
    if (!activeCategory || !mapReady) {
      setPlaceResults([]);
      setPlacesError(null);
      setBrowsePlaceId(null);
      return;
    }

    const categoryMeta = PLACE_CATEGORIES.find((c) => c.key === activeCategory);
    if (!categoryMeta) return;

    let cancelled = false;
    setIsSearchingPlaces(true);
    setPlacesError(null);

    const center = userLocation ?? DEFAULT_COORDS;

    searchNearbyPlaces(categoryMeta, { lat: center[0], lng: center[1] })
      .then((results) => {
        if (cancelled) return;
        setPlaceResults(results);
        // Auto-highlight the first result so the carousel and map aren't
        // just sitting there with nothing focused — same as how Google
        // Maps' own results strip opens already scrolled to the top card.
        setBrowsePlaceId(results[0]?.id ?? null);
        if (results.length === 0) {
          setPlacesError(`No ${categoryMeta.label.toLowerCase()} found nearby`);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[places] nearby search failed", err);
        setPlaceResults([]);
        setPlacesError(
          err instanceof Error ? err.message : "Could not load nearby places",
        );
      })
      .finally(() => {
        if (!cancelled) setIsSearchingPlaces(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, mapReady]);

  useEffect(() => {
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (sosTimerRef.current) {
        window.clearInterval(sosTimerRef.current);
        sosTimerRef.current = null;
      }
    };
  }, []);

  const startSosPress = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();

      sosCompletedRef.current = false;
      setIsPressing(true);
      sosStartTimeRef.current = Date.now();
      setSosProgress(0);

      if (sosTimerRef.current) {
        window.clearInterval(sosTimerRef.current);
        sosTimerRef.current = null;
      }

      sosTimerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - sosStartTimeRef.current;
        const progress = Math.min(elapsed / 3000, 1);
        setSosProgress(progress);

        if (elapsed >= 3000) {
          if (sosTimerRef.current) {
            window.clearInterval(sosTimerRef.current);
            sosTimerRef.current = null;
          }

          // CRITICAL FIX 1: mark completed FIRST so endSosPress never fires
          sosCompletedRef.current = true;
          setIsPressing(false);
          setSosProgress(0);

          // CRITICAL FIX 2: if not logged in, open auth modal directly — don't hit the API
          if (!isAuthenticated) {
            setShowCreateAccount(true);
            return;
          }

          setSosError(null);
          setSosActive(true);

          const [lat, lng] = userLocation ?? DEFAULT_COORDS;
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
                const message =
                  err instanceof Error
                    ? err.message
                    : "Failed to send SOS alert";
                setSosError(message);
              },
            },
          );
        }
      }, 16);
    },
    [userLocation, triggerSosMutation, isAuthenticated],
  );

  const endSosPress = useCallback(
    (e?: React.MouseEvent | React.TouchEvent) => {
      e?.stopPropagation?.();

      setIsPressing(false);
      if (sosTimerRef.current) {
        window.clearInterval(sosTimerRef.current);
        sosTimerRef.current = null;
      }

      if (!sosCompletedRef.current) {
        setSosProgress(0);
        if (!isAuthenticated) {
          setShowCreateAccount(true);
        }
      }
    },
    [isAuthenticated],
  );

  const handleCancelSOS = () => {
    if (activeSosId) {
      cancelSosMutation.mutate(activeSosId, {
        onSettled: () => setActiveSosId(null),
      });
    }
    setSosActive(false);
    setSosError(null);
    sosCompletedRef.current = false;
  };

  const handleCallEmergency = () => {
    window.location.href = "tel:112";
  };

  const handleSendCode = (fullPhone: string) => {
    console.log("OTP send triggered for:", fullPhone);
  };

  const handleSendCodeSuccess = (fullPhone: string) => {
    setPhoneNumber(fullPhone);
    setShowCreateAccount(false);
    setShowOTP(true);
  };

  const handleOtpVerifySuccess = (data: { token: string; user: any }) => {
    console.log("OTP verified, token/user received:", data);
    setShowOTP(false);
    setShowPersonalInfo(true);
  };

  const handleResendOTP = () => {
    console.log("Resending code to:", phoneNumber);
  };

  const handlePersonalInfoContinue = (data: {
    firstName: string;
    lastName: string;
    gender: "male" | "female" | "others";
    dateOfBirth: string;
    occupation: string;
  }) => {
    console.log("Profile data:", data);
    setProfileData(data);
    setShowPersonalInfo(false);
    setShowCreatePassword(true);
  };

  const handleCreatePasswordComplete = (password: string) => {
    console.log("Password created:", password);
    console.log("Full signup data:", {
      phone: phoneNumber,
      ...profileData,
      password,
    });
    setShowCreatePassword(false);
    setShowSignIn(true);
  };

  const handleForgotPasswordSendCode = (fullPhone: string) => {
    console.log("Sending reset code to:", fullPhone);
  };

  const handleForgotPasswordSendCodeSuccess = (
    fullPhone: string,
    sessionId: string,
  ) => {
    console.log("Forgot password code sent to:", fullPhone);
    setPhoneNumber(fullPhone);
    setResetSessionId(sessionId);
    setShowForgotPassword(false);
    setTimeout(() => setShowVerifyResetOtp(true), 50);
  };

  const handleResetOtpVerifySuccess = () => {
    setShowVerifyResetOtp(false);
    setShowCreateNewPassword(true);
  };

  const handleCreateNewPasswordComplete = () => {
    setShowCreateNewPassword(false);
    setShowResetSuccess(true);
  };

  const handleResetSuccessSignIn = () => {
    setShowResetSuccess(false);
    setShowSignIn(true);
  };

  const handleSwitchToSignIn = () => {
    setShowCreateAccount(false);
    setShowForgotPassword(false);
    setShowSignIn(true);
  };

  const handleSwitchToSignUp = () => {
    setShowSignIn(false);
    setShowForgotPassword(false);
    setShowCreateAccount(true);
  };

  const handleSwitchToForgotPassword = () => {
    setShowSignIn(false);
    setShowForgotPassword(true);
  };

  const handleSignInSuccess = (user: any) => {
    console.log("Signed in user:", user);
    setShowSignIn(false);
  };

  // Common tail end once Google tokens are saved (called after either the
  // sign-in modal's popup flow, or the create-account modal's own internal
  // <GoogleLogin> success) — closes whichever modal is open and routes the
  // user based on whether they still need to finish onboarding.
  const handleGoogleAuthComplete = async (data: any) => {
    console.log("Google sign-in success:", data);
    setShowCreateAccount(false);
    setShowSignIn(false);

    try {
      const status = await prefetchOnboardingStatus(queryClient);
      if (!status.hasCompletedOnboarding) {
        setShowPersonalInfo(true);
      }
    } catch (err) {
      console.error(
        "Failed to fetch onboarding status after Google sign-in:",
        err,
      );
    }
  };

  // Used by the sign-in modal's "Continue with Google" button. The button
  // itself is a real Google-rendered iframe (see SignInModal), so this just
  // receives the credential response directly — no One Tap / prompt() flow
  // involved, which is what was causing the "tap_outside" errors.
  const handleGoogleSignIn = async (credentialResponse: any) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      setGoogleSignInError("Unable to retrieve Google credentials.");
      return;
    }

    setGoogleSignInError(null);
    try {
      const data = await googleSignInMutation.mutateAsync({
        idToken,
        role: "driver",
      });
      await handleGoogleAuthComplete(data);
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setGoogleSignInError(
        err instanceof Error ? err.message : "Google sign-in failed",
      );
    }
  };

  const handleGoogleSignInError = () => {
    setGoogleSignInError("Google sign-in failed. Please try again.");
  };

  const handleConfirm = async (hazardId: string) => {
    if (!isAuthenticated) {
      setShowCreateAccount(true);
      return;
    }
    try {
      await confirmMutation.mutateAsync({ hazardId, type: "CONFIRM" });
    } catch (err) {
      console.error("Failed to confirm hazard", err);
    }
  };

  const handleIncorrect = async (hazardId: string) => {
    if (!isAuthenticated) {
      setShowCreateAccount(true);
      return;
    }
    try {
      await confirmMutation.mutateAsync({ hazardId, type: "INCORRECT" });
    } catch (err) {
      console.error("Failed to mark hazard incorrect", err);
    }
  };

  // Whichever result is currently highlighted in the carousel/on the map
  // (see browsePlaceId above).
  const browsedPlace = useMemo(
    () => placeResults.find((p) => p.id === browsePlaceId) ?? null,
    [placeResults, browsePlaceId],
  );

  // The map follows the highlighted carousel card — GoogleMapView already
  // eases every center change with map.panTo, so this alone gives the
  // "gently glide to the result you scrolled to" behavior, no extra pan
  // logic needed here. Falls back to the user's own location when nothing
  // is being browsed.
  const mapCenter = useMemo<[number, number]>(
    () => (browsedPlace ? [browsedPlace.lat, browsedPlace.lng] : userLocation || DEFAULT_COORDS),
    [browsedPlace, userLocation],
  );

  const activeCategoryMeta = useMemo(
    () => PLACE_CATEGORIES.find((c) => c.key === activeCategory) ?? null,
    [activeCategory],
  );

  const mapMarkers = useMemo<MapMarkerSpec[]>(() => {
    const markers: MapMarkerSpec[] = reports.map((r) => {
      const isSelected = r.id === selectedId;
      return {
        id: r.id,
        lat: r.lat,
        lng: r.lng,
        html: reportPinHtml(r.color, isSelected, r.type),
        anchor: getReportPinAnchor(isSelected),
        onClick: () => {
          setSelectedPlaceId(null);
          setPinnedPlace(null);
          setSelectedId(isSelected ? null : r.id);
        },
      };
    });

    if (activeCategoryMeta) {
      placeResults.forEach((p) => {
        // Enlarged/highlighted either because its full sheet is open, or
        // it's just the currently-browsed carousel card.
        const isSelected = p.id === selectedPlaceId || p.id === browsePlaceId;
        markers.push({
          id: `place-${p.id}`,
          lat: p.lat,
          lng: p.lng,
          html: placePinHtml(p.category!, activeCategoryMeta.color, isSelected),
          anchor: getPlacePinAnchor(isSelected),
          onClick: () => {
            setSelectedId(null);
            setPinnedPlace(null);
            setBrowsePlaceId(p.id);
            setSelectedPlaceId((prev) => (prev === p.id ? null : p.id));
          },
        });
      });
    }

    // Manually-tapped pin (real POI clicked on the map, or a dropped pin
    // on empty ground) — always rendered selected/highlighted since it's
    // the thing the detail sheet below is currently showing.
    if (pinnedPlace) {
      markers.push({
        id: `pin-${pinnedPlace.id}`,
        lat: pinnedPlace.lat,
        lng: pinnedPlace.lng,
        html: dropPinHtml(true),
        anchor: getDropPinAnchor(true),
      });
    }

    if (userLocation) {
      markers.push({
        id: "__user_location__",
        lat: userLocation[0],
        lng: userLocation[1],
        html: userLocationPinHtml,
        anchor: USER_LOCATION_ANCHOR,
      });
    }

    return markers;
  }, [
    reports,
    selectedId,
    userLocation,
    activeCategoryMeta,
    placeResults,
    selectedPlaceId,
    browsePlaceId,
    pinnedPlace,
  ]);

  if (!mapReady) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-gray-100">
        <div className="w-10 h-10 mb-4 border-4 border-red-500 rounded-full border-t-transparent animate-spin" />
        <p className="text-[13px] font-medium text-gray-600">
          {locationError
            ? "Using default location..."
            : "Getting your location..."}
        </p>
        {locationError && (
          <p className="px-8 mt-2 text-[12px] text-center text-red-500 max-w-xs">
            {locationError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden bg-gray-100"
      style={{ overscrollBehavior: "none" }}
    >
      {/* Google Map — fills full viewport on every screen size. */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <LazyGoogleMap
          center={{ lat: mapCenter[0], lng: mapCenter[1] }}
          zoom={15}
          markers={mapMarkers}
          onMapClick={handleMapClick}
        />
      </div>

      {/* Explore category bar — Restaurants/Hotels/Gas/etc, same row
          Google Maps shows under its search bar. Dropped below the
          location-error toast when that's showing so they never overlap. */}
      <div
        className="absolute z-[480] left-0 right-0 lg:left-6 lg:right-auto lg:w-[420px] px-4"
        style={{ top: locationError ? "104px" : "16px" }}
      >
        <PlaceCategoryBar
          activeCategory={activeCategory}
          onSelect={handleSelectCategory}
          isLoading={isSearchingPlaces}
        />
        {placesError && (
          <div className="px-3.5 py-2 mt-1 text-[12px] font-medium text-gray-600 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.15)] rounded-xl inline-block">
            {placesError}
          </div>
        )}
      </div>

      {/* Location error toast — includes a retry button so users aren't
          stuck on DEFAULT_COORDS with no way to re-trigger the lookup. */}
      {locationError && (
        <div className="absolute z-[500] flex items-start gap-3 px-4 py-3 border border-yellow-200 top-4 left-4 right-4 sm:right-auto sm:w-80 lg:top-6 lg:left-6 bg-yellow-50 rounded-xl">
          <div className="text-yellow-600 mt-0.5 text-sm">⚠️</div>
          <div className="flex-1">
            <p className="text-[12px] font-medium text-yellow-800">
              {locationError}
            </p>
            <p className="mt-1 text-[11px] text-yellow-600">
              Showing default area
            </p>
            <button
              onClick={locateUser}
              disabled={isLocating}
              className="mt-2 text-[11px] font-semibold text-yellow-800 underline disabled:opacity-50"
            >
              {isLocating ? "Locating..." : "Retry location"}
            </button>
          </div>
        </div>
      )}

      {/* Resolving a tapped pin (reverse-geocoding / fetching place
          details) — small non-blocking toast, same treatment as the
          Explore bar's placesError toast below it. */}
      {(isResolvingPin || pinError) && (
        <div
          className="absolute z-[480] left-4 right-4 sm:left-auto sm:right-4 sm:w-72 lg:right-6 px-3.5 py-2 text-[12px] font-medium bg-white shadow-[0_1px_4px_rgba(0,0,0,0.15)] rounded-xl"
          style={{ top: locationError ? "104px" : "16px" }}
        >
          {isResolvingPin ? (
            <span className="text-gray-600">Loading location…</span>
          ) : (
            <span className="text-gray-600">{pinError}</span>
          )}
        </div>
      )}

      {/* Street View pegman — opens Google's own panorama at the current
          map center. Sits on the opposite side from SOS, above the bottom
          nav, so it never overlaps either. Hidden while any full-screen
          modal is open (see isAnyModalOpen) — same rule BottomNav already
          follows below — since at z-[500] it would otherwise render ON
          TOP of every auth modal (all z-[60]-z-[100]) and swallow taps. */}
      {!isAnyModalOpen && (
        <StreetViewPegman
          onClick={() => {
            setStreetViewTarget({
              lat: mapCenter[0],
              lng: mapCenter[1],
              label: userLocation ? "Current location" : "This area",
            });
            setStreetViewOpen(true);
          }}
          className="absolute z-[500] left-4 bottom-24 lg:left-6 lg:bottom-8"
        />
      )}

      {/* SOS floating button. Hidden while any full-screen modal is open:
          at z-[999] it sits above every auth modal (CreateAccountModal is
          z-[100], SignInModal z-[70], the rest z-[60]), so without this
          guard a tap meant for the modal actually lands on this button —
          releasing it fires endSosPress, which reopens CreateAccountModal
          when the user isn't signed in. Also hidden while browsing a
          place/report/results sheet — it shouldn't be visible or
          reachable while looking at a restaurant, park, etc. */}
      {!isAnyModalOpen && !selected && !selectedPlace && !showResultsList && (
        <button
          onMouseDown={startSosPress}
          onMouseUp={endSosPress}
          onMouseLeave={endSosPress}
          onTouchStart={startSosPress}
          onTouchEnd={endSosPress}
          onContextMenu={(e) => e.preventDefault()}
          className="absolute z-[999] flex flex-col items-center justify-center w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 text-white transition-all duration-200 rounded-full shadow-[0_4px_20px_rgba(255,68,68,0.4)] right-4 lg:right-10 lg:!bottom-10 bg-[#ff4444] overflow-hidden select-none"
          style={{
            bottom: "7rem",
            touchAction: "none",
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
        >
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
            style={{
              opacity: sosProgress > 0 ? 1 : 0,
              transition: "opacity 0.15s",
            }}
          >
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 36}
              strokeDashoffset={2 * Math.PI * 36 * (1 - sosProgress)}
              style={{ transition: "stroke-dashoffset 0.05s linear" }}
            />
          </svg>

          {isPressing && (
            <>
              <span className="absolute inset-[-4px] rounded-full border-2 border-white/30 animate-ping" />
              <span className="absolute inset-[-4px] rounded-full border-2 border-white/30" />
            </>
          )}

          <span className="text-[13px] font-bold relative z-10 pointer-events-none">
            SOS
          </span>
          <span className="text-[9px] opacity-90 relative z-10 pointer-events-none">
            {isPressing ? "Hold..." : "Hold 3s"}
          </span>
        </button>
      )}

      {/* DETAIL SHEET — hazard report OR selected place, mutually
          exclusive. Sits ABOVE the bottom nav on mobile, floating
          right-side panel on desktop. GoogleStyleBottomSheet owns the
          actual card chrome (rounded corners/shadow/handle) plus the
          peek-to-full drag behavior on mobile. The SOS button is hidden
          entirely while any of these are open (see its own render guard
          below), so it never overlaps this sheet's content. */}
      <AnimatePresence>
        {(selected || selectedPlace || showResultsList) && (
          <motion.div
            key={
              selected
                ? `report-${selected.id}`
                : selectedPlace
                  ? `place-${selectedPlace.id}`
                  : `results-${activeCategory}`
            }
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute z-[400] bottom-16 left-0 right-0
                       lg:bottom-auto lg:left-auto lg:top-6 lg:right-6 lg:w-96"
          >
            <GoogleStyleBottomSheet
              resetKey={
                selected
                  ? `report-${selected.id}`
                  : selectedPlace
                    ? `place-${selectedPlace.id}`
                    : `results-${activeCategory}`
              }
              onClose={
                selected
                  ? () => setSelectedId(null)
                  : selectedPlace
                    ? closePlaceSheet
                    : closeResultsList
              }
              startExpanded={showResultsList || Boolean(selectedPlace)}
            >
              {selected ? (
                <ReportDetailModal
                  report={selected}
                  onClose={() => setSelectedId(null)}
                  isAuthenticated={isAuthenticated}
                  onAuthRequired={() => setShowCreateAccount(true)}
                  onConfirm={() => handleConfirm(selected.id)}
                  onIncorrect={() => handleIncorrect(selected.id)}
                  isVoting={confirmMutation.isPending}
                />
              ) : selectedPlace ? (
                <PlaceDetailSheet
                  place={selectedPlace}
                  onClose={closePlaceSheet}
                  onOpenStreetView={() => {
                    setStreetViewTarget({
                      lat: selectedPlace.lat,
                      lng: selectedPlace.lng,
                      label: selectedPlace.name,
                    });
                    setStreetViewOpen(true);
                  }}
                  onGetDirections={() => {
                    // Route inside the app's own map/turn-by-turn flow
                    // instead of handing the trip off to Google Maps.
                    navigate("/plan-route", {
                      state: {
                        destinationCoords: {
                          lat: selectedPlace.lat,
                          lng: selectedPlace.lng,
                        },
                        destinationLabel:
                          selectedPlace.name || selectedPlace.address,
                      },
                    });
                  }}
                />
              ) : showResultsList ? (
                <PlaceResultsList
                  places={placeResults}
                  categoryLabel={activeCategoryMeta?.label ?? "Places"}
                  activePlaceId={browsePlaceId}
                  onActiveChange={setBrowsePlaceId}
                  onSelect={(place) => {
                    setBrowsePlaceId(place.id);
                    setSelectedPlaceId(place.id);
                  }}
                  userLocation={userLocation}
                  onClose={closeResultsList}
                />
              ) : null}
            </GoogleStyleBottomSheet>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modals */}
      <AnimatePresence>
        {showCreateAccount && (
          <CreateAccountModal
            onClose={
              mustAuthenticateAsFleetOwner
                ? () => {}
                : () => setShowCreateAccount(false)
            }
            onSendCode={handleSendCode}
            onSendCodeSuccess={handleSendCodeSuccess}
            onGoogleSuccess={handleGoogleAuthComplete}
            onSignIn={handleSwitchToSignIn}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSignIn && (
          <SignInModal
            onClose={
              mustAuthenticateAsFleetOwner
                ? () => {}
                : () => setShowSignIn(false)
            }
            onSignInSuccess={handleSignInSuccess}
            onGoogleCredential={handleGoogleSignIn}
            onGoogleError={handleGoogleSignInError}
            isGoogleLoading={googleSignInMutation.isPending}
            googleError={googleSignInError}
            onForgotPassword={handleSwitchToForgotPassword}
            onSignUp={handleSwitchToSignUp}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForgotPassword && (
          <ForgotPasswordModal
            onClose={() => setShowForgotPassword(false)}
            onBack={handleSwitchToSignIn}
            onSendCode={handleForgotPasswordSendCode}
            onSendCodeSuccess={handleForgotPasswordSendCodeSuccess}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOTP && (
          <OTP
            phoneNumber={phoneNumber}
            onBack={() => {
              setShowOTP(false);
              setShowCreateAccount(true);
            }}
            onVerifySuccess={handleOtpVerifySuccess}
            onResend={handleResendOTP}
            onEditPhone={() => {
              setShowOTP(false);
              setShowCreateAccount(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVerifyResetOtp && phoneNumber && (
          <VerifyResetOtpModal
            phoneNumber={phoneNumber}
            sessionId={resetSessionId}
            onClose={() => {
              setShowVerifyResetOtp(false);
              setShowForgotPassword(true);
            }}
            onBack={() => {
              setShowVerifyResetOtp(false);
              setShowForgotPassword(true);
            }}
            onVerifySuccess={handleResetOtpVerifySuccess}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPersonalInfo && (
          <PersonalInformation
            onBack={() => {
              setShowPersonalInfo(false);
              setShowOTP(true);
            }}
            onContinue={handlePersonalInfoContinue}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreatePassword && (
          <CreatePassword
            onBack={() => {
              setShowCreatePassword(false);
              setShowPersonalInfo(true);
            }}
            onComplete={handleCreatePasswordComplete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateNewPassword && (
          <CreateNewPassword onComplete={handleCreateNewPasswordComplete} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResetSuccess && (
          <ResetPasswordSuccess onSignIn={handleResetSuccessSignIn} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sosActive && (
          <SOSActiveModal
            onCancel={handleCancelSOS}
            onCall={handleCallEmergency}
            errorMessage={sosError}
          />
        )}
      </AnimatePresence>

      <StreetViewModal
        isOpen={streetViewOpen}
        onClose={() => setStreetViewOpen(false)}
        lat={streetViewTarget?.lat ?? mapCenter[0]}
        lng={streetViewTarget?.lng ?? mapCenter[1]}
        label={
          streetViewTarget?.label ??
          (userLocation ? "Current location" : "This area")
        }
      />

      {/* BottomNav — always visible except during full-screen auth/SOS flows.
          z-[600] keeps it above the report sheet (z-[400]). */}
      {!isAnyModalOpen && (
        <div className="absolute bottom-0 left-0 right-0 z-[600] lg:flex lg:justify-center lg:pb-4">
          <div className="lg:max-w-md lg:w-full lg:rounded-2xl lg:overflow-hidden lg:shadow-lg">
            <BottomNav />
          </div>
        </div>
      )}
    </div>
  );
}
