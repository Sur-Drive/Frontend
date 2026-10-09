import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Car, SlidersHorizontal, Star, X } from "lucide-react";
import MapBackdrop from "../components/MapBackdrop";
import DriverBottomNav from "../components/DriverBottomNav";
import { RIDE_STATUSES, type DriverRideStatus } from "../api/rides";
import { extractRides, useDriverRideHistory } from "../hooks/useRideHistory";

/* ------------------------------------------------------------------ */
/* Types & sample data                                                */
/* ------------------------------------------------------------------ */

type Ride = {
  id: string;
  from: string;
  to: string;
  date: string; // display date, e.g. "5 Oct, 12:26"
  person: string;
  status: string; // raw API status, e.g. "ride_completed"
  statusLabel: string;
  tone: "good" | "bad" | "neutral";
  paymentMethod: string;
  amount: number;
  monthGroup: string;
  driverFullName: string;
  rating: number | null;
  duration: string;
  distance: string;
  pickupAddress: string;
  pickupTime: string;
  dropoffAddress: string;
  dropoffTime: string;
  fare: number;
  bookingFee: number;
};

const naira = (n: number) =>
  `₦${n.toLocaleString("en-NG", { minimumFractionDigits: n % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}`;

const STATUS_LABEL = (s: string) =>
  s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const fmtDate = (iso?: string) => {
  const d = iso ? new Date(iso) : null;
  if (!d || isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const addr = (v: any): string =>
  typeof v === "string" ? v : v?.address || v?.name || "—";

/**
 * Maps one item from GET /rides/driver/history to the Ride the UI uses.
 * Field names are read defensively — check the [rides] console log once and
 * tighten these to the backend's real names.
 */
function normalizeRide(r: any): Ride {
  const status = String(r.status ?? "");
  const pickup = addr(r.pickupAddress ?? r.pickup ?? r.pickupLocation ?? r.origin);
  const dropoff = addr(r.dropoffAddress ?? r.dropoff ?? r.dropoffLocation ?? r.destination);
  const created = r.createdAt ?? r.requestedAt ?? r.startedAt;
  const p = r.passenger ?? r.rider ?? {};
  const person =
    [p.firstName, p.lastName].filter(Boolean).join(" ") ||
    p.name ||
    r.passengerName ||
    "Passenger";
  const fare = Number(r.fare ?? r.fareAmount ?? r.baseFare ?? r.amount ?? 0);
  const bookingFee = Number(r.bookingFee ?? 0);
  const done = ["ride_completed", "payment_pending", "paid", "closed"].includes(status);
  const dist = r.distanceKm ?? r.distance;
  const dur = r.durationMinutes ?? r.duration;
  const d = created ? new Date(created) : null;

  return {
    id: String(r.id ?? r._id ?? r.rideId ?? Math.random()),
    from: pickup,
    to: dropoff,
    date: fmtDate(created),
    person,
    status,
    statusLabel: STATUS_LABEL(status),
    tone: done ? "good" : status === "cancelled" ? "bad" : "neutral",
    paymentMethod: String(r.paymentMethod ?? r.paymentType ?? "—"),
    amount: Number(r.totalFare ?? r.total ?? fare + bookingFee),
    monthGroup:
      d && !isNaN(d.getTime())
        ? d.toLocaleString("en-NG", { month: "long", year: "numeric" })
        : "",
    driverFullName: person,
    rating: typeof r.rating === "number" ? r.rating : null,
    duration: dur != null ? `${dur} mins` : "—",
    distance: dist != null ? `${dist} km` : "—",
    pickupAddress: pickup,
    pickupTime: fmtDate(r.startedAt ?? created),
    dropoffAddress: dropoff,
    dropoffTime: fmtDate(r.completedAt ?? r.endedAt),
    fare,
    bookingFee,
  };
}

type StatusFilter = "all" | DriverRideStatus;

/* ------------------------------------------------------------------ */
/* Small pieces                                                       */
/* ------------------------------------------------------------------ */

function StatusText({ ride }: { ride: Ride }) {
  const color =
    ride.tone === "good"
      ? "text-[#1E9E56]"
      : ride.tone === "bad"
        ? "text-[#E8542F]"
        : "text-[#E8A93E]";
  return <span className={`${color} font-medium`}>{ride.statusLabel}</span>;
}

function RideRow({ ride, onOpen }: { ride: Ride; onOpen: (r: Ride) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(ride)}
      className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3.5 text-left shadow-sm transition active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F1F2F5]">
          <Car size={20} className="text-[#4B5768]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-[#1F2937]">
            {ride.from} <span className="text-[#9AA5B8]">→</span> {ride.to}
          </p>
          <p className="mt-0.5 truncate text-[12.5px] text-[#9AA5B8]">
            {ride.date} · {ride.person} ·{" "}
            <StatusText ride={ride} />
          </p>
        </div>
        <span className="mt-1 shrink-0 text-gray-300">›</span>
      </div>

      <div className="my-3 h-px w-full bg-gray-100" />

      <div className="flex items-center justify-between">
        <span className="text-[13px] text-[#6E7A8C]">
          {ride.paymentMethod}
        </span>
        <span className="text-[15px] font-bold text-[#1F2937]">
          {naira(ride.amount)}
        </span>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Filter bottom sheet                                                */
/* ------------------------------------------------------------------ */

function FilterSheet({
  open,
  status,
  startDate,
  endDate,
  onChangeStatus,
  onChangeStart,
  onChangeEnd,
  onApply,
  onReset,
  onClose,
}: {
  open: boolean;
  status: StatusFilter;
  startDate: string;
  endDate: string;
  onChangeStatus: (s: StatusFilter) => void;
  onChangeStart: (v: string) => void;
  onChangeEnd: (v: string) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const pills: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    ...RIDE_STATUSES.map((k) => ({ key: k, label: STATUS_LABEL(k) })),
  ];

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-t-[28px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-5 shadow-2xl sm:max-w-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1F2937]">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-[#4B5768]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="my-4 h-px w-full bg-gray-100" />

        <p className="mb-2 text-sm font-semibold text-[#1F2937]">Status</p>
        <div className="flex flex-wrap gap-2">
          {pills.map((p) => {
            const active = status === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onChangeStatus(p.key)}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-[#6E43A3] text-white"
                    : "bg-[#F1F2F5] text-[#4B5768]"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <p className="mb-2 mt-5 text-sm font-semibold text-[#1F2937]">
          Custom Dates
        </p>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onChangeStart(e.target.value)}
            placeholder="Start Date"
            className="w-full rounded-xl bg-[#F1F2F5] px-3.5 py-3 text-sm text-[#1F2937] outline-none"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => onChangeEnd(e.target.value)}
            placeholder="End Date"
            className="w-full rounded-xl bg-[#F1F2F5] px-3.5 py-3 text-sm text-[#1F2937] outline-none"
          />
        </div>

        <button
          type="button"
          onClick={onApply}
          className="mt-6 w-full rounded-full bg-[#6E43A3] py-3.5 text-base font-bold text-white shadow-sm transition active:scale-[0.99]"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={onReset}
          className="mt-2 w-full rounded-full py-3.5 text-base font-bold text-[#E8542F]"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ride detail screen                                                 */
/* ------------------------------------------------------------------ */

function RideDetail({ ride, onBack }: { ride: Ride; onBack: () => void }) {
  const isCancelled = ride.status === "cancelled";
  const total = ride.fare + ride.bookingFee;
  const initials = ride.driverFullName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-white">
      <div className="relative flex items-center justify-center border-b border-gray-100 px-4 py-4">
        <button
          type="button"
          onClick={onBack}
          className="absolute left-4 flex h-9 w-9 items-center justify-center rounded-full bg-gray-50"
        >
          <ChevronLeft size={20} className="text-[#1F2937]" />
        </button>
        <h1 className="text-[17px] font-bold text-[#1F2937]">Ride Details</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-4">
        <div className="mx-auto w-full max-w-xl">
          {/* mini map */}
          <div className="relative h-44 w-full overflow-hidden rounded-2xl sm:h-56">
            <MapBackdrop routeLine />
            <span
              className={`absolute left-4 top-4 rounded-full px-4 py-1.5 text-sm font-semibold text-white shadow-md ${
                isCancelled ? "bg-[#E8542F]" : "bg-[#1E9E56]"
              }`}
            >
              {ride.statusLabel}
            </span>
          </div>

          {/* driver / duration card */}
          <div className="mt-4 rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6E43A3] text-sm font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-[#1F2937]">
                  {ride.driverFullName}
                </p>
                <p className="text-[12.5px] text-[#9AA5B8]">{ride.date}</p>
              </div>
              <div className="flex items-center gap-1 text-[#F4C542]">
                <Star size={14} className="fill-[#F4C542]" />
                <span className="text-sm font-semibold text-[#1F2937]">
                  {ride.rating ?? "—"}
                </span>
              </div>
            </div>

            {!isCancelled && (
              <>
                <div className="my-3.5 h-px w-full bg-gray-100" />
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1F2F5]">
                    <Car size={17} className="text-[#4B5768]" />
                  </div>
                  <div className="flex flex-1 items-center justify-between">
                    <div>
                      <p className="text-[12.5px] text-[#9AA5B8]">Duration</p>
                      <p className="text-sm font-bold text-[#1F2937]">
                        {ride.duration}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12.5px] text-[#9AA5B8]">Distance</p>
                      <p className="text-sm font-bold text-[#1F2937]">
                        {ride.distance}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* route card */}
          <div className="mt-4 rounded-2xl border border-gray-100 p-4 shadow-sm">
            <h3 className="mb-3 text-[15px] font-bold text-[#1F2937]">
              Route
            </h3>
            <div className="flex gap-3">
              <div className="flex flex-col items-center pt-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F4C542]" />
                <span className="my-1 h-8 w-px border-l border-dashed border-gray-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#6E43A3]" />
              </div>
              <div className="flex-1">
                <div className="pb-4">
                  <p className="text-[14px] font-medium text-[#1F2937]">
                    {ride.pickupAddress}
                  </p>
                  <p className="text-[12px] text-[#9AA5B8]">
                    {isCancelled ? "Pick up" : ride.pickupTime}
                  </p>
                </div>
                <div className="h-px w-full bg-gray-100" />
                <div className="pt-4">
                  <p className="text-[14px] font-medium text-[#1F2937]">
                    {ride.dropoffAddress}
                  </p>
                  <p className="text-[12px] text-[#9AA5B8]">
                    {isCancelled ? "Drop off" : ride.dropoffTime}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled
              className="mt-4 w-full rounded-full bg-gray-200 py-3.5 text-[15px] font-semibold text-white/90"
            >
              Get help with ride
            </button>
          </div>

          {/* payment card */}
          <div className="mt-4 rounded-2xl border border-gray-100 p-4 shadow-sm">
            <h3 className="mb-3 text-[15px] font-bold text-[#1F2937]">
              Payment
            </h3>

            {isCancelled ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6E7A8C]">Cancellation Fee</span>
                  <span className="font-medium text-[#1F2937]">₦0</span>
                </div>
                <div className="my-3 h-px w-full bg-gray-100" />
                <div className="flex items-center justify-between text-[15px] font-bold text-[#1F2937]">
                  <span>Total</span>
                  <span>₦0</span>
                </div>
                <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-[#F1F2F5] px-3.5 py-3">
                  <span className="text-lg">💵</span>
                  <span className="text-sm font-semibold text-[#1F2937]">
                    Cash
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6E7A8C]">Fare</span>
                  <span className="font-medium text-[#1F2937]">
                    {naira(ride.fare)}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-sm">
                  <span className="text-[#6E7A8C]">Booking Fee</span>
                  <span className="font-medium text-[#1F2937]">
                    {naira(ride.bookingFee)}
                  </span>
                </div>
                <div className="my-3 h-px w-full bg-gray-100" />
                <div className="flex items-center justify-between text-[15px] font-bold text-[#1F2937]">
                  <span>Total</span>
                  <span>{naira(total)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main page                                                          */
/* ------------------------------------------------------------------ */

export default function RideHistoryPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Ride | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStatus, setAppliedStatus] = useState<StatusFilter>("all");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDriverRideHistory({
    status: appliedStatus === "all" ? undefined : appliedStatus,
    startDate: appliedStart || undefined,
    endDate: appliedEnd || undefined,
  });

  const filtered = useMemo<Ride[]>(() => {
    const raw = (data?.pages ?? []).flatMap((p: any) => extractRides(p));
    // TEMP DEBUG LOGGING — check the real field names, then remove.
    if (raw[0]) console.log("[rides] first history item:", raw[0]);
    return raw.map(normalizeRide);
  }, [data]);

  const groups = useMemo(() => {
    const map = new Map<string, Ride[]>();
    filtered.forEach((r) => {
      const key = r.monthGroup;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries());
  }, [filtered]);

  if (selected) {
    return (
      <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
        <RideDetail ride={selected} onBack={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="font-outfit flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-[26px] font-extrabold text-[#1F2937]">
              Ride History
            </h1>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
            >
              <SlidersHorizontal size={18} className="text-[#1F2937]" />
            </button>
          </div>

          {isLoading ? (
            <p className="mt-16 text-center text-sm text-[#9AA5B8]">
              Loading rides…
            </p>
          ) : isError ? (
            <div className="mt-16 flex flex-col items-center text-center">
              <p className="text-base font-semibold text-[#1F2937]">
                Couldn't load ride history
              </p>
              <p className="mt-1 text-sm text-[#9AA5B8]">
                {(error as Error)?.message}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-4 rounded-full bg-[#6E43A3] px-6 py-2.5 text-sm font-bold text-white"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-16 flex flex-col items-center text-center">
              <p className="text-base font-semibold text-[#1F2937]">
                No rides found
              </p>
              <p className="mt-1 text-sm text-[#9AA5B8]">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {groups.map(([month, rides]) => (
                <div key={month || "recent"}>
                  {month && (
                    <div className="mb-3 flex items-center gap-3">
                      <span className="h-px flex-1 bg-gray-200" />
                      <span className="shrink-0 text-sm font-bold text-[#1F2937]">
                        {month}
                      </span>
                      <span className="h-px flex-1 bg-gray-200" />
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    {rides.map((r) => (
                      <RideRow key={r.id} ride={r} onOpen={setSelected} />
                    ))}
                  </div>
                </div>
              ))}
              {hasNextPage && (
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="mx-auto mb-2 rounded-full bg-[#F1F2F5] px-6 py-2.5 text-sm font-semibold text-[#4B5768] disabled:opacity-60"
                >
                  {isFetchingNextPage ? "Loading…" : "Load more"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <DriverBottomNav
        active="rides"
        onChange={(tab) => {
          if (tab === "home") navigate("/driver/home");
          if (tab === "earnings") navigate("/driver/earnings");
          if (tab === "account") navigate("/driver/account");
        }}
      />

      <FilterSheet
        open={filterOpen}
        status={status}
        startDate={startDate}
        endDate={endDate}
        onChangeStatus={setStatus}
        onChangeStart={setStartDate}
        onChangeEnd={setEndDate}
        onApply={() => {
          setAppliedStatus(status);
          setAppliedStart(startDate);
          setAppliedEnd(endDate);
          setFilterOpen(false);
        }}
        onReset={() => {
          setStatus("all");
          setStartDate("");
          setEndDate("");
          setAppliedStatus("all");
          setAppliedStart("");
          setAppliedEnd("");
        }}
        onClose={() => setFilterOpen(false)}
      />
    </div>
  );
}
