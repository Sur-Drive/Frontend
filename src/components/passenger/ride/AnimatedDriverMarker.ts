
export const DRIVER_MARKER_SIZE = 76;

export const driverMarkerHtml = `
  <div
    style="
      width:76px;
      height:76px;
      position:relative;
      pointer-events:none;
    "
  >
    <style>
      @keyframes surdriveCarPulse {
        0% {
          transform:scale(.65);
          opacity:.65;
        }
        100% {
          transform:scale(1.45);
          opacity:0;
        }
      }

      .surdrive-car-pulse {
        position:absolute;
        inset:7px;
        border:2px solid #7442AD;
        border-radius:50%;
        animation:
          surdriveCarPulse 2.5s
          ease-out infinite;
      }

      .surdrive-car-rotation {
        position:absolute;
        inset:12px;
        display:flex;
        align-items:center;
        justify-content:center;
        transform-origin:center;
        transition:
          transform .45s ease-out;
      }

      @media (
        prefers-reduced-motion:reduce
      ) {
        .surdrive-car-pulse {
          animation:none;
        }

        .surdrive-car-rotation {
          transition:none;
        }
      }
    </style>

    <div
      class="surdrive-car-pulse"
    ></div>

    <div
      style="
        position:absolute;
        inset:12px;
        border-radius:50%;
        background:rgba(116,66,173,.12);
      "
    ></div>

    <div
      data-driver-rotation
      class="surdrive-car-rotation"
    >
      <div
        style="
          width:47px;
          height:47px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:16px;
          background:#7442AD;
          border:3px solid white;
          box-shadow:
            0 8px 22px rgba(53,23,86,.3);
        "
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 3.5h10l2 5.5v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9l2-5.5Z"
            fill="#FFFFFF"
          />
          <path
            d="M8 5.5h8l1.2 4H6.8l1.2-4Z"
            fill="#CDB3E9"
          />
          <path
            d="M7 13h10v4H7v-4Z"
            fill="#D9C3F0"
          />
          <path
            d="M8 18h2M14 18h2"
            stroke="#7442AD"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </div>
    </div>
  </div>
`;
