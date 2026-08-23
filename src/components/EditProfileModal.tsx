

import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Camera, User as UserIcon, Calendar, AlertCircle } from 'lucide-react'
import { ModalSheet, SuccessScreen } from './Profileui'
import { useProfile, useUpdateProfile } from '../hooks/useProfile'
import type { UpdateProfileInput } from '../api/profile'

interface EditProfileModalProps {
  onClose: () => void
}

type Step = 'form' | 'success'

const GENDERS = ['Male', 'Female', 'Others'] as const

const emptyForm: UpdateProfileInput = {
  firstName: '',
  lastName: '',
  gender: 'Male',
  dateOfBirth: '',
  occupation: '',
  address: '',
}

export default function EditProfileModal({ onClose }: EditProfileModalProps) {
  const { data: user } = useProfile()
  const updateProfile = useUpdateProfile()

  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState<UpdateProfileInput>(emptyForm)

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        gender: user.gender ?? 'Male',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        occupation: user.occupation ?? '',
        address: user.driverProfile?.address ?? '',
      })
    }
  }, [user])

  const canSubmit =
    form.firstName.trim() !== '' &&
    form.lastName.trim() !== '' &&
    form.dateOfBirth.trim() !== ''

  const handleSubmit = () => {
    if (!canSubmit) return
    updateProfile.mutate(form, {
      onSuccess: () => setStep('success'),
    })
  }

  if (step === 'success') {
    return (
      <SuccessScreen
        title="Profile Updated Successfully"
        description="Your personal information has been updated successfully."
        onPrimary={onClose}
      />
    )
  }

  return (
    <ModalSheet
      title="Edit Personal Information"
      onClose={onClose}
      footer={
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || updateProfile.isPending}
          className={`w-full rounded-2xl py-3 text-base font-semibold text-white transition ${
            canSubmit && !updateProfile.isPending
              ? 'bg-purple-700 active:scale-[0.98]'
              : 'bg-purple-300'
          }`}
        >
          {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      }
    >
      {updateProfile.isError && (
        <div className="flex items-center gap-2 px-4 py-3 mb-3 text-red-600 bg-red-50 rounded-2xl">
          <AlertCircle size={16} className="shrink-0" />
          <p className="text-[13px]">
            {updateProfile.error instanceof Error
              ? updateProfile.error.message
              : 'Could not update profile.'}
          </p>
        </div>
      )}

      {/* Avatar */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <div className="flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full sm:w-24 sm:h-24">
            <UserIcon size={32} className="text-gray-400 sm:size-10" />
          </div>
          <button
            type="button"
            className="absolute bottom-0 right-0 flex items-center justify-center w-8 h-8 text-white bg-purple-700 rounded-full sm:w-9 sm:h-9 disabled:opacity-60"
            aria-label="Change photo"
            disabled
            title="Photo upload coming soon"
          >
            <Camera size={14} className="sm:size-4" />
          </button>
        </div>
      </div>

      <Field label="First Name">
        <input
          autoFocus
          value={form.firstName}
          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
          placeholder="Enter your First Name"
          className="w-full rounded-2xl border-2 border-purple-200 bg-white px-4 py-3 text-base text-gray-800 focus:border-purple-500 focus:outline-none"
        />
      </Field>

      <Field label="Last Name">
        <input
          value={form.lastName}
          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
          placeholder="Enter your Last Name"
          className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-base text-gray-800 placeholder:text-gray-400 focus:outline-none"
        />
      </Field>

      <p className="mb-2 text-base font-medium text-gray-800">Gender</p>
      <div className="flex gap-2 mb-4">
        {GENDERS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setForm((f) => ({ ...f, gender: g }))}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              form.gender === g
                ? 'bg-purple-700 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <Field label="Date of Birth">
        <div className="relative">
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
            max={new Date().toISOString().split('T')[0]}
            className="w-full rounded-2xl bg-gray-100 px-4 py-3 pr-10 text-base text-gray-800 focus:outline-none [&::-webkit-calendar-picker-indicator]:opacity-0"
          />
          <Calendar
            size={18}
            className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-4 top-1/2"
          />
        </div>
      </Field>

      <Field label="Occupation">
        <input
          value={form.occupation}
          onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))}
          placeholder="Enter your Occupation"
          className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-base text-gray-800 placeholder:text-gray-400 focus:outline-none"
        />
      </Field>

      <Field label="Address">
        <input
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          placeholder="Enter your Address"
          className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-base text-gray-800 placeholder:text-gray-400 focus:outline-none"
        />
      </Field>

      {/* Extra bottom space so the last field scrolls clear of the home indicator / scrollbar */}
      <div className="h-8" />
    </ModalSheet>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 text-base font-medium text-gray-800">{label}</p>
      {children}
    </div>
  )
}