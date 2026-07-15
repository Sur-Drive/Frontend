
// import { useState, useRef, useEffect, useCallback } from 'react'
// import { useNavigate } from 'react-router-dom'
// import BottomNav from '../components/BottomNav'

// // ─── Types ─────────────────────────────────────────────
// type ReportType = 'wave' | 'hill' | 'pothole' | 'hazard' | 'sos' | 'sign' | 'warning' | 'tractor'

// interface Report {
//   id: string
//   top: string
//   left: string
//   color: string
//   type: ReportType
//   label: string
// }

// interface RoutePoint {
//   x: number
//   y: number
// }

// interface HazardItem {
//   id: string
//   type: ReportType
//   title: string
//   location: string
//   distance: string
// }

// // ─── Data ──────────────────────────────────────────────
// const reports: Report[] = [
//   { id: 'r1', top: '19.5%', left: '8.3%', color: '#3b82f6', type: 'wave', label: 'Chesapeake Avenue' },
//   { id: 'r2', top: '21.7%', left: '81.7%', color: '#f59e0b', type: 'hill', label: 'Southwood Avenue' },
//   { id: 'r3', top: '30.8%', left: '26.5%', color: '#f59e0b', type: 'pothole', label: 'Whittier Street' },
//   { id: 'r4', top: '29.6%', left: '63.6%', color: '#ef4444', type: 'hazard', label: 'Southwood Avenue' },
//   { id: 'r5', top: '44%', left: '9.5%', color: '#ef4444', type: 'sos', label: 'Dresden Street' },
//   { id: 'r6', top: '49.1%', left: '42%', color: '#2563eb', type: 'sign', label: 'Bretton Place' },
//   { id: 'r7', top: '44.5%', left: '60.6%', color: '#ef4444', type: 'warning', label: 'McDowell Street' },
//   { id: 'r8', top: '46.2%', left: '87.3%', color: '#f59e0b', type: 'tractor', label: 'Southwood Avenue' },
//   { id: 'r9', top: '55.8%', left: '81.2%', color: '#f59e0b', type: 'hill', label: 'McDowell Street' },
//   { id: 'r10', top: '62%', left: '32.8%', color: '#f59e0b', type: 'pothole', label: 'Dresden Street' },
//   { id: 'r11', top: '64.3%', left: '63.4%', color: '#ef4444', type: 'hazard', label: 'McDowell Street' },
//   { id: 'r12', top: '72.6%', left: '84.7%', color: '#f59e0b', type: 'pothole', label: 'Bretton Place' },
//   { id: 'r13', top: '70.7%', left: '13.5%', color: '#ef4444', type: 'sos', label: 'Bretton Place' },
//   { id: 'r14', top: '75.5%', left: '50.4%', color: '#f59e0b', type: 'tractor', label: 'Bretton Place' },
//   { id: 'r15', top: '83.6%', left: '47.3%', color: '#ef4444', type: 'warning', label: 'Bretton Place' },
// ]

// // Route path coordinates (SVG space 430x932)
// const routePath: RoutePoint[] = [
//   { x: 60, y: 390 },
//   { x: 60, y: 485 },
//   { x: 60, y: 580 },
//   { x: 155, y: 580 },
//   { x: 155, y: 670 },
//   { x: 240, y: 670 },
//   { x: 240, y: 765 },
// ]

// // Mock hazards for scan results
// const scanHazards: HazardItem[] = [
//   { id: 'h1', type: 'pothole', title: 'Deep pothole on 3rd Avenue', location: '3rd Ave & Market St', distance: '0.4 km' },
//   { id: 'h2', type: 'hazard', title: 'Police checkpoint', location: 'Old Toll Gate', distance: '3.4 km' },
// ]

// // ─── ReportIcon Component ──────────────────────────────
// function ReportIcon({ type, selected }: { type: ReportType; selected?: boolean }) {
//   const s = selected ? 1.25 : 1
//   switch (type) {
//     case 'wave':
//       return (
//         <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
//           <path d="M2 10c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
//           <path d="M2 15c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
//         </svg>
//       )
//     case 'hill':
//       return (
//         <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="#3a2e1f">
//           <path d="M2 18 L9 8 L13 13 L16 9 L22 18 Z" />
//         </svg>
//       )
//     case 'pothole':
//       return (
//         <svg viewBox="0 0 24 24" width={18 * s} height={18 * s}>
//           <ellipse cx="12" cy="12" rx="8" ry="4.5" fill="#1a1a1a" />
//         </svg>
//       )
//     case 'hazard':
//       return (
//         <div style={{ width: 18 * s, height: 14 * s, borderRadius: 2, backgroundImage: 'repeating-linear-gradient(45deg, #f6c400 0 4px, #1a1a1a 4px 8px)' }} />
//       )
//     case 'sos':
//       return (
//         <div className="bg-white rounded-[3px] px-1 py-0.5 flex items-center justify-center">
//           <span className="text-red-600 font-extrabold text-[7px] leading-none">SOS</span>
//         </div>
//       )
//     case 'sign':
//       return (
//         <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
//           <path d="M4 14 L14 4" /><path d="M9 4 L14 4 L14 9" /><path d="M20 10 L10 20" /><path d="M15 20 L10 20 L10 15" />
//         </svg>
//       )
//     case 'warning':
//       return (
//         <svg viewBox="0 0 24 24" width={18 * s} height={18 * s}>
//           <path d="M12 3 L22 20 L2 20 Z" fill="white" />
//           <rect x="11" y="10" width="2" height="5" fill="#e02424" />
//           <rect x="11" y="16" width="2" height="2" fill="#e02424" />
//         </svg>
//       )
//     case 'tractor':
//       return (
//         <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="#2b2b2b">
//           <rect x="8" y="8" width="7" height="5" rx="1" />
//           <rect x="4" y="12" width="5" height="4" rx="1" />
//           <circle cx="7" cy="18" r="3" fill="none" stroke="#2b2b2b" strokeWidth="2" />
//           <circle cx="17" cy="18" r="4" fill="none" stroke="#2b2b2b" strokeWidth="2" />
//         </svg>
//       )
//     default:
//       return null
//   }
// }

// // ─── Hazard List Icon ──────────────────────────────────
// function HazardListIcon({ type }: { type: ReportType }) {
//   switch (type) {
//     case 'pothole':
//       return (
//         <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl">
//           <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//             <ellipse cx="12" cy="12" rx="8" ry="4" fill="#1a1a1a" />
//           </svg>
//         </div>
//       )
//     case 'hazard':
//       return (
//         <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl">
//           <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-600" fill="currentColor">
//             <rect x="4" y="4" width="16" height="16" rx="3" />
//             <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">P</text>
//           </svg>
//         </div>
//       )
//     default:
//       return (
//         <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl">
//           <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//             <path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
//           </svg>
//         </div>
//       )
//   }
// }

