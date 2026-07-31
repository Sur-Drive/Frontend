import { useCallback, useEffect, useRef, useState } from 'react'

const MUTE_STORAGE_KEY = 'voiceGuidanceMuted'

function readStoredMuted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === '1'
  } catch {
    return false
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
      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)

      window.speechSynthesis.speak(utterance)
    },
    [isSupported, muted]
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
    speaking,
    speak,
    stop,
  }
}
