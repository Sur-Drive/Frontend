
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Award, TrendingUp, ShieldCheck, Star, AlertCircle, LogOut } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useLogout } from '../hooks/useLogout'
import { NotificationsModal, EmergencyContactModal, PrivacyModal } from '../components/Profilemodals'

type ModalKey = 'notifications' | 'emergency' | 'privacy' | null

export default function Profile() {
  const [openModal, setOpenModal] = useState<ModalKey>(null)
  const { data: user, isLoading, isError, error } = useProfile()
  const { mutate: logout, isPending: isLoggingOut } = useLogout()
  const navigate = useNavigate()

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Loading…'
  const initials = user
    ? `${user.firstName[0]?.toUpperCase() ?? ''}${user.lastName[0]?.toUpperCase() ?? ''}`
    : '--'
  const email = user?.driverProfile?.phoneNumber ?? user?.phoneNumber ?? 'No contact info'

  // Placeholder stats — replace when API provides real values
  const drivingScore = 75
  const drivingGrade = 'Grade C'
  const trustScore = 50
  const reports = 0
  const confirmed = 0

  const handleSignOut = () => {
    logout(undefined, {
      onSettled: () => {
        // TODO: confirm this is the correct login route path in your router
        navigate('/home', { replace: true })
      },
    })
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-6 text-center">
          <AlertCircle size={40} className="mx-auto mb-3 text-red-400" />
          <p className="text-gray-600">{error?.message || 'Something went wrong'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 mt-4 text-sm font-semibold text-white bg-purple-700 rounded-xl"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-xl mx-auto">
        <h1 className="px-5 pt-6 pb-4 text-[22px] sm:text-[28px] font-extrabold text-gray-800">
          Profile
        </h1>

        <div className="px-4 sm:px-5">
          {/* Identity card */}
          <div className="relative p-4 overflow-hidden sm:p-5 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="flex items-center gap-3 sm:gap-4">
              <div
                className={`flex items-center justify-center text-base font-bold text-white bg-purple-700 rounded-full w-14 h-14 sm:w-16 sm:h-16 sm:text-lg shrink-0 ${
                  isLoading ? 'animate-pulse' : ''
                }`}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-base font-extrabold text-gray-900 truncate sm:text-xl ${
                    isLoading ? 'bg-gray-200 rounded h-5 w-32 animate-pulse' : ''
                  }`}
                >
                  {displayName}
                </p>
                <p
                  className={`text-[13px] sm:text-[15px] text-gray-400 truncate ${
                    isLoading ? 'bg-gray-200 rounded h-4 w-40 mt-1 animate-pulse' : ''
                  }`}
                >
                  {email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-4 sm:mt-5">
              <div className="p-3 sm:p-4 rounded-2xl bg-gray-100/80">
                <p className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] font-semibold tracking-wide text-emerald-600">
                  <TrendingUp size={14} /> DRIVING
                </p>
                <p className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                  {drivingScore}
                </p>
                <p className="text-[13px] sm:text-[14px] text-gray-400">{drivingGrade}</p>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-gray-100/80">
                <p className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] font-semibold tracking-wide text-amber-500">
                  <ShieldCheck size={14} /> TRUST
                </p>
                <p className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                  {trustScore}
                </p>
                <p className="text-[13px] sm:text-[14px] text-gray-400">Reputation</p>
              </div>
            </div>
          </div>

          {/* Report stats */}
          <div className="grid grid-cols-2 gap-3 px-2 mt-5 sm:mt-6">
            <div>
              <MapPin size={18} className="text-purple-700 sm:w-5 sm:h-5" />
              <p className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">
                {reports}
              </p>
              <p className="text-[13px] sm:text-[14px] text-gray-400">Reports</p>
            </div>
            <div>
              <Award size={18} className="text-purple-700 sm:w-5 sm:h-5" />
              <p className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">
                {confirmed}
              </p>
              <p className="text-[13px] sm:text-[14px] text-gray-400">Confirmed</p>
            </div>
          </div>

          {/* Menu */}
          <div className="flex flex-col mt-6 divide-y divide-gray-100 sm:mt-8">
            <MenuRow
              icon={<Star size={18} className="text-purple-700 sm:w-5 sm:h-5" />}
              title="Notifications"
              subtitle="Push, in-app, SMS"
              onClick={() => setOpenModal('notifications')}
            />
            <MenuRow
              icon={<AlertCircle size={18} className="text-purple-700 sm:w-5 sm:h-5" />}
              title="Emergency contacts"
              subtitle="Auto-notified on SOS"
              onClick={() => setOpenModal('emergency')}
            />
            <MenuRow
              icon={<ShieldCheck size={18} className="text-purple-700 sm:w-5 sm:h-5" />}
              title="Privacy"
              subtitle="Privacy & Security settings"
              onClick={() => setOpenModal('privacy')}
            />
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="mt-6 sm:mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-400 py-3.5 sm:py-4 text-[15px] sm:text-[16px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-70"
          >
            <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
            {isLoggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>

      {openModal === 'notifications' && <NotificationsModal onClose={() => setOpenModal(null)} />}
      {openModal === 'emergency' && <EmergencyContactModal onClose={() => setOpenModal(null)} />}
      {openModal === 'privacy' && <PrivacyModal onClose={() => setOpenModal(null)} />}
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
    <button
      onClick={onClick}
      className="flex items-center justify-between py-3.5 sm:py-4 text-left"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-9 w-9">{icon}</div>
        <div>
          <p className="text-[15px] sm:text-[16px] font-bold text-gray-900">{title}</p>
          <p className="text-[13px] sm:text-[14px] text-gray-400">{subtitle}</p>
        </div>
      </div>
      <span className="text-lg text-gray-300 sm:text-xl">›</span>
    </button>
  )
}



