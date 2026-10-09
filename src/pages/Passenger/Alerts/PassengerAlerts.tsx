import {
  CheckCheck,
  RefreshCw,
  SlidersHorizontal,
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

import PassengerBottomNav from "../../../components/passenger/PassengerBottomNav";

import EmptyNotifications from "../../../components/passenger/notifications/EmptyNotifications";

import NotificationGroup from "../../../components/passenger/notifications/NotificationGroup";

import NotificationFilterSheet, {
  type NotificationFilters,
} from "../../../components/passenger/notifications/NotificationFilterSheet";

import {
  useMarkAllPassengerNotificationsRead,
  useMarkPassengerNotificationRead,
  usePassengerNotifications,
} from "../../../hooks/passenger/usePassengerNotifications";

import type {
  PassengerNotification,
} from "../../../types/passengerNotification";

const defaultFilters: NotificationFilters = {
  status: "all",
  startDate: "",
  endDate: "",
};

/*
 * ---------------------------------------------
 * TEMPORARY BACKEND RESPONSE NORMALIZER
 * ---------------------------------------------
 *
 * The API documentation does not define the
 * GET /notifications response schema.
 *
 * This allows the page to safely handle:
 *
 * [...]
 *
 * { notifications: [...] }
 *
 * { data: [...] }
 *
 * { data: { notifications: [...] } }
 *
 * Once we see the actual response, we'll remove
 * the unnecessary cases and strongly type it.
 */
function extractNotificationArray(
  response: unknown,
): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    !response ||
    typeof response !== "object"
  ) {
    return [];
  }

  const root =
    response as Record<string, unknown>;

  if (
    Array.isArray(root.notifications)
  ) {
    return root.notifications;
  }

  if (Array.isArray(root.data)) {
    return root.data;
  }

  if (
    root.data &&
    typeof root.data === "object"
  ) {
    const data =
      root.data as Record<
        string,
        unknown
      >;

    if (
      Array.isArray(
        data.notifications,
      )
    ) {
      return data.notifications;
    }

    if (
      Array.isArray(data.items)
    ) {
      return data.items;
    }
  }

  if (Array.isArray(root.items)) {
    return root.items;
  }

  return [];
}

/*
 * We only use this until we know the exact
 * notification response fields.
 */
function getString(
  value: unknown,
): string | undefined {
  return typeof value === "string"
    ? value
    : undefined;
}

function getBoolean(
  value: unknown,
): boolean | undefined {
  return typeof value === "boolean"
    ? value
    : undefined;
}

function getNotificationGroup(
  createdAt: string,
): "today" | "yesterday" | "older" {
  const date =
    new Date(createdAt);

  const now =
    new Date();

  const today =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

  const yesterday =
    new Date(today);

  yesterday.setDate(
    yesterday.getDate() - 1,
  );

  const notificationDay =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

  if (
    notificationDay.getTime() ===
    today.getTime()
  ) {
    return "today";
  }

  if (
    notificationDay.getTime() ===
    yesterday.getTime()
  ) {
    return "yesterday";
  }

  return "older";
}

/*
 * Temporary adapter between the backend
 * notification and your existing UI type.
 *
 * Once you send the real GET /notifications
 * response, we can replace this with an exact
 * strongly typed mapper.
 */
function mapBackendNotification(
  value: unknown,
): PassengerNotification | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const item =
    value as Record<
      string,
      unknown
    >;

  const id =
    getString(item.id) ??
    getString(
      item.notificationId,
    );

  if (!id) {
    return null;
  }

  const createdAt =
    getString(item.createdAt) ??
    getString(item.created_at) ??
    new Date().toISOString();

  const isRead =
    getBoolean(item.isRead) ??
    getBoolean(item.read) ??
    false;

  /*
   * These fallbacks are intentionally
   * conservative until the backend response
   * is confirmed.
   */
  const title =
    getString(item.title) ??
    "Notification";

  const message =
    getString(item.message) ??
    getString(item.body) ??
    "";

  const route =
    getString(item.route) ??
    getString(item.actionUrl) ??
    getString(item.action_url);

  /*
   * Your existing PassengerNotification type
   * already drives NotificationGroup.
   *
   * If TypeScript tells us its exact property
   * names differ, send that interface and we'll
   * match it directly.
   */
  return {
    id,
    title,
    message,
    createdAt,

    status:
      isRead
        ? "read"
        : "unread",

    group:
      getNotificationGroup(
        createdAt,
      ),

    route,
  } as PassengerNotification;
}

