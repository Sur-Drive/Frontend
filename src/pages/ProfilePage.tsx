import { useState } from 'react'
import type { ReactNode } from 'react'
import { MapPin, Award, TrendingUp, ShieldCheck, Star, AlertCircle, LogOut } from 'lucide-react'
import { NotificationsModal, EmergencyContactModal, PrivacyModal } from '../components/Profilemodals'

type ModalKey = 'notifications' | 'emergency' | 'privacy' | null

export default function Profile() {
  const [openModal, setOpenModal] = useState<ModalKey>(null)

  // Swap for your real user data / API call
  const user = {
    name: 'Adeniji Abiodunn',
    email: 'afubiodun@gmail.com',
    initials: 'AA',
    drivingScore: 75,
    drivingGrade: 'Grade C',
    trustScore: 50,
    reports: 0,
    confirmed: 0,
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <h1 className="px-5 pt-6 pb-4 text-[28px] font-extrabold text-gray-800">Profile</h1>

      <div className="px-5">
        {/* Identity card */}
        <div className="relative p-5 overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 text-lg font-bold text-white bg-purple-700 rounded-full shrink-0">
              {user.initials}
            </div>
            <div>
              <p className="text-xl font-extrabold text-gray-900">{user.name}</p>
              <p className="text-[15px] text-gray-400">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="p-4 rounded-2xl bg-gray-100/80">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-emerald-600">
                <TrendingUp size={14} /> DRIVING
              </p>
              <p className="mt-1 text-3xl font-extrabold text-gray-900">{user.drivingScore}</p>
              <p className="text-[14px] text-gray-400">{user.drivingGrade}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-100/80">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-amber-500">
                <ShieldCheck size={14} /> TRUST
              </p>
              <p className="mt-1 text-3xl font-extrabold text-gray-900">{user.trustScore}</p>
              <p className="text-[14px] text-gray-400">Reputation</p>
            </div>
          </div>
        </div>

        {/* Report stats */}
        <div className="grid grid-cols-2 gap-3 px-2 mt-6">
          <div>
            <MapPin size={20} className="text-purple-700" />
            <p className="mt-2 text-3xl font-extrabold text-gray-900">{user.reports}</p>
            <p className="text-[14px] text-gray-400">Reports</p>
          </div>
          <div>
            <Award size={20} className="text-purple-700" />
            <p className="mt-2 text-3xl font-extrabold text-gray-900">{user.confirmed}</p>
            <p className="text-[14px] text-gray-400">Confirmed</p>
          </div>
        </div>

        {/* Menu */}
        <div className="flex flex-col mt-8 divide-y divide-gray-100">
          <MenuRow
            icon={<Star size={20} className="text-purple-700" />}
            title="Notifications"
            subtitle="Push, in-app, SMS"
            onClick={() => setOpenModal('notifications')}
          />
          <MenuRow
            icon={<AlertCircle size={20} className="text-purple-700" />}
            title="Emergency contacts"
            subtitle="Auto-notified on SOS"
            onClick={() => setOpenModal('emergency')}
          />
          <MenuRow
            icon={<ShieldCheck size={20} className="text-purple-700" />}
            title="Privacy"
            subtitle="privacy & Security settings"
            onClick={() => setOpenModal('privacy')}
          />
        </div>

        {/* Sign out */}
        <button className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-400 py-4 text-[16px] font-semibold text-white transition active:scale-[0.98]">
          <LogOut size={18} /> Sign out
        </button>
      </div>

      {openModal === 'notifications' && <NotificationsModal onClose={() => setOpenModal(null)} />}
      {openModal === 'emergency' && <EmergencyContactModal onClose={() => setOpenModal(null)} />}
      {openModal === 'privacy' && <PrivacyModal onClose={() => setOpenModal(null)} />}

      {/* Your existing <BottomNav /> renders below this page */}
    </div>
  )
}

function MenuRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="flex items-center justify-between py-4 text-left">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-9 w-9">{icon}</div>
        <div>
          <p className="text-[16px] font-bold text-gray-900">{title}</p>
          <p className="text-[14px] text-gray-400">{subtitle}</p>
        </div>
      </div>
      <span className="text-gray-300">›</span>
    </button>
  )
}













