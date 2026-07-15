
import { useRef, useState } from 'react'
import { X, Camera, MapPin, Check, Loader2, Navigation } from 'lucide-react'

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
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canSubmit = hazardType !== null

  const resetForm = () => {
    setHazardType(null)
    setDescription('')
    setPhotos([])
    setLocation('')
    setLocationError(null)
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

      setLocation(shortAddress)
    } catch (err) {
      setLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleUseMyLocation = () => {
    console.log('handleUseMyLocation clicked')
    setIsGettingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      console.log('Geolocation not supported')
      setLocationError('Geolocation not supported')
      setIsGettingLocation(false)
      return
    }

    console.log('Requesting geolocation...')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Position received:', position.coords)
        const { latitude, longitude } = position.coords
        reverseGeocode(latitude, longitude)
      },
      (error) => {
        console.log('Geolocation error:', error.code, error.message)
        let message = 'Unable to get location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permission denied. Enable location in settings.'
            break
          case error.POSITION_UNAVAILABLE:
            message = 'Location unavailable.'
            break
          case error.TIMEOUT:
            message = 'Request timed out.'
            break
        }
        setLocationError(message)
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
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
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40">
      <div className="relative flex h-[92dvh] sm:h-auto sm:max-h-[85vh] w-full sm:max-w-[420px] flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
        {step === 'form' ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
              <h2 className="text-xl font-extrabold text-gray-900 sm:text-2xl">Add Report</h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 text-gray-500 bg-gray-100 rounded-full"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 px-5 pb-5 overflow-y-auto sm:px-6 sm:pb-6">
              {/* Hazard type */}
              <p className="mb-2 text-sm sm:text-[15px] font-medium text-gray-500">Hazard type</p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-3 sm:gap-2.5">
                {HAZARD_TYPES.map(({ type, emoji }) => {
                  const selected = hazardType === type
                  return (
                    <button
                      key={type}
                      onClick={() => setHazardType(type)}
                      className={`flex flex-col items-center gap-1 rounded-xl sm:rounded-2xl border py-2.5 sm:py-3.5 transition ${
                        selected
                          ? 'border-purple-700 bg-purple-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <span className="text-xl sm:text-2xl">{emoji}</span>
                      <span
                        className={`text-[11px] sm:text-[13px] font-medium ${
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
              <p className="mb-2 mt-4 text-sm sm:text-[15px] font-medium text-gray-500 sm:mt-6">Description</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's happening?"
                rows={3}
                className="w-full resize-none rounded-xl sm:rounded-2xl bg-gray-100 px-3.5 sm:px-4 py-3 text-sm sm:text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none"
              />

              {/* Photo */}
              <p className="mb-2 mt-4 text-sm sm:text-[15px] font-medium text-gray-500 sm:mt-6">Photo</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-full gap-1.5 sm:gap-2 py-6 sm:py-8 border-2 border-gray-300 border-dashed rounded-xl sm:rounded-2xl bg-gray-50"
                disabled={photos.length >= 4}
              >
                <Camera size={20} className="sm:w-[22px] sm:h-[22px] text-gray-400" />
                <span className="text-sm sm:text-[15px] text-gray-400">Tap to upload</span>
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
                    <div key={src} className="relative overflow-hidden rounded-lg aspect-square sm:rounded-xl">
                      <img src={src} alt="" className="object-cover w-full h-full" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 text-white bg-red-500 rounded-full -right-0.5 -top-0.5 sm:-right-1 sm:-top-1"
                      >
                        <X size={10} className="sm:w-3 sm:h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Location */}
              <div className="mb-2 mt-4 flex items-center gap-1.5 text-sm sm:text-[15px] font-medium text-gray-800 sm:mt-6">
                <MapPin size={14} className="sm:w-4 sm:h-4 text-emerald-600" />
                Location
              </div>
              <div className="flex items-center gap-2 rounded-xl sm:rounded-2xl bg-gray-100 px-3.5 sm:px-4 py-3 sm:py-3.5">
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Search location"
                  className="flex-1 bg-transparent text-sm sm:text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={isGettingLocation}
                  className="shrink-0 text-xs sm:text-[14px] font-semibold text-purple-700 disabled:opacity-50 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-purple-50 transition"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span className="hidden sm:inline">Locating...</span>
                    </>
                  ) : (
                    <>
                      <Navigation size={14} className="sm:hidden" />
                      <span className="hidden sm:inline">Use my location</span>
                    </>
                  )}
                </button>
              </div>
              {locationError && (
                <p className="mt-1.5 ml-1 text-[11px] sm:text-xs text-red-500">{locationError}</p>
              )}
            </div>

            {/* Submit */}
            <div className="px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-full rounded-xl sm:rounded-2xl py-3.5 sm:py-4 text-sm sm:text-[16px] font-semibold text-white transition ${
                  canSubmit ? 'bg-purple-700 active:scale-[0.98]' : 'bg-purple-300'
                }`}
              >
                Submit report
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-between h-full px-6 py-10 text-center sm:px-8 bg-emerald-700 sm:py-14">
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="flex items-center justify-center w-20 h-20 rounded-full shadow-lg sm:h-28 sm:w-28 bg-emerald-500">
                <Check size={40} className="text-white sm:w-14 sm:h-14" strokeWidth={3} />
              </div>
              <h2 className="mt-5 text-2xl font-extrabold text-white sm:mt-8 sm:text-3xl">Report submitted</h2>
              <p className="mt-2 sm:mt-3 max-w-xs text-sm sm:text-[15px] leading-relaxed text-emerald-100">
                Thanks for keeping the road safer. Your report is now visible to nearby drivers.
              </p>
            </div>

            <div className="w-full">
              <button
                onClick={onClose}
                className="w-full rounded-xl sm:rounded-2xl bg-white py-3.5 sm:py-4 text-sm sm:text-[16px] font-semibold text-emerald-700"
              >
                Done
              </button>
              <button
                onClick={handleReportAnother}
                className="mt-3 sm:mt-4 text-sm sm:text-[15px] font-medium text-emerald-100"
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