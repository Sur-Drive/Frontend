import {
  ChevronDown,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import RideHeader from "../../../../components/passenger/ride/RideHeader";

import {
  usePassengerSupport,
} from "../../../../context/PassengerSupportContext";

import {
  supportRides,
} from "../../../../data/passengerSupport";

import type {
  SupportTicketPriority,
} from "../../../../types/passengerSupport";

export default function RaiseTicket() {
  const navigate =
    useNavigate();

  const {
    createTicket,
  } =
    usePassengerSupport();

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
    submitting,
    setSubmitting,
  ] = useState(false);

  const valid =
    summary.trim()
      .length > 0 &&
    description.trim()
      .length > 0 &&
    Boolean(priority);

  const submit = () => {
    if (
      !valid ||
      !priority ||
      submitting
    ) {
      return;
    }

    setSubmitting(true);

    const ticket =
      createTicket({
        summary:
          summary.trim(),

        description:
          description.trim(),

        rideId:
          rideId ||
          undefined,

        priority,
      });

    navigate(
      `/passenger/account/support/tickets/${ticket.id}`,
      {
        replace: true,
      },
    );
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

      <main
        className="
          mx-auto
          w-full
          max-w-[680px]
          px-5
          pb-[calc(100px+env(safe-area-inset-bottom))]
          pt-2
          sm:px-7
        "
      >
        <h1 className="text-[22px] font-semibold text-[#302B34]">
          Raise a Support
          Ticket
        </h1>

        <div className="mt-6 space-y-3">
          <input
            type="text"
            value={
              summary
            }
            onChange={(
              event,
            ) =>
              setSummary(
                event.target
                  .value,
              )
            }
            placeholder="Brief summary of your issue"
            className="
              h-[56px]
              w-full
              rounded-[13px]
              border-0
              bg-[#F0EFF1]
              px-4
              text-[16px]
              text-[#302B34]
              outline-none
              placeholder:text-[#AAA4AE]
              focus:ring-2
              focus:ring-[#7442AD]/15
            "
          />

          <div className="relative">
            <select
              value={
                rideId
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
              className="
                h-[56px]
                w-full
                appearance-none
                rounded-[13px]
                border-0
                bg-[#F0EFF1]
                px-4
                pr-11
                text-[16px]
                text-[#625C66]
                outline-none
                focus:ring-2
                focus:ring-[#7442AD]/15
              "
            >
              <option value="">
                Select Ride
              </option>

              {supportRides.map(
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
                    {
                      ride.date
                    }{" "}
                    —{" "}
                    {
                      ride.destination
                    }
                  </option>
                ),
              )}
            </select>

            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#817A85]"
            />
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
              className="
                h-[56px]
                w-full
                appearance-none
                rounded-[13px]
                border-0
                bg-[#F0EFF1]
                px-4
                pr-11
                text-[16px]
                text-[#625C66]
                outline-none
                focus:ring-2
                focus:ring-[#7442AD]/15
              "
            >
              <option value="">
                Select Priority
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

          <textarea
            value={
              description
            }
            onChange={(
              event,
            ) =>
              setDescription(
                event.target
                  .value,
              )
            }
            placeholder="Tell us more about the issue..."
            rows={5}
            className="
              min-h-[130px]
              w-full
              resize-none
              rounded-[13px]
              border-0
              bg-[#F0EFF1]
              p-4
              text-[16px]
              leading-6
              text-[#302B34]
              outline-none
              placeholder:text-[#AAA4AE]
              focus:ring-2
              focus:ring-[#7442AD]/15
            "
          />
        </div>
      </main>

      <div
        className="
          fixed
          inset-x-0
          bottom-0
          z-[80]
          border-t
          border-[#EEEAF0]
          bg-white
          px-5
          pb-[calc(16px+env(safe-area-inset-bottom))]
          pt-3
        "
      >
        <div className="mx-auto max-w-[640px]">
          <motion.button
            type="button"
            disabled={
              !valid ||
              submitting
            }
            whileTap={
              valid
                ? {
                    scale:
                      0.98,
                  }
                : undefined
            }
            onClick={
              submit
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
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            {submitting
              ? "Submitting..."
              : "Submit Ticket"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}