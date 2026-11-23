export function driverCarMarkerHtml() {
  return `
    <div style="
      width:64px;
      height:64px;
      display:flex;
      align-items:center;
      justify-content:center;
      position:relative;
      pointer-events:none;
    ">
      <div style="
        position:absolute;
        inset:4px;
        border-radius:50%;
        background:rgba(116,66,173,0.13);
        border:1px solid rgba(116,66,173,0.25);
      "></div>

      <div
        data-driver-rotation
        style="
          width:44px;
          height:44px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:50%;
          background:white;
          border:2px solid #7442AD;
          box-shadow:0 6px 22px rgba(50,20,80,0.25);
          transform-origin:center center;
        "
      >
        <svg
          width="29"
          height="29"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#7442AD"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 2L7 8v10l5 4 5-4V8L12 2Z"/>
          <path d="M7 9h10M7 17h10"/>
          <path d="M9 12h6"/>
        </svg>
      </div>
    </div>
  `;
}