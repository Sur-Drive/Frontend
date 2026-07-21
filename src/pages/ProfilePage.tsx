
// import { useState } from 'react'
// import type { ReactNode } from 'react'
// import { useNavigate } from 'react-router-dom'
// import {
//   MapPin,
//   Award,
//   TrendingUp,
//   ShieldCheck,
//   Star,
//   AlertCircle,
//   LogOut,
//   Building2,
//   Pencil,
// } from 'lucide-react'
// import { useProfile } from '../hooks/useProfile'
// import { useLogout } from '../hooks/useLogout'
// import AuthFlow from '../components/AuthFlow'
// import { NotificationsModal, EmergencyContactModal, PrivacyModal, FleetModal } from '../components/Profilemodals'
// import EditProfileModal from '../components/EditProfileModal'

// type ModalKey = 'notifications' | 'emergency' | 'privacy' | 'fleet' | null

// export default function Profile() {
//   const [openModal, setOpenModal] = useState<ModalKey>(null)
//   const [showAuth, setShowAuth] = useState(false)
//   const [editProfileOpen, setEditProfileOpen] = useState(false)

//   const { data: user, isLoading, isError, error } = useProfile()
//   const { mutate: logout, isPending: isLoggingOut } = useLogout()
//   const navigate = useNavigate()

//   const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token')

//   const displayName = user ? `${user.firstName} ${user.lastName}` : 'Loading…'
//   const initials = user
//     ? `${user.firstName[0]?.toUpperCase() ?? ''}${user.lastName[0]?.toUpperCase() ?? ''}`
//     : '--'
//   const email = user?.driverProfile?.phoneNumber ?? user?.phoneNumber ?? 'No contact info'

//   // Placeholder stats
//   const drivingScore = 75
//   const drivingGrade = 'Grade C'
//   const trustScore = 50
//   const reports = 0
//   const confirmed = 0

//   const handleSignOut = () => {
//     logout(undefined, {
//       onSettled: () => {
//         navigate('/home', { replace: true })
//       },
//     })
//   }

//   const handleCloseAuth = () => {
//     setShowAuth(false)
//     navigate('/home', { replace: true })
//   }

//   const handleAuthSuccess = () => {
//     setShowAuth(false)
//     window.location.reload()
//   }

//   // Not logged in at all — show the sign-in prompt instead of a broken profile fetch
//   if (!isLoggedIn) {
//     return (
//       <div className="min-h-[100dvh] bg-gray-50 pb-28">
//         <div className="max-w-xl mx-auto lg:max-w-2xl">
//           <h1 className="px-5 pt-6 pb-4 text-xl sm:text-2xl lg:text-[26px] font-extrabold text-gray-800">
//             Profile
//           </h1>

//           <div className="flex flex-col items-center px-6 text-center pt-14 sm:px-8 sm:pt-16 lg:pt-20">
//             <div className="relative flex items-center justify-center w-32 h-32 mb-6 sm:w-36 sm:h-36 lg:w-40 lg:h-40 sm:mb-8">
//               <div className="absolute w-36 h-[72px] rounded-full sm:w-40 sm:h-20 lg:w-48 lg:h-24 bg-purple-50" />
//               <div className="relative flex items-center justify-center w-[72px] h-[72px] bg-purple-100 rounded-full sm:w-20 sm:h-20 lg:w-24 lg:h-24">
//                 <LockIcon />
//               </div>
//             </div>

//             <h2 className="text-base font-bold text-gray-900 sm:text-lg lg:text-xl">Sign in to view your profile</h2>
//             <p className="mt-2 sm:mt-3 text-xs sm:text-sm lg:text-[15px] leading-relaxed text-gray-400">
//               Sign in or create an account to see your driving score, trust score, and account
//               settings.
//             </p>

//             <button
//               onClick={() => setShowAuth(true)}
//               className="mt-6 sm:mt-8 flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-purple-700 py-3 sm:py-3.5 lg:py-4 text-sm sm:text-[15px] lg:text-base font-semibold text-white transition active:scale-[0.98]"
//             >
//               Sign in
//             </button>
//           </div>
//         </div>

//         {showAuth && (
//           <AuthFlow onClose={handleCloseAuth} onAuthSuccess={handleAuthSuccess} />
//         )}
//       </div>
//     )
//   }

