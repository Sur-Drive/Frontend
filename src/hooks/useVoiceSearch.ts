import { useCallback, useEffect, useRef, useState } from 'react'

type RecognitionCtor = new () => any

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null
}

export interface UseVoiceSearchOptions {
  lang?: string
}

/**
 * Tap-to-talk voice search — the mic icon in a search box, same pattern as
 * Google Maps' search bar. One-shot: start() begins listening, resolves
 * with a final transcript (or an error), and stops itself. Chrome/Edge/
 * Safari support this; browsers without it just won't show the mic icon.
 */
export function useVoiceSearch({ lang = 'en-US' }: UseVoiceSearchOptions = {}) {
  const Ctor = getRecognitionCtor()
  const [isSupported] = useState(() => Ctor != null)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const start = useCallback(
    (onResult: (transcript: string) => void) => {
      if (!Ctor) {
        setError('Voice search is not supported in this browser')
        return
      }

      setError(null)
      const recognition = new Ctor()
      recognitionRef.current = recognition
      recognition.lang = lang
      recognition.continuous = false
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onerror = (e: any) => {
        setIsListening(false)
        setError(e?.error === 'not-allowed' ? 'Microphone access was denied' : "Didn't catch that — try again")
      }
      recognition.onresult = (e: any) => {
        const transcript = e.results?.[0]?.[0]?.transcript
        if (transcript) onResult(transcript.trim())
      }

      try {
        recognition.start()
      } catch {
        // start() throws if a recognizer is already running for this instance
      }
    },
    [Ctor, lang]
  )

  useEffect(() => stop, [stop])

  return { isSupported, isListening, error, start, stop }
}

export interface UseWakeWordOptions {
  /** Phrase to listen for, e.g. "hey driver". Matched case-insensitively as a substring of what was heard. */
  phrase: string
  enabled: boolean
  onWake: () => void
  lang?: string
}

/**
 * Best-effort always-listening wake word ("Hey ___"), built on continuous
 * SpeechRecognition. This is a browser API, not a dedicated low-power
 * wake-word engine like real "Hey Google" — it only works in Chromium
 * browsers (Chrome/Edge), needs an active tab and mic permission, and
 * will not work in Safari/Firefox or once the tab is backgrounded on
 * mobile. Treat it as a bonus; the tap-to-talk mic button is the
 * reliable path. Auto-restarts itself since the browser API times out
 * after periods of silence.
 */
export function useWakeWord({ phrase, enabled, onWake, lang = 'en-US' }: UseWakeWordOptions) {
  const Ctor = getRecognitionCtor()
  const [isSupported] = useState(() => Ctor != null)
  const [isListening, setIsListening] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const recognitionRef = useRef<any>(null)
  const onWakeRef = useRef(onWake)
  onWakeRef.current = onWake

  useEffect(() => {
    if (!enabled || !Ctor) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    let stopped = false
    const normalizedPhrase = phrase.toLowerCase()

    const startRecognition = () => {
      if (stopped) return
      const recognition = new Ctor()
      recognitionRef.current = recognition
      recognition.lang = lang
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onstart = () => setIsListening(true)
      recognition.onerror = (e: any) => {
        if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
          setPermissionDenied(true)
          stopped = true
        }
      }
      recognition.onend = () => {
        setIsListening(false)
        // The browser stops recognition after a stretch of silence —
        // restart so "always listening" actually stays listening.
        if (!stopped) {
          setTimeout(() => {
            if (!stopped) startRecognition()
          }, 250)
        }
      }
      recognition.onresult = (e: any) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript: string = e.results[i][0].transcript.toLowerCase()
          if (transcript.includes(normalizedPhrase)) {
            onWakeRef.current()
            recognition.stop()
            return
          }
        }
      }

      try {
        recognition.start()
      } catch {
        // already running — ignore
      }
    }

    startRecognition()

    return () => {
      stopped = true
      recognitionRef.current?.stop()
    }
  }, [enabled, Ctor, phrase, lang])

  return { isSupported, isListening, permissionDenied }
}
