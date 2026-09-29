import {
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
  passengerNotifications,
} from "../../../data/passengerNotifications";

import type {
  PassengerNotification,
} from "../../../types/passengerNotification";

const defaultFilters: NotificationFilters = {
  status: "all",
  startDate: "",
  endDate: "",
};

export default function PassengerAlerts() {
  const navigate =
    useNavigate();

  const [
    filterOpen,
    setFilterOpen,
  ] = useState(false);

  /*
   * draftFilters changes while
   * the sheet is open.
   */
  const [
    draftFilters,
    setDraftFilters,
  ] =
    useState<NotificationFilters>(
      defaultFilters,
    );

  /*
   * appliedFilters controls the
   * actual list.
   */
  const [
    appliedFilters,
    setAppliedFilters,
  ] =
    useState<NotificationFilters>(
      defaultFilters,
    );

  const filteredNotifications =
    useMemo(() => {
      return passengerNotifications.filter(
        (notification) => {
          /* STATUS */

          if (
            appliedFilters.status !==
              "all" &&
            notification.status !==
              appliedFilters.status
          ) {
            return false;
          }

          /* DATES */

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

          if (
            appliedFilters.endDate
          ) {
            const endDate =
              new Date(
                `${appliedFilters.endDate}T23:59:59`,
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
    }, [appliedFilters]);

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

  const handleNotification =
    (
      notification: PassengerNotification,
    ) => {
      if (
        notification.route
      ) {
        navigate(
          notification.route,
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

  return (
    <div
      className="
        min-h-[100dvh]
        bg-[#FAF9FB]
        pb-[94px]
      "
    >
      {/* =====================================
          FIXED / STICKY HEADER
      ===================================== */}

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
            h-[78px]
            w-full
            max-w-[680px]
            items-center
            justify-between
            px-5
            sm:px-7
          "
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

          <motion.button
            type="button"
            whileTap={{
              scale: 0.9,
            }}
            onClick={() => {
              setDraftFilters(
                appliedFilters,
              );

              setFilterOpen(true);
            }}
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
      </header>

      {/* =====================================
          CONTENT
      ===================================== */}

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
        {filteredNotifications
          .length === 0 ? (
          <EmptyNotifications />
        ) : (
          <div className="space-y-7">
            <NotificationGroup
              title="Today"
              notifications={
                today
              }
              onNotificationClick={
                handleNotification
              }
            />

            <NotificationGroup
              title="Yesterday"
              notifications={
                yesterday
              }
              onNotificationClick={
                handleNotification
              }
            />

            <NotificationGroup
              title="Earlier"
              notifications={
                older
              }
              onNotificationClick={
                handleNotification
              }
            />
          </div>
        )}
      </main>

      {/* PASSENGER NAV */}

      <PassengerBottomNav />

      {/* FILTER SHEET */}

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