//   // Logged in, but the profile fetch itself failed for a non-auth reason
//   if (isError) {
//     return (
//       <div className="flex items-center justify-center min-h-[100dvh] bg-gray-50">
//         <div className="p-6 text-center">
//           <AlertCircle size={36} className="mx-auto mb-3 text-red-400" />
//           <p className="text-sm text-gray-600 sm:text-base">{error?.message || 'Something went wrong'}</p>
//           <button
//             onClick={() => window.location.reload()}
//             className="px-4 py-2 mt-4 text-xs font-semibold text-white bg-purple-700 sm:text-sm rounded-xl"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-[100dvh] bg-gray-50 pb-28">
//       {/* Full desktop width: single column on mobile/tablet, two-column layout
//           on large screens so the page uses the screen instead of floating a
//           narrow phone-width card in a sea of empty space. */}
//       <div className="max-w-xl mx-auto lg:max-w-5xl xl:max-w-6xl">
//         <h1 className="px-5 pt-6 pb-4 text-xl sm:text-2xl lg:text-[26px] font-extrabold text-gray-800">
//           Profile
//         </h1>

//         <div className="px-4 sm:px-5 lg:grid lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-6 lg:items-start">
//           {/* Left column: identity + stats */}
//           <div>
//             {/* Identity card */}
//             <div className="relative p-4 overflow-hidden sm:p-5 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100">
//               <button
//                 onClick={() => setEditProfileOpen(true)}
//                 className="absolute flex items-center gap-1 text-xs sm:text-[13px] font-semibold text-red-400 top-4 right-4 sm:top-5 sm:right-5"
//               >
//                 <Pencil size={13} /> Edit
//               </button>

//               <div className="flex items-center gap-3 sm:gap-4">
//                 <div
//                   className={`flex items-center justify-center text-sm sm:text-base font-bold text-white bg-purple-700 rounded-full w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 lg:text-lg shrink-0 ${
//                     isLoading ? 'animate-pulse' : ''
//                   }`}
//                 >
//                   {initials}
//                 </div>
//                 <div className="min-w-0 pr-14">
//                   <p
//                     className={`text-sm sm:text-base lg:text-lg font-extrabold text-gray-900 truncate ${
//                       isLoading ? 'bg-gray-200 rounded h-5 w-32 animate-pulse' : ''
//                     }`}
//                   >
//                     {displayName}
//                   </p>
//                   <p
//                     className={`text-xs sm:text-[13px] lg:text-sm text-gray-400 truncate ${
//                       isLoading ? 'bg-gray-200 rounded h-4 w-40 mt-1 animate-pulse' : ''
//                     }`}
//                   >
//                     {email}
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-4 sm:mt-5">
//                 <div className="p-3 sm:p-4 rounded-2xl bg-gray-100/80">
//                   <p className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wide text-emerald-600">
//                     <TrendingUp size={13} /> DRIVING
//                   </p>
//                   <p className="mt-1 text-xl sm:text-2xl lg:text-[28px] font-extrabold text-gray-900">
//                     {drivingScore}
//                   </p>
//                   <p className="text-xs sm:text-[13px] text-gray-400">{drivingGrade}</p>
//                 </div>
//                 <div className="p-3 sm:p-4 rounded-2xl bg-gray-100/80">
//                   <p className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wide text-amber-500">
//                     <ShieldCheck size={13} /> TRUST
//                   </p>
//                   <p className="mt-1 text-xl sm:text-2xl lg:text-[28px] font-extrabold text-gray-900">
//                     {trustScore}
//                   </p>
//                   <p className="text-xs sm:text-[13px] text-gray-400">Reputation</p>
//                 </div>
//               </div>
//             </div>

//             {/* Report stats */}
//             <div className="grid grid-cols-2 gap-3 px-2 mt-5 sm:mt-6">
//               <div>
//                 <MapPin size={17} className="text-purple-700" />
//                 <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-[28px] font-extrabold text-gray-900">
//                   {reports}
//                 </p>
//                 <p className="text-xs sm:text-[13px] text-gray-400">Reports</p>
//               </div>
//               <div>
//                 <Award size={17} className="text-purple-700" />
//                 <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-[28px] font-extrabold text-gray-900">
//                   {confirmed}
//                 </p>
//                 <p className="text-xs sm:text-[13px] text-gray-400">Confirmed</p>
//               </div>
//             </div>
//           </div>

