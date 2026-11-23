interface RouteMapPreviewProps {
  from: string;
  to: string;
  distanceKm: number;
  durationMin: number;
}

const GRID_STEP = 50;

const ROUTE_PATH =
  "M52 184 C140 192 220 150 312 113 C400 80 470 140 552 186 C620 215 690 150 736 63";

// Shared illustrative route preview: a dotted line between a pickup dot and a
// destination dot over a faint grid, with a duration/distance chip. Decorative
// only, no network access; replace with a real map when one exists. Extracted
// from the ride details drawer so the incident drawer reuses it unchanged.
export function RouteMapPreview({
  from,
  to,
  distanceKm,
  durationMin,
}: RouteMapPreviewProps) {
  const gridLines: number[] = [];
  for (let value = GRID_STEP; value < 800; value += GRID_STEP) {
    gridLines.push(value);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-muted aspect-2/1 sm:aspect-3/1">
      <svg
        viewBox="0 0 800 270"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={`Route from ${from} to ${to}`}
        className="size-full"
        style={{ outline: "none" }}
      >
        <g aria-hidden="true">
          {gridLines.map((value) => (
            <line
              key={`v${value}`}
              x1={value}
              y1={0}
              x2={value}
              y2={270}
              className="stroke-border"
              strokeOpacity={0.4}
              strokeWidth={1}
            />
          ))}
          {gridLines
            .filter((value) => value < 270)
            .map((value) => (
              <line
                key={`h${value}`}
                x1={0}
                y1={value}
                x2={800}
                y2={value}
                className="stroke-border"
                strokeOpacity={0.4}
                strokeWidth={1}
              />
            ))}

          <path
            d="M470 270 C600 255 720 215 800 165 L800 270 Z"
            className="fill-info-soft"
          />

          <path
            d={ROUTE_PATH}
            fill="none"
            className="stroke-brand"
            strokeWidth={6}
            strokeDasharray="1 12"
            strokeLinecap="round"
          />

          <circle
            cx={52}
            cy={184}
            r={14}
            className="fill-accent stroke-surface"
            strokeWidth={3}
          />
          <circle
            cx={736}
            cy={63}
            r={14}
            className="fill-brand stroke-surface"
            strokeWidth={3}
          />
        </g>
      </svg>
      <span className="absolute bottom-3 right-3 rounded-lg bg-surface px-2.5 py-1 text-xs text-ink-muted shadow">
        {durationMin} min • {distanceKm} km
      </span>
    </div>
  );
}
