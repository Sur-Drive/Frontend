import {
  AnimatePresence,
  motion,
} from "framer-motion";

interface RideModalSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  maxWidth?: string;
}

export default function RideModalSheet({
  open,
  onClose,
  children,
  title,
  description,
  maxWidth = "520px",
}: RideModalSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="
            fixed inset-0 z-[1400]
            flex items-end justify-center
            bg-[#211927]/35
            backdrop-blur-[2px]

            lg:items-center
            lg:px-5
          "
          onClick={onClose}
        >
          <motion.section
            initial={{
              y: 100,
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: 80,
              opacity: 0,
            }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 28,
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              maxWidth,
            }}
            className="
              max-h-[88dvh]
              w-full overflow-y-auto
              rounded-t-[28px]
              bg-white
              px-5
              pb-[calc(24px+env(safe-area-inset-bottom))]
              pt-3
              shadow-[0_-20px_70px_rgba(20,12,30,0.18)]

              sm:px-6

              lg:rounded-[26px]
              lg:pb-6
            "
          >
            <div
              className="
                mx-auto mb-5
                h-1 w-12
                rounded-full bg-[#D5CFD8]
                lg:hidden
              "
            />

            {(title || description) && (
              <div className="mb-5">
                {title && (
                  <h2 className="text-[21px] font-semibold tracking-[-0.02em] text-[#302B34]">
                    {title}
                  </h2>
                )}

                {description && (
                  <p className="mt-1.5 text-[14px] leading-6 text-[#918B95]">
                    {description}
                  </p>
                )}
              </div>
            )}

            {children}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}