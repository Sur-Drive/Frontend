import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import {
  classifyLabel,
  boxAreaFraction,
  computeSeverity,
  severityRank,
  STOPPED_POSITION_EPSILON,
  STOPPED_MIN_MS,
  type TrackedObject,
  type BoundingBox,
  type WarningSeverity,
} from '../lib/collisionDetection'

// ─── Collision Guard ───────────────────────────────────────────────
// Forward-collision-warning driver-assist: reads the phone's rear
// (road-facing) camera, runs an on-device object-detection model
// (COCO-SSD, via @tensorflow/tfjs + @tensorflow-models/coco-ssd —
// loaded lazily so nobody pays for it unless they turn this on), and
// turns the raw detections into tracked objects with a proximity/
// closing-speed estimate and a severity level. Everything runs
// on-device — no video frame ever leaves the phone.
//
// NOTE: this feature needs two extra dependencies that aren't part of
// the base app: `@tensorflow/tfjs` and `@tensorflow-models/coco-ssd`.
// Add them to package.json (`npm install @tensorflow/tfjs
// @tensorflow-models/coco-ssd`) — this hook dynamically imports them
// so the rest of the app doesn't pull in TF's ~/1MB+ bundle just to
// plan a route.

type DetectFn = (
  video: HTMLVideoElement,
) => Promise<{ class: string; score: number; bbox: [number, number, number, number] }[]>

interface TrackState {
  category: TrackedObject['category']
  box: BoundingBox
  areaFraction: number
  lastSeenAt: number
  lastChangedAt: number
  history: { t: number; areaFraction: number }[]
}

export interface UseCollisionGuardResult {
  videoRef: RefObject<HTMLVideoElement | null>
  isSupported: boolean
  isStarting: boolean
  isActive: boolean
  error: string | null
  frameSize: { width: number; height: number } | null
  trackedObjects: TrackedObject[]
  /** The single highest-severity object currently in frame, if any — drives the visual/voice warning. */
  activeWarning: TrackedObject | null
  start: () => Promise<void>
  stop: () => void
}

const DETECT_INTERVAL_MS = 220
const MIN_SCORE = 0.55
const STALE_TRACK_MS = 1000
const GROWTH_WINDOW_MS = 900

