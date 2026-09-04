
// Same 8 report kinds used everywhere a hazard/report renders on the map —
// mirrors lib/hazardToReport.ts's ReportType so map pins actually match
// what the rest of the app calls each report.
export type ReportKind =
  | 'wave'
  | 'hill'
  | 'pothole'
  | 'hazard'
  | 'sos'
  | 'sign'
  | 'warning'
  | 'tractor'

// Inline SVG/markup per report kind, sized to fill most of the pin circle
// via percentage width/height so it scales automatically with whatever
// pin size is chosen (mobile vs desktop, selected vs not) instead of
// needing separate fixed-pixel variants.
function reportIconMarkup(type?: ReportKind): string {
  switch (type) {
    case 'wave':
      return `
        <svg viewBox="0 0 24 24" width="58%" height="58%" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round">
          <path d="M2 10c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
          <path d="M2 15c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
        </svg>`
    case 'hill':
      return `
        <svg viewBox="0 0 24 24" width="58%" height="58%" fill="#3a2e1f">
          <path d="M2 18 L9 8 L13 13 L16 9 L22 18 Z" />
        </svg>`
    case 'pothole':
      return `
        <svg viewBox="0 0 24 24" width="58%" height="58%">
          <ellipse cx="12" cy="12" rx="8" ry="4.5" fill="#1a1a1a" />
        </svg>`
    case 'hazard':
      return `
        <div style="
          width:58%;height:44%;border-radius:2px;
          background-image:repeating-linear-gradient(45deg, #f6c400 0 4px, #1a1a1a 4px 8px);
        "></div>`
    case 'sos':
      return `
        <div style="background:white;border-radius:3px;padding:2px 5px;display:flex;align-items:center;justify-content:center;">
          <span style="color:#dc2626;font-weight:800;font-size:7px;line-height:1;">SOS</span>
        </div>`
    case 'sign':
      return `
        <svg viewBox="0 0 24 24" width="58%" height="58%" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 14 L14 4" />
          <path d="M9 4 L14 4 L14 9" />
          <path d="M20 10 L10 20" />
          <path d="M15 20 L10 20 L10 15" />
        </svg>`
    case 'warning':
      return `
        <svg viewBox="0 0 24 24" width="58%" height="58%">
          <path d="M12 3 L22 20 L2 20 Z" fill="white" />
          <rect x="11" y="10" width="2" height="5" fill="#e02424" />
          <rect x="11" y="16" width="2" height="2" fill="#e02424" />
        </svg>`
    case 'tractor':
      return `
        <svg viewBox="0 0 24 24" width="58%" height="58%" fill="#2b2b2b">
          <rect x="8" y="8" width="7" height="5" rx="1" />
          <rect x="4" y="12" width="5" height="4" rx="1" />
          <circle cx="7" cy="18" r="3" fill="none" stroke="#2b2b2b" stroke-width="2" />
          <circle cx="17" cy="18" r="4" fill="none" stroke="#2b2b2b" stroke-width="2" />
        </svg>`
    default:
      return `<span style="color:white;font-size:60%;font-weight:bold;">!</span>`
  }
}

// Below this width we treat the viewport as a phone and draw noticeably
// smaller pins — at the default 36px/56px sizes, reports that sit only a
// few dozen meters apart (common in the seed/mock data and in dense real
// hazard clusters) visually overlap into a solid blob on a small screen.
const MOBILE_BREAKPOINT_PX = 640

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= MOBILE_BREAKPOINT_PX
}

const DESKTOP_SIZE = { default: 36, selected: 56 }
const MOBILE_SIZE = { default: 24, selected: 38 }

function reportPinSize(isSelected: boolean): number {
  const sizes = isMobileViewport() ? MOBILE_SIZE : DESKTOP_SIZE
  return isSelected ? sizes.selected : sizes.default
}

