import type { ReactNode } from "react";

/**
 * Keeps every Rider screen at a phone-friendly width.
 * - Phones: fills the screen edge to edge.
 * - Tablets / desktop: centred column (max 480px) so text, buttons and
 *   cards keep the same size and spacing as on a phone instead of stretching.
 */
export default function RiderFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full bg-[#F3F4F6]">
      <div className="relative mx-auto min-h-[100dvh] w-full max-w-[480px] bg-white sm:shadow-[0_0_40px_rgba(0,0,0,0.08)]">
        {children}
      </div>
    </div>
  );
}
