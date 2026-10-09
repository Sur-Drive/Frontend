import { motion } from "framer-motion";
import { backdropMotion, sheetMotion, tapMotion } from "./motion";

/**
 * "Call in-app" / "Call phone" bottom sheet (Figma "call"). The screen behind
 * it is dimmed and blurred like the Figma frame.
 */
export default function CallOptionsSheet({
  onClose,
  onInApp,
  onPhone,
  phoneAvailable,
}: {
  onClose: () => void;
  onInApp: () => void;
  onPhone: () => void;
  phoneAvailable: boolean;
}) {
  return (
    <motion.div
      {...backdropMotion}
      className="font-outfit absolute inset-0 z-50 flex items-end bg-black/20 backdrop-blur-[10px]"
      onClick={onClose}
    >
      <motion.div
        {...sheetMotion}
        className="w-full rounded-t-[30px] bg-white px-6 pb-[max(26px,env(safe-area-inset-bottom))] pt-6"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.button
          type="button"
          {...tapMotion}
          onClick={onInApp}
          className="h-[60px] w-full rounded-full bg-[#6E43A3] text-[16px] font-semibold text-white"
        >
          Call in-app
        </motion.button>
        <motion.button
          type="button"
          whileTap={phoneAvailable ? tapMotion.whileTap : undefined}
          onClick={onPhone}
          disabled={!phoneAvailable}
          className="mt-[11px] h-[60px] w-full rounded-full border border-[#E6E6EA] bg-white text-[16px] font-semibold text-[#5B4A72] shadow-[0_22px_30px_-8px_rgba(110,67,163,0.30)] disabled:opacity-50"
        >
          Call phone
        </motion.button>
        {!phoneAvailable && (
          <p className="mt-2 text-center text-xs text-[#9A96A8]">
            This passenger's phone number isn't available yet.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
