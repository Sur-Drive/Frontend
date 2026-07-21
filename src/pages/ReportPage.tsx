// import { useState } from 'react'
// import { Paperclip, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
// import AddReportModal from '../components/Addreportmodal'
// import AuthFlow from '../components/AuthFlow'
// import { useMyHazards } from '../hooks/useHazards'
// import type { BackendHazardType, Hazard } from '../types/hazard'

// const HAZARD_EMOJI: Record<BackendHazardType, string> = {
//   POTHOLE: '🕳️',
//   FLOOD: '🌊',
//   ACCIDENT: '🚧',
//   DEBRIS: '🪨',
//   ROAD: '🚜',
//   CHECKPOINT: '🛂',
//   DANGER: '⚠️',
//   SOS: '🆘',
// }

// function formatTimeAgo(dateStr: string): string {
//   const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
//   if (minutes < 1) return 'just now'
//   if (minutes < 60) return `${minutes}m ago`
//   return `${Math.floor(minutes / 60)}h ago`
// }

// // ---------- Signed-out state ----------

// function SignedOutState({ onSignIn }: { onSignIn: () => void }) {
//   return (
//     <div className="flex flex-col items-center px-6 text-center pt-14 sm:px-8 sm:pt-16 lg:pt-20">
//       <div className="relative flex items-center justify-center w-32 h-32 mb-6 sm:w-36 sm:h-36 lg:w-40 lg:h-40 sm:mb-8">
//         <div className="absolute w-36 h-[72px] rounded-full sm:w-40 sm:h-20 lg:w-48 lg:h-24 bg-purple-50" />
//         <span className="absolute text-sm text-purple-200 sm:text-base -left-2 top-2">✦</span>
//         <span className="absolute text-lg text-purple-200 sm:text-xl -right-2 top-8 sm:top-10">✦</span>
//         <div className="relative flex items-center justify-center w-[72px] h-[72px] bg-purple-100 rounded-full sm:w-20 sm:h-20 lg:w-24 lg:h-24">
//           <LockIcon />
//         </div>
//       </div>

//       <h2 className="text-base font-bold text-gray-900 sm:text-lg">Sign in to see your reports</h2>
//       <p className="max-w-sm mt-2 text-xs leading-relaxed text-gray-400 sm:mt-3 sm:text-sm">
//         You need an account to submit and track road hazard reports. Sign in or create an account
//         to get started.
//       </p>

//       <button
//         onClick={onSignIn}
//         className="mt-6 sm:mt-8 flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-purple-700 py-3 sm:py-3.5 text-sm sm:text-[15px] font-semibold text-white transition active:scale-[0.98]"
//       >
//         Sign in
//       </button>
//     </div>
//   )
// }

// function LockIcon() {
//   return (
//     <svg
//       viewBox="0 0 24 24"
//       className="text-purple-500 w-7 h-7 sm:w-8 sm:h-8"
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

// // ---------- Empty state (signed in, no reports) ----------

// function EmptyState({ onAddReport }: { onAddReport: () => void }) {
//   return (
//     <div className="flex flex-col items-center px-6 text-center pt-14 sm:px-8 sm:pt-16 lg:pt-20">
//       <div className="relative flex items-center justify-center w-32 h-32 mb-6 sm:w-36 sm:h-36 lg:w-40 lg:h-40 sm:mb-8">
//         <div className="absolute w-36 h-[72px] rounded-full sm:w-40 sm:h-20 lg:w-48 lg:h-24 bg-gray-50" />
//         <span className="absolute text-sm text-gray-300 sm:text-base -left-2 top-2">✦</span>
//         <span className="absolute text-lg text-gray-300 sm:text-xl -right-2 top-8 sm:top-10">✦</span>
//         <span className="absolute left-0 text-[11px] text-gray-300 sm:text-xs bottom-6 sm:bottom-8">✦</span>
//         <div className="relative w-14 h-[72px] bg-gray-300 rounded-lg shadow-sm sm:w-20 sm:h-24 -rotate-6" />
//         <div className="absolute w-14 h-[72px] bg-white rounded-lg shadow-sm sm:w-20 sm:h-24 rotate-3 ring-1 ring-gray-100">
//           <div className="mt-4 sm:mt-5 flex flex-col gap-1 sm:gap-1.5 px-2.5 sm:px-3">
//             <div className="w-8 h-0.5 sm:w-10 sm:h-1 bg-gray-200 rounded" />
//             <div className="w-6 h-0.5 sm:w-8 sm:h-1 bg-gray-200 rounded" />
//             <div className="h-0.5 sm:h-1 bg-gray-200 rounded w-7 sm:w-9" />
//           </div>
//         </div>
//         <Paperclip
//           size={20}
//           className="absolute text-gray-400 -translate-x-1/2 -top-2 left-1/2 -rotate-12 sm:w-6 sm:h-6"
//         />
//       </div>

