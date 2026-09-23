import {
  AnimatePresence,
  motion,
} from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function SavedPlaceActionSheet({
  open,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={onClose}
            className="fixed inset-0 z-[1000] bg-black/35 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{
              y: "100%",
            }}
            animate={{
              y: 0,
            }}
            exit={{
              y: "100%",
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="fixed inset-x-0 bottom-0 z-[1100] rounded-t-[28px] bg-white px-5 pb-[calc(18px+env(safe-area-inset-bottom))] pt-4 shadow-[0_-15px_60px_rgba(30,20,40,0.16)]"
          >
            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-[#D8D3DC]" />

            <div className="mx-auto w-full max-w-[640px] space-y-3">
              <motion.button
                type="button"
                whileTap={{
                  scale: 0.98,
                }}
                onClick={onEdit}
                className="h-[56px] w-full rounded-full bg-[#7442AD] text-[15px] font-semibold text-white"
              >
                Edit location
              </motion.button>

              <motion.button
                type="button"
                whileTap={{
                  scale: 0.98,
                }}
                onClick={onDelete}
                className="h-[56px] w-full rounded-full border border-[#EEEAF1] bg-white text-[15px] font-semibold text-[#E12C2C]"
              >
                Delete location
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}