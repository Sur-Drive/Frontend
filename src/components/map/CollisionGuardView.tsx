import { useEffect, useRef } from 'react'
import { CATEGORY_LABEL, type TrackedObject, type WarningSeverity } from '../../lib/collisionDetection'
import type { UseCollisionGuardResult } from '../../hooks/useCollisionGuard'

const SEVERITY_COLOR: Record<WarningSeverity, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
}

interface CollisionGuardViewProps {
  guard: UseCollisionGuardResult
  /** Small picture-in-picture (default) or a full-bleed panel. */
  expanded?: boolean
  onToggleExpanded?: () => void
  onClose?: () => void
}

/** Visual warning + live camera PiP with detection boxes drawn over it. */
export default function CollisionGuardView({
  guard,
  expanded = false,
  onToggleExpanded,
  onClose,
}: CollisionGuardViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { videoRef, isStarting, isActive, error, frameSize, trackedObjects, activeWarning } = guard

  // Redraw bounding boxes onto the canvas every time detections update.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !frameSize) return
    canvas.width = frameSize.width
    canvas.height = frameSize.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    trackedObjects.forEach((obj: TrackedObject) => {
      const color = SEVERITY_COLOR[obj.severity]
      const { x, y, width, height } = obj.box
      ctx.lineWidth = obj.isCollisionHazard ? 4 : 2
      ctx.strokeStyle = color
      ctx.strokeRect(x, y, width, height)

      const label = `${CATEGORY_LABEL[obj.category]}${obj.isStopped ? ' · stopped' : ''}`
      ctx.font = '16px sans-serif'
      const textWidth = ctx.measureText(label).width
      ctx.fillStyle = color
      ctx.fillRect(x, Math.max(0, y - 20), textWidth + 8, 20)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(label, x + 4, Math.max(14, y - 5))
    })
  }, [trackedObjects, frameSize])

  const sizeClasses = expanded
    ? 'inset-0 rounded-none'
    : 'bottom-4 left-4 w-36 h-48 sm:w-44 sm:h-56 rounded-2xl'

  return (
    <div
      className={`absolute z-[450] overflow-hidden bg-black shadow-2xl ${sizeClasses} border-2 transition-all`}
      style={{ borderColor: activeWarning ? SEVERITY_COLOR[activeWarning.severity] : 'rgba(255,255,255,0.25)' }}
    >
      <video ref={videoRef} muted playsInline className="absolute inset-0 object-cover w-full h-full" />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 object-cover w-full h-full"
        style={{ objectFit: 'cover' }}
      />

      {/* Header chrome */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-1.5 bg-gradient-to-b from-black/70 to-transparent">
        <span className="text-[10px] font-semibold tracking-wide text-white/90">
          COLLISION GUARD
        </span>
        <div className="flex items-center gap-1">
          {onToggleExpanded && (
            <button
              onClick={onToggleExpanded}
              aria-label={expanded ? 'Shrink' : 'Expand'}
              className="flex items-center justify-center text-white rounded-full w-5 h-5 bg-white/20"
            >
              <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                {expanded ? <path d="M4 4l6 6M20 4l-6 6M4 20l6-6M20 20l-6-6" /> : <path d="M4 4h6M4 4v6M20 4h-6M20 4v6M4 20h6M4 20v-6M20 20h-6M20 20v-6" />}
              </svg>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Turn off Collision Guard"
              className="flex items-center justify-center text-white rounded-full w-5 h-5 bg-white/20"
            >
              <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {(isStarting || error) && (
        <div className="absolute inset-0 flex items-center justify-center px-3 text-center">
          {error ? (
            <p className="text-[10px] font-medium text-red-300">{error}</p>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-white rounded-full border-t-transparent animate-spin" />
              <p className="text-[10px] text-white/80">Starting camera…</p>
            </div>
          )}
        </div>
      )}

      {/* Live severity strip at the bottom */}
      {isActive && activeWarning && (
        <div
          className="absolute bottom-0 left-0 right-0 px-2 py-1 text-[10px] font-semibold text-white text-center"
          style={{ backgroundColor: SEVERITY_COLOR[activeWarning.severity] }}
        >
          {CATEGORY_LABEL[activeWarning.category]}
          {activeWarning.isCollisionHazard ? ' — risk' : activeWarning.isStopped ? ' — stopped' : ''}
        </div>
      )}
    </div>
  )
}
