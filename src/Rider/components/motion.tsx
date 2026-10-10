import { motion, type Transition } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Shared animation presets for the Rider screens. They mirror the passenger
 * side (RideModalSheet): dimmed backdrop fades in, the sheet springs up from
 * the bottom, and buttons shrink slightly while pressed.
 */

export const sheetSpring: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 28,
};

/** Spread onto a <motion.div> that is the dimmed backdrop of a sheet. */
export const backdropMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.2 },
};

/** Spread onto a <motion.div> that is the sheet panel itself. */
export const sheetMotion = {
  initial: { y: 100, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: sheetSpring,
};

/** Spread onto a <motion.button> for press feedback. */
export const tapMotion = {
  whileTap: { scale: 0.98 },
};

/** Fade + rise entrance for a page or a block of content. */
export function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {children}
    </motion.div>
  );
}
