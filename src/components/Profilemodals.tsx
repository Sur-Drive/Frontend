import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Smartphone,
  Mail,
  MessageSquare,
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
} from 'lucide-react'
import { ModalSheet, SuccessScreen, Toggle } from './Profileui'
import { useNotificationPreferences, useUpdateNotificationPreferences } from '../hooks/useNotifications'
import type { NotificationPreferences } from '../hooks/useNotifications'
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

  const toggle = (key: keyof Pick<NotificationPreferences, 'push' | 'email' | 'sms'>) => {
    if (!preferences) return
    updatePreferences({ [key]: !preferences[key] })
  }

  const toggleHazardType = (type: string) => {
    if (!preferences) return
    const current = preferences.hazardTypes ?? []
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
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
        <div className="flex flex-col items-center px-2 pt-10 text-center">
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
        <div className="flex flex-col items-center px-2 pt-10 text-center">
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
      <div className="flex flex-col gap-3">
        <ToggleRow
          icon={<Smartphone size={18} className="text-purple-700" />}
          title="Push Notification"
          subtitle="Updates & promos"
          loading={isLoading}
        >
          <Toggle
            checked={preferences?.push ?? false}
            onChange={() => toggle('push')}
            disabled={isLoading || isPending}
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
                  className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
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
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
          {icon}
        </div>
        <div>
          <p className="text-[15px] font-semibold text-gray-900">{title}</p>
          <p className="text-[13px] text-gray-400">{subtitle}</p>
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
      <SuccessScreen
        title="Emergency Contact Added Successfully"
        description="Your emergency contact has been added successfully, and they can now be reached quickly in case of an emergency."
        onPrimary={() => setStep('list')}
        secondaryLabel="Add Another Contact"
        onSecondary={startAdd}
      />
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
            className="w-full rounded-2xl border-2 border-purple-200 bg-white px-4 py-3.5 text-[15px] text-gray-800 focus:border-purple-500 focus:outline-none"
          />
        </Field>

        <Field label="Phone Number">
          <input
            value={form.phoneNumber}
            onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
            placeholder="Enter Mobile Number"
            className="w-full rounded-2xl bg-gray-100 px-4 py-3.5 text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none"
          />
        </Field>

        <Field label="Email (optional)">
          <input
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Enter contact email address"
            className="w-full rounded-2xl bg-gray-100 px-4 py-3.5 text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none"
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
          className="w-full appearance-none rounded-2xl bg-gray-100 px-4 py-3.5 text-[15px] text-gray-500 focus:outline-none"
        >
          <option value="">Select</option>
          {RELATIONSHIPS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <div className="flex items-center justify-between px-4 py-4 mt-5 bg-gray-100 rounded-2xl">
          <div>
            <p className="text-[15px] font-medium text-gray-800">Set as primary contact</p>
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
        <div className="flex flex-col items-center px-2 pt-10 text-center">
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
        <div className="flex flex-col items-center px-2 pt-10 text-center">
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
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[17px] font-bold text-gray-900">{c.fullName}</p>
                    {c.isPrimary && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-[14px] text-gray-400">{c.relationship || 'Contact'}</p>
                </div>
              </div>

              <div className="flex gap-6 mt-4">
                <div>
                  <p className="text-[13px] font-semibold text-gray-800">Phone Number</p>
                  <p className="text-[14px] text-gray-500">{c.phoneNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-800">Email</p>
                  <p className="text-[14px] text-gray-500">{c.email || '—'}</p>
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

// ============================================================
// Privacy
// ============================================================

interface PrivacyModalProps {
  onClose: () => void
}

type PrivacyStep = 'main' | 'password' | 'password-success' | 'terms'

export function PrivacyModal({ onClose }: PrivacyModalProps) {
  const [step, setStep] = useState<PrivacyStep>('main')
  const [locationEnabled, setLocationEnabled] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [retypePassword, setRetypePassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showRetype, setShowRetype] = useState(false)

  const updatePasswordMutation = useUpdatePassword()

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

  // main step
  return (
    <ModalSheet title="Privacy" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-4 py-4 bg-gray-100 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
              <MapPin size={18} className="text-purple-700" />
            </div>
            <div>
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
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
              <Lock size={18} className="text-purple-700" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-gray-900">Security Settings</p>
              <p className="text-[13px] text-gray-400">Change account password</p>
            </div>
          </div>
          <span className="text-gray-300">›</span>
        </button>

        <button
          onClick={() => setStep('terms')}
          className="flex items-center justify-between px-4 py-4 text-left bg-gray-100 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
              <FileText size={18} className="text-purple-700" />
            </div>
            <p className="text-[15px] font-semibold text-gray-900">Terms & privacy</p>
          </div>
          <span className="text-gray-300">›</span>
        </button>
      </div>
    </ModalSheet>
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
          className="flex-1 bg-transparent text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none"
        />
        <button onClick={onToggleVisible} className="text-gray-400">
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )
}