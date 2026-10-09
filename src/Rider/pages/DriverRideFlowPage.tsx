import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronsRight,
  Star,
  Delete,
  X,
  Loader2,
  Phone,
  PhoneCall,
  Share2,
} from "lucide-react";
import { TopBar } from "../components/MapBackdrop";
import DriverRideMap from "../components/DriverRideMap";
import CollapsibleSheet from "../components/CollapsibleSheet";
import RideChatScreen from "../components/RideChatScreen";
import CallOptionsSheet from "../components/CallOptionsSheet";
import ShareTripSheet from "../components/ShareTripSheet";
import { useActiveDriverRide, useDriverRideDetails } from "../hooks/useDriverRideDetails";
import { useRideEvents, type RideOffer } from "../hooks/useRideSocket";
import { mapEta, naira, stepForStatus, type DriverRideView } from "../lib/rideMap";
import { useEta } from "../hooks/useDriverRide";
import { useDriverLiveLocation } from "../hooks/useDriverLiveLocation";
import { useUpdateLocation } from "../hooks/useDriverAvailability";
import { useCurrentLocation } from "../../hooks/useCurrentLocation";
import {
  useAcceptMatch,
  useArrived,
  useCancelRide,
  useCompleteRide,
  useDeclineMatch,
  useEnRoute,
  useInProgress,
  useStartRide,
  useVerifyPickupCode,
} from "../hooks/useDriverRide";

type Step =
  | "request"
  | "details"
  | "transit"
  | "notified"
  | "verify"
  | "verifying"
  | "dropoff"
  | "confirm";


function Pill({ label }: { label: string }) {
  return (
    <div className="absolute left-1/2 top-[calc(env(safe-area-inset-top,0px)+68px)] z-10 -translate-x-1/2 rounded-full bg-[#12B76A] px-4 py-2 text-sm font-semibold text-white shadow-md">
      {label}
    </div>
  );
}

function DriverCard({
  ride,
  onMessage,
  onCall,
}: {
  ride: DriverRideView;
  onMessage: () => void;
  onCall: () => void;
}) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-gray-100 p-2.5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#6E43A3] text-sm font-bold text-white">
        {ride.passengerPhoto ? (
          <img src={ride.passengerPhoto} alt="" className="h-full w-full object-cover" />
        ) : (
          ride.passengerInitials
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-[#1F2937]">{ride.passengerName}</p>
          {ride.passengerRating !== undefined && (
            <span className="flex items-center gap-0.5 rounded bg-[#FFF6D6] px-1 text-[11px] font-semibold text-[#D39B13]">
              <Star size={10} className="fill-[#F4C542] text-[#F4C542]" />
              {ride.passengerRating.toFixed(1)}
            </span>
          )}
        </div>
        {ride.passengerTrips !== undefined && (
          <p className="text-[11px] text-[#6F7DA3]">{ride.passengerTrips} Completed ride</p>
        )}
      </div>
      <button
        type="button"
        onClick={onMessage}
        aria-label="Message passenger"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4DBF1] text-[#6B3FA0] active:scale-95"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z" />
          <path d="M8.5 10.5h7M8.5 14h4.5" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onCall}
        aria-label="Call passenger"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DDF3E4] text-[#3FA66A] active:scale-95"
      >
        <PhoneCall size={18} />
      </button>
    </div>
  );
}

