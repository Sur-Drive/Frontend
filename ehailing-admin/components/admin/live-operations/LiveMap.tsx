"use client";

import { useState } from "react";
import { Car, MapPin as MapPinIcon, Minus, Navigation, Plus } from "lucide-react";
import type {
  LiveMapData,
  MapMarker,
  MapPin,
  MapZoneId,
} from "@/types/live-operations";

export type MapZoneFilter = "all" | "mainland" | "island";

interface LiveMapProps {
  map: LiveMapData;
  zone: MapZoneFilter;
}

const ZOOM_MIN = 1;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;

// Artwork sizes in viewBox units.
const MARKER_SIZE = 36;
const MARKER_RADIUS = 9;
const PIN_HEIGHT = 40;
const PIN_HEAD_RADIUS = 12;
const ICON_SIZE = 18;

const FILL = {
  brand: "var(--brand)",
  accent: "var(--accent)",
  success: "var(--success)",
} as const;

// Marker and pin casings read as the card surface so icons stay legible over
// the map background.
const CASING = "var(--surface)";

const ROADS: { d: string; width: number }[] = [
  { d: "M-20 560 C 200 600 420 640 620 590 S 900 520 1040 560", width: 26 },
  { d: "M120 -20 C 160 160 200 420 330 740", width: 20 },
  { d: "M520 -20 C 500 220 520 460 500 740", width: 18 },
  { d: "M800 -20 C 760 200 780 420 720 740", width: 18 },
  { d: "M-20 170 C 200 210 360 190 620 130", width: 14 },
  { d: "M-20 300 C 220 330 380 250 620 200", width: 16 },
  { d: "M-20 640 C 260 690 560 680 1040 620", width: 14 },
  { d: "M420 -20 C 380 200 420 420 380 740", width: 14 },
];

// Lagoon: light water shape in the bottom-right, curved top edge.
const WATER_PATH = "M 565 720 C 660 645 820 590 985 543 L 1000 720 Z";

const LABEL_STYLE = {
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: "0.08em",
  fill: "var(--ink-subtle)",
} as const;

// Opacity for a marker or pin whose zone the filter excludes, matching how the
// zone shapes themselves are dimmed.
const DIM_OPACITY = 0.35;

function dimOpacity(itemZone: MapZoneId, zone: MapZoneFilter): number {
  return zone !== "all" && itemZone !== zone ? DIM_OPACITY : 1;
}

function MarkerShape({
  marker,
  opacity,
  counterScale,
}: {
  marker: MapMarker;
  opacity: number;
  counterScale: number;
}) {
  const size = MARKER_SIZE;
  return (
    <g opacity={opacity}>
      <rect
        x={marker.point.x - size / 2}
        y={marker.point.y - size / 2}
        width={size}
        height={size}
        rx={MARKER_RADIUS}
        fill={FILL[marker.tone]}
        stroke={CASING}
        strokeWidth={2}
      />
      <svg
        x={marker.point.x - (ICON_SIZE * counterScale) / 2}
        y={marker.point.y - (ICON_SIZE * counterScale) / 2}
        width={ICON_SIZE * counterScale}
        height={ICON_SIZE * counterScale}
        viewBox="0 0 24 24"
        fill="none"
        stroke={CASING}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: CASING }}
        aria-hidden="true"
      >
        <Car />
      </svg>
    </g>
  );
}

function PinShape({
  pin,
  opacity,
  counterScale,
}: {
  pin: MapPin;
  opacity: number;
  counterScale: number;
}) {
  const { x, y } = pin.point;
  const r = PIN_HEAD_RADIUS;
  const head = y - PIN_HEIGHT + r;
  const path =
    `M ${x} ${y} C ${x - 10} ${y - 16}, ${x - r} ${y - 22}, ${x - r} ${head}` +
    ` A ${r} ${r} 0 1 1 ${x + r} ${head}` +
    ` C ${x + r} ${y - 22}, ${x + 10} ${y - 16}, ${x} ${y} Z`;
  const iconSize = ICON_SIZE * counterScale;
  return (
    <g opacity={opacity}>
      <path d={path} fill={FILL[pin.tone]} stroke={CASING} strokeWidth={2} />
      <svg
        x={x - iconSize / 2}
        y={head - iconSize / 2}
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={CASING}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: CASING }}
        aria-hidden="true"
      >
        {pin.kind === "pickup" ? <MapPinIcon /> : <Navigation />}
      </svg>
    </g>
  );
}

