import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronsRight, ChevronsLeft, Star, MapPin } from "lucide-react";
import CollapsibleSheet from "../components/CollapsibleSheet";
import { TopBar } from "../components/MapBackdrop";
import RiderMap from "../components/RiderMap";
import DriverBottomNav from "../components/DriverBottomNav";
import { useRegisterDeviceToken } from "../hooks/useDeviceToken";
import { useCurrentLocation } from "../../hooks/useCurrentLocation";
import { useDriverLiveLocation } from "../hooks/useDriverLiveLocation";
import {
  useAvailabilityStatus,
  useGoOffline,
  useGoOnline,
  useUpdateLocation,
} from "../hooks/useDriverAvailability";
import { useActiveDriverRide } from "../hooks/useDriverRideDetails";
import { useRideOffers, type RideOffer } from "../hooks/useRideSocket";
import { useDeclineMatch } from "../hooks/useDriverRide";
import { naira } from "../lib/rideMap";
import { useReceivedRatings } from "../hooks/useRatings";
import { useEarningsSummary } from "../hooks/useEarnings";
import { getPeriod } from "../lib/earningsMap";
import { getFcmToken, getStoredFcmToken, storeFcmToken } from "../lib/fcm";

export default function DriverHomePage() {
  const navigate = useNavigate();
  const registerToken = useRegisterDeviceToken();
  const { coords: firstFix } = useCurrentLocation();
  const liveLoc = useDriverLiveLocation();
  const coords: any = liveLoc ?? firstFix;
  const status = useAvailabilityStatus();
  const goOnline = useGoOnline();
  const goOffline = useGoOffline();
  const sendLocation = useUpdateLocation();
  const isOnline = status.data === true;

  // Real rating: average of what passengers gave (same data as Account → My ratings).
  const receivedRatings = useReceivedRatings();
  const rated = (receivedRatings.data?.pages ?? []).flatMap((p) => p.items);
  const ratingText = (
    rated.length ? rated.reduce((sum, r) => sum + r.stars, 0) / rated.length : 0
  ).toFixed(1);

  // Real "Today's Earnings" from /ride-drivers/earnings/detail for today.
  const todaySummary = useEarningsSummary("daily", getPeriod("daily", 1));
  const todayEarnings = `₦${(todaySummary.data?.earning ?? 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const [availError, setAvailError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(true);
  // Live ride offers over Socket.IO (events.html: ride.offer_sent).
  const { offer, secondsLeft, connected, clearOffer } = useRideOffers(isOnline);
  const declineOffer = useDeclineMatch();
  // A ride already assigned to this driver (e.g. after a refresh).
  const active = useActiveDriverRide(isOnline);
  const activeRideId = active.data?.rideId;
  const openRide = (rideId?: string, offerData?: RideOffer) =>
    navigate(rideId ? `/driver/ride?rideId=${encodeURIComponent(rideId)}` : "/driver/ride", {
      state: rideId ? { rideId, offer: offerData } : undefined,
    });

  const handleOnline = () => {
    if (!coords) {
      setAvailError("Waiting for your location. Please try again in a moment.");
      return;
    }
    setAvailError(null);
    goOnline.mutate(
      { lat: coords.latitude, lng: coords.longitude },
      { onError: (e: any) => setAvailError(e.message) },
    );
  };
  const handleOffline = () => {
    setAvailError(null);
    goOffline.mutate("I'm done for the day", {
      onError: (e: any) => setAvailError(e.message),
    });
  };

  // While online, push the driver's position to the backend every 10s.
  const coordsRef = useRef(coords);
  coordsRef.current = coords;
  useEffect(() => {
    if (!isOnline) return;
    const tick = () => {
      const c: any = coordsRef.current;
      if (!c) return;
      sendLocation.mutate({
        lat: c.latitude,
        lng: c.longitude,
        ...(typeof c.heading === "number" ? { heading: Math.round(c.heading) } : {}),
        ...(typeof c.speed === "number" ? { speed: c.speed } : {}),
      });
    };
    tick();
    const id = window.setInterval(tick, 10_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // Register this device for push once per session (POST /notifications/device-token).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getFcmToken();
        if (!token || cancelled || token === getStoredFcmToken()) return;
        await registerToken.mutateAsync({ token, platform: "android" });
        storeFcmToken(token);
      } catch (e) {
        console.warn("[notifications] device token registration failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="font-outfit relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
      {/* ========================= MAP ========================== */}
      <div className="relative flex-1 min-h-0">
        <RiderMap>
          <TopBar />

          {/* Online -> Offline toggle pill (top bar), only shown while online */}
          {isOnline && (
            <div className="absolute left-1/2 top-[calc(env(safe-area-inset-top,0px)+16px)] z-10 w-[calc(100%-96px)] max-w-[260px] -translate-x-1/2">
              <button
                type="button"
                onClick={handleOffline}
                disabled={goOffline.isPending}
                className="flex w-full items-center justify-between rounded-full bg-[#B9BFC9] px-3 py-2.5 text-sm font-semibold text-white shadow-md transition"
              >
                <ChevronsLeft size={18} />
                <span>Go Offline</span>
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/30">
                  <ChevronsLeft size={14} />
                </span>
              </button>
            </div>
          )}
        </RiderMap>
      </div>

      {/* ========================= BOTTOM SHEET ========================== */}
      <CollapsibleSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        peek={
          !sheetOpen && (
            <p className="pb-1 text-center text-xs text-[#4B5768]">
              {isOnline ? (connected ? "You're online" : "Connecting…") : "You're offline"} · tap to open
            </p>
          )
        }
      >

        {!isOnline && (
          <>
            <p className="mb-2 text-center text-sm text-[#4B5768]">
              Go online to get more bookings
            </p>

            <button
              type="button"
              onClick={handleOnline}
              disabled={goOnline.isPending}
              className="flex w-full items-center justify-between rounded-2xl bg-[#12B76A] px-2 py-3 text-base font-bold text-white shadow-sm transition active:scale-[0.99]"
            >
              <span className="flex items-center justify-center w-8 h-8 border-2 rounded-xl border-white/70">
                <ChevronsRight size={18} />
              </span>
              <span>{goOnline.isPending ? "Going online..." : "Drag to go Online"}</span>
              <ChevronsRight size={18} />
            </button>
          </>
        )}

        {availError && (
          <p className="mt-2 text-center text-xs font-semibold text-[#E53935]">
            {availError}
          </p>
        )}

        {/* Today's earnings */}
        <button
          type="button"
          onClick={() => navigate("/driver/earnings")}
          className="flex items-center justify-between w-full px-4 py-3 mt-3 text-left border border-gray-100 shadow-sm rounded-2xl"
        >
          <div>
            <p className="text-sm text-[#4B5768]">Today's Earnings</p>
            <p className="mt-1 text-xl font-extrabold text-[#1F2937]">{todayEarnings}</p>
          </div>
          <span className="text-gray-300">›</span>
        </button>

        {/* Drive score / rating */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="px-4 py-3 border border-gray-100 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#4B5768]">Drive score</p>
              <span className="text-gray-300">›</span>
            </div>
            <p className="mt-1 text-lg font-extrabold text-[#1F2937]">93%</p>
          </div>
          <div className="px-4 py-3 border border-gray-100 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#4B5768]">Current Rating</p>
              <span className="text-gray-300">›</span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-lg font-extrabold text-[#1F2937]">
              {ratingText} <Star size={16} className="fill-[#F4C542] text-[#F4C542]" />
            </p>
          </div>
        </div>

        {isOnline && activeRideId && (
          <button
            type="button"
            onClick={() => openRide(activeRideId)}
            className="mt-3 w-full rounded-2xl border border-[#6E43A3] py-2.5 text-sm font-semibold text-[#6E43A3]"
          >
            Continue current ride
          </button>
        )}
      </CollapsibleSheet>

      {/* ===================== RIDE REQUEST MODAL ===================== */}
      {offer && (
        <div className="absolute inset-0 z-30 flex items-end bg-black/40">
          <div className="w-full rounded-t-[28px] bg-white p-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]">
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-[#1F2937]">New ride request</p>
              <span className="rounded-full bg-[#F3E8FF] px-3 py-1 text-xs font-bold text-[#6E43A3]">
                {secondsLeft}s
              </span>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#1F2937]">{naira(offer.estimatedFare)}</p>
            {offer.riderRating !== undefined && (
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#1F2937]">
                <Star size={13} className="fill-[#F4C542] text-[#F4C542]" /> {offer.riderRating.toFixed(1)}
              </p>
            )}
            <div className="mt-2 space-y-1 text-xs text-[#4B5768]">
              <p>{offer.etaMin} min · {offer.distanceKm} km away</p>
              {offer.pickupAddress && (
                <p className="flex items-start gap-1">
                  <MapPin size={14} className="mt-0.5 shrink-0" /> {offer.pickupAddress}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                const o = offer;
                clearOffer();
                openRide(o.rideId, o);
              }}
              className="mt-4 w-full rounded-2xl bg-[#6E43A3] py-3 text-base font-bold text-white"
            >
              View request
            </button>
            <button
              type="button"
              onClick={() => {
                declineOffer.mutate({ rideId: offer.rideId, reason: "Declined" });
                clearOffer();
              }}
              className="w-full py-2 mt-2 text-sm font-semibold text-[#E53935]"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      <DriverBottomNav
        active="home"
        onChange={(tab) => {
          if (tab === "rides") navigate("/driver/rides");
          if (tab === "earnings") navigate("/driver/earnings");
          if (tab === "account") navigate("/driver/account");
        }}
      />
    </div>
  );
}