//           {/* Right column: menu + sign out */}
//           <div>
//             <div className="flex flex-col mt-6 divide-y divide-gray-100 lg:mt-0 lg:rounded-3xl lg:bg-white lg:px-5 lg:divide-y lg:divide-gray-100 lg:shadow-sm">
//               <MenuRow
//                 icon={<Building2 size={17} className="text-purple-700" />}
//                 title="My Fleet"
//                 subtitle="Company, managers & assigned vehicle"
//                 onClick={() => setOpenModal('fleet')}
//               />
//               <MenuRow
//                 icon={<Star size={17} className="text-purple-700" />}
//                 title="Notifications"
//                 subtitle="Push, in-app, SMS"
//                 onClick={() => setOpenModal('notifications')}
//               />
//               <MenuRow
//                 icon={<AlertCircle size={17} className="text-purple-700" />}
//                 title="Emergency contacts"
//                 subtitle="Auto-notified on SOS"
//                 onClick={() => setOpenModal('emergency')}
//               />
//               <MenuRow
//                 icon={<ShieldCheck size={17} className="text-purple-700" />}
//                 title="Privacy"
//                 subtitle="Privacy & Security settings"
//                 onClick={() => setOpenModal('privacy')}
//               />
//             </div>

//             {/* Sign out */}
//             <button
//               onClick={handleSignOut}
//               disabled={isLoggingOut}
//               className="mt-6 sm:mt-8 lg:mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-400 py-3 sm:py-3.5 text-sm sm:text-[15px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-70"
//             >
//               <LogOut size={15} />
//               {isLoggingOut ? 'Signing out…' : 'Sign out'}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Profile modals */}
//       {openModal === 'notifications' && <NotificationsModal onClose={() => setOpenModal(null)} />}
//       {openModal === 'emergency' && <EmergencyContactModal onClose={() => setOpenModal(null)} />}
//       {openModal === 'privacy' && <PrivacyModal onClose={() => setOpenModal(null)} />}
//       {openModal === 'fleet' && <FleetModal onClose={() => setOpenModal(null)} />}

//       {/* Edit profile modal */}
//       {editProfileOpen && <EditProfileModal onClose={() => setEditProfileOpen(false)} />}
//     </div>
//   )
// }

// function LockIcon() {
//   return (
//     <svg
//       viewBox="0 0 24 24"
//       className="text-purple-500 w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <rect x="3" y="11" width="18" height="11" rx="2" />
//       <path d="M7 11V7a5 5 0 0 1 10 0v4" />
//     </svg>
//   )
// }

// function MenuRow({
//   icon,
//   title,
//   subtitle,
//   onClick,
// }: {
//   icon: ReactNode
//   title: string
//   subtitle: string
//   onClick: () => void
// }) {
//   return (
//     <button
//       onClick={onClick}
//       className="flex items-center justify-between py-3.5 sm:py-4 text-left"
//     >
//       <div className="flex items-center gap-3">
//         <div className="flex items-center justify-center h-9 w-9">{icon}</div>
//         <div>
//           <p className="text-sm sm:text-[15px] font-bold text-gray-900">{title}</p>
//           <p className="text-xs sm:text-[13px] text-gray-400">{subtitle}</p>
//         </div>
//       </div>
//       <span className="text-base text-gray-300 sm:text-lg">›</span>
//     </button>
//   )
// }



















// import { useState } from 'react'
// import type { ReactNode } from 'react'
// import { useNavigate } from 'react-router-dom'
// import {
//   MapPin,
//   Award,
//   TrendingUp,
//   ShieldCheck,
//   Star,
//   AlertCircle,
//   LogOut,
//   Building2,
//   Pencil,
// } from 'lucide-react'
// import { useProfile } from '../hooks/useProfile'
// import { useLogout } from '../hooks/useLogout'
// import AuthFlow from '../components/AuthFlow'
// import { NotificationsModal, EmergencyContactModal, PrivacyModal, FleetModal } from '../components/Profilemodals'
// import EditProfileModal from '../components/EditProfileModal'

// type ModalKey = 'notifications' | 'emergency' | 'privacy' | 'fleet' | null

// export default function Profile() {
//   const [openModal, setOpenModal] = useState<ModalKey>(null)
//   const [showAuth, setShowAuth] = useState(false)
//   const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
//   const [editProfileOpen, setEditProfileOpen] = useState(false)

