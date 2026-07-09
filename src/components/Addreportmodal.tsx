import { useRef, useState } from 'react'
import { X, Camera, MapPin, Check } from 'lucide-react'

// ---------- Types ----------

export type HazardType =
  | 'Pothole'
  | 'Flood'
  | 'Accident'
  | 'Debris'
  | 'Road'
  | 'Checkpoint'
  | 'Danger'
  | 'SOS'

export interface NewReportPayload {
  type: HazardType
  description: string
  photos: string[]
  location: string
}

interface AddReportModalProps {
  onClose: () => void
  onSubmit: (report: NewReportPayload) => void
}

const HAZARD_TYPES: { type: HazardType; emoji: string }[] = [
  { type: 'Pothole', emoji: '🕳️' },
  { type: 'Flood', emoji: '🌊' },
  { type: 'Accident', emoji: '🚧' },
  { type: 'Debris', emoji: '🪨' },
  { type: 'Road', emoji: '🚜' },
  { type: 'Checkpoint', emoji: '🛂' },
  { type: 'Danger', emoji: '⚠️' },
  { type: 'SOS', emoji: '🆘' },
]

type Step = 'form' | 'success'

export default function AddReportModal({ onClose, onSubmit }: AddReportModalProps) {
  const [step, setStep] = useState<Step>('form')
  const [hazardType, setHazardType] = useState<HazardType | null>(null)
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canSubmit = hazardType !== null

  const resetForm = () => {
    setHazardType(null)
    setDescription('')
    setPhotos([])
    setLocation('')
  }

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const urls = Array.from(files)
      .slice(0, 4 - photos.length)
      .map((file) => URL.createObjectURL(file))
    setPhotos((prev) => [...prev, ...urls].slice(0, 4))
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocation('Current location')
      return
    }
    navigator.geolocation.getCurrentPosition(
      () => setLocation('Current location'),
      () => setLocation('Current location'),
    )
  }

  const handleSubmit = () => {
    if (!hazardType) return
    onSubmit({ type: hazardType, description, photos, location })
    setStep('success')
  }

  const handleReportAnother = () => {
    resetForm()
    setStep('form')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="relative flex h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        {step === 'form' ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-2xl font-extrabold text-gray-900">Add Report</h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 text-gray-500 bg-gray-100 rounded-full"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 px-6 pb-6 overflow-y-auto">
              {/* Hazard type */}
              <p className="mb-2.5 text-[15px] font-medium text-gray-500">Hazard type</p>
              <div className="grid grid-cols-3 gap-2.5">
                {HAZARD_TYPES.map(({ type, emoji }) => {
                  const selected = hazardType === type
                  return (
                    <button
                      key={type}
                      onClick={() => setHazardType(type)}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border py-3.5 transition ${
                        selected
                          ? 'border-purple-700 bg-purple-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <span className="text-2xl">{emoji}</span>
                      <span
                        className={`text-[13px] font-medium ${
                          selected ? 'text-purple-700' : 'text-gray-600'
                        }`}
                      >
                        {type}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Description */}
              <p className="mb-2.5 mt-6 text-[15px] font-medium text-gray-500">Description</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's happening on the road?"
                rows={4}
                className="w-full resize-none rounded-2xl bg-gray-100 px-4 py-3.5 text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none"
              />

              {/* Photo */}
              <p className="mb-2.5 mt-6 text-[15px] font-medium text-gray-500">Photo</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-full gap-2 py-8 border-2 border-gray-300 border-dashed rounded-2xl bg-gray-50"
                disabled={photos.length >= 4}
              >
                <Camera size={22} className="text-gray-400" />
                <span className="text-[15px] text-gray-400">Tap to capture or upload</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoPick}
              />

              {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {photos.map((src, i) => (
                    <div key={src} className="relative overflow-hidden aspect-square rounded-xl">
                      <img src={src} alt="" className="object-cover w-full h-full" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute flex items-center justify-center w-5 h-5 text-white bg-red-500 rounded-full -right-1 -top-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Location */}
              <div className="mb-2.5 mt-6 flex items-center gap-1.5 text-[15px] font-medium text-gray-800">
                <MapPin size={16} className="text-emerald-600" />
                Location
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3.5">
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Search a place or Address"
                  className="flex-1 bg-transparent text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none"
                />
                <button
                  onClick={useMyLocation}
                  className="shrink-0 text-[14px] font-semibold text-purple-700"
                >
                  Use my location
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-full rounded-2xl py-4 text-[16px] font-semibold text-white transition ${
                  canSubmit ? 'bg-purple-700 active:scale-[0.98]' : 'bg-purple-300'
                }`}
              >
                Submit report
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-between h-full px-8 text-center bg-emerald-700 py-14">
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="flex items-center justify-center rounded-full shadow-lg h-28 w-28 bg-emerald-500">
                <Check size={56} className="text-white" strokeWidth={3} />
              </div>
              <h2 className="mt-8 text-3xl font-extrabold text-white">Report submitted</h2>
              <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-emerald-100">
                Thanks for keeping the road safer. Your report is now visible to nearby drivers.
              </p>
            </div>

            <div className="w-full">
              <button
                onClick={onClose}
                className="w-full rounded-2xl bg-white py-4 text-[16px] font-semibold text-emerald-700"
              >
                Done
              </button>
              <button
                onClick={handleReportAnother}
                className="mt-4 text-[15px] font-medium text-emerald-100"
              >
                Report Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}