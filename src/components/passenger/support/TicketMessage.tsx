import {
  Download,
  FileText,
} from "lucide-react";

import type {
  SupportTicketMessage,
} from "../../../api/passenger/support";

type Props = {
  message: SupportTicketMessage;
};

function formatTime(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-NG",
    {
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(
    new Date(value),
  );
}

function formatFileSize(
  bytes?: number | null,
) {
  if (!bytes || bytes <= 0) {
    return "";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.ceil(
      bytes / 1024,
    )} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function getSystemLabel(
  content: string,
) {
  const normalized =
    content
      .trim()
      .toLowerCase();

  if (
    normalized.includes(
      "resolved",
    )
  ) {
    return {
      label:
        "This ticket has been resolved.",
      icon: "✓",
    };
  }

  if (
    normalized.includes(
      "reopened",
    )
  ) {
    return {
      label:
        "This ticket has been reopened.",
      icon: "↻",
    };
  }

  if (
    normalized.includes(
      "escalat",
    )
  ) {
    return {
      label: content,
      icon: "↑",
    };
  }

  return {
    label: content,
    icon: null,
  };
}

export default function TicketMessage({
  message,
}: Props) {
  const own =
    message.senderType ===
    "requester";

  const systemNotice =
    message.type ===
    "system";

  /*
   * Backend system events such as:
   *
   * "This ticket has been resolved."
   * "This ticket has been reopened."
   *
   * should look like timeline events,
   * not chat messages.
   */
  if (systemNotice) {
    const notice =
      getSystemLabel(
        message.content ?? "",
      );

    return (
      <div className="flex flex-col items-center px-4 my-5">
        <div
          className="
            inline-flex
            max-w-[90%]
            items-center
            justify-center
            gap-1.5
            rounded-full
            bg-[#EFEDF1]
            px-3.5
            py-2
            text-center
            text-[11px]
            font-medium
            leading-4
            text-[#918B95]
          "
        >
          {notice.icon && (
            <span
              className="
                flex
                h-4
                w-4
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-white
                text-[9px]
                font-bold
                text-[#817A85]
              "
            >
              {notice.icon}
            </span>
          )}

          <span>
            {notice.label}
          </span>
        </div>

        <span className="mt-1 text-[10px] text-[#B1ABB5]">
          {formatTime(
            message.createdAt,
          )}
        </span>
      </div>
    );
  }

  const attachment =
    message.attachment;

  return (
    <div
      className={`
        my-4
        flex
        flex-col
        ${
          own
            ? "items-end"
            : "items-start"
        }
      `}
    >
      <div
        className={`
          max-w-[85%]
          overflow-hidden
          px-4
          py-3.5
          text-[14px]
          leading-5

          ${
            own
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
        {attachment &&
          message.type ===
            "image" &&
          (attachment.thumbnailUrl ||
            attachment.url) && (
            <button
              type="button"
              onClick={() => {
                if (
                  attachment.url
                ) {
                  window.open(
                    attachment.url,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }
              }}
              className="
                mb-3
                block
                w-full
                overflow-hidden
                rounded-[12px]
              "
            >
              <img
                src={
                  attachment.thumbnailUrl ??
                  attachment.url ??
                  ""
                }
                alt={
                  attachment.originalName ??
                  "Support attachment"
                }
                className="
                  max-h-[280px]
                  w-full
                  object-cover
                "
              />
            </button>
          )}

        {attachment &&
          message.type ===
            "audio" &&
          attachment.url && (
            <div className="mb-3">
              <audio
                controls
                src={
                  attachment.url
                }
                className="block max-w-full "
              />
            </div>
          )}

        {attachment &&
          message.type ===
            "file" && (
            <button
              type="button"
              onClick={() => {
                if (
                  attachment.url
                ) {
                  window.open(
                    attachment.url,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }
              }}
              className={`
                mb-3
                flex
                w-full
                items-center
                gap-3
                rounded-[12px]
                p-3
                text-left
                transition
                active:scale-[0.99]

                ${
                  own
                    ? "bg-white/10"
                    : "bg-[#F6F5F7]"
                }
              `}
            >
              <div
                className={`
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-[10px]

                  ${
                    own
                      ? "bg-white/10"
                      : "bg-white"
                  }
                `}
              >
                <FileText
                  size={20}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="truncate text-[13px] font-medium">
                  {attachment.originalName ??
                    "Attachment"}
                </p>

                {attachment.size ? (
                  <p className="mt-0.5 text-[11px] opacity-70">
                    {formatFileSize(
                      attachment.size,
                    )}
                  </p>
                ) : null}
              </div>

              <Download
                size={17}
                className="opacity-75 shrink-0"
              />
            </button>
          )}

        {message.content ? (
          <p
            className="break-words whitespace-pre-line "
          >
            {message.content}
          </p>
        ) : null}
      </div>

      <p
        className={`
          mt-1.5
          text-[11px]
          text-[#9B95A0]

          ${
            own
              ? "text-right"
              : "text-left"
          }
        `}
      >
        {formatTime(
          message.createdAt,
        )}
      </p>
    </div>
  );
}