//       <h2 className="text-base font-bold text-gray-900 sm:text-lg">No Reports Yet</h2>
//       <p className="max-w-sm mt-2 text-xs leading-relaxed text-gray-400 sm:mt-3 sm:text-sm">
//         You haven't submitted any road hazard reports yet. Help make the roads safer by reporting
//         potholes, accidents, floods, roadworks, and other hazards you encounter.
//       </p>

//       <button
//         onClick={onAddReport}
//         className="mt-6 sm:mt-8 flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-purple-700 py-3 sm:py-3.5 text-sm sm:text-[15px] font-semibold text-white transition active:scale-[0.98]"
//       >
//         <span className="text-sm leading-none sm:text-base">+</span> Add report
//       </button>
//     </div>
//   )
// }

// // ---------- Report card ----------

// function MyReportCard({ report }: { report: Hazard }) {
//   return (
//     <div className="w-full overflow-hidden bg-white border border-gray-100 shadow-sm rounded-3xl">
//       <div className="relative flex items-center justify-center h-24 sm:h-28 lg:h-32 bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100">
//         {report.photoUrl ? (
//           <img src={report.photoUrl} alt="" className="absolute inset-0 object-cover w-full h-full" />
//         ) : (
//           <>
//             <div
//               className="absolute inset-0 opacity-40"
//               style={{
//                 backgroundImage:
//                   'repeating-linear-gradient(115deg, transparent, transparent 38px, rgba(100,130,150,0.35) 38px, rgba(100,130,150,0.35) 40px)',
//               }}
//             />
//             <span className="relative text-2xl sm:text-3xl drop-shadow-sm">
//               {HAZARD_EMOJI[report.type]}
//             </span>
//           </>
//         )}
//       </div>

//       <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-3 sm:pt-3.5">
//         <div className="flex items-center justify-between gap-2">
//           <span className="rounded-full bg-gray-100 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-medium text-gray-600">
//             {report.type}
//           </span>
//           <span className="text-[11px] sm:text-xs text-gray-400 whitespace-nowrap">
//             🕐 {formatTimeAgo(report.createdAt)}
//           </span>
//         </div>

//         <h3 className="mt-2 sm:mt-2.5 text-sm sm:text-base font-bold leading-snug text-gray-900">
//           {report.description || report.type}
//         </h3>

//         <p className="mt-1 text-xs sm:text-[13px] text-gray-500">
//           📍 {report.location.address || 'Unknown location'}
//         </p>

//         <div className="mt-3 sm:mt-3.5 flex items-center gap-2 sm:gap-2.5">
//           <span className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-[13px] font-medium text-gray-700">
//             <ThumbsUp size={14} /> {report.confirmations.confirms}
//           </span>
//           <span className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-[13px] font-medium text-gray-700">
//             <ThumbsDown size={14} /> {report.confirmations.incorrects}
//           </span>
//         </div>
//       </div>
//     </div>
//   )
// }

// // ---------- Page ----------

// export default function MyReport() {
//   const [showModal, setShowModal] = useState(false)
//   const [showAuth, setShowAuth] = useState(false)
//   const { data: reports = [], isLoading, isError, refetch } = useMyHazards()

//   const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token')

//   const openAddReport = () => {
//     if (isLoggedIn) {
//       setShowModal(true)
//     } else {
//       setShowAuth(true)
//     }
//   }

//   return (
//     <div className="min-h-[100dvh] bg-gray-50 pb-28">
//       {/* Single-column stacked cards on every screen, like the original.
//           Container widens on larger screens so cards get a bit more
//           breathing room without turning into a multi-column grid. */}
//       <div className="max-w-xl mx-auto lg:max-w-5xl">
//         {/* Header */}
//         <div className="flex items-center justify-between px-4 pt-5 pb-3 sm:px-5 sm:pt-6 sm:pb-4">
//           <h1 className="text-lg font-extrabold leading-none text-gray-800 sm:text-xl lg:text-2xl">
//             My Report
//           </h1>
//           <button
//             onClick={openAddReport}
//             className="text-xs font-semibold text-purple-700 sm:text-sm"
//           >
//             Add Report
//           </button>
//         </div>

