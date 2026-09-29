import {
  motion,
  type HTMLMotionProps,
} from "framer-motion";

interface RideBottomSheetProps
  extends HTMLMotionProps<"section"> {
  children: React.ReactNode;
  className?: string;
}

export default function RideBottomSheet({
  children,
  className = "",
  ...props
}: RideBottomSheetProps) {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 80,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: 60,
      }}
      transition={{
        duration: 0.48,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`
        absolute inset-x-0 bottom-0
        z-[500]
        max-h-[78dvh]
        overflow-y-auto
        rounded-t-[30px]
        bg-white
        px-5
        pb-[calc(24px+env(safe-area-inset-bottom))]
        pt-3
        shadow-[0_-15px_50px_rgba(31,19,42,0.12)]

        sm:px-6

        lg:bottom-8
        lg:left-8
        lg:right-auto
        lg:w-[440px]
        lg:max-h-[calc(100dvh-64px)]
        lg:rounded-[28px]
        lg:shadow-[0_22px_70px_rgba(25,15,40,0.18)]

        ${className}
      `}
      {...props}
    >
      <div
        className="
          mx-auto mb-5 h-1
          w-12 rounded-full
          bg-[#D1CCD5]
          lg:hidden
        "
      />

      {children}
    </motion.section>
  );
}