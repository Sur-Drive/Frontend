import { useEffect, useMemo, useState } from 'react'
import { PLACE_CATEGORIES } from '../../types/places'
import type { PlaceResult } from '../../types/places'
import { fetchPlaceDetails } from '../../lib/placesSearch'
import { isYouTubeConfigured, searchPlaceVideo } from '../../lib/youtube'

interface PlaceDetailSheetProps {
  place: PlaceResult
  onClose: () => void
  /** Opens the full-screen Street View panorama centered on this place. */
  onOpenStreetView?: () => void
  /**
   * Routes to this place using the app's own in-app map/turn-by-turn
   * flow instead of handing the trip off to Google Maps.
   */
  onGetDirections: () => void
}

const PRICE_LEVEL_LABEL: Record<number, string> = {
  0: 'Free',
  1: '$',
  2: '$$',
  3: '$$$',
  4: '$$$$',
}

type MainTab = 'overview' | 'photos' | 'reviews'

// Matches Date#getDay() (0 = Sunday) against the index Google's
// weekday_text array uses (0 = Monday), so "today" highlights correctly
// regardless of what day it is.
function todayWeekdayIndex(): number {
  return (new Date().getDay() + 6) % 7
}

export default function PlaceDetailSheet({
  place: initialPlace,
  onClose,
  onOpenStreetView,
  onGetDirections,
}: PlaceDetailSheetProps) {
  const [place, setPlace] = useState(initialPlace)
  const [activePhoto, setActivePhoto] = useState(0)
  const [activeVideo, setActiveVideo] = useState(0)
  const [mediaTab, setMediaTab] = useState<'photos' | 'videos'>('photos')
  const [mainTab, setMainTab] = useState<MainTab>('overview')
  const [hoursExpanded, setHoursExpanded] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  // undefined = not looked up yet, null = looked up but no match found,
  // string = found. Collapsing "no match" into the same value as "not
  // looked up yet" would make the effect below refetch on every render.
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null | undefined>(undefined)
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)
  const videoUrls = place.videoUrls ?? []
  const reviews = place.reviews ?? []
  const weekdayHours = place.weekdayHours ?? []

  // New place selected — show what we already have (from the nearby-search
  // result, or a manual pin's reverse-geocoded address) immediately, then
  // fetch the fuller detail set underneath. Manual pins (isPinned) have no
  // real place_id to look up — fetchPlaceDetails would just resolve empty,
  // so skip the call entirely for those.
  useEffect(() => {
    setPlace(initialPlace)
    setActivePhoto(0)
    setActiveVideo(0)
    setMediaTab('photos')
    setMainTab('overview')
    setHoursExpanded(false)
    setYoutubeVideoId(undefined)
    setIsLoadingVideo(false)

    if (initialPlace.isPinned) {
      setIsLoadingDetails(false)
      return
    }

    let cancelled = false
    setIsLoadingDetails(true)

    fetchPlaceDetails(initialPlace.id)
      .then((details) => {
        if (cancelled) return
        setPlace((prev) => ({
          ...prev,
          ...details,
          // Prefer the richer detail-call photo set when it returned any.
          photoUrls: details.photoUrls?.length ? details.photoUrls : prev.photoUrls,
        }))
      })
      .catch((err) => {
        console.error('[places] failed to load place details', err)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDetails(false)
      })

    return () => {
      cancelled = true
    }
  }, [initialPlace])

  // Only looked up once the user actually opens the Videos tab, and only
  // when there's no business-submitted clip already — each YouTube search
  // costs real API quota (see lib/youtube.ts), so this avoids spending it
  // on places nobody looks at.
  useEffect(() => {
    if (
      mediaTab !== 'videos' ||
      place.isPinned ||
      videoUrls.length > 0 ||
      youtubeVideoId !== undefined ||
      isLoadingVideo ||
      !isYouTubeConfigured()
    ) {
      return
    }

    let cancelled = false
    setIsLoadingVideo(true)

    searchPlaceVideo(place.id, place.name, place.lat, place.lng)
      .then((videoId) => {
        if (!cancelled) setYoutubeVideoId(videoId)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingVideo(false)
      })

    return () => {
      cancelled = true
    }
  }, [mediaTab, place.id, place.isPinned, videoUrls.length, youtubeVideoId, isLoadingVideo])

  const categoryLabel = place.isPinned
    ? 'Pinned location'
    : (PLACE_CATEGORIES.find((c) => c.key === place.category)?.label ?? 'Place')

  const todayHoursLine = useMemo(() => {
    if (weekdayHours.length !== 7) return null
    return weekdayHours[todayWeekdayIndex()] ?? null
  }, [weekdayHours])

  const availableTabs = useMemo(() => {
    const tabs: MainTab[] = ['overview']
    if (place.photoUrls.length > 0 || videoUrls.length > 0) tabs.push('photos')
    if (reviews.length > 0) tabs.push('reviews')
    return tabs
  }, [place.photoUrls.length, videoUrls.length, reviews.length])

  return (
    <div>
      {/* Hero photo — tapping it jumps straight to the full gallery, same
          as tapping the header image on a Google Maps place page. */}
      <div className="relative w-full bg-gray-200 h-40">
        {place.photoUrls.length > 0 ? (
          <button
            className="block w-full h-full"
            onClick={() => setMainTab('photos')}
            aria-label="View photos"
          >
            <img
              src={place.photoUrls[0]}
              alt={place.name}
              className="object-cover w-full h-full"
              loading="lazy"
            />
          </button>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full gap-1 text-[13px] text-gray-400">
            <span>No photo available</span>
            {place.isPinned && (
              <span className="text-[11px] text-gray-400">
                This is a dropped pin, not a listed place
              </span>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute flex items-center justify-center w-9 h-9 text-gray-700 rounded-full shadow top-3 right-3 bg-white/90"
          aria-label="Close"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="px-5 pt-3 pb-1">
        <h2 className="text-[20px] font-extrabold leading-tight text-gray-900">
          {place.name}
        </h2>

        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[13px] text-gray-600">
          <span className="font-medium text-gray-500">{categoryLabel}</span>

          {place.rating !== null && (
            <>
              <Dot />
              <button
                className="flex items-center gap-0.5 font-semibold text-gray-900"
                onClick={() => reviews.length > 0 && setMainTab('reviews')}
              >
                <StarIcon />
                {place.rating.toFixed(1)}
              </button>
              {place.userRatingCount !== null && (
                <button
                  className="text-gray-400 underline-offset-2 hover:underline"
                  onClick={() => reviews.length > 0 && setMainTab('reviews')}
                >
                  ({place.userRatingCount})
                </button>
              )}
            </>
          )}

          {place.priceLevel !== null && PRICE_LEVEL_LABEL[place.priceLevel] && (
            <>
              <Dot />
              <span>{PRICE_LEVEL_LABEL[place.priceLevel]}</span>
            </>
          )}

          {place.isOpenNow !== null && (
            <>
              <Dot />
              <span
                className={
                  place.isOpenNow
                    ? 'font-semibold text-emerald-600'
                    : 'font-semibold text-red-500'
                }
              >
                {place.isOpenNow ? 'Open now' : 'Closed'}
              </span>
            </>
          )}
        </div>

        {place.address && (
          <p className="mt-2 text-[13px] text-gray-600">{place.address}</p>
        )}
      </div>

      <div className="flex gap-3 px-5 pt-3 pb-4">
        <button
          onClick={onGetDirections}
          className="flex items-center justify-center flex-1 text-sm font-semibold text-white transition-colors bg-[#6E43A3] rounded-full h-11 hover:bg-[#5c3789]"
        >
          Directions
        </button>

        {place.phone && (
          <a
            href={`tel:${place.phone}`}
            className="flex items-center justify-center text-gray-700 transition-colors bg-gray-100 rounded-full w-11 h-11 hover:bg-gray-200"
            aria-label="Call"
          >
            <PhoneIcon />
          </a>
        )}

        {place.website && (
          <a
            href={place.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center text-gray-700 transition-colors bg-gray-100 rounded-full w-11 h-11 hover:bg-gray-200"
            aria-label="Website"
          >
            <WebsiteIcon />
          </a>
        )}

        {/* Street View — the closest thing to "walk up and look at it"
            for any tapped point, including manual pins that have no
            Google photos of their own. */}
        {onOpenStreetView && (
          <button
            onClick={onOpenStreetView}
            className="flex items-center justify-center text-gray-700 transition-colors bg-gray-100 rounded-full w-11 h-11 hover:bg-gray-200"
            aria-label="Street View"
          >
            <PegmanIcon />
          </button>
        )}
      </div>

      {/* Main tabs — mirrors the Overview / Reviews / About row Google
          Maps shows on its own place pages. A tab is only shown once
          there's actually something to put in it. */}
      {availableTabs.length > 1 && (
        <div className="flex gap-1.5 px-5 border-b border-gray-100">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setMainTab(tab)}
              className={`px-3 py-2 text-[13px] font-semibold capitalize border-b-2 -mb-px transition-colors ${
                mainTab === tab
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400'
              }`}
            >
              {tab === 'reviews' ? `Reviews (${reviews.length})` : tab}
            </button>
          ))}
        </div>
      )}

      {mainTab === 'overview' && (
        <div className="px-5 py-4">
          {place.description && (
            <p className="text-[13px] leading-relaxed text-gray-700">
              {place.description}
            </p>
          )}

          {weekdayHours.length === 7 && (
            <div className={place.description ? 'mt-4' : ''}>
              <button
                onClick={() => setHoursExpanded((v) => !v)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="text-[13px] font-semibold text-gray-900">
                  {place.isOpenNow !== null && (
                    <span
                      className={
                        place.isOpenNow ? 'text-emerald-600' : 'text-red-500'
                      }
                    >
                      {place.isOpenNow ? 'Open now' : 'Closed'}
                    </span>
                  )}
                  {todayHoursLine && (
                    <span className="ml-1.5 font-normal text-gray-500">
                      · {todayHoursLine.replace(/^[A-Za-z]+:\s*/, '')}
                    </span>
                  )}
                </span>
                <ChevronIcon expanded={hoursExpanded} />
              </button>

              {hoursExpanded && (
                <ul className="mt-2 space-y-1">
                  {weekdayHours.map((line, i) => (
                    <li
                      key={i}
                      className={`text-[12.5px] flex justify-between gap-3 ${
                        i === todayWeekdayIndex()
                          ? 'font-semibold text-gray-900'
                          : 'text-gray-500'
                      }`}
                    >
                      <span>{line.split(': ')[0]}</span>
                      <span>{line.split(': ').slice(1).join(': ')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {place.phone && (
            <div className="flex items-center gap-2.5 mt-4 text-[13px] text-gray-700">
              <PhoneIcon />
              <span>{place.phone}</span>
            </div>
          )}

          {place.website && (
            <div className="flex items-center gap-2.5 mt-2.5 text-[13px] text-blue-600 truncate">
              <WebsiteIcon />
              <a href={place.website} target="_blank" rel="noopener noreferrer" className="truncate">
                {place.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          {reviews.length > 0 && (
            <button
              onClick={() => setMainTab('reviews')}
              className="flex items-center gap-1 mt-4 text-[13px] font-semibold text-gray-900"
            >
              <StarIcon />
              {place.rating?.toFixed(1)} · See all {place.userRatingCount ?? reviews.length} reviews
            </button>
          )}

          {!place.description &&
            weekdayHours.length === 0 &&
            !place.phone &&
            !place.website &&
            reviews.length === 0 && (
              <p className="text-[13px] text-gray-400">
                No further details available for this place.
              </p>
            )}
        </div>
      )}

      {mainTab === 'photos' && (
        <div>
          {(place.photoUrls.length > 0 &&
            (videoUrls.length > 0 ||
              (isYouTubeConfigured() && !place.isPinned))) && (
            <div className="flex gap-1.5 px-5 pt-3">
              <button
                onClick={() => setMediaTab('photos')}
                className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-colors ${
                  mediaTab === 'photos' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Photos
              </button>
              <button
                onClick={() => setMediaTab('videos')}
                className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-colors ${
                  mediaTab === 'videos' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Videos
              </button>
            </div>
          )}

          {mediaTab === 'photos' ? (
            <>
              <div className="relative w-full bg-gray-200 h-44 mt-3">
                {place.photoUrls.length > 0 ? (
                  <img
                    src={place.photoUrls[activePhoto]}
                    alt={place.name}
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-[13px] text-gray-400">
                    No photo available
                  </div>
                )}

                {place.photoUrls.length > 1 && (
                  <div className="absolute flex gap-1 -translate-x-1/2 bottom-2 left-1/2">
                    {place.photoUrls.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePhoto(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          i === activePhoto ? 'bg-white' : 'bg-white/50'
                        }`}
                        aria-label={`Photo ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {place.photoUrls.length > 1 && (
                <div className="flex gap-2 px-5 py-3 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {place.photoUrls.map((src, i) => (
                    <button key={i} onClick={() => setActivePhoto(i)} className="flex-shrink-0">
                      <img
                        src={src}
                        alt={`${place.name} ${i + 1}`}
                        className={`object-cover w-16 h-16 rounded-xl transition-opacity ${
                          i === activePhoto ? 'ring-2 ring-offset-1 ring-red-500' : 'opacity-75'
                        }`}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="relative w-full bg-gray-900 h-44 mt-3">
                {videoUrls.length > 0 ? (
                  <video
                    key={videoUrls[activeVideo]}
                    src={videoUrls[activeVideo]}
                    controls
                    className="object-cover w-full h-full"
                  />
                ) : youtubeVideoId ? (
                  <iframe
                    key={youtubeVideoId}
                    src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
                    title={`${place.name} video`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : isLoadingVideo ? (
                  <div className="flex flex-col items-center justify-center w-full h-full gap-1.5 text-gray-300">
                    <PlayIcon />
                    <span className="text-[13px] font-medium">Looking for a video…</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full gap-1.5 text-gray-300">
                    <PlayIcon />
                    <span className="text-[13px] font-medium">No videos yet</span>
                    <span className="text-[11px] text-gray-400 px-6 text-center">
                      This place doesn't have any video clips submitted yet
                    </span>
                  </div>
                )}

                {videoUrls.length > 1 && (
                  <div className="absolute flex gap-1 -translate-x-1/2 bottom-2 left-1/2">
                    {videoUrls.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveVideo(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          i === activeVideo ? 'bg-white' : 'bg-white/50'
                        }`}
                        aria-label={`Video ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {videoUrls.length > 1 && (
                <div className="flex gap-2 px-5 py-3 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {videoUrls.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveVideo(i)}
                      className={`flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-xl bg-gray-800 transition-opacity ${
                        i === activeVideo ? 'ring-2 ring-offset-1 ring-red-500' : 'opacity-75'
                      }`}
                    >
                      <PlayIcon small />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {mainTab === 'reviews' && (
        <div className="px-5 py-4">
          {place.rating !== null && (
            <div className="flex items-center gap-3 pb-4 mb-1 border-b border-gray-100">
              <span className="text-[32px] font-extrabold leading-none text-gray-900">
                {place.rating.toFixed(1)}
              </span>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <StarIcon
                      key={i}
                      filled={i <= Math.round(place.rating ?? 0)}
                    />
                  ))}
                </div>
                {place.userRatingCount !== null && (
                  <span className="text-[12px] text-gray-500">
                    {place.userRatingCount} reviews
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {reviews.map((review, i) => (
              <div key={i} className="flex gap-3">
                {review.authorPhotoUrl ? (
                  <img
                    src={review.authorPhotoUrl}
                    alt={review.authorName}
                    className="flex-shrink-0 w-9 h-9 rounded-full"
                  />
                ) : (
                  <div className="flex items-center justify-center flex-shrink-0 w-9 h-9 text-[13px] font-semibold text-gray-500 bg-gray-200 rounded-full">
                    {review.authorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[13px] font-semibold text-gray-900 truncate">
                      {review.authorName}
                    </span>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {review.relativeTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <StarIcon key={i} small filled={i <= review.rating} />
                    ))}
                  </div>
                  {review.text && (
                    <p className="mt-1 text-[13px] leading-relaxed text-gray-700">
                      {review.text}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoadingDetails && (
        <div className="px-5 pb-4 text-[11px] text-gray-400">
          Loading more details…
        </div>
      )}
    </div>
  )
}

function Dot() {
  return <span className="text-gray-300">·</span>
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function StarIcon({ small = false, filled = true }: { small?: boolean; filled?: boolean }) {
  const size = small ? 'w-3 h-3' : 'w-3.5 h-3.5'
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${size} ${filled ? 'text-amber-400' : 'text-gray-200'}`}
      fill="currentColor"
    >
      <path d="M12 2l2.9 6.6L22 9.3l-5 4.9 1.2 7.1L12 17.8l-6.2 3.5L7 14.2 2 9.3l7.1-.7z" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8.1 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.9 2.2z" />
    </svg>
  )
}

// Street View entry point icon — a plain panorama/photo glyph rather
// than a cartoon "pegman" figure, matching the neutral, grown-up icon
// language of the Call/Website buttons either side of it.
function PegmanIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="4.5" width="19" height="15" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8.7" cy="9.6" r="1.5" fill="currentColor" />
      <path
        d="M4.3 16.8 9 11.6l3.3 2.8 3-3.9 4.4 5.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PlayIcon({ small = false }: { small?: boolean }) {
  const size = small ? 20 : 32
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function WebsiteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}