//         {/* Content */}
//         {!isLoggedIn ? (
//           <SignedOutState onSignIn={() => setShowAuth(true)} />
//         ) : isLoading ? (
//           <div className="flex items-center justify-center py-16">
//             <Loader2 size={22} className="text-purple-700 animate-spin" />
//           </div>
//         ) : isError ? (
//           <p className="px-6 text-xs text-center text-red-500 sm:text-sm">Failed to load your reports.</p>
//         ) : reports.length === 0 ? (
//           <EmptyState onAddReport={openAddReport} />
//         ) : (
//           <div className="flex flex-col gap-3.5 sm:gap-4 px-4 sm:px-5">
//             {reports.map((report) => (
//               <MyReportCard key={report.id} report={report} />
//             ))}
//           </div>
//         )}

//         {showModal && (
//           <AddReportModal onClose={() => setShowModal(false)} onSuccess={() => setShowModal(false)} />
//         )}

//         {showAuth && (
//           <AuthFlow
//             onClose={() => setShowAuth(false)}
//             onAuthSuccess={() => {
//               setShowAuth(false)
//               refetch()
//             }}
//           />
//         )}
//       </div>
//     </div>
//   )
// }





// import { useState } from 'react'
// import { Paperclip, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
// import AddReportModal from '../components/Addreportmodal'
// import AuthFlow from '../components/AuthFlow'
// import { useMyHazards } from '../hooks/useHazards'
// import type { BackendHazardType, Hazard } from '../types/hazard'

// const HAZARD_EMOJI: Record<BackendHazardType, string> = {
//   POTHOLE: '🕳️',
//   FLOOD: '🌊',
//   ACCIDENT: '🚧',
//   DEBRIS: '🪨',
//   ROAD: '🚜',
//   CHECKPOINT: '🛂',
//   DANGER: '⚠️',
//   SOS: '🆘',
// }

// function formatTimeAgo(dateStr: string): string {
//   const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
//   if (minutes < 1) return 'just now'
//   if (minutes < 60) return `${minutes}m ago`
//   return `${Math.floor(minutes / 60)}h ago`
// }

// // ---------- Signed-out state ----------

// function SignedOutState({
//   onSignIn,
//   onCreateAccount,
// }: {
//   onSignIn: () => void
//   onCreateAccount: () => void
// }) {
//   return (
//     <div className="flex flex-col items-center px-6 text-center pt-14 sm:px-8 sm:pt-16 lg:pt-20">
//       <div className="relative flex items-center justify-center w-32 h-32 mb-6 sm:w-36 sm:h-36 lg:w-40 lg:h-40 sm:mb-8">
//         <div className="absolute w-36 h-[72px] rounded-full sm:w-40 sm:h-20 lg:w-48 lg:h-24 bg-purple-50" />
//         <span className="absolute text-sm text-purple-200 sm:text-base -left-2 top-2">✦</span>
//         <span className="absolute text-lg text-purple-200 sm:text-xl -right-2 top-8 sm:top-10">✦</span>
//         <div className="relative flex items-center justify-center w-[72px] h-[72px] bg-purple-100 rounded-full sm:w-20 sm:h-20 lg:w-24 lg:h-24">
//           <LockIcon />
//         </div>
//       </div>

//       <h2 className="text-base font-bold text-gray-900 sm:text-lg">Sign in to see your reports</h2>
//       <p className="max-w-sm mt-2 text-xs leading-relaxed text-gray-400 sm:mt-3 sm:text-sm">
//         You need an account to submit and track road hazard reports. Sign in or create an account
//         to get started.
//       </p>

//       <div className="flex flex-col w-full max-w-sm gap-3 mt-6 sm:mt-8">
//         <button
//           onClick={onSignIn}
//           className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-700 py-3 sm:py-3.5 text-sm sm:text-[15px] font-semibold text-white transition active:scale-[0.98]"
//         >
//           Sign in
//         </button>
//         <button
//           onClick={onCreateAccount}
//           className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-purple-200 bg-white py-3 sm:py-3.5 text-sm sm:text-[15px] font-semibold text-purple-700 transition active:scale-[0.98] hover:bg-purple-50"
//         >
//           Create Account
//         </button>
//       </div>
//     </div>
//   )
// }

