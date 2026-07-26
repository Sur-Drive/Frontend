// import { NavLink, useLocation } from 'react-router-dom'
// import { Home, Copy, FileText, User, type LucideIcon } from 'lucide-react'
// import planRouteIcon from '../assets/Frame46.png'

// interface NavItem {
//   to: string
//   icon: LucideIcon | null
//   label: string
//   isCenter?: boolean
// }

// const navItems: NavItem[] = [
//   { to: '/home', icon: Home, label: 'Home' },
//   { to: '/feed', icon: Copy, label: 'Feed' },
//   { to: '/plan-route', icon: null, label: 'Plan', isCenter: true },
//   { to: '/report', icon: FileText, label: 'Report' },
//   { to: '/profile', icon: User, label: 'Profile' },
// ]

// export default function BottomNav() {
//   const location = useLocation()

//   return (
//     <nav className="fixed bottom-0 left-0 right-0 w-full bg-white flex items-center justify-around px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.08)] z-[90] md:px-12 lg:px-24">
//       {navItems.map(({ to, icon: Icon, label, isCenter }) => {
//         const isActive = location.pathname === to

//         if (isCenter) {
//           return (
//             <NavLink
//               key={to}
//               to={to}
//               className="flex items-center justify-center transition -mt-11 active:scale-95"
//             >
//               <img
//                 src={planRouteIcon}
//                 alt="Plan route"
//                 className="object-cover w-24 h-24 rounded-full"
//               />
//             </NavLink>
//           )
//         }

//         if (!Icon) return null

//         return (
//           <NavLink
//             key={to}
//             to={to}
//             className={`flex flex-col items-center gap-1 transition-colors ${
//               isActive ? 'text-purple-700' : 'text-gray-400'
//             }`}
//           >
//             <Icon size={22} strokeWidth={2} />
//             {isActive && (
//               <span className="text-[10px] font-medium">{label}</span>
//             )}
//           </NavLink>
//         )
//       })}
//     </nav>
//   )
// }





import { NavLink, useLocation } from 'react-router-dom'
import { Home, Copy, FileText, User, type LucideIcon } from 'lucide-react'
import planRouteIcon from '../assets/Frame46.png'

interface NavItem {
  to: string
  icon: LucideIcon | null
  label: string
  isCenter?: boolean
}

const navItems: NavItem[] = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/feed', icon: Copy, label: 'Feed' },
  { to: '/plan-route', icon: null, label: 'Plan', isCenter: true },
  { to: '/report', icon: FileText, label: 'Report' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white flex items-center justify-around px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.08)] z-[90] md:px-12 lg:px-24">
      {navItems.map(({ to, icon: Icon, label, isCenter }) => {
        const isActive = location.pathname === to

        if (isCenter) {
          return (
            <NavLink
              key={to}
              to={to}
              className="flex items-center justify-center transition -mt-14 active:scale-95"
            >
              <img
                src={planRouteIcon}
                alt="Plan route"
                className="object-cover w-24 h-24 rounded-full"
              />
            </NavLink>
          )
        }

        if (!Icon) return null

        return (
          <NavLink
            key={to}
            to={to}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive ? 'text-purple-700' : 'text-gray-400'
            }`}
          >
            <Icon size={22} strokeWidth={2} />
            {isActive && (
              <span className="text-[10px] font-medium">{label}</span>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}








