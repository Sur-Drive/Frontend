import { Search, Menu } from "lucide-react";
import type { ReactNode } from "react";

/** Simple top-down car glyph to stand in for the map's vehicle marker. */
export function CarGlyph({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="7" y="2" width="10" height="20" rx="4" fill="#1F2937" />
      <rect x="8.5" y="4.5" width="7" height="4.5" rx="1.3" fill="#CBD5E1" />
      <rect x="8.5" y="14" width="7" height="4.5" rx="1.3" fill="#CBD5E1" />
    </svg>
  );
}

export function TopBar({
  onSearch,
  onMenu,
  showBack,
}: {
  onSearch?: () => void;
  onMenu?: () => void;
  showBack?: ReactNode;
}) {
  return (
    <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
      {showBack ? (
        showBack
      ) : (
        <button
          type="button"
          onClick={onSearch}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md"
        >
          <Search size={18} className="text-[#1F2937]" />
        </button>
      )}
      {onMenu ? (
        <button
          type="button"
          onClick={onMenu}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md"
        >
          <Menu size={18} className="text-[#1F2937]" />
        </button>
      ) : (
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E53935] text-[11px] font-extrabold text-white shadow-md"
        >
          SOS
        </button>
      )}
    </div>
  );
}

/** Flat, schematic "map" — grid of streets + labels, no external tiles/imagery needed. */
export default function MapBackdrop({
  children,
  pulse = false,
  routeLine = false,
}: {
  children?: ReactNode;
  pulse?: boolean;
  routeLine?: boolean;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#EEF1F4]">
      <svg
        className="absolute inset-0 h-full w-full opacity-70"
        preserveAspectRatio="none"
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={`${i * 12.5}%`}
            y1="0"
            x2={`${i * 12.5}%`}
            y2="100%"
            stroke="#D7DDE5"
            strokeWidth={i % 3 === 0 ? 2 : 1}
          />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1="0"
            y1={`${i * 12.5}%`}
            x2="100%"
            y2={`${i * 12.5}%`}
            stroke="#D7DDE5"
            strokeWidth={i % 3 === 0 ? 2 : 1}
          />
        ))}
        <line
          x1="8%"
          y1="6%"
          x2="42%"
          y2="34%"
          stroke="#C7CFD9"
          strokeWidth="3"
        />
        {routeLine && (
          <polyline
            points="20,20 20,45 55,45 55,70 75,70"
            fill="none"
            stroke="#6E43A3"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {/* Street labels */}
      <span className="absolute left-3 top-[8%] text-[10px] font-medium text-[#8B95A5]">
        NW 100th St
      </span>
      <span className="absolute left-[36%] top-[18%] -rotate-45 text-[10px] font-medium text-[#8B95A5]">
        Holman Rd NW
      </span>
      <span className="absolute left-[22%] top-[38%] -rotate-90 text-[10px] font-medium text-[#8B95A5]">
        8th Ave NW
      </span>
      <span className="absolute left-[62%] top-[34%] -rotate-90 text-[10px] font-medium text-[#8B95A5]">
        3rd Ave NW
      </span>
      <span className="absolute right-3 top-[24%] -rotate-90 text-[10px] font-medium text-[#8B95A5]">
        Greenwood Ave N
      </span>
      <span className="absolute left-3 top-[62%] text-[11px] font-bold tracking-wide text-[#9AA5B8]">
        N HILL
      </span>
      <span className="absolute left-3 bottom-[30%] text-[10px] font-medium text-[#8B95A5]">
        NW 85th St
      </span>
      <span className="absolute right-4 bottom-[30%] text-[11px] font-bold tracking-wide text-[#9AA5B8]">
        GREENWOOD
      </span>

      {/* Car + optional pulse ring, centered */}
      <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2">
        {pulse && (
          <span className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6E43A3]/15" />
        )}
        {pulse && (
          <span className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6E43A3]/25" />
        )}
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg">
          <CarGlyph size={22} />
        </div>
      </div>

      {children}
    </div>
  );
}
