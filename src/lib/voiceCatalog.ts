export type VoiceGender = "male" | "female" | "unknown";

export interface VoiceInfo {
  voiceURI: string;
  name: string;
  lang: string;
  default: boolean;
  /** Best-effort guess from the voice's name — browsers don't expose real gender metadata. */
  gender: VoiceGender;
  /** Human-readable language label, e.g. "English (Nigeria)". */
  languageLabel: string;
  /** True if this voice's language/locale is one of Africa's — see AFRICAN_LOCALE_PREFIXES / AFRICAN_LANGUAGE_NAMES below. */
  isAfrican: boolean;
}

// BCP-47 language-region prefixes for African countries/locales that
// speech engines commonly ship (Chrome/Edge/Android TTS packs, in
// particular, include several English/French/Swahili/Afrikaans
// African-locale voices). Matched case-insensitively against `lang`.
const AFRICAN_LOCALE_PREFIXES = [
  "af-za", // Afrikaans (South Africa)
  "am-et", // Amharic (Ethiopia)
  "ha-ng", // Hausa (Nigeria)
  "ig-ng", // Igbo (Nigeria)
  "yo-ng", // Yoruba (Nigeria)
  "pcm-ng", // Nigerian Pidgin
  "pcm", // Nigerian Pidgin (no region tag)
  "zu-za", // Zulu (South Africa)
  "xh-za", // Xhosa (South Africa)
  "sw-ke", // Swahili (Kenya)
  "sw-tz", // Swahili (Tanzania)
  "so-so", // Somali
  "rw-rw", // Kinyarwanda
  "en-za", // English (South Africa)
  "en-ng", // English (Nigeria)
  "en-ke", // English (Kenya)
  "en-gh", // English (Ghana)
  "en-tz", // English (Tanzania)
  "en-ug", // English (Uganda)
  "fr-sn", // French (Senegal)
  "fr-ci", // French (Côte d'Ivoire)
  "fr-cm", // French (Cameroon)
  "ar-eg", // Arabic (Egypt)
  "ar-ma", // Arabic (Morocco)
  "ar-dz", // Arabic (Algeria)
  "ar-tn", // Arabic (Tunisia)
];

// Some engines report just the base language (no region) for languages
// that are themselves African, or spell out the country/language in the
// voice's display `name` instead of `lang` (e.g. "Microsoft Ayanda -
// English (South Africa)"). Match those by name/lang keyword as a
// fallback.
const AFRICAN_KEYWORDS = [
  "south africa",
  "nigeria",
  "nigerian",
  "kenya",
  "ghana",
  "ethiopia",
  "tanzania",
  "uganda",
  "senegal",
  "zulu",
  "xhosa",
  "afrikaans",
  "swahili",
  "yoruba",
  "igbo",
  "hausa",
  "pidgin",
  "amharic",
  "kinyarwanda",
  "somali",
];

const LANGUAGE_DISPLAY = (() => {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" });
  } catch {
    return null;
  }
})();
const REGION_DISPLAY = (() => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    return null;
  }
})();

// Fallback names for when Intl.DisplayNames is unavailable or throws —
// common on Android WebViews and older mobile browsers. Without this,
// a device that can't resolve "ko" just shows "ko" in the picker, which
// tells the user nothing about which language they're choosing.
const LANGUAGE_NAME_FALLBACK: Record<string, string> = {
  en: "English",
  fr: "French",
  es: "Spanish",
  pt: "Portuguese",
  ar: "Arabic",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  hi: "Hindi",
  ur: "Urdu",
  bn: "Bengali",
  ru: "Russian",
  de: "German",
  it: "Italian",
  nl: "Dutch",
  tr: "Turkish",
  vi: "Vietnamese",
  th: "Thai",
  id: "Indonesian",
  ms: "Malay",
  fa: "Persian",
  pl: "Polish",
  uk: "Ukrainian",
  ro: "Romanian",
  el: "Greek",
  he: "Hebrew",
  sw: "Swahili",
  am: "Amharic",
  ha: "Hausa",
  ig: "Igbo",
  yo: "Yoruba",
  zu: "Zulu",
  xh: "Xhosa",
  af: "Afrikaans",
  so: "Somali",
  rw: "Kinyarwanda",
  pcm: "Nigerian Pidgin",
};
const REGION_NAME_FALLBACK: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  NG: "Nigeria",
  KR: "South Korea",
  CN: "China",
  JP: "Japan",
  IN: "India",
  FR: "France",
  ES: "Spain",
  BR: "Brazil",
  PT: "Portugal",
  DE: "Germany",
  IT: "Italy",
  RU: "Russia",
  SA: "Saudi Arabia",
  EG: "Egypt",
  KE: "Kenya",
  GH: "Ghana",
  ZA: "South Africa",
  TZ: "Tanzania",
  UG: "Uganda",
  ET: "Ethiopia",
  SN: "Senegal",
  CI: "Côte d'Ivoire",
  CM: "Cameroon",
  MA: "Morocco",
  DZ: "Algeria",
  TN: "Tunisia",
  TR: "Turkey",
  VN: "Vietnam",
  TH: "Thailand",
  ID: "Indonesia",
  MY: "Malaysia",
  PL: "Poland",
  UA: "Ukraine",
  RO: "Romania",
  GR: "Greece",
  IL: "Israel",
  PK: "Pakistan",
  BD: "Bangladesh",
  MX: "Mexico",
  CA: "Canada",
  AU: "Australia",
};