export function reportPinHtml(
  color: string,
  isSelected: boolean,
  type?: ReportKind,
): string {
  const size = reportPinSize(isSelected)
  return `
    <div style="
      background:${color};
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:${isSelected ? '0 4px 16px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.2)'};
      border:${isSelected ? 3 : 2}px solid white;
      transition:all 0.2s;
      cursor:pointer;
    ">
      ${reportIconMarkup(type)}
    </div>
  `
}

// Anchor must match reportPinHtml's actual rendered size (center of the
// circle) or the pin will sit visibly offset from its real coordinate —
// so this derives from the same size logic rather than a fixed constant.
export function getReportPinAnchor(isSelected: boolean): [number, number] {
  const half = reportPinSize(isSelected) / 2
  return [half, half]
}

// Kept for any existing callers that haven't switched to getReportPinAnchor
// yet — these reflect the old fixed desktop sizes only, so prefer the
// function above for anything that should look right on mobile too.
export const REPORT_PIN_ANCHOR: [number, number] = [18, 18]
export const REPORT_PIN_SELECTED_ANCHOR: [number, number] = [28, 28]

export const userLocationPinHtml = `
  <div style="position:relative;width:24px;height:24px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:#3b82f6;opacity:0.3;animation:sd-pulse 1.5s infinite;"></div>
    <div style="position:absolute;inset:4px;border-radius:50%;background:#3b82f6;border:2px solid white;"></div>
  </div>
  <style>
    @keyframes sd-pulse {
      0%,100% { transform: scale(1); opacity: 0.3; }
      50% { transform: scale(2); opacity: 0; }
    }
  </style>
`

export const USER_LOCATION_ANCHOR: [number, number] = [12, 12]

export const navArrowPinHtml = `
  <div style="position:relative;width:28px;height:28px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:#0ea5e9;opacity:0.3;animation:sd-pulse 1.5s infinite;"></div>
    <div style="position:absolute;inset:3px;border-radius:50%;background:#0ea5e9;border:2px solid white;display:flex;align-items:center;justify-content:center;">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
      </svg>
    </div>
  </div>
  <style>
    @keyframes sd-pulse {
      0%,100% { transform: scale(1); opacity: 0.3; }
      50% { transform: scale(2); opacity: 0; }
    }
  </style>
`

export const NAV_ARROW_ANCHOR: [number, number] = [14, 14]

// Classic teardrop pin for the trip destination — Google-Maps-red with a
// white dot, anchored at the point of the drop so it sits exactly on the
// coordinate rather than floating above it.
export function destinationPinHtml(color = '#ea4335'): string {
  return `
    <div style="position:relative;width:34px;height:46px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
      <svg width="34" height="46" viewBox="0 0 34 46" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.6 0 0 7.6 0 17c0 12.75 17 29 17 29s17-16.25 17-29C34 7.6 26.4 0 17 0z" fill="${color}"/>
        <circle cx="17" cy="17" r="6.5" fill="white"/>
      </svg>
    </div>
  `
}

export const DESTINATION_PIN_ANCHOR: [number, number] = [17, 46]

// Small filled dot for the trip's starting point — mirrors the plain
// circular "origin" marker Google Maps draws at the start of a route.
export const startPinHtml = `
  <div style="
    width:18px;height:18px;border-radius:50%;
    background:#22c55e;border:3px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
  "></div>
`

export const START_PIN_ANCHOR: [number, number] = [9, 9]

// Same nav puck as navArrowPinHtml, but rotatable — used for the moving
// position marker on an animated route (heading updates every frame as
// the marker travels along the path).
export function navHeadingArrowHtml(headingDeg: number, color = '#0ea5e9'): string {
  return `
    <div style="position:relative;width:28px;height:28px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.25;"></div>
      <div style="
        position:absolute;inset:3px;border-radius:50%;background:${color};
        border:2px solid white;display:flex;align-items:center;justify-content:center;
        transform:rotate(${headingDeg}deg);transition:transform 0.15s linear;
      ">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
        </svg>
      </div>
    </div>
  `
}
