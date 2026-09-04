import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import {
  Smartphone,
  Mail,
  MessageSquare,
  MessageCircle,
  Plus,
  Minus,
  Users,
  Pencil,
  Trash2,
  MapPin,
  Lock,
  FileText,
  Eye,
  EyeOff,
  AlertCircle,
  BellRing,
  Building2,
  Phone,
  Car,
  Activity,
  Wrench,
  Calendar,
  ShieldCheck,
  X,
  ChevronLeft,
} from 'lucide-react'
import { useNotificationPreferences, useUpdateNotificationPreferences } from '../hooks/useNotifications'
import type { NotificationPreferences } from '../hooks/useNotifications'
import { usePushSubscription } from '../hooks/usePushSubscription'
import { ApiError } from '../lib/apiClient'
import {
  useEmergencyContacts,
  useCreateEmergencyContact,
  useUpdateEmergencyContact,
  useDeleteEmergencyContact,
  useSetPrimaryEmergencyContact,
} from '../hooks/useEmergencyContacts'
import type { EmergencyContactDto, EmergencyContactInput } from '../api/emergencyContacts'
import { useUpdatePassword } from '../hooks/useAuth'
import { useDeleteAccount } from '../hooks/useProfile'
import { useFleet } from '../hooks/useFleet'
import type { FleetManager } from '../hooks/useFleet'




const IOS_SAFE_INPUT =
  'w-full rounded-2xl bg-gray-100 px-4 py-3.5 text-base text-gray-800 placeholder:text-gray-400 focus:outline-none'
const IOS_SAFE_INPUT_BORDER =
  'w-full rounded-2xl border-2 border-purple-200 bg-white px-4 py-3.5 text-base text-gray-800 focus:border-purple-500 focus:outline-none'


export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-[52px] shrink-0 items-center rounded-full transition ${
        checked ? 'bg-purple-700' : 'bg-gray-300'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
          checked ? 'translate-x-[26px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  )
}

export function SuccessScreen({
  title,
  description,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  title: string
  description: string
  onPrimary: () => void
  secondaryLabel: string
  onSecondary: () => void
}) {
  return (
    <div className="flex flex-col items-center px-6 pt-10 pb-6 text-center">
      <div className="flex items-center justify-center w-16 h-16 mb-5 bg-green-100 rounded-full">
        <ShieldCheck size={32} className="text-green-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-gray-500">{description}</p>
      <div className="flex flex-col w-full gap-3 mt-8">
        <button
          onClick={onPrimary}
          className="w-full rounded-2xl bg-purple-700 py-4 text-[16px] font-semibold text-white active:scale-[0.98] transition"
        >
          Done
        </button>
        <button
          onClick={onSecondary}
          className="w-full rounded-2xl bg-gray-100 py-4 text-[16px] font-semibold text-gray-700 active:scale-[0.98] transition"
        >
          {secondaryLabel}
        </button>
      </div>
    </div>
  )
}

export function ModalSheet({
  title,
  children,
  onClose,
  onBack,
  footer,
}: {
  title: string
  children: ReactNode
  onClose?: () => void
  onBack?: () => void
  footer?: ReactNode
}) {
  // Lock body scroll when modal opens
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      {/* <div
        className="relative z-10 flex flex-col w-full max-w-full bg-white shadow-2xl sm:max-w-md sm:rounded-3xl rounded-t-3xl"
        style={{ maxHeight: '78vh' }}
      > */}

            <div
        className="relative flex flex-col w-full max-w-full mb-16 bg-white shadow-2xl z-14 sm:max-w-md sm:rounded-3xl rounded-t-3xl"
        style={{ maxHeight: '82vh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            {onBack && (
              <button onClick={onBack} className="p-1 -ml-1 text-gray-500">
                <ChevronLeft size={24} />
              </button>
            )}
            <h2 className="text-[17px] font-bold text-gray-900">{title}</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 -mr-1 text-gray-400">
              <X size={22} />
            </button>
          )}
        </div>

        
        <div className="flex-1 px-5 pb-8 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {/* Footer */}
        {/* {footer && <div className="px-5 pt-3 pb-5 border-t border-gray-100 shrink-0">{footer}</div>} */}
                {footer && <div className="px-5 pt-3 pb-5 border-t border-gray-100 shrink-0" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>{footer}</div>}
      </div>
    </div>
  )
}



