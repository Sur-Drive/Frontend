import type { ManeuverStep, ManeuverType } from '../../lib/maneuvers'
import { formatManeuverDistance } from '../../lib/maneuvers'

// Rotation (degrees) applied to the base "straight up" arrow for
// directional maneuvers — everything that isn't one of the special-shaped
// icons (U-turn, roundabout, highway, arrive) below.
const ARROW_ROTATION: Partial<Record<ManeuverType, number>> = {
  straight: 0,
  'slight-left': -30,
  'slight-right': 30,
  left: -75,
  right: 75,
  'sharp-left': -120,
  'sharp-right': 120,
}

function ManeuverIcon({ type, className }: { type: ManeuverType; className?: string }) {
  if (type === 'arrive') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    )
  }

  if (type === 'uturn') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 20V10a5 5 0 0 1 10 0v3" />
        <path d="M14 9l4 4 4-4" />
      </svg>
    )
  }

  if (type === 'roundabout') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="6" />
        <path d="M12 3v4" />
        <path d="M12 3l-2.5 2.5" />
        <path d="M12 3l2.5 2.5" />
      </svg>
    )
  }

  if (type === 'highway-enter' || type === 'highway-exit') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V4" />
        {type === 'highway-enter' ? <path d="M4 12l6 4V8z" /> : <path d="M20 12l-6-4v8z" />}
      </svg>
    )
  }

  // straight / slight-left / slight-right / left / right / sharp-left / sharp-right
  const rotation = ARROW_ROTATION[type] ?? 0
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  )
}

export interface TurnByTurnCardProps {
  step: ManeuverStep
  distanceMeters: number
  currentRoadName?: string | null
  nextRoadName?: string | null
  className?: string
}

/** Instruction text with a road name folded in where we have one, e.g. "Turn left onto Whittier Street". */
export function describeManeuver(step: ManeuverStep, roadName?: string | null): string {
  if (step.type === 'arrive') return step.instruction
  if (!roadName) return step.instruction
  if (step.type === 'roundabout') return `${step.instruction}, then take the exit onto ${roadName}`
  if (step.type === 'highway-enter' || step.type === 'highway-exit') return `${step.instruction} toward ${roadName}`
  return `${step.instruction} onto ${roadName}`
}

export default function TurnByTurnCard({ step, distanceMeters, currentRoadName, nextRoadName, className = '' }: TurnByTurnCardProps) {
  const isArrive = step.type === 'arrive'

  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-gray-900 shadow-lg rounded-2xl ${className}`}>
      <div className="flex items-center justify-center flex-shrink-0 text-white bg-white/15 rounded-xl w-11 h-11 sm:w-12 sm:h-12">
        <ManeuverIcon type={step.type} className="w-6 h-6 sm:w-7 sm:h-7" />
      </div>
      <div className="flex-1 min-w-0">
        {!isArrive && (
          <p className="text-xs font-semibold tracking-wide text-white/70">{formatManeuverDistance(distanceMeters)}</p>
        )}
        <p className="text-[15px] sm:text-base font-bold leading-tight text-white truncate">
          {describeManeuver(step, nextRoadName)}
        </p>
        {currentRoadName && !isArrive && (
          <p className="text-[11px] sm:text-xs text-white/60 truncate">On {currentRoadName}</p>
        )}
      </div>
    </div>
  )
}
