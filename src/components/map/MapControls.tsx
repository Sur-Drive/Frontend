import { useEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";

export type MapTypeId = "roadmap" | "satellite" | "terrain";

interface MapControlsProps {
  /** The live google.maps.Map instance, once GoogleMapView has created it. Zoom buttons are disabled until this is set. */
  map: google.maps.Map | null;
  mapTypeId: MapTypeId;
  onMapTypeChange: (id: MapTypeId) => void;
  /** 0 = flat, 45 = tilted "3D" nav view. */
  tilt: number;
  onToggleTilt: () => void;
  /** Current compass bearing shown on the map (0 = north-up). */
  heading: number;
  onHeadingChange: (heading: number) => void;
  /** Whether the compass can be dragged to rotate / tapped to reset. Disable while a live trip is auto-driving the heading. */
  rotatable: boolean;
  onRecenter: () => void;
  isLocating?: boolean;
  /** Element to enter/exit full screen. */
  fullscreenTargetRef: RefObject<HTMLElement>;
  /** Positioning classes for the floating button (ignored when `inline`). */
  className?: string;
  /** Whether the live traffic (congestion) layer is currently shown on the map. */
  trafficEnabled: boolean;
  onToggleTraffic: () => void;

  /**
   * Render the single button in normal flow (e.g. inside the page header, where the
   * bell used to be) instead of absolutely positioned. The panel then opens downward.
   */
  inline?: boolean;
  /** Shows a tile + a red dot on the button when there are unread notifications. Omit `onNotifications` to hide the tile. */
  onNotifications?: () => void;
  hasUnread?: boolean;
  /** Shows a "Voice search" tile. Omit `onVoiceSearch` to hide it. */
  onVoiceSearch?: () => void;
  voiceStatus?: "idle" | "listening" | "searching";
}

const PURPLE = "#6E43A3";

export default function MapControls({
  map,
  mapTypeId,
  onMapTypeChange,
  tilt,
  onToggleTilt,
  heading,
  onHeadingChange,
  rotatable,
  onRecenter,
  isLocating = false,
  fullscreenTargetRef,
  className = "",
  trafficEnabled,
  onToggleTraffic,
  inline = false,
  onNotifications,
  hasUnread = false,
  onVoiceSearch,
  voiceStatus = "idle",
}: MapControlsProps) {
  const [open, setOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const close = () => {
    setOpen(false);
    setLayersOpen(false);
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const zoomBy = (delta: number) => {
    if (!map) return;
    const current = map.getZoom() ?? 15;
    map.setZoom(Math.max(3, Math.min(20, current + delta)));
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await fullscreenTargetRef.current?.requestFullscreen?.();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Full screen isn't supported/permitted in this browser — no-op
    }
  };

  const wrapperClass = inline
    ? "relative flex-shrink-0"
    : `absolute z-[400] right-4 sm:right-8 transition-[bottom] ${className}`;

  // Inline (header) → panel drops down. Floating (bottom-anchored) → panel opens upward.
  const panelPosition = inline
    ? "top-full mt-2 origin-top-right"
    : "bottom-full mb-2 origin-bottom-right max-h-[50dvh]";

  return (
    <div className={wrapperClass}>
      <style>{`
        @keyframes mapControlsPop { from { opacity: 0; transform: scale(.92) } to { opacity: 1; transform: scale(1) } }
        @media (prefers-reduced-motion: reduce) { .map-controls-panel { animation: none !important } }
      `}</style>

      {/* The one button */}
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={open ? "Close map tools" : "Open map tools"}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Map tools"
        className={`relative flex items-center justify-center flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shadow-lg transition ${
          open ? "text-white" : "bg-white text-gray-700"
        }`}
        style={open ? { backgroundColor: PURPLE } : undefined}
      >
        {open ? (
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <circle cx="6" cy="6" r="2" />
            <circle cx="12" cy="6" r="2" />
            <circle cx="18" cy="6" r="2" />
            <circle cx="6" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="18" cy="12" r="2" />
            <circle cx="6" cy="18" r="2" />
            <circle cx="12" cy="18" r="2" />
            <circle cx="18" cy="18" r="2" />
          </svg>
        )}
        {hasUnread && !open && (
          <span className="absolute w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full top-2 right-2" />
        )}
      </button>

      {open && (
        <>
          {/* Tap outside to close */}
          <div
            className="fixed inset-0 z-[1]"
            onClick={close}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-label="Map tools"
            className={`map-controls-panel absolute right-0 z-[2] w-[17rem] max-w-[calc(100vw-2rem)] overflow-y-auto bg-white shadow-2xl rounded-2xl p-3 ${panelPosition}`}
            style={{ animation: "mapControlsPop 140ms ease-out" }}
          >
            <div className="grid grid-cols-3 gap-y-3 gap-x-1">
              {onNotifications && (
                <Tile
                  label="Alerts"
                  badge={hasUnread}
                  onClick={() => {
                    close();
                    onNotifications();
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="currentColor"
                  >
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                  </svg>
                </Tile>
              )}

              {onVoiceSearch && (
                <Tile
                  label={
                    voiceStatus === "listening"
                      ? "Listening…"
                      : voiceStatus === "searching"
                        ? "Finding…"
                        : "Voice search"
                  }
                  active={voiceStatus !== "idle"}
                  pulse={voiceStatus !== "idle"}
                  purple
                  onClick={() => {
                    close();
                    onVoiceSearch();
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
                  </svg>
                </Tile>
              )}

              <Tile
                label={isFullscreen ? "Exit full screen" : "Full screen"}
                onClick={() => {
                  close();
                  toggleFullscreen();
                }}
              >
                {isFullscreen ? (
                  <svg
                    viewBox="0 0 24 24"
                    width="19"
                    height="19"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 3v4a2 2 0 0 1-2 2H3M21 9h-4a2 2 0 0 1-2-2V3M3 15h4a2 2 0 0 1 2 2v4M15 21v-4a2 2 0 0 1 2-2h4" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    width="19"
                    height="19"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                )}
              </Tile>

              <CompassTile
                heading={heading}
                onHeadingChange={onHeadingChange}
                rotatable={rotatable}
                onReset={() => onHeadingChange(0)}
              />

              <Tile
                label="Map layers"
                active={layersOpen || trafficEnabled}
                purple
                onClick={() => setLayersOpen((v) => !v)}
                expanded={layersOpen}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2 2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </Tile>

              <Tile
                label="My location"
                purple
                onClick={() => {
                  close();
                  onRecenter();
                }}
              >
                {isLocating ? (
                  <div className="w-4 h-4 border-2 border-purple-600 rounded-full border-t-transparent animate-spin" />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                    <circle cx="12" cy="12" r="7" />
                    <circle
                      cx="12"
                      cy="12"
                      r="2.5"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                )}
              </Tile>

              {/* Zoom stays open so you can tap it repeatedly */}
              <Tile label="Zoom in" disabled={!map} onClick={() => zoomBy(1)}>
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </Tile>

              <Tile label="Zoom out" disabled={!map} onClick={() => zoomBy(-1)}>
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                >
                  <path d="M5 12h14" />
                </svg>
              </Tile>
            </div>

            {layersOpen && (
              <LayersSection
                mapTypeId={mapTypeId}
                onChange={onMapTypeChange}
                tilt={tilt}
                onToggleTilt={onToggleTilt}
                trafficEnabled={trafficEnabled}
                onToggleTraffic={onToggleTraffic}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── One icon + label inside the panel ───────────────────
function Tile({
  label,
  onClick,
  children,
  active = false,
  purple = false,
  badge = false,
  pulse = false,
  disabled = false,
  expanded,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
  purple?: boolean;
  badge?: boolean;
  pulse?: boolean;
  disabled?: boolean;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-expanded={expanded}
      className="flex flex-col items-center gap-1 px-0.5 disabled:opacity-40"
    >
      <span
        className={`relative flex items-center justify-center w-11 h-11 rounded-full transition ${
          active
            ? "text-white"
            : purple
              ? "bg-gray-100 text-[#6E43A3]"
              : "bg-gray-100 text-gray-700"
        } ${pulse ? "animate-pulse" : ""}`}
        style={active ? { backgroundColor: PURPLE } : undefined}
      >
        {children}
        {badge && (
          <span className="absolute w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full top-0.5 right-0.5" />
        )}
      </span>
      <span className="text-[10.5px] leading-tight font-medium text-gray-600 text-center">
        {label}
      </span>
    </button>
  );
}

// ─── Compass — shows bearing, drag to rotate, tap to reset north ────
function CompassTile({
  heading,
  onHeadingChange,
  rotatable,
  onReset,
}: {
  heading: number;
  onHeadingChange: (heading: number) => void;
  rotatable: boolean;
  onReset: () => void;
}) {
  const btnRef = useRef<HTMLSpanElement>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);

  const angleFromPointer = (clientX: number, clientY: number) => {
    const el = btnRef.current;
    if (!el) return heading;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let deg = Math.atan2(clientX - cx, -(clientY - cy)) * (180 / Math.PI);
    if (deg < 0) deg += 360;
    return deg;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!rotatable) return;
    draggingRef.current = true;
    movedRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;
    movedRef.current = true;
    onHeadingChange(angleFromPointer(e.clientX, e.clientY));
  };

  const handlePointerUp = () => {
    if (draggingRef.current && !movedRef.current) onReset();
    draggingRef.current = false;
  };

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
      aria-label="Compass — drag to rotate the map, tap to reset north"
      className="flex flex-col items-center gap-1 px-0.5 touch-none"
    >
      <span
        ref={btnRef}
        className="flex items-center justify-center bg-gray-100 rounded-full w-11 h-11"
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          <path d="M12 2 L15 12 L12 10.3 L9 12 Z" fill="#ef4444" />
          <path d="M12 22 L15 12 L12 13.7 L9 12 Z" fill="#9ca3af" />
        </svg>
      </span>
      <span className="text-[10.5px] leading-tight font-medium text-gray-600 text-center">
        Compass
      </span>
    </button>
  );
}

// ─── Map type (layers) — Standard / Satellite / Terrain + 3D + traffic ──
const MAP_TYPE_OPTIONS: { id: MapTypeId; label: string }[] = [
  { id: "roadmap", label: "Standard" },
  { id: "satellite", label: "Satellite" },
  { id: "terrain", label: "Terrain" },
];

const TRAFFIC_LEGEND: { color: string; label: string }[] = [
  { color: "#34a853", label: "Normal traffic" },
  { color: "#fbbc04", label: "Moderate traffic" },
  { color: "#ea4335", label: "Heavy traffic" },
  { color: "#a50e0e", label: "Severe congestion" },
];

function Switch({ on }: { on: boolean }) {
  return (
    <span
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition ${
        on ? "bg-[#6E43A3]" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition ${
          on ? "translate-x-4" : "translate-x-1"
        }`}
      />
    </span>
  );
}

function LayersSection({
  mapTypeId,
  onChange,
  tilt,
  onToggleTilt,
  trafficEnabled,
  onToggleTraffic,
}: {
  mapTypeId: MapTypeId;
  onChange: (id: MapTypeId) => void;
  tilt: number;
  onToggleTilt: () => void;
  trafficEnabled: boolean;
  onToggleTraffic: () => void;
}) {
  return (
    <div className="pt-2 mt-3 border-t border-gray-100">
      <div className="flex gap-1.5 mb-2">
        {MAP_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
              mapTypeId === opt.id
                ? "bg-[#6E43A3]/10 text-[#6E43A3]"
                : "bg-gray-50 text-gray-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onToggleTilt}
        className="flex items-center justify-between w-full px-1 py-2 text-xs font-medium text-left text-gray-700"
      >
        3D view
        <Switch on={tilt > 0} />
      </button>

      <button
        type="button"
        onClick={onToggleTraffic}
        className="flex items-center justify-between w-full px-1 py-2 text-xs font-medium text-left text-gray-700"
      >
        Live traffic
        <Switch on={trafficEnabled} />
      </button>

      {trafficEnabled && (
        <div className="px-1 pt-1 pb-1 space-y-1">
          {TRAFFIC_LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[10.5px] text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