const HAZARD_TYPES = [
  'POTHOLE',
  'ACCIDENT',
  'FLOODING',
  'CONSTRUCTION',
  'ROADBLOCK',
  'DEBRIS',
] as const

const RADIUS_MIN = 1
const RADIUS_MAX = 50

// ============================================================
// Notifications
// ============================================================

interface NotificationsModalProps {
  onClose: () => void
}

export function NotificationsModal({ onClose }: NotificationsModalProps) {
  const { data: preferences, isLoading, isError, error } = useNotificationPreferences()
  const { mutate: updatePreferences, isPending } = useUpdateNotificationPreferences()
  const { subscribe, status: pushStatus } = usePushSubscription()

  const [pushBanner, setPushBanner] = useState<
    { type: 'error' | 'denied'; message: string } | null
  >(null)

  const toggle = async (key: keyof Pick<NotificationPreferences, 'push' | 'email' | 'sms'>) => {
    if (!preferences) return
    const turningOn = !preferences[key]

    if (key !== 'push' || !turningOn) {
      updatePreferences({ [key]: turningOn })
      return
    }

    setPushBanner(null)
    const result = await subscribe()

    if (result.ok) {
      updatePreferences({ push: true })
    } else if (result.reason === 'denied') {
      setPushBanner({
        type: 'denied',
        message:
          "Notifications are blocked for this site. Enable them in your browser's site settings, then try again.",
      })
    } else {
      setPushBanner({
        type: 'error',
        message: 'Could not enable push notifications on this device. Please try again.',
      })
    }
  }

  const toggleHazardType = (type: string) => {
    if (!preferences) return
    const current = preferences.hazardTypes ?? []
    const next = current.includes(type) ? current.filter((t) => t !== type) : [...current, type]
    updatePreferences({ hazardTypes: next })
  }

  const setRadius = (value: number) => {
    if (!preferences) return
    const clamped = Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, value))
    if (clamped === preferences.radius) return
    updatePreferences({ radius: clamped })
  }

  const isNotYetAvailable = isError && error instanceof ApiError && error.status === 404

  if (isNotYetAvailable) {
    return (
      <ModalSheet title="Notifications Settings" onClose={onClose}>
        <div className="flex flex-col items-center px-2 pt-10 pb-10 text-center">
          <div className="flex items-center justify-center w-16 h-16 mb-5 bg-purple-100 rounded-full">
            <BellRing size={28} className="text-purple-700" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Coming soon</h3>
          <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-gray-400">
            Notification settings aren't available just yet. Check back soon.
          </p>
        </div>
      </ModalSheet>
    )
  }

  if (isError) {
    return (
      <ModalSheet title="Notifications Settings" onClose={onClose}>
        <div className="flex flex-col items-center px-2 pt-10 pb-10 text-center">
          <AlertCircle size={36} className="mb-3 text-red-400" />
          <p className="text-[15px] text-gray-500">
            {error instanceof Error ? error.message : 'Could not load your notification settings.'}
          </p>
        </div>
      </ModalSheet>
    )
  }

  return (
    <ModalSheet title="Notifications Settings" onClose={onClose}>
      {pushBanner && (
        <div
          className={`mb-4 flex items-start gap-2 rounded-2xl px-4 py-3 text-[13px] ${
            pushBanner.type === 'denied'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-red-50 text-red-600'
          }`}
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{pushBanner.message}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <ToggleRow
          icon={<Smartphone size={18} className="text-purple-700" />}
          title="Push Notification"
          subtitle={pushStatus === 'subscribing' ? 'Requesting permission…' : 'Updates & promos'}
          loading={isLoading}
        >
          <Toggle
            checked={preferences?.push ?? false}
            onChange={() => toggle('push')}
            disabled={isLoading || isPending || pushStatus === 'subscribing'}
          />
        </ToggleRow>
        <ToggleRow
          icon={<Mail size={18} className="text-purple-700" />}
          title="Email Notification"
          subtitle="Updates & promos"
          loading={isLoading}
        >
          <Toggle
            checked={preferences?.email ?? false}
            onChange={() => toggle('email')}
            disabled={isLoading || isPending}
          />
        </ToggleRow>
        <ToggleRow
          icon={<MessageSquare size={18} className="text-purple-700" />}
          title="SMS Notification"
          subtitle="Updates & promos"
          loading={isLoading}
        >
          <Toggle
            checked={preferences?.sms ?? false}
            onChange={() => toggle('sms')}
            disabled={isLoading || isPending}
          />
        </ToggleRow>
      </div>

      <div className="mt-6">
        <p className="mb-1 text-[15px] font-semibold text-gray-900">Hazard types</p>
        <p className="mb-3 text-[13px] text-gray-400">Choose what you want to be alerted about</p>
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-24 bg-gray-100 rounded-full h-9 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {HAZARD_TYPES.map((type) => {
              const active = preferences?.hazardTypes?.includes(type) ?? false
              return (
                <button
                  key={type}
                  onClick={() => toggleHazardType(type)}
                  disabled={isPending}
                  className={`rounded-full px-3 py-2 text-[12px] font-semibold transition sm:px-4 sm:text-[13px] ${
                    active ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {formatHazardLabel(type)}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-6">
        <p className="mb-1 text-[15px] font-semibold text-gray-900">Alert radius</p>
        <p className="mb-3 text-[13px] text-gray-400">
          Get notified about hazards within this distance
        </p>
        {isLoading ? (
          <div className="bg-gray-100 h-14 animate-pulse rounded-2xl" />
        ) : (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-100 rounded-2xl">
            <button
              onClick={() => setRadius((preferences?.radius ?? RADIUS_MIN) - 1)}
              disabled={isPending || (preferences?.radius ?? RADIUS_MIN) <= RADIUS_MIN}
              className="flex items-center justify-center text-purple-700 bg-white rounded-full h-9 w-9 disabled:opacity-40"
            >
              <Minus size={16} />
            </button>
            <p className="text-[16px] font-bold text-gray-900">
              {preferences?.radius ?? RADIUS_MIN} km
            </p>
            <button
              onClick={() => setRadius((preferences?.radius ?? RADIUS_MIN) + 1)}
              disabled={isPending || (preferences?.radius ?? RADIUS_MIN) >= RADIUS_MAX}
              className="flex items-center justify-center text-purple-700 bg-white rounded-full h-9 w-9 disabled:opacity-40"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>
    </ModalSheet>
  )
}

function formatHazardLabel(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase()
}

function ToggleRow({
  icon,
  title,
  subtitle,
  children,
  loading,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  children: ReactNode
  loading?: boolean
}) {
  return (
    <div className="flex items-center justify-between px-4 py-4 bg-gray-100 rounded-2xl">
      <div className="flex items-center min-w-0 gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-gray-900 truncate">{title}</p>
          <p className="text-[13px] text-gray-400 truncate">{subtitle}</p>
        </div>
      </div>
      {loading ? <div className="h-7 w-[52px] animate-pulse rounded-full bg-gray-200" /> : children}
    </div>
  )
}

// ============================================================
// Emergency Contact
// ============================================================

interface EmergencyContactModalProps {
  onClose: () => void
}

type ContactStep = 'list' | 'add' | 'success'

const RELATIONSHIPS = ['Parent', 'Sibling', 'Spouse', 'Child', 'Friend', 'Colleague', 'Other']

function toE164Nigeria(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('234')) return `+${digits}`
  if (digits.startsWith('0')) return `+234${digits.slice(1)}`
  return `+234${digits}`
}

const emptyForm: EmergencyContactInput = {
  fullName: '',
  phoneNumber: '',
  email: '',
  gender: 'Male',
  relationship: '',
  isPrimary: false,
}

export function EmergencyContactModal({ onClose }: EmergencyContactModalProps) {
  const { data: contacts, isLoading, isError, error } = useEmergencyContacts()
  const createContact = useCreateEmergencyContact()
  const updateContact = useUpdateEmergencyContact()
  const deleteContact = useDeleteEmergencyContact()
  const setPrimary = useSetPrimaryEmergencyContact()

  const [step, setStep] = useState<ContactStep>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EmergencyContactInput>(emptyForm)

  const isSaving = createContact.isPending || updateContact.isPending
  const saveError = createContact.error || updateContact.error

  const startAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setStep('add')
  }

  const startEdit = (contact: EmergencyContactDto) => {
    setEditingId(contact.id)
    setForm({
      fullName: contact.fullName,
      phoneNumber: contact.phoneNumber,
      email: contact.email,
      gender: contact.gender,
      relationship: contact.relationship,
      isPrimary: contact.isPrimary,
    })
    setStep('add')
  }

  const canSubmit = form.fullName.trim() !== '' && form.phoneNumber.trim() !== ''

  const handleSubmit = () => {
    if (!canSubmit) return

    const payload = {
      ...form,
      phoneNumber: toE164Nigeria(form.phoneNumber),
      email: form.email?.trim() ? form.email.trim() : undefined,
    }

    const onSuccess = () => setStep('success')
    if (editingId) {
      updateContact.mutate({ id: editingId, ...payload }, { onSuccess })
    } else {
      createContact.mutate(payload, { onSuccess })
    }
  }

  if (step === 'success') {
    return (
      <ModalSheet
        title="Emergency Contact"
        onClose={onClose}
        footer={
          <button
            onClick={startAdd}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-700 py-4 text-[16px] font-semibold text-white transition active:scale-[0.98]"
          >
            <Plus size={18} /> Add Another Contact
          </button>
        }
      >
        <SuccessScreen
          title="Emergency Contact Added Successfully"
          description="Your emergency contact has been added successfully, and they can now be reached quickly in case of an emergency."
          onPrimary={() => setStep('list')}
          secondaryLabel="Add Another Contact"
          onSecondary={startAdd}
        />
      </ModalSheet>
    )
  }

  if (step === 'add') {
    return (
      <ModalSheet
        title={editingId ? 'Edit Emergency contact' : 'Add Emergency contact'}
        onBack={() => setStep('list')}
        footer={
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSaving}
            className={`w-full rounded-2xl py-4 text-[16px] font-semibold text-white transition ${
              canSubmit && !isSaving ? 'bg-purple-700 active:scale-[0.98]' : 'bg-purple-300'
            }`}
          >
            {isSaving ? 'Saving…' : editingId ? 'Update Contact' : 'Add Contact'}
          </button>
        }
      >
        <p className="mt-1 mb-6 text-[15px] text-gray-500">
          Fill in the information below to add contact
        </p>

        {saveError && (
          <div className="flex items-center gap-2 px-4 py-3 mb-4 text-red-600 bg-red-50 rounded-2xl">
            <AlertCircle size={16} className="shrink-0" />
            <p className="text-[13px]">
              {saveError instanceof Error ? saveError.message : 'Could not save contact.'}
            </p>
          </div>
        )}

        <Field label="Full Name">
          <input
            autoFocus
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            className={IOS_SAFE_INPUT_BORDER}
          />
        </Field>

        <Field label="Phone Number">
          <input
            value={form.phoneNumber}
            onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
            placeholder="Enter Mobile Number"
            className={IOS_SAFE_INPUT}
          />
        </Field>

        <Field label="Email (optional)">
          <input
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Enter contact email address"
            className={IOS_SAFE_INPUT}
          />
        </Field>

        <p className="mb-2.5 mt-5 text-[15px] font-medium text-gray-800">Gender</p>
        <div className="flex gap-2.5">
          {(['Male', 'Female', 'Others'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setForm((f) => ({ ...f, gender: g }))}
              className={`flex-1 rounded-full py-2.5 text-[14px] font-semibold transition ${
                form.gender === g ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <p className="mb-2.5 mt-5 text-[15px] font-medium text-gray-800">Relationship</p>
        <select
          value={form.relationship}
          onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
          className={`${IOS_SAFE_INPUT} appearance-none`}
        >
          <option value="">Select</option>
          {RELATIONSHIPS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <div className="flex items-center justify-between px-4 py-4 mt-5 bg-gray-100 rounded-2xl">
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-gray-900">Set as primary contact</p>
            <p className="text-[13px] text-gray-400">Contacted first in an emergency</p>
          </div>
          <Toggle
            checked={!!form.isPrimary}
            onChange={(v) => setForm((f) => ({ ...f, isPrimary: v }))}
          />
        </div>
      </ModalSheet>
    )
  }

  // list step
  return (
    <ModalSheet
      title="Emergency Contact"
      onClose={onClose}
      footer={
        <button
          onClick={startAdd}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-700 py-4 text-[16px] font-semibold text-white transition active:scale-[0.98]"
        >
          <Plus size={18} /> Add Emergency Contact
        </button>
      }
    >
      {isError && (
        <div className="flex flex-col items-center px-2 pt-10 pb-10 text-center">
          <AlertCircle size={36} className="mb-3 text-red-400" />
          <p className="text-[15px] text-gray-500">
            {error instanceof Error ? error.message : 'Could not load your emergency contacts.'}
          </p>
        </div>
      )}

      {!isError && isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      )}

      {!isError && !isLoading && (contacts?.length ?? 0) === 0 && (
        <div className="flex flex-col items-center px-2 pt-10 pb-10 text-center">
          <div className="relative flex items-center justify-center mb-8 h-36 w-36">
            <div className="absolute w-32 h-24 rounded-full bg-gray-50" />
            <span className="absolute text-lg text-gray-300 -left-1 top-4">✦</span>
            <span className="absolute right-0 text-2xl text-gray-300 top-8">✦</span>
            <Users size={56} className="relative text-gray-300" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No Emergency Contacts Added</h3>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-400">
            Add trusted contacts so they're easy to reach when you need them. You can add family
            members, close friends, or anyone you'd like to contact quickly when needed.
          </p>
        </div>
      )}

      {!isError && !isLoading && (contacts?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-3">
          {contacts!.map((c) => (
            <div key={c.id} className="p-4 rounded-3xl bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-purple-700 text-[15px] font-bold text-white">
                  {initials(c.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[17px] font-bold text-gray-900 truncate">{c.fullName}</p>
                    {c.isPrimary && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700 shrink-0">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-[14px] text-gray-400">{c.relationship || 'Contact'}</p>
                </div>
              </div>

              <div className="flex gap-6 mt-4">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-gray-800">Phone Number</p>
                  <p className="text-[14px] text-gray-500 truncate">{c.phoneNumber || '—'}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-gray-800">Email</p>
                  <p className="text-[14px] text-gray-500 truncate">{c.email || '—'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {!c.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary.mutate(c.id)}
                    disabled={setPrimary.isPending}
                    className="flex-1 rounded-2xl bg-gray-100 py-3 text-[13px] font-semibold text-gray-700 touch-manipulation disabled:opacity-60"
                  >
                    Make Primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-purple-700 py-3 text-[13px] font-semibold text-white touch-manipulation active:bg-purple-800"
                >
                  <Pencil size={14} className="shrink-0" /> Update
                </button>
                <button
                  type="button"
                  onClick={() => deleteContact.mutate(c.id)}
                  disabled={deleteContact.isPending}
                  className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-red-50 py-3 text-[13px] font-semibold text-red-500 touch-manipulation active:bg-red-100 disabled:opacity-60"
                >
                  <Trash2 size={14} className="shrink-0" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalSheet>
  )
}

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('') || '?'
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-[15px] font-medium text-gray-800">{label}</p>
      {children}
    </div>
  )
}


interface PrivacyModalProps {
  onClose: () => void
  // Called after the account has been permanently deleted, so the parent
  // can navigate away and clear any remaining local state.
  onAccountDeleted?: () => void
}

type PrivacyStep = 'main' | 'password' | 'password-success' | 'terms' | 'delete'

export function PrivacyModal({ onClose, onAccountDeleted }: PrivacyModalProps) {
  const [step, setStep] = useState<PrivacyStep>('main')
  const [locationEnabled, setLocationEnabled] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [retypePassword, setRetypePassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showRetype, setShowRetype] = useState(false)

  const updatePasswordMutation = useUpdatePassword()
  const deleteAccountMutation = useDeleteAccount()

  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token')

  const handleDeleteAccount = () => {
    // Guard rail: the delete request itself also requires a valid token
    // (deleteUserAccount throws without one), but we check here too so we
    // can show a clear message instead of a raw request error.
    if (!isLoggedIn) return

    deleteAccountMutation.mutate(undefined, {
      onSuccess: () => {
        onAccountDeleted?.()
        onClose()
      },
    })
  }

  const canUpdatePassword =
    currentPassword !== '' && newPassword !== '' && newPassword === retypePassword

  const resetPasswordFields = () => {
    setCurrentPassword('')
    setNewPassword('')
    setRetypePassword('')
  }

  const handleUpdatePassword = () => {
    if (!canUpdatePassword) return

    updatePasswordMutation.mutate(
      {
        password: newPassword,
        confirmPassword: retypePassword,
      },
      {
        onSuccess: () => setStep('password-success'),
      }
    )
  }

  if (step === 'password-success') {
    return (
      <ModalSheet title="Privacy" onClose={onClose}>
        <SuccessScreen
          title="Password Updated Successfully"
          description="Your password has been updated successfully. You can now sign in using your new password."
          onPrimary={() => {
            resetPasswordFields()
            setStep('main')
          }}
          secondaryLabel="Sign In"
          onSecondary={onClose}
        />
      </ModalSheet>
    )
  }

  if (step === 'password') {
    return (
      <ModalSheet
        title="Create new password"
        onBack={() => setStep('main')}
        footer={
          <button
            onClick={handleUpdatePassword}
            disabled={!canUpdatePassword || updatePasswordMutation.isPending}
            className={`w-full rounded-2xl py-4 text-[16px] font-semibold text-white transition ${
              canUpdatePassword && !updatePasswordMutation.isPending
                ? 'bg-purple-700 active:scale-[0.98]'
                : 'bg-purple-300'
            }`}
          >
            {updatePasswordMutation.isPending ? 'Updating…' : 'Update Password'}
          </button>
        }
      >
        <p className="mt-1 mb-6 text-[15px] text-gray-500">
          Create a strong password to protect your account and keep your information safe.
        </p>

        {updatePasswordMutation.isError && (
          <div className="flex items-center gap-2 px-4 py-3 mb-4 text-red-600 bg-red-50 rounded-2xl">
            <AlertCircle size={16} className="shrink-0" />
            <p className="text-[13px]">
              {updatePasswordMutation.error instanceof Error
                ? updatePasswordMutation.error.message
                : 'Could not update password.'}
            </p>
          </div>
        )}

        <PasswordField
          label="Current Password"
          placeholder="Current password"
          value={currentPassword}
          onChange={setCurrentPassword}
          visible={showCurrent}
          onToggleVisible={() => setShowCurrent((v) => !v)}
        />
        <PasswordField
          label="Enter New Password"
          placeholder="Enter New password"
          value={newPassword}
          onChange={setNewPassword}
          visible={showNew}
          onToggleVisible={() => setShowNew((v) => !v)}
        />
        <PasswordField
          label="Re-type Password"
          placeholder="Re-type password"
          value={retypePassword}
          onChange={setRetypePassword}
          visible={showRetype}
          onToggleVisible={() => setShowRetype((v) => !v)}
        />
        {newPassword !== '' && retypePassword !== '' && newPassword !== retypePassword && (
          <p className="-mt-3 mb-4 text-[13px] text-red-500">Passwords don't match</p>
        )}
      </ModalSheet>
    )
  }

  if (step === 'terms') {
    return (
      <ModalSheet title="Terms & privacy" onBack={() => setStep('main')}>
        <h3 className="mb-2 text-xl font-extrabold text-gray-900">Introduction</h3>
        <p className="mb-5 text-[15px] leading-relaxed text-gray-500">
          This section explains how we collect, use, and protect the information you share with
          us. Using the app means you agree to the practices described here, and we'll always aim
          to keep this policy easy to understand.
        </p>
        <h3 className="mb-2 text-xl font-extrabold text-gray-900">Where does it come from?</h3>
        <p className="text-[15px] leading-relaxed text-gray-500">
          Most of what we collect comes directly from you — your profile details, the reports you
          submit, and the permissions you grant, like location access. We only use it to keep the
          app useful and drivers around you safer.
        </p>
      </ModalSheet>
    )
  }

  if (step === 'delete') {
    return (
      <DeleteAccountConfirm
        isLoggedIn={isLoggedIn}
        isDeleting={deleteAccountMutation.isPending}
        errorMessage={
          deleteAccountMutation.isError
            ? deleteAccountMutation.error instanceof Error
              ? deleteAccountMutation.error.message
              : 'Could not delete account.'
            : null
        }
        onConfirm={handleDeleteAccount}
        onCancel={() => setStep('main')}
      />
    )
  }

  // main step
  return (
    <ModalSheet title="Privacy" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-4 py-4 bg-gray-100 rounded-2xl">
          <div className="flex items-center min-w-0 gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full shrink-0">
              <MapPin size={18} className="text-purple-700" />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-gray-900">Location</p>
              <p className="text-[13px] text-gray-400">Allow location service</p>
            </div>
          </div>
          <Toggle checked={locationEnabled} onChange={setLocationEnabled} />
        </div>

        <button
          onClick={() => setStep('password')}
          className="flex items-center justify-between px-4 py-4 text-left bg-gray-100 rounded-2xl"
        >
          <div className="flex items-center min-w-0 gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full shrink-0">
              <Lock size={18} className="text-purple-700" />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-gray-900">Security Settings</p>
              <p className="text-[13px] text-gray-400">Change account password</p>
            </div>
          </div>
          <span className="text-gray-300 shrink-0">›</span>
        </button>

        <button
          onClick={() => setStep('terms')}
          className="flex items-center justify-between px-4 py-4 text-left bg-gray-100 rounded-2xl"
        >
          <div className="flex items-center min-w-0 gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full shrink-0">
              <FileText size={18} className="text-purple-700" />
            </div>
            <p className="text-[15px] font-semibold text-gray-900">Terms & privacy</p>
          </div>
          <span className="text-gray-300 shrink-0">›</span>
        </button>

        <button
          onClick={() => setStep('delete')}
          className="flex items-center gap-3 px-4 py-4 text-left bg-gray-100 rounded-2xl"
        >
          <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full shrink-0">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <p className="text-[15px] font-semibold text-red-500">Delete account</p>
        </button>
      </div>
    </ModalSheet>
  )
}

// ============================================================
// Delete account confirmation
// ============================================================

function DeleteAccountConfirm({
  isLoggedIn,
  isDeleting,
  errorMessage,
  onConfirm,
  onCancel,
}: {
  isLoggedIn: boolean
  isDeleting: boolean
  errorMessage: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm p-6 text-center bg-white shadow-2xl rounded-3xl sm:p-8">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 bg-red-100 rounded-full">
          <Trash2 size={28} className="text-red-500" />
        </div>

        {!isLoggedIn ? (
          <>
            <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Please sign in first</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
              You must be logged in to your account before we can delete it. Please sign in and
              try again.
            </p>
            <div className="flex flex-col gap-3 mt-7">
              <button
                onClick={onCancel}
                className="w-full rounded-2xl bg-gray-100 py-3.5 text-[15px] font-semibold text-gray-700 transition active:scale-[0.98]"
              >
                Okay
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
              Are you sure you want to delete account?
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
              By proceeding, you will permanently lose access to your account and all associated
              data
            </p>

            {errorMessage && (
              <div className="flex items-center gap-2 px-4 py-3 mt-4 text-left text-red-600 bg-red-50 rounded-2xl">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-[13px]">{errorMessage}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 mt-7">
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className={`w-full rounded-2xl py-3.5 text-[15px] font-semibold text-white transition ${
                  isDeleting ? 'bg-red-300' : 'bg-red-600 active:scale-[0.98]'
                }`}
              >
                {isDeleting ? 'Deleting…' : 'Delete account'}
              </button>
              <button
                onClick={onCancel}
                disabled={isDeleting}
                className="w-full py-1 text-[15px] font-semibold text-gray-500"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  visible,
  onToggleVisible,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  visible: boolean
  onToggleVisible: () => void
}) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-[15px] font-medium text-gray-800">{label}</p>
      <div className="flex items-center rounded-2xl bg-gray-100 px-4 py-3.5">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-base text-gray-800 bg-transparent placeholder:text-gray-400 focus:outline-none"
        />
        <button onClick={onToggleVisible} className="ml-2 text-gray-400 shrink-0">
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )
}



interface FleetModalProps {
  onClose: () => void
}

export function FleetModal({ onClose }: FleetModalProps) {
  const { data: fleet, isLoading, isError, error } = useFleet()

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`
  }

  const handleMessage = (phone: string) => {
    window.location.href = `sms:${phone.replace(/\s+/g, '')}`
  }

  if (isError) {
    return (
      <ModalSheet title="My Fleet" onClose={onClose}>
        <div className="flex flex-col items-center px-2 pt-10 pb-10 text-center">
          <AlertCircle size={36} className="mb-3 text-red-400" />
          <p className="text-[15px] text-gray-500">
            {error instanceof Error ? error.message : 'Could not load your fleet details.'}
          </p>
        </div>
      </ModalSheet>
    )
  }

  return (
    <ModalSheet title="My Fleet" onClose={onClose}>
      <p className="mt-1 mb-6 text-[15px] text-gray-500">
        View the fleet, vehicle, and Fleet Manager assigned to you.
      </p>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <div className="h-24 bg-gray-100 rounded-3xl animate-pulse" />
          <div className="bg-gray-100 h-14 animate-pulse rounded-2xl" />
          <div className="h-24 bg-gray-100 rounded-3xl animate-pulse" />
        </div>
      ) : fleet ? (
        <>
          {/* Company card */}
          <div className="flex items-center justify-between p-4 rounded-3xl bg-gradient-to-br from-purple-950 to-purple-900">
            <div className="flex items-center min-w-0 gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 shrink-0">
                <Building2 size={22} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-wide text-purple-300">COMPANY</p>
                <p className="text-[17px] font-extrabold text-white truncate">{fleet.companyName}</p>
                <p className="text-[13px] text-purple-300">{fleet.companyCode}</p>
              </div>
            </div>
            <span className="rounded-full bg-purple-700 px-3 py-1.5 text-[12px] font-semibold text-white whitespace-nowrap shrink-0">
              {fleet.tier}
            </span>
          </div>

          {/* Sub-fleet */}
          <div className="mt-6">
            <p className="mb-2 text-[12px] font-semibold tracking-wide text-gray-400">SUB-FLEET</p>
            <div className="flex items-center justify-between px-4 py-4 bg-gray-100 rounded-2xl">
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-gray-900 truncate">{fleet.subFleet.name}</p>
                <p className="flex items-center gap-1 text-[13px] text-gray-400">
                  <MapPin size={13} /> <span className="truncate">{fleet.subFleet.location}</span>
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[12px] font-semibold shrink-0 ${
                  fleet.subFleet.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {fleet.subFleet.status}
              </span>
            </div>
          </div>

          {/* Managers */}
          <div className="mt-6">
            <p className="mb-2 text-[12px] font-semibold tracking-wide text-gray-400">MANAGERS</p>
            <div className="flex flex-col gap-3">
              {fleet.managers.map((m) => (
                <ManagerCard
                  key={m.id}
                  manager={m}
                  onCall={() => handleCall(m.phoneNumber)}
                  onMessage={() => handleMessage(m.phoneNumber)}
                />
              ))}
            </div>
          </div>

          {/* Assigned vehicle */}
          <div className="mt-6">
            <p className="mb-2 text-[12px] font-semibold tracking-wide text-gray-400">
              ASSIGNED VEHICLE
            </p>
            <div className="p-4 rounded-3xl bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 gap-3">
                  <div className="flex items-center justify-center bg-purple-100 w-11 h-11 rounded-2xl shrink-0">
                    <Car size={20} className="text-purple-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-gray-900 truncate">{fleet.vehicle.name}</p>
                    <p className="text-[13px] text-gray-400 truncate">
                      {fleet.vehicle.type} · {fleet.vehicle.vehicleCode}
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-[12px] font-semibold text-purple-700 shrink-0">
                  <ShieldCheck size={13} /> {fleet.vehicle.plateNumber}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <VehicleStat
                  icon={<Activity size={15} />}
                  label="TRIPS"
                  value={fleet.vehicle.trips.toLocaleString()}
                />
                <VehicleStat
                  icon={<MapPin size={15} />}
                  label="KILOMETER"
                  value={`${fleet.vehicle.kilometers.toLocaleString()} km`}
                />
                <VehicleStat
                  icon={<Wrench size={15} />}
                  label="LAST SERVICE"
                  value={fleet.vehicle.lastServiceDate}
                />
                <VehicleStat
                  icon={<Calendar size={15} />}
                  label="NEXT SERVICE"
                  value={fleet.vehicle.nextServiceDate}
                />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </ModalSheet>
  )
}

function ManagerCard({
  manager,
  onCall,
  onMessage,
}: {
  manager: FleetManager
  onCall: () => void
  onMessage: () => void
}) {
  const managerInitials = manager.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')

  return (
    <div className="p-4 rounded-3xl bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex items-center min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-700 text-[14px] font-bold text-white">
            {managerInitials}
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-gray-900 truncate">{manager.fullName}</p>
            <p className="text-[13px] text-gray-400 truncate">{manager.role}</p>
          </div>
        </div>
        <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-semibold text-purple-700 whitespace-nowrap shrink-0">
          {manager.badge}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 mt-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[13px] text-gray-500">
            <Phone size={13} className="shrink-0" />{' '}
            <span className="truncate">{manager.phoneNumber}</span>
          </p>
          <p className="flex items-center gap-1.5 mt-1 text-[13px] text-gray-500">
            <Mail size={13} className="shrink-0" />{' '}
            <span className="truncate">{manager.email}</span>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onCall}
            className="flex items-center justify-center text-purple-700 bg-purple-100 w-9 h-9 rounded-xl"
            aria-label={`Call ${manager.fullName}`}
          >
            <Phone size={15} />
          </button>
          <button
            onClick={onMessage}
            className="flex items-center justify-center text-purple-700 bg-purple-100 w-9 h-9 rounded-xl"
            aria-label={`Message ${manager.fullName}`}
          >
            <MessageCircle size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

function VehicleStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-gray-400">
        {icon} {label}
      </p>
      <p className="mt-1 text-[15px] font-bold text-gray-900 truncate">{value}</p>
    </div>
  )
}









