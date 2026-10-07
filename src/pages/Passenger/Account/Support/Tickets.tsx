import {
  AlertCircle,
  FileSearch,
  ListFilter,
  LoaderCircle,
  RefreshCw,
  SquarePen,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import RideHeader from "../../../../components/passenger/ride/RideHeader";

import TicketCard from "../../../../components/passenger/support/TicketCard";

import TicketFiltersSheet from "../../../../components/passenger/support/TicketFiltersSheet";

import {
  passengerSupportApi,
} from "../../../../api/passenger/support";

import type {
  SupportTicket,
} from "../../../../api/passenger/support";

import type {
  TicketFilters,
} from "../../../../types/passengerSupport";

const initialFilters:
  TicketFilters = {
    status: "all",
    priority:
      "all",
  };

export default function Tickets() {
  const navigate =
    useNavigate();

  const [
    tickets,
    setTickets,
  ] =
    useState<
      SupportTicket[]
    >([]);

  const [
    total,
    setTotal,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    filters,
    setFilters,
  ] =
    useState<TicketFilters>(
      initialFilters,
    );

  const [
    filtersOpen,
    setFiltersOpen,
  ] = useState(false);

  const hasFilters =
    filters.status !==
      "all" ||
    filters.priority !==
      "all" ||
    Boolean(
      filters.startDate,
    ) ||
    Boolean(
      filters.endDate,
    );

  const loadTickets =
    useCallback(
      async (
        background =
          false,
      ) => {
        if (
          background
        ) {
          setRefreshing(
            true,
          );
        } else {
          setLoading(
            true,
          );
        }

        setError(
          null,
        );

        try {
          const response =
            await passengerSupportApi.getTickets(
              {
                ...(filters.status !==
                "all"
                  ? {
                      status:
                        filters.status,
                    }
                  : {}),

                ...(filters.priority !==
                "all"
                  ? {
                      priority:
                        filters.priority,
                    }
                  : {}),

                ...(filters.startDate
                  ? {
                      startDate:
                        filters.startDate,
                    }
                  : {}),

                ...(filters.endDate
                  ? {
                      endDate:
                        filters.endDate,
                    }
                  : {}),

                page: 1,
                limit: 30,
              },
            );

          /*
           * Do NOT re-sort.
           * Backend already returns
           * latest-message-first.
           */
          setTickets(
            response.items ??
              [],
          );

          setTotal(
            response.meta
              ?.total ?? 0,
          );
        } catch (requestError) {
          console.error(
            "Unable to load support tickets:",
            requestError,
          );

          setError(
            "We couldn't load your support tickets.",
          );
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
    [
      filters.status,
      filters.priority,
      filters.startDate,
      filters.endDate,
    ],
  );

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  return (
    <div className="min-h-[100dvh] bg-[#F8F7F9]">
      <div className="relative">
        <RideHeader
          title=""
          onBack={() =>
            navigate(
              "/passenger/account/support",
            )
          }
        />

        <div className="absolute z-20 flex gap-2 -translate-y-1/2 right-5 top-1/2">
          <button
            type="button"
            aria-label="Refresh tickets"
            disabled={
              refreshing
            }
            onClick={() =>
              void loadTickets(
                true,
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#625C66] shadow-[0_4px_18px_rgba(35,25,44,0.06)]"
          >
            <RefreshCw
              size={18}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
          </button>

          <button
            type="button"
            aria-label="Filter tickets"
            onClick={() =>
              setFiltersOpen(
                true,
              )
            }
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#625C66] shadow-[0_4px_18px_rgba(35,25,44,0.06)]"
          >
            <ListFilter
              size={18}
            />

            {hasFilters && (
              <span className="absolute right-[6px] top-[6px] h-2 w-2 rounded-full bg-[#7442AD]" />
            )}
          </button>
        </div>
      </div>

      <main className="mx-auto flex min-h-[calc(100dvh-80px)] w-full max-w-[680px] flex-col px-5 pb-[calc(100px+env(safe-area-inset-bottom))] pt-2 sm:px-7">
        <h1 className="text-[24px] font-semibold text-[#302B34]">
          Tickets
        </h1>

        <p className="mt-1 max-w-[600px] text-[16px] leading-6 text-[#918B95]">
          Track your issues
          and continue
          conversations with
          our support team.
        </p>

        {!loading &&
          !error &&
          total > 0 && (
            <p className="mt-4 text-[14px] text-[#918B95]">
              {total}{" "}
              {total === 1
                ? "ticket"
                : "tickets"}
            </p>
          )}

        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 pb-24">
            <LoaderCircle
              size={34}
              className="animate-spin text-[#7442AD]"
            />

            <p className="mt-4 text-[15px] text-[#918B95]">
              Loading
              tickets...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center flex-1 pb-24 text-center">
            <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#FFF0F0] text-[#B42318]">
              <AlertCircle
                size={42}
              />
            </div>

            <h2 className="mt-5 text-[20px] font-semibold text-[#302B34]">
              Unable to load
              tickets
            </h2>

            <p className="mt-2 max-w-[320px] text-[15px] leading-6 text-[#918B95]">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadTickets()
              }
              className="mt-5 rounded-[12px] bg-[#7442AD] px-5 py-3 text-[15px] font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : tickets.length >
          0 ? (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            className="mt-4 space-y-4"
          >
            {tickets.map(
              (
                ticket,
              ) => (
                <TicketCard
                  key={
                    ticket.id
                  }
                  ticket={
                    ticket
                  }
                  onClick={() =>
                    navigate(
                      `/passenger/account/support/tickets/${ticket.id}`,
                    )
                  }
                />
              ),
            )}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 pb-20 text-center">
            <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#F3EFF6] text-[#9A8DA5]">
              {hasFilters ? (
                <FileSearch
                  size={43}
                  strokeWidth={
                    1.6
                  }
                />
              ) : (
                <SquarePen
                  size={43}
                  strokeWidth={
                    1.6
                  }
                />
              )}
            </div>

            <h2 className="mt-5 text-[20px] font-semibold text-[#302B34]">
              No tickets
              found
            </h2>

            <p className="mx-auto mt-2 max-w-[320px] text-[15px] leading-6 text-[#918B95]">
              {hasFilters
                ? "No tickets match your current filters."
                : "Create a ticket whenever you need help."}
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={() =>
                  setFilters(
                    initialFilters,
                  )
                }
                className="mt-5 rounded-full bg-[#F1EFF2] px-5 py-2.5 text-[14px] font-medium text-[#7442AD]"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-[#EEEAF0] bg-white/95 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto max-w-[640px]">
          <motion.button
            type="button"
            whileTap={{
              scale:
                0.98,
            }}
            onClick={() =>
              navigate(
                "/passenger/account/support/tickets/new",
              )
            }
            className="h-[56px] w-full rounded-[13px] bg-[#7442AD] text-[16px] font-semibold text-white shadow-[0_8px_25px_rgba(116,66,173,0.24)]"
          >
            Raise a ticket
          </motion.button>
        </div>
      </div>

      <TicketFiltersSheet
        open={
          filtersOpen
        }
        filters={
          filters
        }
        onClose={() =>
          setFiltersOpen(
            false,
          )
        }
        onApply={(
          nextFilters,
        ) => {
          setFilters(
            nextFilters,
          );

          setFiltersOpen(
            false,
          );
        }}
        onReset={() => {
          setFilters(
            initialFilters,
          );

          setFiltersOpen(
            false,
          );
        }}
      />
    </div>
  );
}