//   const { data: user, isLoading, isError, error } = useProfile()
//   const { mutate: logout, isPending: isLoggingOut } = useLogout()
//   const navigate = useNavigate()

//   const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token')

//   const displayName = user ? `${user.firstName} ${user.lastName}` : 'Loading…'
//   const initials = user
//     ? `${user.firstName[0]?.toUpperCase() ?? ''}${user.lastName[0]?.toUpperCase() ?? ''}`
//     : '--'
//   const email = user?.driverProfile?.phoneNumber ?? user?.phoneNumber ?? 'No contact info'

//   // Placeholder stats
//   const drivingScore = 75
//   const drivingGrade = 'Grade C'
//   const trustScore = 50
//   const reports = 0
//   const confirmed = 0

//   const handleSignOut = () => {
//     logout(undefined, {
//       onSettled: () => {
//         navigate('/home', { replace: true })
//       },
//     })
//   }

//   const handleCloseAuth = () => {
//     setShowAuth(false)
//   }

//   const handleAuthSuccess = () => {
//     setShowAuth(false)
//     window.location.reload()
//   }

//   const handleSignIn = () => {
//     setAuthMode('signin')
//     setShowAuth(true)
//   }

//   const handleCreateAccount = () => {
//     setAuthMode('signup')
//     setShowAuth(true)
//   }

//   // Not logged in at all — show the sign-in prompt instead of a broken profile fetch
//   if (!isLoggedIn) {
//     return (
//       <div className="min-h-[100dvh] bg-gray-50 pb-28">
//         <div className="max-w-xl mx-auto lg:max-w-2xl">
//           <h1 className="px-5 pt-6 pb-4 text-xl sm:text-2xl lg:text-[26px] font-extrabold text-gray-800">
//             Profile
//           </h1>

//           {/* Same style as MyReport signed-out state */}
//           <div className="flex flex-col items-center px-6 text-center pt-14 sm:px-8 sm:pt-16 lg:pt-20">
//             <div className="relative flex items-center justify-center w-32 h-32 mb-6 sm:w-36 sm:h-36 lg:w-40 lg:h-40 sm:mb-8">
//               <div className="absolute w-36 h-[72px] rounded-full sm:w-40 sm:h-20 lg:w-48 lg:h-24 bg-purple-50" />
//               <span className="absolute text-sm text-purple-200 sm:text-base -left-2 top-2">✦</span>
//               <span className="absolute text-lg text-purple-200 sm:text-xl -right-2 top-8 sm:top-10">✦</span>
//               <div className="relative flex items-center justify-center w-[72px] h-[72px] bg-purple-100 rounded-full sm:w-20 sm:h-20 lg:w-24 lg:h-24">
//                 <LockIcon />
//               </div>
//             </div>

//             <h2 className="text-base font-bold text-gray-900 sm:text-lg lg:text-xl">Sign in to view your profile</h2>
//             <p className="max-w-sm mt-2 sm:mt-3 text-xs sm:text-sm lg:text-[15px] leading-relaxed text-gray-400">
//               Sign in or create an account to see your driving score, trust score, and account
//               settings.
//             </p>

//             {/* Same button arrangement as MyReport: white on top, purple on bottom */}
//             <div className="flex flex-col w-full max-w-sm gap-3 mt-6 sm:mt-8">
//               <button
//                 onClick={handleCreateAccount}
//                 className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-purple-200 bg-white py-3 sm:py-3.5 lg:py-4 text-sm sm:text-[15px] lg:text-base font-semibold text-purple-700 transition active:scale-[0.98] hover:bg-purple-50"
//               >
//                 Create Account
//               </button>
//               <button
//                 onClick={handleSignIn}
//                 className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-700 py-3 sm:py-3.5 lg:py-4 text-sm sm:text-[15px] lg:text-base font-semibold text-white transition active:scale-[0.98]"
//               >
//                 Sign in
//               </button>
//             </div>
//           </div>
//         </div>

//         {showAuth && (
//           <AuthFlow
//             initialScreen={authMode}
//             onClose={handleCloseAuth}
//             onAuthSuccess={handleAuthSuccess}
//           />
//         )}
//       </div>
//     )
//   }

