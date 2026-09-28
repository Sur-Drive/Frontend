import {
  motion,
} from "framer-motion";

import type {
  PassengerNotification,
} from "../../../types/passengerNotification";

type Props = {
  notification: PassengerNotification;

  onClick?: () => void;
};

export default function NotificationItem({
  notification,
  onClick,
}: Props) {
  const unread =
    notification.status ===
    "unread";

  return (
    <motion.button
      type="button"
      whileTap={{
        scale: 0.985,
      }}
      onClick={onClick}
      className="
        flex
        w-full
        items-start
        gap-3
        border-b
        border-[#EEEAF0]
        px-4
        py-4
        text-left
        last:border-b-0
      "
    >
      {/* DOT */}

      <span
        className={`
          mt-[7px]
          h-[9px]
          w-[9px]
          shrink-0
          rounded-full

          ${
            unread
              ? "bg-[#7442AD]"
              : "bg-[#C8C1CD]"
          }
        `}
      />

      {/* CONTENT */}

      <div className="min-w-0 flex-1">
        <div
          className="
            flex
            items-start
            justify-between
            gap-4
          "
        >
          <p
            className={`
              min-w-0
              flex-1
              text-[15px]
              leading-5
              text-[#302B34]

              ${
                unread
                  ? "font-semibold"
                  : "font-medium"
              }
            `}
          >
            {notification.title}
          </p>

          <span
            className="
              shrink-0
              pt-0.5
              text-[13px]
              font-medium
              text-[#96909A]
            "
          >
            {notification.time}
          </span>
        </div>

        <p
          className="
            mt-1
            text-[13px]
            leading-5
            text-[#817A85]
          "
        >
          {notification.message}
        </p>
      </div>
    </motion.button>
  );
}