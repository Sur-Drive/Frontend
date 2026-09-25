import type {
  SupportTicketMessage,
} from "../../../types/passengerSupport";

interface TicketMessageProps {
  message:
    SupportTicketMessage;
}

function formatTime(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-NG",
    {
      hour: "numeric",
      minute:
        "2-digit",
    },
  ).format(
    new Date(value),
  );
}

export default function TicketMessage({
  message,
}: TicketMessageProps) {
  if (
    message.sender ===
    "system"
  ) {
    return (
      <div className="my-4">
        <div
          className="
            ml-auto
            max-w-[85%]
            rounded-[18px]
            rounded-br-[5px]
            bg-[#7442AD]
            px-4
            py-3.5
            text-[14px]
            leading-5
            text-white
          "
        >
          {message.message}
        </div>

        <p className="mt-1.5 text-right text-[11px] text-[#9B95A0]">
          {formatTime(
            message.createdAt,
          )}
        </p>
      </div>
    );
  }

  const passenger =
    message.sender ===
    "passenger";

  return (
    <div
      className={`
        my-4
        flex
        flex-col
        ${
          passenger
            ? "items-end"
            : "items-start"
        }
      `}
    >
      <div
        className={`
          max-w-[85%]
          whitespace-pre-line
          px-4
          py-3.5
          text-[14px]
          leading-5

          ${
            passenger
              ? `
                rounded-[18px]
                rounded-br-[5px]
                bg-[#7442AD]
                text-white
              `
              : `
                rounded-[18px]
                rounded-bl-[5px]
                bg-white
                text-[#302B34]
                shadow-[0_4px_18px_rgba(35,25,44,0.04)]
              `
          }
        `}
      >
        {message.message}
      </div>

      <p className="mt-1.5 text-[11px] text-[#9B95A0]">
        {formatTime(
          message.createdAt,
        )}
      </p>
    </div>
  );
}