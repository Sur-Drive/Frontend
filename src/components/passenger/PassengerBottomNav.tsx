import {
  Bell,
  Clock3,
  Home,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  NavLink,
} from "react-router-dom";

import {
  useMemo,
} from "react";

import {
  usePassengerNotifications,
} from "../../hooks/passenger/usePassengerNotifications";

interface PassengerNavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
}

const navItems: PassengerNavItem[] = [
  {
    to: "/passenger/home",
    icon: Home,
    label: "Home",
    end: true,
  },
  {
    to: "/passenger/activity",
    icon: Clock3,
    label: "Activity",
  },
  {
    to: "/passenger/alerts",
    icon: Bell,
    label: "Alerts",
  },
  {
    to: "/passenger/account",
    icon: UserRound,
    label: "Account",
  },
];

/* ======================================================
   NOTIFICATION RESPONSE NORMALIZER

   Keep this aligned with PassengerAlerts until the
   backend response shape is confirmed.
====================================================== */

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
    response as Record<
      string,
      unknown
    >;

  if (
    Array.isArray(
      root.notifications,
    )
  ) {
    return root.notifications;
  }

  if (
    Array.isArray(root.data)
  ) {
    return root.data;
  }

  if (
    root.data &&
    typeof root.data ===
      "object"
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
      Array.isArray(
        data.items,
      )
    ) {
      return data.items;
    }
  }

  if (
    Array.isArray(root.items)
  ) {
    return root.items;
  }

  return [];
}

/* ======================================================
   CHECK IF NOTIFICATION IS UNREAD
====================================================== */

function isUnreadNotification(
  value: unknown,
) {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const notification =
    value as Record<
      string,
      unknown
    >;

  /*
   * Current PassengerAlerts supports both
   * isRead and read while the exact backend
   * response is being confirmed.
   */

  if (
    typeof notification.isRead ===
    "boolean"
  ) {
    return (
      notification.isRead ===
      false
    );
  }

  if (
    typeof notification.read ===
    "boolean"
  ) {
    return (
      notification.read ===
      false
    );
  }

  /*
   * Also support a direct status value if
   * the backend sends one.
   */

  if (
    notification.status ===
    "unread"
  ) {
    return true;
  }

  return false;
}

