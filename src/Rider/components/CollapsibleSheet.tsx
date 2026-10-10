import { useRef, useState, type ReactNode } from "react";

/**
 * Bottom sheet that opens and closes.
 *  - tap the handle to toggle
 *  - drag the handle down to close, up to open
 * `peek` is always visible (even when closed); `children` collapse away.
 */
export default function CollapsibleSheet({
  children,
  peek,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  className = "",
}: {
  children: ReactNode;
  peek?: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}) {
  const [inner, setInner] = useState(defaultOpen);
  const open = controlledOpen ?? inner;
  const setOpen = (v: boolean) => {
    setInner(v);
    onOpenChange?.(v);
  };

  const startY = useRef<number | null>(null);
  const moved = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    moved.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    const dy = e.clientY - startY.current;
    if (Math.abs(dy) > 24) {
      moved.current = true;
      setOpen(dy < 0); // drag up = open, drag down = close
      startY.current = null;
    }
  };
  const onPointerUp = () => {
    if (startY.current !== null && !moved.current) setOpen(!open); // tap
    startY.current = null;
  };

  return (
    <div
      className={`shrink-0 rounded-t-[28px] bg-white px-5 pb-3 pt-1 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] ${className}`}
    >
      <button
        type="button"
        aria-label={open ? "Close panel" : "Open panel"}
        aria-expanded={open}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (startY.current = null)}
        className="mx-auto flex h-6 w-full touch-none items-center justify-center"
      >
        <span className="h-1 w-10 rounded-full bg-gray-300" />
      </button>

      {peek}

      <div
        className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
      >
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
