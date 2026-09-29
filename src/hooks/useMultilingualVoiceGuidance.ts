import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceGuidance } from "./useVoiceGuidance";
import {
  synthesizeVoiceClip,
  VOICE_LOCALES,
  type VoiceGender,
  type VoiceLocale,
} from "../api/multilingualVoice";
import type { PhraseKey } from "../lib/multilingualPhrases";

const LOCALE_STORAGE_KEY = "voiceGuidanceLocale";
const CLIP_TIMEOUT_MS = 15000;

// Both voice genders sound fine, but idera's Yorùbá and umar's Hausa read
// noticeably more natural than the alternative — requested explicitly, so
// we pin them here rather than leaving it to whatever the backend's
// per-locale default happens to be.
const LOCALE_DEFAULT_GENDER: Partial<Record<VoiceLocale, VoiceGender>> = {
  "yo-NG": "female", // idera
  "ha-NG": "male", // umar
};

function readStoredLocale(): VoiceLocale {
  if (typeof window === "undefined") return "en-NG";
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return (VOICE_LOCALES.find((l) => l.code === raw)?.code as VoiceLocale) || "en-NG";
  } catch {
    return "en-NG";
  }
}

export interface MultilingualSpeakOptions {
  /** Stop whatever's currently playing (backend audio AND native speech) and say this immediately — time-critical alerts only. */
  interrupt?: boolean;
  gender?: VoiceGender;
  /** English text to fall back to (native browser TTS) if the backend call fails, or if locale is English. */
  fallbackText: string;
}

interface CachedClip {
  audio: HTMLAudioElement;
  text: string;
}

/**
 * Turn-by-turn voice guidance with Yoruba/Igbo/Hausa support.
 *
 * English (en-NG) stays on the browser's built-in SpeechSynthesis — free,
 * offline, zero latency. Yoruba/Igbo/Hausa route through the backend's
 * /multilingual/tts catalog, which returns a signed MP3 URL synthesized by
 * YarnGPT (cached in-memory here, and again server-side in Redis/Bucket).
 * If a backend call fails for any reason (offline, 401, catalog miss),
 * this falls back to the native engine speaking `fallbackText` in English
 * so a call-out is never silently dropped.
 *
 * Every speak-ish call — backend clips and native-fallback text alike —
 * goes through one serial queue, so two call-outs can never play over each
 * other (this used to be able to happen: two near-simultaneous non-
 * interrupting announcements would both start playing independently, and
 * once in a while the backend clip and its own native fallback would even
 * both end up audible at once). `interrupt: true` clears the queue and
 * silences whatever's currently playing — backend audio or native speech,
 * whichever it is — before jumping in.
 */