export default function PassengerBottomNav() {
  /*
   * React Query will share/cache this request with
   * PassengerAlerts when the same query hook/key
   * is used there.
   */
  const notificationsQuery =
    usePassengerNotifications({
      limit: 50,
      offset: 0,
    });

  const unreadCount =
    useMemo(() => {
      const notifications =
        extractNotificationArray(
          notificationsQuery.data,
        );

      return notifications.filter(
        isUnreadNotification,
      ).length;
    }, [
      notificationsQuery.data,
    ]);

  return (
    <nav
      aria-label="Passenger navigation"
      className="
        fixed
        inset-x-0
        bottom-0
        z-[1000]
        border-t
        border-[#F0EDF3]
        bg-white/95
        pb-[env(safe-area-inset-bottom)]
        shadow-[0_-8px_30px_rgba(36,23,48,0.04)]
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto
          flex
          h-[74px]
          w-full
          max-w-[680px]
          items-center
          justify-around
          px-3
        "
      >
        {navItems.map(
          ({
            to,
            icon: Icon,
            label,
            end,
          }) => {
            const showBadge =
              label === "Alerts" &&
              unreadCount > 0;

            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className="
                  relative
                  flex
                  min-w-[68px]
                  items-center
                  justify-center
                  outline-none
                "
              >
                {({
                  isActive,
                }) => (
                  <motion.div
                    whileTap={{
                      scale: 0.9,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 24,
                    }}
                    className={`
                      relative
                      flex
                      min-h-[58px]
                      flex-col
                      items-center
                      justify-center
                      gap-1
                      transition-colors
                      duration-200
                      ${
                        isActive
                          ? "text-[#7442AD]"
                          : "text-[#AAA2B4]"
                      }
                    `}
                  >
                    {/* ICON */}

                    <div className="relative">
                      <motion.div
                        animate={{
                          y: isActive
                            ? -2
                            : 0,
                          scale:
                            isActive
                              ? 1.07
                              : 1,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 22,
                        }}
                      >
                        <Icon
                          size={22}
                          strokeWidth={
                            isActive
                              ? 2.4
                              : 1.8
                          }
                          fill={
                            isActive &&
                            label ===
                              "Home"
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </motion.div>

                      {/* UNREAD BADGE */}

                      {showBadge && (
                        <motion.span
                          initial={{
                            scale: 0,
                            opacity: 0,
                          }}
                          animate={{
                            scale: 1,
                            opacity: 1,
                          }}
                          className="
                            absolute
                            -right-[11px]
                            -top-[8px]
                            flex
                            h-[18px]
                            min-w-[18px]
                            items-center
                            justify-center
                            rounded-full
                            border-2
                            border-white
                            bg-[#F05B4D]
                            px-1
                            text-[9px]
                            font-bold
                            leading-none
                            text-white
                            shadow-sm
                          "
                        >
                          {unreadCount >
                          99
                            ? "99+"
                            : unreadCount}
                        </motion.span>
                      )}
                    </div>

                    {/* LABEL */}

                    <motion.span
                      animate={{
                        opacity:
                          isActive
                            ? 1
                            : 0.78,
                      }}
                      className={`
                        text-[12px]
                        leading-none
                        ${
                          isActive
                            ? "font-semibold"
                            : "font-medium"
                        }
                      `}
                    >
                      {label}
                    </motion.span>

                    {/* ACTIVE INDICATOR */}

                    {isActive && (
                      <motion.span
                        layoutId="passenger-nav-active"
                        className="
                          absolute
                          -bottom-[7px]
                          h-[3px]
                          w-[22px]
                          rounded-full
                          bg-[#7442AD]
                        "
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 30,
                        }}
                      />
                    )}
                  </motion.div>
                )}
              </NavLink>
            );
          },
        )}
      </div>
    </nav>
  );
}


// import {
//   Bell,
//   Clock3,
//   Home,
//   UserRound,
//   type LucideIcon,
// } from "lucide-react";
// import { motion } from "framer-motion";
// import { NavLink } from "react-router-dom";

// interface PassengerNavItem {
//   to: string;
//   icon: LucideIcon;
//   label: string;
//   end?: boolean;
// }

// const navItems: PassengerNavItem[] = [
//   {
//     to: "/passenger/home",
//     icon: Home,
//     label: "Home",
//     end: true,
//   },
//   {
//     to: "/passenger/activity",
//     icon: Clock3,
//     label: "Activity",
//   },
//   {
//     to: "/passenger/alerts",
//     icon: Bell,
//     label: "Alerts",
//   },
//   {
//     to: "/passenger/account",
//     icon: UserRound,
//     label: "Account",
//   },
// ];

// export default function PassengerBottomNav() {
//   return (
//     <nav
//       aria-label="Passenger navigation"
//       className="
//         fixed inset-x-0 bottom-0 z-[1000]
//         border-t border-[#F0EDF3]
//         bg-white/95
//         pb-[env(safe-area-inset-bottom)]
//         shadow-[0_-8px_30px_rgba(36,23,48,0.04)]
//         backdrop-blur-xl
//       "
//     >
//       <div
//         className="
//           mx-auto flex h-[74px] w-full
//           max-w-[680px] items-center
//           justify-around px-3
//         "
//       >
//         {navItems.map(({ to, icon: Icon, label, end }) => (
//           <NavLink
//             key={to}
//             to={to}
//             end={end}
//             className="
//               relative flex min-w-[68px]
//               items-center justify-center
//               outline-none
//             "
//           >
//             {({ isActive }) => (
//               <motion.div
//                 whileTap={{ scale: 0.9 }}
//                 transition={{
//                   type: "spring",
//                   stiffness: 420,
//                   damping: 24,
//                 }}
//                 className={`
//                   relative flex min-h-[58px]
//                   flex-col items-center
//                   justify-center gap-1
//                   transition-colors duration-200
//                   ${
//                     isActive
//                       ? "text-[#7442AD]"
//                       : "text-[#AAA2B4]"
//                   }
//                 `}
//               >
//                 <motion.div
//                   animate={{
//                     y: isActive ? -2 : 0,
//                     scale: isActive ? 1.07 : 1,
//                   }}
//                   transition={{
//                     type: "spring",
//                     stiffness: 350,
//                     damping: 22,
//                   }}
//                 >
//                   <Icon
//                     size={22}
//                     strokeWidth={isActive ? 2.4 : 1.8}
//                     fill={
//                       isActive && label === "Home"
//                         ? "currentColor"
//                         : "none"
//                     }
//                   />
//                 </motion.div>

//                 <motion.span
//                   animate={{
//                     opacity: isActive ? 1 : 0.78,
//                   }}
//                   className={`
//                     text-[12px] leading-none
//                     ${
//                       isActive
//                         ? "font-semibold"
//                         : "font-medium"
//                     }
//                   `}
//                 >
//                   {label}
//                 </motion.span>

//                 {isActive && (
//                   <motion.span
//                     layoutId="passenger-nav-active"
//                     className="
//                       absolute -bottom-[7px]
//                       h-[3px] w-[22px]
//                       rounded-full bg-[#7442AD]
//                     "
//                     transition={{
//                       type: "spring",
//                       stiffness: 350,
//                       damping: 30,
//                     }}
//                   />
//                 )}
//               </motion.div>
//             )}
//           </NavLink>
//         ))}
//       </div>
//     </nav>
//   );
// }

