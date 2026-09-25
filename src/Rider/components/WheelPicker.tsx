import { useCallback, useEffect, useRef } from "react";

interface WheelPickerProps<T extends string | number> {
  items: T[];
  value: T;
  onChange: (value: T) => void;
  renderLabel?: (value: T) => string;
  itemHeight?: number;
  visibleCount?: number; // must be odd
  className?: string;
}

/**
 * A single-column iOS-style spinner/wheel picker: the item nearest the
 * center is shown large & bold, items further away shrink and fade.
 * Scrolling snaps to the nearest item.
 */
export default function WheelPicker<T extends string | number>({
  items,
  value,
  onChange,
  renderLabel = (v) => String(v),
  itemHeight = 40,
  visibleCount = 7,
  className = "",
}: WheelPickerProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<number | undefined>(undefined);
  const isProgrammaticScroll = useRef(false);

  const paddingCount = Math.floor(visibleCount / 2);
  const indexOf = useCallback((v: T) => Math.max(0, items.indexOf(v)), [items]);

  const scrollToIndex = useCallback(
    (idx: number, behavior: ScrollBehavior = "smooth") => {
      const el = containerRef.current;
      if (!el) return;
      isProgrammaticScroll.current = true;
      el.scrollTo({ top: idx * itemHeight, behavior });
      window.setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, behavior === "smooth" ? 300 : 0);
    },
    [itemHeight],
  );

  // Align to the current value on mount (and whenever the item list changes size).
  useEffect(() => {
    scrollToIndex(indexOf(value), "auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScroll.current) return;
    window.clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = window.setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const idx = Math.round(el.scrollTop / itemHeight);
      const clamped = Math.min(items.length - 1, Math.max(0, idx));
      scrollToIndex(clamped);
      const newValue = items[clamped];
      if (newValue !== value) onChange(newValue);
    }, 100);
  }, [itemHeight, items, onChange, scrollToIndex, value]);

  const selectedIndex = indexOf(value);

  return (
    <div
      className={`relative ${className}`}
      style={{ height: itemHeight * visibleCount }}
    >
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full snap-y snap-mandatory overflow-y-scroll scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div style={{ height: paddingCount * itemHeight }} />
        {items.map((item, i) => {
          const dist = Math.abs(selectedIndex - i);
          const isSelected = dist === 0;
          const fontSize = isSelected ? 22 : dist === 1 ? 16 : 14;
          const fontWeight = isSelected ? 700 : 500;
          const color = isSelected
            ? "#1e1b4b"
            : dist === 1
              ? "#9698c2"
              : "#c7c8e0";

          return (
            <div
              key={`${String(item)}-${i}`}
              onClick={() => {
                scrollToIndex(i);
                if (item !== value) onChange(item);
              }}
              className="flex snap-center cursor-pointer items-center justify-center transition-all duration-150"
              style={{ height: itemHeight, fontSize, fontWeight, color }}
            >
              {renderLabel(item)}
            </div>
          );
        })}
        <div style={{ height: paddingCount * itemHeight }} />
      </div>
    </div>
  );
}