// // ─── Main Component ────────────────────────────────────
// export default function PlanRoutePage() {
//   const navigate = useNavigate()

//   // ── State ───────────────────────────────────────────
//   const [showPlanModal, setShowPlanModal] = useState(false)
//   const [showScanResults, setShowScanResults] = useState(false)
//   const [isNavigating, setIsNavigating] = useState(false)
//   const [showSOS, setShowSOS] = useState(false)
//   const [sosHolding, setSosHolding] = useState(false)
//   const [sosProgress, setSosProgress] = useState(0)
//   const [showUpcomingAlert, setShowUpcomingAlert] = useState(false)
//   const [selectedPin, setSelectedPin] = useState<string | null>(null)

//   const [startPoint, setStartPoint] = useState('')
//   const [destination, setDestination] = useState('')

//   const sosTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
//   const sosProgressRef = useRef(0)

//   // ── SOS Hold Logic ──────────────────────────────────
//   const startSOSHold = useCallback(() => {
//     if (showSOS) return
//     setSosHolding(true)
//     sosProgressRef.current = 0
//     setSosProgress(0)

//     sosTimerRef.current = setInterval(() => {
//       sosProgressRef.current += 2
//       setSosProgress(sosProgressRef.current)
//       if (sosProgressRef.current >= 100) {
//         if (sosTimerRef.current) clearInterval(sosTimerRef.current)
//         setSosHolding(false)
//         setSosProgress(0)
//         sosProgressRef.current = 0
//         setShowSOS(true)
//       }
//     }, 60)
//   }, [showSOS])

//   const endSOSHold = useCallback(() => {
//     if (sosTimerRef.current) clearInterval(sosTimerRef.current)
//     setSosHolding(false)
//     setSosProgress(0)
//     sosProgressRef.current = 0
//   }, [])

//   useEffect(() => {
//     return () => {
//       if (sosTimerRef.current) clearInterval(sosTimerRef.current)
//     }
//   }, [])

//   // ── Route Logic ─────────────────────────────────────
//   const handleScanRoute = () => {
//     if (!startPoint || !destination) return
//     setShowPlanModal(false)
//     setShowScanResults(true)
//   }

//   const handleStartTrip = () => {
//     setShowScanResults(false)
//     setIsNavigating(true)
//     setTimeout(() => setShowUpcomingAlert(true), 2000)
//   }

//   const handleEndTrip = () => {
//     setIsNavigating(false)
//     setShowUpcomingAlert(false)
//     setStartPoint('')
//     setDestination('')
//     setShowScanResults(false)
//   }

//   // ── Route SVG Path ──────────────────────────────────
//   const routeD = routePath.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ')

//   // ── Upcoming hazard (mock) ──────────────────────────
//   const upcomingHazard = {
//     type: 'tractor' as ReportType,
//     label: 'Road Works ahead — Independence',
//     distance: '0.9 KM',
//   }

//   return (
//     <div className="relative h-[100dvh] w-full max-w-[430px] mx-auto bg-[#e4e4e4] overflow-hidden">
//       {/* Map background */}
//       <svg className="absolute inset-0 w-full h-full" viewBox="0 0 430 932" preserveAspectRatio="none">
//         <rect x="0" y="0" width="430" height="932" fill="#e4e4e4" />

//         {/* Vertical roads */}
//         {[54, 124, 194, 264, 334, 404].map((x) => (
//           <rect key={`v${x}`} x={x} y="0" width="10" height="932" fill="#fafafa" />
//         ))}
//         {/* Horizontal roads */}
//         {[114, 234, 354, 474, 594, 714, 834].map((y) => (
//           <rect key={`h${y}`} x="0" y={y} width="430" height="10" fill="#fafafa" />
//         ))}

//         {/* Diagonal roads */}
//         <g stroke="#fafafa" strokeWidth="14" fill="none" strokeLinecap="round">
//           <path d="M0,100 L390,280" />
//           <path d="M290,240 L410,580" />
//           <path d="M0,890 L345,1000" />
//         </g>

//         {/* Green parks */}
//         <rect x="325" y="310" width="32" height="76" rx="8" fill="#bfe3c8" />
//         <rect x="285" y="550" width="80" height="22" rx="8" fill="#bfe3c8" />
//         <rect x="48" y="610" width="16" height="76" rx="8" fill="#bfe3c8" />
//         <rect x="30" y="980" width="58" height="50" rx="10" fill="#bfe3c8" />

//         {/* River */}
//         <path d="M-20,900 C100,870 220,935 430,890 L430,932 L-20,932 Z" fill="#8bd3f0" />
//         <path d="M-20,900 C100,870 220,935 430,890" stroke="#8bd3f0" strokeWidth="22" fill="none" />

//         {/* Route line (when navigating OR scan results) */}
//         {(isNavigating || showScanResults) && (
//           <>
//             <path d={routeD} stroke="#0ea5e9" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
//             <path d={routeD} stroke="#0ea5e9" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
//           </>
//         )}

//         {/* Street labels */}
//         <text x="168" y="152" fontSize="15" fill="#4a4a4a" fontWeight="600" transform="rotate(-20 168 152)">Chesapeake Avenue</text>
//         <text x="358" y="400" fontSize="15" fill="#4a4a4a" fontWeight="600" transform="rotate(65 358 400)">Southwood Avenue</text>
//         <text x="52" y="570" fontSize="15" fill="#4a4a4a" fontWeight="600" transform="rotate(90 52 570)">Dresden Street</text>
//         <text x="298" y="550" fontSize="15" fill="#4a4a4a" fontWeight="600">McDowell Street</text>
//         <text x="112" y="770" fontSize="15" fill="#4a4a4a" fontWeight="600" transform="rotate(15 112 770)">Bretton Place</text>
//       </svg>

//       {/* Pins */}
//       {reports.map((r) => (
//         <button
//           key={r.id}
//           onClick={() => setSelectedPin(r.id === selectedPin ? null : r.id)}
//           className={`absolute z-[5] flex flex-col items-center cursor-pointer transition-transform active:scale-95 ${r.id === selectedPin ? 'z-10' : ''}`}
//           style={{
//             top: r.top,
//             left: r.left,
//             transform: `translate(-50%, ${r.id === selectedPin ? '-100%' : '-50%'})`,
//           }}
//         >
//           <div
//             className="flex items-center justify-center transition-all rounded-full shadow-md"
//             style={{
//               backgroundColor: r.color,
//               width: r.id === selectedPin ? 56 : 36,
//               height: r.id === selectedPin ? 56 : 36,
//               boxShadow: r.id === selectedPin ? '0 4px 16px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.2)',
//             }}
//           >
//             <ReportIcon type={r.type} selected={r.id === selectedPin} />
//           </div>
//           {r.id === selectedPin && (
//             <>
//               <div
//                 className="w-3 h-3 -mt-1.5 rotate-45"
//                 style={{ backgroundColor: r.color, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
//               />
//               <span className="mt-1 text-[13px] font-bold text-gray-900 whitespace-nowrap">{r.label}</span>
//             </>
//           )}
//         </button>
//       ))}

