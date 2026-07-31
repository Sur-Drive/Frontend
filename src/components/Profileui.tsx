import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X, ChevronLeft, Check } from 'lucide-react'

// ---------- Toggle ----------

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      aria-pressed={checked}
      aria-disabled={disabled}
      disabled={disabled}
      className={`relative h-7 w-[52px] shrink-0 rounded-full p-0.5 transition-colors duration-200 ${
        checked ? 'bg-emerald-500' : 'bg-gray-300'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <span
        className={`block h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
          checked ? 'translate-x-[24px]' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

// ---------- ModalSheet ----------

interface ModalSheetProps {
  title: string
  onClose?: () => void
  onBack?: () => void
  children: ReactNode
  footer?: ReactNode
}

export function ModalSheet({ title, onClose, onBack, children, footer }: ModalSheetProps) {
  // Lock body scroll so the page behind doesn't scroll on iOS
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 overscroll-contain">
      <div
        className="relative flex w-full max-w-md flex-col overflow-hidden rounded-t-[40px] bg-white shadow-2xl h-[85vh] max-h-[85vh] [@supports(height:100dvh)]:h-[min(92dvh,92svh)] [@supports(height:100dvh)]:max-h-[100dvh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-2 pt-[calc(1.5rem+env(safe-area-inset-top))] shrink-0">
          {onBack ? (
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 text-white rounded-full bg-purple-950"
            >
              <ChevronLeft size={18} />
            </button>
          ) : (
            <h2 className="text-xl font-extrabold text-gray-900 sm:text-2xl">{title}</h2>
          )}
          {onClose && !onBack && (
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 text-gray-500 bg-gray-100 rounded-full"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {onBack && (
          <div className="px-6 pb-1 shrink-0">
            <h2 className="text-xl font-extrabold text-gray-900 sm:text-2xl">{title}</h2>
          </div>
        )}

        {/* Content — min-h-0 is the critical fix for flexbox truncation */}
        <div className="flex-1 min-h-0 px-6 pb-4 overflow-y-auto [-webkit-overflow-scrolling:touch]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 pt-2 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shrink-0 bg-white border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- SuccessScreen ----------

interface SuccessScreenProps {
  title: string
  description: string
  primaryLabel?: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
}

export function SuccessScreen({
  title,
  description,
  primaryLabel = 'Done',
  onPrimary,
  secondaryLabel,
  onSecondary,
}: SuccessScreenProps) {
  // Lock body scroll
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 overscroll-contain">
      <div className="relative flex w-full max-w-md flex-col items-center rounded-t-[40px] bg-emerald-700 px-8 py-10 text-center shadow-2xl h-[85vh] max-h-[85vh] [@supports(height:100dvh)]:h-[min(92dvh,92svh)] [@supports(height:100dvh)]:max-h-[100dvh]">
        {/* Scrollable middle area */}
        <div className="flex flex-col items-center justify-center flex-1 w-full min-h-0 py-4 overflow-y-auto [-webkit-overflow-scrolling:touch]">
          <div className="flex items-center justify-center w-24 h-24 rounded-full shadow-lg sm:h-28 sm:w-28 bg-emerald-500 shrink-0">
            <Check size={48} className="text-white sm:size-56" strokeWidth={3} />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold text-white sm:mt-8 sm:text-3xl">{title}</h2>
          <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-emerald-100">{description}</p>
        </div>

        {/* Buttons — always visible, never squashed */}
        <div className="w-full max-w-md pt-4 shrink-0">
          <button
            onClick={onPrimary}
            className="w-full rounded-2xl bg-white py-4 text-[16px] font-semibold text-emerald-700 active:scale-[0.98] transition"
          >
            {primaryLabel}
          </button>
          {secondaryLabel && onSecondary && (
            <button onClick={onSecondary} className="mt-4 text-[15px] font-medium text-emerald-100">
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}












// import type { ReactNode } from 'react'
// import { X, ChevronLeft, Check } from 'lucide-react'

// // ---------- Toggle ----------

// interface ToggleProps {
//   checked: boolean
//   onChange: (checked: boolean) => void
//   disabled?: boolean
// }

// export function Toggle({ checked, onChange, disabled }: ToggleProps) {
//   return (
//     <button
//       onClick={() => !disabled && onChange(!checked)}
//       aria-pressed={checked}
//       aria-disabled={disabled}
//       disabled={disabled}
//       className={`relative h-7 w-[52px] shrink-0 rounded-full p-0.5 transition-colors duration-200 ${
//         checked ? 'bg-emerald-500' : 'bg-gray-300'
//       } ${disabled ? 'opacity-60' : ''}`}
//     >
//       <span
//         className={`block h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
//           checked ? 'translate-x-[24px]' : 'translate-x-0'
//         }`}
//       />
//     </button>
//   )
// }

// // ---------- ModalSheet ----------

// interface ModalSheetProps {
//   title: string
//   onClose?: () => void
//   onBack?: () => void
//   children: ReactNode
//   footer?: ReactNode
// }

// export function ModalSheet({ title, onClose, onBack, children, footer }: ModalSheetProps) {
//   return (
//     <div className="fixed inset-0 flex items-end justify-center z-[60] bg-black/40">
//       <div
//         className="relative flex w-full max-w-md flex-col overflow-hidden rounded-t-[40px] bg-white shadow-2xl"
//         style={{ height: 'min(92dvh, 92svh)', maxHeight: '100dvh' }}
//       >
//         {/* Header */}
//         <div className="flex items-center justify-between px-6 pb-2 pt-[calc(1.5rem+env(safe-area-inset-top))]">
//           {onBack ? (
//             <button
//               onClick={onBack}
//               className="flex items-center justify-center w-10 h-10 text-white rounded-full bg-purple-950"
//             >
//               <ChevronLeft size={18} />
//             </button>
//           ) : (
//             <h2 className="text-2xl font-extrabold text-gray-900">{title}</h2>
//           )}
//           {onClose && !onBack && (
//             <button
//               onClick={onClose}
//               className="flex items-center justify-center w-8 h-8 text-gray-500 bg-gray-100 rounded-full"
//             >
//               <X size={16} />
//             </button>
//           )}
//         </div>

//         {onBack && (
//           <div className="px-6 pb-1">
//             <h2 className="text-2xl font-extrabold text-gray-900">{title}</h2>
//           </div>
//         )}

//         {/* Content */}
//         <div className="flex-1 px-6 pb-4 overflow-y-auto">{children}</div>

//         {/* Footer */}
//         {footer && <div className="px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2">{footer}</div>}
//       </div>
//     </div>
//   )
// }

// // ---------- SuccessScreen ----------

// interface SuccessScreenProps {
//   title: string
//   description: string
//   primaryLabel?: string
//   onPrimary: () => void
//   secondaryLabel?: string
//   onSecondary?: () => void
// }

// // export function SuccessScreen({
// //   title,
// //   description,
// //   primaryLabel = 'Done',
// //   onPrimary,
// //   secondaryLabel,
// //   onSecondary,
// // }: SuccessScreenProps) {
// //   return (
// //     <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
// //       <div className="relative flex h-[92vh] w-full max-w-md flex-col items-center justify-between overflow-hidden rounded-t-3xl bg-emerald-700 px-8 py-14 text-center shadow-2xl">
// //         <div className="flex flex-col items-center justify-center flex-1">
// //           <div className="flex items-center justify-center rounded-full shadow-lg h-28 w-28 bg-emerald-500">
// //             <Check size={56} className="text-white" strokeWidth={3} />
// //           </div>
// //           <h2 className="mt-8 text-3xl font-extrabold text-white">{title}</h2>
// //           <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-emerald-100">{description}</p>
// //         </div>

// //         <div className="w-full max-w-md">
// //           <button
// //             onClick={onPrimary}
// //             className="w-full rounded-2xl bg-white py-4 text-[16px] font-semibold text-emerald-700"
// //           >
// //             {primaryLabel}
// //           </button>
// //           {secondaryLabel && onSecondary && (
// //             <button onClick={onSecondary} className="mt-4 text-[15px] font-medium text-emerald-100">
// //               {secondaryLabel}
// //             </button>
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }

// export function SuccessScreen({
//   title,
//   description,
//   primaryLabel = 'Done',
//   onPrimary,
//   secondaryLabel,
//   onSecondary,
// }: SuccessScreenProps) {
//   return (
//     <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40">
//       <div
//         className="relative flex w-full max-w-md flex-col items-center rounded-t-[40px] bg-emerald-700 px-8 py-10 text-center shadow-2xl"
//         style={{ height: 'min(92dvh, 92svh)', maxHeight: '100dvh' }}
//       >
//         <div className="flex flex-col items-center justify-center flex-1 w-full min-h-0 py-4 overflow-y-auto">
//           <div className="flex items-center justify-center rounded-full shadow-lg h-28 w-28 bg-emerald-500 shrink-0">
//             <Check size={56} className="text-white" strokeWidth={3} />
//           </div>
//           <h2 className="mt-8 text-3xl font-extrabold text-white">{title}</h2>
//           <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-emerald-100">{description}</p>
//         </div>

//         <div className="w-full max-w-md pt-4 shrink-0">
//           <button
//             onClick={onPrimary}
//             className="w-full rounded-2xl bg-white py-4 text-[16px] font-semibold text-emerald-700"
//           >
//             {primaryLabel}
//           </button>
//           {secondaryLabel && onSecondary && (
//             <button onClick={onSecondary} className="mt-4 text-[15px] font-medium text-emerald-100">
//               {secondaryLabel}
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }