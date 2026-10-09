import {
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import PassengerBottomNav from "../../../components/passenger/PassengerBottomNav";
import TripCard from "../../../components/passenger/trips/TripCard";
import TripFilterSheet, {
  type TripFilters,
} from "../../../components/passenger/trips/TripFilterSheet";

import {
  usePassengerRide,
} from "../../../context/PassengerRideContext";

import {
  usePassengerRideHistory,
} from "../../../hooks/passenger/usePassengerRideHistory";

import type {
  BackendRideStatus,
} from "../../../api/passenger/rides";

import type {
  PassengerTrip,
} from "../../../types/passengerTrip";

const defaultFilters: TripFilters = {
  status: "all",
  startDate: "",
  endDate: "",
};

/* ======================================================
   BACKEND TYPES
====================================================== */

type BackendLocation = {
  lat: number;
  lng: number;
  address: string;
};

type BackendFareBreakdown = {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  bookingFee: number;
  surgeMultiplier: number;
  surgeCharge: number;
  waitingFee: number;
  waitingMinutes: number;
  waitingGraceMin: number;
  cancellationFee: number;
  approvedFees: number;
  discount: number;
  promoDiscount: number;
  subtotal: number;
  total: number;
  isEstimate: boolean;
};

type BackendRideTimestamps = {
  requestedAt: string | null;
  searchingAt: string | null;
  driverAssignedAt: string | null;
  driverArrivedAt: string | null;
  rideStartedAt: string | null;
  rideCompletedAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
};

type BackendRide = {
  id: string;
  riderId: string;
  driverId: string | null;

  status: string;
  rideType: string;
  paymentMethod: string;

  pickup: BackendLocation;
  dropoff: BackendLocation;

  stops: unknown[];
  vehicle: unknown | null;

  estimatedDistanceKm: number | null;
  estimatedDurationMin: number | null;

  actualDistanceKm: number | null;
  actualDurationMin: number | null;

  estimatedFare: number | null;
  finalFare: number | null;

  cancellationFee: number | null;
  cancellationReason: string | null;
  cancelledBy: string | null;

  promoCode: string | null;
  promoDiscount: number;

  pricingVersion: string | null;

  fareBreakdown: BackendFareBreakdown | null;
  timestamps: BackendRideTimestamps;

  createdAt: string;
  updatedAt: string;
};

type RideHistoryResponse = {
  items: BackendRide[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/* ======================================================
   FILTER STATUS
====================================================== */

function getBackendStatus(
  status: TripFilters["status"],
): BackendRideStatus | undefined {
  if (status === "all") {
    return undefined;
  }

  if (status === "completed") {
    return "ride_completed";
  }

  if (status === "cancelled") {
    return "cancelled";
  }

  return undefined;
}

/* ======================================================
   RESPONSE
====================================================== */

function getHistoryResponse(
  response: unknown,
): RideHistoryResponse | null {
  if (
    !response ||
    typeof response !== "object"
  ) {
    return null;
  }

  const value =
    response as Partial<RideHistoryResponse>;

  if (!Array.isArray(value.items)) {
    return null;
  }

  return {
    items: value.items,
    total:
      typeof value.total === "number"
        ? value.total
        : value.items.length,
    page:
      typeof value.page === "number"
        ? value.page
        : 1,
    limit:
      typeof value.limit === "number"
        ? value.limit
        : value.items.length,
    totalPages:
      typeof value.totalPages === "number"
        ? value.totalPages
        : 1,
  };
}

/* ======================================================
   DATE HELPERS
====================================================== */

function getRideDate(
  ride: BackendRide,
) {
  const rawDate =
    ride.timestamps?.requestedAt ||
    ride.createdAt;

  if (!rawDate) {
    return {
      date: "",
      time: "",
    };
  }

  const value = new Date(rawDate);

  if (Number.isNaN(value.getTime())) {
    return {
      date: rawDate.slice(0, 10),
      time: "",
    };
  }

  const date = [
    value.getFullYear(),
    String(
      value.getMonth() + 1,
    ).padStart(2, "0"),
    String(
      value.getDate(),
    ).padStart(2, "0"),
  ].join("-");

  const time =
    new Intl.DateTimeFormat(
      "en-NG",
      {
        hour: "numeric",
        minute: "2-digit",
      },
    ).format(value);

  return {
    date,
    time,
  };
}

function formatTime(
  value?: string | null,
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-NG",
    {
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(date);
}

/* ======================================================
   PAYMENT METHOD
====================================================== */

function getPaymentMethod(
  method: string,
): PassengerTrip["payment"]["method"] {
  switch (method.toLowerCase()) {
    case "cash":
      return {
        id: "cash",
        type: "cash",
        label: "Cash",
      };

    case "card":
      return {
        id: "card",
        type: "card",
        label: "Card",
      };

    case "wallet":
      return {
        id: "wallet",
        type: "wallet",
        label: "Wallet",
      };

    default:
      return {
        id: method || "unknown",
        type: "wallet",
        label: method || "Payment",
      };
  }
}

/* ======================================================
   BACKEND STATUS -> UI STATUS

   IMPORTANT:
   Never treat an unknown backend status as completed.
====================================================== */

function getTripStatus(
  status: string,
): PassengerTrip["status"] {
  switch (status) {
    case "ride_completed":
      return "completed";

    case "cancelled":
      return "cancelled";

    case "no_drivers_found":
      return "no_drivers_found";

    default:
      return "unknown";
  }
}

/* ======================================================
   BACKEND -> PASSENGER TRIP
====================================================== */

function mapBackendRideToTrip(
  ride: BackendRide,
): PassengerTrip {
  const {
    date,
    time,
  } = getRideDate(ride);

  const completed =
    ride.status === "ride_completed";

  const fare =
    ride.finalFare ??
    ride.estimatedFare ??
    ride.fareBreakdown?.total ??
    0;

  const total =
    ride.fareBreakdown?.total ??
    fare;

  const distanceKm =
    ride.actualDistanceKm ??
    ride.estimatedDistanceKm;

  const durationMin =
    ride.actualDurationMin ??
    ride.estimatedDurationMin;

  /*
   * The history response currently returns
   * driverId/vehicle, but not a populated
   * driver object in the response we've received.
   *
   * Keep these values empty rather than inventing
   * driver information.
   */
  return {
    id: ride.id,

    status: getTripStatus(
      ride.status,
    ),

    pickup: {
      label: ride.pickup.address,
      address: ride.pickup.address,
      coordinates: {
        lat: ride.pickup.lat,
        lng: ride.pickup.lng,
      },
    },

    destination: {
      label: ride.dropoff.address,
      address: ride.dropoff.address,
      coordinates: {
        lat: ride.dropoff.lat,
        lng: ride.dropoff.lng,
      },
    },

    driver: {
      id: ride.driverId ?? "",
      firstName: "",
      rating: 0,
      totalTrips: 0,
      vehicle: {
        make: "",
        model: "",
        color: "",
        plateNumber: "",
      },
    },

    date,
    time,

    ...(distanceKm !== null
      ? {
          distance:
            `${distanceKm.toFixed(1)} km`,
        }
      : {}),

    ...(durationMin !== null
      ? {
          duration:
            `${Math.round(
              durationMin,
            )} min`,
        }
      : {}),

    payment: {
      fare,

      ...(ride.fareBreakdown
        ? {
            bookingFee:
              ride.fareBreakdown
                .bookingFee,
          }
        : {}),

      ...(ride.cancellationFee !==
      null
        ? {
            cancellationFee:
              ride.cancellationFee,
          }
        : {}),

      total,

      method: getPaymentMethod(
        ride.paymentMethod,
      ),
    },

    pickupTime:
      formatTime(
        ride.timestamps
          ?.rideStartedAt,
      ) ||
      formatTime(
        ride.timestamps
          ?.requestedAt,
      ) ||
      time,

    ...(completed &&
    ride.timestamps
      ?.rideCompletedAt
      ? {
          dropoffTime:
            formatTime(
              ride.timestamps
                .rideCompletedAt,
            ),
        }
      : {}),
  };
}

/* ======================================================
   ACTIVITY
====================================================== */

export default function PassengerActivity() {
  const navigate =
    useNavigate();

  const {
    setPickup,
    setDestination,
    setRideStatus,
  } = usePassengerRide();

  const [
    filtersOpen,
    setFiltersOpen,
  ] = useState(false);

  const [
    filters,
    setFilters,
  ] =
    useState<TripFilters>(
      defaultFilters,
    );

  const backendStatus =
    getBackendStatus(
      filters.status,
    );

  const historyQuery =
    usePassengerRideHistory({
      page: 1,
      limit: 50,

      status:
        backendStatus,

      startDate:
        filters.startDate ||
        undefined,

      endDate:
        filters.endDate ||
        undefined,
    });

  const history =
    useMemo(
      () =>
        getHistoryResponse(
          historyQuery.data,
        ),
      [historyQuery.data],
    );

  const trips =
    useMemo(() => {
      if (!history) {
        return [];
      }

      return history.items.map(
        mapBackendRideToTrip,
      );
    }, [history]);

  /*
   * The API already receives completed/cancelled
   * filters.
   *
   * Date filtering here gives the UI an extra
   * predictable safeguard.
   */
  const filteredTrips =
    useMemo(() => {
      return trips.filter(
        (trip) => {
          if (
            filters.status !==
              "all" &&
            trip.status !==
              filters.status
          ) {
            return false;
          }

          if (
            filters.startDate &&
            trip.date <
              filters.startDate
          ) {
            return false;
          }

          if (
            filters.endDate &&
            trip.date >
              filters.endDate
          ) {
            return false;
          }

          return true;
        },
      );
    }, [
      trips,
      filters,
    ]);

  const rebook = (
    trip: PassengerTrip,
  ) => {
    setPickup(
      trip.pickup,
    );

    setDestination(
      trip.destination,
    );

    setRideStatus(
      "selecting",
    );

    navigate(
      "/passenger/ride/select",
    );
  };

  const grouped =
    useMemo(() => {
      return filteredTrips.reduce<
        Record<
          string,
          PassengerTrip[]
        >
      >(
        (
          groups,
          trip,
        ) => {
          const date =
            new Date(
              `${trip.date}T12:00:00`,
            );

          const month =
            Number.isNaN(
              date.getTime(),
            )
              ? "Earlier"
              : new Intl.DateTimeFormat(
                  "en-US",
                  {
                    month: "long",
                    year: "numeric",
                  },
                ).format(date);

          if (!groups[month]) {
            groups[month] = [];
          }

          groups[month].push(
            trip,
          );

          return groups;
        },
        {},
      );
    }, [filteredTrips]);

  const hasFilters =
    filters.status !== "all" ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate);

  return (
    <div className="min-h-[100dvh] bg-[#F8F8FA] pb-[96px]">
      {/* HEADER */}

      <header
        className="
          sticky
          top-0
          z-[700]
          border-b
          border-black/[0.03]
          bg-white/95
          px-5
          py-4
          backdrop-blur-xl
        "
      >
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-[680px]
            items-center
            justify-between
          "
        >
          <div className="min-w-0">
            <h1
              className="
                text-[22px]
                font-semibold
                tracking-[-0.02em]
                text-[#302B34]
              "
            >
              Activity
            </h1>

            {!historyQuery.isLoading &&
              !historyQuery.isError &&
              history && (
                <p className="mt-0.5 text-[13px] text-[#96909A]">
                  {history.total === 1
                    ? "1 ride"
                    : `${history.total} rides`}
                </p>
              )}
          </div>

          <button
            type="button"
            onClick={() =>
              setFiltersOpen(
                true,
              )
            }
            className={`
              relative
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              border
              transition
              ${
                hasFilters
                  ? "border-[#7442AD]/20 bg-[#F2EBF8] text-[#7442AD]"
                  : "border-[#EEEAF0] bg-white text-[#4C4650]"
              }
            `}
            aria-label="Filter trips"
          >
            <SlidersHorizontal
              size={19}
            />

            {hasFilters && (
              <span className="absolute right-[7px] top-[7px] h-2 w-2 rounded-full bg-[#7442AD] ring-2 ring-white" />
            )}
          </button>
        </div>
      </header>

      {/* CONTENT */}

      <main
        className="
          mx-auto
          w-full
          max-w-[680px]
          px-5
          pb-8
          pt-5
          sm:px-7
        "
      >
        {/* LOADING */}

        {historyQuery.isLoading && (
          <ActivitySkeleton />
        )}

        {/* ERROR */}

        {historyQuery.isError && (
          <div
            className="
              mt-10
              rounded-[22px]
              border
              border-[#EEE8F1]
              bg-white
              px-6
              py-10
              text-center
              shadow-[0_8px_30px_rgba(45,30,55,0.04)]
            "
          >
            <div
              className="
                mx-auto
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-full
                bg-[#F5EDF9]
                text-[#7442AD]
              "
            >
              <AlertCircle
                size={22}
              />
            </div>

            <h2 className="mt-4 text-[18px] font-semibold text-[#302B34]">
              Unable to load rides
            </h2>

            <p className="mx-auto mt-2 max-w-[320px] text-[14px] leading-6 text-[#918B95]">
              We couldn't load your
              ride history. Please
              check your connection
              and try again.
            </p>

            <button
              type="button"
              onClick={() =>
                historyQuery.refetch()
              }
              disabled={
                historyQuery.isFetching
              }
              className="
                mx-auto
                mt-6
                flex
                h-12
                items-center
                justify-center
                gap-2
                rounded-[13px]
                bg-[#7442AD]
                px-6
                text-[15px]
                font-semibold
                text-white
                disabled:opacity-60
              "
            >
              <RefreshCw
                size={17}
                className={
                  historyQuery.isFetching
                    ? "animate-spin"
                    : ""
                }
              />

              Try again
            </button>
          </div>
        )}

        {/* EMPTY */}

        {!historyQuery.isLoading &&
          !historyQuery.isError &&
          filteredTrips.length ===
            0 && (
            <div className="py-20 text-center">
              <div
                className="
                  mx-auto
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  bg-[#F2EBF8]
                  text-[#7442AD]
                "
              >
                <SlidersHorizontal
                  size={22}
                />
              </div>

              <h2 className="mt-4 text-[18px] font-semibold text-[#302B34]">
                No trips found
              </h2>

              <p className="mx-auto mt-2 max-w-[300px] text-[14px] leading-6 text-[#918B95]">
                {hasFilters
                  ? "No rides match the filters you selected."
                  : "Your ride activity will appear here."}
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters(
                      defaultFilters,
                    )
                  }
                  className="mt-5 text-[14px] font-semibold text-[#7442AD]"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

        {/* TRIPS */}

        {!historyQuery.isLoading &&
          !historyQuery.isError &&
          filteredTrips.length >
            0 &&
          Object.entries(
            grouped,
          ).map(
            ([
              month,
              monthTrips,
            ]) => (
              <section
                key={month}
                className="mb-7"
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="h-px flex-1 bg-[#E5E0E8]" />

                  <h2 className="shrink-0 text-[14px] font-semibold text-[#504A54]">
                    {month}
                  </h2>

                  <span className="h-px flex-1 bg-[#E5E0E8]" />
                </div>

                <div className="space-y-3">
                  {monthTrips.map(
                    (trip) => (
                      <TripCard
                        key={
                          trip.id
                        }
                        trip={
                          trip
                        }
                        onRebook={
                          rebook
                        }
                      />
                    ),
                  )}
                </div>
              </section>
            ),
          )}
      </main>

      <PassengerBottomNav />

      <TripFilterSheet
        open={filtersOpen}
        value={filters}
        onClose={() =>
          setFiltersOpen(
            false,
          )
        }
        onApply={
          setFilters
        }
      />
    </div>
  );
}

/* ======================================================
   LOADING
====================================================== */

function ActivitySkeleton() {
  return (
    <div className="space-y-7">
      {[0, 1].map(
        (group) => (
          <section key={group}>
            <div className="flex items-center gap-4 mb-4">
              <span className="h-px flex-1 bg-[#E5E0E8]" />

              <div className="h-4 w-24 animate-pulse rounded-full bg-[#E8E3EB]" />

              <span className="h-px flex-1 bg-[#E5E0E8]" />
            </div>

            <div className="space-y-3">
              {[0, 1].map(
                (item) => (
                  <div
                    key={item}
                    className="
                      rounded-[20px]
                      border
                      border-[#F0EDF2]
                      bg-white
                      p-4
                    "
                  >
                    <div className="flex gap-3">
                      <div className="h-11 w-11 shrink-0 animate-pulse rounded-[13px] bg-[#EEEAF0]" />

                      <div className="flex-1">
                        <div className="h-3.5 w-[82%] animate-pulse rounded-full bg-[#E9E5EB]" />

                        <div className="mt-3 h-3.5 w-[68%] animate-pulse rounded-full bg-[#EEEAF0]" />

                        <div className="mt-4 h-3 w-[42%] animate-pulse rounded-full bg-[#F0EDF2]" />
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        ),
      )}
    </div>
  );
}

