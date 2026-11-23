import { EM_DASH, formatDateLabel, formatNaira, humanize } from "@/lib/format";
import { formatRideFare, koboToNaira } from "@/lib/rides";
import type { StatusTone } from "@/components/ui/StatusPill";
import {
  rideCategoryDisplay,
  rideStatusDisplay,
  paymentStatusDisplay,
} from "@/types/rides";
import {
  SCHEDULED_STATUS_TONE,
} from "@/types/scheduled-rides";
import type { ScheduledRide } from "@/types/scheduled-rides";
import type {
  DetailItem,
  RideDetailsModel,
  TimelineStep,
} from "@/types/ride-details";
import type {
  RideOverviewResponse,
  RidePaymentResponse,
  RideTimelineEntry,
} from "@/types/rides-api";

const SCHEDULED_STEPS = [
  "Booking created",
  "Driver assigned",
  "Pickup scheduled",
  "Trip in progress",
  "Trip completed",
];

const NOT_ASSIGNED = "Not assigned";

function buildScheduledTimeline(s: ScheduledRide): TimelineStep[] {
  if (s.status === "Cancelled") {
    return [
      { label: SCHEDULED_STEPS[0], state: "done" },
      { label: "Booking cancelled", state: "danger" },
    ];
  }

  if (s.status === "Pending Assignment") {
    return [
      { label: SCHEDULED_STEPS[0], state: "done" },
      {
        label: SCHEDULED_STEPS[1],
        state: "current",
        tag: { tone: "warning" as const, label: "Pending assignment" },
      },
      { label: SCHEDULED_STEPS[2], state: "upcoming" },
      { label: SCHEDULED_STEPS[3], state: "upcoming" },
      { label: SCHEDULED_STEPS[4], state: "upcoming" },
    ];
  }

  return [
    { label: SCHEDULED_STEPS[0], state: "done" },
    { label: SCHEDULED_STEPS[1], state: "done" },
    {
      label: SCHEDULED_STEPS[2],
      state: "current",
      tag: { tone: "brand" as const, label: s.whenLabel },
    },
    { label: SCHEDULED_STEPS[3], state: "upcoming" },
    { label: SCHEDULED_STEPS[4], state: "upcoming" },
  ];
}

export function buildScheduledRideDetails(
  s: ScheduledRide,
): RideDetailsModel {
  const statusPill = {
    tone: SCHEDULED_STATUS_TONE[s.status],
    label: s.status,
  };
  const fare = formatNaira(s.estimatedFare);

  return {
    id: s.id,
    title: s.passenger.name,
    from: s.pickup,
    to: s.destination,
    distanceKm: s.distanceKm,
    durationMin: s.durationMin,
    info: [
      { label: "Passenger", value: s.passenger.name },
      { label: "Driver", value: s.driverName ?? NOT_ASSIGNED },
      { label: "Vehicle", value: s.vehicle },
      { label: "Category", value: s.category },
      { label: "Estimated fare", value: fare },
      { label: "Scheduled for", value: s.whenLabel },
      {
        label: "Booking status",
        value: s.status,
        pill: statusPill,
      },
    ],
    timeline: buildScheduledTimeline(s),
    payment: [
      { label: "Estimated fare", value: fare },
      { label: "Scheduled for", value: s.whenLabel },
      {
        label: "Booking status",
        value: s.status,
        pill: statusPill,
      },
    ],
    supportEmptyText: "No support tickets for this booking.",
  };
}
const TERMINAL_RIDE_STATUSES = new Set(["paid", "cancelled", "no_drivers_found"]);

