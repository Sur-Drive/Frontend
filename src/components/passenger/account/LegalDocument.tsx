import { motion } from "framer-motion";

import RideHeader from "../ride/RideHeader";

type LegalDocumentProps = {
  title: string;
  children: React.ReactNode;
};

export default function LegalDocument({
  title,
  children,
}: LegalDocumentProps) {
  return (
    <div className="min-h-[100dvh] bg-white">
      {/* FIXED HEADER */}
      <div className="fixed inset-x-0 top-0 z-[900] bg-white">
        <RideHeader title={title} />
      </div>

      {/* DOCUMENT */}
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
        }}
        className="
          mx-auto w-full max-w-[680px]
          px-5
          pb-16
          pt-[96px]
          sm:px-7
        "
      >
        {children}
      </motion.main>
    </div>
  );
}