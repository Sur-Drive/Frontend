import {
  AlertCircle,
  ChevronDown,
  LoaderCircle,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import RideHeader from "../../../../components/passenger/ride/RideHeader";

import {
  passengerSupportApi,
} from "../../../../api/passenger/support";

import type {
  SupportRide,
  SupportTicketPriority,
} from "../../../../api/passenger/support";

function formatRideDate(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-NG",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function getShortAddress(
  address: string,
) {
  return (
    address
      .split(",")[0]
      ?.trim() ||
    address
  );
}

export default function RaiseTicket() {
  const navigate =
    useNavigate();

  const [
    summary,
    setSummary,
  ] = useState("");

  const [
    rideId,
    setRideId,
  ] = useState("");

  const [
    priority,
    setPriority,
  ] =
    useState<
      | SupportTicketPriority
      | ""
    >("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    rides,
    setRides,
  ] =
    useState<
      SupportRide[]
    >([]);

  const [
    loadingRides,
    setLoadingRides,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  useEffect(() => {
    let active =
      true;

    const loadRides =
      async () => {
        try {
          const response =
            await passengerSupportApi.getRides();

          if (!active) {
            return;
          }

          setRides(
            response,
          );
        } catch (requestError) {
          console.error(
            "Unable to load support rides:",
            requestError,
          );
        } finally {
          if (active) {
            setLoadingRides(
              false,
            );
          }
        }
      };

    void loadRides();

    return () => {
      active =
        false;
    };
  }, []);

  const valid =
    summary.trim()
      .length > 0 &&
    summary.trim()
      .length <= 150 &&
    description.trim()
      .length > 0 &&
    description.trim()
      .length <= 2000;

  const submit =
    async () => {
      if (
        !valid ||
        submitting
      ) {
        return;
      }

      setSubmitting(
        true,
      );

      setError(
        null,
      );

      try {
        const ticket =
          await passengerSupportApi.createTicket(
            {
              subject:
                summary.trim(),

              description:
                description.trim(),

              ...(priority
                  ? {
                      priotity:
                        priority,
                    }
                  : {}),

              ...(rideId
                ? {
                    rideId,
                  }
                : {}),
            },
          );

        navigate(
          `/passenger/account/support/tickets/${ticket.id}`,
          {
            replace:
              true,
          },
        );
      } catch (requestError) {
        console.error(
          "Unable to create support ticket:",
          requestError,
        );

        setError(
          "We couldn't submit your ticket. Please try again.",
        );
      } finally {
        setSubmitting(
          false,
        );
      }
    };

  return (
    <div className="min-h-[100dvh] bg-[#F8F7F9]">
      <RideHeader
        title=""
        onBack={() =>
          navigate(
            "/passenger/account/support/tickets",
          )
        }
      />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-[calc(110px+env(safe-area-inset-bottom))] pt-2 sm:px-7">
        <h1 className="text-[24px] font-semibold text-[#302B34]">
          Raise a Support
          Ticket
        </h1>

        <p className="mt-2 text-[16px] leading-6 text-[#918B95]">
          Tell us what
          happened and our
          support team will
          help you.
        </p>

        {error && (
          <div className="mt-5 flex gap-3 rounded-[14px] bg-[#FFF0F0] p-4 text-[#B42318]">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <p className="text-[14px] leading-5">
              {error}
            </p>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <input
              type="text"
              maxLength={
                150
              }
              value={
                summary
              }
              onChange={(
                event,
              ) =>
                setSummary(
                  event
                    .target
                    .value,
                )
              }
              placeholder="Brief summary of your issue"
              className="h-[56px] w-full rounded-[13px] border-0 bg-[#F0EFF1] px-4 text-[16px] text-[#302B34] outline-none placeholder:text-[#AAA4AE] focus:ring-2 focus:ring-[#7442AD]/15"
            />

            <p className="mt-1 text-right text-[12px] text-[#AAA4AE]">
              {
                summary.length
              }
              /150
            </p>
          </div>

          <div className="relative">
            <select
              value={
                rideId
              }
              disabled={
                loadingRides
              }
              onChange={(
                event,
              ) =>
                setRideId(
                  event
                    .target
                    .value,
                )
              }
              className="h-[56px] w-full appearance-none rounded-[13px] border-0 bg-[#F0EFF1] px-4 pr-11 text-[16px] text-[#625C66] outline-none focus:ring-2 focus:ring-[#7442AD]/15 disabled:opacity-60"
            >
              <option value="">
                {loadingRides
                  ? "Loading rides..."
                  : "Select Ride (Optional)"}
              </option>

              {rides.map(
                (
                  ride,
                ) => (
                  <option
                    key={
                      ride.id
                    }
                    value={
                      ride.id
                    }
                  >
                    {formatRideDate(
                      ride.createdAt,
                    )}{" "}
                    —{" "}
                    {getShortAddress(
                      ride.dropoffAddress,
                    )}
                  </option>
                ),
              )}
            </select>

            {loadingRides ? (
              <LoaderCircle
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#817A85]"
              />
            ) : (
              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#817A85]"
              />
            )}
          </div>

          <div className="relative">
            <select
              value={
                priority
              }
              onChange={(
                event,
              ) =>
                setPriority(
                  event
                    .target
                    .value as
                    | SupportTicketPriority
                    | "",
                )
              }
              className="h-[56px] w-full appearance-none rounded-[13px] border-0 bg-[#F0EFF1] px-4 pr-11 text-[16px] text-[#625C66] outline-none focus:ring-2 focus:ring-[#7442AD]/15"
            >
              <option value="">
                Select Priority
                (Optional)
              </option>

              <option value="low">
                Low
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="high">
                High
              </option>
            </select>

            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#817A85]"
            />
          </div>

          <div>
            <textarea
              value={
                description
              }
              maxLength={
                2000
              }
              onChange={(
                event,
              ) =>
                setDescription(
                  event
                    .target
                    .value,
                )
              }
              placeholder="Tell us more about the issue..."
              rows={6}
              className="min-h-[150px] w-full resize-none rounded-[13px] border-0 bg-[#F0EFF1] p-4 text-[16px] leading-6 text-[#302B34] outline-none placeholder:text-[#AAA4AE] focus:ring-2 focus:ring-[#7442AD]/15"
            />

            <p className="mt-1 text-right text-[12px] text-[#AAA4AE]">
              {
                description.length
              }
              /2000
            </p>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-[#EEEAF0] bg-white/95 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto max-w-[640px]">
          <motion.button
            type="button"
            disabled={
              !valid ||
              submitting
            }
            whileTap={
              valid &&
              !submitting
                ? {
                    scale:
                      0.98,
                  }
                : undefined
            }
            onClick={() =>
              void submit()
            }
            className="flex h-[56px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#7442AD] text-[16px] font-semibold text-white shadow-[0_8px_25px_rgba(116,66,173,0.24)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting && (
              <LoaderCircle
                size={19}
                className="animate-spin"
              />
            )}

            {submitting
              ? "Submitting..."
              : "Submit Ticket"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

