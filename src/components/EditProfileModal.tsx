

import { useState, useEffect, useRef } from 'react'
import type { ReactNode, ChangeEvent } from 'react'
import { Camera, User as UserIcon, Calendar, AlertCircle, Loader2 } from 'lucide-react'
import { ModalSheet, SuccessScreen } from './Profileui'
import { useProfile, useUpdateProfile, useUploadProfilePicture } from '../hooks/useProfile'
import type { UpdateProfileInput } from '../api/profile'

const MAX_PHOTO_SIDE = 1024 // px
const MAX_PHOTO_BYTES = 15 * 1024 * 1024 // reject absurdly large originals

// Phone photos are often 3–10 MB (or HEIC). Decode, downscale and re-encode
// as JPEG so the upload is small, fast on LTE, and in a format the server accepts.
async function shrinkImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not process that image.'))),
      'image/jpeg',
      0.85,
    ),
  )
}

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
  const uploadPhoto = useUploadProfilePicture()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoError, setPhotoError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const handlePhotoPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    console.log('[upload-photo] picked', file && {
      name: file.name,
      type: file.type,
      sizeKB: Math.round(file.size / 1024),
    })
    if (!file) return
    setPhotoError('')
    if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) {
      setPhotoError('Please choose an image file.')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('That photo is too large. Please choose a smaller one.')
      return
    }
    try {
      const blob = await shrinkImage(file)
      console.log('[upload-photo] resized', {
        type: blob.type,
        sizeKB: Math.round(blob.size / 1024),
      })
      setPreview(URL.createObjectURL(blob))
      const updated = await uploadPhoto.mutateAsync(blob)
      console.log('[upload-photo] success, profilePicture =', updated?.profilePicture)
    } catch (err) {
      console.error('[upload-photo] failed', err)
      setPreview(null)
      setPhotoError(err instanceof Error ? err.message : 'Photo upload failed. Try again.')
    }
  }

  const avatarSrc = preview ?? user?.profilePicture ?? null

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
          <div className="flex items-center justify-center w-20 h-20 overflow-hidden bg-gray-200 rounded-full sm:w-24 sm:h-24">
            {avatarSrc ? (
              <img src={avatarSrc} alt="Profile" className="object-cover w-full h-full" />
            ) : (
              <UserIcon size={32} className="text-gray-400 sm:size-10" />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoPick}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadPhoto.isPending}
            className="absolute bottom-0 right-0 flex items-center justify-center w-8 h-8 text-white bg-purple-700 rounded-full sm:w-9 sm:h-9 disabled:opacity-60"
            aria-label="Change photo"
          >
            {uploadPhoto.isPending ? (
              <Loader2 size={14} className="animate-spin sm:size-4" />
            ) : (
              <Camera size={14} className="sm:size-4" />
            )}
          </button>
        </div>
      </div>
      {photoError && (
        <p className="mb-3 -mt-2 text-center text-[13px] text-red-600">{photoError}</p>
      )}

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