//   // Logged in, but the profile fetch itself failed for a non-auth reason
//   if (isError) {
//     return (
//       <div className="flex items-center justify-center min-h-[100dvh] bg-gray-50">
//         <div className="p-6 text-center">
//           <AlertCircle size={36} className="mx-auto mb-3 text-red-400" />
//           <p className="text-sm text-gray-600 sm:text-base">{error?.message || 'Something went wrong'}</p>
//           <button
//             onClick={() => window.location.reload()}
//             className="px-4 py-2 mt-4 text-xs font-semibold text-white bg-purple-700 sm:text-sm rounded-xl"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-[100dvh] bg-gray-50 pb-28">
//       <div className="max-w-xl mx-auto lg:max-w-5xl xl:max-w-6xl">
//         <h1 className="px-5 pt-6 pb-4 text-xl sm:text-2xl lg:text-[26px] font-extrabold text-gray-800">
//           Profile
//         </h1>

//         <div className="px-4 sm:px-5 lg:grid lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-6 lg:items-start">
//           {/* Left column: identity + stats */}
//           <div>
//             {/* Identity card */}
//             <div className="relative p-4 overflow-hidden sm:p-5 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100">
//               <button
//                 onClick={() => setEditProfileOpen(true)}
//                 className="absolute flex items-center gap-1 text-xs sm:text-[13px] font-semibold text-red-400 top-4 right-4 sm:top-5 sm:right-5"
//               >
//                 <Pencil size={13} /> Edit
//               </button>

//               <div className="flex items-center gap-3 sm:gap-4">
//                 <div
//                   className={`flex items-center justify-center text-sm sm:text-base font-bold text-white bg-purple-700 rounded-full w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 lg:text-lg shrink-0 ${
//                     isLoading ? 'animate-pulse' : ''
//                   }`}
//                 >
//                   {initials}
//                 </div>
//                 <div className="min-w-0 pr-14">
//                   <p
//                     className={`text-sm sm:text-base lg:text-lg font-extrabold text-gray-900 truncate ${
//                       isLoading ? 'bg-gray-200 rounded h-5 w-32 animate-pulse' : ''
//                     }`}
//                   >
//                     {displayName}
//                   </p>
//                   <p
//                     className={`text-xs sm:text-[13px] lg:text-sm text-gray-400 truncate ${
//                       isLoading ? 'bg-gray-200 rounded h-4 w-40 mt-1 animate-pulse' : ''
//                     }`}
//                   >
//                     {email}
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-4 sm:mt-5">
//                 <div className="p-3 sm:p-4 rounded-2xl bg-gray-100/80">
//                   <p className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wide text-emerald-600">
//                     <TrendingUp size={13} /> DRIVING
//                   </p>
//                   <p className="mt-1 text-xl sm:text-2xl lg:text-[28px] font-extrabold text-gray-900">
//                     {drivingScore}
//                   </p>
//                   <p className="text-xs sm:text-[13px] text-gray-400">{drivingGrade}</p>
//                 </div>
//                 <div className="p-3 sm:p-4 rounded-2xl bg-gray-100/80">
//                   <p className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wide text-amber-500">
//                     <ShieldCheck size={13} /> TRUST
//                   </p>
//                   <p className="mt-1 text-xl sm:text-2xl lg:text-[28px] font-extrabold text-gray-900">
//                     {trustScore}
//                   </p>
//                   <p className="text-xs sm:text-[13px] text-gray-400">Reputation</p>
//                 </div>
//               </div>
//             </div>

//             {/* Report stats */}
//             <div className="grid grid-cols-2 gap-3 px-2 mt-5 sm:mt-6">
//               <div>
//                 <MapPin size={17} className="text-purple-700" />
//                 <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-[28px] font-extrabold text-gray-900">
//                   {reports}
//                 </p>
//                 <p className="text-xs sm:text-[13px] text-gray-400">Reports</p>
//               </div>
//               <div>
//                 <Award size={17} className="text-purple-700" />
//                 <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-[28px] font-extrabold text-gray-900">
//                   {confirmed}
//                 </p>
//                 <p className="text-xs sm:text-[13px] text-gray-400">Confirmed</p>
//               </div>
//             </div>
//           </div>

