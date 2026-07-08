import type { ReactNode } from 'react'
import { Home, MapPin, Bookmark, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export default function AppShell({ children, title }: { children?: ReactNode; title: string }) {
  return (
    <div className="flex flex-col h-screen text-white bg-purple-800">
      {/* Top bar */}
      <header className="flex items-center justify-center px-4 py-3 border-b border-white/10 shrink-0">
        <h1 className="text-lg font-bold tracking-wide">{title}</h1>
      </header>

      {/* Scrollable content area */}
      <main className="flex-1 px-4 py-4 overflow-y-auto">
        {children}
      </main>

      {/* Bottom tab bar */}
      <nav className="flex items-center justify-around py-2 bg-purple-900 border-t border-white/10 shrink-0">
        <NavTab to="/" icon={<Home size={22} />} label="Home" />
        <NavTab to="/route" icon={<MapPin size={22} />} label="Route" />
        <NavTab to="/saved" icon={<Bookmark size={22} />} label="Saved" />
        <NavTab to="/profile" icon={<User size={22} />} label="Profile" />
      </nav>
    </div>
  )
}

function NavTab({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 text-xs px-3 py-1 rounded-lg transition ${
          isActive ? 'text-yellow-400' : 'text-white/60'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  )
}