export function useCollisionGuard(enabled: boolean): UseCollisionGuardResult {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectFnRef = useRef<DetectFn | null>(null)
  const tracksRef = useRef<Map<string, TrackState>>(new Map())
  const rafRef = useRef<number | null>(null)
  const lastRunRef = useRef(0)
  const nextIdRef = useRef(0)
  const stoppedRef = useRef(false)

  const [isSupported] = useState(
    () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
  )
  const [isStarting, setIsStarting] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [frameSize, setFrameSize] = useState<{ width: number; height: number } | null>(null)
  const [trackedObjects, setTrackedObjects] = useState<TrackedObject[]>([])

  const stop = useCallback(() => {
    stoppedRef.current = true
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    tracksRef.current.clear()
    setIsActive(false)
    setIsStarting(false)
    setTrackedObjects([])
    setFrameSize(null)
  }, [])

  const start = useCallback(async () => {
    if (!isSupported || isActive || isStarting) return
    stoppedRef.current = false
    setIsStarting(true)
    setError(null)

    try {
      // Lazy-load TF + the model only when the driver actually turns
      // this on — see the note at the top of the file re: package.json.
      if (!detectFnRef.current) {
        const [tf, cocoSsd] = await Promise.all([
          import('@tensorflow/tfjs'),
          import('@tensorflow-models/coco-ssd'),
        ])
        await tf.ready()
        const model = await cocoSsd.load({ base: 'lite_mobilenet_v2' })
        detectFnRef.current = (video) => model.detect(video)
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream

      const video = videoRef.current
      if (!video) throw new Error('Camera view not ready')
      video.srcObject = stream
      await video.play()

      setFrameSize({ width: video.videoWidth || 640, height: video.videoHeight || 480 })
      setIsActive(true)
      setIsStarting(false)

      const loop = (t: number) => {
        if (stoppedRef.current) return
        rafRef.current = requestAnimationFrame(loop)
        if (t - lastRunRef.current < DETECT_INTERVAL_MS) return
        lastRunRef.current = t
        void runDetection(t)
      }
      rafRef.current = requestAnimationFrame(loop)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not start Collision Guard (camera or model failed to load)'
      setError(message)
      setIsStarting(false)
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, isActive, isStarting, stop])

  const runDetection = useCallback(async (now: number) => {
    const video = videoRef.current
    const detect = detectFnRef.current
    if (!video || !detect || video.readyState < 2) return

    let raw: Awaited<ReturnType<DetectFn>>
    try {
      raw = await detect(video)
    } catch {
      return // a dropped frame isn't fatal — just skip it
    }
    if (stoppedRef.current) return

    const frameW = video.videoWidth || 640
    const frameH = video.videoHeight || 480
    const tracks = tracksRef.current
    const seenIds = new Set<string>()

    for (const det of raw) {
      if (det.score < MIN_SCORE) continue
      const category = classifyLabel(det.class)
      if (!category) continue

      const [x, y, width, height] = det.bbox
      const box: BoundingBox = { x, y, width, height }
      const areaFraction = boxAreaFraction(box, frameW, frameH)
      const cx = x + width / 2
      const cy = y + height / 2

      // Nearest-centroid match against existing tracks of the same
      // category — good enough for a single-lane forward-facing view
      // where objects don't usually cross paths within one detection
      // tick (~220ms).
      let bestId: string | null = null
      let bestDist = Infinity
      tracks.forEach((track, id) => {
        if (track.category !== category) return
        const tcx = track.box.x + track.box.width / 2
        const tcy = track.box.y + track.box.height / 2
        const dist = Math.hypot((cx - tcx) / frameW, (cy - tcy) / frameH)
        if (dist < bestDist) {
          bestDist = dist
          bestId = id
        }
      })

      const id = bestDist < 0.25 && bestId ? bestId : `t${nextIdRef.current++}`
      seenIds.add(id)

      const prev = tracks.get(id)
      const moved =
        !prev ||
        Math.abs(prev.box.x - x) / frameW > STOPPED_POSITION_EPSILON ||
        Math.abs(prev.box.y - y) / frameH > STOPPED_POSITION_EPSILON ||
        Math.abs(prev.areaFraction - areaFraction) > STOPPED_POSITION_EPSILON

      const history = prev ? [...prev.history, { t: now, areaFraction }] : [{ t: now, areaFraction }]
      const trimmed = history.filter((h) => now - h.t <= GROWTH_WINDOW_MS)

      tracks.set(id, {
        category,
        box,
        areaFraction,
        lastSeenAt: now,
        lastChangedAt: moved || !prev ? now : prev.lastChangedAt,
        history: trimmed,
      })
    }

    // Drop tracks we haven't seen in a while (object left frame).
    tracks.forEach((track, id) => {
      if (now - track.lastSeenAt > STALE_TRACK_MS) tracks.delete(id)
    })

    const result: TrackedObject[] = []
    tracks.forEach((track, id) => {
      if (!seenIds.has(id)) return // stale this tick, still within grace window — skip rendering

      const oldest = track.history[0]
      const elapsedS = Math.max(0.05, (now - oldest.t) / 1000)
      const growthRate = (track.areaFraction - oldest.areaFraction) / elapsedS

      const isStopped = now - track.lastChangedAt >= STOPPED_MIN_MS
      const severity: WarningSeverity = computeSeverity(track.areaFraction, growthRate)
      const isCollisionHazard = severity !== 'low' && growthRate > 0.05 && !isStopped

      result.push({
        id,
        category: track.category,
        label: track.category,
        box: track.box,
        areaFraction: track.areaFraction,
        growthRate,
        isStopped,
        isCollisionHazard,
        severity: isStopped && !isCollisionHazard ? 'medium' : severity,
      })
    })

    result.sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    setTrackedObjects(result)
  }, [])

  useEffect(() => {
    if (enabled) {
      void start()
    } else {
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  useEffect(() => stop, [stop])

  const activeWarning =
    trackedObjects.find((o) => o.isCollisionHazard) ??
    trackedObjects.find((o) => o.severity !== 'low') ??
    null

  return {
    videoRef,
    isSupported,
    isStarting,
    isActive,
    error,
    frameSize,
    trackedObjects,
    activeWarning,
    start,
    stop,
  }
}