// function LockIcon() {
//   return (
//     <svg
//       viewBox="0 0 24 24"
//       className="text-purple-500 w-7 h-7 sm:w-8 sm:h-8"
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

// // ---------- Empty state (signed in, no reports) ----------

// function EmptyState({ onAddReport }: { onAddReport: () => void }) {
//   return (
//     <div className="flex flex-col items-center px-6 text-center pt-14 sm:px-8 sm:pt-16 lg:pt-20">
//       <div className="relative flex items-center justify-center w-32 h-32 mb-6 sm:w-36 sm:h-36 lg:w-40 lg:h-40 sm:mb-8">
//         <div className="absolute w-36 h-[72px] rounded-full sm:w-40 sm:h-20 lg:w-48 lg:h-24 bg-gray-50" />
//         <span className="absolute text-sm text-gray-300 sm:text-base -left-2 top-2">✦</span>
//         <span className="absolute text-lg text-gray-300 sm:text-xl -right-2 top-8 sm:top-10">✦</span>
//         <span className="absolute left-0 text-[11px] text-gray-300 sm:text-xs bottom-6 sm:bottom-8">✦</span>
//         <div className="relative w-14 h-[72px] bg-gray-300 rounded-lg shadow-sm sm:w-20 sm:h-24 -rotate-6" />
//         <div className="absolute w-14 h-[72px] bg-white rounded-lg shadow-sm sm:w-20 sm:h-24 rotate-3 ring-1 ring-gray-100">
//           <div className="mt-4 sm:mt-5 flex flex-col gap-1 sm:gap-1.5 px-2.5 sm:px-3">
//             <div className="w-8 h-0.5 sm:w-10 sm:h-1 bg-gray-200 rounded" />
//             <div className="w-6 h-0.5 sm:w-8 sm:h-1 bg-gray-200 rounded" />
//             <div className="h-0.5 sm:h-1 bg-gray-200 rounded w-7 sm:w-9" />
//           </div>
//         </div>
//         <Paperclip
//           size={20}
//           className="absolute text-gray-400 -translate-x-1/2 -top-2 left-1/2 -rotate-12 sm:w-6 sm:h-6"
//         />
//       </div>

//       <h2 className="text-base font-bold text-gray-900 sm:text-lg">No Reports Yet</h2>
//       <p className="max-w-sm mt-2 text-xs leading-relaxed text-gray-400 sm:mt-3 sm:text-sm">
//         You haven't submitted any road hazard reports yet. Help make the roads safer by reporting
//         potholes, accidents, floods, roadworks, and other hazards you encounter.
//       </p>

//       <button
//         onClick={onAddReport}
//         className="mt-6 sm:mt-8 flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-purple-700 py-3 sm:py-3.5 text-sm sm:text-[15px] font-semibold text-white transition active:scale-[0.98]"
//       >
//         <span className="text-sm leading-none sm:text-base">+</span> Add report
//       </button>
//     </div>
//   )
// }

// // ---------- Report card ----------

// function MyReportCard({ report }: { report: Hazard }) {
//   return (
//     <div className="w-full overflow-hidden bg-white border border-gray-100 shadow-sm rounded-3xl">
//       <div className="relative flex items-center justify-center h-24 sm:h-28 lg:h-32 bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100">
//         {report.photoUrl ? (
//           <img src={report.photoUrl} alt="" className="absolute inset-0 object-cover w-full h-full" />
//         ) : (
//           <>
//             <div
//               className="absolute inset-0 opacity-40"
//               style={{
//                 backgroundImage:
//                   'repeating-linear-gradient(115deg, transparent, transparent 38px, rgba(100,130,150,0.35) 38px, rgba(100,130,150,0.35) 40px)',
//               }}
//             />
//             <span className="relative text-2xl sm:text-3xl drop-shadow-sm">
//               {HAZARD_EMOJI[report.type]}
//             </span>
//           </>
//         )}
//       </div>

//       <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-3 sm:pt-3.5">
//         <div className="flex items-center justify-between gap-2">
//           <span className="rounded-full bg-gray-100 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-medium text-gray-600">
//             {report.type}
//           </span>
//           <span className="text-[11px] sm:text-xs text-gray-400 whitespace-nowrap">
//             🕐 {formatTimeAgo(report.createdAt)}
//           </span>
//         </div>

