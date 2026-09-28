import {
  SlidersHorizontal,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import PassengerBottomNav from "../../../components/passenger/PassengerBottomNav";

import TripCard from "../../../components/passenger/trips/TripCard";

import TripFilterSheet, {
  type TripFilters,
} from "../../../components/passenger/trips/TripFilterSheet";

import {
  passengerTrips,
} from "../../../data/passengerTrips";

import type {
  PassengerTrip,
} from "../../../types/passengerTrip";

import {
  usePassengerRide,
} from "../../../context/PassengerRideContext";

import {
  useNavigate,
} from "react-router-dom";

export default function PassengerActivity() {
  const navigate = useNavigate();

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
  ] = useState<TripFilters>({
    status: "all",
    startDate: "",
    endDate: "",
  });

  const filteredTrips =
    useMemo(() => {
      return passengerTrips.filter(
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
    }, [filters]);

  const rebook = (
    trip: PassengerTrip,
  ) => {
    setPickup(trip.pickup);
    setDestination(
      trip.destination,
    );

    setRideStatus("selecting");

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
      >((groups, trip) => {
        const month =
          new Intl.DateTimeFormat(
            "en-US",
            {
              month: "long",
              year: "numeric",
            },
          ).format(
            new Date(
              `${trip.date}T12:00:00`,
            ),
          );

        if (!groups[month]) {
          groups[month] = [];
        }

        groups[month].push(
          trip,
        );

        return groups;
      }, {});
    }, [filteredTrips]);

  return (
    <div className="min-h-[100dvh] bg-[#F8F8FA] pb-[96px]">
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
          <h1
            className="
              text-[22px]
              font-semibold
              text-[#302B34]
            "
          >
            Activity
          </h1>

          <button
            type="button"
            onClick={() =>
              setFiltersOpen(true)
            }
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              bg-white
              text-[#625C66]
              shadow-[0_4px_18px_rgba(30,20,38,0.08)]
            "
          >
            <SlidersHorizontal
              size={19}
            />
          </button>
        </div>
      </header>

      <main
        className="
          mx-auto
          w-full
          max-w-[680px]
          px-5
          py-5
        "
      >
        {Object.entries(
          grouped,
        ).map(
          ([
            month,
            trips,
          ]) => (
            <section
              key={month}
              className="mb-7"
            >
              <div
                className="
                  mb-4
                  flex
                  items-center
                  gap-4
                "
              >
                <span className="h-px flex-1 bg-[#E5E0E8]" />

                <h2
                  className="
                    text-[14px]
                    font-semibold
                    text-[#504A54]
                  "
                >
                  {month}
                </h2>

                <span className="h-px flex-1 bg-[#E5E0E8]" />
              </div>

              <div className="space-y-3">
                {trips.map(
                  (trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
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

        {filteredTrips.length ===
          0 && (
          <div className="py-20 text-center">
            <h2 className="text-[18px] font-semibold text-[#302B34]">
              No trips found
            </h2>

            <p className="mt-2 text-[14px] text-[#918B95]">
              Try changing your
              filters.
            </p>
          </div>
        )}
      </main>

      <PassengerBottomNav />

      <TripFilterSheet
        open={filtersOpen}
        value={filters}
        onClose={() =>
          setFiltersOpen(false)
        }
        onApply={setFilters}
      />
    </div>
  );
}