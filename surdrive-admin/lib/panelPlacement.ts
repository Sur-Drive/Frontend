// ---------------------------------------------------------------------------
// panelPlacement — pure viewport-overflow math for anchored popovers.
// Decides whether a fixed-size panel should align left/right of its trigger
// (and open up/down) so it never overflows the viewport. Kept dependency-free
// so it can be verified with plain Node checks.
// ---------------------------------------------------------------------------

export type PanelPlacement = { x: 'left' | 'right'; y: 'down' | 'up' };

export type TriggerRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type ViewportSize = { width: number; height: number };

export type PlacementOptions = {
  /** Minimum distance kept from the viewport edge when flipping. */
  gutter: number;
  /** Gap between the trigger and the panel. */
  gap: number;
};

export const DEFAULT_PLACEMENT_OPTIONS: PlacementOptions = { gutter: 16, gap: 8 };

/**
 * Choose the panel alignment for a trigger anchored at `trigger`.
 *
 * - Prefer `left` (panel starts at the trigger's left edge — the natural
 *   placement) when that fits inside the viewport.
 * - Otherwise `right` (panel's right edge aligns with the trigger's right
 *   edge, extending leftward) when THAT fits — this is the fix for triggers
 *   sitting close to the viewport's right edge.
 * - If neither fits (panel capped at ~viewport width), open toward the side
 *   with more free space.
 * - Open upward only when opening downward would overflow the bottom AND
 *   there is genuinely room above; otherwise keep `down`.
 */
export function computePanelPlacement(
  trigger: TriggerRect,
  panel: { width: number; height: number },
  viewport: ViewportSize,
  options: PlacementOptions = DEFAULT_PLACEMENT_OPTIONS,
): PanelPlacement {
  const { gutter, gap } = options;

  const leftFits = trigger.left + panel.width + gutter <= viewport.width;
  const rightFits = trigger.right - panel.width - gutter >= 0;

  let x: PanelPlacement['x'];
  if (leftFits) {
    x = 'left';
  } else if (rightFits) {
    x = 'right';
  } else {
    x = viewport.width - trigger.right >= trigger.left ? 'right' : 'left';
  }

  const overflowsBottom = trigger.bottom + gap + panel.height > viewport.height;
  const fitsAbove = trigger.top - gap - panel.height >= 0;
  const y: PanelPlacement['y'] = overflowsBottom && fitsAbove ? 'up' : 'down';

  return { x, y };
}