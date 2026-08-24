// ─── Turn-by-turn phrase translations ──────────────────────────────────
//
// The app's spoken phrases fall into two closed sets: the ~12 maneuver
// instructions in maneuvers.ts (MANEUVER_INSTRUCTIONS) and a couple dozen
// canned system announcements (off-route, arrival, hazards, traffic,
// speed warnings, voice-search prompts) scattered through
// PlanRoutePage.tsx. Both are fixed, known strings — unlike a live
// maneuver's road name, they don't need a translation *service*, just a
// lookup table. This file is that table, plus small template helpers so
// callers don't have to string-concat translated fragments themselves.
//
// Only English and Nigerian Pidgin are offered as selectable languages
// today — Pidgin is plain Latin-script, English-derived words that an
// ordinary English speech-synthesis voice (which is what's actually
// installed on virtually every device) can read reasonably well. Yoruba,
// Hausa, and Igbo were tried and pulled: their tonal/diacritic sounds
// come out mispronounced through a fallback English voice since no
// mainstream browser/OS ships a native voice for them.
//
// IMPORTANT — translation quality: this is a practical starting set
// (aiming for plain, widely-understood everyday phrasing), not a
// professionally reviewed translation. Treat it as a first draft to have
// a native speaker sanity-check before relying on it in production.

import type { ManeuverType } from './maneuvers'

export type NavLanguage = 'en' | 'pcm'

export interface NavLanguageOption {
  code: NavLanguage
  /** BCP-47 tag used to look up/request a matching SpeechSynthesis voice. */
  bcp47: string
  label: string
  flagLabel: string
}

export const NAV_LANGUAGES: NavLanguageOption[] = [
  { code: 'en', bcp47: 'en-NG', label: 'English', flagLabel: 'English' },
  { code: 'pcm', bcp47: 'pcm-NG', label: 'Naija Pidgin', flagLabel: 'Pidgin' },
]

const MANEUVER_TRANSLATIONS: Record<NavLanguage, Record<ManeuverType, string>> = {
  en: {
    straight: 'Continue straight',
    'slight-left': 'Keep left',
    'slight-right': 'Keep right',
    left: 'Turn left',
    right: 'Turn right',
    'sharp-left': 'Make a sharp left',
    'sharp-right': 'Make a sharp right',
    uturn: 'Make a U-turn',
    roundabout: 'Enter the roundabout',
    'highway-enter': 'Merge onto the highway',
    'highway-exit': 'Take the highway exit',
    arrive: "You've arrived at your destination",
  },
  pcm: {
    straight: 'Continue straight',
    'slight-left': 'Hold left small',
    'slight-right': 'Hold right small',
    left: 'Turn left',
    right: 'Turn right',
    'sharp-left': 'Turn sharp left',
    'sharp-right': 'Turn sharp right',
    uturn: 'Make U-turn',
    roundabout: 'Enter di roundabout',
    'highway-enter': 'Enter di expressway',
    'highway-exit': 'Comot for di expressway',
    arrive: 'You don reach your destination',
  },
}

// "onto"/"toward" connector used when folding a road name into a
// maneuver instruction — see describeManeuver() in TurnByTurnCard.tsx.
const CONNECTOR: Record<NavLanguage, { onto: string; toward: string; roundaboutExit: (road: string) => string }> = {
  en: { onto: 'onto', toward: 'toward', roundaboutExit: (r) => `, then take the exit onto ${r}` },
  pcm: { onto: 'go', toward: 'go', roundaboutExit: (r) => `, then comot go ${r}` },
}

/** Instruction text with a road name folded in where we have one — translated equivalent of describeManeuver() in TurnByTurnCard.tsx. */
export function translateManeuverInstruction(
  type: ManeuverType,
  roadName: string | null | undefined,
  lang: NavLanguage,
): string {
  const base = MANEUVER_TRANSLATIONS[lang][type]
  if (type === 'arrive' || !roadName) return base
  const c = CONNECTOR[lang]
  if (type === 'roundabout') return `${base}${c.roundaboutExit(roadName)}`
  if (type === 'highway-enter' || type === 'highway-exit') return `${base} ${c.toward} ${roadName}`
  return `${base} ${c.onto} ${roadName}`
}

// ─── Canned system announcements ───────────────────────────────────────