export default function DriverRideFlowPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("request");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [callSheet, setCallSheet] = useState(false);
  const [inAppCall, setInAppCall] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // The ride offer (push / socket event) should navigate here with
  // { state: { rideId } } or ?rideId=...
  const location = useLocation();
  const [params] = useSearchParams();
  const givenRideId: string | undefined =
    (location.state as any)?.rideId ?? params.get("rideId") ?? undefined;
  // Opened without a ride id (bottom nav, refresh, a link)? Use the ride that
  // is already assigned to this driver so chat, call and the buttons work.
  const activeRide = useActiveDriverRide(!givenRideId);
  const rideId: string | undefined = givenRideId ?? activeRide.data?.rideId;

  const offer: RideOffer | undefined = (location.state as any)?.offer;
  const rideQuery = useDriverRideDetails(rideId);
  const base: DriverRideView = rideQuery.data ?? {
    currency: "NGN",
    passengerName: "Passenger",
    passengerInitials: "P",
    pickupAddress: "—",
    dropoffAddress: "—",
    pickupShort: "—",
    dropoffShort: "—",
  };
  // GET /eta: driver -> pickup before the trip, pickup -> dropoff for the trip.
  const { coords: firstFix } = useCurrentLocation();
  const liveLoc = useDriverLiveLocation();
  const me = liveLoc ?? firstFix;

  // Keep POSTing our position (POST /ride-drivers/availability/location) for
  // the whole ride; the backend relays it to the rider as driver.location_updated.
  const sendLocation = useUpdateLocation();
  const meRef = useRef<any>(me);
  meRef.current = me;
  const sending = !!rideId && step !== "request" && step !== "confirm";
  useEffect(() => {
    if (!sending) return;
    const tick = () => {
      const c = meRef.current;
      if (!c) return;
      sendLocation.mutate({
        lat: c.latitude,
        lng: c.longitude,
        ...(typeof c.heading === "number" ? { heading: Math.round(c.heading) } : {}),
        ...(typeof c.speed === "number" ? { speed: c.speed } : {}),
      });
    };
    tick();
    const id = window.setInterval(tick, 5_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sending]);
  const toPickup = useEta(
    me && base.pickupCoords
      ? { originLat: me.latitude, originLng: me.longitude, destLat: base.pickupCoords.lat, destLng: base.pickupCoords.lng }
      : null,
  );
  const tripEta = useEta(
    base.pickupCoords && base.dropoffCoords
      ? { originLat: base.pickupCoords.lat, originLng: base.pickupCoords.lng, destLat: base.dropoffCoords.lat, destLng: base.dropoffCoords.lng }
      : null,
  );
  const pickupEta = toPickup.data ? mapEta(toPickup.data) : {};
  const tripEtaView = tripEta.data ? mapEta(tripEta.data) : {};

  // Fill gaps in the ride response with what the live offer already told us.
  const ride: DriverRideView = {
    ...base,
    tripDuration: base.tripDuration ?? tripEtaView.duration,
    tripDistance: base.tripDistance ?? tripEtaView.distance,
    fare: base.fare ?? offer?.estimatedFare,
    passengerRating: base.passengerRating ?? offer?.riderRating,
    pickupAddress: base.pickupAddress !== "—" ? base.pickupAddress : offer?.pickupAddress ?? "—",
    pickupShort:
      base.pickupShort !== "—" ? base.pickupShort : offer?.pickupAddress?.split(",")[0] ?? "—",
    durationToPickup: pickupEta.duration ?? base.durationToPickup ?? (offer ? `${offer.etaMin} min` : undefined),
    distanceToPickup: pickupEta.distance ?? base.distanceToPickup ?? (offer ? `${offer.distanceKm} km` : undefined),
  };

  // Realtime ride events (events.html). The driver drives most transitions
  // themselves; these cover things the rider/system does to us.
  const qc = useQueryClient();
  const [settled, setSettled] = useState<{ finalFare?: number; driverEarnings?: number } | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["driver-ride", rideId] });
  useRideEvents(rideId, {
    "ride.cancelled": (p) => {
      setApiError(
        p?.cancelledBy === "driver"
          ? "Ride cancelled."
          : `The ride was cancelled${p?.reason ? `: ${p.reason}` : "."}`,
      );
      window.setTimeout(() => navigate("/driver/home"), 2500);
    },
    "ride.pickup_code_locked": () => {
      setPinError("Too many wrong codes. Contact support to continue this ride.");
      setStep("notified");
    },
    "ride.pickup_code_regenerated": () => {
      setPin("");
      setPinError("The rider generated a new code. Ask them for it.");
    },
    "ride.completed": (p) => {
      setSettled({ finalFare: p?.finalFare, driverEarnings: p?.driverEarnings });
      refresh();
    },
    "ride.paid": refresh,
    "ride.route_updated": refresh, // rider changed the destination/stops
    reconnected: refresh,
    "ride.payment_pending": refresh,
    "ride.driver_assigned": refresh,
    "ride.started": refresh,
    "ride.driver_arrived": refresh,
  });

  // Jump to the right step for a ride that's already in progress (e.g. after
  // a refresh), and leave if the rider cancels.
  const synced = useRef(false);
  useEffect(() => {
    if (!rideQuery.data) return;
    if (!synced.current) {
      synced.current = true;
      setStep(stepForStatus(rideQuery.data.status) as Step);
    }
    if (rideQuery.data.status === "cancelled") {
      setApiError("The rider cancelled this ride.");
      const t = window.setTimeout(() => navigate("/driver/home"), 2000);
      return () => window.clearTimeout(t);
    }
  }, [rideQuery.data, navigate]);

  // Time waiting at the pickup point, counted from when the driver arrived.
  const [waited, setWaited] = useState(0);
  useEffect(() => {
    if (step !== "notified") return;
    setWaited(0);
    const id = window.setInterval(() => setWaited((w) => w + 1), 1000);
    return () => window.clearInterval(id);
  }, [step]);
  const waitedLabel = `${String(Math.floor(waited / 60)).padStart(2, "0")}:${String(waited % 60).padStart(2, "0")}`;

  const accept = useAcceptMatch();
  const decline = useDeclineMatch();
  const enRoute = useEnRoute();
  const arrived = useArrived();
  const verify = useVerifyPickupCode();
  const start = useStartRide();
  const inProgress = useInProgress();
  const complete = useCompleteRide();
  const cancel = useCancelRide();

  const busy =
    accept.isPending ||
    decline.isPending ||
    enRoute.isPending ||
    arrived.isPending ||
    verify.isPending ||
    start.isPending ||
    inProgress.isPending ||
    complete.isPending ||
    cancel.isPending;

  const fail = (e: any) => setApiError(e?.message ?? "Something went wrong");

  const pressDigit = (d: string) => {
    if (pin.length >= 4) return;
    setPinError(null);
    setPin((p) => p + d);
  };
  const backspace = () => setPin((p) => p.slice(0, -1));

  // Accept the offer, then tell the backend we're heading to the pickup.
  const onAccept = async () => {
    if (!rideId) return setStep("details");
    setApiError(null);
    try {
      await accept.mutateAsync(rideId);
      await enRoute.mutateAsync(rideId);
      setStep("details");
    } catch (e) {
      fail(e);
    }
  };

  const onDecline = async () => {
    try {
      if (rideId) await decline.mutateAsync({ rideId, reason: "Too far" });
      navigate("/driver/home");
    } catch (e) {
      fail(e);
    }
  };

  const onCancel = async () => {
    try {
      if (rideId) await cancel.mutateAsync({ rideId, reason: "Too far" });
      navigate("/driver/home");
    } catch (e) {
      fail(e);
    }
  };

  // Driver reached the pickup point.
  const onArrived = async () => {
    setApiError(null);
    try {
      if (rideId) await arrived.mutateAsync(rideId);
      setStep("notified");
    } catch (e) {
      fail(e);
    }
  };

  // Verify the rider's pickup code, then start the trip.
  const submitPin = async () => {
    setApiError(null);
    setStep("verifying");
    try {
      if (rideId) {
        await verify.mutateAsync({ rideId, code: pin });
        await start.mutateAsync(rideId);
        await inProgress.mutateAsync(rideId);
      }
      setStep("dropoff");
    } catch (e: any) {
      setPinError(e?.message ?? "PIN does not match.");
      setStep("verify");
    }
  };

  const onComplete = async () => {
    setApiError(null);
    try {
      if (rideId) await complete.mutateAsync(rideId);
      setStep("confirm");
    } catch (e) {
      fail(e);
    }
  };

  return (
    <div className="font-outfit relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
      <div className="relative min-h-0 flex-1">
        <DriverRideMap
          pickupAddress={ride.pickupAddress}
          dropoffAddress={ride.dropoffAddress}
          pickupCoords={ride.pickupCoords}
          dropoffCoords={ride.dropoffCoords}
          heading={step === "dropoff" || step === "confirm" ? "dropoff" : "pickup"}
        >
          <TopBar
            showBack={
              <button
                type="button"
                onClick={() => navigate("/driver/home")}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md"
              >
                <ChevronLeft size={18} className="text-[#1F2937]" />
              </button>
            }
            onMenu={step === "dropoff" || step === "confirm" ? () => {} : undefined}
          />

          {rideId && step !== "request" && step !== "confirm" && (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              aria-label="Share trip"
              className="absolute right-4 top-[calc(env(safe-area-inset-top,0px)+72px)] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md"
            >
              <Share2 size={18} className="text-[#6E43A3]" />
            </button>
          )}

          {step === "request" && <Pill label={`Pickup: ${ride.pickupShort}`} />}
          {(step === "details" || step === "transit") && (
            <Pill label={step === "transit" ? "In Transit" : `Pickup: ${ride.pickupShort}`} />
          )}
          {(step === "notified" || step === "verify" || step === "verifying") && (
            <Pill label={`Pickup: ${ride.pickupShort}`} />
          )}
          {(step === "dropoff" || step === "confirm") && (
            <Pill label={`Dropoff: ${ride.dropoffShort}`} />
          )}

          {step === "verifying" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10">
              <Loader2 size={36} className="animate-spin text-[#6E43A3]" />
            </div>
          )}
        </DriverRideMap>
      </div>

      {/* ========================= BOTTOM SHEET ========================== */}
      <CollapsibleSheet defaultOpen>
        {apiError && (
          <p className="mb-2 text-center text-xs font-semibold text-[#E53935]">
            {apiError}
          </p>
        )}

        {step === "request" && (
          <>
            <p className="text-2xl font-extrabold text-[#1F2937]">{naira(ride.fare)}</p>
            <div className="mt-1 flex items-center gap-1 text-xs text-[#4B5768]">
              <Star size={13} className="fill-[#F4C542] text-[#F4C542]" /> {ride.passengerRating?.toFixed(1) ?? "—"} · {ride.passengerName}
            </div>
            <div className="mt-2 space-y-1 text-xs text-[#4B5768]">
              <p>{[ride.durationToPickup, ride.distanceToPickup].filter(Boolean).join(" · ") || "—"} away</p>
              <p>Trip: {[ride.tripDuration, ride.tripDistance].filter(Boolean).join(" · ") || "—"}</p>
              <p className="truncate text-[#9AA5B8]">Pickup at {ride.pickupAddress}</p>
            </div>
            <button
              type="button"
              onClick={onAccept}
              disabled={busy}
              className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#6E43A3] px-4 py-3 text-base font-bold text-white shadow-sm active:scale-[0.99] disabled:opacity-60"
            >
              <ChevronsRight size={18} />
              <span>{accept.isPending ? "Accepting..." : "Drag to Accept"}</span>
              <ChevronsRight size={18} />
            </button>
            <button
              type="button"
              onClick={onDecline}
              disabled={busy}
              className="mt-2 w-full py-2 text-sm font-semibold text-[#E53935] disabled:opacity-60"
            >
              Decline
            </button>
          </>
        )}

        {(step === "details" || step === "transit") && (
          <>
            <p className="text-sm font-semibold text-[#1F2937]">
              {step === "transit" ? `Dropoff: ${ride.dropoffShort}` : `Pickup: ${ride.pickupShort}`}
            </p>
            <p className="mt-0.5 truncate text-xs text-[#9AA5B8]">
              {step === "transit" ? ride.dropoffAddress : ride.pickupAddress}
            </p>
            <div className="mt-2 space-y-1 text-xs text-[#4B5768]">
              <p>{[ride.durationToPickup, ride.distanceToPickup].filter(Boolean).join(" · ") || "—"} away</p>
              <p>Trip: {[ride.tripDuration, ride.tripDistance].filter(Boolean).join(" · ") || "—"}</p>
            </div>
            <DriverCard ride={ride} onMessage={() => setChatOpen(true)} onCall={() => setCallSheet(true)} />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="rounded-2xl bg-[#E53935] py-3 text-sm font-bold text-white active:scale-[0.99] disabled:opacity-60"
              >
                Cancel Ride
              </button>
              <button
                type="button"
                onClick={onArrived}
                disabled={busy}
                className="rounded-2xl bg-[#6E43A3] py-3 text-sm font-bold text-white active:scale-[0.99] disabled:opacity-60"
              >
                {arrived.isPending ? "Updating..." : "I've Arrived"}
              </button>
            </div>
          </>
        )}

        {step === "notified" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#1F2937]">
                Passenger Notified
              </p>
              <span className="text-xs font-semibold text-[#9AA5B8]">
                {waitedLabel}
              </span>
            </div>
            <DriverCard ride={ride} onMessage={() => setChatOpen(true)} onCall={() => setCallSheet(true)} />
            <button
              type="button"
              onClick={() => setStep("verify")}
              className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#6E43A3] px-4 py-3 text-base font-bold text-white shadow-sm active:scale-[0.99]"
            >
              <ChevronsRight size={18} />
              <span>Drag to verify passenger</span>
              <ChevronsRight size={18} />
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="mt-2 w-full rounded-2xl bg-[#E53935] py-3 text-sm font-bold text-white active:scale-[0.99] disabled:opacity-60"
            >
              Cancel Ride
            </button>
          </>
        )}

        {(step === "dropoff") && (
          <>
            <p className="text-sm font-semibold text-[#1F2937]">
              {[ride.tripDuration, ride.tripDistance].filter(Boolean).join(" · ") || "On trip"}
            </p>
            <p className="mt-0.5 text-xs text-[#9AA5B8]">Dropping off {ride.passengerName}</p>
            <button
              type="button"
              onClick={onComplete}
              disabled={busy}
              className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#6E43A3] px-4 py-3 text-base font-bold text-white shadow-sm active:scale-[0.99]"
            >
              <ChevronsRight size={18} />
              <span>Drag — Arrived at dropoff</span>
              <ChevronsRight size={18} />
            </button>
          </>
        )}

        {step === "confirm" && (
          <>
            <p className="text-sm font-semibold text-[#1F2937]">
              Dropoff: {ride.dropoffShort}
            </p>
            <p className="mt-0.5 text-xs text-[#9AA5B8]">
              {[ride.tripDuration, ride.tripDistance].filter(Boolean).join("  ·  ")}
            </p>
            <div className="mt-2 space-y-1 text-xs text-[#4B5768]">
              <div className="flex justify-between">
                <span>Trip fare</span>
                <span>{naira(settled?.finalFare ?? ride.fare)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tip</span>
                <span>{naira(ride.tip ?? 0)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-1 font-bold text-[#1F2937]">
                <span>Total</span>
                <span>{naira((settled?.finalFare ?? ride.fare ?? 0) + (ride.tip ?? 0))}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/driver/rate-passenger", { state: { rideId } })}
              className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#6E43A3] px-4 py-3 text-base font-bold text-white shadow-sm active:scale-[0.99]"
            >
              <ChevronsRight size={18} />
              <span>Drag to Confirm Price</span>
              <ChevronsRight size={18} />
            </button>
          </>
        )}
      </CollapsibleSheet>

      {shareOpen && rideId && (
        <ShareTripSheet rideId={rideId} onClose={() => setShareOpen(false)} />
      )}

      {/* ========================= CHAT + CALL ========================== */}
      {chatOpen && (
        <RideChatScreen
          rideId={rideId}
          person={{
            name: ride.passengerName,
            initials: ride.passengerInitials,
            photo: ride.passengerPhoto,
            rating: ride.passengerRating,
            trips: ride.passengerTrips,
          }}
          onBack={() => setChatOpen(false)}
          onCall={() => setCallSheet(true)}
        />
      )}

      {callSheet && (
        <CallOptionsSheet
          phoneAvailable={!!ride.passengerPhone}
          onClose={() => setCallSheet(false)}
          onInApp={() => {
            setCallSheet(false);
            setInAppCall(true);
          }}
          onPhone={() => {
            setCallSheet(false);
            if (ride.passengerPhone) window.location.href = `tel:${ride.passengerPhone}`;
          }}
        />
      )}

      {inAppCall && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-between bg-[#2A1747] px-6 pb-[calc(env(safe-area-inset-bottom,0px)+40px)] pt-[22vh] text-white">
          <div className="flex flex-col items-center">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#6E43A3] text-3xl font-bold">
              {ride.passengerPhoto ? (
                <img src={ride.passengerPhoto} alt="" className="h-full w-full object-cover" />
              ) : (
                ride.passengerInitials
              )}
            </div>
            <p className="mt-4 text-xl font-semibold">{ride.passengerName}</p>
            <p className="mt-1 text-sm text-white/70">Calling…</p>
          </div>
          <button
            type="button"
            onClick={() => setInAppCall(false)}
            aria-label="End call"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E53935] active:scale-95"
          >
            <Phone size={26} className="rotate-[135deg]" />
          </button>
        </div>
      )}

      {/* ========================= VERIFY PASSENGER MODAL ========================== */}
      {step === "verify" && (
        <div
          className="absolute inset-0 z-30 flex items-end bg-black/40"
          onClick={() => setStep("notified")}
        >
          <div
            className="w-full rounded-t-[28px] bg-white p-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-[#1F2937]">
                  Verify passenger
                </p>
                <p className="mt-1 max-w-[240px] text-xs text-[#9AA5B8]">
                  Ask {ride.passengerName} for the 4-digit trip PIN before
                  starting
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep("notified")}
                className="text-[#9AA5B8]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mx-auto mt-4 flex w-fit gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className={`flex h-11 w-9 items-center justify-center rounded-lg border text-lg font-bold ${
                    pinError
                      ? "border-[#E53935] text-[#E53935]"
                      : "border-gray-200 text-[#1F2937]"
                  }`}
                >
                  {pin[i] ?? ""}
                </span>
              ))}
            </div>
            {pinError && (
              <p className="mt-2 text-center text-xs font-semibold text-[#E53935]">
                {pinError}
              </p>
            )}

            <div className="mx-auto mt-4 grid max-w-[260px] grid-cols-3 gap-y-2 text-xl font-semibold text-[#1F2937]">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => pressDigit(d)}
                  className="py-2.5"
                >
                  {d}
                </button>
              ))}
              <span />
              <button type="button" onClick={() => pressDigit("0")} className="py-2.5">
                0
              </button>
              <button
                type="button"
                onClick={backspace}
                className="flex items-center justify-center py-2.5 text-[#9AA5B8]"
              >
                <Delete size={20} />
              </button>
            </div>

            <button
              type="button"
              onClick={submitPin}
              disabled={pin.length < 4}
              className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#6E43A3] px-4 py-3 text-base font-bold text-white shadow-sm disabled:opacity-40"
            >
              <ChevronsRight size={18} />
              <span>Drag to verify passenger</span>
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
