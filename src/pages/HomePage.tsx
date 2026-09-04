import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useLayoutEffect,
} from "react";
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
import { useTriggerSos, useCancelSos } from "../hooks/useSos";
import { ApiError } from "../lib/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import { useGoogleSignIn, prefetchOnboardingStatus } from "../hooks/useAuth";
import { getGoogleIdToken } from "../lib/googleIdentity";
import { useFleetOwnerGate } from "../hooks/useFleetOwnerGate";

const DEFAULT_COORDS: [number, number] = [6.5244, 3.3792];
const FEED_RADIUS_KM = 10;

export default function HomePage() {
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

  // Measures the report sheet's real rendered height so the SOS button can
  // sit exactly above it — never overlapping its clickable content.
  const reportSheetRef = useRef<HTMLDivElement | null>(null);
  const [sosBottomOffset, setSosBottomOffset] = useState<number | null>(null);

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

  // Locates the user with a fast low-accuracy lookup first (resolves in
  // ~1-2s via wifi/IP on most devices), then falls back to a slower
  // high-accuracy GPS lookup with a longer timeout if that fails.
  // This avoids the common desktop/browser timeout when forcing
  // enableHighAccuracy immediately with only a 10s window.
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

    const onFinalError = (error: GeolocationPositionError) => {
      setLocationError(
        error.code === 1
          ? "Location access denied. Please enable location permissions."
          : error.code === 2
            ? "Location unavailable."
            : "Location request timed out.",
      );
      setUserLocation((prev) => prev ?? DEFAULT_COORDS);
      setMapReady(true);
      setIsLocating(false);
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
    locateUser();
  }, [locateUser]);

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

  // Recalculate SOS button offset whenever the report sheet mounts, resizes,
  // or its content changes (e.g. photo count). Prevents any overlap between
  // the SOS hit area and the modal's buttons/photos.
  useLayoutEffect(() => {
    if (!selected) {
      setSosBottomOffset(null);
      return;
    }

    const node = reportSheetRef.current;
    if (!node) return;

    const updateOffset = () => {
      const height = node.getBoundingClientRect().height;
      setSosBottomOffset(height + 16); // 16px gap above the sheet
    };

    updateOffset();

    const observer = new ResizeObserver(updateOffset);
    observer.observe(node);
    return () => observer.disconnect();
  }, [selected]);

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

  // Used by the sign-in modal's "Continue with Google" button. Grabs a real
  // idToken from Google, exchanges it for our own tokens via POST
  // /auth/google, then hands off to handleGoogleAuthComplete.
  const handleGoogleSignIn = async () => {
    setGoogleSignInError(null);
    try {
      const idToken = await getGoogleIdToken();
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

  const mapCenter = useMemo<[number, number]>(
    () => userLocation || DEFAULT_COORDS,
    [userLocation],
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
        onClick: () => setSelectedId(isSelected ? null : r.id),
      };
    });

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
  }, [reports, selectedId, userLocation]);

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
        />
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

      {/* Street View pegman — opens Google's own panorama at the current
          map center. Sits on the opposite side from SOS, above the bottom
          nav, so it never overlaps either. */}
      <StreetViewPegman
        onClick={() => setStreetViewOpen(true)}
        className="absolute z-[500] bottom-24 left-4 lg:left-6 lg:bottom-8"
      />

      {/* SOS floating button — dynamically offset above the report sheet's
          REAL measured height, so it can never overlap the sheet's buttons
          or photos (that overlap was silently firing endSosPress → opening
          CreateAccountModal on a stray tap). */}
      <button
        onMouseDown={startSosPress}
        onMouseUp={endSosPress}
        onMouseLeave={endSosPress}
        onTouchStart={startSosPress}
        onTouchEnd={endSosPress}
        onContextMenu={(e) => e.preventDefault()}
        className="absolute z-[999] flex flex-col items-center justify-center w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 text-white transition-all duration-200 rounded-full shadow-[0_4px_20px_rgba(255,68,68,0.4)] right-4 lg:right-10 lg:!bottom-10 bg-[#ff4444] overflow-hidden select-none"
        style={{
          bottom:
            selected && sosBottomOffset !== null
              ? `${sosBottomOffset}px`
              : "7rem",
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

      {/* REPORT DETAIL — sits ABOVE the bottom nav on mobile, floating
          right-side panel on desktop. reportSheetRef lets the SOS button
          measure this element's real height (see effect above). */}
      <AnimatePresence>
        {selected && (
          <motion.div
            ref={reportSheetRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute z-[400] bottom-16 left-0 right-0 max-h-[70dvh] overflow-y-auto
                       lg:bottom-auto lg:left-auto lg:top-6 lg:right-6 lg:w-96 lg:max-h-[85dvh] lg:rounded-3xl lg:shadow-2xl"
          >
            <ReportDetailModal
              report={selected}
              onClose={() => setSelectedId(null)}
              isAuthenticated={isAuthenticated}
              onAuthRequired={() => setShowCreateAccount(true)}
              onConfirm={() => handleConfirm(selected.id)}
              onIncorrect={() => handleIncorrect(selected.id)}
              isVoting={confirmMutation.isPending}
            />
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
            onGoogleSignIn={handleGoogleSignIn}
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
        lat={mapCenter[0]}
        lng={mapCenter[1]}
        label={userLocation ? "Current location" : "This area"}
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