//         <h3 className="mt-2 sm:mt-2.5 text-sm sm:text-base font-bold leading-snug text-gray-900">
//           {report.description || report.type}
//         </h3>

//         <p className="mt-1 text-xs sm:text-[13px] text-gray-500">
//           📍 {report.location.address || 'Unknown location'}
//         </p>

//         <div className="mt-3 sm:mt-3.5 flex items-center gap-2 sm:gap-2.5">
//           <span className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-[13px] font-medium text-gray-700">
//             <ThumbsUp size={14} /> {report.confirmations.confirms}
//           </span>
//           <span className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-[13px] font-medium text-gray-700">
//             <ThumbsDown size={14} /> {report.confirmations.incorrects}
//           </span>
//         </div>
//       </div>
//     </div>
//   )
// }

// // ---------- Page ----------

// export default function MyReport() {
//   const [showModal, setShowModal] = useState(false)
//   const [showAuth, setShowAuth] = useState(false)
//   const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
//   const { data: reports = [], isLoading, isError, refetch } = useMyHazards()

//   const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token')

//   const openAddReport = () => {
//     if (isLoggedIn) {
//       setShowModal(true)
//     } else {
//       setAuthMode('signin')
//       setShowAuth(true)
//     }
//   }

//   const handleSignIn = () => {
//     setAuthMode('signin')
//     setShowAuth(true)
//   }

//   const handleCreateAccount = () => {
//     setAuthMode('signup')
//     setShowAuth(true)
//   }

//   return (
//     <div className="min-h-[100dvh] bg-gray-50 pb-28">
//       {/* Single-column stacked cards on every screen, like the original.
//           Container widens on larger screens so cards get a bit more
//           breathing room without turning into a multi-column grid. */}
//       <div className="max-w-xl mx-auto lg:max-w-5xl">
//         {/* Header */}
//         <div className="flex items-center justify-between px-4 pt-5 pb-3 sm:px-5 sm:pt-6 sm:pb-4">
//           <h1 className="text-lg font-extrabold leading-none text-gray-800 sm:text-xl lg:text-2xl">
//             My Report
//           </h1>
//           <button
//             onClick={openAddReport}
//             className="text-xs font-semibold text-purple-700 sm:text-sm"
//           >
//             Add Report
//           </button>
//         </div>

//         {/* Content */}
//         {!isLoggedIn ? (
//           <SignedOutState
//             onSignIn={handleSignIn}
//             onCreateAccount={handleCreateAccount}
//           />
//         ) : isLoading ? (
//           <div className="flex items-center justify-center py-16">
//             <Loader2 size={22} className="text-purple-700 animate-spin" />
//           </div>
//         ) : isError ? (
//           <p className="px-6 text-xs text-center text-red-500 sm:text-sm">Failed to load your reports.</p>
//         ) : reports.length === 0 ? (
//           <EmptyState onAddReport={openAddReport} />
//         ) : (
//           <div className="flex flex-col gap-3.5 sm:gap-4 px-4 sm:px-5">
//             {reports.map((report) => (
//               <MyReportCard key={report.id} report={report} />
//             ))}
//           </div>
//         )}

//         {showModal && (
//           <AddReportModal onClose={() => setShowModal(false)} onSuccess={() => setShowModal(false)} />
//         )}

//         {showAuth && (
//           <AuthFlow
//             mode={authMode}
//             onClose={() => setShowAuth(false)}
//             onAuthSuccess={() => {
//               setShowAuth(false)
//               refetch()
//             }}
//           />
//         )}
//       </div>
//     </div>
//   )
// }