//       {/* Home Header (when not navigating and not scan results) */}
//       {!isNavigating && !showScanResults && (
//         <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-2">
//           {/* Profile bar */}
//           <div className="flex items-center justify-between px-4 py-3 mb-3 bg-white shadow-sm rounded-2xl">
//             <div className="flex items-center gap-3">
//               <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-gray-500 bg-gray-300 rounded-full">
//                 AA
//               </div>
//               <div>
//                 <p className="text-sm font-semibold text-gray-900">Good Afternoon 👋</p>
//                 <p className="text-xs text-purple-600">Lagos, Nigeria</p>
//               </div>
//             </div>
//             <button className="relative flex items-center justify-center w-10 h-10">
//               <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-700" fill="currentColor">
//                 <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
//               </svg>
//               <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
//             </button>
//           </div>

//           {/* Search bar */}
//           <button
//             onClick={() => setShowPlanModal(true)}
//             className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm text-left"
//           >
//             <svg viewBox="0 0 24 24" className="flex-shrink-0 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//               <circle cx="11" cy="11" r="8" />
//               <path d="m21 21-4.35-4.35" />
//             </svg>
//             <span className="flex-1 text-sm text-gray-400">Where are you going?</span>
//             <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//               <circle cx="11" cy="11" r="8" />
//               <path d="m21 21-4.35-4.35" />
//             </svg>
//           </button>
//         </div>
//       )}

//       {/* Scan Results Header (route info cards) */}
//       {showScanResults && (
//         <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-2">
//           {/* Route info card */}
//           <div className="px-4 py-3 mb-3 bg-white shadow-sm rounded-2xl">
//             <div className="flex items-center gap-3 mb-3">
//               <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
//                 <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//                   <circle cx="12" cy="12" r="10" />
//                   <path d="M12 8v4l3 3" />
//                 </svg>
//               </div>
//               <div className="flex-1">
//                 <p className="text-sm font-semibold text-gray-900">{startPoint || 'Lekki Phase 1'}</p>
//                 <p className="text-xs text-gray-400">From</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-3">
//               <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
//                 <svg viewBox="0 0 24 24" className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//                   <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
//                   <line x1="4" y1="22" x2="4" y2="15" />
//                 </svg>
//               </div>
//               <div className="flex-1">
//                 <p className="text-sm font-semibold text-gray-900">{destination || '3rd Avenue Market St'}</p>
//                 <p className="text-xs text-gray-400">To</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Navigation Header (when navigating) */}
//       {isNavigating && (
//         <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-2 max-h-[70%] overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//           <div className="space-y-2">
//             {/* Green direction banner */}
//             <div className="flex items-center gap-3 px-4 py-3 shadow-sm bg-emerald-500 rounded-2xl">
//               <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
//                 <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//                   <path d="M12 19V5M5 12l7-7 7 7" />
//                 </svg>
//               </div>
//               <div>
//                 <p className="text-xs font-medium tracking-wide uppercase text-white/80">In 3.6 KM</p>
//                 <p className="text-sm font-semibold text-white">Head out and follow the route</p>
//               </div>
//             </div>

//             {/* Upcoming hazard alert */}
//             {showUpcomingAlert && (
//               <div className="flex items-center gap-3 px-4 py-3 bg-white shadow-sm rounded-xl animate-in slide-in-from-top-2">
//                 <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100">
//                   <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <path d="M12 19V5M5 12l7-7 7 7" />
//                   </svg>
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Upcoming</p>
//                   <p className="text-sm font-medium text-gray-900 truncate">🚜 {upcomingHazard.label}</p>
//                 </div>
//                 <span className="text-xs font-medium text-gray-500">{upcomingHazard.distance}</span>
//               </div>
//             )}

//             {/* Trip stats card */}
//             <div className="px-5 py-4 bg-white shadow-sm rounded-2xl">
//               <div className="flex items-center justify-between mb-3">
//                 <div className="text-center">
//                   <p className="text-xs text-gray-400 mb-0.5">ETA</p>
//                   <p className="text-xl font-bold text-gray-900">17 min</p>
//                 </div>
//                 <div className="text-center">
//                   <p className="text-xs text-gray-400 mb-0.5">Remaining</p>
//                   <p className="text-xl font-bold text-gray-900">7.1 km</p>
//                 </div>
//                 <div className="text-center">
//                   <p className="text-xs text-gray-400 mb-0.5">Hazards</p>
//                   <p className="text-xl font-bold text-amber-500">2</p>
//                 </div>
//               </div>
//               <button
//                 onClick={handleEndTrip}
//                 className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition active:scale-[0.98]"
//               >
//                 End Trip
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Navigation User Location Pulse */}
//       {isNavigating && (
//         <div
//           className="absolute z-[6] -translate-x-1/2 -translate-y-1/2"
//           style={{ top: '72%', left: '56%' }}
//         >
//           <div className="relative">
//             <div className="absolute inset-0 -m-1 rounded-full w-14 h-14 bg-sky-400/30 animate-ping" />
//             <div className="absolute inset-0 w-12 h-12 rounded-full bg-sky-400/20" />
//             <div className="relative flex items-center justify-center w-10 h-10 border-2 border-white rounded-full shadow-lg bg-sky-500">
//               <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
//                 <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
//               </svg>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* SOS Floating Button */}
//       {!showSOS && (
//         <div
//           className="absolute z-30 bottom-32 right-4"
//           onMouseDown={startSOSHold}
//           onMouseUp={endSOSHold}
//           onMouseLeave={endSOSHold}
//           onTouchStart={(e) => { e.preventDefault(); startSOSHold(); }}
//           onTouchEnd={(e) => { e.preventDefault(); endSOSHold(); }}
//         >
//           {/* Outer pulse ring */}
//           <span className="absolute inset-[-6px] rounded-full border-[3px] border-red-400/35 animate-ping pointer-events-none" />
//           <span className="absolute inset-[-6px] rounded-full border-[3px] border-red-400/35 pointer-events-none" />

//           {/* Circular progress ring */}
//           {sosHolding && (
//             <svg className="absolute inset-[-4px] w-[88px] h-[88px] -rotate-90 pointer-events-none" viewBox="0 0 88 88">
//               <circle
//                 cx="44"
//                 cy="44"
//                 r="42"
//                 fill="none"
//                 stroke="white"
//                 strokeWidth="4"
//                 strokeLinecap="round"
//                 strokeDasharray={2 * Math.PI * 42}
//                 strokeDashoffset={2 * Math.PI * 42 * (1 - sosProgress / 100)}
//                 style={{ transition: 'stroke-dashoffset 0.05s linear' }}
//               />
//             </svg>
//           )}

