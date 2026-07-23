import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cumulativeDistances, pointAtFraction, type LatLng, type PathSample } from '../lib/geoPath'

export interface UseRouteAnimationOptions {
  path: LatLng[]
  /** wall-clock time to animate the full route once, in ms */
  durationMs?: number
  autoPlay?: boolean
  loop?: boolean
}

export interface RouteAnimationState extends PathSample {
  /** 0-1 */
  progress: number
  isPlaying: boolean
  play: () => void
  pause: () => void
  toggle: () => void
  /** restart from the beginning (keeps current play/pause state) */
  reset: () => void
  /** jump to an arbitrary point in the route, 0-1 */
  seek: (fraction: number) => void
}

/**
 * Drives a 0-1 "progress along the route" value with requestAnimationFrame,
 * independent of any map SDK — AnimatedRoutePolyline (or any other
 * renderer) just reads `progress`/`position`/`heading` each frame. Kept
 * separate from the Google Maps component so the same progress engine can
 * back a demo/simulated trip today and a real GPS-driven trip later
 * (swap the driver, keep every consumer of `progress` unchanged).
 */
export function useRouteAnimation({
  path,
  durationMs = 15000,
  autoPlay = true,
  loop = true,
}: UseRouteAnimationOptions): RouteAnimationState {
  const cum = useMemo(() => cumulativeDistances(path), [path])

  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay && path.length > 1)

  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const pausedElapsedRef = useRef(0)

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const tick = useCallback(
    (now: number) => {
      if (startRef.current == null) startRef.current = now

      const elapsed = pausedElapsedRef.current + (now - startRef.current)
      let fraction = durationMs > 0 ? elapsed / durationMs : 1

      if (fraction >= 1) {
        if (loop) {
          fraction = fraction % 1
          pausedElapsedRef.current = 0
          startRef.current = now
        } else {
          fraction = 1
          setProgress(1)
          setIsPlaying(false)
          stopLoop()
          return
        }
      }

      setProgress(fraction)
      rafRef.current = requestAnimationFrame(tick)
    },
    [durationMs, loop, stopLoop]
  )

  const play = useCallback(() => {
    if (path.length < 2) return
    startRef.current = null
    setIsPlaying(true)
  }, [path.length])

  const pause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const toggle = useCallback(() => {
    setIsPlaying((p) => !p)
  }, [])

  const reset = useCallback(() => {
    pausedElapsedRef.current = 0
    startRef.current = null
    setProgress(0)
  }, [])

  const seek = useCallback(
    (fraction: number) => {
      const clamped = Math.min(1, Math.max(0, fraction))
      pausedElapsedRef.current = clamped * durationMs
      startRef.current = null
      setProgress(clamped)
    },
    [durationMs]
  )

  useEffect(() => {
    if (!isPlaying) {
      // record how far we'd gotten so a later play() resumes, not restarts
      if (startRef.current != null) {
        pausedElapsedRef.current += performance.now() - startRef.current
        startRef.current = null
      }
      stopLoop()
      return
    }

    rafRef.current = requestAnimationFrame(tick)

    return stopLoop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, tick])

  // path changed out from under us (new route/mode selected) — restart clean
  useEffect(() => {
    pausedElapsedRef.current = 0
    startRef.current = null
    setProgress(0)
    setIsPlaying(autoPlay && path.length > 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path])

  const sample = pointAtFraction(path, cum, progress)

  return {
    ...sample,
    progress,
    isPlaying,
    play,
    pause,
    toggle,
    reset,
    seek,
  }
}