export default function PassengerAlerts() {
  const navigate =
    useNavigate();

  const [
    filterOpen,
    setFilterOpen,
  ] = useState(false);

  const [
    draftFilters,
    setDraftFilters,
  ] =
    useState<NotificationFilters>(
      defaultFilters,
    );

  const [
    appliedFilters,
    setAppliedFilters,
  ] =
    useState<NotificationFilters>(
      defaultFilters,
    );

  /*
   * ------------------------------------------
   * API
   * ------------------------------------------
   */

  const notificationsQuery =
    usePassengerNotifications({
      limit: 50,
      offset: 0,
    });

  const markReadMutation =
    useMarkPassengerNotificationRead();

  const markAllReadMutation =
    useMarkAllPassengerNotificationsRead();

  /*
   * ------------------------------------------
   * NORMALIZE BACKEND DATA
   * ------------------------------------------
   */

  const notifications =
    useMemo(() => {
      const rawNotifications =
        extractNotificationArray(
          notificationsQuery.data,
        );

      return rawNotifications
        .map(
          mapBackendNotification,
        )
        .filter(
          (
            notification,
          ): notification is PassengerNotification =>
            notification !== null,
        );
    }, [
      notificationsQuery.data,
    ]);

  /*
   * Useful during the first backend test.
   *
   * Once we confirm the response shape,
   * remove this log.
   */
  console.log(
    "PASSENGER NOTIFICATIONS RESPONSE:",
    notificationsQuery.data,
  );

  /*
   * ------------------------------------------
   * FILTERS
   * ------------------------------------------
   */

  const filteredNotifications =
    useMemo(() => {
      return notifications.filter(
        (notification) => {
          /*
           * READ / UNREAD
           */

          if (
            appliedFilters.status !==
              "all" &&
            notification.status !==
              appliedFilters.status
          ) {
            return false;
          }

          /*
           * START DATE
           */

          const notificationDate =
            new Date(
              notification.createdAt,
            );

          if (
            appliedFilters.startDate
          ) {
            const startDate =
              new Date(
                `${appliedFilters.startDate}T00:00:00`,
              );

            if (
              notificationDate <
              startDate
            ) {
              return false;
            }
          }

          /*
           * END DATE
           */

          if (
            appliedFilters.endDate
          ) {
            const endDate =
              new Date(
                `${appliedFilters.endDate}T23:59:59.999`,
              );

            if (
              notificationDate >
              endDate
            ) {
              return false;
            }
          }

          return true;
        },
      );
    }, [
      notifications,
      appliedFilters,
    ]);

  /*
   * ------------------------------------------
   * GROUPS
   * ------------------------------------------
   */

  const today =
    filteredNotifications.filter(
      (notification) =>
        notification.group ===
        "today",
    );

  const yesterday =
    filteredNotifications.filter(
      (notification) =>
        notification.group ===
        "yesterday",
    );

  const older =
    filteredNotifications.filter(
      (notification) =>
        notification.group ===
        "older",
    );

  const unreadCount =
    notifications.filter(
      (notification) =>
        notification.status ===
        "unread",
    ).length;

  /*
   * ------------------------------------------
   * ACTIONS
   * ------------------------------------------
   */

  const handleNotification =
    async (
      notification: PassengerNotification,
    ) => {
      /*
       * Mark unread notification as read
       * before navigating.
       */
      if (
        notification.status ===
        "unread"
      ) {
        try {
          await markReadMutation.mutateAsync(
            notification.id,
          );
        } catch (error) {
          console.error(
            "Unable to mark notification as read:",
            error,
          );

          /*
           * Don't block navigation because
           * marking as read failed.
           */
        }
      }

      if (
        notification.route
      ) {
        navigate(
          notification.route,
        );
      }
    };

  const handleMarkAllRead =
    async () => {
      if (
        unreadCount === 0 ||
        markAllReadMutation.isPending
      ) {
        return;
      }

      try {
        await markAllReadMutation.mutateAsync();
      } catch (error) {
        console.error(
          "Unable to mark all notifications as read:",
          error,
        );
      }
    };

  const applyFilters = () => {
    setAppliedFilters(
      draftFilters,
    );

    setFilterOpen(false);
  };

  const resetFilters = () => {
    setDraftFilters(
      defaultFilters,
    );

    setAppliedFilters(
      defaultFilters,
    );

    setFilterOpen(false);
  };

  /*
   * ------------------------------------------
   * RENDER
   * ------------------------------------------
   */

  return (
    <div
      className="
        min-h-[100dvh]
        bg-[#FAF9FB]
        pb-[94px]
      "
    >
      {/* HEADER */}

      <header
        className="
          sticky
          top-0
          z-[700]
          border-b
          border-black/[0.025]
          bg-white/95
          backdrop-blur-xl
        "
      >
        <div
          className="
            mx-auto
            flex
            min-h-[78px]
            w-full
            max-w-[680px]
            items-center
            justify-between
            gap-3
            px-5
            py-3
            sm:px-7
          "
        >
          <div className="min-w-0">
            <div
              className="flex items-center gap-2 "
            >
              <h1
                className="
                  text-[22px]
                  font-semibold
                  tracking-[-0.02em]
                  text-[#302B34]
                "
              >
                Notifications
              </h1>

              {unreadCount > 0 && (
                <span
                  className="
                    flex
                    min-w-[24px]
                    items-center
                    justify-center
                    rounded-full
                    bg-[#7442AD]
                    px-2
                    py-1
                    text-[12px]
                    font-semibold
                    text-white
                  "
                >
                  {unreadCount >
                  99
                    ? "99+"
                    : unreadCount}
                </span>
              )}
            </div>
          </div>

          <div
            className="flex items-center gap-2 shrink-0"
          >
            {unreadCount > 0 && (
              <motion.button
                type="button"
                whileTap={{
                  scale: 0.94,
                }}
                disabled={
                  markAllReadMutation.isPending
                }
                onClick={
                  handleMarkAllRead
                }
                aria-label="Mark all notifications as read"
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                  text-[#7442AD]
                  shadow-[0_5px_22px_rgba(30,20,38,0.08)]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <CheckCheck
                  size={20}
                />
              </motion.button>
            )}

            <motion.button
              type="button"
              whileTap={{
                scale: 0.9,
              }}
              onClick={() => {
                setDraftFilters(
                  appliedFilters,
                );

                setFilterOpen(
                  true,
                );
              }}
              aria-label="Filter notifications"
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                bg-white
                text-[#302B34]
                shadow-[0_5px_22px_rgba(30,20,38,0.08)]
              "
            >
              <SlidersHorizontal
                size={19}
              />
            </motion.button>
          </div>
        </div>
      </header>

      {/* CONTENT */}

      <main
        className="
          mx-auto
          w-full
          max-w-[680px]
          px-5
          pb-8
          pt-5
          sm:px-7
        "
      >
        {/* LOADING */}

        {notificationsQuery.isLoading && (
          <NotificationLoading />
        )}

        {/* ERROR */}

        {notificationsQuery.isError && (
          <div
            className="
              flex
              min-h-[55vh]
              flex-col
              items-center
              justify-center
              px-6
              text-center
            "
          >
            <div
              className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-full
                bg-[#F1EAF7]
                text-[#7442AD]
              "
            >
              <RefreshCw
                size={23}
              />
            </div>

            <h2
              className="
                mt-4
                text-[18px]
                font-semibold
                text-[#302B34]
              "
            >
              Unable to load
              notifications
            </h2>

            <p
              className="
                mt-2
                max-w-[320px]
                text-[14px]
                leading-6
                text-[#918B95]
              "
            >
              We couldn't load your
              notifications right now.
              Please try again.
            </p>

            <motion.button
              type="button"
              whileTap={{
                scale: 0.97,
              }}
              onClick={() =>
                notificationsQuery.refetch()
              }
              disabled={
                notificationsQuery.isFetching
              }
              className="
                mt-5
                flex
                h-[50px]
                items-center
                justify-center
                gap-2
                rounded-[14px]
                bg-[#7442AD]
                px-6
                text-[15px]
                font-semibold
                text-white
                disabled:opacity-60
              "
            >
              <RefreshCw
                size={17}
                className={
                  notificationsQuery.isFetching
                    ? "animate-spin"
                    : ""
                }
              />

              Try again
            </motion.button>
          </div>
        )}

        {/* SUCCESS */}

        {!notificationsQuery.isLoading &&
          !notificationsQuery.isError && (
            <>
              {filteredNotifications.length ===
              0 ? (
                <EmptyNotifications />
              ) : (
                <div className="space-y-7">
                  {today.length >
                    0 && (
                    <NotificationGroup
                      title="Today"
                      notifications={
                        today
                      }
                      onNotificationClick={
                        handleNotification
                      }
                    />
                  )}

                  {yesterday.length >
                    0 && (
                    <NotificationGroup
                      title="Yesterday"
                      notifications={
                        yesterday
                      }
                      onNotificationClick={
                        handleNotification
                      }
                    />
                  )}

                  {older.length >
                    0 && (
                    <NotificationGroup
                      title="Earlier"
                      notifications={
                        older
                      }
                      onNotificationClick={
                        handleNotification
                      }
                    />
                  )}
                </div>
              )}
            </>
          )}
      </main>

      <PassengerBottomNav />

      <NotificationFilterSheet
        open={filterOpen}
        value={draftFilters}
        onChange={
          setDraftFilters
        }
        onApply={
          applyFilters
        }
        onReset={
          resetFilters
        }
        onClose={() =>
          setFilterOpen(false)
        }
      />
    </div>
  );
}

/*
 * =============================================
 * LOADING SKELETON
 * =============================================
 */

function NotificationLoading() {
  return (
    <div className="space-y-7">
      {[0, 1].map(
        (group) => (
          <div key={group}>
            <div
              className="
                mb-4
                h-4
                w-20
                animate-pulse
                rounded-full
                bg-[#ECE8EF]
              "
            />

            <div className="space-y-3">
              {[0, 1, 2].map(
                (item) => (
                  <div
                    key={item}
                    className="
                      flex
                      gap-3
                      rounded-[16px]
                      bg-white
                      p-4
                    "
                  >
                    <div
                      className="
                        h-11
                        w-11
                        shrink-0
                        animate-pulse
                        rounded-full
                        bg-[#F0ECF2]
                      "
                    />

                    <div
                      className="flex-1 py-1 space-y-2 "
                    >
                      <div
                        className="
                          h-4
                          w-[58%]
                          animate-pulse
                          rounded-full
                          bg-[#ECE8EF]
                        "
                      />

                      <div
                        className="
                          h-3
                          w-[88%]
                          animate-pulse
                          rounded-full
                          bg-[#F1EEF3]
                        "
                      />

                      <div
                        className="
                          h-3
                          w-[35%]
                          animate-pulse
                          rounded-full
                          bg-[#F1EEF3]
                        "
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        ),
      )}
    </div>
  );
}