//           {/* Button */}
//           <button className="relative flex flex-col items-center justify-center w-20 h-20 text-white transition rounded-full bg-[#ff4444] active:scale-95 touch-none select-none">
//             <span className="text-[15px] font-bold">SOS</span>
//             <span className="text-[10px] opacity-90">Hold 3 secs</span>
//           </button>
//         </div>
//       )}

//       {/* ═══════════════════════════════════════════════════════
//           PLAN ROUTE MODAL — FIXED
//           ═══════════════════════════════════════════════════════ */}
//       {showPlanModal && (
//         <div className="fixed inset-0 z-[60] flex flex-col bg-white animate-in slide-in-from-bottom">
//           {/* Header */}
//           <div className="flex-shrink-0 px-5 pt-6 pb-4">
//             <div className="flex items-start justify-between">
//               <div>
//                 <h2 className="text-2xl font-extrabold text-gray-900">Plan a route</h2>
//                 <p className="mt-1 text-sm text-gray-500">We'll scan reported hazards along the way before you drive.</p>
//               </div>
//               <button
//                 onClick={() => setShowPlanModal(false)}
//                 className="flex items-center justify-center text-gray-500 transition bg-gray-100 rounded-full w-9 h-9 hover:bg-gray-200"
//               >
//                 <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
//                   <path d="M18 6L6 18M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>
//           </div>

//           {/* Scrollable content */}
//           <div className="flex-1 px-5 space-y-5 overflow-y-auto min-h-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//             {/* Point A */}
//             <div>
//               <div className="flex items-center gap-2 mb-2">
//                 <div className="flex items-center justify-center w-5 h-5 border-2 rounded-full border-emerald-500">
//                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
//                 </div>
//                 <span className="text-sm font-medium text-gray-900">Point A — Start</span>
//               </div>
//               <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
//                 <input
//                   type="text"
//                   placeholder="Search a place or Address"
//                   value={startPoint}
//                   onChange={(e) => setStartPoint(e.target.value)}
//                   className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
//                 />
//                 <button className="text-sm font-medium text-purple-600 whitespace-nowrap hover:text-purple-700">
//                   Use my location
//                 </button>
//               </div>
//             </div>

//             {/* Point B */}
//             <div>
//               <div className="flex items-center gap-2 mb-2">
//                 <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                   <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
//                   <line x1="4" y1="22" x2="4" y2="15" />
//                 </svg>
//                 <span className="text-sm font-medium text-gray-900">Point B — Destination</span>
//               </div>
//               <div className="px-4 py-3 bg-gray-50 rounded-xl">
//                 <input
//                   type="text"
//                   placeholder="Where to?"
//                   value={destination}
//                   onChange={(e) => setDestination(e.target.value)}
//                   className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
//                 />
//               </div>
//             </div>

//             {/* Spacer to ensure scrollability */}
//             <div className="h-4" />
//           </div>

//           {/* Scan button */}
//           <div className="flex-shrink-0 px-5 pt-4 pb-8">
//             <button
//               onClick={handleScanRoute}
//               disabled={!startPoint || !destination}
//               className="w-full h-14 bg-purple-700 hover:bg-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-lg rounded-2xl transition active:scale-[0.98]"
//             >
//               Scan route
//             </button>
//           </div>
//         </div>
//       )}

//       {/* ═══════════════════════════════════════════════════════
//           SCAN RESULTS BOTTOM SHEET — FIXED
//           ═══════════════════════════════════════════════════════ */}
//       {showScanResults && (
//         <div className="fixed inset-0 z-[60] flex flex-col bg-white/0 pointer-events-none">
//           {/* Transparent top area (map visible behind) */}
//           <div className="flex-shrink-0 h-[35%]" onClick={() => setShowScanResults(false)} />

//           {/* Bottom sheet content */}
//           <div className="flex-1 flex flex-col bg-white rounded-t-[24px] shadow-[0_-4px_24px_rgba(0,0,0,0.15)] pointer-events-auto overflow-hidden">
//             {/* Drag handle */}
//             <div className="flex justify-center flex-shrink-0 pt-3 pb-2">
//               <div className="w-10 h-1 bg-gray-300 rounded-full" />
//             </div>

//             {/* Scrollable content */}
//             <div className="flex-1 overflow-y-auto px-5 pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//               {/* Stats cards */}
//               <div className="grid grid-cols-3 gap-3 mb-4">
//                 <div className="p-3 text-center bg-gray-50 rounded-2xl">
//                   <p className="text-lg font-bold text-gray-900">9.5 km</p>
//                   <p className="text-xs text-gray-400 mt-0.5">Distance</p>
//                 </div>
//                 <div className="p-3 text-center bg-gray-50 rounded-2xl">
//                   <p className="text-lg font-bold text-gray-900">23 min</p>
//                   <p className="text-xs text-gray-400 mt-0.5">ETA</p>
//                 </div>
//                 <div className="p-3 text-center bg-gray-50 rounded-2xl">
//                   <p className="text-lg font-bold text-emerald-500">91</p>
//                   <p className="text-xs text-gray-400 mt-0.5">Safety</p>
//                 </div>
//               </div>

//               {/* Hazard banner */}
//               <div className="flex items-center gap-2 px-4 py-3 mb-4 border bg-amber-50 rounded-xl border-amber-100">
//                 <svg viewBox="0 0 24 24" className="flex-shrink-0 w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//                   <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
//                 </svg>
//                 <p className="text-sm font-medium text-amber-700">
//                   {scanHazards.length} hazards reported on this route. Drive carefully.
//                 </p>
//               </div>

//               {/* Hazards list */}
//               <div className="mb-6 space-y-3">
//                 {scanHazards.map((hazard) => (
//                   <div key={hazard.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
//                     <HazardListIcon type={hazard.type} />
//                     <div className="flex-1 min-w-0">
//                       <p className="text-sm font-semibold text-gray-900 truncate">{hazard.title}</p>
//                       <p className="text-xs text-gray-400">{hazard.location}</p>
//                     </div>
//                     <span className="flex-shrink-0 px-2 py-1 text-xs font-medium text-gray-500 bg-white rounded-lg">
//                       {hazard.distance}
//                     </span>
//                   </div>
//                 ))}
//               </div>

//               {/* Start trip button */}
//               <button
//                 onClick={handleStartTrip}
//                 className="w-full h-14 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-lg rounded-2xl transition active:scale-[0.98] flex items-center justify-center gap-2"
//               >
//                 Start trip
//                 <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//                   <path d="M5 12h14M12 5l7 7-7 7" />
//                 </svg>
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ═══════════════════════════════════════════════════════
//           SOS ACTIVE SCREEN — FIXED
//           ═══════════════════════════════════════════════════════ */}
//       {showSOS && (
//         <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-red-500">
//           {/* Header */}
//           <div className="flex items-start justify-between px-5 pt-14">
//             <div>
//               <h2 className="text-3xl font-extrabold text-white">SOS Active</h2>
//               <p className="mt-1 text-sm text-white/80">SOS broadcast, nearby drivers and contacts notified</p>
//             </div>
//             <button
//               onClick={() => setShowSOS(false)}
//               className="flex items-center justify-center text-white transition rounded-full w-9 h-9 bg-white/20 hover:bg-white/30"
//             >
//               <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
//                 <path d="M18 6L6 18M6 6l12 12" />
//               </svg>
//             </button>
//           </div>

