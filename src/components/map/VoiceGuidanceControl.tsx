import { useState } from 'react'
import { Volume2, VolumeX, ChevronUp, ChevronDown, Settings2, Globe2 } from 'lucide-react'
import type { VoiceGender } from '../../lib/voiceCatalog'

export interface VoiceGuidanceLanguageOption {
  lang: string
  label: string
  isAfrican: boolean
  /** Whether this device actually has a matching voice installed — false means it'll fall back to the closest available voice reading translated text. */
  installed?: boolean
}

export interface VoiceGuidanceControlProps {
  muted: boolean
  toggleMuted: () => void
  volume: number
  setVolume: (v: number) => void
  className?: string
  // Optional — when provided, a settings panel (language + male/female
  // voice) is shown alongside the mute/volume controls. Omit these to
  // keep the control exactly as before (mute + volume only).
  languages?: VoiceGuidanceLanguageOption[]
  language?: string | null
  setLanguage?: (lang: string | null) => void
  gender?: VoiceGender | 'any'
  setGenderPreference?: (g: VoiceGender | 'any') => void
  hasAfricanVoice?: boolean
}

/**
 * Mute toggle + collapsible volume slider, plus (when voice-selection
 * props are supplied) a settings panel for picking the announcement
 * language and a male/female voice — including any African-language or
 * African-country-locale voice the device has installed, flagged with a
 * globe icon so it's easy to find rather than buried in a long list.
 */
export default function VoiceGuidanceControl({
  muted,
  toggleMuted,
  volume,
  setVolume,
  className = '',
  languages,
  language,
  setLanguage,
  gender,
  setGenderPreference,
  hasAfricanVoice,
}: VoiceGuidanceControlProps) {
  const [sliderOpen, setSliderOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const showSettings = !!(languages && setLanguage && setGenderPreference)

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
          onClick={() => setSliderOpen((v) => !v)}
          aria-label={sliderOpen ? 'Hide volume slider' : 'Show volume slider'}
          aria-expanded={sliderOpen}
          className="flex items-center justify-center flex-shrink-0 w-4 h-9 text-white/70"
        >
          {sliderOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {showSettings && (
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            aria-label={settingsOpen ? 'Hide voice settings' : 'Voice settings'}
            aria-expanded={settingsOpen}
            className="relative flex items-center justify-center flex-shrink-0 text-white w-8 h-9 rounded-xl"
          >
            <Settings2 size={16} />
            {hasAfricanVoice && (
              <span
                className="absolute top-1 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400"
                title="An African-language voice is available"
              />
            )}
          </button>
        )}
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

      {showSettings && settingsOpen && (
        <div className="absolute right-0 z-10 w-56 px-3 py-3 space-y-3 bg-white shadow-lg top-full mt-1.5 rounded-xl">
          <div>
            <label className="flex items-center gap-1 mb-1 text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
              <Globe2 size={11} /> Language
            </label>
            <select
              value={language ?? ''}
              onChange={(e) => setLanguage!(e.target.value || null)}
              className="w-full px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800"
            >
              <option value="">Auto (device default)</option>
              {languages!.map((l) => (
                <option key={l.lang} value={l.lang}>
                  {l.isAfrican ? '🌍 ' : ''}
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold tracking-wide text-gray-500 uppercase">Voice</p>
            <div className="flex gap-1.5">
              {(['any', 'female', 'male'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGenderPreference!(g)}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-lg capitalize transition ${
                    gender === g ? 'bg-emerald-500 text-white' : 'bg-gray-50 text-gray-600 border border-gray-200'
                  }`}
                >
                  {g === 'any' ? 'Auto' : g}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