type Phrases = {
  kmRemaining: (km: number, mins: number) => string
  offRoute: string
  arrived: string
  hazardAhead: (label: string) => string
  heavyTraffic: (label: string) => string
  trafficCleared: string
  approachingDestination: string
  wrongWay: string
  overSpeedLimit: (kph: number) => string
  whereTo: string
  destinationNotFound: string
  destinationSet: (name: string) => string
  maneuverNow: (instruction: string) => string
  maneuverIn: (distance: string, instruction: string) => string
  sharpTurnAhead: string
  roundaboutAhead: string
  uturnAhead: string
  highwayAhead: string
  enteringArea: (area: string) => string
}

const en: Phrases = {
  kmRemaining: (km, mins) =>
    `${km} kilometer${km === 1 ? '' : 's'} remaining. E.T.A. ${mins} minute${mins === 1 ? '' : 's'}.`,
  offRoute: "You've gone off route. Recalculating.",
  arrived: "You've arrived at your destination.",
  hazardAhead: (label) => `Caution: ${label} ahead.`,
  heavyTraffic: (label) => `Heavy traffic ahead. ${label}.`,
  trafficCleared: 'Traffic has cleared up ahead.',
  approachingDestination: 'Approaching your destination.',
  wrongWay: "You're heading the wrong way. Please turn around when it's safe.",
  overSpeedLimit: (kph) => `You're exceeding the ${Math.round(kph)} kilometer per hour speed limit.`,
  whereTo: 'Where would you like to go?',
  destinationNotFound: "Sorry, I couldn't find that place.",
  destinationSet: (name) => `Routing to ${name}.`,
  maneuverNow: (instruction) => `${instruction} now.`,
  maneuverIn: (distance, instruction) => `In ${distance}, ${instruction}.`,
  sharpTurnAhead: 'Sharp turn ahead',
  roundaboutAhead: 'Roundabout ahead',
  uturnAhead: 'U-turn ahead',
  highwayAhead: 'Highway ahead',
  enteringArea: (area) => `You are now in ${area}.`,
}

const pcm: Phrases = {
  kmRemaining: (km, mins) => `${km} kilometer remain. You go reach for ${mins} minutes.`,
  offRoute: 'You don comot from road. We dey find new road.',
  arrived: 'You don reach your destination.',
  hazardAhead: (label) => `Take note: ${label} dey ahead.`,
  heavyTraffic: (label) => `Heavy traffic dey ahead. ${label}.`,
  trafficCleared: 'Road don clear ahead.',
  approachingDestination: 'You dey close to your destination.',
  wrongWay: 'You dey go wrong way. Turn around when e safe.',
  overSpeedLimit: (kph) => `You don pass di ${Math.round(kph)} kilometer per hour speed limit.`,
  whereTo: 'Where you wan go?',
  destinationNotFound: 'Sorry, I no fit find dat place.',
  destinationSet: (name) => `We dey route you go ${name}.`,
  maneuverNow: (instruction) => `${instruction} now now.`,
  maneuverIn: (distance, instruction) => `For ${distance}, ${instruction}.`,
  sharpTurnAhead: 'Sharp turn dey ahead',
  roundaboutAhead: 'Roundabout dey ahead',
  uturnAhead: 'U-turn dey ahead',
  highwayAhead: 'Expressway dey ahead',
  enteringArea: (area) => `You don enter ${area} now.`,
}

const PHRASES: Record<NavLanguage, Phrases> = { en, pcm }

/** Look up the canned-phrase table for a language, falling back to English for an unrecognized code. */
export function phrasesFor(lang: string | null | undefined): Phrases {
  return PHRASES[(lang as NavLanguage) ?? 'en'] ?? en
}

/** Translated equivalent of maneuverWarningLeadIn() in maneuvers.ts. */
export function translateManeuverLeadIn(type: ManeuverType, lang: NavLanguage): string | null {
  const p = phrasesFor(lang)
  if (type === 'sharp-left' || type === 'sharp-right') return p.sharpTurnAhead
  if (type === 'roundabout') return p.roundaboutAhead
  if (type === 'uturn') return p.uturnAhead
  if (type === 'highway-enter' || type === 'highway-exit') return p.highwayAhead
  return null
}

/** Narrows any stored/selected language string down to one of our 2 supported codes, defaulting to English. */
export function toNavLanguage(lang: string | null | undefined): NavLanguage {
  if (!lang) return 'en'
  const short = lang.split('-')[0].toLowerCase()
  if (short === 'pcm') return short
  return 'en'
}