//           {/* Siren */}
//           <div className="flex items-center justify-center flex-1">
//             <div className="relative">
//               <div className="absolute inset-0 w-48 h-48 -m-6 rounded-full bg-white/10 animate-ping" />
//               <div className="absolute inset-0 w-40 h-40 -m-2 rounded-full bg-white/15" />
//               <div className="relative flex items-center justify-center bg-white rounded-full shadow-2xl w-36 h-36">
//                 <svg viewBox="0 0 24 24" className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//                   <path d="M12 3v1" />
//                   <path d="M12 20v1" />
//                   <path d="M4.2 7.2l.7.7" />
//                   <path d="M19.1 16.1l.7.7" />
//                   <path d="M3 12h1" />
//                   <path d="M20 12h1" />
//                   <path d="M4.2 16.8l.7-.7" />
//                   <path d="M19.1 7.9l.7-.7" />
//                   <path d="M12 8a4 4 0 0 1 4 4v3H8v-3a4 4 0 0 1 4-4z" />
//                   <path d="M8 15v2a4 4 0 0 0 8 0v-2" />
//                 </svg>
//               </div>
//             </div>
//           </div>

//           {/* Actions */}
//           <div className="px-5 pb-24 space-y-3">
//             <button
//               onClick={() => setShowSOS(false)}
//               className="w-full h-14 bg-white text-red-500 font-semibold text-lg rounded-xl hover:bg-gray-50 transition active:scale-[0.98]"
//             >
//               Cancel SOS
//             </button>
//             <a
//               href="tel:112"
//               className="w-full h-14 bg-white/20 text-white font-semibold text-lg rounded-xl flex items-center justify-center gap-2 hover:bg-white/30 transition active:scale-[0.98]"
//             >
//               <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
//               </svg>
//               Call 112
//             </a>
//           </div>
//         </div>
//       )}

//       {/* BottomNav — always rendered, modals at z-[60] cover it */}
//       <div className="relative z-30">
//         <BottomNav />
//       </div>
//     </div>
//   )
// }











import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'

// ─── Types ─────────────────────────────────────────────
type ReportType = 'wave' | 'hill' | 'pothole' | 'hazard' | 'sos' | 'sign' | 'warning' | 'tractor'

interface Report {
  id: string
  top: string
  left: string
  color: string
  type: ReportType
  label: string
}

interface RoutePoint {
  x: number
  y: number
}

interface HazardItem {
  id: string
  type: ReportType
  title: string
  location: string
  distance: string
}

// ─── Data ──────────────────────────────────────────────
const reports: Report[] = [
  { id: 'r1', top: '19.5%', left: '8.3%', color: '#3b82f6', type: 'wave', label: 'Chesapeake Avenue' },
  { id: 'r2', top: '21.7%', left: '81.7%', color: '#f59e0b', type: 'hill', label: 'Southwood Avenue' },
  { id: 'r3', top: '30.8%', left: '26.5%', color: '#f59e0b', type: 'pothole', label: 'Whittier Street' },
  { id: 'r4', top: '29.6%', left: '63.6%', color: '#ef4444', type: 'hazard', label: 'Southwood Avenue' },
  { id: 'r5', top: '44%', left: '9.5%', color: '#ef4444', type: 'sos', label: 'Dresden Street' },
  { id: 'r6', top: '49.1%', left: '42%', color: '#2563eb', type: 'sign', label: 'Bretton Place' },
  { id: 'r7', top: '44.5%', left: '60.6%', color: '#ef4444', type: 'warning', label: 'McDowell Street' },
  { id: 'r8', top: '46.2%', left: '87.3%', color: '#f59e0b', type: 'tractor', label: 'Southwood Avenue' },
  { id: 'r9', top: '55.8%', left: '81.2%', color: '#f59e0b', type: 'hill', label: 'McDowell Street' },
  { id: 'r10', top: '62%', left: '32.8%', color: '#f59e0b', type: 'pothole', label: 'Dresden Street' },
  { id: 'r11', top: '64.3%', left: '63.4%', color: '#ef4444', type: 'hazard', label: 'McDowell Street' },
  { id: 'r12', top: '72.6%', left: '84.7%', color: '#f59e0b', type: 'pothole', label: 'Bretton Place' },
  { id: 'r13', top: '70.7%', left: '13.5%', color: '#ef4444', type: 'sos', label: 'Bretton Place' },
  { id: 'r14', top: '75.5%', left: '50.4%', color: '#f59e0b', type: 'tractor', label: 'Bretton Place' },
  { id: 'r15', top: '83.6%', left: '47.3%', color: '#ef4444', type: 'warning', label: 'Bretton Place' },
]

// Route path coordinates (SVG space 430x932)
const routePath: RoutePoint[] = [
  { x: 60, y: 390 },
  { x: 60, y: 485 },
  { x: 60, y: 580 },
  { x: 155, y: 580 },
  { x: 155, y: 670 },
  { x: 240, y: 670 },
  { x: 240, y: 765 },
]

// Mock hazards for scan results
const scanHazards: HazardItem[] = [
  { id: 'h1', type: 'pothole', title: 'Deep pothole on 3rd Avenue', location: '3rd Ave & Market St', distance: '0.4 km' },
  { id: 'h2', type: 'hazard', title: 'Police checkpoint', location: 'Old Toll Gate', distance: '3.4 km' },
]