function LiveMapArtwork({
  map,
  zone,
  counterScale,
}: {
  map: LiveMapData;
  zone: MapZoneFilter;
  counterScale: number;
}) {
  return (
    <g>
      <rect width={map.width} height={map.height} fill="var(--surface-muted)" />

      {/* Lagoon */}
      <path d={WATER_PATH} fill="var(--info-soft)" />

      {/* Roads */}
      <g stroke="var(--surface)" strokeLinecap="round" fill="none">
        {ROADS.map((road) => (
          <path key={road.d} d={road.d} strokeWidth={road.width} />
        ))}
      </g>

      {/* Area labels */}
      <g textAnchor="middle" aria-hidden="true">
        {map.labels.map((label) => (
          <text
            key={label.text}
            x={label.point.x}
            y={label.point.y}
            {...LABEL_STYLE}
          >
            {label.text}
          </text>
        ))}
        <text
          x={map.lagoonLabel.point.x}
          y={map.lagoonLabel.point.y}
          transform={`rotate(${map.lagoonRotation} ${map.lagoonLabel.point.x} ${map.lagoonLabel.point.y})`}
          {...LABEL_STYLE}
        >
          {map.lagoonLabel.text}
        </text>
      </g>

      {/* Service zones: selected zone fills harder with a solid outline. */}
      {map.zones.map((mapZone) => {
        const selected = zone === mapZone.id;
        const dimmed = zone !== "all" && !selected;
        return (
          <polygon
            key={mapZone.id}
            points={mapZone.polygon
              .map((point) => `${point.x},${point.y}`)
              .join(" ")}
            fill={FILL[mapZone.tone]}
            fillOpacity={selected ? 0.24 : dimmed ? 0.05 : 0.12}
            stroke={FILL[mapZone.tone]}
            strokeWidth={2}
            strokeDasharray={selected ? undefined : "8 6"}
            opacity={dimmed ? 0.35 : 1}
          />
        );
      })}

      {/* Active routes */}
      <g fill="none" strokeWidth={6} strokeDasharray="12 8" strokeLinecap="round">
        {map.routes.map((route) => (
          <path key={route.id} d={route.path} stroke={FILL[route.tone]} />
        ))}
      </g>

      {/* Drivers */}
      {map.markers.map((marker) => (
        <MarkerShape
          key={marker.id}
          marker={marker}
          opacity={dimOpacity(marker.zone, zone)}
          counterScale={counterScale}
        />
      ))}

      {/* Pins sit above the driver markers. */}
      {map.pins.map((pin) => (
        <PinShape
          key={pin.id}
          pin={pin}
          opacity={dimOpacity(pin.zone, zone)}
          counterScale={counterScale}
        />
      ))}
    </g>
  );
}

export function LiveMap({ map, zone }: LiveMapProps) {
  const [zoom, setZoom] = useState(1);
  const counterScale = 1 / zoom;
  // Scale around the map centre so zooming keeps the middle of Lagos in view.
  const cx = map.width / 2;
  const cy = map.height / 2;

  return (
    <div className="relative flex min-h-90 flex-1 flex-col overflow-hidden rounded-b-2xl bg-surface-muted sm:min-h-105">
      <svg
        role="img"
        aria-label="Illustrative map of Lagos showing drivers, active routes and service zones"
        viewBox={`0 0 ${map.width} ${map.height}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
        style={{ outline: "none" }}
      >
        <g transform={`translate(${cx} ${cy}) scale(${zoom}) translate(${-cx} ${-cy})`}>
          <LiveMapArtwork
            map={map}
            zone={zone}
            counterScale={counterScale}
          />
        </g>
      </svg>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-ink-muted shadow-sm"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="flex size-4 items-center justify-center rounded-md bg-brand text-surface">
            <Car className="size-2.5" />
          </span>
          Available driver
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0 w-5 border-t-2 border-dashed border-brand" />
          Active route
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm border-2 border-dashed border-brand bg-brand-soft" />
          Service zone
        </span>
      </div>

      <div className="absolute right-4 top-4 flex flex-col gap-2">
        <button
          type="button"
          aria-label="Zoom in"
          disabled={zoom >= ZOOM_MAX}
          onClick={() =>
            setZoom((value) => Math.min(ZOOM_MAX, value + ZOOM_STEP))
          }
          className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-ink shadow-sm transition-colors hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          disabled={zoom <= ZOOM_MIN}
          onClick={() =>
            setZoom((value) => Math.max(ZOOM_MIN, value - ZOOM_STEP))
          }
          className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-ink shadow-sm transition-colors hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

