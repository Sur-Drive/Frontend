import {
  ChevronRight,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import RideHeader from "../../../components/passenger/ride/RideHeader";

const legalItems = [
  {
    id: "terms",
    title: "Terms & Conditions",
    description: "Read our terms & conditions",
    route: "/passenger/account/legal/terms",
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    description: "Read our Privacy policy",
    route: "/passenger/account/legal/privacy",
  },
];

export default function Legal() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFB]">
      <RideHeader
        title="Legals"
        onBack={() =>
          navigate("/passenger/account")
        }
      />

      <main className="mx-auto w-full max-w-[680px] px-5 pb-12 pt-5 sm:px-7">
        <motion.div
          initial={{
            opacity: 0,
            y: 14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.35,
          }}
          className="overflow-hidden rounded-[18px] bg-white shadow-[0_5px_25px_rgba(31,19,42,0.04)]"
        >
          {legalItems.map(
            (
              {
                id,
                title,
                description,
                route,
              },
              index,
            ) => (
              <motion.button
                key={id}
                type="button"
                whileTap={{
                  scale: 0.985,
                }}
                onClick={() =>
                  navigate(route)
                }
                className={`
                  flex min-h-[76px] w-full
                  items-center gap-4
                  px-4 py-3
                  text-left
                  transition-colors
                  hover:bg-[#FAF8FC]

                  ${
                    index !==
                    legalItems.length - 1
                      ? "border-b border-[#F0EDF2]"
                      : ""
                  }
                `}
              >
                <span
                  className="
                    flex h-11 w-11 shrink-0
                    items-center justify-center
                    rounded-[12px]
                    bg-[#F2ECF8]
                    text-[#7442AD]
                  "
                >
                  <FileText
                    size={19}
                    strokeWidth={1.9}
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-[#302B34]">
                    {title}
                  </span>

                  <span className="mt-1 block text-[13px] text-[#96909A]">
                    {description}
                  </span>
                </span>

                <ChevronRight
                  size={19}
                  strokeWidth={1.8}
                  className="shrink-0 text-[#AAA4AE]"
                />
              </motion.button>
            ),
          )}
        </motion.div>
      </main>
    </div>
  );
}