// ─── ReportIcon Component ──────────────────────────────
function ReportIcon({ type, selected }: { type: ReportType; selected?: boolean }) {
  const s = selected ? 1.25 : 1
  switch (type) {
    case 'wave':
      return (
        <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <path d="M2 10c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
          <path d="M2 15c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
        </svg>
      )
    case 'hill':
      return (
        <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="#3a2e1f">
          <path d="M2 18 L9 8 L13 13 L16 9 L22 18 Z" />
        </svg>
      )
    case 'pothole':
      return (
        <svg viewBox="0 0 24 24" width={18 * s} height={18 * s}>
          <ellipse cx="12" cy="12" rx="8" ry="4.5" fill="#1a1a1a" />
        </svg>
      )
    case 'hazard':
      return (
        <div style={{ width: 18 * s, height: 14 * s, borderRadius: 2, backgroundImage: 'repeating-linear-gradient(45deg, #f6c400 0 4px, #1a1a1a 4px 8px)' }} />
      )
    case 'sos':
      return (
        <div className="bg-white rounded-[3px] px-1 py-0.5 flex items-center justify-center">
          <span className="text-red-600 font-extrabold text-[7px] leading-none">SOS</span>
        </div>
      )
    case 'sign':
      return (
        <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14 L14 4" /><path d="M9 4 L14 4 L14 9" /><path d="M20 10 L10 20" /><path d="M15 20 L10 20 L10 15" />
        </svg>
      )
    case 'warning':
      return (
        <svg viewBox="0 0 24 24" width={18 * s} height={18 * s}>
          <path d="M12 3 L22 20 L2 20 Z" fill="white" />
          <rect x="11" y="10" width="2" height="5" fill="#e02424" />
          <rect x="11" y="16" width="2" height="2" fill="#e02424" />
        </svg>
      )
    case 'tractor':
      return (
        <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="#2b2b2b">
          <rect x="8" y="8" width="7" height="5" rx="1" />
          <rect x="4" y="12" width="5" height="4" rx="1" />
          <circle cx="7" cy="18" r="3" fill="none" stroke="#2b2b2b" strokeWidth="2" />
          <circle cx="17" cy="18" r="4" fill="none" stroke="#2b2b2b" strokeWidth="2" />
        </svg>
      )
    default:
      return null
  }
}

// ─── Hazard List Icon ──────────────────────────────────
function HazardListIcon({ type }: { type: ReportType }) {
  switch (type) {
    case 'pothole':
      return (
        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <ellipse cx="12" cy="12" rx="8" ry="4" fill="#1a1a1a" />
          </svg>
        </div>
      )
    case 'hazard':
      return (
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-600" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="3" />
            <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">P</text>
          </svg>
        </div>
      )
    default:
      return (
        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </div>
      )
  }
}

// ─── Spinner Icon for loading state ──────────────────────
function SpinnerIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" />
    </svg>
  )
}

