import type {
  ReactNode,
} from "react";

import {
  motion,
} from "framer-motion";

import RideHeader from "../ride/RideHeader";

type LegalDocumentProps = {
  title: string;
  children: ReactNode;
};

export default function LegalDocument({
  title,
  children,
}: LegalDocumentProps) {
  return (
    <div className="min-h-[100dvh] bg-[#F8F7FA]">
      {/* HEADER */}

      <div
        className="
          fixed
          inset-x-0
          top-0
          z-[900]
          border-b
          border-[#EEEAF1]
          bg-white/95
          backdrop-blur-xl
        "
      >
        <RideHeader title={title} />
      </div>

      {/* PAGE */}

      <motion.main
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.35,
          ease: "easeOut",
        }}
        className="
          mx-auto
          w-full
          max-w-[760px]
          px-4
          pb-16
          pt-[92px]
          sm:px-6
          sm:pt-[104px]
        "
      >
        {children}
      </motion.main>
    </div>
  );
}

