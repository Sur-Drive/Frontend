import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PassengerAuthShellProps {
  children: ReactNode;
  className?: string;
}

export default function PassengerAuthShell({
  children,
  className = "",
}: PassengerAuthShellProps) {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`
        relative
        min-h-[100dvh]
        w-full
        overflow-x-hidden
        bg-white
        ${className}
      `}
    >
      {children}
    </motion.main>
  );
}