import NotificationItem from "./NotificationItem";

import type {
  PassengerNotification,
} from "../../../types/passengerNotification";

type Props = {
  title: string;

  notifications:
    PassengerNotification[];

  onNotificationClick?: (
    notification: PassengerNotification,
  ) => void;
};

export default function NotificationGroup({
  title,
  notifications,
  onNotificationClick,
}: Props) {
  if (
    notifications.length === 0
  ) {
    return null;
  }

  return (
    <section>
      <h2
        className="
          mb-3
          text-[16px]
          font-semibold
          text-[#302B34]
        "
      >
        {title}
      </h2>

      <div
        className="
          overflow-hidden
          rounded-[18px]
          border
          border-[#F2EFF4]
          bg-white
          shadow-[0_5px_24px_rgba(30,20,38,0.035)]
        "
      >
        {notifications.map(
          (notification) => (
            <NotificationItem
              key={
                notification.id
              }
              notification={
                notification
              }
              onClick={() =>
                onNotificationClick?.(
                  notification,
                )
              }
            />
          ),
        )}
      </div>
    </section>
  );
}