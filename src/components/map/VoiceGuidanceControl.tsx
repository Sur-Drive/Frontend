import { useState } from 'react'
import { Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react'

export interface VoiceGuidanceControlProps {
  muted: boolean
  toggleMuted: () => void
  volume: number
  setVolume: (v: number) => void
  className?: string
}

/**
 * Mute toggle (same tap-to-mute behavior as before) plus a small caret
 * that reveals a volume slider — kept collapsed by default so it doesn't
 * permanently take up space in the (already busy) top navigation banner.
 */
export default function VoiceGuidanceControl({ muted, toggleMuted, volume, setVolume, className = '' }: VoiceGuidanceControlProps) {
  const [sliderOpen, setSliderOpen] = useState(false)

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
    </div>
  )
}