// ─── Main Component ────────────────────────────────────
export default function PlanRoutePage() {
  const navigate = useNavigate()

  // ── State ───────────────────────────────────────────
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showScanResults, setShowScanResults] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [showSOS, setShowSOS] = useState(false)
  const [sosHolding, setSosHolding] = useState(false)
  const [sosProgress, setSosProgress] = useState(0)
  const [showUpcomingAlert, setShowUpcomingAlert] = useState(false)
  const [selectedPin, setSelectedPin] = useState<string | null>(null)

  const [startPoint, setStartPoint] = useState('')
  const [destination, setDestination] = useState('')

  // ── Geolocation State ────────────────────────────────
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const sosTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sosProgressRef = useRef(0)

  // ── SOS Hold Logic ──────────────────────────────────
  const startSOSHold = useCallback(() => {
    if (showSOS) return
    setSosHolding(true)
    sosProgressRef.current = 0
    setSosProgress(0)

    sosTimerRef.current = setInterval(() => {
      sosProgressRef.current += 2
      setSosProgress(sosProgressRef.current)
      if (sosProgressRef.current >= 100) {
        if (sosTimerRef.current) clearInterval(sosTimerRef.current)
        setSosHolding(false)
        setSosProgress(0)
        sosProgressRef.current = 0
        setShowSOS(true)
      }
    }, 60)
  }, [showSOS])

  const endSOSHold = useCallback(() => {
    if (sosTimerRef.current) clearInterval(sosTimerRef.current)
    setSosHolding(false)
    setSosProgress(0)
    sosProgressRef.current = 0
  }, [])

  useEffect(() => {
    return () => {
      if (sosTimerRef.current) clearInterval(sosTimerRef.current)
    }
  }, [])

  // ── Geolocation Handler ──────────────────────────────
  const handleUseMyLocation = () => {
    setIsGettingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      setIsGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        reverseGeocode(latitude, longitude)
      },
      (error) => {
        let message = 'Unable to retrieve your location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable it in settings.'
            break
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.'
            break
          case error.TIMEOUT:
            message = 'Location request timed out.'
            break
        }
        setLocationError(message)
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  // ── Reverse Geocode (OpenStreetMap Nominatim) ──────
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      const data = await response.json()

      const address = data.address
      const suburb = address.suburb || address.neighbourhood || address.district || ''
      const road = address.road || address.street || ''
      const city = address.city || address.town || address.village || address.state || ''

      const shortAddress = suburb
        ? `${suburb}, ${city}`
        : road
          ? `${road}, ${city}`
          : data.display_name?.split(',')[0] || 'Current Location'

      setStartPoint(shortAddress)
    } catch (err) {
      setStartPoint(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    } finally {
      setIsGettingLocation(false)
    }
  }

  // ── Route Logic ─────────────────────────────────────
  const handleScanRoute = () => {
    if (!startPoint || !destination) return
    setShowPlanModal(false)
    setShowScanResults(true)
  }

  const handleStartTrip = () => {
    setShowScanResults(false)
    setIsNavigating(true)
    setTimeout(() => setShowUpcomingAlert(true), 2000)
  }

  const handleEndTrip = () => {
    setIsNavigating(false)
    setShowUpcomingAlert(false)
    setStartPoint('')
    setDestination('')
    setShowScanResults(false)
  }

  // ── Route SVG Path ──────────────────────────────────
  const routeD = routePath.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ')

  // ── Upcoming hazard (mock) ──────────────────────────
  const upcomingHazard = {
    type: 'tractor' as ReportType,
    label: 'Road Works ahead — Independence',
    distance: '0.9 KM',
  }

  return (
    <div className="relative h-[100dvh] w-full max-w-[430px] mx-auto bg-[#e4e4e4] overflow-hidden">
      {/* Map background */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 430 932" preserveAspectRatio="none">
        <rect x="0" y="0" width="430" height="932" fill="#e4e4e4" />

        {/* Vertical roads */}
        {[54, 124, 194, 264, 334, 404].map((x) => (
          <rect key={`v${x}`} x={x} y="0" width="10" height="932" fill="#fafafa" />
        ))}
        {/* Horizontal roads */}
        {[114, 234, 354, 474, 594, 714, 834].map((y) => (
          <rect key={`h${y}`} x="0" y={y} width="430" height="10" fill="#fafafa" />
        ))}

        {/* Diagonal roads */}
        <g stroke="#fafafa" strokeWidth="14" fill="none" strokeLinecap="round">
          <path d="M0,100 L390,280" />
          <path d="M290,240 L410,580" />
          <path d="M0,890 L345,1000" />
        </g>

        {/* Green parks */}
        <rect x="325" y="310" width="32" height="76" rx="8" fill="#bfe3c8" />
        <rect x="285" y="550" width="80" height="22" rx="8" fill="#bfe3c8" />
        <rect x="48" y="610" width="16" height="76" rx="8" fill="#bfe3c8" />
        <rect x="30" y="980" width="58" height="50" rx="10" fill="#bfe3c8" />

        {/* River */}
        <path d="M-20,900 C100,870 220,935 430,890 L430,932 L-20,932 Z" fill="#8bd3f0" />
        <path d="M-20,900 C100,870 220,935 430,890" stroke="#8bd3f0" strokeWidth="22" fill="none" />

        {/* Route line (when navigating OR scan results) */}
        {(isNavigating || showScanResults) && (
          <>
            <path d={routeD} stroke="#0ea5e9" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
            <path d={routeD} stroke="#0ea5e9" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}

        {/* Street labels */}
        <text x="168" y="152" fontSize="15" fill="#4a4a4a" fontWeight="600" transform="rotate(-20 168 152)">Chesapeake Avenue</text>
        <text x="358" y="400" fontSize="15" fill="#4a4a4a" fontWeight="600" transform="rotate(65 358 400)">Southwood Avenue</text>
        <text x="52" y="570" fontSize="15" fill="#4a4a4a" fontWeight="600" transform="rotate(90 52 570)">Dresden Street</text>
        <text x="298" y="550" fontSize="15" fill="#4a4a4a" fontWeight="600">McDowell Street</text>
        <text x="112" y="770" fontSize="15" fill="#4a4a4a" fontWeight="600" transform="rotate(15 112 770)">Bretton Place</text>
      </svg>

      {/* Pins */}
      {reports.map((r) => (
        <button
          key={r.id}
          onClick={() => setSelectedPin(r.id === selectedPin ? null : r.id)}
          className={`absolute z-[5] flex flex-col items-center cursor-pointer transition-transform active:scale-95 ${r.id === selectedPin ? 'z-10' : ''}`}
          style={{
            top: r.top,
            left: r.left,
            transform: `translate(-50%, ${r.id === selectedPin ? '-100%' : '-50%'})`,
          }}
        >
          <div
            className="flex items-center justify-center transition-all rounded-full shadow-md"
            style={{
              backgroundColor: r.color,
              width: r.id === selectedPin ? 56 : 36,
              height: r.id === selectedPin ? 56 : 36,
              boxShadow: r.id === selectedPin ? '0 4px 16px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <ReportIcon type={r.type} selected={r.id === selectedPin} />
          </div>
          {r.id === selectedPin && (
            <>
              <div
                className="w-3 h-3 -mt-1.5 rotate-45"
                style={{ backgroundColor: r.color, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
              />
              <span className="mt-1 text-[13px] font-bold text-gray-900 whitespace-nowrap">{r.label}</span>
            </>
          )}
        </button>
      ))}

      {/* Home Header (when not navigating and not scan results) */}
      {!isNavigating && !showScanResults && (
        <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-2">
          {/* Profile bar */}
          <div className="flex items-center justify-between px-4 py-3 mb-3 bg-white shadow-sm rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-gray-500 bg-gray-300 rounded-full">
                AA
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Good Afternoon 👋</p>
                <p className="text-xs text-purple-600">Lagos, Nigeria</p>
              </div>
            </div>
            <button className="relative flex items-center justify-center w-10 h-10">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-700" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </button>
          </div>

          {/* Search bar */}
          <button
            onClick={() => setShowPlanModal(true)}
            className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm text-left"
          >
            <svg viewBox="0 0 24 24" className="flex-shrink-0 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span className="flex-1 text-sm text-gray-400">Where are you going?</span>
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </div>
      )}

      {/* Scan Results Header (route info cards) */}
      {showScanResults && (
        <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-2">
          {/* Route info card */}
          <div className="px-4 py-3 mb-3 bg-white shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{startPoint || 'Lekki Phase 1'}</p>
                <p className="text-xs text-gray-400">From</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{destination || '3rd Avenue Market St'}</p>
                <p className="text-xs text-gray-400">To</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Header (when navigating) */}
      {isNavigating && (
        <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-2 max-h-[70%] overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-2">
            {/* Green direction banner */}
            <div className="flex items-center gap-3 px-4 py-3 shadow-sm bg-emerald-500 rounded-2xl">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide uppercase text-white/80">In 3.6 KM</p>
                <p className="text-sm font-semibold text-white">Head out and follow the route</p>
              </div>
            </div>

            {/* Upcoming hazard alert */}
            {showUpcomingAlert && (
              <div className="flex items-center gap-3 px-4 py-3 bg-white shadow-sm rounded-xl animate-in slide-in-from-top-2">
                <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Upcoming</p>
                  <p className="text-sm font-medium text-gray-900 truncate">🚜 {upcomingHazard.label}</p>
                </div>
                <span className="text-xs font-medium text-gray-500">{upcomingHazard.distance}</span>
              </div>
            )}

            {/* Trip stats card */}
            <div className="px-5 py-4 bg-white shadow-sm rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-0.5">ETA</p>
                  <p className="text-xl font-bold text-gray-900">17 min</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Remaining</p>
                  <p className="text-xl font-bold text-gray-900">7.1 km</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Hazards</p>
                  <p className="text-xl font-bold text-amber-500">2</p>
                </div>
              </div>
              <button
                onClick={handleEndTrip}
                className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition active:scale-[0.98]"
              >
                End Trip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation User Location Pulse */}
      {isNavigating && (
        <div
          className="absolute z-[6] -translate-x-1/2 -translate-y-1/2"
          style={{ top: '72%', left: '56%' }}
        >
          <div className="relative">
            <div className="absolute inset-0 -m-1 rounded-full w-14 h-14 bg-sky-400/30 animate-ping" />
            <div className="absolute inset-0 w-12 h-12 rounded-full bg-sky-400/20" />
            <div className="relative flex items-center justify-center w-10 h-10 border-2 border-white rounded-full shadow-lg bg-sky-500">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* SOS Floating Button */}
      {!showSOS && (
        <div
          className="absolute z-30 bottom-32 right-4"
          onMouseDown={startSOSHold}
          onMouseUp={endSOSHold}
          onMouseLeave={endSOSHold}
          onTouchStart={(e) => { e.preventDefault(); startSOSHold(); }}
          onTouchEnd={(e) => { e.preventDefault(); endSOSHold(); }}
        >
          {/* Outer pulse ring */}
          <span className="absolute inset-[-6px] rounded-full border-[3px] border-red-400/35 animate-ping pointer-events-none" />
          <span className="absolute inset-[-6px] rounded-full border-[3px] border-red-400/35 pointer-events-none" />

          {/* Circular progress ring */}
          {sosHolding && (
            <svg className="absolute inset-[-4px] w-[88px] h-[88px] -rotate-90 pointer-events-none" viewBox="0 0 88 88">
              <circle
                cx="44"
                cy="44"
                r="42"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - sosProgress / 100)}
                style={{ transition: 'stroke-dashoffset 0.05s linear' }}
              />
            </svg>
          )}

          {/* Button */}
          <button className="relative flex flex-col items-center justify-center w-20 h-20 text-white transition rounded-full bg-[#ff4444] active:scale-95 touch-none select-none">
            <span className="text-[15px] font-bold">SOS</span>
            <span className="text-[10px] opacity-90">Hold 3 secs</span>
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          PLAN ROUTE MODAL — FIXED
          ═══════════════════════════════════════════════════════ */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white animate-in slide-in-from-bottom">
          {/* Header */}
          <div className="flex-shrink-0 px-5 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Plan a route</h2>
                <p className="mt-1 text-sm text-gray-500">We'll scan reported hazards along the way before you drive.</p>
              </div>
              <button
                onClick={() => setShowPlanModal(false)}
                className="flex items-center justify-center text-gray-500 transition bg-gray-100 rounded-full w-9 h-9 hover:bg-gray-200"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 px-5 space-y-5 overflow-y-auto min-h-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Point A */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-5 h-5 border-2 rounded-full border-emerald-500">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <span className="text-sm font-medium text-gray-900">Point A — Start</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                <input
                  type="text"
                  placeholder="Search a place or Address"
                  value={startPoint}
                  onChange={(e) => setStartPoint(e.target.value)}
                  className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
                />
                <button
                  onClick={handleUseMyLocation}
                  disabled={isGettingLocation}
                  className="text-sm font-medium text-purple-600 whitespace-nowrap hover:text-purple-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isGettingLocation ? (
                    <>
                      <SpinnerIcon className="w-3.5 h-3.5" />
                      Locating...
                    </>
                  ) : (
                    'Use my location'
                  )}
                </button>
              </div>
              {locationError && (
                <p className="mt-1.5 ml-1 text-xs text-red-500">{locationError}</p>
              )}
            </div>

            {/* Point B */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                <span className="text-sm font-medium text-gray-900">Point B — Destination</span>
              </div>
              <div className="px-4 py-3 bg-gray-50 rounded-xl">
                <input
                  type="text"
                  placeholder="Where to?"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
                />
              </div>
            </div>

            {/* Spacer to ensure scrollability */}
            <div className="h-4" />
          </div>

          {/* Scan button */}
          <div className="flex-shrink-0 px-5 pt-4 pb-8">
            <button
              onClick={handleScanRoute}
              disabled={!startPoint || !destination}
              className="w-full h-14 bg-purple-700 hover:bg-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-lg rounded-2xl transition active:scale-[0.98]"
            >
              Scan route
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SCAN RESULTS BOTTOM SHEET — FIXED
          ═══════════════════════════════════════════════════════ */}
      {showScanResults && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white/0 pointer-events-none">
          {/* Transparent top area (map visible behind) */}
          <div className="flex-shrink-0 h-[35%]" onClick={() => setShowScanResults(false)} />

          {/* Bottom sheet content */}
          <div className="flex-1 flex flex-col bg-white rounded-t-[24px] shadow-[0_-4px_24px_rgba(0,0,0,0.15)] pointer-events-auto overflow-hidden">
            {/* Drag handle */}
            <div className="flex justify-center flex-shrink-0 pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 text-center bg-gray-50 rounded-2xl">
                  <p className="text-lg font-bold text-gray-900">9.5 km</p>
                  <p className="text-xs text-gray-400 mt-0.5">Distance</p>
                </div>
                <div className="p-3 text-center bg-gray-50 rounded-2xl">
                  <p className="text-lg font-bold text-gray-900">23 min</p>
                  <p className="text-xs text-gray-400 mt-0.5">ETA</p>
                </div>
                <div className="p-3 text-center bg-gray-50 rounded-2xl">
                  <p className="text-lg font-bold text-emerald-500">91</p>
                  <p className="text-xs text-gray-400 mt-0.5">Safety</p>
                </div>
              </div>

              {/* Hazard banner */}
              <div className="flex items-center gap-2 px-4 py-3 mb-4 border bg-amber-50 rounded-xl border-amber-100">
                <svg viewBox="0 0 24 24" className="flex-shrink-0 w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <p className="text-sm font-medium text-amber-700">
                  {scanHazards.length} hazards reported on this route. Drive carefully.
                </p>
              </div>

              {/* Hazards list */}
              <div className="mb-6 space-y-3">
                {scanHazards.map((hazard) => (
                  <div key={hazard.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <HazardListIcon type={hazard.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{hazard.title}</p>
                      <p className="text-xs text-gray-400">{hazard.location}</p>
                    </div>
                    <span className="flex-shrink-0 px-2 py-1 text-xs font-medium text-gray-500 bg-white rounded-lg">
                      {hazard.distance}
                    </span>
                  </div>
                ))}
              </div>

              {/* Start trip button */}
              <button
                onClick={handleStartTrip}
                className="w-full h-14 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-lg rounded-2xl transition active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Start trip
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SOS ACTIVE SCREEN — FIXED
          ═══════════════════════════════════════════════════════ */}
      {showSOS && (
        <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-red-500">
          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-14">
            <div>
              <h2 className="text-3xl font-extrabold text-white">SOS Active</h2>
              <p className="mt-1 text-sm text-white/80">SOS broadcast, nearby drivers and contacts notified</p>
            </div>
            <button
              onClick={() => setShowSOS(false)}
              className="flex items-center justify-center text-white transition rounded-full w-9 h-9 bg-white/20 hover:bg-white/30"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Siren */}
          <div className="flex items-center justify-center flex-1">
            <div className="relative">
              <div className="absolute inset-0 w-48 h-48 -m-6 rounded-full bg-white/10 animate-ping" />
              <div className="absolute inset-0 w-40 h-40 -m-2 rounded-full bg-white/15" />
              <div className="relative flex items-center justify-center bg-white rounded-full shadow-2xl w-36 h-36">
                <svg viewBox="0 0 24 24" className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v1" />
                  <path d="M12 20v1" />
                  <path d="M4.2 7.2l.7.7" />
                  <path d="M19.1 16.1l.7.7" />
                  <path d="M3 12h1" />
                  <path d="M20 12h1" />
                  <path d="M4.2 16.8l.7-.7" />
                  <path d="M19.1 7.9l.7-.7" />
                  <path d="M12 8a4 4 0 0 1 4 4v3H8v-3a4 4 0 0 1 4-4z" />
                  <path d="M8 15v2a4 4 0 0 0 8 0v-2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-24 space-y-3">
            <button
              onClick={() => setShowSOS(false)}
              className="w-full h-14 bg-white text-red-500 font-semibold text-lg rounded-xl hover:bg-gray-50 transition active:scale-[0.98]"
            >
              Cancel SOS
            </button>
            <a
              href="tel:112"
              className="w-full h-14 bg-white/20 text-white font-semibold text-lg rounded-xl flex items-center justify-center gap-2 hover:bg-white/30 transition active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Call 112
            </a>
          </div>
        </div>
      )}

      {/* BottomNav — always rendered, modals at z-[60] cover it */}
      <div className="relative z-30">
        <BottomNav />
      </div>
    </div>
  )
}