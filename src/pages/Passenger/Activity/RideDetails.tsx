
"use client";

import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  CreditCard,
  HelpCircle,
  MapPin,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Route,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import TripRoutePreview from "../../../components/passenger/trips/TripRoutePreview";

import { usePassengerRide } from "../../../context/PassengerRideContext";

import { usePassengerRideHistoryItem } from "../../../hooks/passenger/usePassengerRideHistory";

import {
  passengerPaymentApi,
} from "../../../api/passenger/payment";
import type {
  PassengerRideResponse,
} from "../../../api/passenger/rides";

import {
  useRideDriverDetails,
} from "../../../hooks/passenger/useRideDriverDetails";

/* =========================================================
   TYPES
========================================================= */

type Location = {
  lat: number;
  lng: number;
  address: string;
};

type RideTimestamps = {
  requestedAt?: string | null;
  rideStartedAt?: string | null;
  rideCompletedAt?: string | null;
  paidAt?: string | null;
  cancelledAt?: string | null;
};

type FareBreakdown = {
  baseFare?: number | null;
  distanceCharge?: number | null;
  timeCharge?: number | null;
  bookingFee?: number | null;
  surgeCharge?: number | null;
  waitingFee?: number | null;
  cancellationFee?: number | null;
  approvedFees?: number | null;
  discount?: number | null;
  promoDiscount?: number | null;
  total?: number | null;
};

type RideDetailsData = {
  id: string;
  status: string;
  rideType?: string;
  paymentMethod?: string;

  driverId?: string | null;

  driver?: {
    firstName?: string;
    lastName?: string;
    photo?: string | null;
    rating?: number | null;
  } | null;

  vehicle?: {
    model?: string;
    make?: string;
    color?: string;
    plateNumber?: string;
    category?: string;
  } | null;

  pickup: Location;
  dropoff: Location;

  estimatedFare?: number | null;
  finalFare?: number | null;

  estimatedDistanceKm?: number | null;
  actualDistanceKm?: number | null;

  estimatedDurationMin?: number | null;
  actualDurationMin?: number | null;

  cancellationFee?: number | null;
  cancellationReason?: string | null;
  cancelledBy?: string | null;

  fareBreakdown?: FareBreakdown | null;
  timestamps?: RideTimestamps | null;

  createdAt?: string;
};

/* =========================================================
   HELPERS
========================================================= */

const COMPLETED_STATUSES = new Set([
  "ride_completed",
  "payment_pending",
  "paid",
  "closed",
]);

function normalizeStatus(status?: string) {
  return (status ?? "").trim().toLowerCase();
}

function isCompletedRide(status?: string) {
  return COMPLETED_STATUSES.has(normalizeStatus(status));
}

function getStatusInfo(status?: string) {
  const value = normalizeStatus(status);

  if (value === "paid" || value === "closed") {
    return {
      label: "Completed",
      description: "Your journey has been completed.",
      className: "bg-[#EAF8EF] text-[#23844D]",
      icon: CheckCircle2,
    };
  }

  if (isCompletedRide(value)) {
    return {
      label: "Completed",
      description: "Your journey has ended.",
      className: "bg-[#EAF8EF] text-[#23844D]",
      icon: CheckCircle2,
    };
  }

  if (value === "cancelled") {
    return {
      label: "Cancelled",
      description: "This ride was cancelled.",
      className: "bg-[#FFF0F0] text-[#D54F4F]",
      icon: XCircle,
    };
  }

  if (value === "no_drivers_found") {
    return {
      label: "No driver found",
      description: "No driver was available for this request.",
      className: "bg-[#FFF5E5] text-[#B98025]",
      icon: AlertCircle,
    };
  }

  return {
    label: value
      ? value.replaceAll("_", " ")
      : "Unknown",
    description: "View the latest details of this ride.",
    className: "bg-[#F2EBF8] text-[#7442AD]",
    icon: Clock3,
  };
}

