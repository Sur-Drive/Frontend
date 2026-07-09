import type { ReactNode } from 'react'
import { X, ChevronLeft, Check } from 'lucide-react'

// ---------- Toggle ----------

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`relative h-7 w-[52px] shrink-0 rounded-full p-0.5 transition-colors duration-200 ${
        checked ? 'bg-emerald-500' : 'bg-gray-300'
      }`}
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
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="relative flex h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          {onBack ? (
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 text-white rounded-full bg-purple-950"
            >
              <ChevronLeft size={18} />
            </button>
          ) : (
            <h2 className="text-2xl font-extrabold text-gray-900">{title}</h2>
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
          <div className="px-6 pb-1">
            <h2 className="text-2xl font-extrabold text-gray-900">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 px-6 pb-4 overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && <div className="px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2">{footer}</div>}
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
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="relative flex h-[92vh] w-full max-w-md flex-col items-center justify-between overflow-hidden rounded-t-3xl bg-emerald-700 px-8 py-14 text-center shadow-2xl">
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="flex items-center justify-center rounded-full shadow-lg h-28 w-28 bg-emerald-500">
            <Check size={56} className="text-white" strokeWidth={3} />
          </div>
          <h2 className="mt-8 text-3xl font-extrabold text-white">{title}</h2>
          <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-emerald-100">{description}</p>
        </div>

        <div className="w-full max-w-md">
          <button
            onClick={onPrimary}
            className="w-full rounded-2xl bg-white py-4 text-[16px] font-semibold text-emerald-700"
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