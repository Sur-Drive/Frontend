import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, useDragControls, useMotionValue } from "framer-motion";

interface GoogleStyleBottomSheetProps {
    children: React.ReactNode;
    onClose: () => void;
    /**
     * Changes whenever a new place/report is selected — resets the sheet
     * back to its "peek" height, the same way Google Maps snaps back to a
     * compact card whenever you tap a different pin.
     */
    resetKey?: string;
    /** Fraction (0-1) of the available height shown while peeked. */
    peekFraction?: number;
    /** Fraction (0-1) of the available height shown while fully expanded. */
    fullFraction?: number;
    className?: string;
    /**
     * Fires continuously (peek, full, and every point in between while
     * dragging) with how many px of the sheet are currently visible above
     * its bottom anchor — lets a caller keep something like a floating
     * button positioned just above whatever's actually on screen, since
     * the sheet's own DOM height no longer changes when it's just peeked.
     */
    onVisibleHeightChange?: (px: number) => void;
    /**
     * Opens straight to the fully-expanded height instead of peeked, and
     * scrollable immediately. Use for content that's a scrollable list
     * rather than a compact preview card (there's nothing useful to show
     * "peeked" for a list, and it just meant an extra drag-up before the
     * content would scroll at all).
     */
    startExpanded?: boolean;
}

// Matches the 4rem bottom-nav clearance (`bottom-16`) the sheet sits above
// on mobile, so our height math lines up with where it's actually anchored.
const BOTTOM_CLEARANCE_PX = 64;
// Extra travel allowed below the "peek" point — dragging into this range
// (and releasing there) dismisses the sheet, mirroring Google Maps letting
// you swipe its info card all the way away.
const DISMISS_OVERTRAVEL_PX = 140;
const DISMISS_THRESHOLD_PX = 90;
const FLICK_VELOCITY = 500;

/**
 * A bottom sheet that behaves like Google Maps' own place-detail card:
 * opens "peeked" (just enough to see a photo + name), can be dragged up to
 * fill most of the screen, and only then does its content start scrolling.
 * Dragging back down while already scrolled to the top of that content
 * collapses the sheet again instead of doing nothing, and dragging past
 * the peeked height dismisses it entirely. A close (X) button in the
 * handle row is always tappable regardless of drag/scroll state, so
 * closing never depends on getting a swipe gesture right on mobile.
 *
 * On desktop (lg breakpoint) this renders as the existing static floating
 * panel — the drag/peek behavior is a mobile-only pattern.
 */
export default function GoogleStyleBottomSheet({
    children,
    onClose,
    resetKey,
    peekFraction = 0.42,
    fullFraction = 0.9,
    className = "",
    onVisibleHeightChange,
    startExpanded = false,
}: GoogleStyleBottomSheetProps) {
    const [isDesktop, setIsDesktop] = useState(
        () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
    );
    const [heights, setHeights] = useState({ full: 0, peek: 0 });
    const [isExpanded, setIsExpanded] = useState(false);
    const y = useMotionValue(0);
    const dragControls = useDragControls();
    const contentRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const measure = () => {
            const available = window.innerHeight - BOTTOM_CLEARANCE_PX;
            setHeights({
                full: Math.round(available * fullFraction),
                peek: Math.round(available * peekFraction),
            });
        };
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [fullFraction, peekFraction]);

    useEffect(() => {
        const mq = window.matchMedia("(min-width: 1024px)");
        const update = () => setIsDesktop(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    const peekOffset = Math.max(heights.full - heights.peek, 0);

    // Fresh selection — reopen at the peeked height (or fully expanded, for
    // list-style content — see startExpanded), and scroll its content back
    // to the top so a re-expand starts from the beginning again.
    useEffect(() => {
        if (!heights.full) return;
        y.set(startExpanded ? 0 : peekOffset);
        setIsExpanded(startExpanded);
        if (contentRef.current) contentRef.current.scrollTop = 0;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetKey, heights.full, startExpanded]);

    useEffect(() => {
        if (!onVisibleHeightChange || !heights.full) return;
        const report = () => onVisibleHeightChange(Math.max(heights.full - y.get(), 0));
        report();
        return y.on("change", report);
    }, [heights.full, onVisibleHeightChange, y]);

    const snapTo = useCallback(
        (target: "peek" | "full") => {
            const dest = target === "full" ? 0 : peekOffset;
            animate(y, dest, { type: "spring", damping: 30, stiffness: 320 });
            setIsExpanded(target === "full");
        },
        [y, peekOffset],
    );

    const handleDragEnd = (
        _event: unknown,
        info: { velocity: { y: number }; point: { y: number } },
    ) => {
        const current = y.get();

        // Fast downward flick, or dragged well past the peeked height —
        // dismiss, same as swiping the card off Google Maps.
        if (current > peekOffset + DISMISS_THRESHOLD_PX || info.velocity.y > FLICK_VELOCITY * 1.4) {
            onClose();
            return;
        }
        if (info.velocity.y < -FLICK_VELOCITY) {
            snapTo("full");
            return;
        }
        if (info.velocity.y > FLICK_VELOCITY) {
            snapTo("peek");
            return;
        }
        // No decisive flick — settle on whichever snap point is nearer.
        snapTo(current < peekOffset / 2 ? "full" : "peek");
    };

    const startDrag = (e: React.PointerEvent) => {
        dragControls.start(e);
    };

    // The rule Google Maps' sheet uses: a touch on the handle always drags
    // the sheet; a touch on the body only drags the sheet if that body is
    // already scrolled to the top (otherwise it's an ordinary scroll).
    const handleBodyPointerDown = (e: React.PointerEvent) => {
        if (!isExpanded || (contentRef.current?.scrollTop ?? 0) <= 0) {
            startDrag(e);
        }
    };

    if (isDesktop) {
        return (
            <div
                className={`bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[85dvh] overflow-y-auto ${className}`}
            >
                {children}
            </div>
        );
    }

    return (
        <motion.div
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: peekOffset + DISMISS_OVERTRAVEL_PX }}
            dragElastic={{ top: 0, bottom: 0.15 }}
            onDragEnd={handleDragEnd}
            style={{ y, height: heights.full || undefined }}
            className={`flex flex-col bg-white rounded-t-[20px] shadow-[0_-4px_24px_rgba(0,0,0,0.12)] overflow-hidden ${className}`}
        >
            <div
                onPointerDown={startDrag}
                className="flex justify-center pt-2.5 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
            >
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div
                ref={contentRef}
                onPointerDown={handleBodyPointerDown}
                className={`flex-1 min-h-0 overscroll-contain ${
                    isExpanded ? "overflow-y-auto" : "overflow-hidden"
                }`}
                style={{ touchAction: isExpanded ? "pan-y" : "none" }}
            >
                {children}
            </div>
        </motion.div>
    );
}
