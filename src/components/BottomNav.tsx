





import { NavLink } from 'react-router-dom'
import { Home, Copy, FileText, User, Route } from 'lucide-react'

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/feed', icon: Copy, label: 'Feed' },
  { to: '/plan-route', icon: Route, label: 'Plan', isCenter: true },
  { to: '/report', icon: FileText, label: 'Report' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white flex items-center justify-around px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.08)] z-20 md:px-12 lg:px-24">
      {navItems.map(({ to, icon: Icon, label, isCenter }) => {
        if (isCenter) {
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center justify-center -mt-8 transition rounded-full shadow-lg w-14 h-14 active:scale-95 ${
                  isActive ? 'bg-purple-900' : 'bg-purple-700'
                }`
              }
            >
              {({ isActive }) => (
                <Icon
                  size={24}
                  className={isActive ? 'text-purple-200' : 'text-white'}
                />
              )}
            </NavLink>
          )
        }

        return (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 ${
                isActive ? 'text-purple-700' : 'text-gray-400'
              }`
            }
          >
            <Icon size={22} />
            {label && <span className="text-[10px] font-medium">{label}</span>}
          </NavLink>
        )
      })}
    </nav>
  )
}