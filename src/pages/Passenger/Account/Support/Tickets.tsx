import {
  FileSearch,
  ListFilter,
  SquarePen,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import RideHeader from "../../../../components/passenger/ride/RideHeader";

import TicketCard from "../../../../components/passenger/support/TicketCard";

import TicketFiltersSheet from "../../../../components/passenger/support/TicketFiltersSheet";

import {
  usePassengerSupport,
} from "../../../../context/PassengerSupportContext";

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

  const {
    tickets,
  } =
    usePassengerSupport();

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
  ] =
    useState(false);

  const filteredTickets =
    useMemo(() => {
      return tickets.filter(
        (ticket) => {
          if (
            filters.status !==
              "all" &&
            ticket.status !==
              filters.status
          ) {
            return false;
          }

          if (
            filters.priority !==
              "all" &&
            ticket.priority !==
              filters.priority
          ) {
            return false;
          }

          const ticketDate =
            new Date(
              ticket.createdAt,
            );

          if (
            filters.startDate
          ) {
            const start =
              new Date(
                `${filters.startDate}T00:00:00`,
              );

            if (
              ticketDate <
              start
            ) {
              return false;
            }
          }

          if (
            filters.endDate
          ) {
            const end =
              new Date(
                `${filters.endDate}T23:59:59`,
              );

            if (
              ticketDate >
              end
            ) {
              return false;
            }
          }

          return true;
        },
      );
    }, [
      tickets,
      filters,
    ]);

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

  <button
    type="button"
    aria-label="Filter tickets"
    onClick={() =>
      setFiltersOpen(
        true,
      )
    }
    className="
      absolute
      right-5
      top-1/2
      z-20
      flex
      h-10
      w-10
      -translate-y-1/2
      items-center
      justify-center
      rounded-full
      bg-white
      text-[#625C66]
      shadow-[0_4px_18px_rgba(35,25,44,0.06)]
      transition
      hover:bg-[#F7F5F8]
    "
  >
    <ListFilter
      size={18}
      strokeWidth={1.8}
    />
  </button>
</div>

      <main
        className="
          mx-auto
          flex
          min-h-[calc(100dvh-80px)]
          w-full
          max-w-[680px]
          flex-col
          px-5
          pb-[calc(95px+env(safe-area-inset-bottom))]
          pt-2
          sm:px-7
        "
      >
        <h1 className="text-[22px] font-semibold text-[#302B34]">
          Tickets
        </h1>

        <p className="mt-1 max-w-[380px] text-[14px] leading-6 text-[#918B95]">
          Track issues,
          reopen cases, and
          raise new help
          requests.
        </p>

        {filteredTickets.length >
        0 ? (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            className="mt-6 space-y-4"
          >
            {filteredTickets.map(
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
          <div className="flex flex-1 flex-col items-center justify-center pb-20 text-center">
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

            <h2 className="mt-5 text-[18px] font-semibold text-[#302B34]">
              {hasFilters
                ? "No tickets found"
                : "No Open ticket"}
            </h2>

            <p className="mx-auto mt-2 max-w-[320px] text-[14px] leading-6 text-[#918B95]">
              {hasFilters
                ? "We couldn't find any tickets matching this filter. Try another status or raise a new request."
                : "Create a ticket when you need help"}
            </p>

            {hasFilters && (
              <div className="mt-4 rounded-full bg-[#F1EFF2] px-4 py-2 text-[12px] text-[#817A85]">
                Tip: Clear
                filters to see
                all tickets
              </div>
            )}
          </div>
        )}
      </main>

      <div
        className="
          fixed
          inset-x-0
          bottom-0
          z-[80]
          border-t
          border-[#EEEAF0]
          bg-white/95
          px-5
          pb-[calc(16px+env(safe-area-inset-bottom))]
          pt-3
          backdrop-blur-xl
        "
      >
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
            className="
              h-[56px]
              w-full
              rounded-[13px]
              bg-[#7442AD]
              text-[16px]
              font-semibold
              text-white
              shadow-[0_8px_25px_rgba(116,66,173,0.24)]
            "
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
        onApply={
          setFilters
        }
        onReset={() =>
          setFilters(
            initialFilters,
          )
        }
      />
    </div>
  );
}