function money(amount?: number | null) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(minutes?: number | null) {
  if (minutes == null) return "—";

  const rounded = Math.max(0, Math.round(minutes));

  if (rounded < 60) return `${rounded} min`;

  const hours = Math.floor(rounded / 60);
  const remaining = rounded % 60;

  return remaining
    ? `${hours} hr ${remaining} min`
    : `${hours} hr`;
}

function asRideDetailsData(value: unknown): RideDetailsData | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  // Supports either a direct ride object or a { data: ride } wrapper.
  const record = value as Record<string, unknown>;

  const candidate =
    record.data &&
    typeof record.data === "object"
      ? record.data
      : value;

  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const ride = candidate as Partial<RideDetailsData>;

  if (
    typeof ride.id !== "string" ||
    typeof ride.status !== "string" ||
    !ride.pickup ||
    !ride.dropoff
  ) {
    return null;
  }

  return ride as RideDetailsData;
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-[#F0EDF2] bg-white p-5 shadow-[0_5px_25px_rgba(30,20,38,0.04)]">
      <h2 className="text-[17px] font-semibold text-[#302B34]">
        {title}
      </h2>

      <div className="mt-4">{children}</div>
    </section>
  );
}

function DetailRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: React.ReactNode;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-[13px] text-[#96909A]">
        {label}
      </span>

      <span
        className={`text-right text-[13px] ${
          emphasized
            ? "font-bold text-[#302B34]"
            : "font-medium text-[#504A54]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function PageState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-auto max-w-[400px] px-6 py-24 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F2EBF8] text-[#7442AD]">
        <AlertCircle size={28} />
      </div>

      <h2 className="mt-5 text-xl font-semibold text-[#302B34]">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#96909A]">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-[13px] bg-[#7442AD] px-6 text-sm font-semibold text-white"
        >
          <RefreshCw size={16} />
          Try again
        </button>
      )}
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-44 rounded-[20px] bg-[#EEEAF0]" />
      <div className="h-24 rounded-[20px] bg-[#EEEAF0]" />
      <div className="h-40 rounded-[20px] bg-[#EEEAF0]" />
      <div className="h-52 rounded-[20px] bg-[#EEEAF0]" />
    </div>
  );
}

/* =========================================================
   RIDE DETAILS PAGE
========================================================= */

export default function RideDetails() {
  const navigate = useNavigate();
  const { rideId } = useParams<{ rideId: string }>();

  const {
    setPickup,
    setDestination,
    setRideStatus,
  } = usePassengerRide();

  /* -------------------------------------------------------
     FETCH RIDE DETAILS
  ------------------------------------------------------- */

  const rideQuery = usePassengerRideHistoryItem(rideId);

  const ride = useMemo(
    () => asRideDetailsData(rideQuery.data),
    [rideQuery.data],
  );

//   const {
//   ride: contextRide,
// } = usePassengerRide();

// const {
//   driver: driverForCard,
//   loading: driverLoading,
//   error: driverError,
// } = useRideDriverDetails(
//   rideId,
//   (rideQuery.data ?? null) as PassengerRideResponse | null,
//   contextRide.driver,
// );

const {
  driver: driverForCard,
  loading: driverLoading,
  error: driverError,
} = useRideDriverDetails(
  rideId,
  ride as PassengerRideResponse | null,
  null,
);

  const completed = isCompletedRide(ride?.status);

  /* -------------------------------------------------------
     FETCH AUTHORITATIVE PAYMENT STATE
  ------------------------------------------------------- */

  const paymentQuery = useQuery({
    queryKey: ["passenger", "ride-payment", rideId],

    queryFn: () => {
      if (!rideId) {
        throw new Error("Ride ID is required.");
      }

      return passengerPaymentApi.getPayment(rideId);
    },

    enabled: Boolean(rideId && ride && completed),

    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });

  const payment = paymentQuery.data;

  const paid = payment?.paid === true;

  /* -------------------------------------------------------
     DERIVED DATA
  ------------------------------------------------------- */

  const statusInfo = getStatusInfo(ride?.status);
  const StatusIcon = statusInfo.icon;

  const fare =
    ride?.finalFare ??
    ride?.fareBreakdown?.total ??
    ride?.estimatedFare ??
    0;

  const isCash =
    (payment?.bookedMethod ??
      ride?.paymentMethod ??
      "").toLowerCase() === "cash";

  const isCard =
    (payment?.bookedMethod ??
      ride?.paymentMethod ??
      "").toLowerCase() === "card";

  const paymentNeedsAction =
    completed &&
    !paid &&
    isCard &&
    payment?.payable === true;

  const paymentStatusLabel = paid
    ? "Paid"
    : paymentQuery.isError
      ? "Payment status unavailable"
      : paymentQuery.isLoading
        ? "Checking payment"
        : paymentNeedsAction
          ? "Payment required"
          : isCash
            ? "Awaiting cash confirmation"
            : "Payment pending";

  const paymentStatusColor = paid
    ? "text-[#23844D] bg-[#EAF8EF]"
    : paymentQuery.isError
      ? "text-[#D54F4F] bg-[#FFF0F0]"
      : "text-[#B98025] bg-[#FFF5E5]";

      const driverName =
  [
    driverForCard?.firstName,
    // Add lastName only if your hook exposes it.
  ]
    .filter(Boolean)
    .join(" ") || "Your driver";

const driverPhoto = driverForCard?.photo || "";

const vehicleName =
  [
    driverForCard?.vehicle?.color,
    driverForCard?.vehicle?.make,
    driverForCard?.vehicle?.model,
  ]
    .filter(Boolean)
    .join(" ") || "Vehicle details updating";

const vehiclePlate =
  driverForCard?.vehicle?.plateNumber || "";



  const distance =
    ride?.actualDistanceKm ??
    ride?.estimatedDistanceKm;

  const duration =
    ride?.actualDurationMin ??
    ride?.estimatedDurationMin;

  const requestedAt =
    ride?.timestamps?.requestedAt ??
    ride?.createdAt;

  /* -------------------------------------------------------
     ACTIONS
  ------------------------------------------------------- */

  const rebook = () => {
    if (!ride) return;

    setPickup({
      label: ride.pickup.address,
      address: ride.pickup.address,
      coordinates: {
        lat: ride.pickup.lat,
        lng: ride.pickup.lng,
      },
    });

    setDestination({
      label: ride.dropoff.address,
      address: ride.dropoff.address,
      coordinates: {
        lat: ride.dropoff.lat,
        lng: ride.dropoff.lng,
      },
    });

    setRideStatus("selecting");

    navigate("/passenger/ride/select");
  };

 const goToPayment = () => {
  if (!rideId) return;

  navigate(`/passenger/activity/${rideId}/payment`);
};

 const goToReceipt = () => {
  if (!rideId || !paid) return;

  navigate(
    `/passenger/activity/${rideId}/receipt`,
  );
};

  const refreshDetails = () => {
    void rideQuery.refetch();

    if (completed) {
      void paymentQuery.refetch();
    }
  };

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <div className="min-h-[100dvh] bg-[#F8F8FA] pb-10">
      {/* HEADER */}

      <header className="sticky top-0 z-[700] border-b border-black/[0.03] bg-white/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex h-[52px] w-full max-w-[680px] items-center">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/passenger/activity")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#302B34] hover:bg-[#F4F1F6]"
            aria-label="Back to activity"
          >
            <ArrowLeft size={21} />
          </motion.button>

          <h1 className="flex-1 pr-11 text-center text-[21px] font-semibold tracking-[-0.02em] text-[#302B34]">
            Ride Details
          </h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[680px] space-y-4 px-5 pb-12 pt-5 sm:px-7">
        {!rideId ? (
          <PageState
            title="Ride not found"
            message="This ride link is missing an ID."
          />
        ) : rideQuery.isPending ? (
          <DetailsSkeleton />
        ) : rideQuery.isError ? (
          <PageState
            title="Unable to load ride"
            message="We couldn't retrieve the details of this ride."
            onRetry={refreshDetails}
          />
        ) : !ride ? (
          <PageState
            title="Ride details unavailable"
            message="The server returned an incomplete ride record."
            onRetry={refreshDetails}
          />
        ) : (
          <>
            {/* STATUS SUMMARY */}

            <section className="rounded-[20px] border border-[#F0EDF2] bg-white p-5 shadow-[0_5px_25px_rgba(30,20,38,0.04)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-medium text-[#96909A]">
                    Ride summary
                  </p>

                  <h2 className="mt-1 text-[20px] font-semibold text-[#302B34]">
                    {completed
                      ? "Your journey"
                      : "Ride request"}
                  </h2>
                </div>

                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold ${statusInfo.className}`}
                >
                  <StatusIcon size={14} />
                  {statusInfo.label}
                </span>
              </div>

              <p className="mt-3 text-[13px] text-[#96909A]">
                {statusInfo.description}
              </p>

              <div className="mt-4 flex items-center gap-2 border-t border-[#F1EDF3] pt-4 text-[12px] text-[#77717C]">
                <CalendarDays size={15} />
                {formatDate(requestedAt)}
                <span>•</span>
                {formatTime(requestedAt)}
              </div>
            </section>

            {/* ROUTE PREVIEW */}

            <div className="overflow-hidden rounded-[20px]">
              <TripRoutePreview
                status={
                  completed
                    ? "completed"
                    : normalizeStatus(ride.status) === "cancelled"
                      ? "cancelled"
                      : normalizeStatus(ride.status) === "no_drivers_found"
                        ? "no_drivers_found"
                        : "unknown"
                }
              />
            </div>

            {/* ROUTE */}

            <Section title="Your route">
              <div className="space-y-0">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center w-5 shrink-0">
                    <span className="mt-1 h-3 w-3 rounded-full border-[3px] border-[#F4B72D] bg-white" />
                    <span className="mt-2 h-14 border-l-2 border-dotted border-[#D9D3DD]" />
                  </div>

                  <div className="flex-1 min-w-0 pb-5">
                    <p className="text-[12px] text-[#96909A]">
                      Pickup
                    </p>

                    <p className="mt-1 text-[14px] font-medium leading-6 text-[#302B34]">
                      {ride.pickup.address}
                    </p>

                    <p className="mt-1 text-[12px] text-[#96909A]">
                      {formatTime(
                        ride.timestamps?.rideStartedAt ??
                          requestedAt,
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex justify-center w-5 shrink-0">
                    <span className="mt-1 h-3 w-3 rounded-full border-[3px] border-[#7442AD] bg-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[#96909A]">
                      Destination
                    </p>

                    <p className="mt-1 text-[14px] font-medium leading-6 text-[#302B34]">
                      {ride.dropoff.address}
                    </p>

                    {ride.timestamps?.rideCompletedAt && (
                      <p className="mt-1 text-[12px] text-[#96909A]">
                        Arrived at{" "}
                        {formatTime(
                          ride.timestamps.rideCompletedAt,
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#F1EDF3] pt-4">
                <div className="rounded-[13px] bg-[#F8F6FA] p-3">
                  <div className="flex items-center gap-2 text-[#96909A]">
                    <Route size={15} />
                    <span className="text-[12px]">
                      Distance
                    </span>
                  </div>

                  <p className="mt-2 text-[15px] font-semibold text-[#302B34]">
                    {distance != null
                      ? `${distance.toFixed(1)} km`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-[13px] bg-[#F8F6FA] p-3">
                  <div className="flex items-center gap-2 text-[#96909A]">
                    <Clock3 size={15} />
                    <span className="text-[12px]">
                      Duration
                    </span>
                  </div>

                  <p className="mt-2 text-[15px] font-semibold text-[#302B34]">
                    {formatDuration(duration)}
                  </p>
                </div>
              </div>
            </Section>

            {/* DRIVER / VEHICLE */}

            {ride.driverId && (
  <Section title="Driver & vehicle">
    <div className="flex items-center gap-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EEE7F5] text-[#7442AD]">
        {driverPhoto ? (
          <img
            src={driverPhoto}
            alt={driverName}
            className="object-cover w-full h-full"
          />
        ) : (
          <CarFront size={25} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[16px] font-semibold text-[#302B34]">
          {driverLoading && !driverForCard
            ? "Loading driver..."
            : driverName}
        </p>

        <p className="mt-1 text-[13px] text-[#96909A]">
          Your assigned driver
        </p>
      </div>
    </div>

    <div className="my-4 h-px bg-[#EEEAF0]" />

    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#F4F2F5] text-[#514B55]">
        <CarFront size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-[#302B34]">
          {vehicleName}
        </p>

        {vehiclePlate && (
          <p className="mt-1 text-[13px] font-medium text-[#7442AD]">
            {vehiclePlate}
          </p>
        )}
      </div>
    </div>

    {driverError && !driverForCard && (
      <p className="mt-4 text-[12px] text-[#B98025]">
        Driver information is temporarily unavailable.
      </p>
    )}
  </Section>
)}

            {/* CANCELLATION */}

            {normalizeStatus(ride.status) === "cancelled" && (
              <Section title="Cancellation details">
                <div className="rounded-[14px] bg-[#FFF5F5] p-4">
                  <div className="flex items-center gap-2 text-[#D54F4F]">
                    <XCircle size={18} />
                    <span className="text-[14px] font-semibold">
                      Ride cancelled
                    </span>
                  </div>

                  <p className="mt-2 text-[13px] leading-6 text-[#806F73]">
                    {ride.cancellationReason ||
                      "No cancellation reason was provided."}
                  </p>
                </div>

                {ride.cancelledBy && (
                  <DetailRow
                    label="Cancelled by"
                    value={ride.cancelledBy}
                  />
                )}

                {ride.timestamps?.cancelledAt && (
                  <DetailRow
                    label="Cancelled at"
                    value={`${formatDate(
                      ride.timestamps.cancelledAt,
                    )}, ${formatTime(
                      ride.timestamps.cancelledAt,
                    )}`}
                  />
                )}

                {(ride.cancellationFee ?? 0) > 0 && (
                  <DetailRow
                    label="Cancellation fee"
                    value={money(ride.cancellationFee)}
                    emphasized
                  />
                )}
              </Section>
            )}

            {/* FARE */}

            <Section
              title={
                completed
                  ? "Fare breakdown"
                  : "Fare estimate"
              }
            >
              {ride.fareBreakdown ? (
                <>
                  <DetailRow
                    label="Base fare"
                    value={money(
                      ride.fareBreakdown.baseFare,
                    )}
                  />

                  <DetailRow
                    label="Distance charge"
                    value={money(
                      ride.fareBreakdown.distanceCharge,
                    )}
                  />

                  <DetailRow
                    label="Time charge"
                    value={money(
                      ride.fareBreakdown.timeCharge,
                    )}
                  />

                  <DetailRow
                    label="Booking fee"
                    value={money(
                      ride.fareBreakdown.bookingFee,
                    )}
                  />

                  {(ride.fareBreakdown.waitingFee ?? 0) > 0 && (
                    <DetailRow
                      label="Waiting fee"
                      value={money(
                        ride.fareBreakdown.waitingFee,
                      )}
                    />
                  )}

                  {(ride.fareBreakdown.surgeCharge ?? 0) > 0 && (
                    <DetailRow
                      label="Surge charge"
                      value={money(
                        ride.fareBreakdown.surgeCharge,
                      )}
                    />
                  )}

                  {(ride.fareBreakdown.discount ?? 0) > 0 && (
                    <DetailRow
                      label="Discount"
                      value={`-${money(
                        ride.fareBreakdown.discount,
                      )}`}
                    />
                  )}
                </>
              ) : (
                <p className="text-[13px] text-[#96909A]">
                  Detailed fare breakdown is unavailable.
                </p>
              )}

              <div className="mt-3 border-t border-[#EEEAF0] pt-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[15px] font-semibold text-[#302B34]">
                    {completed
                      ? "Final fare"
                      : "Estimated fare"}
                  </span>

                  <span className="text-[21px] font-bold text-[#7442AD]">
                    {money(fare)}
                  </span>
                </div>
              </div>
            </Section>

            {/* PAYMENT STATUS */}

            {completed && (
              <Section title="Payment details">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#F2EBF8] text-[#7442AD]">
                      {isCash ? (
                        <Banknote size={21} />
                      ) : (
                        <CreditCard size={21} />
                      )}
                    </div>

                    <div>
                      <p className="text-[14px] font-semibold text-[#302B34]">
                        {isCash
                          ? "Cash payment"
                          : isCard
                            ? "Card payment"
                            : "Payment"}
                      </p>

                      <p className="mt-1 text-[12px] text-[#96909A]">
                        {isCash
                          ? "Pay directly to the driver"
                          : "Electronic payment"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F1EDF3] pt-4">
                  <span className="text-[13px] text-[#96909A]">
                    Payment status
                  </span>

                  <span
                    className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${paymentStatusColor}`}
                  >
                    {paymentStatusLabel}
                  </span>
                </div>

                {paymentQuery.isError && (
                  <button
                    type="button"
                    onClick={() => void paymentQuery.refetch()}
                    className="mt-3 inline-flex items-center gap-2 text-[13px] font-semibold text-[#7442AD]"
                  >
                    <RefreshCw size={15} />
                    Retry payment check
                  </button>
                )}

                {paymentNeedsAction && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={goToPayment}
                    className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[14px] font-semibold text-white"
                  >
                    <CreditCard size={18} />
                    Complete Payment
                  </motion.button>
                )}

                {paid && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={goToReceipt}
                    className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#F2EBF8] text-[14px] font-semibold text-[#7442AD]"
                  >
                    <ReceiptText size={18} />
                    View Receipt
                  </motion.button>
                )}

                {isCash && !paid && !paymentQuery.isError && (
                  <p className="mt-4 rounded-[12px] bg-[#FFF8EA] p-3 text-[12px] leading-5 text-[#94702E]">
                    Cash payment confirmation is still pending.
                    Your receipt will be available after the
                    backend confirms payment.
                  </p>
                )}
              </Section>
            )}

            {/* ACTIONS */}

            <section className="pt-2 space-y-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={rebook}
                className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7442AD] text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(116,66,173,0.15)]"
              >
                <RotateCcw size={18} />
                Rebook this ride
              </motion.button>

              <button
                type="button"
                onClick={refreshDetails}
                disabled={rideQuery.isFetching}
                className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] border border-[#EAE4EE] bg-white text-[14px] font-semibold text-[#7442AD] disabled:opacity-60"
              >
                <RefreshCw
                  size={17}
                  className={
                    rideQuery.isFetching
                      ? "animate-spin"
                      : ""
                  }
                />
                Refresh ride details
              </button>
            </section>

            {/* RIDE REFERENCE */}

            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <div className="flex items-center gap-2 text-[#96909A]">
                <ShieldCheck size={15} />
                <span className="text-[12px]">
                  SurDrive ride record
                </span>
              </div>

              <p className="max-w-full break-all text-[11px] text-[#B0AAB4]">
                Ride ID: {ride.id}
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}


