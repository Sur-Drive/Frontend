import { useState } from 'react'
import { Volume2, VolumeX, ChevronUp, ChevronDown, Languages } from 'lucide-react'
import type { VoiceLocale } from '../../api/multilingualVoice'

export interface VoiceGuidanceControlProps {
  muted: boolean
  toggleMuted: () => void
  volume: number
  setVolume: (v: number) => void
  locale: VoiceLocale
  setLocale: (l: VoiceLocale) => void
  locales: { code: VoiceLocale; label: string }[]
  className?: string
}

/**
 * Mute toggle, a volume slider, and a language picker (English / Yorùbá /
 * Igbo / Hausa) — both panels stay collapsed by default so they don't
 * permanently take up space in the (already busy) top navigation banner.
 */
export default function VoiceGuidanceControl({
  muted,
  toggleMuted,
  volume,
  setVolume,
  locale,
  setLocale,
  locales,
  className = '',
}: VoiceGuidanceControlProps) {
  const [sliderOpen, setSliderOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-0.5">
        <button
          onClick={toggleMuted}
          aria-label={muted ? 'Unmute voice guidance' : 'Mute voice guidance'}
          className="flex items-center justify-center flex-shrink-0 text-white w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20"
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <button
          onClick={() => {
            setLangOpen((v) => !v)
            setSliderOpen(false)
          }}
          aria-label="Choose voice guidance language"
          aria-expanded={langOpen}
          className="flex items-center justify-center flex-shrink-0 gap-0.5 px-1.5 text-white h-9 sm:h-10 rounded-xl bg-white/20"
        >
          <Languages size={16} />
          <span className="text-[10px] font-semibold uppercase">
            {locale.slice(0, 2)}
          </span>
        </button>
        <button
          onClick={() => {
            setSliderOpen((v) => !v)
            setLangOpen(false)
          }}
          aria-label={sliderOpen ? 'Hide volume slider' : 'Show volume slider'}
          aria-expanded={sliderOpen}
          className="flex items-center justify-center flex-shrink-0 w-4 h-9 text-white/70"
        >
          {sliderOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {sliderOpen && (
        <div className="absolute right-0 z-10 flex items-center px-3 py-2 bg-white shadow-lg top-full mt-1.5 rounded-xl">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            disabled={muted}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Voice guidance volume"
            className="w-24 accent-emerald-500 disabled:opacity-40"
          />
        </div>
      )}

      {langOpen && (
        <div className="absolute right-0 z-10 flex flex-col gap-0.5 px-1.5 py-1.5 bg-white shadow-lg top-full mt-1.5 rounded-xl min-w-[112px]">
          {locales.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLocale(l.code)
                setLangOpen(false)
              }}
              className={`px-2.5 py-1.5 text-left text-xs font-medium rounded-lg transition ${
                l.code === locale
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
