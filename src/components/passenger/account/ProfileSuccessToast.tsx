import {
  Check,
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ProfileSuccessToast({
  open,
  onClose,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: 20,
          }}
          className="fixed bottom-5 left-1/2 z-[1200] flex w-[calc(100%-40px)] max-w-[440px] -translate-x-1/2 items-center gap-3 rounded-[14px] bg-white px-4 py-3 shadow-[0_12px_40px_rgba(30,20,38,0.18)]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E4F7EA] text-[#35A563]">
            <Check size={16} />
          </span>

          <p className="flex-1 text-[14px] font-medium text-[#302B34]">
            Changes successfully saved
          </p>

          <button
            type="button"
            onClick={onClose}
            className="text-[#817A85]"
          >
            <X size={17} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}