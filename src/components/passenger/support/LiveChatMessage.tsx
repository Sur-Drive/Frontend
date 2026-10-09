import {
  Download,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

import {
  motion,
} from "framer-motion";
import type { SupportTicketMessage } from "../../../api/passenger/support";


type Props = {
  message: SupportTicketMessage;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatTime(
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
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(date);
}

function formatFileSize(
  bytes?: number | null,
) {
  if (
    !bytes ||
    bytes <= 0
  ) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${Math.ceil(
      bytes / 1024,
    )} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function openAttachment(
  url?: string | null,
) {
  if (!url) {
    return;
  }

  window.open(
    url,
    "_blank",
    "noopener,noreferrer",
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function LiveChatMessage({
  message,
}: Props) {
  /*
   * Support backend terminology:
   *
   * requester = passenger
   * agent     = support agent
   * system    = system
   */
  const isRequester =
    message.senderType ===
    "requester";

  /*
   * System events such as:
   *
   * "This ticket has been resolved."
   *
   * are centered.
   *
   * A system sender with type "text"
   * is still rendered as a normal
   * left-side support message.
   */
  const isSystemEvent =
    message.senderType ===
      "system" &&
    message.type ===
      "system";

  const attachment =
    message.attachment;

  /*
   * Attachment fields from the API
   * can legitimately be null.
   *
   * Normalize them once here instead
   * of forcing the API types to lie.
   */
  const attachmentUrl =
    attachment?.url ??
    undefined;

  const thumbnailUrl =
    attachment?.thumbnailUrl ??
    attachmentUrl;

  const attachmentName =
    attachment?.originalName ??
    "Attachment";

  const attachmentSize =
    attachment?.size ??
    null;

  /* ---------------------------------------------------------------------- */
  /* System event                                                           */
  /* ---------------------------------------------------------------------- */

  if (isSystemEvent) {
    return (
      <motion.div
        initial={{
          opacity: 0,
          y: 5,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className="flex justify-center my-4 "
      >
        <div className="max-w-[88%] text-center">
          {message.content && (
            <div
              className="
                inline-flex
                rounded-full
                bg-[#ECE9EE]
                px-4
                py-2
                text-[11px]
                font-medium
                leading-4
                text-[#817A85]
              "
            >
              {message.content}
            </div>
          )}

          <p className="mt-1 text-[10px] text-[#AAA4AE]">
            {formatTime(
              message.createdAt,
            )}
          </p>
        </div>
      </motion.div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Normal chat message                                                    */
  /* ---------------------------------------------------------------------- */

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
        scale: 0.985,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.2,
      }}
      className={`
        mb-4
        flex
        flex-col

        ${
          isRequester
            ? "items-end"
            : "items-start"
        }
      `}
    >
      <div
        className={`
          max-w-[85%]
          overflow-hidden
          text-[14px]
          leading-[21px]

          ${
            isRequester
              ? `
                  rounded-[20px]
                  rounded-br-[6px]
                  bg-[#7442AD]
                  text-white
                `
              : `
                  rounded-[20px]
                  rounded-bl-[6px]
                  border
                  border-[#EEEAF0]
                  bg-white
                  text-[#302B34]
                  shadow-[0_5px_22px_rgba(35,25,44,0.04)]
                `
          }
        `}
      >
        {/* -------------------------------------------------------------- */}
        {/* Image attachment                                               */}
        {/* -------------------------------------------------------------- */}

        {attachment &&
          message.type ===
            "image" &&
          attachmentUrl && (
            <button
              type="button"
              onClick={() =>
                openAttachment(
                  attachmentUrl,
                )
              }
              className="block w-full"
            >
              <img
                src={
                  thumbnailUrl
                }
                alt={
                  attachmentName
                }
                className="
                  max-h-[320px]
                  w-full
                  object-cover
                "
              />
            </button>
          )}

        {/* -------------------------------------------------------------- */}
        {/* Image with missing URL                                         */}
        {/* -------------------------------------------------------------- */}

        {attachment &&
          message.type ===
            "image" &&
          !attachmentUrl && (
            <div
              className="flex items-center gap-2 px-4 py-3 "
            >
              <ImageIcon
                size={18}
              />

              <span className="text-[12px]">
                Image unavailable
              </span>
            </div>
          )}

        {/* -------------------------------------------------------------- */}
        {/* Audio attachment                                               */}
        {/* -------------------------------------------------------------- */}

        {attachment &&
          message.type ===
            "audio" &&
          attachmentUrl && (
            <div className="p-3">
              <audio
                controls
                preload="metadata"
                src={
                  attachmentUrl
                }
                className="max-w-full"
              />
            </div>
          )}

        {/* -------------------------------------------------------------- */}
        {/* Audio with missing URL                                         */}
        {/* -------------------------------------------------------------- */}

        {attachment &&
          message.type ===
            "audio" &&
          !attachmentUrl && (
            <div className="px-4 py-3 text-[12px]">
              Audio unavailable
            </div>
          )}

        {/* -------------------------------------------------------------- */}
        {/* File attachment                                                */}
        {/* -------------------------------------------------------------- */}

        {attachment &&
          message.type ===
            "file" && (
            <button
              type="button"
              disabled={
                !attachmentUrl
              }
              onClick={() =>
                openAttachment(
                  attachmentUrl,
                )
              }
              className={`
                m-3
                flex
                max-w-[calc(100%-24px)]
                items-center
                gap-3
                rounded-[14px]
                p-3
                text-left

                ${
                  isRequester
                    ? "bg-white/10"
                    : "bg-[#F7F6F8]"
                }

                ${
                  !attachmentUrl
                    ? "cursor-default opacity-60"
                    : ""
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
                  rounded-[11px]

                  ${
                    isRequester
                      ? "bg-white/10"
                      : "bg-white"
                  }
                `}
              >
                <FileText
                  size={19}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="truncate text-[12px] font-semibold">
                  {
                    attachmentName
                  }
                </p>

                {attachmentSize ? (
                  <p className="mt-0.5 text-[10px] opacity-60">
                    {formatFileSize(
                      attachmentSize,
                    )}
                  </p>
                ) : null}
              </div>

              {attachmentUrl && (
                <Download
                  size={16}
                  className=" shrink-0 opacity-70"
                />
              )}
            </button>
          )}

        {/* -------------------------------------------------------------- */}
        {/* Unknown attachment type                                        */}
        {/* -------------------------------------------------------------- */}

        {attachment &&
          ![
            "image",
            "audio",
            "file",
          ].includes(
            message.type,
          ) && (
            <button
              type="button"
              disabled={
                !attachmentUrl
              }
              onClick={() =>
                openAttachment(
                  attachmentUrl,
                )
              }
              className={`
                flex
                items-center
                gap-2
                p-3
                text-left

                ${
                  !attachmentUrl
                    ? "cursor-default opacity-60"
                    : ""
                }
              `}
            >
              <FileText
                size={18}
              />

              <span className="text-[12px]">
                {
                  attachmentName
                }
              </span>

              {attachmentUrl && (
                <Download
                  size={15}
                  className="opacity-70"
                />
              )}
            </button>
          )}

        {/* -------------------------------------------------------------- */}
        {/* Text / caption                                                  */}
        {/* -------------------------------------------------------------- */}

        {message.content && (
          <p
            className={`
              whitespace-pre-line
              break-words
              px-4
              py-3.5

              ${
                attachment
                  ? "pt-3"
                  : ""
              }
            `}
          >
            {message.content}
          </p>
        )}
      </div>

      {/* Time */}

      <div
        className="
          mt-1.5
          flex
          items-center
          gap-1
          px-1
          text-[11px]
          text-[#AAA4AE]
        "
      >
        <span>
          {formatTime(
            message.createdAt,
          )}
        </span>
      </div>
    </motion.div>
  );
}