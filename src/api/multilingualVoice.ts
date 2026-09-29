import { api } from "../lib/apiClient";

// ─── Locales & voices ──────────────────────────────────────────────

export type VoiceLocale = "en-NG" | "yo-NG" | "ig-NG" | "ha-NG";

export const VOICE_LOCALES: { code: VoiceLocale; label: string }[] = [
  { code: "en-NG", label: "English" },
  { code: "yo-NG", label: "Yorùbá" },
  { code: "ig-NG", label: "Igbo" },
  { code: "ha-NG", label: "Hausa" },
];

export type VoiceGender = "male" | "female";
export type VoiceName =
  | "idera"
  | "zainab"
  | "chinenye"
  | "mary"
  | "umar"
  | "adam"
  | "tayo"
  | "nonso";

export interface LocaleInfo {
  code: string;
  language: string;
  [key: string]: unknown;
}

export interface VoiceInfo {
  name: VoiceName;
  gender: VoiceGender;
  character?: string;
  [key: string]: unknown;
}

export interface VoicesResponse {
  female: VoiceInfo[];
  male: VoiceInfo[];
  [key: string]: unknown;
}

export function getVoiceLocales() {
  return api.get<LocaleInfo[]>("/multilingual/locales");
}

export function getVoices() {
  return api.get<VoicesResponse>("/multilingual/voices");
}

// ─── User voice preferences ────────────────────────────────────────

export interface VoicePreference {
  locale: VoiceLocale;
  maleVoice: VoiceName;
  femaleVoice: VoiceName;
  voiceGender: VoiceGender;
  [key: string]: unknown;
}

export function getVoicePreferences(locale?: VoiceLocale) {
  return api.get<VoicePreference[]>("/multilingual/voice-preferences", {
    params: locale ? { locale } : undefined,
  });
}

export function updateVoicePreference(
  patch: Partial<VoicePreference> & { locale: VoiceLocale },
) {
  return api.patch<VoicePreference>("/multilingual/voice-preferences", patch);
}

// ─── Synthesis ──────────────────────────────────────────────────────

export interface SynthesizePayload {
  locale: VoiceLocale;
  key: string;
  params?: Record<string, string>;
  gender?: VoiceGender;
}

export interface SynthesizeResponse {
  url: string;
  cacheKey: string;
  text: string;
  locale: VoiceLocale;
  voice: VoiceName;
  gender: VoiceGender;
  cached: boolean;
}

export function synthesizeVoiceClip(payload: SynthesizePayload) {
  return api.post<SynthesizeResponse>("/multilingual/tts", payload);
}
