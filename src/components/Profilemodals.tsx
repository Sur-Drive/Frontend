
import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Smartphone,
  Mail,
  Plus,
  Users,
  Pencil,
  Trash2,
  MapPin,
  Lock,
  FileText,
  Eye,
  EyeOff,
} from 'lucide-react'
import { ModalSheet, SuccessScreen, Toggle } from './Profileui'

// ============================================================
// Notifications
// ============================================================

interface NotificationsModalProps {
  onClose: () => void
}

export function NotificationsModal({ onClose }: NotificationsModalProps) {
  const [push, setPush] = useState(true)
  const [email, setEmail] = useState(false)

  return (
    <ModalSheet title="Notifications Settings" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <ToggleRow
          icon={<Smartphone size={18} className="text-purple-700" />}
          title="Push Notification"
          subtitle="Updates & promos"
        >
          <Toggle checked={push} onChange={setPush} />
        </ToggleRow>
        <ToggleRow
          icon={<Mail size={18} className="text-purple-700" />}
          title="Email Notification"
          subtitle="Updates & promos"
        >
          <Toggle checked={email} onChange={setEmail} />
        </ToggleRow>
      </div>
    </ModalSheet>
  )
}

function ToggleRow({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  children: ReactNode
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
      {children}
    </div>
  )
}

// ============================================================
// Emergency Contact
// ============================================================

export interface EmergencyContact {
  id: string
  name: string
  phone: string
  email: string
  gender: 'Male' | 'Female' | 'Others'
  relationship: string
}

interface EmergencyContactModalProps {
  onClose: () => void
}

type ContactStep = 'list' | 'add' | 'success'

const RELATIONSHIPS = ['Parent', 'Sibling', 'Spouse', 'Child', 'Friend', 'Colleague', 'Other']

// FIX: Remove 'as const' and properly type the form
type ContactForm = Omit<EmergencyContact, 'id'>

const emptyForm: ContactForm = {
  name: '',
  phone: '',
  email: '',
  gender: 'Male',
  relationship: '',
}

export function EmergencyContactModal({ onClose }: EmergencyContactModalProps) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [step, setStep] = useState<ContactStep>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ContactForm>(emptyForm)

  const startAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setStep('add')
  }

  const startEdit = (contact: EmergencyContact) => {
    setEditingId(contact.id)
    setForm({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      gender: contact.gender,
      relationship: contact.relationship,
    })
    setStep('add')
  }

  const removeContact = (id: string) => setContacts((prev) => prev.filter((c) => c.id !== id))

  const canSubmit = form.name.trim() !== '' && form.phone.trim() !== ''

  const handleSubmit = () => {
    if (!canSubmit) return
    if (editingId) {
      setContacts((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...form } : c)))
    } else {
      setContacts((prev) => [...prev, { id: crypto.randomUUID(), ...form }])
    }
    setStep('success')
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
            disabled={!canSubmit}
            className={`w-full rounded-2xl py-4 text-[16px] font-semibold text-white transition ${
              canSubmit ? 'bg-purple-700 active:scale-[0.98]' : 'bg-purple-300'
            }`}
          >
            {editingId ? 'Update Contact' : 'Add Contact'}
          </button>
        }
      >
        <p className="mt-1 mb-6 text-[15px] text-gray-500">
          Fill in the information below to add contact
        </p>

        <Field label="Full Name">
          <input
            autoFocus
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-2xl border-2 border-purple-200 bg-white px-4 py-3.5 text-[15px] text-gray-800 focus:border-purple-500 focus:outline-none"
          />
        </Field>

        <Field label="Phone Number">
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
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
      {contacts.length === 0 ? (
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
      ) : (
        <div className="flex flex-col gap-3">
          {contacts.map((c) => (
            <div key={c.id} className="p-4 rounded-3xl bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-purple-700 text-[15px] font-bold text-white">
                  {initials(c.name)}
                </div>
                <div>
                  <p className="text-[17px] font-bold text-gray-900">{c.name}</p>
                  <p className="text-[14px] text-gray-400">{c.relationship || 'Contact'}</p>
                </div>
              </div>

              <div className="flex gap-6 mt-4">
                <div>
                  <p className="text-[13px] font-semibold text-gray-800">Phone Number</p>
                  <p className="text-[14px] text-gray-500">{c.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-800">Email</p>
                  <p className="text-[14px] text-gray-500">{c.email || '—'}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-purple-700 py-3 text-[13px] font-semibold text-white touch-manipulation active:bg-purple-800"
                >
                  <Pencil size={14} className="shrink-0" /> Update contact
                </button>
                <button
                  type="button"
                  onClick={() => removeContact(c.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-red-50 py-3 text-[13px] font-semibold text-red-500 touch-manipulation active:bg-red-100"
                >
                  <Trash2 size={14} className="shrink-0" /> Delete Contact
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

  const canUpdatePassword =
    currentPassword !== '' && newPassword !== '' && newPassword === retypePassword

  const resetPasswordFields = () => {
    setCurrentPassword('')
    setNewPassword('')
    setRetypePassword('')
  }

  const handleUpdatePassword = () => {
    if (!canUpdatePassword) return
    setStep('password-success')
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
            disabled={!canUpdatePassword}
            className={`w-full rounded-2xl py-4 text-[16px] font-semibold text-white transition ${
              canUpdatePassword ? 'bg-purple-700 active:scale-[0.98]' : 'bg-purple-300'
            }`}
          >
            Update Password
          </button>
        }
      >
        <p className="mt-1 mb-6 text-[15px] text-gray-500">
          Create a strong password to protect your account and keep your information safe.
        </p>

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