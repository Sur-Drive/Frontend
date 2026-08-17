import { useCallback, useEffect, useRef, useState } from 'react'

const MUTE_STORAGE_KEY = 'voiceGuidanceMuted'
const VOLUME_STORAGE_KEY = 'voiceGuidanceVolume'

function readStoredMuted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function readStoredVolume(): number {
  if (typeof window === 'undefined') return 1
  try {
    const raw = window.localStorage.getItem(VOLUME_STORAGE_KEY)
    if (raw == null) return 1
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 1
  } catch {
    return 1
  }
}

export interface SpeakOptions {
  /** Stop whatever's currently queued/speaking and say this immediately — use for time-critical alerts (off-route, hazards, arrival). */
  interrupt?: boolean
  rate?: number
  pitch?: number
}

/**
 * Turn-by-turn voice guidance, built on the browser's native
 * SpeechSynthesis API — no external service or API key required, works
 * offline once the page has loaded. Mute state persists across sessions.
 */
export function useVoiceGuidance() {
  const [isSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window)
  const [muted, setMuted] = useState(readStoredMuted)
  const [volume, setVolumeState] = useState(readStoredVolume)
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    try {
      window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0')
    } catch {
      // ignore — non-fatal, just means the mute preference won't persist
    }
    if (muted && isSupported) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [muted, isSupported])

  // Clamped 0-1, persisted across sessions like mute is. Setting it above 0
  // while muted only changes what volume playback resumes at — it doesn't
  // unmute on its own.
  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v))
    setVolumeState(clamped)
    try {
      window.localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped))
    } catch {
      // ignore — non-fatal, just means the volume preference won't persist
    }
  }, [])

  // Voices load asynchronously in Chrome — kick this off early so the
  // first announcement doesn't get stuck with a placeholder voice.
  useEffect(() => {
    if (!isSupported) return
    window.speechSynthesis.getVoices()
    const handle = () => window.speechSynthesis.getVoices()
    window.speechSynthesis.addEventListener('voiceschanged', handle)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handle)
  }, [isSupported])

  const speak = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      if (!isSupported || muted || !text) return

      if (opts.interrupt) {
        window.speechSynthesis.cancel()
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = opts.rate ?? 1
      utterance.pitch = opts.pitch ?? 1
      utterance.volume = volume
      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)

      window.speechSynthesis.speak(utterance)
    },
    [isSupported, muted, volume]
  )

  const stop = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [isSupported])

  // Stop talking if the component using this unmounts (e.g. trip ended / navigated away)
  const stopRef = useRef(stop)
  stopRef.current = stop
  useEffect(() => () => stopRef.current(), [])

  return {
    isSupported,
    muted,
    setMuted,
    toggleMuted: () => setMuted((m) => !m),
    volume,
    setVolume,
    speaking,
    speak,
    stop,
  }
}