import { useState } from 'react'
import { Paperclip, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
import AddReportModal from '../components/Addreportmodal'
import AuthFlow from '../components/AuthFlow'
import { useMyHazards } from '../hooks/useHazards'
import type { BackendHazardType, Hazard } from '../types/hazard'

const HAZARD_EMOJI: Record<BackendHazardType, string> = {
  POTHOLE: '🕳️',
  FLOOD: '🌊',
  ACCIDENT: '🚧',
  DEBRIS: '🪨',
  ROAD: '🚜',
  CHECKPOINT: '🛂',
  DANGER: '⚠️',
  SOS: '🆘',
}

function formatTimeAgo(dateStr: string): string {
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

// ---------- Signed-out state ----------

function SignedOutState({
  onSignIn,
  onCreateAccount,
}: {
  onSignIn: () => void
  onCreateAccount: () => void
}) {
  return (
    <div className="flex flex-col items-center px-6 text-center pt-14 sm:px-8 sm:pt-16 lg:pt-20">
      <div className="relative flex items-center justify-center w-32 h-32 mb-6 sm:w-36 sm:h-36 lg:w-40 lg:h-40 sm:mb-8">
        <div className="absolute w-36 h-[72px] rounded-full sm:w-40 sm:h-20 lg:w-48 lg:h-24 bg-purple-50" />
        <span className="absolute text-sm text-purple-200 sm:text-base -left-2 top-2">✦</span>
        <span className="absolute text-lg text-purple-200 sm:text-xl -right-2 top-8 sm:top-10">✦</span>
        <div className="relative flex items-center justify-center w-[72px] h-[72px] bg-purple-100 rounded-full sm:w-20 sm:h-20 lg:w-24 lg:h-24">
          <LockIcon />
        </div>
      </div>

      <h2 className="text-base font-bold text-gray-900 sm:text-lg">Sign in to see your reports</h2>
      <p className="max-w-sm mt-2 text-xs leading-relaxed text-gray-400 sm:mt-3 sm:text-sm">
        You need an account to submit and track road hazard reports. Sign in or create an account
        to get started.
      </p>

      <div className="flex flex-col w-full max-w-sm gap-3 mt-6 sm:mt-8">
        {/* White button (Create Account) on top */}
        <button
          onClick={onCreateAccount}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-purple-200 bg-white py-3 sm:py-3.5 text-sm sm:text-[15px] font-semibold text-purple-700 transition active:scale-[0.98] hover:bg-purple-50"
        >
          Create Account
        </button>
        {/* Purple button (Sign In) on bottom */}
        <button
          onClick={onSignIn}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-700 py-3 sm:py-3.5 text-sm sm:text-[15px] font-semibold text-white transition active:scale-[0.98]"
        >
          Sign in
        </button>
      </div>
    </div>
  )
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="text-purple-500 w-7 h-7 sm:w-8 sm:h-8"
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

// ---------- Empty state (signed in, no reports) ----------

function EmptyState({ onAddReport }: { onAddReport: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 text-center pt-14 sm:px-8 sm:pt-16 lg:pt-20">
      <div className="relative flex items-center justify-center w-32 h-32 mb-6 sm:w-36 sm:h-36 lg:w-40 lg:h-40 sm:mb-8">
        <div className="absolute w-36 h-[72px] rounded-full sm:w-40 sm:h-20 lg:w-48 lg:h-24 bg-gray-50" />
        <span className="absolute text-sm text-gray-300 sm:text-base -left-2 top-2">✦</span>
        <span className="absolute text-lg text-gray-300 sm:text-xl -right-2 top-8 sm:top-10">✦</span>
        <span className="absolute left-0 text-[11px] text-gray-300 sm:text-xs bottom-6 sm:bottom-8">✦</span>
        <div className="relative w-14 h-[72px] bg-gray-300 rounded-lg shadow-sm sm:w-20 sm:h-24 -rotate-6" />
        <div className="absolute w-14 h-[72px] bg-white rounded-lg shadow-sm sm:w-20 sm:h-24 rotate-3 ring-1 ring-gray-100">
          <div className="mt-4 sm:mt-5 flex flex-col gap-1 sm:gap-1.5 px-2.5 sm:px-3">
            <div className="w-8 h-0.5 sm:w-10 sm:h-1 bg-gray-200 rounded" />
            <div className="w-6 h-0.5 sm:w-8 sm:h-1 bg-gray-200 rounded" />
            <div className="h-0.5 sm:h-1 bg-gray-200 rounded w-7 sm:w-9" />
          </div>
        </div>
        <Paperclip
          size={20}
          className="absolute text-gray-400 -translate-x-1/2 -top-2 left-1/2 -rotate-12 sm:w-6 sm:h-6"
        />
      </div>

      <h2 className="text-base font-bold text-gray-900 sm:text-lg">No Reports Yet</h2>
      <p className="max-w-sm mt-2 text-xs leading-relaxed text-gray-400 sm:mt-3 sm:text-sm">
        You haven't submitted any road hazard reports yet. Help make the roads safer by reporting
        potholes, accidents, floods, roadworks, and other hazards you encounter.
      </p>

      <button
        onClick={onAddReport}
        className="mt-6 sm:mt-8 flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-purple-700 py-3 sm:py-3.5 text-sm sm:text-[15px] font-semibold text-white transition active:scale-[0.98]"
      >
        <span className="text-sm leading-none sm:text-base">+</span> Add report
      </button>
    </div>
  )
}

// ---------- Report card ----------

function MyReportCard({ report }: { report: Hazard }) {
  return (
    <div className="w-full overflow-hidden bg-white border border-gray-100 shadow-sm rounded-3xl">
      <div className="relative flex items-center justify-center h-24 sm:h-28 lg:h-32 bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100">
        {report.photoUrl ? (
          <img src={report.photoUrl} alt="" className="absolute inset-0 object-cover w-full h-full" />
        ) : (
          <>
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(115deg, transparent, transparent 38px, rgba(100,130,150,0.35) 38px, rgba(100,130,150,0.35) 40px)',
              }}
            />
            <span className="relative text-2xl sm:text-3xl drop-shadow-sm">
              {HAZARD_EMOJI[report.type]}
            </span>
          </>
        )}
      </div>

      <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-3 sm:pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-gray-100 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-medium text-gray-600">
            {report.type}
          </span>
          <span className="text-[11px] sm:text-xs text-gray-400 whitespace-nowrap">
            🕐 {formatTimeAgo(report.createdAt)}
          </span>
        </div>

        <h3 className="mt-2 sm:mt-2.5 text-sm sm:text-base font-bold leading-snug text-gray-900">
          {report.description || report.type}
        </h3>

        <p className="mt-1 text-xs sm:text-[13px] text-gray-500">
          📍 {report.location.address || 'Unknown location'}
        </p>

        <div className="mt-3 sm:mt-3.5 flex items-center gap-2 sm:gap-2.5">
          <span className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-[13px] font-medium text-gray-700">
            <ThumbsUp size={14} /> {report.confirmations.confirms}
          </span>
          <span className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-[13px] font-medium text-gray-700">
            <ThumbsDown size={14} /> {report.confirmations.incorrects}
          </span>
        </div>
      </div>
    </div>
  )
}

// ---------- Page ----------

export default function MyReport() {
  const [showModal, setShowModal] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const { data: reports = [], isLoading, isError, refetch } = useMyHazards()

  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token')

  const openAddReport = () => {
    if (isLoggedIn) {
      setShowModal(true)
    } else {
      setAuthMode('signin')
      setShowAuth(true)
    }
  }

  const handleSignIn = () => {
    setAuthMode('signin')
    setShowAuth(true)
  }

  const handleCreateAccount = () => {
    setAuthMode('signup')
    setShowAuth(true)
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 pb-28">
      <div className="max-w-xl mx-auto lg:max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3 sm:px-5 sm:pt-6 sm:pb-4">
          <h1 className="text-lg font-extrabold leading-none text-gray-800 sm:text-xl lg:text-2xl">
            My Report
          </h1>
          <button
            onClick={openAddReport}
            className="text-xs font-semibold text-purple-700 sm:text-sm"
          >
            Add Report
          </button>
        </div>

        {/* Content */}
        {!isLoggedIn ? (
          <SignedOutState
            onSignIn={handleSignIn}
            onCreateAccount={handleCreateAccount}
          />
        ) : isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="text-purple-700 animate-spin" />
          </div>
        ) : isError ? (
          <p className="px-6 text-xs text-center text-red-500 sm:text-sm">Failed to load your reports.</p>
        ) : reports.length === 0 ? (
          <EmptyState onAddReport={openAddReport} />
        ) : (
          <div className="flex flex-col gap-3.5 sm:gap-4 px-4 sm:px-5">
            {reports.map((report) => (
              <MyReportCard key={report.id} report={report} />
            ))}
          </div>
        )}

        {showModal && (
          <AddReportModal onClose={() => setShowModal(false)} onSuccess={() => setShowModal(false)} />
        )}

        {showAuth && (
          <AuthFlow
            initialScreen={authMode}   // <-- FIXED: was mode={authMode}
            onClose={() => setShowAuth(false)}
            onAuthSuccess={() => {
              setShowAuth(false)
              refetch()
            }}
          />
        )}
      </div>
    </div>
  )
}