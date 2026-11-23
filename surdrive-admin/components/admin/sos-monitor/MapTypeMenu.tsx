'use client';

// ---------------------------------------------------------------------------
// MapTypeMenu — the base-map switcher behind the Live map panel's layers button.
//
// Roadmap/Satellite only, i.e. it calls map.setMapTypeId and nothing else: the
// tile style is orthogonal to camera framing and to the pins (both are overlays
// drawn on top of whatever base map is showing), so selecting an option never
// moves the viewport or rebuilds a marker.
//
// The open/close wiring is deliberately the ProfileDropdown mechanism rather than
// a second pattern: the panel header owns `open`, its trigger button carries
// data-overlay-trigger and handles its own toggle, and the mousedown listener
// below ignores clicks on that trigger so it can't close the menu a tick before
// the button's onClick reopens it.
// ---------------------------------------------------------------------------
import { useEffect, useRef } from 'react';
import { CheckIcon } from '@/components/ui/icons/CheckIcon';
import type { MapBaseType } from './map/SosMapView';

/**
 * Value on the header's layers button. Exported so the button and the click
 * handler below can never drift apart. ProfileDropdown's generic
 * `[data-overlay-trigger]` guard still matches this attribute (bare-attribute
 * selectors match a valued attribute), so its behaviour is unchanged.
 */
export const MAP_TYPE_TRIGGER_ATTR = 'map-layers';

export type MapTypeMenuProps = {
  /** Owned by MapPanel, exactly like ProfileDropdown's `open`. */
  open: boolean;
  /** Currently applied base map, shown with a checkmark. */
  value: MapBaseType;
  /** Applies the selection — the panel owns `mapType` and passes it to the map. */
  onChange: (value: MapBaseType) => void;
  onClose: () => void;
};

/** The two base maps the design calls for, in menu order. */
const MAP_TYPE_OPTIONS: { value: MapBaseType; label: string }[] = [
  { value: 'roadmap', label: 'Roadmap' },
  { value: 'satellite', label: 'Satellite' },
];

export function MapTypeMenu({ open, value, onChange, onClose }: MapTypeMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      // Ignore clicks on this dropdown's trigger button — its own onClick handles
      // the toggle. Qualified by value (not the bare attribute) because the SOS
      // page also mounts the Topbar, whose profile trigger carries the same
      // attribute: a click there is "outside" and must close this menu.
      const ownTrigger = `[data-overlay-trigger="${MAP_TYPE_TRIGGER_ATTR}"]`;
      if ((event.target as Element).closest(ownTrigger)) return;
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Base map"
      className="absolute right-0 top-full z-20 mt-1 w-[148px] overflow-hidden rounded-xl border border-line-card bg-surface-card py-1.5 shadow-lg"
    >
      {MAP_TYPE_OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            // menuitemradio (not menuitem) — the rows are a single-choice set, and
            // aria-checked is how the checkmark reaches assistive tech.
            role="menuitemradio"
            aria-checked={active}
            onClick={() => {
              onChange(option.value);
              onClose();
            }}
            className={`flex w-full items-center justify-between gap-2.5 px-3.5 py-2 text-sm transition-colors hover:bg-surface-hover ${
              active ? 'font-semibold text-brand-primary' : 'text-ink-secondary'
            }`}
          >
            {option.label}
            {/* The check slot is reserved on both rows so the labels stay flush. */}
            <CheckIcon className={`h-4 w-4 shrink-0 ${active ? '' : 'invisible'}`} />
          </button>
        );
      })}
    </div>
  );
}