//           {/* Right column: menu + sign out */}
//           <div>
//             <div className="flex flex-col mt-6 divide-y divide-gray-100 lg:mt-0 lg:rounded-3xl lg:bg-white lg:px-5 lg:divide-y lg:divide-gray-100 lg:shadow-sm">
//               <MenuRow
//                 icon={<Building2 size={17} className="text-purple-700" />}
//                 title="My Fleet"
//                 subtitle="Company, managers & assigned vehicle"
//                 onClick={() => setOpenModal('fleet')}
//               />
//               <MenuRow
//                 icon={<Star size={17} className="text-purple-700" />}
//                 title="Notifications"
//                 subtitle="Push, in-app, SMS"
//                 onClick={() => setOpenModal('notifications')}
//               />
//               <MenuRow
//                 icon={<AlertCircle size={17} className="text-purple-700" />}
//                 title="Emergency contacts"
//                 subtitle="Auto-notified on SOS"
//                 onClick={() => setOpenModal('emergency')}
//               />
//               <MenuRow
//                 icon={<ShieldCheck size={17} className="text-purple-700" />}
//                 title="Privacy"
//                 subtitle="Privacy & Security settings"
//                 onClick={() => setOpenModal('privacy')}
//               />
//             </div>

//             {/* Sign out */}
//             <button
//               onClick={handleSignOut}
//               disabled={isLoggingOut}
//               className="mt-6 sm:mt-8 lg:mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-400 py-3 sm:py-3.5 text-sm sm:text-[15px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-70"
//             >
//               <LogOut size={15} />
//               {isLoggingOut ? 'Signing out…' : 'Sign out'}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Profile modals */}
//       {openModal === 'notifications' && <NotificationsModal onClose={() => setOpenModal(null)} />}
//       {openModal === 'emergency' && <EmergencyContactModal onClose={() => setOpenModal(null)} />}
//       {openModal === 'privacy' && <PrivacyModal onClose={() => setOpenModal(null)} />}
//       {openModal === 'fleet' && <FleetModal onClose={() => setOpenModal(null)} />}

//       {/* Edit profile modal */}
//       {editProfileOpen && <EditProfileModal onClose={() => setEditProfileOpen(false)} />}
//     </div>
//   )
// }

// function LockIcon() {
//   return (
//     <svg
//       viewBox="0 0 24 24"
//       className="text-purple-500 w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <rect x="3" y="11" width="18" height="11" rx="2" />
//       <path d="M7 11V7a5 5 0 0 1 10 0v4" />
//     </svg>
//   )
// }

// function MenuRow({
//   icon,
//   title,
//   subtitle,
//   onClick,
// }: {
//   icon: ReactNode
//   title: string
//   subtitle: string
//   onClick: () => void
// }) {
//   return (
//     <button
//       onClick={onClick}
//       className="flex items-center justify-between py-3.5 sm:py-4 text-left"
//     >
//       <div className="flex items-center gap-3">
//         <div className="flex items-center justify-center h-9 w-9">{icon}</div>
//         <div>
//           <p className="text-sm sm:text-[15px] font-bold text-gray-900">{title}</p>
//           <p className="text-xs sm:text-[13px] text-gray-400">{subtitle}</p>
//         </div>
//       </div>
//       <span className="text-base text-gray-300 sm:text-lg">›</span>
//     </button>
//   )
// }














import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Award,
  TrendingUp,
  ShieldCheck,
  Star,
  AlertCircle,
  LogOut,
  Building2,
  Pencil,
} from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useLogout } from '../hooks/useLogout'
import AuthFlow from '../components/AuthFlow'
import { NotificationsModal, EmergencyContactModal, PrivacyModal, FleetModal } from '../components/Profilemodals'
import EditProfileModal from '../components/EditProfileModal'

type ModalKey = 'notifications' | 'emergency' | 'privacy' | 'fleet' | null

