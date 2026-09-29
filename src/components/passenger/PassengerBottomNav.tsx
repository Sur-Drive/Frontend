import {
  Bell,
  Clock3,
  Home,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";

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

export default function PassengerBottomNav() {
  return (
    <nav
      aria-label="Passenger navigation"
      className="
        fixed inset-x-0 bottom-0 z-[1000]
        border-t border-[#F0EDF3]
        bg-white/95
        pb-[env(safe-area-inset-bottom)]
        shadow-[0_-8px_30px_rgba(36,23,48,0.04)]
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto flex h-[74px] w-full
          max-w-[680px] items-center
          justify-around px-3
        "
      >
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="
              relative flex min-w-[68px]
              items-center justify-center
              outline-none
            "
          >
            {({ isActive }) => (
              <motion.div
                whileTap={{ scale: 0.9 }}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 24,
                }}
                className={`
                  relative flex min-h-[58px]
                  flex-col items-center
                  justify-center gap-1
                  transition-colors duration-200
                  ${
                    isActive
                      ? "text-[#7442AD]"
                      : "text-[#AAA2B4]"
                  }
                `}
              >
                <motion.div
                  animate={{
                    y: isActive ? -2 : 0,
                    scale: isActive ? 1.07 : 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 22,
                  }}
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.4 : 1.8}
                    fill={
                      isActive && label === "Home"
                        ? "currentColor"
                        : "none"
                    }
                  />
                </motion.div>

                <motion.span
                  animate={{
                    opacity: isActive ? 1 : 0.78,
                  }}
                  className={`
                    text-[12px] leading-none
                    ${
                      isActive
                        ? "font-semibold"
                        : "font-medium"
                    }
                  `}
                >
                  {label}
                </motion.span>

                {isActive && (
                  <motion.span
                    layoutId="passenger-nav-active"
                    className="
                      absolute -bottom-[7px]
                      h-[3px] w-[22px]
                      rounded-full bg-[#7442AD]
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
        ))}
      </div>
    </nav>
  );
}

// import {
//   Bell,
//   Clock3,
//   Home,
//   UserRound,
// } from "lucide-react";
// import { motion } from "framer-motion";
// import { NavLink } from "react-router-dom";

// const navItems = [
//   {
//     to: "/passenger/home",
//     icon: Home,
//     label: "Home",
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
//       className="
//         fixed bottom-0 left-0 right-0 z-[100]
//         border-t border-[#F2EFF5]
//         bg-white/95
//         pb-[env(safe-area-inset-bottom)]
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
//         {navItems.map(
//           ({ to, icon: Icon, label }) => (
//             <NavLink
//               key={to}
//               to={to}
//               className="flex min-w-[64px] justify-center"
//             >
//               {({ isActive }) => (
//                 <motion.div
//                   whileTap={{ scale: 0.9 }}
//                   className={`
//                     flex flex-col items-center
//                     justify-center gap-1.5
//                     transition-colors
//                     ${
//                       isActive
//                         ? "text-[#7442AD]"
//                         : "text-[#AAA2B4]"
//                     }
//                   `}
//                 >
//                   <motion.div
//                     animate={{
//                       y: isActive ? -1 : 0,
//                       scale: isActive ? 1.06 : 1,
//                     }}
//                   >
//                     <Icon
//                       size={21}
//                       strokeWidth={
//                         isActive ? 2.4 : 1.8
//                       }
//                       fill={
//                         isActive &&
//                         label === "Home"
//                           ? "currentColor"
//                           : "none"
//                       }
//                     />
//                   </motion.div>

//                   <span
//                     className={`
//                       text-[13px]
//                       ${
//                         isActive
//                           ? "font-semibold"
//                           : "font-medium"
//                       }
//                     `}
//                   >
//                     {label}
//                   </span>
//                 </motion.div>
//               )}
//             </NavLink>
//           ),
//         )}
//       </div>
//     </nav>
//   );
// }