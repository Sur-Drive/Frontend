import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { pickVoice, toVoiceInfo, type VoiceGender, type VoiceInfo } from '../lib/voiceCatalog'
import { NAV_LANGUAGES, toNavLanguage } from '../lib/navPhrases'

const MUTE_STORAGE_KEY = 'voiceGuidanceMuted'
const VOLUME_STORAGE_KEY = 'voiceGuidanceVolume'
const VOICE_URI_STORAGE_KEY = 'voiceGuidanceVoiceURI'
const LANGUAGE_STORAGE_KEY = 'voiceGuidanceLanguage'
const GENDER_STORAGE_KEY = 'voiceGuidanceGender'

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

function readStoredString(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export interface SpeakOptions {
  /** Stop whatever's currently queued/speaking and say this immediately — use for time-critical alerts (off-route, hazards, arrival, traffic). */
  interrupt?: boolean
  rate?: number
  pitch?: number
}

/**
 * Turn-by-turn voice guidance, built on the browser's native
 * SpeechSynthesis API — no external service or API key required, works
 * offline once the page has loaded. Mute/volume/voice preferences persist
 * across sessions.
 *
 * Also surfaces the full voice catalog (`voices`) classified by language
 * and a best-effort gender guess, plus `africanVoices` — any installed
 * voice whose language or locale is African (English/French/Arabic
 * African-country locales, or an African language like Swahili, Zulu,
 * Afrikaans, Yoruba, Hausa, Amharic, etc.) — so a settings UI can offer
 * those voices when the device actually has them installed, rather than
 * only ever defaulting to en-US/en-GB.
 */
export function useVoiceGuidance() {
  const [isSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window)
  const [muted, setMuted] = useState(readStoredMuted)
  const [volume, setVolumeState] = useState(readStoredVolume)
  const [speaking, setSpeaking] = useState(false)
  const [rawVoices, setRawVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceURI, setVoiceURIState] = useState<string | null>(() => readStoredString(VOICE_URI_STORAGE_KEY))
  const [language, setLanguageState] = useState<string | null>(() => readStoredString(LANGUAGE_STORAGE_KEY))
  const [gender, setGenderState] = useState<VoiceGender | 'any'>(
    () => (readStoredString(GENDER_STORAGE_KEY) as VoiceGender | 'any') ?? 'any'
  )

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
  // first announcement doesn't get stuck with a placeholder voice, and
  // keep the classified catalog (below) in sync as the list fills in.
  useEffect(() => {
    if (!isSupported) return
    const refresh = () => setRawVoices(window.speechSynthesis.getVoices())
    refresh()
    window.speechSynthesis.addEventListener('voiceschanged', refresh)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', refresh)
  }, [isSupported])

  const voices = useMemo<VoiceInfo[]>(() => rawVoices.map(toVoiceInfo), [rawVoices])
  const africanVoices = useMemo(() => voices.filter((v) => v.isAfrican), [voices])
  const hasAfricanVoice = africanVoices.length > 0

  // Every distinct language present in the installed voice list, for a
  // language picker — African locales sorted first when present so
  // they're easy to find instead of buried in a long alphabetical list.
  //
  // Nigerian Pidgin (see NAV_LANGUAGES in navPhrases.ts) is always
  // included here even when the device has no matching installed voice
  // — `installed` tells the settings UI whether picking it will
  // actually get a native voice, or fall back to the closest available
  // voice reading translated text. Pidgin is offered this way because
  // it's plain Latin-script, English-derived text that a fallback
  // English voice can read reasonably well; Yoruba/Hausa/Igbo were
  // deliberately left out of this curated list since their tonal/
  // diacritic sounds come out badly mispronounced through a fallback
  // voice — they'll still appear here on the rare device that happens
  // to have a genuine installed voice for them (via the real-voice
  // detection above), just not as an always-offered option.
  const languages = useMemo(() => {
    const seen = new Map<string, { lang: string; label: string; isAfrican: boolean; installed: boolean }>()
    voices.forEach((v) => {
      if (!seen.has(v.lang)) seen.set(v.lang, { lang: v.lang, label: v.languageLabel, isAfrican: v.isAfrican, installed: true })
    })
    NAV_LANGUAGES.filter((l) => l.code !== 'en').forEach((l) => {
      const hasInstalledVoice = voices.some((v) => v.lang.toLowerCase().startsWith(l.code))
      if (!seen.has(l.bcp47)) {
        seen.set(l.bcp47, { lang: l.bcp47, label: l.label, isAfrican: true, installed: hasInstalledVoice })
      }
    })
    return Array.from(seen.values()).sort((a, b) => {
      if (a.isAfrican !== b.isAfrican) return a.isAfrican ? -1 : 1
      return a.label.localeCompare(b.label)
    })
  }, [voices])

  // Normalized to one of the 5 phrase-table codes (en/yo/ha/ig/pcm) so
  // callers can look up translated announcement text without re-parsing
  // the raw BCP-47 tag themselves.
  const navLanguage = useMemo(() => toNavLanguage(language), [language])

  const setVoiceURI = useCallback((uri: string | null) => {
    setVoiceURIState(uri)
    try {
      if (uri) window.localStorage.setItem(VOICE_URI_STORAGE_KEY, uri)
      else window.localStorage.removeItem(VOICE_URI_STORAGE_KEY)
    } catch {
      // ignore — non-fatal
    }
  }, [])

  const setLanguage = useCallback((lang: string | null) => {
    setLanguageState(lang)
    // Changing the language invalidates a manually-picked voice from a
    // different language, so the next speak() re-resolves one that
    // actually matches.
    setVoiceURIState(null)
    try {
      if (lang) window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
      else window.localStorage.removeItem(LANGUAGE_STORAGE_KEY)
      window.localStorage.removeItem(VOICE_URI_STORAGE_KEY)
    } catch {
      // ignore — non-fatal
    }
  }, [])

  const setGenderPreference = useCallback((g: VoiceGender | 'any') => {
    setGenderState(g)
    setVoiceURIState(null)
    try {
      window.localStorage.setItem(GENDER_STORAGE_KEY, g)
      window.localStorage.removeItem(VOICE_URI_STORAGE_KEY)
    } catch {
      // ignore — non-fatal
    }
  }, [])

  // The voice actually resolved for the current language + gender
  // preference (or the exact one the driver picked) — exposed so a
  // settings UI can show "Currently: Google en-ZA Female" etc.
  const resolvedVoice = useMemo<VoiceInfo | null>(() => {
    if (voiceURI) {
      const exact = voices.find((v) => v.voiceURI === voiceURI)
      if (exact) return exact
    }
    return pickVoice(voices, { languagePrefix: language ?? undefined, gender, fallbackLanguagePrefix: 'en' })
  }, [voices, voiceURI, language, gender])

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

      const chosen = resolvedVoice
      if (chosen) {
        const nativeVoice = rawVoices.find((v) => v.voiceURI === chosen.voiceURI)
        if (nativeVoice) {
          utterance.voice = nativeVoice
          utterance.lang = nativeVoice.lang
        }
      }

      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = (e) => {
        setSpeaking(false)
        // Surfaces in devtools when a language has no usable voice at
        // all (rare, but some engines throw rather than silently
        // falling back) — helps diagnose "the voice isn't speaking"
        // reports without needing a UI error state for what should be
        // an infrequent edge case.
        console.warn('[voiceGuidance] speech synthesis error', e.error, {
          lang: utterance.lang,
          voice: utterance.voice?.name,
        })
      }

      window.speechSynthesis.speak(utterance)
    },
    [isSupported, muted, volume, resolvedVoice, rawVoices]
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
    // Voice / language / gender selection
    voices,
    languages,
    africanVoices,
    hasAfricanVoice,
    voiceURI,
    setVoiceURI,
    language,
    setLanguage,
    /** language narrowed to en/yo/ha/ig/pcm for looking up translated phrases — see navPhrases.ts */
    navLanguage,
    gender,
    setGenderPreference,
    resolvedVoice,
  }
}

export type UseVoiceGuidanceResult = ReturnType<typeof useVoiceGuidance>