export default function Profile() {
  const [openModal, setOpenModal] = useState<ModalKey>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [editProfileOpen, setEditProfileOpen] = useState(false)

  const { data: user, isLoading, isError, error } = useProfile()
  const { mutate: logout, isPending: isLoggingOut } = useLogout()
  const navigate = useNavigate()

  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token')

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Loading…'
  const initials = user
    ? `${user.firstName[0]?.toUpperCase() ?? ''}${user.lastName[0]?.toUpperCase() ?? ''}`
    : '--'
  const email = user?.driverProfile?.phoneNumber ?? user?.phoneNumber ?? 'No contact info'

  // Placeholder stats
  const drivingScore = 75
  const drivingGrade = 'Grade C'
  const trustScore = 50
  const reports = 0
  const confirmed = 0

  const handleSignOut = () => {
    logout(undefined, {
      onSettled: () => {
        navigate('/home', { replace: true })
      },
    })
  }

  const handleCloseAuth = () => {
    setShowAuth(false)
  }

  const handleAuthSuccess = () => {
    setShowAuth(false)
    window.location.reload()
  }

  const handleSignIn = () => {
    setAuthMode('signin')
    setShowAuth(true)
  }

  const handleCreateAccount = () => {
    setAuthMode('signup')
    setShowAuth(true)
  }

  // Not logged in at all
  if (!isLoggedIn) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 pb-28">
        <div className="max-w-xl mx-auto">
          {/* Smaller header matching MyReport style */}
          <h1 className="px-5 pt-5 pb-3 text-lg font-extrabold text-gray-800 sm:text-xl">
            Profile
          </h1>

          {/* Same compact style as MyReport signed-out state */}
          <div className="flex flex-col items-center px-6 pt-10 text-center sm:pt-14">
            <div className="relative flex items-center justify-center mb-5 w-28 h-28 sm:w-32 sm:h-32 sm:mb-6">
              <div className="absolute w-32 h-16 rounded-full sm:w-36 sm:h-[72px] bg-purple-50" />
              <span className="absolute text-sm text-purple-200 -left-1 top-1">✦</span>
              <span className="absolute text-base text-purple-200 -right-1 top-6 sm:top-8">✦</span>
              <div className="relative flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full sm:w-[72px] sm:h-[72px]">
                <LockIcon />
              </div>
            </div>

            {/* Smaller title */}
            <h2 className="text-base font-bold text-gray-900 sm:text-lg">
              Sign in to view your profile
            </h2>
            {/* Smaller paragraph */}
            <p className="max-w-sm mt-2 text-xs leading-relaxed text-gray-400 sm:text-sm">
              Sign in or create an account to see your driving score, trust score, and account
              settings.
            </p>

            {/* Same button stack as MyReport */}
            <div className="flex flex-col w-full max-w-sm gap-3 mt-6 sm:mt-8">
              <button
                onClick={handleCreateAccount}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-purple-200 bg-white py-3 text-sm font-semibold text-purple-700 transition active:scale-[0.98] hover:bg-purple-50"
              >
                Create Account
              </button>
              <button
                onClick={handleSignIn}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-700 py-3 text-sm font-semibold text-white transition active:scale-[0.98]"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>

        {showAuth && (
          <AuthFlow
            initialScreen={authMode}
            onClose={handleCloseAuth}
            onAuthSuccess={handleAuthSuccess}
          />
        )}
      </div>
    )
  }

  // Logged in, but the profile fetch itself failed for a non-auth reason
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-gray-50">
        <div className="p-6 text-center">
          <AlertCircle size={36} className="mx-auto mb-3 text-red-400" />
          <p className="text-sm text-gray-600 sm:text-base">{error?.message || 'Something went wrong'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 mt-4 text-xs font-semibold text-white bg-purple-700 sm:text-sm rounded-xl"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 pb-28">
      <div className="max-w-xl mx-auto lg:max-w-5xl xl:max-w-6xl">
        <h1 className="px-5 pt-6 pb-4 text-xl sm:text-2xl lg:text-[26px] font-extrabold text-gray-800">
          Profile
        </h1>

        <div className="px-4 sm:px-5 lg:grid lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-6 lg:items-start">
          {/* Left column: identity + stats */}
          <div>
            {/* Identity card */}
            <div className="relative p-4 overflow-hidden sm:p-5 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100">
              <button
                onClick={() => setEditProfileOpen(true)}
                className="absolute flex items-center gap-1 text-xs sm:text-[13px] font-semibold text-red-400 top-4 right-4 sm:top-5 sm:right-5"
              >
                <Pencil size={13} /> Edit
              </button>

              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className={`flex items-center justify-center text-sm sm:text-base font-bold text-white bg-purple-700 rounded-full w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 lg:text-lg shrink-0 ${
                    isLoading ? 'animate-pulse' : ''
                  }`}
                >
                  {initials}
                </div>
                <div className="min-w-0 pr-14">
                  <p
                    className={`text-sm sm:text-base lg:text-lg font-extrabold text-gray-900 truncate ${
                      isLoading ? 'bg-gray-200 rounded h-5 w-32 animate-pulse' : ''
                    }`}
                  >
                    {displayName}
                  </p>
                  <p
                    className={`text-xs sm:text-[13px] lg:text-sm text-gray-400 truncate ${
                      isLoading ? 'bg-gray-200 rounded h-4 w-40 mt-1 animate-pulse' : ''
                    }`}
                  >
                    {email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-4 sm:mt-5">
                <div className="p-3 sm:p-4 rounded-2xl bg-gray-100/80">
                  <p className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wide text-emerald-600">
                    <TrendingUp size={13} /> DRIVING
                  </p>
                  <p className="mt-1 text-xl sm:text-2xl lg:text-[28px] font-extrabold text-gray-900">
                    {drivingScore}
                  </p>
                  <p className="text-xs sm:text-[13px] text-gray-400">{drivingGrade}</p>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-gray-100/80">
                  <p className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wide text-amber-500">
                    <ShieldCheck size={13} /> TRUST
                  </p>
                  <p className="mt-1 text-xl sm:text-2xl lg:text-[28px] font-extrabold text-gray-900">
                    {trustScore}
                  </p>
                  <p className="text-xs sm:text-[13px] text-gray-400">Reputation</p>
                </div>
              </div>
            </div>

            {/* Report stats */}
            <div className="grid grid-cols-2 gap-3 px-2 mt-5 sm:mt-6">
              <div>
                <MapPin size={17} className="text-purple-700" />
                <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-[28px] font-extrabold text-gray-900">
                  {reports}
                </p>
                <p className="text-xs sm:text-[13px] text-gray-400">Reports</p>
              </div>
              <div>
                <Award size={17} className="text-purple-700" />
                <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-[28px] font-extrabold text-gray-900">
                  {confirmed}
                </p>
                <p className="text-xs sm:text-[13px] text-gray-400">Confirmed</p>
              </div>
            </div>
          </div>

          {/* Right column: menu + sign out */}
          <div>
            <div className="flex flex-col mt-6 divide-y divide-gray-100 lg:mt-0 lg:rounded-3xl lg:bg-white lg:px-5 lg:divide-y lg:divide-gray-100 lg:shadow-sm">
              <MenuRow
                icon={<Building2 size={17} className="text-purple-700" />}
                title="My Fleet"
                subtitle="Company, managers & assigned vehicle"
                onClick={() => setOpenModal('fleet')}
              />
              <MenuRow
                icon={<Star size={17} className="text-purple-700" />}
                title="Notifications"
                subtitle="Push, in-app, SMS"
                onClick={() => setOpenModal('notifications')}
              />
              <MenuRow
                icon={<AlertCircle size={17} className="text-purple-700" />}
                title="Emergency contacts"
                subtitle="Auto-notified on SOS"
                onClick={() => setOpenModal('emergency')}
              />
              <MenuRow
                icon={<ShieldCheck size={17} className="text-purple-700" />}
                title="Privacy"
                subtitle="Privacy & Security settings"
                onClick={() => setOpenModal('privacy')}
              />
            </div>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="mt-6 sm:mt-8 lg:mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-400 py-3 sm:py-3.5 text-sm sm:text-[15px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-70"
            >
              <LogOut size={15} />
              {isLoggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>

      {/* Profile modals */}
      {openModal === 'notifications' && <NotificationsModal onClose={() => setOpenModal(null)} />}
      {openModal === 'emergency' && <EmergencyContactModal onClose={() => setOpenModal(null)} />}
      {openModal === 'privacy' && <PrivacyModal onClose={() => setOpenModal(null)} />}
      {openModal === 'fleet' && <FleetModal onClose={() => setOpenModal(null)} />}

      {/* Edit profile modal */}
      {editProfileOpen && <EditProfileModal onClose={() => setEditProfileOpen(false)} />}
    </div>
  )
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6 text-purple-500 sm:w-7 sm:h-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
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
          <p className="text-sm sm:text-[15px] font-bold text-gray-900">{title}</p>
          <p className="text-xs sm:text-[13px] text-gray-400">{subtitle}</p>
        </div>
      </div>
      <span className="text-base text-gray-300 sm:text-lg">›</span>
    </button>
  )
}