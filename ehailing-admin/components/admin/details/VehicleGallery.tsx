"use client";

import { useState } from "react";
import { Car } from "lucide-react";

interface VehicleGalleryProps {
  views: string[];
}

const MAIN_TILE =
  "col-span-2 flex aspect-[3/2] flex-col items-center justify-center gap-3 rounded-xl border border-border bg-linear-to-br from-surface-muted to-surface";
const THUMB_TILE =
  "flex aspect-[16/10] flex-col items-center justify-center gap-2 rounded-xl border border-border bg-linear-to-br from-surface-muted to-surface transition-colors hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

// Placeholder photo gallery: photos don't exist yet, so each view is a muted
// gradient tile with a car icon. The first view is the main tile; clicking a
// thumbnail swaps it with the main view.
export function VehicleGallery({ views }: VehicleGalleryProps) {
  const [ordered, setOrdered] = useState(views);

  function selectView(index: number) {
    setOrdered((prev) => {
      const next = [...prev];
      [next[0], next[index]] = [next[index], next[0]];
      return next;
    });
  }

  const [main, ...thumbs] = ordered;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className={`${MAIN_TILE} sm:row-span-2`}>
        <Car className="size-14 text-brand" aria-hidden="true" />
        <span className="text-sm font-medium text-brand">{main}</span>
      </div>
      {thumbs.map((label, index) => (
        <button
          key={label}
          type="button"
          onClick={() => selectView(index + 1)}
          aria-label={`Show ${label}`}
          className={`${THUMB_TILE} ${index === thumbs.length - 1 ? "sm:col-span-2" : ""}`}
        >
          <Car className="size-7 text-ink-subtle" aria-hidden="true" />
          <span className="text-xs text-ink-muted">{label}</span>
        </button>
      ))}
    </div>
  );
}