export function useMultilingualVoiceGuidance() {
  const native = useVoiceGuidance();
  const [locale, setLocaleState] = useState<VoiceLocale>(readStoredLocale);
  const [speaking, setSpeaking] = useState(false);

  const clipCacheRef = useRef<Map<string, CachedClip>>(new Map());
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const mutedRef = useRef(native.muted);
  const volumeRef = useRef(native.volume);
  mutedRef.current = native.muted;
  volumeRef.current = native.volume;

  // ── Serial queue ──
  // `genRef` is bumped on every interrupt; a queued task checks it's still
  // current right before it actually plays anything, so a task that was
  // already mid-fetch when an interrupt landed just quietly no-ops instead
  // of playing late and overlapping whatever superseded it.
  const genRef = useRef(0);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const stopAll = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    native.stop();
    setSpeaking(false);
  }, [native]);

  const enqueue = useCallback(
    (task: (gen: number) => Promise<void>, interrupt?: boolean): Promise<void> => {
      if (interrupt) {
        genRef.current += 1;
        stopAll();
        const gen = genRef.current;
        const started = task(gen);
        queueRef.current = started;
        return started;
      }
      const gen = genRef.current;
      const next = queueRef.current.then(
        () => task(gen),
        () => task(gen),
      );
      queueRef.current = next;
      return next;
    },
    [stopAll],
  );

  const setLocale = useCallback((next: VoiceLocale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // non-fatal — locale just won't persist across sessions
    }
    // "Language switching" per the backend docs: wipe the in-memory audio
    // cache so the next call-out fetches a fresh clip in the new locale.
    genRef.current += 1;
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    clipCacheRef.current.clear();
    setSpeaking(false);
  }, []);

  const cacheKeyFor = useCallback(
    (loc: VoiceLocale, key: PhraseKey, params: Record<string, string>, gender?: VoiceGender) =>
      `${loc}|${key}|${JSON.stringify(params)}|${gender ?? ""}`,
    [],
  );

  const fetchClip = useCallback(
    async (
      loc: VoiceLocale,
      key: PhraseKey,
      params: Record<string, string>,
      gender?: VoiceGender,
    ): Promise<CachedClip> => {
      const effectiveGender = gender ?? LOCALE_DEFAULT_GENDER[loc];
      const cacheKey = cacheKeyFor(loc, key, params, effectiveGender);
      const existing = clipCacheRef.current.get(cacheKey);
      if (existing) return existing;

      const res = await synthesizeVoiceClip({
        locale: loc,
        key,
        params,
        gender: effectiveGender,
      });
      const audio = new Audio(res.url);
      audio.preload = "auto";
      audio.dataset.navVoice = "1";
      const clip: CachedClip = { audio, text: res.text };
      clipCacheRef.current.set(cacheKey, clip);
      return clip;
    },
    [cacheKeyFor],
  );

  const playClip = useCallback((audio: HTMLAudioElement): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (mutedRef.current) {
        resolve();
        return;
      }
      currentAudioRef.current = audio;
      audio.volume = volumeRef.current;
      try {
        audio.currentTime = 0;
      } catch {
        // ignore — some browsers throw if the clip hasn't buffered yet
      }

      let settled = false;
      const succeed = () => {
        if (settled) return;
        settled = true;
        if (currentAudioRef.current === audio) currentAudioRef.current = null;
        setSpeaking(false);
        resolve();
      };
      const fail = (reason: unknown) => {
        if (settled) return;
        settled = true;
        if (currentAudioRef.current === audio) currentAudioRef.current = null;
        setSpeaking(false);
        // Surfaced so a silent clip shows up as something diagnosable in
        // devtools instead of just "nothing happened" — most commonly this
        // is the browser's autoplay policy rejecting play() because it
        // wasn't called synchronously within a user gesture (we call it
        // after an awaited network fetch), which unlock() below guards against.
        console.warn("[voice] clip failed to play, falling back to native English:", reason);
        reject(reason instanceof Error ? reason : new Error(String(reason)));
      };

      audio.onended = succeed;
      audio.onerror = () => fail(audio.error ?? new Error("audio element error"));
      setSpeaking(true);

      const playPromise = audio.play();
      if (playPromise?.catch) {
        playPromise.catch(fail);
      }
      window.setTimeout(() => fail(new Error("playback timed out")), CLIP_TIMEOUT_MS);
    });
  }, []);

  /**
   * Primes the page's permission to play programmatically-created audio.
   * Call this synchronously inside a click/tap handler, BEFORE any `await` —
   * our clips are fetched over the network before they can play, and by the
   * time that fetch resolves, the browser (Safari/iOS especially, but also
   * Chrome in some cases) may no longer consider play() to be happening
   * "within" the original gesture and silently refuses it. Playing (and
   * immediately pausing) a trivial silent clip up front grants playback
   * rights for the rest of the page session, so the later async play() calls
   * go through audibly instead of failing quietly.
   */
  const unlock = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const unlocker = new Audio(
        "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
      );
      const p = unlocker.play();
      if (p?.catch) p.catch(() => {});
      unlocker.pause();
    } catch {
      // best-effort — worst case we're back to relying on the play() rejection fallback
    }
  }, []);

  /** Speak a catalog phrase key in the current locale, falling back to native English TTS on failure. */
  const speak = useCallback(
    (
      key: PhraseKey,
      params: Record<string, string> = {},
      opts: MultilingualSpeakOptions,
    ): Promise<void> => {
      if (mutedRef.current) return Promise.resolve();

      return enqueue(async (gen) => {
        if (locale === "en-NG") {
          native.speak(opts.fallbackText, { interrupt: false });
          return;
        }
        try {
          const clip = await fetchClip(locale, key, params, opts.gender);
          if (gen !== genRef.current) return; // superseded while we were fetching
          await playClip(clip.audio);
        } catch {
          if (gen !== genRef.current) return;
          native.speak(opts.fallbackText, { interrupt: false });
        }
      }, opts.interrupt);
    },
    [locale, fetchClip, playClip, native, enqueue],
  );

  /**
   * Speak a maneuver call-out prefixed with its distance ("In 300 meters,
   * turn left..."), composing distance.in_meters/in_kilometers with the
   * maneuver phrase's own localized text as the `instruction` param.
   */
  const speakManeuverWithDistance = useCallback(
    (
      maneuverKey: PhraseKey,
      maneuverParams: Record<string, string>,
      distanceMeters: number,
      opts: MultilingualSpeakOptions,
    ): Promise<void> => {
      if (mutedRef.current) return Promise.resolve();

      return enqueue(async (gen) => {
        if (locale === "en-NG") {
          native.speak(opts.fallbackText, { interrupt: false });
          return;
        }
        try {
          const maneuverClip = await fetchClip(locale, maneuverKey, maneuverParams, opts.gender);
          if (gen !== genRef.current) return;
          const distKey: PhraseKey =
            distanceMeters < 1000 ? "distance.in_meters" : "distance.in_kilometers";
          const distParams =
            distanceMeters < 1000
              ? {
                  meters: String(Math.max(0, Math.round(distanceMeters / 10) * 10)),
                  instruction: maneuverClip.text,
                }
              : {
                  km: (distanceMeters / 1000).toFixed(1),
                  instruction: maneuverClip.text,
                };
          const distClip = await fetchClip(locale, distKey, distParams, opts.gender);
          if (gen !== genRef.current) return;
          await playClip(distClip.audio);
        } catch {
          if (gen !== genRef.current) return;
          native.speak(opts.fallbackText, { interrupt: false });
        }
      }, opts.interrupt);
    },
    [locale, fetchClip, playClip, native, enqueue],
  );

  /** Escape hatch for dynamic, non-catalog text (collision warnings, voice-search prompts) — always native/English, but still shares the queue so it can't overlap a backend clip. */
  const speakText = useCallback(
    (text: string, opts: { interrupt?: boolean } = {}): Promise<void> => {
      if (mutedRef.current) return Promise.resolve();
      return enqueue(async () => {
        native.speak(text, { interrupt: false });
      }, opts.interrupt);
    },
    [native, enqueue],
  );

  /** Preload a clip in the background without playing it (call this for the next couple of upcoming maneuvers). */
  const warm = useCallback(
    (key: PhraseKey, params: Record<string, string> = {}, gender?: VoiceGender) => {
      if (locale === "en-NG") return;
      fetchClip(locale, key, params, gender).catch(() => {
        // best-effort — a failed preload just means the real call falls back later
      });
    },
    [locale, fetchClip],
  );

  const stop = useCallback(() => {
    genRef.current += 1;
    stopAll();
  }, [stopAll]);

  // Stop talking if the component using this unmounts.
  const stopRef = useRef(stop);
  stopRef.current = stop;
  useEffect(() => () => stopRef.current(), []);

  return {
    isSupported: true, // backend locales always work; native.isSupported only gates the English fallback path
    muted: native.muted,
    setMuted: native.setMuted,
    toggleMuted: native.toggleMuted,
    volume: native.volume,
    setVolume: native.setVolume,
    speaking: speaking || native.speaking,
    locale,
    setLocale,
    locales: VOICE_LOCALES,
    speak,
    speakManeuverWithDistance,
    speakText,
    warm,
    unlock,
    stop,
  };
}