function buildTimelineSteps(
  entries: RideTimelineEntry[] | null | undefined,
  rideStatus: string,
): TimelineStep[] {
  const list = Array.isArray(entries) ? entries : [];
  const terminal = TERMINAL_RIDE_STATUSES.has(rideStatus);
  if (list.length === 0) {
    return [{ label: "No timeline events", state: "upcoming" }];
  }
  return list.map((entry, index) => {
    const state = index < list.length - 1 ? "done" : terminal ? "done" : "current";
    let tag: { tone: StatusTone; label: string } | undefined;
    if (state === "current") {
      if (rideStatus === "payment_pending") {
        tag = { tone: "warning", label: "Payment pending" };
      } else if (rideStatus === "driver_en_route") {
        tag = { tone: "info", label: "Driver en route" };
      } else if (rideStatus === "ride_in_progress") {
        tag = { tone: "info", label: "Trip in progress" };
      }
    }
    return {
      label: humanize(entry.event),
      state,
      tag,
    };
  });
}

interface LiveRideDetailsInput {
  overview: RideOverviewResponse | null;
  timelineEntries: RideTimelineEntry[] | null;
  payment: RidePaymentResponse | null;
}

export function buildLiveRideDetails(input: LiveRideDetailsInput): RideDetailsModel {
  const { overview, timelineEntries, payment } = input;
  const passenger = overview?.passenger ?? null;
  const driver = overview?.driver ?? null;
  const vehicle = overview?.vehicle ?? null;
  const route = overview?.route ?? null;
  const fb = overview?.fareBreakdown ?? null;
  const summary = payment?.summary ?? null;
  const transactions = payment?.transactions ?? null;
  const rideStatus = overview?.rideStatus ?? "";

  const title = passenger ? passenger.name : EM_DASH;
  const from = route?.pickup?.address ?? null;
  const to = route?.dropoff?.address ?? null;
  const distanceKm = typeof route?.distanceKm === "number" ? route.distanceKm : 0;
  const durationMin = typeof route?.durationMin === "number" ? route.durationMin : 0;
  const fare = fb?.total ?? null;

  const info: DetailItem[] = [
    { label: "Passenger", value: passenger?.name ?? null },
    { label: "Driver", value: driver?.name ?? null },
    {
      label: "Vehicle",
      value: vehicle ? `${vehicle.model} • ${vehicle.plateNumber}` : null,
    },
    { label: "Category", value: rideCategoryDisplay(overview?.category ?? null) },
    { label: "Fare", value: formatRideFare(fare) },
    {
      label: "Distance",
      value: distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : null,
    },
    {
      label: "Duration",
      value: durationMin > 0 ? `${durationMin} min` : null,
    },
    {
      label: "Payment status",
      value: overview?.paymentMethod ?? null,
      pill: paymentStatusDisplay(overview?.paymentMethod ?? null),
    },
    {
      label: "Ride status",
      value: rideStatus,
      pill: rideStatusDisplay(rideStatus),
    },
    {
      label: "Date",
      value: summary?.paidAt ? formatDateLabel(summary.paidAt) : null,
    },
  ];

  const timeline = buildTimelineSteps(timelineEntries, rideStatus);

  const paymentItems: DetailItem[] = [
    { label: "Fare", value: formatRideFare(summary?.finalFare ?? null) },
    { label: "Payment method", value: summary?.paymentMethod ?? null },
    { label: "Paid at", value: formatDateLabel(summary?.paidAt ?? null) },
    { label: "Platform commission", value: formatRideFare(summary?.platformCommission ?? null) },
    { label: "Driver earnings", value: formatRideFare(summary?.driverEarnings ?? null) },
    { label: "Cancellation fee", value: formatRideFare(summary?.cancellationFee ?? null) },
    { label: "Promo discount", value: formatRideFare(summary?.promoDiscount ?? null) },
  ];
  const lastTx =
    Array.isArray(transactions) && transactions.length > 0
      ? transactions[transactions.length - 1]
      : null;
  if (lastTx) {
    paymentItems.push({
      label: "Transaction",
      value: `${formatRideFare(koboToNaira(lastTx.amount))} • ${humanize(
        lastTx.status ?? null,
      )}`,
    });
  }

  return {
    id: overview?.id ?? "",
    title,
    from: from ?? "",
    to: to ?? "",
    distanceKm,
    durationMin,
    info,
    timeline,
    payment: paymentItems,
    supportEmptyText: "No support tickets for this ride.",
  };
}

