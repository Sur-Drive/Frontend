

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
