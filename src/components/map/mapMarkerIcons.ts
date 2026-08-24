

export function reportPinHtml(color: string, isSelected: boolean): string {
  const size = isSelected ? 56 : 36
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
      border:3px solid white;
      transition:all 0.2s;
      cursor:pointer;
    ">
      <span style="color:white;font-size:${isSelected ? 18 : 12}px;font-weight:bold;">!</span>
    </div>
  `
}

export const REPORT_PIN_ANCHOR: [number, number] = [18, 18]
export const REPORT_PIN_SELECTED_ANCHOR: [number, number] = [28, 28]

// Road-closure pin — a striped barrier badge instead of the generic "!"
// circle, so a fully-blocked road reads as visually distinct (and more
// severe) from a graded hazard like a pothole or flood risk at a glance.
export function closurePinHtml(color: string, isSelected: boolean): string {
  const size = isSelected ? 58 : 38
  return `
    <div style="
      background:${color};
      width:${size}px;
      height:${size}px;
      border-radius:10px;
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:${isSelected ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.25)'};
      border:3px solid white;
      transition:all 0.2s;
      cursor:pointer;
      background-image:repeating-linear-gradient(135deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 12px);
    ">
      <svg viewBox="0 0 24 24" width="${isSelected ? 26 : 18}" height="${isSelected ? 26 : 18}" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round">
        <circle cx="12" cy="12" r="9.5" />
        <path d="M6 6l12 12" />
      </svg>
    </div>
  `
}

export const CLOSURE_PIN_ANCHOR: [number, number] = [19, 19]
export const CLOSURE_PIN_SELECTED_ANCHOR: [number, number] = [29, 29]

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

// Round emoji pin for a "place along the route" result (petrol station,
// restaurant, hospital, ...) — same circular-badge language as
// reportPinHtml, just keyed by category color/icon instead of hazard color.
export function placePinHtml(icon: string, color: string, isSelected: boolean): string {
  const size = isSelected ? 40 : 30
  return `
    <div style="
      background:${color};
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:${isSelected ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.2)'};
      border:2.5px solid white;
      transition:all 0.2s;
      cursor:pointer;
    ">
      <span style="font-size:${isSelected ? 18 : 14}px;line-height:1;">${icon}</span>
    </div>
  `
}

export const PLACE_PIN_ANCHOR: [number, number] = [15, 15]
export const PLACE_PIN_SELECTED_ANCHOR: [number, number] = [20, 20]

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

// The live "you are driving" puck used during real turn-by-turn — a
// top-down car silhouette (body, windshield, side mirrors) rather than a
// plain arrow/chevron, closer to what Google/Waze render for the
// driver's own position. Rotates in place to `headingDeg`; "up" on the
// icon is the front of the car.
export function navCarPuckHtml(headingDeg: number, bodyColor = '#4285F4'): string {
  return `
    <div style="position:relative;width:44px;height:44px;">
      <div style="
        position:absolute;left:50%;top:80%;width:22px;height:9px;
        transform:translate(-50%,-50%);border-radius:50%;
        background:rgba(0,0,0,0.3);filter:blur(2px);
      "></div>
      <div style="
        position:absolute;inset:0;width:44px;height:44px;
        transform:rotate(${headingDeg}deg);transition:transform 0.15s linear;
        display:flex;align-items:center;justify-content:center;
      ">
        <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
          <!-- car body -->
          <rect x="8" y="4" width="14" height="23" rx="5" fill="#f3f4f6" stroke="#1f2937" stroke-width="1.4"/>
          <!-- windshield -->
          <path d="M10.5 10.5 Q15 7.5 19.5 10.5 L18.3 14 L11.7 14 Z" fill="${bodyColor}" opacity="0.85"/>
          <!-- rear window -->
          <rect x="11.5" y="20" width="7" height="4" rx="1.2" fill="${bodyColor}" opacity="0.55"/>
          <!-- side mirrors -->
          <rect x="5.5" y="11" width="2.4" height="2" rx="0.8" fill="#1f2937"/>
          <rect x="22.1" y="11" width="2.4" height="2" rx="0.8" fill="#1f2937"/>
          <!-- headlights -->
          <circle cx="11" cy="6" r="1" fill="#fde68a"/>
          <circle cx="19" cy="6" r="1" fill="#fde68a"/>
          <!-- taillights -->
          <circle cx="11" cy="25.5" r="1" fill="#ef4444"/>
          <circle cx="19" cy="25.5" r="1" fill="#ef4444"/>
        </svg>
      </div>
    </div>
  `
}

export const NAV_CAR_PUCK_ANCHOR: [number, number] = [22, 22]

// Google/Waze-style floating "delay" bubble that sits directly on the
// route line at a hazard/incident location — an icon + a rough extra-time
// estimate (e.g. a roadworks cone with "19 min", a traffic icon with
// "5 min"). Color follows severity: red = high, orange = medium/default,
// so a glance at the route tells you which incidents actually matter.
export function trafficDelayBubbleHtml(icon: string, label: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'): string {
  const bg =
    severity === 'HIGH' ? '#ea4335' : severity === 'LOW' ? '#f9ab00' : '#fb8c00'
  return `
    <div style="
      display:flex;align-items:center;gap:5px;
      background:${bg};color:white;
      padding:5px 10px 5px 7px;border-radius:999px;
      box-shadow:0 3px 10px rgba(0,0,0,0.3);
      border:2px solid white;
      font-family:inherit;white-space:nowrap;
      cursor:pointer;
    ">
      <span style="font-size:13px;line-height:1;">${icon}</span>
      <span style="font-size:12px;font-weight:700;line-height:1;">${label}</span>
    </div>
  `
}

export const TRAFFIC_DELAY_BUBBLE_ANCHOR: [number, number] = [20, 14]