function safeDisplayName(
  display: Intl.DisplayNames | null,
  code: string | undefined,
): string | undefined {
  if (!display || !code) return undefined;
  try {
    return display.of(code) ?? undefined;
  } catch {
    // Intl.DisplayNames#of throws RangeError for any code that isn't a
    // well-formed BCP-47 subtag. Real-world TTS engines (especially on
    // Android/Chrome) report plenty of these — vendor-specific tags,
    // 3-letter codes, malformed casing, etc. This can't be pre-validated
    // reliably, so just fall back instead of letting it crash the render.
    return undefined;
  }
}

export function describeLanguage(lang: string): string {
  if (!lang) return "Unknown language";
  const [langCode, regionCode] = lang.split("-");
  const lowerLangCode = langCode?.toLowerCase();
  const langName =
    safeDisplayName(LANGUAGE_DISPLAY, lowerLangCode) ??
    LANGUAGE_NAME_FALLBACK[lowerLangCode ?? ""] ??
    langCode ??
    lang;
  if (!regionCode) return langName ?? lang;
  const upperRegionCode = regionCode.toUpperCase();
  const regionName =
    safeDisplayName(REGION_DISPLAY, upperRegionCode) ??
    REGION_NAME_FALLBACK[upperRegionCode] ??
    upperRegionCode;
  return `${langName} (${regionName})`;
}

export function isAfricanVoice(lang: string, name: string): boolean {
  const l = lang.toLowerCase();
  if (AFRICAN_LOCALE_PREFIXES.some((p) => l === p || l.startsWith(p)))
    return true;
  const haystack = `${l} ${name.toLowerCase()}`;
  return AFRICAN_KEYWORDS.some((kw) => haystack.includes(kw));
}

// Voice vendors don't expose real gender metadata, but most desktop/
// mobile TTS voices bake a recognizable hint into their display name
// (either an explicit "Female"/"Male" suffix, like Chrome's Google
// voices, or a known first-name pattern, like Microsoft's "Zira"/
// "David"). This is a best-effort classification for grouping voices in
// a picker — never used for anything that needs to be authoritative.
const FEMALE_NAME_HINTS = [
  "female",
  "zira",
  "samantha",
  "susan",
  "victoria",
  "karen",
  "moira",
  "tessa",
  "ayanda",
  "linda",
  "fiona",
  "anna",
  "aria",
];
const MALE_NAME_HINTS = [
  "male",
  "david",
  "mark",
  "daniel",
  "fred",
  "alex",
  "george",
  "thabo",
  "sipho",
  "james",
];

export function inferVoiceGender(name: string): VoiceGender {
  const n = name.toLowerCase();
  if (FEMALE_NAME_HINTS.some((hint) => n.includes(hint))) return "female";
  if (MALE_NAME_HINTS.some((hint) => n.includes(hint))) return "male";
  return "unknown";
}

export function toVoiceInfo(voice: SpeechSynthesisVoice): VoiceInfo {
  return {
    voiceURI: voice.voiceURI,
    name: voice.name,
    lang: voice.lang,
    default: voice.default,
    gender: inferVoiceGender(voice.name),
    languageLabel: describeLanguage(voice.lang),
    isAfrican: isAfricanVoice(voice.lang, voice.name),
  };
}

/**
 * Pick the best available voice for a language + gender preference.
 * Falls back in order: (1) an exact match for `languagePrefix`, (2)
 * `fallbackLanguagePrefix` (English by default) — for languages like
 * Yoruba/Hausa/Nigerian Pidgin that essentially no device ships a native
 * voice for, reading Latin-script translated text through an English
 * voice is a far more sensible fallback than whatever voice happens to
 * be first/default on the device (which could be any installed
 * language, e.g. French on a device set to French system language,
 * mangling the text far worse than an English voice would), (3) the
 * device's default voice, (4) simply the first voice available.
 */
export function pickVoice(
  voices: VoiceInfo[],
  opts: {
    languagePrefix?: string;
    gender?: VoiceGender | "any";
    fallbackLanguagePrefix?: string;
  },
): VoiceInfo | null {
  if (voices.length === 0) return null;
  const {
    languagePrefix,
    gender = "any",
    fallbackLanguagePrefix = "en",
  } = opts;

  const byLang = (prefix: string) =>
    voices.filter((v) => v.lang.toLowerCase().startsWith(prefix.toLowerCase()));

  const requested = languagePrefix ? byLang(languagePrefix) : [];
  const fallback =
    requested.length === 0 && languagePrefix
      ? byLang(fallbackLanguagePrefix)
      : [];
  const pool =
    requested.length > 0 ? requested : fallback.length > 0 ? fallback : voices;

  if (gender !== "any") {
    const matched = pool.find((v) => v.gender === gender);
    if (matched) return matched;
  }

  return pool.find((v) => v.default) ?? pool[0];
}
